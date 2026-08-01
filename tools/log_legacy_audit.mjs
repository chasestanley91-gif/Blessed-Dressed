#!/usr/bin/env node
// log_legacy_audit.mjs — accumulate visual verdicts on LEGACY shipped images.
//
// These are NOT pipeline gradings and must not be logged as such. 857 rows are
// `legacy-shipped-unverified`: they carry no qc.json, no candidate, no prompt and
// no attempt history, because they predate the pipeline entirely. Writing them
// through log_qc_batch would fabricate an attempt that never happened and would
// require nine scores that a live-image audit does not produce.
//
// What a legacy audit DOES produce is narrower and honest: does the shipped photo
// depict the option its catalog row claims, judged against that row's blueprint.
// Three verdicts:
//
//   OK       the photo shows the drawn option and is distinguishable from siblings
//   WRONG    it depicts something else - a sibling option, a different garment,
//            or a feature count the drawing contradicts
//   UNSURE   the blueprint or the photo cannot settle it (records the reason;
//            never counted as either a pass or a failure)
//
// A WRONG verdict is a customer-facing defect on a LIVE image, so it goes to the
// regeneration queue. It does NOT unpublish anything on its own - the existing
// image keeps serving until a graded replacement passes QC, because an option
// with a wrong photo still beats an option with no photo.
//
// Usage:
//   node tools/log_legacy_audit.mjs <verdicts.json>   [--dry-run]
//   node tools/log_legacy_audit.mjs --report
//
// Input: array of { option, verdict, liveImage, confidence, why }
// where `option` is "product/optionId".

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LEDGER = path.join(ROOT, 'public/images/reports/legacy-visual-audit.json');
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const REPORT = argv.includes('--report');
const input = argv.find((a) => !a.startsWith('--'));

const load = () => (fs.existsSync(LEDGER)
  ? JSON.parse(fs.readFileSync(LEDGER, 'utf8'))
  : { updatedAt: null, rows: [] });

const ledger = load();

if (REPORT || !input) {
  const t = { OK: 0, WRONG: 0, UNSURE: 0 };
  for (const r of ledger.rows) t[r.verdict] = (t[r.verdict] || 0) + 1;
  const graded = ledger.rows.length;
  console.log(`\nlegacy visual audit — ${graded} option(s) graded\n`);
  for (const [k, v] of Object.entries(t)) {
    const pct = graded ? ((v / graded) * 100).toFixed(1) : '0.0';
    console.log(`  ${k.padEnd(8)} ${String(v).padStart(4)}   ${pct}%`);
  }
  const wrong = ledger.rows.filter((r) => r.verdict === 'WRONG');
  if (wrong.length) {
    console.log(`\n  --- LIVE images showing the wrong thing (${wrong.length}) — regeneration queue ---`);
    for (const r of wrong) {
      console.log(`\n  ${r.option}   [confidence: ${r.confidence || 'unstated'}]`);
      console.log(`    live: ${r.liveImage || '(unrecorded)'}`);
      console.log(`    ${(r.why || '').replace(/\s+/g, ' ').slice(0, 300)}`);
    }
  }
  const unsure = ledger.rows.filter((r) => r.verdict === 'UNSURE');
  if (unsure.length) {
    console.log(`\n  --- could not be settled (${unsure.length}) — neither pass nor fail ---`);
    for (const r of unsure) console.log(`  ${r.option}: ${(r.why || '').replace(/\s+/g, ' ').slice(0, 160)}`);
  }
  if (!REPORT && !input) console.log('\n(no input file given — report only)');
  process.exit(0);
}

const incoming = JSON.parse(fs.readFileSync(input, 'utf8'));
const VALID = new Set(['OK', 'WRONG', 'UNSURE']);
const byKey = new Map(ledger.rows.map((r) => [r.option, r]));
let added = 0; let updated = 0; const rejected = [];

for (const g of incoming) {
  if (!g.option || !VALID.has(g.verdict)) { rejected.push(`${g.option || '(no option)'}: verdict ${JSON.stringify(g.verdict)} not one of OK/WRONG/UNSURE`); continue; }
  if (!g.why || g.why.trim().length < 40) { rejected.push(`${g.option}: verdict carries no substantive reason — refusing to record an unevidenced grading`); continue; }
  const row = {
    option: g.option,
    verdict: g.verdict,
    liveImage: g.liveImage || null,
    confidence: g.confidence || null,
    why: g.why.trim(),
    gradedAt: new Date().toISOString(),
  };
  if (byKey.has(g.option)) {
    const prev = byKey.get(g.option);
    if (prev.verdict !== row.verdict) console.log(`  CHANGED  ${g.option}: ${prev.verdict} -> ${row.verdict}`);
    Object.assign(prev, row); updated += 1;
  } else { ledger.rows.push(row); byKey.set(g.option, row); added += 1; }
}

for (const r of rejected) console.log(`  REJECTED  ${r}`);
console.log(`\n${DRY ? '[dry-run] ' : ''}${added} added, ${updated} updated, ${rejected.length} rejected`);

if (!DRY) {
  ledger.updatedAt = new Date().toISOString();
  ledger.rows.sort((a, b) => a.option.localeCompare(b.option));
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2));
  console.log(`wrote ${path.relative(ROOT, LEDGER).split(path.sep).join('/')} — ${ledger.rows.length} total`);
}
