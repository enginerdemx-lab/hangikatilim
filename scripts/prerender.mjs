#!/usr/bin/env node
/**
 * Build-time prerenderer for the katilimuzmani.com React SPA.
 *
 * WHAT IT DOES
 *   1. Serves the freshly built `dist/` over a local static server (SPA fallback).
 *   2. Opens each public route in real headless Chrome, lets the app render
 *      (fetching live content from Supabase exactly like a normal visitor).
 *   3. Captures the fully rendered HTML and writes it back as a static file:
 *        /                       -> dist/index.html        (was the empty shell)
 *        /katilim-firmalari       -> dist/katilim-firmalari/index.html
 *        /blog/<slug>             -> dist/blog/<slug>/index.html   (auto-discovered)
 *      The original empty shell is preserved as dist/app.html for the SPA
 *      fallback of non-prerendered routes (login, profile, admin, …).
 *   4. Marks <div id="root" data-prerendered="true"> so the client hands the
 *      snapshot off cleanly (see index.tsx) — no hydration, no flicker.
 *
 * The result: the raw HTML sent by the server now contains real, crawlable text
 * (and a unique <title>/description per page) BEFORE any JavaScript runs, which
 * is exactly what AdSense / Googlebot need. The live SPA still boots on top and
 * refreshes all dynamic data.
 *
 * USAGE
 *   node scripts/prerender.mjs [--dist ./dist] [--settle 1200] [--max-detail 500] [--no-detail]
 *
 * BROWSER RESOLUTION (in order)
 *   1. PRERENDER_EXECUTABLE_PATH env  -> puppeteer-core with that Chrome
 *   2. @sparticuz/chromium            -> puppeteer-core (CI / serverless / sandbox)
 *   3. puppeteer                      -> its bundled Chromium (developer machines)
 */

import http from 'node:http';
import path from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ---- args ------------------------------------------------------------------
function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1) return process.argv[i + 1] === undefined ? true : process.argv[i + 1];
  return def;
}
const DIST = path.resolve(projectRoot, String(arg('dist', './dist')));
const SETTLE_MS = Number(arg('settle', 1200));
const MAX_DETAIL = Number(arg('max-detail', 1000));
const DISCOVER_DETAIL = arg('no-detail', false) === false;
const PORT = Number(arg('port', 0)) || 0; // 0 = random free port

// Keep in sync with src/data/pageSeo.ts -> STATIC_PRERENDER_ROUTES
const STATIC_ROUTES = [
  '/',
  '/kampanyalar',
  '/katilim-firmalari',
  '/sektor-haberleri',
  '/blog',
  '/iletisim',
  '/hakkimizda',
];

// Routes whose anchor links should be followed to prerender detail pages.
const DETAIL_RE = /^\/(blog|sektor-haberleri|katilim-firmalari|kampanyalar)\/[^/?#]+$/;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.map': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};

// ---- static server (serves real assets, falls back to the SPA shell) -------
function startServer(distDir, shellHtml) {
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = path.normalize(path.join(distDir, urlPath));
      if (!filePath.startsWith(distDir)) { res.writeHead(403); return res.end('forbidden'); }
      if (existsSync(filePath) && statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      const ext = path.extname(filePath);
      if (ext && ext !== '.html') {
        if (existsSync(filePath)) {
          res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
          return res.end(await readFile(filePath));
        }
        res.writeHead(404); return res.end('not found');
      }
      // Any HTML route: always serve the SPA shell so the client router renders it.
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(shellHtml);
    } catch (e) {
      res.writeHead(500); res.end('error: ' + e.message);
    }
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

// ---- browser resolution ----------------------------------------------------
async function launchBrowser() {
  const execEnv = process.env.PRERENDER_EXECUTABLE_PATH;
  const core = await import('puppeteer-core').catch(() => null);
  const chromiumMod = await import('@sparticuz/chromium').catch(() => null);

  if (core && (execEnv || chromiumMod)) {
    const puppeteer = core.default || core;
    let executablePath = execEnv;
    let args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'];
    let headless = true;
    if (chromiumMod) {
      const chromium = chromiumMod.default || chromiumMod;
      try { chromium.setGraphicsMode = false; } catch { /* older versions */ }
      executablePath = execEnv || (await chromium.executablePath());
      args = [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'];
      headless = chromium.headless ?? true;
    }
    console.log(`[prerender] launching via puppeteer-core (${executablePath})`);
    return puppeteer.launch({ executablePath, args, headless });
  }

  const full = await import('puppeteer').catch(() => null);
  if (full) {
    const puppeteer = full.default || full;
    console.log('[prerender] launching via bundled puppeteer Chromium');
    return puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  }
  throw new Error('No Puppeteer available. Run `npm i -D puppeteer` or set PRERENDER_EXECUTABLE_PATH.');
}

// ---- helpers ---------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function outFileFor(route) {
  if (route === '/') return path.join(DIST, 'index.html');
  const clean = route.replace(/^\/+/, '').replace(/\/+$/, '');
  return path.join(DIST, clean, 'index.html');
}

async function renderRoute(page, baseUrl, route) {
  const url = baseUrl + route;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 }).catch((e) =>
    console.warn(`[prerender]   goto warn ${route}: ${e.message}`));
  // Wait until the app has painted meaningful text into #root.
  await page.waitForFunction(
    () => {
      const r = document.getElementById('root');
      return r && (r.innerText || '').trim().length > 40;
    },
    { timeout: 12000 },
  ).catch(() => console.warn(`[prerender]   (no content threshold reached for ${route})`));
  await sleep(SETTLE_MS); // let lazy chunks + late data settle

  // Mark the snapshot so the client hands it off without hydration/flicker.
  await page.evaluate((rt) => {
    const r = document.getElementById('root');
    if (r) r.setAttribute('data-prerendered', rt);

    // Runtime marketing tags are loaded after first paint. If they happen to run
    // inside the prerender browser, do not bake their injected scripts into the
    // static HTML; the client loader in index.html will add them at runtime.
    document.querySelectorAll('script[src]').forEach((script) => {
      const src = script.getAttribute('src') || '';
      if (/googletagmanager|googlesyndication|doubleclick|googleads/i.test(src)) {
        script.remove();
      }
    });
    document.querySelectorAll('link[rel="modulepreload"]').forEach((link) => {
      link.remove();
    });
    document.querySelectorAll('.adsbygoogle, [data-ad-client], iframe[src*="doubleclick"], iframe[src*="googleads"]').forEach((node) => {
      node.remove();
    });
  }, route);

  const html = await page.evaluate(() => '<!DOCTYPE html>\n' + document.documentElement.outerHTML);
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href') || ''));
  const textLen = await page.evaluate(() => (document.getElementById('root')?.innerText || '').trim().length);
  return { html, links, textLen };
}

// ---- main ------------------------------------------------------------------
async function main() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    throw new Error(`No index.html in ${DIST}. Run "vite build" first.`);
  }
  const shellHtml = await readFile(path.join(DIST, 'index.html'), 'utf8');
  // Idempotency: if dist/index.html was already prerendered (re-run without a
  // fresh build), reset #root to an empty shell so snapshots never nest.
  const cleanShell = shellHtml.replace(/(<div id="root")[^>]*>[\s\S]*<\/div>([\s\S]*?<\/body>)/i, '$1></div>$2');

  // The SPA fallback uses index.html (see public/.htaccess); index.tsx is
  // route-aware and clears the home snapshot when it is served for another route.
  const server = await startServer(DIST, cleanShell);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[prerender] serving ${DIST} at ${baseUrl}`);

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });

  const queue = [...STATIC_ROUTES];
  const done = new Set();
  const results = [];
  let detailCount = 0;

  while (queue.length) {
    const route = queue.shift();
    if (done.has(route)) continue;
    done.add(route);
    process.stdout.write(`[prerender] → ${route} ... `);
    const { html, links, textLen } = await renderRoute(page, baseUrl, route);
    const outFile = outFileFor(route);
    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, html, 'utf8');
    results.push({ route, textLen, bytes: Buffer.byteLength(html) });
    console.log(`ok (${textLen} chars text, ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);

    if (DISCOVER_DETAIL) {
      for (const href of links) {
        if (!href) continue;
        let p = href;
        try { if (/^https?:\/\//i.test(href)) p = new URL(href).pathname; } catch { continue; }
        p = p.replace(/[?#].*$/, '').replace(/\/+$/, '');
        if (DETAIL_RE.test(p) && !done.has(p) && !queue.includes(p) && detailCount < MAX_DETAIL) {
          queue.push(p);
          detailCount++;
        }
      }
    }
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  console.log('\n[prerender] summary');
  console.log('  routes prerendered :', results.length);
  console.log('  detail pages found :', detailCount);
  const thin = results.filter((r) => r.textLen < 200);
  for (const r of results) {
    console.log(`   ${r.textLen.toString().padStart(6)} chars  ${r.route}`);
  }
  if (thin.length) {
    console.warn('  ⚠ thin pages (<200 chars):', thin.map((t) => t.route).join(', '));
  }
  console.log('[prerender] done.');
}

main().catch((e) => {
  console.error('[prerender] FAILED:', e);
  process.exit(1);
});
