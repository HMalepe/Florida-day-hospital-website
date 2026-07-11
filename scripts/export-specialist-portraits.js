/**
 * Export HD specialist portraits for services detail page only.
 * Landing hover previews are unchanged.
 * Usage: node scripts/export-specialist-portraits.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SPEC = path.join(ROOT, 'assets', 'specialists');
const SRC = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-134203-Desktop-Florida-Day-Hospital-Website',
  'assets'
);

const JOBS = [
  { id: 'orthopaedics', file: 'orthopaedics-doctor-src.png' },
  { id: 'general-surgery', file: 'general-surgery-team-src.png' },
];

async function main() {
  fs.mkdirSync(SPEC, { recursive: true });
  for (const job of JOBS) {
    const src = path.join(SRC, job.file);
    if (!fs.existsSync(src)) throw new Error('Missing ' + src);
    const dest = path.join(SPEC, `${job.id}.jpg`);
    await sharp(src)
      .rotate()
      .resize(900, 1125, { fit: 'cover', position: 'centre' })
      .modulate({ brightness: 1.02, saturation: 0.96 })
      .sharpen({ sigma: 0.45 })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(dest);
    console.log('wrote', dest, fs.statSync(dest).size);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
