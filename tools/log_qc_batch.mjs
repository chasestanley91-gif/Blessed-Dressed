#!/usr/bin/env node
// log_qc_batch.mjs — write qc-input.json for a batch of graded options and run
// the QC ladder over each, so a wave of gradings is applied with one command
// and one audit trail instead of by hand.
//
// The gradings come from QC agents that are strictly read-only; this script is
// the ONLY thing that writes them, which is what keeps every catalog-affecting
// write in the main loop.
//
// Usage:
//   node tools/log_qc_batch.mjs <gradings.json> [--apply] [--max-attempts=3]
//
// Input is a JSON array of objects, each with:
//   { dir, product, option, scores{9}, errors[], lockedFeatures[], notes }
// Any object carrying "SKIP" is reported and not logged — used for options the
// grader could not judge (e.g. an unusable blueprint), so an ungradeable option
// never lands as a false FAIL.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [input, ...rest] = process.argv.slice(2);
const apply = rest.includes('--apply');
const maxAttempts = (rest.find((a) => a.startsWith('--max-attempts=')) || '--max-attempts=3').split('=')[1];

if (!input) { console.error('Usage: node tools/log_qc_batch.mjs <gradings.json> [--apply]'); process.exit(1); }

const ROOT = process.cwd();
const LADDER = path.join(
  process.env.USERPROFILE || process.env.HOME,
  '.claude', 'skills', 'garment-image-qc', 'scripts', 'log_qc_result.mjs'
);
const REQUIRED = ['shape', 'geometry', 'dimensions', 'angles', 'construction', 'placement', 'symmetry', 'composition', 'blueprint-match'];

const rows = JSON.parse(fs.readFileSync(input, 'utf8'));
const results = [];

for (const g of rows) {
  if (g.SKIP) { results.push([g.product + '/' + g.option, 'SKIPPED', g.SKIP]); continue; }

  const missing = REQUIRED.filter((k) => typeof g.scores?.[k] !== 'number');
  if (missing.length) { results.push([g.product + '/' + g.option, 'REFUSED', 'missing scores: ' + missing.join(',')]); continue; }
  if (!fs.existsSync(path.join(ROOT, g.dir))) { results.push([g.product + '/' + g.option, 'REFUSED', 'no pipeline dir ' + g.dir]); continue; }

  const payload = { scores: g.scores, errors: g.errors || [], lockedFeatures: g.lockedFeatures || [], notes: g.notes || '' };
  const dest = path.join(ROOT, g.dir, 'qc-input.json');

  if (!apply) { results.push([g.product + '/' + g.option, 'WOULD LOG', `min ${Math.min(...Object.values(g.scores))}, ${(g.errors || []).filter((e) => e.severity === 'critical' || e.severity === 'major').length} blocking`]); continue; }

  fs.writeFileSync(dest, JSON.stringify(payload, null, 2));
  try {
    const out = execFileSync(process.execPath, [
      LADDER, `--root=${ROOT}`, `--product=${g.product}`, `--option=${g.option}`,
      `--input=${g.dir}/qc-input.json`, `--max-attempts=${maxAttempts}`,
    ], { encoding: 'utf8' });
    const verdict = (out.match(/VERDICT:\s*(\w+)/) || [, '?'])[1];
    results.push([g.product + '/' + g.option, verdict, `min ${Math.min(...Object.values(g.scores))}`]);
  } catch (e) {
    results.push([g.product + '/' + g.option, 'ERROR', (e.stderr || e.message || '').split('\n')[0]]);
  }
}

const w = Math.max(...results.map((r) => r[0].length));
for (const [name, verdict, detail] of results) console.log(`  ${name.padEnd(w)}  ${verdict.padEnd(12)} ${detail}`);
const tally = {};
for (const r of results) tally[r[1]] = (tally[r[1]] || 0) + 1;
console.log('\n' + Object.entries(tally).map(([k, v]) => `${k}: ${v}`).join('  ·  '));
if (!apply) console.log('\nDry run. Re-run with --apply.');
