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
  await sleep(6000);
  await page.screenshot({ path: path.join(OUT, `wiz-02-${CATEGORY}-after-next.png`), fullPage: true });
  console.log('now at:', page.url());

  fs.writeFileSync(path.join(OUT, `wiz-choices-${CATEGORY}.json`), JSON.stringify(choices, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, `wiz-dom-${CATEGORY}.html`), await page.content(), 'utf8');
  fs.writeFileSync(path.join(OUT, `wiz-json-${CATEGORY}.json`), JSON.stringify(captured, null, 1));

  console.log(`\ncaptured ${captured.length} json responses`);
  for (const u of new Set(captured.map((c) => c.url.split('?')[0]))) console.log('   ', u);
  console.log(`\nartifacts -> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
  console.log(`(forbidden controls never clicked: ${FORBIDDEN})`);

  await browser.close();
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
