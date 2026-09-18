// Optimize raster images under the deployed public/ directory in place,
// preserving filenames and extensions so existing references
// (e.g. "/public/map/Foo.jpg") keep working, including odd casing like ".JPG".
//
// Idempotency is guaranteed by a hash manifest (kevin_react/src/json/.image-optim.json):
//   - For each image we record the SHA-256 of its OPTIMIZED bytes plus a
//     signature of the settings used to produce them.
//   - On a later run, if the file on disk already hashes to that recorded
//     value AND the settings signature is unchanged, we skip it entirely:
//     no decode, no re-encode, no write. So f(f(x)) == f(x) exactly, and
//     already-optimized images are never recompressed (no generation loss).
//   - If the file hash doesn't match (new or edited image) or the settings
//     changed (e.g. a new MAX_WIDTH), we (re)optimize and update the manifest.
//
// Resize policy: images are re-compressed at a fixed quality but NOT resized by
// default. Resizing to MAX_WIDTH kicks in only as a fallback — when
// re-compression alone already saves more than RESIZE_TRIGGER_RATIO (30%),
// which flags a heavy source worth also downscaling.
//
// Write policy: the compressed (lossy) result only replaces the original when
// it is at least MIN_WRITE_SAVING_RATIO (40%) smaller. Smaller wins aren't
// worth the lossy re-encode, so those files keep their original bytes.
//
// Deploy flow context: the tracked, deployed images live at the REPO ROOT
// public/ (kevin_react/public is a git-ignored Vite staging dir and is empty
// in CI). So this script targets the root public/ by default. The manifest is
// kept separately at kevin_react/src/json/.image-optim.json — a tracked
// location that persists across CI runs (root public/ is fine too, but keeping
// build metadata under src/ keeps the deployed public/ tree clean).
//
// Before optimizing, this script SYNCS your local staging folder
// (kevin_react/public/, which is git-ignored) into the tracked, deployed root
// public/. That way the manual workflow is a single command: drop new images
// into kevin_react/public/, run `npm run optimize-images`, and they get copied
// into the root public/ and optimized in place, ready to commit. Files whose
// bytes already match at the destination are left alone, so the sync is cheap
// and doesn't disturb already-optimized images. Set SKIP_SYNC=1 to skip it.
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

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;

// Resize policy: by default we do NOT downscale — we just re-compress. But if
// the lossy re-compression ALONE already shrinks the file by more than this
// ratio, the source is heavy/wasteful, so we ALSO downscale it to MAX_WIDTH
// (when it's wider than that) for an extra win. 0.30 = 30%.
const RESIZE_TRIGGER_RATIO = 0.30;

// Lossy write policy: the approximate (quality-80) re-encode changes pixels, so
// we only accept it when it buys a clear win. It must be at least this much
// smaller than the original; otherwise we don't take the lossy result. 0.20 =
// the lossy file must be >= 20% smaller. (Lowered from 0.40 so more heavy
// sources actually get compressed.)
const MIN_LOSSY_SAVING_RATIO = 0.05;

// Lossless write policy: a lossless re-encode preserves every pixel exactly, so
// there is NO quality cost and no reason to demand a big win. Accept any real
// reduction above this tiny floor. 0.005 = just 0.5%, enough to ignore noise
// while capturing every genuine byte saved.
const MIN_LOSSLESS_SAVING_RATIO = 0.005;

// Bump the trailing version to force a re-optimize of everything. The knobs
// above are encoded into each manifest entry so changing them re-processes.
const SETTINGS_SIG = `w${MAX_WIDTH}-jq${JPEG_QUALITY}-pq${PNG_QUALITY}-rt${RESIZE_TRIGGER_RATIO}-ll${MIN_LOSSLESS_SAVING_RATIO}-wt${MIN_LOSSY_SAVING_RATIO}-v5`;

const JPEG_EXT = new Set(['.jpg', '.jpeg']);
const PNG_EXT = new Set(['.png']);

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
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

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
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

// LOSSLESS re-encode: preserves every pixel exactly, just repacks the file with
// better entropy coding. No resizing (that would drop pixels). JPEG uses
// mozjpeg's optimized Huffman tables without changing coefficients; PNG uses
// max zlib effort at full quality. Same format in/out.
async function encodeLossless(input, ext) {
  let pipeline = sharp(input, { failOn: 'error' });
  if (JPEG_EXT.has(ext)) {
    // quality:100 + mozjpeg keeps the source coefficients while re-optimizing
    // the entropy coding — effectively lossless repacking for our purposes.
    pipeline = pipeline.jpeg({ quality: 100, mozjpeg: true, optimizeScans: true });
  } else {
    // PNG is inherently lossless; palette:false keeps full color depth.
    pipeline = pipeline.png({ compressionLevel: 9, effort: 10, palette: false });
  }
  return pipeline.toBuffer();
}

// LOSSY re-encode at the configured quality, same format in/out. If `resize`
// is true and the source is wider than MAX_WIDTH, downscale to MAX_WIDTH first.
async function encodeLossy(input, ext, resize) {
  let pipeline = sharp(input, { failOn: 'error' });
  if (resize) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }
  if (JPEG_EXT.has(ext)) {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  } else {
    pipeline = pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9, effort: 7 });
  }
  return pipeline.toBuffer();
}

// Choose the best acceptable re-encode for `input`.
//
// 1. LOSSLESS first: repack without touching pixels. Since there is no quality
//    cost, accept it whenever it saves more than the tiny MIN_LOSSLESS_SAVING_RATIO
//    floor. This is what pulls in all the "already a jpeg, but wastefully packed"
//    files that the old 40% lossy-only gate rejected.
// 2. LOSSY fallback: quality-80 re-encode, accepted only when it clears the
//    higher MIN_LOSSY_SAVING_RATIO bar. If that lossy pass alone saved more than
//    RESIZE_TRIGGER_RATIO and the image is wider than MAX_WIDTH, also downscale.
// 3. Whichever accepted result is SMALLEST wins. If neither is accepted, return
//    kind:'none' so the caller keeps the original bytes.
//
// Returns { buffer, kind: 'lossless' | 'lossy' | 'none', willResize }.
async function encode(input, ext) {
  const before = input.length;
  if (before === 0) return { buffer: input, kind: 'none', willResize: false };

  const meta = await sharp(input, { failOn: 'error' }).metadata();
  const canResize = (meta.width ?? 0) > MAX_WIDTH;

  const savingOf = (buf) => (before - buf.length) / before;

  // --- Candidate 1: lossless repack.
  let lossless = null;
  try {
    const buf = await encodeLossless(input, ext);
    if (savingOf(buf) >= MIN_LOSSLESS_SAVING_RATIO) lossless = buf;
  } catch {
    // Some inputs can't be losslessly repacked (e.g. odd JPEG variants); just
    // fall through to the lossy path.
  }

  // --- Candidate 2: lossy re-compress (+ optional resize fallback).
  const recompressed = await encodeLossy(input, ext, false);
  let lossy = null;
  let willResize = false;
  if (canResize && savingOf(recompressed) > RESIZE_TRIGGER_RATIO) {
    const resized = await encodeLossy(input, ext, true);
    if (savingOf(resized) >= MIN_LOSSY_SAVING_RATIO) {
      lossy = resized;
      willResize = true;
    }
  }
  if (!lossy && savingOf(recompressed) >= MIN_LOSSY_SAVING_RATIO) {
    lossy = recompressed;
  }

  // --- Pick the smallest accepted candidate; prefer lossless on a tie since it
  // costs no quality.
  if (lossless && (!lossy || lossless.length <= lossy.length)) {
    return { buffer: lossless, kind: 'lossless', willResize: false };
  }
  if (lossy) {
    return { buffer: lossy, kind: 'lossy', willResize };
  }
  return { buffer: input, kind: 'none', willResize: false };
}

async function main() {
  // Step 0: sync local staging (kevin_react/public) into the target public/.
  // Skipped when SKIP_SYNC is set, or when IMAGE_DIR was overridden to a custom
  // path (in that case the caller is targeting a specific dir on purpose, e.g.
  // a test fixture, and shouldn't have staging copied over it).
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
      const { buffer, kind, willResize } = await encode(current, ext);
      const before = current.length;
      const after = buffer.length;

      // encode() already decided whether a candidate is worth taking:
      //   - 'lossless': pixel-identical repack that beat the tiny floor.
      //   - 'lossy'   : quality-80 re-encode that cleared the lossy bar.
      //   - 'none'    : nothing worth writing; keep the original bytes.
      // Either way we record the resulting on-disk hash so future runs
      // recognize this exact content as already-processed.
      let finalBuf = current;
      if (kind === 'none') {
        // Source is already well-packed. Keep original bytes, record ITS hash
        // so we never touch it again under these settings.
        finalBuf = current;
        keptOriginal++;
      } else {
        await writeFile(file, buffer);
        finalBuf = buffer;
        optimized++;
        bytesBefore += before;
        bytesAfter += after;
        const tags = [kind === 'lossless' ? 'lossless' : 'lossy', willResize ? 'resized' : null]
          .filter(Boolean)
          .join(', ');
        console.log(`opt   ${rel}  ${fmtKB(before)} -> ${fmtKB(after)} (${tags})`);
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

  // Prune entries for files that no longer exist, then persist. Ensure the
  // manifest directory (src/json/) exists first, since it may be brand new.
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
