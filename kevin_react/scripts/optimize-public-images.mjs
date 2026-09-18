// Optimize raster images under the deployed public/ directory in place,
// preserving filenames and extensions so existing references
// (e.g. "/public/map/Foo.jpg") keep working, including odd casing like ".JPG".
//
// Idempotency is guaranteed by a hash manifest (public/.image-optim.json):
//   - For each image we record the SHA-256 of its OPTIMIZED bytes plus a
//     signature of the settings used to produce them.
//   - On a later run, if the file on disk already hashes to that recorded
//     value AND the settings signature is unchanged, we skip it entirely:
//     no decode, no re-encode, no write. So f(f(x)) == f(x) exactly, and
//     already-optimized images are never recompressed (no generation loss).
//   - If the file hash doesn't match (new or edited image) or the settings
//     changed (e.g. a new MAX_WIDTH), we (re)optimize and update the manifest.
//
// Deploy flow context: the tracked, deployed images live at the REPO ROOT
// public/ (kevin_react/public is a git-ignored Vite staging dir and is empty
// in CI). So this script targets the root public/ by default, and the manifest
// lives there too — a tracked location, so it persists across CI runs.
//
// Usage (from kevin_react/):  node scripts/optimize-public-images.mjs
// Override the target dir:    IMAGE_DIR=/some/path node scripts/optimize-public-images.mjs

import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default target: repo-root public/. kevin_react/ is one level below the root.
const REPO_ROOT = path.resolve(__dirname, '../..');
const IMAGE_DIR = process.env.IMAGE_DIR
  ? path.resolve(process.env.IMAGE_DIR)
  : path.join(REPO_ROOT, 'public');
const MANIFEST_PATH = path.join(IMAGE_DIR, '.image-optim.json');

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;

// Bump this (or it changes automatically with the knobs above) to force a
// re-optimize of everything. Encoded into each manifest entry.
const SETTINGS_SIG = `w${MAX_WIDTH}-jq${JPEG_QUALITY}-pq${PNG_QUALITY}-v1`;

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

async function loadManifest() {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.entries ? parsed : { entries: {} };
  } catch {
    return { entries: {} };
  }
}

// Produce the optimized buffer for a raster file (same format in, same out).
async function encode(input, ext) {
  let pipeline = sharp(input, { failOn: 'error' });
  const meta = await pipeline.metadata();
  const willResize = (meta.width ?? 0) > MAX_WIDTH;
  if (willResize) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }
  if (JPEG_EXT.has(ext)) {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  } else {
    pipeline = pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9, effort: 7 });
  }
  return { buffer: await pipeline.toBuffer(), willResize };
}

async function main() {
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
      const { buffer, willResize } = await encode(current, ext);
      const before = current.length;
      const after = buffer.length;

      // Write only if it helps; but always record the resulting on-disk hash so
      // future runs recognize this exact content as already-processed.
      let finalBuf = buffer;
      if (after >= before) {
        // Optimized output is not smaller (already well-compressed source).
        // Keep the original bytes on disk, but record ITS hash as the output so
        // we never touch it again under these settings.
        finalBuf = current;
      } else {
        await writeFile(file, buffer);
        optimized++;
        bytesBefore += before;
        bytesAfter += after;
        console.log(`opt   ${rel}  ${fmtKB(before)} -> ${fmtKB(after)}${willResize ? ' (resized)' : ''}`);
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

  // Prune entries for files that no longer exist, then persist.
  const manifestOut = {
    settingsSig: SETTINGS_SIG,
    updatedAt: new Date().toISOString(),
    entries: nextEntries,
  };
  await writeFile(MANIFEST_PATH, JSON.stringify(manifestOut, null, 2) + '\n');

  const saved = bytesBefore - bytesAfter;
  console.log(
    `\nDone. optimized=${optimized} skipped(idempotent)=${skipped} untouched(non-raster)=${nonRaster}` +
      (optimized > 0 ? `  saved ~${fmtKB(saved)} (${((saved / bytesBefore) * 100).toFixed(0)}%)` : '') +
      `\nManifest: ${path.relative(REPO_ROOT, MANIFEST_PATH)}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
