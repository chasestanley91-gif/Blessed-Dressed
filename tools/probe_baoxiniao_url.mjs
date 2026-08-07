#!/usr/bin/env node
/**
 * probe_baoxiniao_url.mjs — check which supplier image URLs actually resolve
 * for a category, before committing to a bulk download.
 *
 * The measurement-adjustment fields (ADJ*) carry no drawing, so probing the
 * first few codes alphabetically says nothing useful. This probes the fields
 * that visibly have artwork (collar, cuff, pocket, placket) and reports the
 * real status and content-type.
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://mtm.baoxiniao.co';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const CATEGORY = arg('category', 'BC').toUpperCase();
const SAMPLE = Number(arg('sample', '25'));

function fromEnvFile(key) {
  for (const line of fs.readFileSync(path.join(REPO, '.env.local'), 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '');
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function head(url, cookie) {
  return new Promise((resolve) => {
    https.get(url, { headers: { Cookie: cookie, Referer: BASE } }, (res) => {
      const ct = res.headers['content-type'] ?? '';
      const len = res.headers['content-length'] ?? '?';
      res.resume();
      resolve({ status: res.statusCode, ct, len });
    }).on('error', (e) => resolve({ status: 0, ct: e.message, len: '?' }));
  });
}

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(`${BASE}/eis/login`, { waitUntil: 'networkidle2', timeout: 60_000 });
await page.type('input[type="text"]', fromEnvFile('FACTORY_USER'), { delay: 15 });
await page.type('input[type="password"]', fromEnvFile('FACTORY_PASS'), { delay: 15 });
await page.keyboard.press('Enter');
await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }).catch(() => {});
await sleep(2000);
const cookie = (await page.cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
await browser.close();

const { fields } = JSON.parse(fs.readFileSync(path.join(REPO, 'data-store', 'supplier', `craft-labels-${CATEGORY}.json`), 'utf8'));

// Prefer fields whose label suggests visible construction.
const VISUAL = /collar|cuff|pocket|placket|lapel|vent|pleat|hem|button|stitch|yoke|shoulder|front|back/i;
const ranked = Object.entries(fields).sort((a, b) => {
  const av = VISUAL.test(a[1].fieldLabel) ? 0 : 1;
  const bv = VISUAL.test(b[1].fieldLabel) ? 0 : 1;
  return av - bv;
});

console.log(`probing ${CATEGORY} — ${SAMPLE} urls, visual fields first\n`);
let hits = 0, n = 0;
for (const [code, f] of ranked) {
  for (const v of (f.values ?? []).slice(0, 2)) {
    if (n >= SAMPLE) break;
    n += 1;
    const url = `${BASE}/mtmstorage/images/measure/${CATEGORY}/${code}/${code}${CATEGORY}${v.code}.jpg`;
    const r = await head(url, cookie);
    const good = r.status === 200 && /image/i.test(r.ct);
    if (good) hits += 1;
    console.log(`${good ? 'OK  ' : '--  '} ${String(r.status).padEnd(4)} ${String(r.ct).slice(0, 24).padEnd(25)} ${code}/${v.code}  "${String(f.fieldLabel).slice(0, 28)}" -> ${String(v.label).slice(0, 26)}`);
  }
  if (n >= SAMPLE) break;
}
console.log(`\n${hits}/${n} resolved as images`);
