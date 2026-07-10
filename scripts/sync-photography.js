#!/usr/bin/env node
/**
 * Sync data/photography.json enabled flags with files on disk.
 * Run after dropping WebP exports into assets/photos/.
 *
 * Usage:
 *   node scripts/sync-photography.js
 *   node scripts/sync-photography.js --dry-run
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'data', 'photography.json');
const dryRun = process.argv.includes('--dry-run');

const readConfig = () => JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const fileExists = (relPath) => {
  if (!relPath) return false;
  return fs.existsSync(path.join(ROOT, relPath));
};

const main = () => {
  const data = readConfig();
  const slots = data.slots || {};
  const changes = [];

  for (const [id, slot] of Object.entries(slots)) {
    const fallback = slot.fallback;
    const exists = fileExists(fallback);
    const wasEnabled = slot.enabled === true;

    if (exists && !wasEnabled) {
      slot.enabled = true;
      changes.push(`  + enable ${id} (${fallback})`);
    } else if (!exists && wasEnabled) {
      slot.enabled = false;
      changes.push(`  - disable ${id} (missing ${fallback})`);
    } else if (exists && wasEnabled) {
      changes.push(`  ✓ ${id} already enabled`);
    } else {
      changes.push(`  · ${id} waiting for ${fallback}`);
    }
  }

  console.log('Florida Day Hospital — photography sync\n');
  changes.forEach((line) => console.log(line));

  const mutated = changes.some((line) => line.startsWith('  +') || line.startsWith('  -'));
  if (!mutated) {
    console.log('\nNo changes needed.');
    return;
  }

  if (dryRun) {
    console.log('\nDry run — photography.json not written.');
    return;
  }

  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(data, null, 2)}\n`);
  console.log('\nUpdated data/photography.json');
};

main();
