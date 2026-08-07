#!/usr/bin/env node
/**
 * capture_baoxiniao_crafts.mjs — walk the supplier's design wizard far enough
 * to capture the craft-option tree WITH English labels, for one category.
 *
 * The wizard opens on "Please select the clothing category" (no customer
 * required), so this reaches the craft step without touching customer records.
 * It never clicks a submit/confirm control — the goal is to read the tree.
 *
 * Correct category codes, from the supplier's own MTYPA dictionary:
 *   BB = Men's suit jackets · BC = Men's Long Sleeve Shirt
 *   BD = Men's trousers     · BM = Men's vests
 * (The earlier capture used BS = Overcoat for "shirt" and BV, which is not a
 * category at all — roughly 5,000 downloaded images sit under the wrong
 * garment as a result.)
 *
 * Usage — credentials come from .env.local (gitignored):
 *   node tools/capture_baoxiniao_crafts.mjs --category=Suit
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'factory-screenshots', 'baoxiniao-capture');
const BASE = 'https://mtm.baoxiniao.co';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const START = '/eis/measureOrder/international/personal/create_v3';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const CATEGORY = arg('category', 'Suit');

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
/** Controls that would place or confirm an order — never click these. */
const FORBIDDEN = /submit|confirm order|place order|pay|checkout|下单|提交/i;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: EDGE, headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1600, height: 1100 },
  });
  const page = await browser.newPage();
  const captured = [];
  page.on('response', async (res) => {
    const u = res.url();
    if (!u.includes('/eis/')) return;
    if (!(res.headers()['content-type'] ?? '').includes('json')) return;
    try { captured.push({ url: u, body: await res.json() }); } catch { /* ignore */ }
  });

  console.log('login…');
  await page.goto(`${BASE}/eis/login`, { waitUntil: 'networkidle2', timeout: 60_000 });
  await page.type('input[type="text"]', USER, { delay: 15 });
  await page.type('input[type="password"]', PASS, { delay: 15 });
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }).catch(() => {});
  await sleep(2000);

  await page.goto(BASE + START, { waitUntil: 'networkidle2', timeout: 60_000 });
  await sleep(3000);
  console.log('wizard:', page.url());

  // Every garment the wizard offers, as `<div value="CODE">Label</div>`.
  const choices = await page.evaluate(() =>
    [...document.querySelectorAll('div[onclick*="clickCategory"]')].map((el) => ({
      code: el.getAttribute('value') ?? '',
      label: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
    }))
  );
  console.log(`\nwizard offers ${choices.length} garments; the four we care about:`);
  for (const c of choices.filter((c) => ['BB', 'BC', 'BD', 'BM'].includes(c.code))) {
    console.log(`   ${c.code.padEnd(5)} ${c.label}`);
  }

  // Select the requested garment by CODE (not by label — labels repeat).
  const picked = await page.evaluate((code) => {
    const el = document.querySelector(`div[onclick*="clickCategory"][value="${code}"]`);
    if (!el) return false;
    el.click();
    return true;
  }, CATEGORY);
  console.log(`\nselected category ${CATEGORY}:`, picked);
  await sleep(1500);
  await page.screenshot({ path: path.join(OUT, `wiz-01-${CATEGORY}-selected.png`), fullPage: true });

  // Advance. "Next" is navigation, not submission — the forbidden list guards
  // anything that would actually place an order.
  // The real control is `<button onclick="App.gotoOrder()">Next</button>` —
  // navigation to the design step, not an order submission.
  const nextOk = await page.evaluate(() => {
    const btn = document.querySelector('button[onclick*="gotoOrder"]');
    if (!btn) return 'no-button';
    btn.click();
    return 'clicked';
  });
  console.log('clicked Next (App.gotoOrder):', nextOk);
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45_000 }).catch(() => {});
  await sleep(5000);

  // Step 1 is fabric selection; "Design details&Measure" only unlocks once a
  // fabric is chosen. Pick the first in-stock swatch. SUBMIT / CANCEL SUBMIT
  // live on this page and are never touched — only NEXT STEP, which is
  // navigation between wizard steps.
  // The swatch grid is loaded async by getFabricStock — wait for it, then pick
  // the first swatch that is actually in stock.
  await page.waitForSelector('[onclick*="selectFabric"]', { timeout: 45_000 }).catch(() => {});
  const fabric = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[onclick*="selectFabric"]')];
    if (!cards.length) return 'no-fabric-control';
    const inStock = cards.find((c) => !/no stock/i.test(c.textContent ?? '')) ?? cards[0];
    const code = inStock.getAttribute('data-code') ?? '?';
    inStock.click();
    return `selected ${code} (of ${cards.length} swatches)`;
  });
  console.log('fabric:', fabric);
  await sleep(5000);

  const nextStep = await page.evaluate((forbidden) => {
    const rx = new RegExp(forbidden, 'i');
    const el = [...document.querySelectorAll('a,button,div,span')].find((e) => {
      const t = (e.textContent ?? '').replace(/\s+/g, ' ').trim();
      return /^NEXT STEP$/i.test(t) && !rx.test(t);
    });
    if (!el) return 'not-found';
    el.click();
    return 'clicked';
  }, FORBIDDEN.source);
  console.log('clicked NEXT STEP:', nextStep);
  // getMergeZlcustomData is the last and heaviest call on this step (~4 MB);
  // poll for it rather than guessing a fixed wait.
  for (let i = 0; i < 30; i += 1) {
    if (captured.some((c) => c.body?.data?.map && Object.values(c.body.data.map).some((e) => Array.isArray(e?.valueList) && e.valueList.length))) break;
    await sleep(2000);
  }
  await sleep(3000);
  await page.screenshot({ path: path.join(OUT, `wiz-03-${CATEGORY}-design.png`), fullPage: true });

  // Ask the page itself for the craft tree, using its own loader.
  const viaApp = await page.evaluate(async () => {
    const A = window.App;
    if (!A) return { ok: false, why: 'no App' };
    const out = {};
    for (const key of ['partValueList', 'designData', 'partList', 'zlCustomList', 'propers']) {
      try { if (A[key] !== undefined) out[key] = A[key]; } catch { /* ignore */ }
    }
    return { ok: true, keys: Object.keys(out), data: out };
  });
  console.log('App state keys exposed:', viaApp.ok ? viaApp.keys.join(', ') || '(none)' : viaApp.why);
  if (viaApp.ok && viaApp.keys.length) {
    fs.writeFileSync(path.join(OUT, `wiz-appstate-${CATEGORY}.json`), JSON.stringify(viaApp.data, null, 1));
  }
  await sleep(6000);
  await page.screenshot({ path: path.join(OUT, `wiz-02-${CATEGORY}-after-next.png`), fullPage: true });
  console.log('now at:', page.url());

  fs.writeFileSync(path.join(OUT, `wiz-choices-${CATEGORY}.json`), JSON.stringify(choices, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, `wiz-dom-${CATEGORY}.html`), await page.content(), 'utf8');
  fs.writeFileSync(path.join(OUT, `wiz-json-${CATEGORY}.json`), JSON.stringify(captured, null, 1));

  // ── the payoff ──────────────────────────────────────────────────────────
  // getMergeZlcustomData.data.map is keyed by craft FIELD code; each entry's
  // valueList gives prope (value code) -> tprop (English label) and tprot
  // (field label). This is the code->label bridge that lets supplier drawings
  // be matched to catalog options by NAME instead of by guessing value order.
  // The endpoint differs by garment — jackets answer on getMergeZlcustomData,
  // trousers/shirts/vests on getZlmodListByModer — but the payload shape is
  // identical, so match on shape rather than on URL.
  const merged = captured.find((c) => c.body?.data?.map && Object.values(c.body.data.map).some((e) => Array.isArray(e?.valueList) && e.valueList.length));
  if (merged?.body?.data?.map) {
    console.log('craft tree came from:', merged.url.split('/').pop().split('?')[0]);
    const map = merged.body.data.map;
    const fields = {};
    let values = 0;
    for (const [code, entry] of Object.entries(map)) {
      const list = entry?.valueList;
      if (!Array.isArray(list) || !list.length) continue;
      fields[code] = {
        fieldLabel: list[0].tprot ?? '',
        values: list.map((v) => ({ code: v.prope, label: v.tprop })),
      };
      values += list.length;
    }
    const dest = path.join(OUT, `craft-labels-${CATEGORY}.json`);
    fs.writeFileSync(dest, JSON.stringify({
      generatedAt: new Date().toISOString(),
      category: CATEGORY,
      source: 'getMergeZlcustomData.data.map',
      fieldCount: Object.keys(fields).length,
      valueCount: values,
      fields,
    }, null, 2) + '\n', 'utf8');
    console.log(`\nCRAFT LABELS: ${Object.keys(fields).length} fields, ${values} labelled values -> ${path.basename(dest)}`);
  } else {
    console.log('\nWARNING: getMergeZlcustomData not captured — no labels extracted for', CATEGORY);
  }

  console.log(`\ncaptured ${captured.length} json responses`);
  for (const u of new Set(captured.map((c) => c.url.split('?')[0]))) console.log('   ', u);
  console.log(`\nartifacts -> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
  console.log(`(forbidden controls never clicked: ${FORBIDDEN})`);

  await browser.close();
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
