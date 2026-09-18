// Optimize raster images under public/ in place, preserving filenames and
// extensions so existing references (e.g. "/public/map/Foo.jpg") keep working.
//
// What it does, per file under public/:
//   - .jpg/.jpeg/.png : if wider than MAX_WIDTH, downscale to MAX_WIDTH and
//                       re-encode; otherwise re-encode at quality if it saves
//                       meaningful bytes. Format is preserved (jpg stays jpg).
//   - everything else (.svg, .gif, .webp, ...) : left untouched.
//
// Idempotent-ish: images already at/below MAX_WIDTH are only re-encoded when
// that yields a real size reduction, and the re-encode is skipped if the
// result isn't at least MIN_SAVING_RATIO smaller. So repeated CI runs on an
// already-optimized tree do (almost) no work and don't progressively degrade.
//
// Intended to run in CI on a fresh checkout (originals in the repo stay full
// quality; only the deployed artifact is optimized), but it's safe to run
// locally too.
//
// Usage (from kevin_react/):  node scripts/optimize-public-images.mjs

import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const MAX_WIDTH = 1600;        // cap on the longest horizontal dimension
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;        // used by sharp's palette/quantization path
const MIN_SAVING_RATIO = 0.05; // only rewrite if we save at least 5%

const JPEG_EXT = new Set(['.jpg', '.jpeg']);
const PNG_EXT = new Set(['.png']);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
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

async function optimizeFile(file) {
  const ext = path.extname(file).toLowerCase();
  const isJpeg = JPEG_EXT.has(ext);
  const isPng = PNG_EXT.has(ext);
  if (!isJpeg && !isPng) return { status: 'skip', reason: ext || 'no-ext' };

  const input = await readFile(file);
  const before = input.length;

  let pipeline = sharp(input, { failOn: 'error' });
  const meta = await pipeline.metadata();

  if ((meta.width ?? 0) > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  if (isJpeg) {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  } else {
    // Keep PNG as PNG; compressionLevel + quality drive size for palette PNGs.
    pipeline = pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9, effort: 7 });
  }

  const output = await pipeline.toBuffer();
  const after = output.length;

  // Only write if we actually saved a meaningful amount. This keeps the step
  // idempotent: a re-run on an already-optimized file saves ~nothing and is
  // left alone.
  if (after >= before * (1 - MIN_SAVING_RATIO)) {
    return { status: 'kept', before, after };
  }

  await writeFile(file, output);
  return { status: 'optimized', before, after, resized: (meta.width ?? 0) > MAX_WIDTH };
}

async function main() {
  let optimizedCount = 0;
  let keptCount = 0;
  let skipCount = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  try {
    await stat(PUBLIC_DIR);
  } catch {
    console.log(`No public/ directory at ${PUBLIC_DIR} — nothing to do.`);
    return;
  }

  for await (const file of walk(PUBLIC_DIR)) {
    const rel = path.relative(PUBLIC_DIR, file);
    try {
      const res = await optimizeFile(file);
      if (res.status === 'optimized') {
        optimizedCount++;
        bytesBefore += res.before;
        bytesAfter += res.after;
        console.log(
          `opt   ${rel}  ${fmtKB(res.before)} -> ${fmtKB(res.after)}${res.resized ? ' (resized)' : ''}`
        );
      } else if (res.status === 'kept') {
        keptCount++;
        bytesBefore += res.before;
        bytesAfter += res.after > res.before ? res.before : res.after;
      } else {
        skipCount++;
      }
    } catch (err) {
      // Don't fail the whole build over one bad image; log and continue.
      console.warn(`warn  ${rel}: ${err.message}`);
      skipCount++;
    }
  }

  const saved = bytesBefore - bytesAfter;
  console.log(
    `\nDone. optimized=${optimizedCount} kept=${keptCount} skipped(non-raster)=${skipCount}` +
      (optimizedCount > 0
        ? `  saved ~${fmtKB(saved)} (${((saved / bytesBefore) * 100).toFixed(0)}%)`
        : '')
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
