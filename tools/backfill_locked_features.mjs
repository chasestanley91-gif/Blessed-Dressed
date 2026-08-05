#!/usr/bin/env node
// backfill_locked_features.mjs — recover the lockedFeatures that qc.json dropped.
//
// WHY THIS EXISTS. `log_qc_result.mjs` used to record lockedFeatures only inside
// the `correction` block, and `correction` is `false` whenever no retry is owed.
// So on every PASS and every UNMET the list was silently discarded and survived
// only in the raw grader input, `qc-input.json`.
//
// That is exactly backwards. An UNMET option is the one someone will revisit
// later — after a better drawing arrives, or a merge ruling lands — and the first
// thing they need is what already works, so they do not spend a credit
// rediscovering it. A PASS is the one whose correct features must never regress
// if it is ever re-shot.
//
// The writer is fixed going forward. This recovers the history: measured on this
// repo, 257 of 271 qc.json files carried no lockedFeatures at all, and 242 of
// those are recoverable from the qc-input.json sitting beside them.
//
// SAFETY. Never overwrites a non-empty list, never touches any other field, and
// re-parses every file it writes. Dry-run by default.
//
// Usage:
//   node tools/backfill_locked_features.mjs            # report only
//   node tools/backfill_locked_features.mjs --apply

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASE = path.join(ROOT, '.craft-pipeline');
const APPLY = process.argv.includes('--apply');

const found = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (e.name === 'qc.json') found.push(p);
  }
};
if (!fs.existsSync(BASE)) { console.error(`no ${BASE}`); process.exit(2); }
walk(BASE);

let already = 0; let filled = 0; let noSource = 0; let failed = 0;
const byVerdict = {};

for (const p of found) {
  let qc;
  try { qc = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { failed += 1; continue; }

  const top = Array.isArray(qc.lockedFeatures) ? qc.lockedFeatures : [];
  const nested = Array.isArray(qc.correction?.lockedFeatures) ? qc.correction.lockedFeatures : [];
  if (top.length) { already += 1; continue; }

  // Prefer the nested copy if one survived; otherwise recover from the raw input.
  let src = nested;
  if (!src.length) {
    const qi = path.join(path.dirname(p), 'qc-input.json');
    if (fs.existsSync(qi)) {
      try {
        const inp = JSON.parse(fs.readFileSync(qi, 'utf8'));
        if (Array.isArray(inp.lockedFeatures)) src = inp.lockedFeatures;
      } catch { /* unreadable input is not fatal — just unrecoverable */ }
    }
  }
  if (!src.length) { noSource += 1; continue; }

  byVerdict[qc.verdict || '(none)'] = (byVerdict[qc.verdict || '(none)'] || 0) + 1;
  filled += 1;

  if (APPLY) {
    // Insert next to `correction` so the file keeps a sensible reading order,
    // rather than appending to the end where it reads as an afterthought.
    const out = {};
    for (const [k, v] of Object.entries(qc)) {
      out[k] = v;
      if (k === 'correction') out.lockedFeatures = src;
    }
    if (!('lockedFeatures' in out)) out.lockedFeatures = src;
    const text = `${JSON.stringify(out, null, 2)}\n`;
    try { JSON.parse(text); } catch { console.error(`REFUSING to write malformed ${p}`); failed += 1; continue; }
    fs.writeFileSync(p, text);
  }
}

console.log(`\nbackfill_locked_features — ${found.length} qc.json scanned\n`);
console.log(`  already populated        ${String(already).padStart(4)}`);
console.log(`  ${APPLY ? 'RECOVERED               ' : 'recoverable (dry-run)   '} ${String(filled).padStart(4)}`);
console.log(`  no source to recover from${String(noSource).padStart(4)}`);
if (failed) console.log(`  unreadable / refused     ${String(failed).padStart(4)}`);
if (filled) {
  console.log('\n  recovered by verdict:');
  for (const [v, n] of Object.entries(byVerdict).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${v.padEnd(14)} ${n}`);
  }
}
if (!APPLY && filled) console.log('\n  re-run with --apply to write.');
