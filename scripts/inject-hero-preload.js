#!/usr/bin/env node
/**
 * Inject a static <link rel="preload" as="image"> for the hero photo into
 * the BUILT _site/index.html, at build time, when data/photography.json's
 * hero slot is enabled.
 *
 * Why this exists: js/photography.js can inject the same preload link at
 * runtime, but only after (1) its own <script defer> has loaded and run,
 * and (2) an additional fetch('data/photography.json') round-trip has
 * resolved — by which point the browser's preload scanner has already
 * moved past the point where a preload actually gets ahead of anything.
 * A tag baked into the raw HTML <head> is discoverable on the very first
 * parse pass, in parallel with CSS/fonts/scripts — which is the entire
 * point of a preload hint. See photography.json's meta.lcpNote.
 *
 * The injected tag carries the same data-fdh-hero-preload marker that
 * photography.js's injectHeroPreload() checks for, so the runtime version
 * sees it already exists and skips creating a duplicate.
 *
 * Run at the end of scripts/prepare-site.sh, after the site is copied
 * into _site/. Safe to run against a gated (coming-soon) build too — it
 * no-ops if the target HTML doesn't contain a hero photo mount.
 *
 * Usage:
 *   node scripts/inject-hero-preload.js [path/to/_site]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, '_site');
const CONFIG_PATH = path.join(ROOT, 'data', 'photography.json');
const INDEX_PATH = path.join(OUT_DIR, 'index.html');

// Mirrors js/photography.js's isPlaceholder/slotActive/buildSrcset/
// pickPreloadHref exactly, so the build-time tag and the runtime
// fallback always agree on which variant gets preloaded.
const isPlaceholder = (value) => !value || /PLACEHOLDER/i.test(String(value));

const slotActive = (slot) => {
  if (!slot || slot.enabled === false) return false;
  const candidates = [slot.fallback, ...(slot.variants || []).map((v) => v.src)];
  return candidates.some((src) => src && !isPlaceholder(src));
};

const buildSrcset = (variants) =>
  (variants || [])
    .filter((v) => v.src && !isPlaceholder(v.src))
    .map((v) => `${v.src} ${v.width}w`)
    .join(', ');

const pickPreloadHref = (slot) => {
  const valid = (slot.variants || []).filter((v) => v.src && !isPlaceholder(v.src));
  if (!valid.length) return slot.fallback && !isPlaceholder(slot.fallback) ? slot.fallback : null;
  return valid.sort((a, b) => b.width - a.width)[0].src;
};

const escAttr = (str) => String(str).replace(/"/g, '&quot;');

const buildPreloadTag = (slot) => {
  const href = pickPreloadHref(slot);
  if (!href) return null;
  const srcset = buildSrcset(slot.variants);
  const srcsetAttrs = srcset
    ? ` imagesrcset="${escAttr(srcset)}" imagesizes="${escAttr(slot.sizes || '100vw')}"`
    : '';
  return `<link rel="preload" as="image" href="${escAttr(href)}" fetchpriority="high" data-fdh-hero-preload${srcsetAttrs}>`;
};

const main = () => {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log('inject-hero-preload: no data/photography.json found — skipping.');
    return;
  }
  if (!fs.existsSync(INDEX_PATH)) {
    console.log(`inject-hero-preload: ${path.relative(ROOT, INDEX_PATH)} not found — skipping.`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const heroSlot = data.slots && data.slots.hero;

  if (!heroSlot || !heroSlot.lcp || !slotActive(heroSlot)) {
    console.log('inject-hero-preload: hero slot not enabled/active — nothing to inject.');
    return;
  }

  let html = fs.readFileSync(INDEX_PATH, 'utf8');

  // Self-guard: only touch a real homepage build, never a coming-soon
  // gate page (which has no hero photo mount) or an already-tagged file.
  if (!html.includes('data-photo-slot="hero"')) {
    console.log('inject-hero-preload: index.html has no hero photo mount (gated build?) — skipping.');
    return;
  }
  if (html.includes('data-fdh-hero-preload')) {
    console.log('inject-hero-preload: preload tag already present — skipping.');
    return;
  }

  const tag = buildPreloadTag(heroSlot);
  if (!tag) {
    console.log('inject-hero-preload: hero slot active but no resolvable image src — skipping.');
    return;
  }

  // Place it as early as possible in <head> — right after the charset
  // meta tag, ahead of fonts/CSS/scripts, so the browser's preload
  // scanner discovers it on the very first pass through the document.
  const charsetRe = /(<meta\s+charset=["'][^"']*["']\s*\/?>)/i;
  if (charsetRe.test(html)) {
    html = html.replace(charsetRe, `$1\n  ${tag}`);
  } else {
    html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n  ${tag}`);
  }

  fs.writeFileSync(INDEX_PATH, html);
  console.log(`inject-hero-preload: injected static preload for ${pickPreloadHref(heroSlot)}`);
};

main();
