#!/usr/bin/env node
/**
 * download_baoxiniao_images.mjs — fetch supplier craft drawings for the CORRECT
 * garment category, with the English label recorded alongside every file.
 *
 * Replaces the original capture, which used the wrong category codes:
 *   shirt was scraped as BS  (BS is OVERCOAT; shirt is BC)
 *   vest  was scraped as BV  (not a category at all; vest is BM)
 * so roughly 5,000 of the 7,224 downloaded images sit under the wrong garment.
 * A wrong drawing is the most expensive kind of error here: QC scores fidelity
 * to the reference, so an overcoat drawing rendered faithfully onto a shirt
 * option scores WELL.
 *
 * Image URLs follow a fixed pattern, verified against a known-good file:
 *   /mtmstorage/images/measure/{MTYPB}/{FIELD}/{FIELD}{MTYPB}{VALUE}.jpg
 * so every code in data-store/supplier/craft-labels-<CAT>.json can be resolved
 * without touching the order wizard again.
 *
 * Usage (credentials from .env.local, gitignored):
 *   node tools/download_baoxiniao_images.mjs --category=BC [--limit=50]
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUPPLIER_DIR = path.join(REPO, 'data-store', 'supplier');
const OUT_ROOT = path.join(REPO, 'factory-screenshots', 'baoxiniao');
const BASE = 'https://mtm.baoxiniao.co';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const CATEGORY_PART = { BB: 'jacket', BC: 'shirt', BD: 'trousers', BM: 'vest' };

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const CATEGORY = arg('category', 'BC').toUpperCase();
const LIMIT = Number(arg('limit', '0')) || Infinity;

if (!CATEGORY_PART[CATEGORY]) { console.error(`--category must be one of ${Object.keys(CATEGORY_PART).join(', ')}`); process.exit(1); }

function fromEnvFile(key) {
  for (const name of ['.env.local', '.env']) {
    const p = path.join(REPO, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '');
    }
  }
}
const USER = process.env.FACTORY_USER ?? fromEnvFile('FACTORY_USER');
const PASS = process.env.FACTORY_PASS ?? fromEnvFile('FACTORY_PASS');
if (!USER || !PASS) { console.error('Set FACTORY_USER / FACTORY_PASS in .env.local'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safe = (s) => String(s).replace(/[^A-Za-z0-9_-]/g, '_');

/** JPEG/PNG magic bytes — the portal answers 200 with an HTML error page. */
function isImage(buf) {
  if (buf.length < 4) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8) return true;                     // jpg
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e) return true;  // png
  return false;
}

function fetchBuffer(url, cookie) {
  return new Promise((resolve) => {
    https.get(url, { headers: { Cookie: cookie, Referer: BASE }, rejectUnauthorized: true }, (res) => {
      if (res.statusCode !== 200) { res.resume(); resolve(null); return; }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(null));
  });
}

async function login() {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(`${BASE}/eis/login`, { waitUntil: 'networkidle2', timeout: 60_000 });
  await page.type('input[type="text"]', USER, { delay: 15 });
  await page.type('input[type="password"]', PASS, { delay: 15 });
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }).catch(() => {});
  await sleep(2000);
  const cookies = await page.cookies();
  await browser.close();
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

async function main() {
  const labelsPath = path.join(SUPPLIER_DIR, `craft-labels-${CATEGORY}.json`);
  if (!fs.existsSync(labelsPath)) { console.error(`missing ${labelsPath}`); process.exit(1); }
  const { fields } = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

  const jobs = [];
  for (const [field, f] of Object.entries(fields)) {
    for (const v of f.values ?? []) {
      jobs.push({ field, fieldLabel: f.fieldLabel, value: v.code, label: v.label });
    }
  }
  console.log(`${CATEGORY} (${CATEGORY_PART[CATEGORY]}): ${jobs.length} candidate images from ${Object.keys(fields).length} fields`);

  const cookie = await login();
  console.log('authenticated');

  const outDir = path.join(OUT_ROOT, CATEGORY);
  const manifest = [];
  let ok = 0, miss = 0, skipped = 0, i = 0;

  for (const job of jobs) {
    if (i >= LIMIT) break;
    i += 1;
    const url = `${BASE}/mtmstorage/images/measure/${CATEGORY}/${job.field}/${job.field}${CATEGORY}${job.value}.jpg`;
    const rel = path.join(CATEGORY, safe(job.field), `${safe(job.value)}.jpg`);
    const dest = path.join(OUT_ROOT, rel);

    if (fs.existsSync(dest)) {
      skipped += 1;
      manifest.push({ ...job, category: CATEGORY, part: CATEGORY_PART[CATEGORY], url, localPath: rel.split(path.sep).join('/') });
      continue;
    }

    const buf = await fetchBuffer(url, cookie);
    if (!buf || !isImage(buf)) { miss += 1; continue; }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    ok += 1;
    manifest.push({ ...job, category: CATEGORY, part: CATEGORY_PART[CATEGORY], url, localPath: rel.split(path.sep).join('/'), bytes: buf.length });

    if (ok % 100 === 0) console.log(`  ${ok} downloaded (${miss} not published, ${skipped} already present)`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const manifestPath = path.join(OUT_ROOT, `manifest-${CATEGORY}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    category: CATEGORY, part: CATEGORY_PART[CATEGORY],
    attempted: i, downloaded: ok, alreadyPresent: skipped, notPublished: miss,
    images: manifest,
  }, null, 2) + '\n', 'utf8');

  console.log(`\n${CATEGORY}: ${ok} downloaded · ${skipped} already present · ${miss} not published by the supplier`);
  console.log(`manifest -> ${path.relative(REPO, manifestPath).split(path.sep).join('/')}`);
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
