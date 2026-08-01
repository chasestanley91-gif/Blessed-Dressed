#!/usr/bin/env node
// stage_approved.mjs — copy the QC-approved candidate into the tracked master
// tree so optimize_assets.mjs can derive its WebP and publish_approved.mjs can
// wire it into the catalog.
//
// This step existed only as a manual `cp` until now, which is exactly the kind
// of gap that lets a wrong file reach production. The approved candidate is
// identified from qc.json — attempt N means candidate-N.png, never "the newest
// file in the folder" — and the copy is verified byte-identical by SHA-1
// before it counts as staged.
//
// Usage:
//   node tools/stage_approved.mjs                 # dry run, every approved option
//   node tools/stage_approved.mjs --apply
//   node tools/stage_approved.mjs --product=suit-3pc --option=sb-5 --apply
//
// Refuses to overwrite an existing master whose bytes differ, unless
// --allow-swap is passed: a live photo is a production asset and replacing one
// is a human decision, not a batch side effect.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);

const ROOT = process.cwd();
const PIPE = path.join(ROOT, '.craft-pipeline');
const MASTERS = path.join(ROOT, 'public', 'images', 'generated');
const APPROVED = new Set(['PASS', 'PASS_WAIVED']);

const sha1 = (p) => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

if (!fs.existsSync(PIPE)) {
  console.error('No .craft-pipeline directory here. Run from the repo root.');
  process.exit(1);
}

const staged = [];
const skipped = [];
const refused = [];

for (const product of fs.readdirSync(PIPE)) {
  if (args.product && product !== args.product) continue;
  const pdir = path.join(PIPE, product);
  if (!fs.statSync(pdir).isDirectory()) continue;

  for (const option of fs.readdirSync(pdir)) {
    if (args.option && option !== args.option) continue;
    const odir = path.join(pdir, option);
    const qcPath = path.join(odir, 'qc.json');
    if (!fs.existsSync(qcPath)) continue;

    let qc;
    try { qc = readJson(qcPath); } catch { refused.push([product, option, 'qc.json unreadable']); continue; }
    if (!APPROVED.has(qc.verdict)) { skipped.push([product, option, qc.verdict]); continue; }

    // The approved image is the candidate for the graded attempt — not the
    // newest file on disk. A later stray candidate must never be picked up.
    const cand = path.join(odir, `candidate-${qc.attempt}.png`);
    if (!fs.existsSync(cand)) {
      refused.push([product, option, `${qc.verdict} at attempt ${qc.attempt} but candidate-${qc.attempt}.png is missing`]);
      continue;
    }

    const destDir = path.join(MASTERS, product);
    const dest = path.join(destDir, `${option}.png`);
    const srcSha = sha1(cand);

    if (fs.existsSync(dest)) {
      const destSha = sha1(dest);
      if (destSha === srcSha) { skipped.push([product, option, 'already staged, identical']); continue; }
      if (!args['allow-swap']) {
        refused.push([product, option, `master exists with different bytes (${destSha.slice(0, 8)} vs ${srcSha.slice(0, 8)}) — needs --allow-swap`]);
        continue;
      }
    }

    if (args.apply) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(cand, dest);
      const got = sha1(dest);
      if (got !== srcSha) {
        refused.push([product, option, `copy verification FAILED: ${got} != ${srcSha}`]);
        continue;
      }
    }
    staged.push([product, option, qc.verdict, qc.attempt, srcSha]);
  }
}

console.log(`\nstage_approved — ${staged.length} to stage, ${skipped.length} skipped, ${refused.length} refused\n`);
for (const [p, o, v, a, s] of staged) console.log(`  STAGE    ${p}/${o}  ${v} attempt ${a}  sha1 ${s.slice(0, 12)}`);
for (const [p, o, why] of refused) console.log(`  REFUSED  ${p}/${o} — ${why}`);

if (!args.apply) {
  console.log(`\nDry run. Re-run with --apply to copy ${staged.length} master(s).`);
} else {
  console.log(`\nAPPLIED — ${staged.length} master(s) staged and SHA-1 verified.`);
  console.log('Next: node tools/optimize_assets.mjs --apply && node tools/publish_approved.mjs --apply');
}
process.exit(refused.length && args.strict ? 1 : 0);
