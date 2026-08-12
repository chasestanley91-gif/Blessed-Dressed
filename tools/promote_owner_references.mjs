#!/usr/bin/env node
/**
 * promote_owner_references.mjs — turn the reference images the OWNER uploaded in
 * /admin/image-review into each craft's authoritative illustration.
 *
 * Why this exists: 73 decisions carry the tag "Reference drawing itself is wrong".
 * Regenerating those crafts from the same bad drawing reproduces the same failure
 * (V4 §7). The owner answered that by uploading the correct drawing as a review
 * reference. Nothing consumed those uploads — `/api/admin/image-review/reference`
 * only stored them. This tool is the consumer.
 *
 * It does NOT decide by itself whether an upload is the right drawing. It applies a
 * plan produced by vision verification + adversarial re-check (a promotion survives
 * only when the skeptic could not refute it). Anything unrefuted-but-uncertain,
 * photographic, or multi-option stays out of the illustration slot.
 *
 * Illustration rules honoured (tools/catalog_invariants.mjs):
 *   - check 4: `illustration` is only ever that option's own `techpackIllustration`,
 *     so both slots are written to the same verified path — never invented.
 *   - check 5/6: the file must exist on disk and be deploy-included.
 *   - check 7: an illustration is never a photo path. A reference classified as a
 *     photograph is therefore NEVER promoted; it is attached as a generation
 *     reference instead, where a real photo is an asset rather than a violation.
 *
 * History is additive (V4 §13). The previous illustration value is never silently
 * dropped: every change is recorded in the report and appended to
 * data-store/illustration-history.json with its reason and the owner decision that
 * caused it.
 *
 *   node tools/promote_owner_references.mjs --plan=<plan.json>            # report only
 *   node tools/promote_owner_references.mjs --plan=<plan.json> --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const PUBLIC = path.join(REPO, 'public');
const PIPE = path.join(REPO, '.craft-pipeline');
const HISTORY = path.join(REPO, 'data-store', 'illustration-history.json');
const REPORT = path.join(PUBLIC, 'images', 'reports', 'owner-reference-promotion.json');

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};
const APPLY = process.argv.includes('--apply');
const PLAN_PATH = arg('plan', null);
if (!PLAN_PATH) {
  console.error('usage: node tools/promote_owner_references.mjs --plan=<plan.json> [--apply]');
  process.exit(2);
}

const PHOTO_DIR = /^\/images\/(generated|ai)\//i;
const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));

/* ── load catalog ───────────────────────────────────────────────────────────── */
const PRODUCTS = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];
const files = {};
const index = new Map(); // craftId -> option object (live reference into files[])
for (const p of PRODUCTS) {
  const fp = path.join(OPTIONS_DIR, `${p}.json`);
  files[p] = JSON.parse(fs.readFileSync(fp, 'utf8'));
  for (const sec of files[p].sections ?? []) {
    for (const fl of sec.fields ?? []) {
      for (const o of fl.options ?? []) index.set(`${p}|${sec.id}|${fl.id}|${o.id}`, o);
    }
  }
}

const changed = new Set();
const promoted = [];
const refsAttached = [];
const skipped = [];
const staleSpecs = [];

/* ── 1. promote verified drawings into the illustration slot ─────────────────── */
for (const item of plan.promote ?? []) {
  const o = index.get(item.craftId);
  if (!o) { skipped.push({ ...item, why: 'craft not found in catalog' }); continue; }

  const rel = item.refWebPath;
  if (PHOTO_DIR.test(rel)) { skipped.push({ ...item, why: 'refuses photo dir as illustration' }); continue; }
  if (/\.svg(\?|#|$)/i.test(rel)) { skipped.push({ ...item, why: 'refuses svg glyph as illustration' }); continue; }
  const disk = path.join(PUBLIC, decodeURIComponent(rel.replace(/^\//, '')).split('?')[0]);
  if (!fs.existsSync(disk)) { skipped.push({ ...item, why: 'reference file missing on disk' }); continue; }

  const before = { techpackIllustration: o.techpackIllustration ?? '', illustration: o.illustration ?? '', illustrationStatus: o.illustrationStatus ?? '' };
  if (before.techpackIllustration === rel && before.illustration === rel) {
    skipped.push({ ...item, why: 'already the illustration — idempotent no-op' });
    continue;
  }

  o.techpackIllustration = rel;
  o.illustration = rel;
  o.illustrationStatus = 'owner-supplied-verified';
  changed.add(item.craftId.split('|')[0]);
  promoted.push({ craftId: item.craftId, label: o.label ?? '', before, after: rel, confidence: item.confidence ?? null, evidence: item.evidence ?? '', ownerDecisionKey: item.decisionKey ?? '' });

  /* A spec pins the illustration it was extracted from, and a prompt is built from
   * that spec. Swapping the drawing under them would regenerate the craft against
   * the drawing the owner just rejected — the exact failure this tool exists to
   * stop. Mark them stale so stage 1 re-runs; never edit another stage's artifact. */
  const [prod, , , optId] = item.craftId.split('|');
  const pdir = path.join(PIPE, prod, optId);
  const specPath = path.join(pdir, 'spec.json');
  let specIllus = null;
  try { specIllus = JSON.parse(fs.readFileSync(specPath, 'utf8'))?.illustration?.path ?? null; } catch { /* no spec yet */ }
  if (specIllus && specIllus !== rel) {
    staleSpecs.push({ craftId: item.craftId, specIllustration: specIllus, newIllustration: rel, promptExists: fs.existsSync(path.join(pdir, 'prompt.json')) });
    if (APPLY) {
      fs.writeFileSync(path.join(pdir, 'illustration-changed.json'), JSON.stringify({
        craftId: item.craftId,
        staleBecause: 'owner-supplied illustration replaced the one this spec was extracted from',
        specWasBuiltFrom: specIllus,
        illustrationNow: rel,
        requiredAction: 'RE-RUN tech-pack-interpreter, then garment-image-director. Do NOT generate from the existing spec.json/prompt.json.',
        markedAt: new Date().toISOString(),
      }, null, 1));
    }
  }
}

/* ── 2. attach non-promotable references as generation guidance ──────────────── */
/* A photograph or annotated sheet cannot be image #1, but it is exactly the
 * geometry/appearance authority the director should shoot against (V4 §8). */
const byCraftRefs = new Map();
for (const item of plan.referenceOnly ?? []) {
  if (!byCraftRefs.has(item.craftId)) byCraftRefs.set(item.craftId, []);
  byCraftRefs.get(item.craftId).push(item);
}
for (const [craftId, items] of byCraftRefs) {
  const o = index.get(craftId);
  if (!o) { skipped.push({ craftId, why: 'craft not found in catalog' }); continue; }
  const [product, , , optionId] = craftId.split('|');
  const dir = path.join(PIPE, product, optionId);
  const out = path.join(dir, 'owner-references.json');
  const payload = {
    craftId,
    label: o.label ?? '',
    note: 'Owner-uploaded reference images. Authoritative for construction/appearance; '
      + 'NOT usable as the tech-pack illustration (not line art, or shows multiple options).',
    references: items.map((i) => ({
      path: i.refWebPath,
      kind: i.refKind ?? '',
      evidence: i.evidence ?? '',
      ownerNotes: i.ownerNotes ?? '',
      ownerDecisionKey: i.decisionKey ?? '',
    })),
    writtenAt: plan.generatedAt ?? null,
  };
  refsAttached.push({ craftId, count: items.length, out: path.relative(REPO, out).replace(/\\/g, '/'), existed: fs.existsSync(out) });
  if (APPLY) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(out, JSON.stringify(payload, null, 1));
  }
}

/* ── 3. write ───────────────────────────────────────────────────────────────── */
const report = {
  generatedAt: new Date().toISOString(),
  planPath: path.relative(REPO, path.resolve(PLAN_PATH)).replace(/\\/g, '/'),
  applied: APPLY,
  counts: {
    promotedToIllustration: promoted.length,
    craftsGivenGenerationReferences: refsAttached.length,
    specsInvalidated: staleSpecs.length,
    skipped: skipped.length,
    planPromote: (plan.promote ?? []).length,
    planReferenceOnly: (plan.referenceOnly ?? []).length,
    planRejected: (plan.rejected ?? []).length,
    planNeedsHuman: (plan.needsHuman ?? []).length,
  },
  promoted,
  referencesAttached: refsAttached,
  specsInvalidated: staleSpecs,
  skipped,
  rejected: plan.rejected ?? [],
  needsHuman: plan.needsHuman ?? [],
};

if (APPLY) {
  for (const p of changed) {
    fs.writeFileSync(path.join(OPTIONS_DIR, `${p}.json`), JSON.stringify(files[p], null, 2));
  }
  const hist = fs.existsSync(HISTORY) ? JSON.parse(fs.readFileSync(HISTORY, 'utf8')) : { note: 'Append-only illustration provenance. Never rewritten.', events: [] };
  for (const p of promoted) {
    hist.events.push({
      at: report.generatedAt,
      craftId: p.craftId,
      change: 'illustration-replaced',
      from: p.before.techpackIllustration || '(none)',
      to: p.after,
      reason: 'owner uploaded the correct drawing after rejecting the previous one',
      ownerDecisionKey: p.ownerDecisionKey,
      confidence: p.confidence,
      source: 'promote_owner_references.mjs',
    });
  }
  fs.writeFileSync(HISTORY, JSON.stringify(hist, null, 1));
}
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));

/* ── 4. report ──────────────────────────────────────────────────────────────── */
console.log(`plan                       : ${report.planPath}`);
console.log(`promoted to illustration   : ${promoted.length}`);
console.log(`crafts given gen references: ${refsAttached.length}`);
console.log(`specs invalidated (re-run stage 1): ${staleSpecs.length}`);
console.log(`skipped                    : ${skipped.length}`);
console.log(`plan rejected / needs-human: ${report.counts.planRejected} / ${report.counts.planNeedsHuman}`);
for (const p of promoted.slice(0, 25)) {
  console.log(`  PROMOTE ${p.craftId}\n     ${p.before.techpackIllustration || '(none)'} -> ${p.after}`);
}
if (promoted.length > 25) console.log(`  … ${promoted.length - 25} more`);
for (const s of skipped.slice(0, 15)) console.log(`  SKIP ${s.craftId} — ${s.why}`);
console.log(`report -> ${path.relative(REPO, REPORT).replace(/\\/g, '/')}`);
if (!APPLY) console.log('\ndry run — nothing written to the catalog. Re-run with --apply.');
else console.log(`\nwrote ${changed.size} catalog file(s) + illustration-history.json`);
