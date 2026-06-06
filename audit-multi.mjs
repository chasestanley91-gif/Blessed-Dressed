import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';
import http from 'http';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SHOTS_DIR = 'C:\\Users\\ChaseStanley\\Downloads\\files\\temporary screenshots';
const BASE = 'http://localhost:3000';
const DEBUG_PORT = 9299;
const USER_DATA = 'C:\\Temp\\edge-audit-session2';

const PAGES = [
  ['/builder', 'builder-landing'],
  ['/builder/suit-2pc', 'builder-suit'],
  ['/builder/shirt', 'builder-shirt'],
  ['/cart', 'cart-empty'],
  ['/checkout', 'checkout-empty'],
  ['/consultation', 'consultation-form'],
  ['/products', 'rtw-products'],
  ['/products/r1', 'product-detail'],
  ['/fabric-book', 'fabric-book'],
  ['/accessories', 'accessories'],
];

async function nextPath(label) {
  await mkdir(SHOTS_DIR, { recursive: true });
  let files = [];
  try { files = await readdir(SHOTS_DIR); } catch {}
  const nums = files.filter(f => /^screenshot-\d+/.test(f))
    .map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0'));
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return join(SHOTS_DIR, `screenshot-${n}-${label}.png`);
}

function getJson(port, path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${path}`, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForPort(port, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try { await getJson(port, '/json/version'); return; } catch {}
    await sleep(300);
  }
  throw new Error(`Port ${port} not ready`);
}

async function run() {
  const edgeProc = spawn(EDGE, [
    `--headless=chrome`,
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    `--no-sandbox`,
    `--disable-gpu`,
    `about:blank`,
  ], { stdio: 'ignore', detached: false });

  edgeProc.on('error', e => console.error('Edge error:', e.message));

  try {
    await waitForPort(DEBUG_PORT);
    const version = await getJson(DEBUG_PORT, '/json/version');
    const browser = await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl });
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    for (const [route, label] of PAGES) {
      const url = BASE + route;
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
        const p = await nextPath(label);
        await page.screenshot({ path: p, fullPage: true });
        console.log(`  ✓ ${route} → ${p}`);
      } catch (e) {
        console.log(`  ✗ ${route}: ${e.message}`);
      }
    }

    // Mobile viewport pass for key pages
    await page.setViewport({ width: 375, height: 812 });
    const mobilePaths = [['/', 'mobile-home'], ['/builder/shirt', 'mobile-builder'], ['/checkout', 'mobile-checkout']];
    for (const [route, label] of mobilePaths) {
      const url = route === '/' ? BASE : BASE + route;
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
        const p = await nextPath(label);
        await page.screenshot({ path: p, fullPage: true });
        console.log(`  ✓ mobile ${route} → ${p}`);
      } catch (e) {
        console.log(`  ✗ mobile ${route}: ${e.message}`);
      }
    }

    await browser.disconnect();
  } finally {
    edgeProc.kill();
  }
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
