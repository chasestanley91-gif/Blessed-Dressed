#!/usr/bin/env node
// Act on the owner's review decisions.
//
// APPROVED  -> the candidate is staged and published to the live catalog.
// REJECTED  -> the owner's reason (ticked problems + notes) is appended to
//              prompt.json as an OWNER CORRECTION block, and any reference
//              photos they attached are listed for the next generation to use
//              alongside the supplier drawing.
//
// The owner's verdict is final in both directions: an approval publishes even
// if the automated check had rejected it, and a rejection blocks even if the
// automated check had passed it. That is the point of the review.
//
//   node tools/apply_review_decisions.mjs            # report what would happen
//   node tools/apply_review_decisions.mjs --apply

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const DECISIONS_FILE = path.join(ROOT, 'data-store', 'image-review-decisions.json');
const APPLY = process.argv.includes('--apply');

function readJson(p, fallback = null) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

const decisions = readJson(DECISIONS_FILE, {}) || {};
const all = Object.values(decisions);
if (!all.length) {
  console.log('No decisions recorded yet. Review at /admin/image-review first.');
  process.exit(0);
}

const approved = all.filter((d) => d.verdict === 'approved');
const rejected = all.filter((d) => d.verdict === 'rejected');

console.log(`decisions: ${all.length}  (${approved.length} approved, ${rejected.length} rejected)`);

// ── rejected: fold the owner's reason into the prompt ───────────────────────
let corrected = 0;
const stillNeedGeneration = [];

for (const d of rejected) {
  const [product, option] = d.key.split('/');
  const pFile = path.join(ROOT, '.craft-pipeline', product, option, 'prompt.json');
  if (!fs.existsSync(pFile)) { console.log(`  ! no prompt.json for ${d.key}`); continue; }

  const prompt = readJson(pFile, {});
  const already = (prompt.ownerCorrections || []).some(
    (c) => c.attemptRejected === d.attempt && c.decidedAt === d.decidedAt,
  );
  if (already) { stillNeedGeneration.push(d.key); continue; }

  const parts = [];
  if (d.tags?.length) parts.push(`What is wrong with it: ${d.tags.join('; ')}.`);
  if (d.notes) parts.push(d.notes);
  if (d.references?.length) {
    parts.push(
      `The owner has supplied ${d.references.length} reference photograph(s) of what this option ` +
      `should actually look like. Those photographs are attached and OUTRANK the supplier line ` +
      `drawing wherever the two disagree: match the construction, proportion and finish shown in ` +
      `them. Use the line drawing only for anything the photographs do not show.`,
    );
  }

  const block =
    `OWNER CORRECTION AFTER REVIEW (attempt ${d.attempt} was rejected by the owner — ` +
    `obey this over any conflicting earlier line, including the BLUEPRINT LOCK): ` +
    parts.join(' ');

  if (APPLY) {
    prompt.prompt = `${prompt.prompt}\n\n${block}`;
    prompt.ownerCorrections = prompt.ownerCorrections || [];
    prompt.ownerCorrections.push({
      attemptRejected: d.attempt,
      decidedAt: d.decidedAt,
      tags: d.tags || [],
      notes: d.notes || '',
      references: d.references || [],
      appliedAt: new Date().toISOString(),
    });
    fs.writeFileSync(pFile, JSON.stringify(prompt, null, 1));
  }
  corrected++;
  stillNeedGeneration.push(d.key);
}

console.log(`\nrejected -> prompt corrections ${APPLY ? 'applied' : 'to apply'}: ${corrected}`);
const withRefs = rejected.filter((d) => d.references?.length);
if (withRefs.length) {
  console.log(`  with owner reference photos: ${withRefs.length}`);
  for (const d of withRefs) console.log(`    ${d.key}: ${d.references.length} photo(s)`);
}

// ── approved: run the publish chain ─────────────────────────────────────────
console.log(`\napproved -> publish: ${approved.length}`);
if (APPLY && approved.length) {
  const run = (cmd, args) => {
    const r = spawnSync('node', [cmd, ...args], { encoding: 'utf8' });
    return { ok: r.status === 0, out: ((r.stdout || '') + (r.stderr || '')).trim() };
  };

  const opt = run('tools/optimize_assets.mjs', ['--apply']);
  console.log(`  optimize_assets: ${opt.ok ? 'ok' : 'FAILED'}`);

  let pubOk = 0;
  const pubFail = [];
  for (const d of approved) {
    const [, option] = d.key.split('/');
    const r = run('tools/publish_approved.mjs', ['--apply', '--allow-swap', `--option=${option}`]);
    if (r.ok) pubOk++; else pubFail.push([d.key, r.out.split('\n').slice(-2).join(' | ').slice(0, 200)]);
  }
  console.log(`  published: ${pubOk}/${approved.length}`);
  for (const [k, e] of pubFail) console.log(`    FAILED ${k}: ${e}`);

  run('tools/project_state.mjs', []);
  console.log('  re-derived project state');
}

if (stillNeedGeneration.length) {
  console.log(`\n${stillNeedGeneration.length} option(s) need a fresh generation:`);
  for (const k of stillNeedGeneration.slice(0, 40)) console.log(`  ${k}`);
  if (stillNeedGeneration.length > 40) console.log(`  … and ${stillNeedGeneration.length - 40} more`);
}

if (!APPLY) console.log('\n(dry run — pass --apply)');
