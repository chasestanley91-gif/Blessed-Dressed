#!/usr/bin/env node
// build_grading_batches.mjs — select the next legacy photographs worth grading and
// write them out as agent-ready batch files.
//
// WHY THIS EXISTS. Legacy grading is the highest-value free work left on this
// project: 27.9% of the 61 images graded so far are WRONG, i.e. showing customers
// a photograph of something other than the option they are choosing. The
// selection logic had lived only in ad-hoc shell commands, so every session
// rebuilt it and risked rebuilding it differently.
//
// WHAT IT SELECTS, and why each filter is there:
//
//   inScope && shipped        only options the catalog actually serves to a customer
//   && !pipeline              legacy rows only — anything with a pipeline record is
//                             already governed by QC and must not be graded as legacy
//   && illustration           a verdict needs a drawing to judge against
//   && blueprintUses <= 3     if one drawing backs 30 options, a verdict on any one
//                             of them says nothing about whether the PHOTO is right —
//                             the drawing cannot disambiguate them in the first place.
//                             Those are a source problem; see collision_triage.mjs.
//   && not already graded     from public/images/reports/legacy-visual-audit.json
//   && not in flight          from any existing batch file in the out directory
//
// Then it DEDUPES BY SHIPPED FILE HASH: 352 distinct photographs cover 704 catalog
// rows, so grading per row would re-grade the same image up to six times.
//
// Usage:
//   node tools/build_grading_batches.mjs                       # 12 per product, report only
//   node tools/build_grading_batches.mjs --size 12 --write     # write batch files
//   node tools/build_grading_batches.mjs --product trousers --size 20 --write
//   node tools/build_grading_batches.mjs --out <dir>           # default: ./.grading-batches

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const SIZE = Number(arg('--size', 12));
const ONLY = arg('--product', null);
const OUT = path.resolve(arg('--out', path.join(ROOT, '.grading-batches')));
const WRITE = argv.includes('--write');

const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/images/reports/repo-index.json'), 'utf8'));

// already graded
const ledgerPath = path.join(ROOT, 'public/images/reports/legacy-visual-audit.json');
const graded = new Set();
if (fs.existsSync(ledgerPath)) {
  for (const r of JSON.parse(fs.readFileSync(ledgerPath, 'utf8')).rows) graded.add(r.option.split('/').pop());
}

// in flight — any option already sitting in a batch file we previously wrote
const inFlight = new Set();
if (fs.existsSync(OUT)) {
  for (const f of fs.readdirSync(OUT)) {
    if (!f.endsWith('.json')) continue;
    try { for (const o of JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'))) inFlight.add(o.option); } catch { /* ignore */ }
  }
}

// how many in-scope options each drawing backs
const bpUses = new Map();
for (const r of idx.records) {
  if (r.inScope && r.illustration) bpUses.set(r.illustration, (bpUses.get(r.illustration) || 0) + 1);
}

const eligible = idx.records.filter((r) => r.inScope && r.shipped && r.illustration && !r.pipeline
  && !graded.has(r.option) && !inFlight.has(r.option) && (bpUses.get(r.illustration) || 0) <= 3);

// one entry per DISTINCT shipped photograph
const byPhoto = new Map();
for (const r of eligible) {
  const k = r.shippedSha1 || r.shippedPath;
  if (byPhoto.has(k)) { byPhoto.get(k).rows += 1; continue; }
  byPhoto.set(k, {
    product: r.product, field: r.field, option: r.option, label: r.label,
    illustration: r.illustration, shippedPath: r.shippedPath, rows: 1,
  });
}
// highest fan-out first: one verdict there settles the most catalog rows
const queue = [...byPhoto.values()].sort((a, b) => b.rows - a.rows);

const byProduct = new Map();
for (const q of queue) {
  if (ONLY && q.product !== ONLY) continue;
  if (!byProduct.has(q.product)) byProduct.set(q.product, []);
  byProduct.get(q.product).push(q);
}

console.log(`\nbuild_grading_batches — ${queue.length} distinct photographs eligible`);
console.log(`  ${graded.size} already graded · ${inFlight.size} already in a batch file · dedup ${eligible.length} rows -> ${queue.length} photos\n`);

let written = 0;
if (WRITE) fs.mkdirSync(OUT, { recursive: true });
for (const [product, list] of [...byProduct].sort((a, b) => b[1].length - a[1].length)) {
  const batch = list.slice(0, SIZE);
  const covers = batch.reduce((s, b) => s + b.rows, 0);
  console.log(`  ${product.padEnd(11)} ${String(list.length).padStart(4)} eligible   next batch ${batch.length} photos covering ${covers} catalog rows`);
  if (WRITE && batch.length) {
    const p = path.join(OUT, `${product}-${Date.now().toString(36)}.json`);
    fs.writeFileSync(p, JSON.stringify(batch.map(({ rows, ...b }) => b), null, 1));
    console.log(`      -> ${path.relative(ROOT, p).split(path.sep).join('/')}`);
    written += 1;
  }
}
if (!WRITE) console.log('\n  (report only — pass --write to emit batch files)');
else console.log(`\n  ${written} batch file(s) written to ${path.relative(ROOT, OUT).split(path.sep).join('/')}/`);
console.log('\n  Hand a batch file to a grading agent, then log its verdicts with:');
console.log('    node tools/log_legacy_audit.mjs <verdicts.json>');
