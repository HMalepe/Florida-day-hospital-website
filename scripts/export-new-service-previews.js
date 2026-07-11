/**
 * Process new specialty source art into HD service previews + specialist stills.
 * Usage: node scripts/export-new-service-previews.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'photos', 'services');
const SPEC = path.join(ROOT, 'assets', 'specialists');
const SRC_DIR = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-134203-Desktop-Florida-Day-Hospital-Website',
  'assets'
);

const W = 1200;
const H = 1500;

const JOBS = [
  { id: 'orthopaedics', file: 'orthopaedics-src.png' },
  { id: 'urology', file: 'urology-src.png' },
  { id: 'dental', file: 'dental-src.png' },
];

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

async function processOne(job) {
  const srcPath = path.join(SRC_DIR, job.file);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Missing source: ${srcPath}`);
  }

  const localSrc = path.join(OUT, '_source', `${job.id}-src.png`);
  fs.mkdirSync(path.dirname(localSrc), { recursive: true });
  fs.copyFileSync(srcPath, localSrc);

  const base = await sharp(localSrc)
    .rotate()
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .modulate({ brightness: 1.02, saturation: 0.94 })
    .sharpen({ sigma: 0.5 })
    .png()
    .toBuffer();

  const mask = await softEdgeMask();
  const masked = await sharp(base)
    .ensureAlpha()
    .composite([{ input: await sharp(mask).png().toBuffer(), blend: 'dest-in' }])
    .png()
    .toBuffer();

  const panel = await sharp({
    create: { width: W, height: H, channels: 3, background: '#14181c' },
  })
    .png()
    .toBuffer();

  const composed = await sharp(panel)
    .composite([{ input: masked, blend: 'over' }])
    .webp({ quality: 90, effort: 5 })
    .toFile(path.join(OUT, `${job.id}.webp`));

  await sharp(localSrc)
    .rotate()
    .resize(720, 900, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(SPEC, `${job.id}.jpg`));

  console.log('wrote', job.id, composed.size);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(SPEC, { recursive: true });
  for (const job of JOBS) {
    await processOne(job);
  }
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
