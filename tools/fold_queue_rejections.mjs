#!/usr/bin/env node
/**
 * fold_queue_rejections.mjs — make every recorded rejection reach the retry
 * prompt, whichever decision source recorded it.
 *
 * WHY THIS EXISTS
 * ---------------
 * V4 §7 is the rule this project exists to enforce: "Never simply regenerate
 * the same prompt and hope for a different result." `apply_owner_approvals.mjs`
 * already folds/parks the ADMIN PORTAL's rejection reasons, and
 * `build_prompt.mjs` re-emits them on every build.
 *
 * The JULY decision source was never wired into that path. Measured on the
 * first 40-identity V4 wave: 22 of 40 state-C retries reached the generator
 * with NO correction block, because their rejections live in the July file as
 * `reject-file` / `remake` events. Some of those carry the owner's own words —
 * e.g. heel-guard: "Fabric looks to thick like its some sort of felt or pea
 * coat fabric, make the pants a navy with white pinstripe super 160 wool" —
 * and that note was being dropped on the floor at exactly the moment a credit
 * was about to be spent repeating the mistake.
 *
 * WHAT IT DOES
 * ------------
 * Reads the A–E queue (built from the merged ledger, so both decision sources
 * are already reconciled there) and parks every non-machine rejection into
 * `.craft-pipeline/<product>/<option>/owner-corrections.json`, the file
 * `build_prompt.mjs` already merges into every prompt it builds. Existing
 * entries are preserved and de-duplicated; nothing is ever removed.
 *
 * HONESTY ABOUT EMPTY REJECTIONS
 * ------------------------------
 * Many July events are a bare `reject-file` with no tag and no note. There is
 * no failure detail to encode, and inventing one would be worse than none. So
 * those are parked with `reason: null` and a truthful line the prompt can
 * carry: this craft's previous attempt was rejected, the reason was not
 * recorded, treat the drawing as the only authority and change the execution.
 * That is materially different from a silent identical regeneration, and it is
 * visible to the owner in /admin/image-review.
 *
 * USAGE
 *   node tools/fold_queue_rejections.mjs                 # report
 *   node tools/fold_queue_rejections.mjs --apply
 *   node tools/fold_queue_rejections.mjs --apply --worklist=public/images/reports/wave-worklist.json
 *       (restrict to the crafts in one wave)
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const QUEUE = path.join(REPO, 'data-store', 'generation-queue.json');
const PIPE = path.join(REPO, '.craft-pipeline');
const LOG = path.join(REPO, 'public', 'images', 'reports', 'fold-queue-rejections-log.json');

const arg = (k, d) => { const h = process.argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const APPLY = process.argv.includes('--apply');
const WORKLIST = arg('worklist', '');

const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));

// Optional wave restriction. The work list clusters rows into one photograph,
// so the pipeline folder to write is the CLUSTER's product/option, and the
// rejections to fold are those of every row the cluster covers.
let scope = null;
if (WORKLIST) {
  const wl = JSON.parse(fs.readFileSync(path.isAbsolute(WORKLIST) ? WORKLIST : path.join(REPO, WORKLIST), 'utf8'));
  scope = new Map(); // craftId -> { product, option }
  for (const c of wl.work) for (const row of c.rows) scope.set(row, { product: c.product, option: c.option });
}

const byPipelineDir = new Map(); // "product/option" -> corrections[]
let considered = 0;
let withReason = 0;
let withoutReason = 0;

for (const e of queue.entries) {
  if (e.state !== 'C') continue;
  const target = scope ? scope.get(e.craftId) : { product: e.product, option: e.optionId };
  if (!target) continue;
  // Admin-portal rejections are ALREADY handled by apply_owner_approvals.mjs,
  // which folds them into prompt.json.ownerCorrections with a real decidedAt.
  // The queue's copy carries `attempt` but no `decidedAt`, so re-parking one
  // here defeats build_prompt.mjs's (attemptRejected, decidedAt) dedupe and the
  // owner's correction is emitted TWICE in the prompt. Verified on
  // sport-coat/cd-standard. This tool exists only for the sources that path
  // does not cover — July and anything else the ledger merged in.
  const ctx = (e.rejectionContext ?? []).filter((r) => r.source !== 'admin-portal');
  if (!ctx.length) continue;
  considered += 1;
  const key = `${target.product}/${target.option}`;
  if (!byPipelineDir.has(key)) byPipelineDir.set(key, []);
  const bucket = byPipelineDir.get(key);
  for (const r of ctx) {
    const tags = Array.isArray(r.tags) ? r.tags.filter(Boolean) : [];
    const notes = typeof (r.notes ?? r.note) === 'string' ? (r.notes ?? r.note).trim() : '';
    const hasReason = tags.length > 0 || notes.length > 0;
    if (hasReason) withReason += 1; else withoutReason += 1;
    const entry = {
      attemptRejected: r.attempt ?? null,
      decidedAt: r.decidedAt ?? null,
      source: r.source ?? 'unknown',
      verdict: r.verdict,
      tags,
      notes: hasReason
        ? notes
        : 'The reason was not recorded with this rejection. Do not reproduce the previous attempt: '
          + 'treat the tech-pack drawing as the only geometry authority, and change the execution '
          + '(framing, cloth, lighting, finish) rather than repeating it.',
      reasonRecorded: hasReason,
      references: Array.isArray(r.references) ? r.references : [],
      craftId: e.craftId,
      foldedFrom: 'generation-queue.rejectionContext',
    };
    // Dedupe on the full identity of the rejection, not on the craft.
    const sig = JSON.stringify([entry.source, entry.verdict, entry.attemptRejected, entry.decidedAt, entry.tags, entry.notes, entry.craftId]);
    if (!bucket.some((x) => x.__sig === sig)) bucket.push({ ...entry, __sig: sig });
  }
}

const written = [];
const skipped = [];
for (const [key, incoming] of byPipelineDir) {
  const [product, option] = key.split('/');
  const dir = path.join(PIPE, product, option);
  const file = path.join(dir, 'owner-corrections.json');
  let existing = { craftId: null, corrections: [] };
  if (fs.existsSync(file)) {
    try { existing = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* rewrite below */ }
  }
  const have = new Set((existing.corrections ?? []).map((c) =>
    JSON.stringify([c.source ?? 'admin-portal', c.verdict ?? 'rejected', c.attemptRejected ?? null, c.decidedAt ?? null, c.tags ?? [], c.notes ?? '', c.craftId ?? null])));
  const add = incoming.filter((c) => !have.has(c.__sig)).map(({ __sig, ...c }) => ({ ...c, parkedAt: new Date().toISOString() }));
  if (!add.length) { skipped.push({ key, reason: 'already parked' }); continue; }
  const next = {
    craftId: existing.craftId ?? incoming[0].craftId,
    note: 'Owner rejection reasons for this craft, from BOTH decision sources. build_prompt.mjs folds these into every prompt it builds.',
    corrections: [...(existing.corrections ?? []), ...add],
  };
  written.push({ key, added: add.length, total: next.corrections.length });
  if (APPLY) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(next, null, 1) + '\n', 'utf8');
  }
}

const summary = {
  ranAt: new Date().toISOString(),
  applied: APPLY,
  worklist: WORKLIST || null,
  stateCCraftsWithRejections: considered,
  rejectionEventsWithAReason: withReason,
  rejectionEventsWithNoReasonRecorded: withoutReason,
  pipelineFoldersWritten: written.length,
  pipelineFoldersAlreadyCurrent: skipped.length,
  written,
};
if (APPLY) fs.writeFileSync(LOG, JSON.stringify(summary, null, 2) + '\n', 'utf8');

console.log(`state-C crafts carrying rejections : ${considered}`);
console.log(`  rejection events WITH a reason   : ${withReason}`);
console.log(`  rejection events with none noted : ${withoutReason}`);
console.log(`pipeline folders to write          : ${written.length}`);
console.log(`already current                    : ${skipped.length}`);
console.log(APPLY ? `-> parked; log: ${path.relative(REPO, LOG).split(path.sep).join('/')}` : 'report only — re-run with --apply.');
