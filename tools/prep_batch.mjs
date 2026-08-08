#!/usr/bin/env node
/**
 * prep_batch.mjs — turn the next N worklist entries into generation-ready
 * payloads: persisted spec, locked prompt, pre-flight gate, blueprint path.
 *
 * Everything here is free. Nothing in this file spends a credit, and that is
 * deliberate — the whole point is that an option is fully proven on paper
 * before any money is committed to it.
 *
 * An entry that fails its pre-flight gate is DROPPED from the batch and
 * reported, never silently generated anyway.
 *
 * Usage
 *   node tools/prep_batch.mjs --n=12            # next 12 not yet prepared
 *   node tools/prep_batch.mjs --n=12 --from=24
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const WORKLIST = path.join(REPO, 'public/images/reports/generation-worklist.json');
const PIPE = path.join(REPO, '.craft-pipeline');
const SKILL_TP = path.join(os.homedir(), '.claude/skills/tech-pack-interpreter/scripts');
const SKILL_GD = path.join(os.homedir(), '.claude/skills/garment-image-director/scripts');
const OUT = path.join(REPO, 'public/images/reports/batch-payload.json');

const arg = (k, d) => { const h = process.argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const N = Number(arg('n', 12));
const FROM = Number(arg('from', 0));
const COMPACT = process.argv.includes('--compact');

// The storefront already serves every blueprint over plain HTTPS, so the image
// service can fetch them directly and the per-image signed-upload dance is
// unnecessary. Confirmed 2026-08-08: all 504 worklist illustrations return 200
// from this origin. See EXPOSURE-FINDINGS.md — this host is public whether or
// not the pipeline uses it, so using it adds no exposure.
const PUBLIC_ORIGIN = arg('origin', 'https://customsuits.net');

const wl = JSON.parse(fs.readFileSync(WORKLIST, 'utf8'));

/** Orientation the drawing shows. The naming hint is the fallback, not the rule. */
function orientationFor(w) {
  const t = `${w.section} ${w.field} ${w.label}`.toLowerCase();
  if (/back|vent|seat|yoke|rear/.test(t)) return 'back';
  if (/interior|lining|inside|curtain/.test(t)) return 'interior';
  if (/cuff|sleeve|pocket|waistband|hem|belt|placket|collar|lapel|front|button|dart|pleat|fly/.test(t)) return 'front';
  return 'front';
}

const node = process.execPath;
const run = (script, args) => execFileSync(node, [script, ...args], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const prepared = [];
const dropped = [];
let i = FROM;
while (prepared.length < N && i < wl.work.length) {
  const w = wl.work[i]; i += 1;
  // Skip anything already photographed and graded.
  const qc = path.join(PIPE, w.product, w.option, 'qc.json');
  if (fs.existsSync(qc)) {
    try {
      const v = JSON.parse(fs.readFileSync(qc, 'utf8')).verdict;
      if (v === 'PASS' || v === 'PASS_WAIVED') continue;
    } catch { /* fall through and re-prepare */ }
  }
  const orientation = orientationFor(w);
  try {
    run(path.join(SKILL_TP, 'extract_spec.mjs'),
      [`--product=${w.product}`, `--option=${w.option}`, `--orientation=${orientation}`, '--write']);
    const built = JSON.parse(run(path.join(SKILL_GD, 'build_prompt.mjs'),
      [`--product=${w.product}`, `--option=${w.option}`, '--json', ...(COMPACT ? ['--compact'] : [])]));
    // The pre-flight gate decides, not this script.
    run(path.join(SKILL_GD, 'validate_prompt.mjs'), [`--product=${w.product}`, `--option=${w.option}`]);
    if (!built.illustrationDisk || !fs.existsSync(built.illustrationDisk)) {
      dropped.push({ ...w, reason: 'blueprint not on disk' }); continue;
    }
    prepared.push({
      index: prepared.length,
      identity: w.identity, product: w.product, option: w.option, field: w.field,
      label: w.label, part: w.part, orientation,
      rows: w.rows,
      illustrationDisk: built.illustrationDisk,
      filename: path.basename(built.illustrationDisk),
      // Encode each path segment: several blueprint filenames contain spaces
      // and parentheses, and an unencoded URL would 404 silently.
      publicUrl: PUBLIC_ORIGIN + String(w.illustration).split('/').map(encodeURIComponent).join('/').replace(/^%2F/, '/'),
      prompt: built.prompt,
      requiredTokens: built.requiredTokens,
      checklist: built.checklist,
    });
  } catch (e) {
    const msg = String(e.stdout || e.message || e).split('\n').filter(Boolean).slice(-3).join(' | ');
    dropped.push({ ...w, reason: msg.slice(0, 300) });
  }
}

fs.writeFileSync(OUT, JSON.stringify({
  generatedAt: new Date().toISOString(), from: FROM, nextFrom: i,
  prepared: prepared.length, dropped: dropped.length, items: prepared, droppedItems: dropped,
}, null, 2) + '\n', 'utf8');

console.log(`prepared : ${prepared.length}`);
console.log(`dropped  : ${dropped.length}`);
for (const d of dropped.slice(0, 6)) console.log(`   DROP ${d.product}/${d.option} — ${d.reason}`);
console.log(`nextFrom : ${i}`);
for (const p of prepared) console.log(`   [${p.index}] ${p.product}/${p.option}  ${JSON.stringify(p.label)}  (${p.rows.length} rows)`);
