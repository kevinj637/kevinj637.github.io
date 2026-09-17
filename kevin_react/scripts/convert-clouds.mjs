// One-off / re-runnable script to convert the raster-in-SVG background clouds
// into optimized WebP files.
//
// Each src/assets/clouds/cloudN.svg is really an SVG wrapper around a single
// base64-encoded PNG, which makes them ~260 KB each. This script extracts the
// embedded PNG, resizes it to roughly the size it actually renders at (2x the
// CSS width for retina, never upscaling beyond the source), and writes a WebP
// with the alpha channel preserved.
//
// Usage (from kevin_react/):  node scripts/convert-clouds.mjs

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLOUDS_DIR = path.resolve(__dirname, '../src/assets/clouds');

// CSS render widths (px) from src/styles/bg-clouds.css. Used to pick a sane
// output resolution. Clouds not listed fall back to DEFAULT_WIDTH.
const CSS_WIDTHS = {
  cloud1: 242,
  cloud2: 427,
  cloud3: 156,
  cloud4: 164,
  cloud5: 329,
  cloud6: 353,
  cloud7: 139,
  cloud8: 308,
  cloud9: 312,
  cloud10: 320,
};
const DEFAULT_WIDTH = 320;
const RETINA_SCALE = 2;
const WEBP_QUALITY = 80;

// Pull the data URI payload out of an <image href="data:image/png;base64,...">.
function extractEmbeddedRaster(svg) {
  const match = svg.match(/href="data:image\/(png|jpeg|jpg|webp);base64,([^"]+)"/i);
  if (!match) return null;
  return Buffer.from(match[2], 'base64');
}

async function main() {
  const files = (await readdir(CLOUDS_DIR)).filter((f) => /^cloud.*\.svg$/i.test(f));
  if (files.length === 0) {
    console.error(`No cloud SVGs found in ${CLOUDS_DIR}`);
    process.exit(1);
  }

  let converted = 0;
  let skipped = 0;

  for (const file of files.sort()) {
    const name = path.basename(file, '.svg'); // e.g. "cloud1"
    const svgPath = path.join(CLOUDS_DIR, file);
    const svg = await readFile(svgPath, 'utf8');

    const raster = extractEmbeddedRaster(svg);
    if (!raster) {
      console.log(`skip   ${file} (no embedded base64 raster — likely real vector)`);
      skipped++;
      continue;
    }

    const targetWidth = (CSS_WIDTHS[name] ?? DEFAULT_WIDTH) * RETINA_SCALE;

    const image = sharp(raster);
    const meta = await image.metadata();
    // Never upscale beyond the source width.
    const width = Math.min(targetWidth, meta.width ?? targetWidth);

    const outPath = path.join(CLOUDS_DIR, `${name}.webp`);
    await image
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, alphaQuality: 90 })
      .toFile(outPath);

    converted++;
    console.log(
      `ok     ${file} -> ${name}.webp  (src ${meta.width}px -> out ${width}px)`
    );
  }

  console.log(`\nDone. Converted ${converted}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
