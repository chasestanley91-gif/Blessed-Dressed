#!/usr/bin/env node
/**
 * fetch_baoxiniao_labels.mjs — pull English value-labels for the supplier's
 * craft fields, so option images can be mapped to catalog options by EVIDENCE
 * rather than by guessing the order of bare codes (A, B, C…).
 *
 * Background
 * ----------
 * The original capture saved craft values as codes with no label, which is why
 * 7,224 downloaded supplier images could never be wired into the catalog.
 * `/eis/customTemp/getZlProperListByLanguageAndFieldName` returns
 * `{fieldname, value, detail, fname}` — code -> English label — and that closes
 * the gap.
 *
 * It also revealed that the original capture used the WRONG category codes:
 *   BB = Men's suit jackets   (correct)
 *   BD = Men's trousers       (correct)
 *   BC = Men's Long Sleeve Shirt   — the old run used BS, which is OVERCOAT
 *   BM = Men's vests               — the old run used BV, not a category at all
 *
 * Runs in the logged-in browser context so the session cookie and any CSRF
 * handling come along for free. Read-only: it reads dictionaries and places
 * no order.
 *
 * Usage (credentials live in .env.local, gitignored):
 *   node tools/fetch_baoxiniao_labels.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'factory-screenshots', 'baoxiniao-capture');
const BASE = 'https://mtm.baoxiniao.co';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

function fromEnvFile(key) {
  for (const name of ['.env.local', '.env']) {
    const p = path.join(REPO, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '');
    }
  }
  return undefined;
}
const USER = process.env.FACTORY_USER ?? fromEnvFile('FACTORY_USER');
const PASS = process.env.FACTORY_PASS ?? fromEnvFile('FACTORY_PASS');
if (!USER || !PASS) { console.error('Set FACTORY_USER / FACTORY_PASS in .env.local'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Every craft field code the existing image manifest references. */
function fieldCodes() {
  const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'factory-screenshots', 'all-manifests.json'), 'utf8'));
  const codes = new Set();
  for (const rows of Object.values(manifest)) for (const r of rows) if (r.field) codes.add(r.field);
  return [...codes].sort();
}

async function main() {
  const codes = fieldCodes();
  console.log(`craft field codes to resolve: ${codes.length}`);

  const browser = await puppeteer.launch({
    executablePath: EDGE, headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 900 },
  });
  const page = await browser.newPage();

  await page.goto(`${BASE}/eis/login`, { waitUntil: 'networkidle2', timeout: 60_000 });
  await page.type('input[type="text"]', USER, { delay: 15 });
  await page.type('input[type="password"]', PASS, { delay: 15 });
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }).catch(() => {});
  await sleep(2500);
  if (/login/i.test(page.url())) { console.error('login failed'); await browser.close(); process.exit(1); }
  console.log('logged in:', page.url());

  // Probe the calling convention once, then reuse whichever shape works.
  const probe = await page.evaluate(async (base) => {
    // 405 on GET => POST only. 415 on form-encoding => it wants JSON.
    const J = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const U = `${base}/eis/customTemp/getZlProperListByLanguageAndFieldName`;
    const attempts = [
      { how: 'POST json fieldName+language', url: U, init: J({ fieldName: 'MTYPA', language: 'E' }) },
      { how: 'POST json fieldname+spras', url: U, init: J({ fieldname: 'MTYPA', spras: 'E' }) },
      { how: 'POST json fieldName only', url: U, init: J({ fieldName: 'MTYPA' }) },
      { how: 'POST json array', url: U, init: J(['MTYPA']) },
      { how: 'POST json fieldNames array', url: U, init: J({ fieldNames: ['MTYPA'], language: 'E' }) },
    ];
    const out = [];
    for (const a of attempts) {
      try {
        const r = await fetch(a.url, { ...a.init, credentials: 'include' });
        const t = await r.text();
        out.push({ how: a.how, status: r.status, len: t.length, sample: t.slice(0, 160) });
      } catch (e) { out.push({ how: a.how, error: String(e).slice(0, 120) }); }
    }
    return out;
  }, BASE);

  console.log('\ncalling-convention probe:');
  for (const p of probe) console.log(' ', JSON.stringify(p));

  const working = probe.find((p) => p.status === 200 && p.len > 200);
  if (!working) {
    console.log('\nNo convention returned data. Saving probe for analysis; not guessing further.');
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'label-endpoint-probe.json'), JSON.stringify(probe, null, 2) + '\n');
    await browser.close();
    process.exit(2);
  }
  console.log('\nusing:', working.how);

  const labels = await page.evaluate(async (base, codeList, how) => {
    const U = `${base}/eis/customTemp/getZlProperListByLanguageAndFieldName`;
    const J = (body) => ({ url: U, init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } });
    const build = (code) =>
      how.includes('fieldName+language') ? J({ fieldName: code, language: 'E' })
        : how.includes('fieldname+spras') ? J({ fieldname: code, spras: 'E' })
          : how.includes('fieldName only') ? J({ fieldName: code })
            : how.includes('json array') ? J([code])
              : J({ fieldNames: [code], language: 'E' });

    const result = {};
    for (const code of codeList) {
      try {
        const a = build(code);
        const r = await fetch(a.url, { ...a.init, credentials: 'include' });
        const j = await r.json();
        const rows = j.data ?? j;
        if (Array.isArray(rows) && rows.length) {
          result[code] = rows.map((x) => ({ value: x.value, label: x.detail, field: x.fname, group: x.fgroup, order: x.disord }));
        }
      } catch { /* leave unresolved */ }
    }
    return result;
  }, BASE, codes, working.how);

  const resolved = Object.keys(labels).length;
  const values = Object.values(labels).reduce((n, v) => n + v.length, 0);
  console.log(`\nresolved ${resolved}/${codes.length} field codes, ${values} labelled values`);

  fs.mkdirSync(OUT, { recursive: true });
  const dest = path.join(OUT, 'craft-labels.json');
  fs.writeFileSync(dest, JSON.stringify({ generatedAt: new Date().toISOString(), source: 'getZlProperListByLanguageAndFieldName', convention: working.how, fields: labels }, null, 2) + '\n', 'utf8');
  console.log('->', path.relative(REPO, dest).split(path.sep).join('/'));

  await browser.close();
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
