#!/usr/bin/env node
/**
 * Blessed & Dressed — run-app driver
 *
 * Usage:
 *   node driver.mjs [url]            Screenshot one URL (default: homepage)
 *   node driver.mjs smoke            Screenshot all key pages, print status table
 *   node driver.mjs check            Check server health only (no browser)
 *
 * Screenshots land in:
 *   C:\Users\ChaseStanley\Downloads\files\temporary screenshots\
 *
 * Requires the dev server to already be running:
 *   npm run dev  (inside blessed-dressed/)
 */

import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3000';
const EDGE = String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`;
const SHOTS_DIR = String.raw`C:\Users\ChaseStanley\Downloads\files\temporary screenshots`;

// ── Key pages to check in smoke mode ─────────────────────────────
const SMOKE_URLS = [
  ['/', 'homepage'],
  ['/builder/suit-2pc', 'builder-suit-2pc'],
  ['/builder/suit-3pc', 'builder-suit-3pc'],
  ['/builder/shirt', 'builder-shirt'],
  ['/builder/sport-coat', 'builder-sport-coat'],
  ['/products', 'ready-to-wear'],
  ['/products/r1', 'product-detail'],
  ['/accessories', 'accessories'],
  ['/fabric-book', 'fabric-book'],
  ['/collections', 'collections'],
  ['/cart', 'cart'],
  ['/admin/login', 'admin-login'],
];

// ── Helpers ───────────────────────────────────────────────────────
async function serverOk(port = 3000) {
  return new Promise(resolve => {
    http.get(`http://localhost:${port}/`, res => resolve(res.statusCode < 400))
      .on('error', () => resolve(false));
  });
}

async function nextScreenshotPath(label = '') {
  await mkdir(SHOTS_DIR, { recursive: true });
  let files = [];
  try { files = await readdir(SHOTS_DIR); } catch {}
  const nums = files
    .filter(f => /^screenshot-\d+/.test(f))
    .map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0'));
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  const name = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
  return join(SHOTS_DIR, name);
}

async function shot(page, url, label) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 20000 });
  const p = await nextScreenshotPath(label);
  await page.screenshot({ path: p, fullPage: true });
  return p;
}

async function launchBrowser() {
  return puppeteer.launch({
    executablePath: EDGE,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
}

// ── Commands ──────────────────────────────────────────────────────
const cmd = process.argv[2] || '/';

async function check() {
  const up3000 = await serverOk(3000);
  const up3001 = await serverOk(3001);
  if (up3000) { console.log('✓ Server UP at http://localhost:3000'); process.exit(0); }
  if (up3001) { console.log('✓ Server UP at http://localhost:3001 (fallback port)'); process.exit(0); }
  console.log('✗ Server DOWN. Run:  npm run dev  inside the blessed-dressed directory.');
  process.exit(1);
}

async function smoke() {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const results = [];
  for (const [url, label] of SMOKE_URLS) {
    try {
      const p = await shot(page, url, label);
      results.push({ url, label, ok: true, path: p });
      console.log(`  ✓ ${url} → ${p}`);
    } catch (e) {
      results.push({ url, label, ok: false, error: e.message });
      console.log(`  ✗ ${url}  ERROR: ${e.message}`);
    }
  }
  await browser.close();
  const pass = results.filter(r => r.ok).length;
  console.log(`\n${pass}/${results.length} pages OK`);
}

async function single(url) {
  const path = url.startsWith('/') ? url : `/${url}`;
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const p = await shot(page, path, '');
  await browser.close();
  console.log(`Screenshot saved: ${p}`);
}

// ── Dispatch ──────────────────────────────────────────────────────
if (cmd === 'check') {
  await check();
} else if (cmd === 'smoke') {
  if (!(await serverOk())) { console.error('Server not running. Start it first.'); process.exit(1); }
  await smoke();
} else {
  if (!(await serverOk())) { console.error('Server not running. Start it first.'); process.exit(1); }
  await single(cmd);
}
