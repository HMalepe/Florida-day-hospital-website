/**
 * Brand the care-band photo with the FDH mark and export WebP sizes.
 * Usage: node scripts/brand-care-band.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ORIG = path.join(ROOT, 'assets', 'photos', 'care-band-1920.webp');
const MARK = path.join(ROOT, 'assets', 'fdh-mark.svg');
const OUT = path.join(ROOT, 'assets', 'photos');

async function main() {
  const meta = await sharp(ORIG).metadata();
  const W = meta.width;
  const H = meta.height;

  // Plaque sits upper-right behind the patient — measured from the 1920 source
  const coverX = 1420;
  const coverY = 28;
  const coverW = 480;
  const coverH = 400;

  // Opaque navy plate that fully occludes the previous wall branding
  const plateSvg = Buffer.from(`
    <svg width="${coverW}" height="${coverH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="p" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stop-color="#1c455f"/>
          <stop offset="1" stop-color="#102f42"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#p)"/>
      <rect x="14" y="14" width="${coverW - 28}" height="${coverH - 28}" rx="22"
            fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
    </svg>
  `);

  const markSize = 176;
  const markPng = await sharp(MARK)
    .resize(markSize, markSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const cardPad = 30;
  const cardW = markSize + cardPad * 2;
  const cardH = markSize + cardPad * 2;
  const cardSvg = Buffer.from(`
    <svg width="${cardW}" height="${cardH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sh" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="5" stdDeviation="10" flood-color="#041820" flood-opacity="0.4"/>
        </filter>
      </defs>
      <rect x="3" y="3" width="${cardW - 6}" height="${cardH - 6}" rx="22"
            fill="#ffffff" fill-opacity="0.96" filter="url(#sh)"/>
    </svg>
  `);

  const cardX = coverX + Math.round((coverW - cardW) / 2);
  const cardY = coverY + Math.round((coverH - cardH) / 2) - 8;
  const markX = cardX + cardPad;
  const markY = cardY + cardPad;

  const branded = await sharp(ORIG)
    .composite([
      { input: plateSvg, left: coverX, top: coverY },
      { input: cardSvg, left: cardX, top: cardY },
      { input: markPng, left: markX, top: markY },
    ])
    .modulate({ brightness: 1.035, saturation: 1.12 })
    .sharpen({ sigma: 0.55 })
    .png()
    .toBuffer();

  const widths = [640, 960, 1280, 1920];
  for (const w of widths) {
    const h = Math.round((w * H) / W);
    await sharp(branded)
      .resize(w, h, { fit: 'cover' })
      .webp({ quality: 86, effort: 5 })
      .toFile(path.join(OUT, `care-band-${w}.webp`));
    console.log('wrote', `care-band-${w}.webp`);
  }

  await sharp(branded).resize(960).png().toFile(path.join(OUT, '_care-band-preview.png'));
  console.log('preview ready at', coverX, coverY, coverW, coverH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
