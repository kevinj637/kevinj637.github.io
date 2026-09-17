// One-off / re-runnable script to convert the raster-in-SVG background clouds
// into optimized WebP files.
//
// Each src/assets/clouds/cloudN.svg is an SVG wrapper around a single big
// base64-encoded PNG (a 2083x2083 "sprite sheet"). Crucially, each SVG does
// NOT show the whole PNG: its viewBox is a small window, and the <image> is
// placed at a negative (x, y) offset so only one cloud from the sheet is
// visible. So converting correctly means CROPPING the raster to the SVG's
// visible window first, then resizing — not just shrinking the whole sheet.
//
// Given:
//   <svg viewBox="0 0 VBW VBH">
//     <image x="IX" y="IY" width="IW" height="IH" href="data:image/png;base64,...">
// The visible region in SVG user units is the rectangle:
//   left = -IX, top = -IY, width = VBW, height = VBH
// The embedded PNG's real pixel dimensions may differ from IW/IH, so we scale
// the crop rectangle by (realPixelWidth / IW) before extracting.
//
// Usage (from kevin_react/):  node scripts/convert-clouds.mjs

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLOUDS_DIR = path.resolve(__dirname, '../src/assets/clouds');

// CSS render widths (px) from the stylesheets. Used to pick a sane output
// resolution. Clouds not listed fall back to DEFAULT_WIDTH.
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

function num(str, attr) {
  const m = str.match(new RegExp(`\\b${attr}="([-\\d.]+)"`));
  return m ? parseFloat(m[1]) : null;
}

// Parse the viewBox and <image> geometry that define the visible crop window.
function parseGeometry(svg) {
  const vbMatch = svg.match(/viewBox="([-\d.\s]+)"/);
  if (!vbMatch) return null;
  const [, , vbW, vbH] = vbMatch[1].trim().split(/\s+/).map(Number);

  const imgTag = svg.match(/<image[\s\S]*?>/i);
  if (!imgTag) return null;
  const tag = imgTag[0];

  const ix = num(tag, 'x') ?? 0;
  const iy = num(tag, 'y') ?? 0;
  const iw = num(tag, 'width');
  const ih = num(tag, 'height');
  if (!iw || !ih) return null;

  return { vbW, vbH, ix, iy, iw, ih };
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
    const svg = await readFile(path.join(CLOUDS_DIR, file), 'utf8');

    const raster = extractEmbeddedRaster(svg);
    if (!raster) {
      console.log(`skip   ${file} (no embedded base64 raster — likely real vector)`);
      skipped++;
      continue;
    }

    const geo = parseGeometry(svg);
    if (!geo) {
      console.log(`skip   ${file} (could not parse viewBox/image geometry)`);
      skipped++;
      continue;
    }

    const meta = await sharp(raster).metadata();
    const realW = meta.width;
    const realH = meta.height;

    // Map SVG user units -> real PNG pixels. The <image width/height> declares
    // the raster's size in user units; the actual PNG may be scaled from that.
    const scaleX = realW / geo.iw;
    const scaleY = realH / geo.ih;

    // Visible window in SVG user units: top-left at (-ix, -iy), size vbW x vbH.
    // Convert to raster pixels and clamp to the image bounds.
    let cropLeft = Math.round(-geo.ix * scaleX);
    let cropTop = Math.round(-geo.iy * scaleY);
    let cropW = Math.round(geo.vbW * scaleX);
    let cropH = Math.round(geo.vbH * scaleY);

    cropLeft = Math.max(0, Math.min(cropLeft, realW - 1));
    cropTop = Math.max(0, Math.min(cropTop, realH - 1));
    cropW = Math.max(1, Math.min(cropW, realW - cropLeft));
    cropH = Math.max(1, Math.min(cropH, realH - cropTop));

    const targetWidth = (CSS_WIDTHS[name] ?? DEFAULT_WIDTH) * RETINA_SCALE;
    const outWidth = Math.min(targetWidth, cropW);

    const outPath = path.join(CLOUDS_DIR, `${name}.webp`);
    await sharp(raster)
      .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
      .resize({ width: outWidth, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, alphaQuality: 90 })
      .toFile(outPath);

    converted++;
    console.log(
      `ok     ${file} -> ${name}.webp  crop [${cropLeft},${cropTop} ${cropW}x${cropH}] of ${realW}x${realH} -> out ${outWidth}px wide`
    );
  }

  console.log(`\nDone. Converted ${converted}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
