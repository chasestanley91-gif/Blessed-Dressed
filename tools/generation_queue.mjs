#!/usr/bin/env node
/**
 * generation_queue.mjs — the deterministic, resumable answer to "what does
 * every craft still need?"
 *
 * Joins the canonical decision ledger (owner truth), the catalog (scope), the
 * pipeline tree (work already done) and the review queue (work awaiting the
 * owner) into ONE state per craft:
 *
 *   X  excluded            fabric/thread/button swatch — never generated
 *   A  missing-illustration no verified drawing to generate from; blocked on
 *                          source material, not on effort
 *   E  complete            verified illustration + owner-approved photo live
 *   D  awaiting-approval   a candidate exists and the owner has not ruled
 *   C  replace-rejected    the owner rejected it; regenerate WITH the reason
 *   B  needs-generation    in scope, drawable, no photo and no candidate
 *
 * Priority within a craft: X, then A (can't work), then E (done), then D
 * (owner's move), then C (failure-aware retry), then B (fresh work).
 *
 * Resumable by construction: the queue is DERIVED, not ticked off. Rerunning
 * after an interruption reclassifies from what is actually on disk — a craft
 * whose candidate landed moves B->D on its own; nothing is counted twice and
 * nothing is forgotten.
 *
 * Reads the same catalog/spec libs as project_state.mjs so "excluded" and
 * "generatable" mean exactly what the pipeline means by them.
 *
 *   node tools/generation_queue.mjs             # report + write queue + audit
 *   node tools/generation_queue.mjs --quiet     # write only
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SKILLS = process.env.CLAUDE_SKILLS_DIR || 'C:/Users/ChaseStanley/.claude/skills';
const PIPE = path.join(REPO, '.craft-pipeline');
const PUBLIC = path.join(REPO, 'public');

const LEDGER = path.join(REPO, 'data-store/image-decision-ledger.json');
const REVIEW_QUEUE = path.join(REPO, 'data-store/image-review-queue.json');
const OUT_QUEUE = path.join(REPO, 'data-store/generation-queue.json');
const OUT_AUDIT = path.join(REPO, 'public/images/reports/reconciliation-audit.json');

const QUIET = process.argv.includes('--quiet');
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

const ledger = readJson(LEDGER, null);
if (!ledger) { console.error('no ledger — run: node tools/build_decision_ledger.mjs --write'); process.exit(1); }
const review = readJson(REVIEW_QUEUE, { items: [] });

// Review-queue items awaiting the owner, by full address (falling back to key).
const awaitingByAddr = new Set();
const awaitingByKey = new Set();
const decisions = readJson(path.join(REPO, 'data-store/image-review-decisions.json'), {});
for (const it of review.items ?? []) {
  const d = decisions[it.key];
  const pending = !d || d.attempt < it.attempt;
  if (!pending) continue;
  if (typeof it.addr === 'string' && it.addr.split('>').length === 4) {
    awaitingByAddr.add(it.addr.split('>').map((x) => x.trim()).join('|'));
  }
  awaitingByKey.add(it.key);
}

// Pipeline artifacts by product/option.
const pipeArtifacts = new Map();
if (fs.existsSync(PIPE)) {
  for (const product of fs.readdirSync(PIPE)) {
    const pdir = path.join(PIPE, product);
    if (!fs.statSync(pdir).isDirectory() || product.startsWith('_')) continue;
    for (const option of fs.readdirSync(pdir)) {
      const dir = path.join(pdir, option);
      if (!fs.statSync(dir).isDirectory()) continue;
      const f = fs.readdirSync(dir);
      pipeArtifacts.set(`${product}/${option}`, {
        spec: f.includes('spec.json'),
        prompt: f.includes('prompt.json'),
        candidates: f.filter((x) => /^candidate-\d+\.png$/.test(x)).length,
        qc: f.includes('qc.json') ? readJson(path.join(dir, 'qc.json'), null)?.verdict ?? null : null,
      });
    }
  }
}

// Scope truth from the pipeline's own spec extractor.
const libDir = path.join(SKILLS, 'tech-pack-interpreter', 'scripts', 'lib');
const { resolveCatalog, iterateOptions } = await import(pathToFileURL(path.join(libDir, 'catalog.mjs')).href);
const { extractSpec } = await import(pathToFileURL(path.join(libDir, 'spec.mjs')).href);
const cat = resolveCatalog({ options: path.join(REPO, 'data-store', 'options'), public: PUBLIC });

const entries = [];
const counts = { X: 0, A: 0, B: 0, C: 0, D: 0, E: 0 };

for (const opt of iterateOptions(cat)) {
  const spec = extractSpec(opt);
  const craftId = `${spec.productId}|${opt.sectionId}|${opt.fieldId}|${opt.optionId}`;
  const lc = ledger.crafts[craftId];
  const illu = lc?.illustration ?? { status: 'missing', path: null };
  const pipe = pipeArtifacts.get(`${spec.productId}/${opt.optionId}`);

  // Ledger-derived owner state.
  const adminEvents = (lc?.events ?? []).filter((e) => e.source === 'admin-portal');
  const latestAdmin = adminEvents[adminEvents.length - 1] ?? null;
  const hasPhotoApproval = (lc?.approvedPhotoEvents ?? 0) > 0;
  const rejectedNow = latestAdmin?.verdict === 'rejected'
    || (!latestAdmin && (lc?.rejectionEvents ?? 0) > 0 && !hasPhotoApproval);
  const rejectionContext = (lc?.events ?? [])
    .filter((e) => !e.machine && ['rejected', 'reject-file', 'remake', 'discard'].includes(e.verdict))
    .map((e) => ({ source: e.source, verdict: e.verdict, tags: e.tags, notes: e.notes ?? e.note, attempt: e.attempt, references: e.references }));

  const illustrationUsable = ['verified-match', 'drawing-unverified'].includes(illu.status);
  const awaiting = awaitingByAddr.has(craftId)
    || (awaitingByKey.has(`${spec.productId}/${opt.optionId}`) && !awaitingByAddr.size);

  let state, why;
  if (spec.excluded || spec.generate === false) {
    state = 'X'; why = spec.excluded ? `excluded: ${spec.excluded}` : 'marked non-generatable';
  } else if (!illustrationUsable) {
    state = 'A'; why = `illustration ${illu.status}`;
  } else if (hasPhotoApproval && latestAdmin?.verdict !== 'rejected') {
    // Approval means generation is NOT needed — whether the image is wired yet
    // is apply_owner_approvals.mjs's department, surfaced here for the audit.
    // July approvals were of the row AS DISPLAYED, which for many crafts was a
    // supplier photograph — any wired image satisfies them, not only /generated/.
    const live = typeof lc?.current?.image === 'string' && lc.current.image.length > 0;
    state = 'E'; why = live ? 'owner-approved image live' : 'owner-approved — awaiting publish by apply_owner_approvals';
  } else if (awaiting) {
    state = 'D'; why = 'candidate awaiting owner decision';
  } else if (rejectedNow || rejectionContext.length) {
    state = 'C'; why = latestAdmin?.verdict === 'rejected'
      ? `owner rejected attempt ${latestAdmin.attempt}`
      : 'carries owner rejection/remake history';
  } else {
    state = 'B'; why = 'no approved photo, no pending candidate';
  }
  counts[state] += 1;

  entries.push({
    craftId, state, why,
    product: spec.productId, sectionId: opt.sectionId, fieldId: opt.fieldId, optionId: opt.optionId,
    label: spec.label,
    illustration: { path: illu.path, status: illu.status },
    pipeline: pipe ?? null,
    ...(state === 'C' ? { rejectionContext } : {}),
  });
}

const audit = {
  builtAt: new Date().toISOString(),
  ledgerBuiltAt: ledger.builtAt,
  totals: {
    crafts: entries.length,
    excluded_X: counts.X,
    missingIllustration_A: counts.A,
    needsGeneration_B: counts.B,
    replaceRejected_C: counts.C,
    awaitingApproval_D: counts.D,
    complete_E: counts.E,
  },
  decisions: ledger.stats,
  illustrations: ledger.stats.illustration,
  conflicts: ledger.stats.conflicted,
  unresolved: (ledger.unresolved ?? []).length,
};

fs.writeFileSync(OUT_QUEUE, JSON.stringify({ ...audit, entries }, null, 1) + '\n', 'utf8');
fs.writeFileSync(OUT_AUDIT, JSON.stringify(audit, null, 1) + '\n', 'utf8');

if (!QUIET) {
  console.log(`crafts                         : ${entries.length}`);
  console.log(`X excluded (swatch/non-gen)    : ${counts.X}`);
  console.log(`A missing/suspect illustration : ${counts.A}`);
  console.log(`B needs generation             : ${counts.B}`);
  console.log(`C replace rejected (failure-aware) : ${counts.C}`);
  console.log(`D awaiting owner approval      : ${counts.D}`);
  console.log(`E complete                     : ${counts.E}`);
  console.log(`\nqueue -> ${path.relative(REPO, OUT_QUEUE).split(path.sep).join('/')}`);
  console.log(`audit -> ${path.relative(REPO, OUT_AUDIT).split(path.sep).join('/')}`);
}
