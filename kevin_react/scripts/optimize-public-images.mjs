// Optimize raster images (JPEG/PNG) under the deployed public/ directory in
// place, preserving filenames and extensions so existing references
// (e.g. "/public/map/Foo.jpg", including odd casing like ".JPG") keep working.
//
// FLOW (per image), kept deliberately simple:
//   1. Try LOSSLESS compression. If it produces a smaller file, store it. Done.
//   2. If lossless didn't win, try LOSSY compression. Accept it only when it
//      saves at least MIN_LOSSY_SAVING_RATIO (10%) — a big enough win to be
//      worth the quality hit.
//   3. Otherwise keep the original bytes untouched.
//
// There is no resize policy: we never change image dimensions, only how the
// pixels are packed (lossless) or re-encoded (lossy).
//
// WHY THE OLD "LOSSLESS" STEP KEPT FAILING (esp. for JPEGs):
//   sharp has no true lossless JPEG transform. `sharp().jpeg({quality:100})`
//   fully DECODES the JPEG to raw pixels and RE-ENCODES it. Because the source
//   was already lossy-compressed at a lower quality, re-encoding at quality 100
//   almost always produces a LARGER file, so the "saving" check never passed —
//   the lossless step looked broken. It was also not actually lossless, since
//   it re-quantizes the pixels.
//
//   So we only treat a format as losslessly optimizable when sharp can truly
//   preserve every pixel: that is PNG (sharp's PNG encoder is lossless). For
//   JPEG there is no dependency-free lossless repack available through sharp,
//   so the lossless step simply reports "no win" and the flow falls through to
//   the lossy path — which is exactly the intended behavior.
//
// IDEMPOTENCY: a manifest (kevin_react/src/json/.image-optim.json) records the
// SHA-256 of each optimized file plus a settings signature. If a file already
// hashes to that value under the same settings, it is skipped entirely — no
// decode, no re-encode, no write — so running twice is a no-op.
//
// DEPLOY FLOW: the tracked, deployed images live at the REPO ROOT public/
// (kevin_react/public is a git-ignored Vite staging dir). Before optimizing,
// this script SYNCS kevin_react/public/ into the root public/ so the manual
// workflow is one command: drop new images into kevin_react/public/, run
// `npm run optimize-images`, and they land in root public/ optimized and ready
// to commit. Set SKIP_SYNC=1 to skip the sync.
//
// Usage (from kevin_react/):  node scripts/optimize-public-images.mjs
// Override the target dir:    IMAGE_DIR=/some/path node scripts/optimize-public-images.mjs
// Skip the staging sync:      SKIP_SYNC=1 node scripts/optimize-public-images.mjs

import { readdir, stat, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Layout: this script lives in kevin_react/scripts/. kevin_react/ is one level
// below the repo root.
const KEVIN_REACT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(KEVIN_REACT, '..');

// Default target: repo-root public/ (the tracked, deployed images).
const IMAGE_DIR = process.env.IMAGE_DIR
  ? path.resolve(process.env.IMAGE_DIR)
  : path.join(REPO_ROOT, 'public');

// Local staging folder (git-ignored) that gets synced into IMAGE_DIR first.
const STAGING_DIR = path.join(KEVIN_REACT, 'public');

// Manifest lives under src/json/ (tracked), separate from the images.
const MANIFEST_PATH = path.join(KEVIN_REACT, 'src', 'json', '.image-optim.json');

// Lossy re-encode quality (JPEG + PNG).
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;

// A lossless repack costs no quality, so accept it on any real reduction above
// this tiny floor (ignore sub-0.5% noise).
const MIN_LOSSLESS_SAVING_RATIO = 0.005;

// A lossy re-encode changes pixels, so only accept it when the win is clearly
// worth the quality hit: at least 10% smaller.
const MIN_LOSSY_SAVING_RATIO = 0.10;

// Bump the trailing version to force a re-optimize of everything. The knobs
// above are baked in so changing any of them re-processes affected files.
const SETTINGS_SIG = `jq${JPEG_QUALITY}-pq${PNG_QUALITY}-ll${MIN_LOSSLESS_SAVING_RATIO}-ly${MIN_LOSSY_SAVING_RATIO}-v6`;

const JPEG_EXT = new Set(['.jpg', '.jpeg']);
const PNG_EXT = new Set(['.png']);

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.image-optim.json') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

// True if src and dst are byte-identical (so we can skip copying unchanged files).
async function sameBytes(src, dst) {
  try {
    const [a, b] = await Promise.all([readFile(src), readFile(dst)]);
    return a.length === b.length && a.equals(b);
  } catch {
    return false; // dst missing (or unreadable) => treat as different
  }
}

// Copy every file from STAGING_DIR into destDir, preserving subpaths. Only
// writes files that are new or whose bytes differ. Returns how many it copied.
async function syncStagingInto(destDir) {
  try {
    await stat(STAGING_DIR);
  } catch {
    return { copied: 0, present: false }; // no staging dir => nothing to sync
  }

  let copied = 0;
  for await (const src of walk(STAGING_DIR)) {
    const rel = path.relative(STAGING_DIR, src);
    const dst = path.join(destDir, rel);
    if (await sameBytes(src, dst)) continue;
    await mkdir(path.dirname(dst), { recursive: true });
    await copyFile(src, dst);
    copied++;
    console.log(`sync  ${rel.split(path.sep).join('/')}`);
  }
  return { copied, present: true };
}

async function loadManifest() {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.entries ? parsed : { entries: {} };
  } catch {
    return { entries: {} };
  }
}

// LOSSLESS repack: preserve every pixel exactly, just pack the bytes better.
//   - PNG: sharp's PNG encoder is lossless; max effort/compression squeezes
//     poorly-packed sources without touching a single pixel.
//   - JPEG: sharp cannot repack a JPEG losslessly (any encode re-quantizes the
//     pixels), so there is no honest lossless candidate. Return null and let
//     the lossy path handle it.
// Returns a Buffer, or null when no lossless option exists for this format.
async function encodeLossless(input, ext) {
  if (PNG_EXT.has(ext)) {
    return sharp(input, { failOn: 'error' })
      .png({ compressionLevel: 9, effort: 10, palette: false })
      .toBuffer();
  }
  return null; // no true lossless path for JPEG via sharp
}

// LOSSY re-encode at the configured quality, same format in/out. Dimensions
// are never changed.
async function encodeLossy(input, ext) {
  const pipeline = sharp(input, { failOn: 'error' });
  if (JPEG_EXT.has(ext)) {
    return pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  }
  return pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9, effort: 7 }).toBuffer();
}

// Apply the flow to one image's bytes.
//   1. Try lossless -> if it shrinks the file past the tiny floor, take it.
//   2. Else try lossy -> take it only if it saves >= MIN_LOSSY_SAVING_RATIO.
//   3. Else keep the original.
// Returns { buffer, kind: 'lossless' | 'lossy' | 'none' }.
async function encode(input, ext) {
  const before = input.length;
  if (before === 0) return { buffer: input, kind: 'none' };

  const savingOf = (buf) => (before - buf.length) / before;

  // --- Step 1: lossless.
  try {
    const buf = await encodeLossless(input, ext);
    if (buf && savingOf(buf) >= MIN_LOSSLESS_SAVING_RATIO) {
      return { buffer: buf, kind: 'lossless' };
    }
  } catch {
    // Lossless failed for this input; fall through to lossy.
  }

  // --- Step 2: lossy.
  try {
    const buf = await encodeLossy(input, ext);
    if (savingOf(buf) >= MIN_LOSSY_SAVING_RATIO) {
      return { buffer: buf, kind: 'lossy' };
    }
  } catch {
    // Lossy failed too; keep the original.
  }

  // --- Step 3: nothing worth writing.
  return { buffer: input, kind: 'none' };
}

async function main() {
  // Step 0: sync local staging (kevin_react/public) into the target public/.
  // Skipped when SKIP_SYNC is set, or when IMAGE_DIR was overridden (the caller
  // is targeting a specific dir on purpose, e.g. a test fixture).
  const isDefaultTarget = !process.env.IMAGE_DIR;
  if (!process.env.SKIP_SYNC && isDefaultTarget) {
    const { copied, present } = await syncStagingInto(IMAGE_DIR);
    if (!present) {
      console.log(`No staging dir at ${path.relative(REPO_ROOT, STAGING_DIR)} — skipping sync.`);
    } else if (copied === 0) {
      console.log('Staging in sync with public/ — nothing new to copy.');
    } else {
      console.log(`Synced ${copied} file(s) from staging into public/.\n`);
    }
  }

  try {
    await stat(IMAGE_DIR);
  } catch {
    console.log(`No image directory at ${IMAGE_DIR} — nothing to do.`);
    return;
  }

  const manifest = await loadManifest();
  const nextEntries = {};

  let optimized = 0;
  let skipped = 0;      // already optimal per manifest
  let keptOriginal = 0; // evaluated this run, but no candidate beat the source
  let nonRaster = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  for await (const file of walk(IMAGE_DIR)) {
    const rel = path.relative(IMAGE_DIR, file).split(path.sep).join('/');
    const ext = path.extname(file).toLowerCase();

    if (!JPEG_EXT.has(ext) && !PNG_EXT.has(ext)) {
      nonRaster++;
      continue; // svg/gif/webp/pdf/etc left untouched, not tracked in manifest
    }

    const current = await readFile(file);
    const currentHash = sha256(current);

    const prev = manifest.entries[rel];
    // Strict idempotency: if the file already IS our recorded optimized output
    // and settings are unchanged, do nothing at all.
    if (prev && prev.outputHash === currentHash && prev.settingsSig === SETTINGS_SIG) {
      nextEntries[rel] = prev;
      skipped++;
      continue;
    }

    try {
      const { buffer, kind } = await encode(current, ext);
      const before = current.length;
      const after = buffer.length;

      let finalBuf = current;
      if (kind === 'none') {
        // Already well-packed. Keep original bytes, record ITS hash so we never
        // reprocess it under these settings.
        keptOriginal++;
      } else {
        await writeFile(file, buffer);
        finalBuf = buffer;
        optimized++;
        bytesBefore += before;
        bytesAfter += after;
        console.log(`opt   ${rel}  ${fmtKB(before)} -> ${fmtKB(after)} (${kind})`);
      }

      nextEntries[rel] = {
        outputHash: sha256(finalBuf),
        settingsSig: SETTINGS_SIG,
      };
    } catch (err) {
      console.warn(`warn  ${rel}: ${err.message}`);
      // Preserve any prior entry so a transient failure doesn't force redo loops.
      if (prev) nextEntries[rel] = prev;
      nonRaster++;
    }
  }

  // Persist manifest (pruning entries for files that no longer exist by only
  // writing nextEntries). Ensure src/json/ exists first.
  const manifestOut = {
    settingsSig: SETTINGS_SIG,
    updatedAt: new Date().toISOString(),
    entries: nextEntries,
  };
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifestOut, null, 2) + '\n');

  const saved = bytesBefore - bytesAfter;
  console.log(
    `\nDone. optimized=${optimized} kept-original(no-win)=${keptOriginal} skipped(idempotent)=${skipped} untouched(non-raster)=${nonRaster}` +
      (optimized > 0 ? `  saved ~${fmtKB(saved)} (${((saved / bytesBefore) * 100).toFixed(0)}%)` : '') +
      `\nManifest: ${path.relative(REPO_ROOT, MANIFEST_PATH)}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
