/**
 * Convert assets/photos/_source/*.png into WebP slot sizes.
 * Usage: node scripts/export-placeholder-photos.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'photos');
const SRC = path.join(OUT, '_source');

async function exportSlot(src, prefix, widths) {
  for (const w of widths) {
    const dest = path.join(OUT, `${prefix}-${w}.webp`);
    await sharp(src)
      .resize({ width: w, withoutEnlargement: false })
      .webp({ quality: 82 })
      .toFile(dest);
    console.log('wrote', path.basename(dest));
  }
}

async function main() {
  const doctor = path.join(SRC, 'clinician-patient.png');
  const family = path.join(SRC, 'family-visit.png');
  const surgery = path.join(SRC, 'theatre-team.png');

  for (const p of [doctor, family, surgery]) {
    if (!fs.existsSync(p)) {
      console.error('Missing source:', p);
      process.exit(1);
    }
  }

  await exportSlot(doctor, 'hero', [640, 960, 1280, 1920]);
  await exportSlot(family, 'care-band', [640, 960, 1280, 1920]);
  await exportSlot(surgery, 'pathway-accent', [960, 1280, 1920]);
  await exportSlot(surgery, 'providers', [640, 960, 1280, 1920]);
  await exportSlot(doctor, 'booking', [480, 800, 1200]);

  console.log('done →', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
