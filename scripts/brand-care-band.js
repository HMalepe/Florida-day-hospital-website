/**
 * Brand the care-band photo with a premium wall-mounted FDH mark.
 * Usage: node scripts/brand-care-band.js
 *
 * Clears the old plaque artwork with an opaque navy panel, then mounts
 * the FDH cross as acrylic signage (no white card, no leftover text).
 */
const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CLEAN = path.join(ROOT, 'assets', 'photos', '_care-band-clean-1920.webp');
const MARK = path.join(ROOT, 'assets', 'fdh-mark.svg');
const OUT = path.join(ROOT, 'assets', 'photos');

async function main() {
  const meta = await sharp(CLEAN).metadata();
  const W = meta.width;
  const H = meta.height;

  // Sample navy from a quiet corner of the existing plaque
  const navySample = await sharp(CLEAN)
    .extract({ left: 1345, top: 40, width: 20, height: 20 })
    .resize(1, 1)
    .raw()
    .toBuffer();
  let [nr, ng, nb] = navySample;
  if (nr > 55 || nb < 55) {
    nr = 30;
    ng = 52;
    nb = 70;
  }

  const plateX = 1318;
  const plateY = 8;
  const plateW = 400;
  const plateH = 300;
  const feather = 14;

  // Fully opaque navy core (kills all old text/icon)
  const coreW = plateW - feather * 2;
  const coreH = plateH - feather * 2;
  const core = await sharp({
    create: {
      width: coreW,
      height: coreH,
      channels: 3,
      background: { r: nr, g: ng, b: nb },
    },
  })
    .png()
    .toBuffer();

  // Soft gradient frame around core so edges meet the photo
  const frame = await sharp(
    Buffer.from(`<svg width="${plateW}" height="${plateH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0.1" y2="1">
          <stop offset="0" stop-color="rgb(${Math.min(255, nr + 8)},${Math.min(255, ng + 6)},${Math.min(255, nb + 5)})"/>
          <stop offset="1" stop-color="rgb(${Math.max(0, nr - 4)},${Math.max(0, ng - 3)},${Math.max(0, nb - 2)})"/>
        </linearGradient>
        <linearGradient id="x" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000"/>
          <stop offset="${((feather / plateW) * 100).toFixed(2)}%" stop-color="#fff"/>
          <stop offset="${(100 - (feather / plateW) * 100).toFixed(2)}%" stop-color="#fff"/>
          <stop offset="100%" stop-color="#000"/>
        </linearGradient>
        <linearGradient id="y" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ccc"/>
          <stop offset="${((feather / plateH) * 100).toFixed(2)}%" stop-color="#fff"/>
          <stop offset="${(100 - (feather / plateH) * 100).toFixed(2)}%" stop-color="#fff"/>
          <stop offset="100%" stop-color="#000"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`)
  )
    .png()
    .toBuffer();

  const maskX = await sharp(
    Buffer.from(`<svg width="${plateW}" height="${plateH}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="x" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000"/>
        <stop offset="${((feather / plateW) * 100).toFixed(2)}%" stop-color="#fff"/>
        <stop offset="${(100 - (feather / plateW) * 100).toFixed(2)}%" stop-color="#fff"/>
        <stop offset="100%" stop-color="#000"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#x)"/>
    </svg>`)
  )
    .png()
    .toBuffer();

  const maskY = await sharp(
    Buffer.from(`<svg width="${plateW}" height="${plateH}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="y" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ddd"/>
        <stop offset="${((feather / plateH) * 100).toFixed(2)}%" stop-color="#fff"/>
        <stop offset="${(100 - (feather / plateH) * 100).toFixed(2)}%" stop-color="#fff"/>
        <stop offset="100%" stop-color="#000"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#y)"/>
    </svg>`)
  )
    .png()
    .toBuffer();

  const edgeMask = await sharp(maskX)
    .composite([{ input: maskY, blend: 'multiply' }])
    .blur(1.2)
    .greyscale()
    .png()
    .toBuffer();

  const softFrame = await sharp(frame)
    .ensureAlpha()
    .composite([{ input: edgeMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Acrylic top sheen
  const sheen = await sharp(
    Buffer.from(`<svg width="${coreW}" height="${Math.round(coreH * 0.4)}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.11"/>
          <stop offset="0.55" stop-color="#ffffff" stop-opacity="0.03"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#s)"/>
    </svg>`)
  )
    .png()
    .toBuffer();

  // FDH mark — soft contact shadow only, no white card
  const markSize = 136;
  const pad = 28;
  const canvas = markSize + pad * 2;
  const markOnly = await sharp(MARK)
    .resize(markSize, markSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const markMounted = await sharp(
    Buffer.from(`<svg width="${canvas}" height="${canvas}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.6" flood-color="#02080e" flood-opacity="0.55"/>
          <feDropShadow dx="0" dy="4" stdDeviation="5.5" flood-color="#02080e" flood-opacity="0.28"/>
        </filter>
      </defs>
      <image href="data:image/png;base64,${markOnly.toString('base64')}"
             x="${pad}" y="${pad}" width="${markSize}" height="${markSize}"
             filter="url(#s)"/>
    </svg>`)
  )
    .png()
    .modulate({ brightness: 1.03, saturation: 0.96 })
    .blur(0.3)
    .toBuffer();

  const markX = plateX + Math.round((plateW - canvas) / 2);
  const markY = plateY + Math.round((plateH - canvas) / 2) - 4;

  const plateShadow = await sharp(
    Buffer.from(`<svg width="${plateW + 24}" height="${plateH + 24}" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="a" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="7"/>
      </filter></defs>
      <rect x="8" y="12" width="${plateW}" height="${plateH}" rx="5"
            fill="#071018" fill-opacity="0.32" filter="url(#a)"/>
    </svg>`)
  )
    .png()
    .toBuffer();

  const branded = await sharp(CLEAN)
    .composite([
      { input: plateShadow, left: plateX - 8, top: plateY - 2 },
      { input: softFrame, left: plateX, top: plateY },
      { input: core, left: plateX + feather, top: plateY + feather },
      { input: sheen, left: plateX + feather, top: plateY + feather },
      { input: markMounted, left: markX, top: markY },
    ])
    .modulate({ brightness: 1.012, saturation: 1.04 })
    .sharpen({ sigma: 0.3 })
    .png()
    .toBuffer();

  const widths = [640, 960, 1280, 1920];
  for (const w of widths) {
    const h = Math.round((w * H) / W);
    await sharp(branded)
      .resize(w, h, { fit: 'cover' })
      .webp({ quality: 88, effort: 5 })
      .toFile(path.join(OUT, `care-band-${w}.webp`));
    console.log('wrote', `care-band-${w}.webp`);
  }

  await sharp(branded).resize(960).png().toFile(path.join(OUT, '_care-band-preview.png'));
  await sharp(branded)
    .extract({ left: 1300, top: 0, width: 460, height: 340 })
    .png()
    .toFile(path.join(OUT, '_logo-crop.png'));

  // Sanity: text zone must stay dark (no white lettering)
  const zone = await sharp(branded)
    .extract({ left: 1380, top: 200, width: 200, height: 80 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let bright = 0;
  for (let i = 0; i < zone.data.length; i += zone.info.channels) {
    if (zone.data[i] > 120) bright += 1;
  }
  console.log('done', { nr, ng, nb, markX, markY, brightInTextZone: bright });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
