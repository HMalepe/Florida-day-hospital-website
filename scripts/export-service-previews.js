/**
 * Build premium service hover-preview WebPs.
 * Prefers high-res standalone art; falls back to 6-up sheet crops.
 * Usage: node scripts/export-service-previews.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'photos', 'services', '_source');
const OUT = path.join(ROOT, 'assets', 'photos', 'services');
const GRID = path.join(SRC, 'grid-src.png');
const W = 1200;
const H = 1500;

const CELLS = [
  { id: 'ophthalmology', col: 0, row: 0, hiRes: 'ophthalmology-src.png', bg: '#14181c' },
  { id: 'gastroenterology', col: 1, row: 0, hiRes: 'gastro-src.png', bg: '#14181c' },
  { id: 'ent', col: 2, row: 0, hiRes: 'ent-src.png', bg: '#14181c' },
  { id: 'gynaecology', col: 0, row: 1, hiRes: 'gynaecology-src.png', bg: '#14181c' },
  { id: 'general-surgery', col: 1, row: 1, hiRes: 'general-surgery-src.png', bg: '#14181c' },
  { id: 'pain-management', col: 2, row: 1, hiRes: 'pain-src.png', bg: '#14181c' },
  { id: 'orthopaedics', col: 0, row: 0, hiRes: 'orthopaedics-src.png', bg: '#14181c' },
  { id: 'urology', col: 0, row: 0, hiRes: 'urology-src.png', bg: '#14181c' },
  { id: 'dental', col: 0, row: 0, hiRes: 'dental-src.png', bg: '#14181c' },
];

async function cropGridCard(col, row) {
  const meta = await sharp(GRID).metadata();
  const gw = meta.width;
  const gh = meta.height;

  const topBand = Math.round(gh * 0.115);
  const bottomPad = Math.round(gh * 0.04);
  const sidePad = Math.round(gw * 0.045);
  const gapX = Math.round(gw * 0.025);
  const gapY = Math.round(gh * 0.035);

  const usableW = gw - sidePad * 2 - gapX * 2;
  const usableH = gh - topBand - bottomPad - gapY;
  const cardW = Math.floor(usableW / 3);
  const cardH = Math.floor(usableH / 2);

  const left = sidePad + col * (cardW + gapX);
  const top = topBand + row * (cardH + gapY);
  const labelTrim = Math.round(cardH * 0.22);

  return sharp(GRID)
    .extract({
      left: Math.max(0, left),
      top: Math.max(0, top),
      width: Math.min(cardW, gw - left),
      height: Math.min(cardH - labelTrim, gh - top),
    })
    .png()
    .toBuffer();
}

/** Soft elliptical vignette so the art fades into the dark panel. */
async function softEdgeMask() {
  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="46%" r="72%">
          <stop offset="52%" stop-color="#fff"/>
          <stop offset="78%" stop-color="#fff" stop-opacity="0.88"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`;
  return Buffer.from(svg);
}

/** Knock out near-white studio backgrounds so light art sits on charcoal. */
async function knockOutWhite(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    if (min > 238 && max - min < 18) {
      data[i + 3] = 0;
    } else if (min > 205 && max - min < 22) {
      data[i + 3] = Math.round(255 * (1 - (min - 205) / 33));
    }
  }

  return sharp(data, { raw: info }).png().toBuffer();
}

async function composePreview(input, bg) {
  let prepared = await sharp(input)
    .resize({ width: W, height: H, fit: 'cover', position: 'centre' })
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .sharpen({ sigma: 0.65 })
    .png()
    .toBuffer();

  // Sample corners — if mostly white, treat as studio plate
  const sample = await sharp(prepared)
    .resize(32, 40, { fit: 'fill' })
    .raw()
    .toBuffer();
  let whiteish = 0;
  for (let i = 0; i < sample.length; i += 3) {
    if (sample[i] > 220 && sample[i + 1] > 220 && sample[i + 2] > 220) whiteish += 1;
  }
  if (whiteish / (sample.length / 3) > 0.28) {
    prepared = await knockOutWhite(prepared);
  }

  const mask = await softEdgeMask();
  const feathered = await sharp(prepared)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return sharp({
    create: { width: W, height: H, channels: 3, background: bg },
  })
    .composite([{ input: feathered, left: 0, top: 0 }])
    .webp({ quality: 94, effort: 5 });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const cell of CELLS) {
    const hiPath = cell.hiRes ? path.join(SRC, cell.hiRes) : null;
    let input;
    let label;

    if (hiPath && fs.existsSync(hiPath)) {
      input = hiPath;
      label = 'hi-res';
    } else if (fs.existsSync(GRID)) {
      const gridBuf = await cropGridCard(cell.col, cell.row);
      await sharp(gridBuf).png().toFile(path.join(SRC, `${cell.id}-grid-crop.png`));
      input = gridBuf;
      label = 'grid crop';
    } else {
      console.error('No source for', cell.id);
      continue;
    }

    console.log(cell.id, '←', label);
    const dest = path.join(OUT, `${cell.id}.webp`);
    await (await composePreview(input, cell.bg)).toFile(dest);
    const meta = await sharp(dest).metadata();
    console.log('  wrote', path.basename(dest), `${meta.width}x${meta.height}`, fs.statSync(dest).size);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
