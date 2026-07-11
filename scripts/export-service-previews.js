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
const W = 900;
const H = 1125;

const CELLS = [
  { id: 'ophthalmology', col: 0, row: 0, hiRes: 'ophthalmology-src.png', bg: '#14181c' },
  { id: 'gastroenterology', col: 1, row: 0, hiRes: 'gastro-src.png', bg: '#14181c' },
  { id: 'ent', col: 2, row: 0, hiRes: 'ent-src.png', bg: '#14181c' },
  { id: 'gynaecology', col: 0, row: 1, hiRes: 'gynaecology-src.png', bg: '#14181c' },
  { id: 'general-surgery', col: 1, row: 1, hiRes: null, bg: '#14181c' },
  { id: 'pain-management', col: 2, row: 1, hiRes: 'pain-src.png', bg: '#14181c' },
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

async function composePreview(input, bg) {
  // Sheet crops are already framed cards — fill the preview panel edge-to-edge
  return sharp({
    create: { width: W, height: H, channels: 3, background: bg },
  })
    .composite([
      {
        input: await sharp(input)
          .resize({ width: W, height: H, fit: 'cover', position: 'centre' })
          .png()
          .toBuffer(),
        left: 0,
        top: 0,
      },
    ])
    .webp({ quality: 90 });
}

async function main() {
  if (!fs.existsSync(GRID)) {
    console.error('Missing', GRID);
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });

  for (const cell of CELLS) {
    // Always crop from the approved 6-up sheet (labels trimmed)
    const gridBuf = await cropGridCard(cell.col, cell.row);
    await sharp(gridBuf).png().toFile(path.join(SRC, `${cell.id}-grid-crop.png`));

    // Prefer sheet crop for visual consistency across all six headings.
    // Hi-res standalones remain in _source for future swaps.
    const input = gridBuf;
    console.log(cell.id, '← grid crop');

    const dest = path.join(OUT, `${cell.id}.webp`);
    await (await composePreview(input, cell.bg)).toFile(dest);
    console.log('  wrote', path.basename(dest), fs.statSync(dest).size);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
