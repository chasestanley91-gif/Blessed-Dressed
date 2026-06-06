import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';
import http from 'http';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SHOTS_DIR = 'C:\\Users\\ChaseStanley\\Downloads\\files\\temporary screenshots';
const BASE = 'http://localhost:3000';
const DEBUG_PORT = 9299;
const USER_DATA = 'C:\\Temp\\edge-audit-session';

async function nextPath(label) {
  await mkdir(SHOTS_DIR, { recursive: true });
  let files = [];
  try { files = await readdir(SHOTS_DIR); } catch {}
  const nums = files.filter(f => /^screenshot-\d+/.test(f))
    .map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0'));
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return join(SHOTS_DIR, label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`);
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
  const route = process.argv[2] || '/';
  const label = process.argv[3] || '';
  const width = parseInt(process.argv[4] || '1280');
  const height = parseInt(process.argv[5] || '900');
  const url = route.startsWith('http') ? route : BASE + (route === '/' ? '' : route);

  const edgeProc = spawn(EDGE, [
    `--headless=chrome`,
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    `--no-sandbox`,
    `--disable-gpu`,
    `about:blank`,
  ], { stdio: 'ignore', detached: false });

  edgeProc.on('error', e => { console.error('Edge error:', e); });

  try {
    await waitForPort(DEBUG_PORT);

    // Get the WebSocket URL from the version endpoint
    const version = await getJson(DEBUG_PORT, '/json/version');
    console.log('Edge connected. WS:', version.webSocketDebuggerUrl);

    const browser = await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl });

    // Use the existing page rather than creating a new one
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    await page.setViewport({ width, height });

    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });

    const p = await nextPath(label);
    await page.screenshot({ path: p, fullPage: true });
    await browser.disconnect();

    console.log(`Screenshot saved: ${p}`);
  } finally {
    edgeProc.kill();
  }
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
