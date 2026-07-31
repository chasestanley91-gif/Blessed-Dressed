#!/usr/bin/env node
// Drive /builder/suit-2pc to the Design step and verify the localized
// Higgsfield jacket photos render. Reuses the run-app driver's launch pattern.
import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'fs/promises';
import { join } from 'path';

const BASE = 'http://localhost:3000';
const EDGE = String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`;
const SHOTS_DIR = String.raw`C:\Users\ChaseStanley\Downloads\files\temporary screenshots`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nextScreenshotPath(label) {
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
await page.setViewport({ width: 1440, height: 1000 });

await page.goto(`${BASE}/builder/suit-2pc`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(4000);

// Fabric step → quiz
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Continue' && x.offsetParent);
  if (b) b.click();
});
await sleep(2000);

// answer every quiz question: click the first option under each "N of M" header
const answered = await page.evaluate(() => {
  const out = [];
  const headers = [...document.querySelectorAll('*')]
    .filter((e) => e.children.length === 0 && /^\d+\s*of\s*\d+$/i.test((e.textContent || '').trim()));
  for (const h of headers) {
    const hy = h.getBoundingClientRect().top + window.scrollY;
    const opt = [...document.querySelectorAll('button')]
      .filter((b) => b.offsetParent)
      .map((b) => ({ b, y: b.getBoundingClientRect().top + window.scrollY }))
      .filter((x) => x.y > hy && x.y < hy + 260)
      .sort((a, z) => a.y - z.y)[0];
    if (opt) { opt.b.click(); out.push(`${h.textContent.trim()}: ${opt.b.textContent.trim().slice(0, 30)}`); }
  }
  return out;
});
console.log('answered:', answered.length, 'questions');
await sleep(800);

// quiz → Design step
const cta = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /continue to design|build my garment/i.test(x.textContent.trim()) && x.offsetParent && !x.disabled);
  if (b) { b.click(); return b.textContent.trim(); }
  return null;
});
console.log('cta:', cta);
await sleep(3500);

// open the Lapel section tab (exact label, not a quiz option)
const tab = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().toLowerCase() === 'lapel' && x.offsetParent);
  if (b) { b.click(); return true; }
  return false;
});
console.log('lapel tab clicked:', tab);
await sleep(2500);

// verify the generated jacket images actually rendered
const imgReport = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter((i) => i.src.includes('/images/generated/'));
  return {
    total: imgs.length,
    jacket: imgs.filter((i) => i.src.includes('/generated/jacket/')).length,
    broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
    sample: imgs.slice(0, 3).map((i) => new URL(i.src).pathname),
  };
});
console.log('generated images on page:', JSON.stringify(imgReport, null, 2));

const p = await nextScreenshotPath('design-lapel-local');
await page.screenshot({ path: p, fullPage: false });
console.log('Screenshot saved:', p);
await browser.close();
