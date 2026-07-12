/**
 * Pre-demo audit — desktop + mobile viewport checks across all pages.
 * Run: node scripts/pre-demo-audit.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PORT = 4177;
const PAGES = ['index.html', 'about.html', 'services.html', 'contact.html', 'careers.html'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function staticAssetScan() {
  const issues = [];
  const htmlFiles = PAGES.map((p) => path.join(ROOT, p));
  const refRe = /(?:src|href)=["']([^"']+)["']/g;
  const seen = new Set();

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = refRe.exec(html))) {
      let ref = m[1];
      if (!ref || ref.startsWith('http') || ref.startsWith('mailto:') || ref.startsWith('tel:') || ref.startsWith('#')) continue;
      ref = ref.split('?')[0].split('#')[0];
      if (seen.has(ref)) continue;
      seen.add(ref);
      const abs = path.join(ROOT, ref);
      if (!fs.existsSync(abs)) {
        issues.push({ severity: 'high', page: path.basename(file), msg: `Missing asset: ${ref}` });
      }
    }
  }

  // JSON-referenced photos
  const providers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/providers.json'), 'utf8'));
  for (const p of providers.providers || []) {
    if (p.photo && !String(p.photo).includes('PLACEHOLDER')) {
      if (!fs.existsSync(path.join(ROOT, p.photo))) {
        issues.push({ severity: 'high', page: 'providers.json', msg: `Missing provider photo: ${p.photo}` });
      }
    }
  }

  const photography = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/photography.json'), 'utf8'));
  for (const [slot, cfg] of Object.entries(photography.slots || {})) {
    if (!cfg.enabled) continue;
    if (cfg.fallback && !fs.existsSync(path.join(ROOT, cfg.fallback))) {
      issues.push({ severity: 'high', page: 'photography.json', msg: `Enabled slot ${slot} missing ${cfg.fallback}` });
    }
    for (const v of cfg.variants || []) {
      if (v.src && !fs.existsSync(path.join(ROOT, v.src))) {
        issues.push({ severity: 'high', page: 'photography.json', msg: `Missing variant ${v.src} (${slot})` });
      }
    }
  }

  const services = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/services.json'), 'utf8'));
  for (const s of services.services || []) {
    if (s.previewSrc && !fs.existsSync(path.join(ROOT, s.previewSrc))) {
      issues.push({ severity: 'medium', page: 'services.json', msg: `Missing preview: ${s.previewSrc}` });
    }
    if (s.image && !fs.existsSync(path.join(ROOT, s.image))) {
      issues.push({ severity: 'medium', page: 'services.json', msg: `Missing image: ${s.image}` });
    }
  }

  return issues;
}

async function browserAudit(playwright) {
  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  const issues = [];
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'laptop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    for (const pageName of PAGES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.name === 'mobile' ? 2 : 1,
        hasTouch: vp.name === 'mobile' || vp.name === 'tablet',
        isMobile: vp.name === 'mobile',
      });
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      const failedRequests = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => pageErrors.push(String(err.message || err)));
      page.on('requestfailed', (req) => {
        const url = req.url();
        if (url.includes('favicon') || url.includes('chrome-extension')) return;
        failedRequests.push(`${req.failure()?.errorText || 'fail'}: ${url}`);
      });

      const url = `http://127.0.0.1:${PORT}/${pageName}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (err) {
        issues.push({
          severity: 'critical',
          page: pageName,
          viewport: vp.name,
          msg: `Navigation failed: ${err.message}`,
        });
        await context.close();
        continue;
      }

      // Wait for dynamic mounts
      await page.waitForTimeout(600);

      for (const err of pageErrors) {
        issues.push({ severity: 'critical', page: pageName, viewport: vp.name, msg: `JS error: ${err}` });
      }
      for (const err of consoleErrors) {
        if (/Failed to load resource/i.test(err)) continue;
        issues.push({ severity: 'high', page: pageName, viewport: vp.name, msg: `Console: ${err}` });
      }
      for (const fail of failedRequests) {
        issues.push({ severity: 'high', page: pageName, viewport: vp.name, msg: `Request failed: ${fail}` });
      }

      // Broken images
      const brokenImgs = await page.evaluate(() =>
        [...document.images]
          .filter((img) => img.src && (!img.complete || img.naturalWidth === 0))
          .map((img) => img.currentSrc || img.src)
      );
      for (const src of brokenImgs) {
        issues.push({ severity: 'high', page: pageName, viewport: vp.name, msg: `Broken image: ${src}` });
      }

      // Horizontal overflow
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const sw = Math.max(doc.scrollWidth, body.scrollWidth);
        const cw = doc.clientWidth;
        if (sw <= cw + 2) return null;
        const offenders = [];
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > cw + 8 || r.right > cw + 8) {
            const tag = el.tagName.toLowerCase();
            const cls = (el.className && String(el.className).slice?.(0, 60)) || '';
            offenders.push(`${tag}.${cls}`.slice(0, 80));
          }
        });
        return { sw, cw, offenders: [...new Set(offenders)].slice(0, 8) };
      });
      if (overflow) {
        issues.push({
          severity: vp.name === 'mobile' ? 'high' : 'medium',
          page: pageName,
          viewport: vp.name,
          msg: `Horizontal overflow ${overflow.sw}px > ${overflow.cw}px — ${overflow.offenders.join(' | ') || 'unknown'}`,
        });
      }

      // Scroll smoothness probe: scroll through page, catch layout thrash / stuck
      const scrollProbe = await page.evaluate(async () => {
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (max < 200) return { ok: true, max };
        const steps = 8;
        let lastY = window.scrollY;
        for (let i = 1; i <= steps; i++) {
          window.scrollTo(0, Math.round((max * i) / steps));
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const y = window.scrollY;
          if (i < steps && y <= lastY && max > 400) {
            return { ok: false, reason: `scroll stuck near ${y}`, max };
          }
          lastY = y;
        }
        window.scrollTo(0, 0);
        return { ok: true, max };
      });
      if (!scrollProbe.ok) {
        issues.push({
          severity: 'high',
          page: pageName,
          viewport: vp.name,
          msg: `Scroll probe failed: ${scrollProbe.reason}`,
        });
      }

      // Visible TEL/EMAIL placeholders
      const placeholders = await page.evaluate(() => {
        const text = document.body.innerText || '';
        const hits = [];
        if (/TEL_PLACEHOLDER/.test(text)) hits.push('TEL_PLACEHOLDER visible');
        if (/EMAIL_PLACEHOLDER/.test(text)) hits.push('EMAIL_PLACEHOLDER visible');
        if (/PHOTO_PLACEHOLDER/.test(text)) hits.push('PHOTO_PLACEHOLDER visible');
        return hits;
      });
      for (const hit of placeholders) {
        issues.push({ severity: 'critical', page: pageName, viewport: vp.name, msg: hit });
      }

      // Mobile-specific: sticky bar collision
      if (vp.name === 'mobile') {
        const bar = await page.evaluate(() => {
          const el = document.querySelector('.mobile-bar');
          if (!el) return { present: false };
          const style = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            present: true,
            display: style.display,
            visible: r.height > 0 && style.visibility !== 'hidden',
            bottom: r.bottom,
            vh: window.innerHeight,
          };
        });
        if (bar.present && bar.display !== 'none' && !bar.visible) {
          issues.push({
            severity: 'medium',
            page: pageName,
            viewport: vp.name,
            msg: 'Mobile bar present but not visible',
          });
        }
      }

      // Home pathway traveler on desktop
      if (pageName === 'index.html' && (vp.name === 'desktop' || vp.name === 'laptop')) {
        await page.evaluate(() => {
          const el = document.querySelector('.day-pathway');
          if (el) el.scrollIntoView({ block: 'center' });
        });
        await page.waitForTimeout(1200);
        const journey = await page.evaluate(() => {
          const tl = document.querySelector('.day-pathway__timeline');
          const flow = document.querySelector('.day-pathway__flow');
          if (!tl) return { ok: false, reason: 'no timeline' };
          const p1 = parseFloat(getComputedStyle(tl).getPropertyValue('--journey-progress')) || 0;
          return {
            ok: true,
            p1,
            pose: flow?.dataset?.pose || null,
            onRail: flow?.classList.contains('is-on-rail') || false,
            display: flow ? getComputedStyle(flow).display : null,
          };
        });
        await page.waitForTimeout(1800);
        const journey2 = await page.evaluate(() => {
          const tl = document.querySelector('.day-pathway__timeline');
          const p2 = parseFloat(getComputedStyle(tl).getPropertyValue('--journey-progress')) || 0;
          return p2;
        });
        if (journey.ok) {
          if (journey.display === 'none') {
            issues.push({
              severity: 'high',
              page: pageName,
              viewport: vp.name,
              msg: 'Desktop pathway traveler is display:none',
            });
          } else if (Math.abs(journey2 - journey.p1) < 0.01 && journey.p1 < 0.98) {
            issues.push({
              severity: 'high',
              page: pageName,
              viewport: vp.name,
              msg: `Pathway progress not advancing (stuck at ${journey.p1.toFixed(3)})`,
            });
          }
        }
      }

      // About specialty backgrounds
      if (pageName === 'about.html') {
        const cards = await page.evaluate(() => {
          const nodes = [...document.querySelectorAll('.provider-card--has-bg')];
          return {
            count: nodes.length,
            withImg: nodes.filter((n) => n.querySelector('.provider-card__bg img')).length,
          };
        });
        if (cards.count === 0) {
          issues.push({
            severity: 'high',
            page: pageName,
            viewport: vp.name,
            msg: 'No specialty background cards rendered',
          });
        } else if (cards.withImg < cards.count) {
          issues.push({
            severity: 'medium',
            page: pageName,
            viewport: vp.name,
            msg: `Only ${cards.withImg}/${cards.count} specialty cards have bg images`,
          });
        }
      }

      await context.close();
    }
  }

  // Desktop-on-mobile preview mode
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('fdh-site-view', 'desktop');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const mode = await page.evaluate(() => ({
      htmlClass: document.documentElement.className,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    if (!/site-view--/.test(mode.htmlClass) && mode.scrollWidth <= mode.clientWidth + 20) {
      // desktop-on-phone may set viewport meta instead — just note if broken
    }
    const consoleAfter = [];
    page.on('pageerror', (e) => consoleAfter.push(String(e.message || e)));
    await page.waitForTimeout(400);
    for (const err of consoleAfter) {
      issues.push({ severity: 'high', page: 'index.html', viewport: 'desktop-on-mobile', msg: `JS error: ${err}` });
    }
    await context.close();
  }

  await browser.close();
  return issues;
}

async function main() {
  console.log('Florida Day Hospital — pre-demo audit\n');
  const staticIssues = await staticAssetScan();
  console.log(`Static scan: ${staticIssues.length} issue(s)`);

  let browserIssues = [];
  let server;
  try {
    const playwright = require('playwright');
    server = await startServer();
    console.log(`Server on http://127.0.0.1:${PORT}`);
    browserIssues = await browserAudit(playwright);
    console.log(`Browser scan: ${browserIssues.length} issue(s)`);
  } catch (err) {
    console.error('Browser audit failed:', err.message);
    browserIssues.push({ severity: 'critical', page: '*', viewport: '*', msg: err.message });
  } finally {
    if (server) server.close();
  }

  const all = [...staticIssues, ...browserIssues];
  const rank = { critical: 0, high: 1, medium: 2, low: 3 };
  all.sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9));

  const outPath = path.join(ROOT, 'scripts', 'pre-demo-audit-report.json');
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), issues: all }, null, 2));

  console.log('\n=== Findings ===');
  if (!all.length) {
    console.log('No issues found.');
  } else {
    for (const issue of all) {
      const loc = [issue.page, issue.viewport].filter(Boolean).join('@');
      console.log(`[${issue.severity}] ${loc}: ${issue.msg}`);
    }
  }
  console.log(`\nReport: ${outPath}`);
  const blockers = all.filter((i) => i.severity === 'critical' || i.severity === 'high');
  process.exit(blockers.length ? 1 : 0);
}

main();
