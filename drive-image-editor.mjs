#!/usr/bin/env node
// E2E drive of the new admin image editor: login → builder-options → open
// Lapel field → edit first option's real photo → crop → Apply & Save.
import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'fs/promises';
import { join } from 'path';

const BASE = 'http://localhost:3000';
const EDGE = String.raw`C:\Users\ChaseStanley\.cache\puppeteer\chrome\win64-149.0.7827.22\chrome-win64\chrome.exe`;
const SHOTS_DIR = String.raw`C:\Users\ChaseStanley\Downloads\files\temporary screenshots`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shotPath(label) {
  await mkdir(SHOTS_DIR, { recursive: true });
  let files = [];
  try { files = await readdir(SHOTS_DIR); } catch {}
  const nums = files.filter((f) => /^screenshot-\d+/.test(f))
    .map((f) => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0'));
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return join(SHOTS_DIR, `screenshot-${n}-${label}.png`);
}

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000 });
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 200)); });

// 1. login
await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(2000);
const pw = await page.$('input[type="password"]');
if (pw) {
  await pw.type(process.env.ADMIN_PASSWORD || 'blessed2026');
  await page.keyboard.press('Enter');
  await sleep(5000);
}
console.log('after login url:', page.url());

// 2. builder-options (retry: the login redirect can abort the first goto)
for (let i = 0; i < 3; i++) {
  try {
    await page.goto(`${BASE}/admin/builder-options`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    break;
  } catch (e) {
    console.log('goto retry', i + 1, e.message.slice(0, 60));
    await sleep(2000);
  }
}
await sleep(3500);

// 3. expand the "Lapel Style" field
const expanded = await page.evaluate(() => {
  const heads = [...document.querySelectorAll('div.cursor-pointer')];
  const h = heads.find((x) => x.textContent.includes('Lapel Style'));
  if (h) { h.click(); return true; }
  return false;
});
console.log('lapel field expanded:', expanded);
await sleep(1500);

// 4. open the editor on the first option's Real slot
const opened = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button[title="Edit real photo"]')][0];
  if (b) { b.scrollIntoView({ block: 'center' }); b.click(); return true; }
  return false;
});
console.log('editor opened:', opened);
await sleep(3000);

let p = await shotPath('image-editor-open');
await page.screenshot({ path: p });
console.log('shot:', p);

// 5. drag a crop inside the ReactCrop image to set completedCrop
const box = await page.evaluate(() => {
  const img = document.querySelector('.ReactCrop img');
  if (!img) return null;
  const r = img.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
console.log('crop img box:', JSON.stringify(box));
if (box) {
  await page.mouse.move(box.x + box.w * 0.2, box.y + box.h * 0.2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.w * 0.8, box.y + box.h * 0.75, { steps: 12 });
  await page.mouse.up();
  await sleep(800);
}

// bump saturation slider to test adjustments
await page.evaluate(() => {
  const s = document.querySelector('input[aria-label="Saturation"]');
  if (s) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(s, '125');
    s.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
await sleep(600);

p = await shotPath('image-editor-cropped');
await page.screenshot({ path: p });
console.log('shot:', p);

// library results count (search is pre-filled with the option id)
const libCount = await page.evaluate(() => {
  const rail = [...document.querySelectorAll('p')].find((x) => x.textContent.trim() === 'Library')?.parentElement;
  return rail ? rail.querySelectorAll('button img').length : -1;
});
console.log('library thumbnails for option id:', libCount);

if (process.env.SKIP_APPLY === '1') {
  const p2 = await shotPath('image-editor-library');
  await page.screenshot({ path: p2 });
  console.log('shot:', p2);
  await browser.close();
  process.exit(0);
}

// 6. Apply & Save
const applied = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith('Apply & Save') && !x.disabled);
  if (b) { b.click(); return true; }
  return false;
});
console.log('apply clicked:', applied);
await sleep(3000);

const toast = await page.evaluate(() => {
  const t = [...document.querySelectorAll('div')].find((x) => x.textContent.trim() === 'Image updated ✓');
  return t ? t.textContent.trim() : null;
});
console.log('toast:', toast);

p = await shotPath('image-editor-saved');
await page.screenshot({ path: p });
console.log('shot:', p);

await browser.close();
