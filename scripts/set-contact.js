#!/usr/bin/env node
/**
 * Set confirmed contact details in data/contact.json.
 *
 * Usage:
 *   node scripts/set-contact.js --phone "+27211234567" --phone-display "011 234 5678"
 *   node scripts/set-contact.js --email "info@floridadayhospital.co.za"
 *   node scripts/set-contact.js --phone "+27211234567" --email "info@example.co.za"
 *
 * Omit a flag to leave that field unchanged. Use --pending to mark unconfirmed.
 */
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'contact.json');

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const hasFlag = (name) => args.includes(name);

const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const phone = getArg('--phone');
const phoneDisplay = getArg('--phone-display');
const email = getArg('--email');
const emailDisplay = getArg('--email-display');

if (phone !== undefined) {
  data.phone.tel = phone;
  data.phone.pending = hasFlag('--pending') || !phone;
  if (phoneDisplay) data.phone.display = phoneDisplay;
  else if (phone && !data.phone.display) data.phone.display = phone;
}

if (email !== undefined) {
  data.email.address = email;
  data.email.pending = hasFlag('--pending') || !email;
  if (emailDisplay) data.email.display = emailDisplay;
  else if (email && !data.email.display) data.email.display = email;
}

if (phone === undefined && email === undefined) {
  console.error('Provide --phone and/or --email. See script header for usage.');
  process.exit(1);
}

if (phone && !hasFlag('--pending')) data.phone.pending = false;
if (email && !hasFlag('--pending')) data.email.pending = false;

fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(data, null, 2)}\n`);

console.log('Updated data/contact.json');
console.log(`  phone: ${data.phone.pending ? '(pending)' : data.phone.display} ${data.phone.tel || ''}`);
console.log(`  email: ${data.email.pending ? '(pending)' : data.email.display} ${data.email.address || ''}`);
console.log('\nRun: bash scripts/check-launch.sh');
