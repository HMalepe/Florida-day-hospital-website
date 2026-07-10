#!/usr/bin/env node
/**
 * Visual regression screenshot tool.
 *
 * Serves the repo root as a static site on a free local port, then takes a
 * full-page screenshot of every page at desktop (1440x900) and mobile
 * (390x844) widths. Output goes to screenshots/ (gitignored) — diff them
 * by eye, or against a previous run, before/after a CSS or markup change.
 *
 * Usage:
 *   node scripts/screenshot-check.js
 *   npm run visual-check
 *
 * --- Two gotchas that cost real time to work out — read before touching
 *     the scroll/freeze logic below. ---
 *
 * GOTCHA 1 — scroll timing (see scrollThroughPage):
 * Playwright's `page.screenshot({ fullPage: true })` resizes the viewport
 * to the page's full scroll height and captures it in ONE shot. It does
 * NOT scroll through the page first. This site's [data-reveal] elements
 * only get their `.revealed`/`.is-visible` class from an
 * IntersectionObserver that fires as the *real* viewport passes over them
 * during normal scrolling — at initial load, everything below the fold
 * has never crossed the viewport, so a naive fullPage screenshot captures
 * those sections mid-hidden-state (invisible / translated / opacity 0).
 * Fix: manually scroll top -> bottom in viewport-height steps with a short
 * pause at each step BEFORE calling screenshot(), so every observer
 * actually fires, then return to the top for a consistent capture.
 *
 * GOTCHA 2 — fixed-position freezing (see freezeFixedElements):
 * `position: fixed` elements (the mobile sticky action bar, a sticky
 * header, etc.) are pinned to the *viewport*, not the page. When
 * fullPage screenshot resizes the viewport to the entire page height,
 * a fixed element still renders exactly once, at whatever position that
 * now-enormous viewport implies for `top`/`bottom` — typically a phantom
 * copy frozen somewhere in the middle of the composite, not stuck to the
 * bottom the way a real user would see it. Fix: right before the
 * screenshot, walk the DOM and convert every computed `position: fixed`
 * element to `position: absolute`, pinned at its current on-screen
 * coordinates — this bakes in a correct one-time position instead of
 * letting it re-anchor to the resized viewport.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'screenshots');

const PAGES = ['index.html', 'about.html', 'services.html', 'contact.html', 'careers.html'];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        let reqPath = decodeURIComponent(req.url.split('?')[0]);
        if (reqPath === '/' || reqPath.endsWith('/')) reqPath += 'index.html';

        const filePath = path.normalize(path.join(ROOT, reqPath));
        if (!filePath.startsWith(ROOT)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        const data = await fs.promises.readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.on('error', reject);
    // Port 0 = OS picks a free port.
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

// GOTCHA 1 — see file header. Step through the page instead of jumping
// straight to the bottom, so scroll-triggered reveals actually fire.
async function scrollThroughPage(page) {
  const viewportHeight = page.viewportSize().height;
  const step = Math.round(viewportHeight * 0.85);

  let totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < totalHeight; y += step) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(220);
    // Page height can grow as lazy content/images resolve — re-read it.
    totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  }

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(250);

  // Back to the top for a consistent, deterministic capture starting point.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
}

// GOTCHA 2 — see file header. Bake fixed elements into their current
// rendered position before the viewport gets resized for the fullPage
// capture.
async function freezeFixedElements(page) {
  await page.evaluate(() => {
    document.querySelectorAll('body *').forEach((el) => {
      const computed = getComputedStyle(el);
      if (computed.position !== 'fixed') return;
      const rect = el.getBoundingClientRect();
      el.style.position = 'absolute';
      el.style.top = `${rect.top + window.scrollY}px`;
      el.style.left = `${rect.left + window.scrollX}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    });
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const server = await startServer();
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/`;
  console.log(`Serving ${path.relative(process.cwd(), ROOT) || '.'} at ${baseUrl}`);

  const browser = await chromium.launch();
  let failures = 0;

  try {
    for (const pageName of PAGES) {
      for (const viewport of VIEWPORTS) {
        const label = `${pageName} @ ${viewport.name}`;
        try {
          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
          });
          const page = await context.newPage();

          await page.goto(baseUrl + pageName, { waitUntil: 'networkidle', timeout: 20000 });
          await scrollThroughPage(page);
          await freezeFixedElements(page);

          const fileName = `${pageName.replace(/\.html$/, '')}-${viewport.name}.png`;
          const outPath = path.join(OUT_DIR, fileName);
          await page.screenshot({ path: outPath, fullPage: true });

          console.log(`  ✓ ${fileName}`);
          await context.close();
        } catch (err) {
          failures += 1;
          console.error(`  ✗ ${label}: ${err.message}`);
        }
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\nDone. Screenshots in ${path.relative(process.cwd(), OUT_DIR) || 'screenshots'}/`);
  if (failures > 0) {
    console.error(`${failures} capture(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
