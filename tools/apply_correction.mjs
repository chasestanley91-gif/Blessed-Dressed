#!/usr/bin/env node
// apply_correction.mjs — rebuild an option's prompt from its spec and fold in
// the QC correction block, so a retry actually asks for something different.
//
// WHY THIS EXISTS. correction-loop.md says garment-image-director "reads
// qc.json's correction block before regenerating and strengthens the specific
// wording". Nothing did. build_prompt.mjs never opens qc.json, so every retry
// was regenerated from the identical prompt unless a human hand-edited it.
// That is the same defect photography-rules.md already records in another form:
// a rule that lives only in a reference file and never reaches the prompt
// string is not a rule the model can follow.
//
// Usage:
//   node tools/apply_correction.mjs --product=shirt --option=<id>
//   node tools/apply_correction.mjs --all-retry-due            # every FAIL with attempts left
//   node tools/apply_correction.mjs --all-retry-due --apply
//
// Ordering rule, learned the expensive way on sport-coat/lapel-notch-68: a
// correction that CONTRADICTS an earlier paragraph loses, however loudly it is
// phrased. So the correction is appended LAST and the builder's own text is
// left alone — but any measurement the correction supersedes must be fixed in
// the spec, not shouted over here. This script reports when it detects that
// case rather than papering over it.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
const apply = !!args.apply;
const ROOT = process.cwd();
const HOME = process.env.USERPROFILE || process.env.HOME;
const BUILD = path.join(HOME, '.claude', 'skills', 'garment-image-director', 'scripts', 'build_prompt.mjs');

function targets() {
  if (args.product && args.option) return [{ product: args.product, option: args.option }];
  if (!args['all-retry-due']) { console.error('Pass --product and --option, or --all-retry-due.'); process.exit(1); }
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/images/reports/repo-index.json'), 'utf8'));
  const seen = new Set(); const out = [];
  for (const r of idx.records) {
    const p = r.pipeline;
    if (!p || p.verdict !== 'FAIL') continue;
    if (typeof p.attempt === 'number' && p.attempt >= 3) continue;   // budget spent
    const key = `${r.product}/${r.option}`;
    if (seen.has(key)) continue; seen.add(key);
    out.push({ product: r.product, option: r.option });
  }
  return out;
}

const results = [];
for (const { product, option } of targets()) {
  const dir = path.join(ROOT, '.craft-pipeline', product, option);
  const qcPath = path.join(dir, 'qc.json');
  if (!fs.existsSync(qcPath)) { results.push([product, option, 'SKIP', 'no qc.json']); continue; }

  const qc = JSON.parse(fs.readFileSync(qcPath, 'utf8'));
  if (qc.verdict !== 'FAIL') { results.push([product, option, 'SKIP', `verdict ${qc.verdict}`]); continue; }

  // PRECEDENCE MATTERS. qc.correction.errors is the LADDER's auto-generated
  // per-category list — one entry per score below 98, each carrying the
  // boilerplate "Strengthen the geometry/coverage wording ... and regenerate."
  // That is exactly the vague retry correction-loop.md forbids, and feeding it
  // back would spend a credit asking for nothing. The graded findings, with
  // real measurements and real descriptions, live in qc.errors. Prefer those;
  // fall back to the ladder list only if there are none, and strip its
  // boilerplate when doing so.
  const BOILERPLATE = /^strengthen the geometry\/coverage wording/i;
  const graded = (qc.errors || []).filter((e) => e.correction);
  const fallback = (qc.correction?.errors || []).filter((e) => e.correction && !BOILERPLATE.test(e.correction));
  const errs = graded.length ? graded : fallback;
  const blocking = errs.filter((e) => e.severity === 'critical' || e.severity === 'major');
  const minors = errs.filter((e) => e.severity === 'minor' && !/^accepted/i.test(e.correction));
  const locked = qc.correction?.lockedFeatures || qc.lockedFeatures || [];
  if (!blocking.length && !minors.length) { results.push([product, option, 'SKIP', 'no actionable corrections']); continue; }

  // Rebuild the base prompt from spec so nothing from a previous hand-edit survives.
  let built;
  try {
    built = JSON.parse(execFileSync(process.execPath,
      [BUILD, `--root=${ROOT}`, `--product=${product}`, `--option=${option}`, '--json'], { encoding: 'utf8' }));
  } catch (e) { results.push([product, option, 'ERROR', (e.stderr || e.message || '').split('\n')[0]]); continue; }

  const attempt = (qc.attempt || 0) + 1;
  const lines = [];
  lines.push(`QC CORRECTION (attempt ${attempt}) — the previous attempt was rejected. Each item below says what the drawing actually shows; render that.`);
  for (const e of [...blocking, ...minors]) {
    // The graders write `correction` as a description of the right construction,
    // which is the only form that reliably works — a bare prohibition makes the
    // model remove the named thing and put nothing in its place.
    lines.push(`• ${e.correction}`);
  }
  if (locked.length) {
    lines.push('KEEP EXACTLY AS-IS — these were measured correct on the previous attempt and must not regress: ' +
      locked.map((l) => String(l).replace(/\s+/g, ' ').trim()).join('; ') + '.');
  }
  const correctionBlock = lines.join(' ');

  // Report which measurements this correction NEWLY asserts — i.e. figures the
  // base prompt does not already state anywhere.
  //
  // An earlier version of this tried to detect *contradictions*: for each
  // measurement in the correction, flag if the prompt held a different value in
  // the same unit. It fired on 14 of 22 options and every one checked was a
  // false positive — "2.5 cm slant" and "12 cm mouth length" are two different
  // dimensions, not a conflict. Distinguishing those needs to know which FEATURE
  // each number describes, which a regex cannot do. A check that cries wolf on
  // two thirds of its inputs is worse than none, because it trains you to skip
  // it. So this reports a fact it can actually establish. The dangerous case it
  // does NOT catch is the one that cost sport-coat/lapel-notch-68 four
  // generations: the prompt asserting the wrong value for the SAME feature. That
  // still needs a human reading the prompt end to end when two attempts fail the
  // same way.
  const norm = (s) => s.replace(/degrees?/i, '°').replace(/\s+/g, '').toLowerCase();
  const inPrompt = new Set([...built.prompt.matchAll(/(\d+(?:\.\d+)?)\s*(cm|mm|°|degrees?)/gi)].map((m) => norm(m[1] + m[2])));
  const introduced = [...new Set([...correctionBlock.matchAll(/(\d+(?:\.\d+)?)\s*(cm|mm|°|degrees?)/gi)]
    .map((m) => norm(m[1] + m[2])))].filter((n) => !inPrompt.has(n));

  const prompt = built.prompt.trimEnd() + '\n\n' + correctionBlock;
  const outPath = path.join(dir, 'prompt.json');
  if (apply) {
    writeOut(outPath, { ...built, prompt, builtAt: new Date().toISOString(), correctionAttempt: attempt });
  }
  results.push([product, option, apply ? 'WROTE' : 'WOULD WRITE',
    `${blocking.length} blocking + ${minors.length} minor → attempt ${attempt}${introduced.length ? `  · new figures: ${introduced.join(' ')}` : ''}`]);
}

function writeOut(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2)); }

const w = Math.max(20, ...results.map((r) => (r[0] + '/' + r[1]).length));
for (const [p, o, st, d] of results) console.log(`  ${(p + '/' + o).padEnd(w)}  ${st.padEnd(12)} ${d}`);
const tally = {}; for (const r of results) tally[r[2]] = (tally[r[2]] || 0) + 1;
console.log('\n' + Object.entries(tally).map(([k, v]) => `${k}: ${v}`).join('  ·  '));
if (!apply) console.log('\nDry run. Re-run with --apply to write prompt.json.');
