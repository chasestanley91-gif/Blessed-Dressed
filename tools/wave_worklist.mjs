#!/usr/bin/env node
/**
 * wave_worklist.mjs — the generation work list, derived from the V4 decision
 * queue instead of from QC verdicts.
 *
 * WHY THIS EXISTS
 * ---------------
 * `build_generation_queue.mjs` decides "already done" from `qc.json.verdict`.
 * That was the rule before the owner's decisions became authoritative. Under
 * PROJECT-GOAL-V4 it is wrong in both directions:
 *
 *   - a craft whose QC said PASS but that the OWNER REJECTED is treated as
 *     finished, so its failure-aware retry never gets queued (V4 §7);
 *   - a craft the owner APPROVED but whose QC never ran, or ran FAIL, is
 *     queued for regeneration and a credit is spent reproducing something the
 *     owner already accepted (V4 §6: "do NOT regenerate already-approved
 *     images").
 *
 * The authority is `data-store/generation-queue.json`, built by
 * generation_queue.mjs from the merged decision ledger. Only states B (never
 * photographed) and C (owner rejected — retry with the failure encoded) are
 * generation work. A, D, E and X are not.
 *
 * CLUSTERING
 * ----------
 * One photograph serves every catalog row that is literally the same garment
 * feature. `wave_queue.mjs` proved the safe key is `part|field|option|label`
 * (`field|option` alone collides a trouser coin pocket with a jacket's). This
 * tool uses that key AND additionally requires every member of a cluster to
 * point at the SAME blueprint — a divergence splits the cluster rather than
 * silently picking one drawing for both.
 *
 * A cluster is dropped, never guessed, when:
 *   - its blueprint is missing from the catalog row or absent from disk;
 *   - its members disagree about the blueprint in a way the key does not split;
 *   - its blueprint ALSO backs a different craft identity (see below).
 *
 * THE SHARED-BLUEPRINT WITHHOLD
 * -----------------------------
 * If one drawing backs two identities, that drawing by definition does not
 * contain what separates them, and the image model would have to invent the
 * difference. Measured on the first V4 wave: one `0002__Peak.jpg` backed ten
 * peak lapels from 99° to 120°, one `Match_fabric.webp` backed four different
 * lining colours, one `0101__Normal.jpg` backed three welt widths. Generating
 * those produces near-identical photographs whose only distinction is a number
 * the render invented — V4 §3 (no generic category illustration), §6 (no
 * duplicates to pad a count), §10 (never an image from the wrong craft) and the
 * §20 "zero shared-image defects" invariant, all at once. Worse, it is
 * invisible to QC, which scores fidelity TO the drawing.
 *
 * These are withheld from the wave and reported as `sharedBlueprint` so they
 * get a craft-specific drawing first. Nothing is deleted and nothing is
 * decided about them here.
 *
 * USAGE
 *   node tools/wave_worklist.mjs                 # summary + top clusters
 *   node tools/wave_worklist.mjs --write         # persist the work list
 *   node tools/wave_worklist.mjs --state=C       # restrict to one queue state
 *   node tools/wave_worklist.mjs --limit=40
 *
 * Output shape is byte-compatible with generation-worklist.json so
 * prep_batch.mjs consumes it unchanged via --worklist=.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PUBLIC = path.join(REPO, 'public');
const QUEUE = path.join(REPO, 'data-store', 'generation-queue.json');
const OUT = path.join(PUBLIC, 'images', 'reports', 'wave-worklist.json');
const SPEC_LIB = pathToFileURL(path.join(os.homedir(), '.claude/skills/tech-pack-interpreter/scripts/lib/spec.mjs')).href;
const CAT_LIB = pathToFileURL(path.join(os.homedir(), '.claude/skills/tech-pack-interpreter/scripts/lib/catalog.mjs')).href;
const { extractSpec } = await import(SPEC_LIB);
const { resolveCatalog, iterateOptions } = await import(CAT_LIB);

const arg = (k, d) => { const h = process.argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const WRITE = process.argv.includes('--write');
const LIMIT = Number(arg('limit', 0));
const STATES = new Set(String(arg('state', 'B,C')).split(',').map((s) => s.trim()).filter(Boolean));

const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
const wanted = new Map(); // craftId -> queue entry
for (const e of queue.entries) if (STATES.has(e.state)) wanted.set(e.craftId, e);

// Re-derive part/section/label from the catalog itself rather than trusting the
// queue's copy: `part` is a spec-level concept the queue does not carry, and it
// is half of the clustering key.
const cat = resolveCatalog({ options: path.join(REPO, 'data-store', 'options'), public: PUBLIC });
const diskPath = (webPath) => path.join(PUBLIC, decodeURIComponent(String(webPath)).replace(/^\//, '').split('/').join(path.sep));

const clusters = new Map();
const dropped = [];

for (const opt of iterateOptions(cat)) {
  const spec = extractSpec(opt);
  const craftId = `${spec.productId}|${opt.sectionId}|${opt.fieldId}|${opt.optionId}`;
  const qe = wanted.get(craftId);
  if (!qe) continue;

  const illustration = spec.illustration ?? qe.illustration?.path ?? null;
  if (!illustration) { dropped.push({ craftId, reason: 'no blueprint on the catalog row' }); continue; }
  if (/^https?:/i.test(illustration)) { dropped.push({ craftId, reason: 'blueprint is a remote URL, not a local asset' }); continue; }
  const disk = diskPath(illustration);
  if (!fs.existsSync(disk)) { dropped.push({ craftId, reason: `blueprint not on disk: ${illustration}` }); continue; }

  // part|field|option|label is the proven-safe identity; the blueprint is
  // appended so a divergence splits the cluster instead of hiding inside it.
  const key = `${spec.part}|${opt.fieldId}|${opt.optionId}|${spec.label}|${illustration}`;
  if (!clusters.has(key)) {
    clusters.set(key, {
      identity: `${spec.part}|${opt.fieldId}|${opt.optionId}`,
      part: spec.part,
      product: spec.productId,
      section: opt.sectionId,
      field: opt.fieldId,
      option: opt.optionId,
      label: spec.label,
      orientation: null,
      illustration,
      illustrationDisk: disk,
      states: {},
      rows: [],
    });
  }
  const c = clusters.get(key);
  c.rows.push(craftId);
  c.states[qe.state] = (c.states[qe.state] ?? 0) + 1;
}

// A cluster whose key differs ONLY by label is one craft the catalog names two
// ways (`lapel-fishtail` is "Italian Fishtail Lapel" in one product and
// "Italian Fishmouth Lapel" in another). Merge those before the shared-blueprint
// test, or a naming inconsistency would read as a shared-image defect.
const byCraft = new Map();
for (const c of clusters.values()) {
  const k = `${c.part}|${c.field}|${c.option}|${c.illustration}`;
  const seen = byCraft.get(k);
  if (!seen) { byCraft.set(k, c); continue; }
  seen.rows.push(...c.rows);
  for (const [s, n] of Object.entries(c.states)) seen.states[s] = (seen.states[s] ?? 0) + n;
  (seen.labelVariants ??= [seen.label]).push(c.label);
}

// A drawing that backs more than one craft identity cannot be the authority for
// either of them. Withhold, report, never guess the difference.
const identitiesPerBlueprint = new Map();
for (const c of byCraft.values()) {
  if (!identitiesPerBlueprint.has(c.illustration)) identitiesPerBlueprint.set(c.illustration, []);
  identitiesPerBlueprint.get(c.illustration).push(c);
}
const withheld = [];
for (const [illustration, group] of identitiesPerBlueprint) {
  if (group.length < 2) continue;
  for (const c of group) {
    withheld.push({
      identity: c.identity, product: c.product, option: c.option, label: c.label,
      illustration, rows: c.rows.length,
      reason: 'sharedBlueprint',
      alsoBacks: group.filter((o) => o !== c).map((o) => `${o.option} "${o.label}"`),
    });
    byCraft.delete(`${c.part}|${c.field}|${c.option}|${c.illustration}`);
  }
}

// Most leveraged first: a cluster that unlocks 3 catalog rows for one credit
// beats one that unlocks 1. Within a tie, retries (C) before first-shots (B) —
// a retry has the owner's own words attached and is the likelier to land.
const work = [...byCraft.values()].sort((a, b) =>
  b.rows.length - a.rows.length
  || (b.states.C ?? 0) - (a.states.C ?? 0)
  || a.identity.localeCompare(b.identity));

const limited = LIMIT > 0 ? work.slice(0, LIMIT) : work;
const rowsCovered = limited.reduce((n, c) => n + c.rows.length, 0);

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'data-store/generation-queue.json',
  queueBuiltAt: queue.builtAt,
  states: [...STATES].sort(),
  queueRows: wanted.size,
  identities: work.length,
  rowsCovered,
  dropped: dropped.length,
  droppedItems: dropped,
  withheldSharedBlueprint: withheld.length,
  withheldItems: withheld,
  work: limited,
};

if (WRITE) {
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

console.log(`queue rows (${[...STATES].sort().join('+')})  : ${wanted.size}`);
console.log(`dropped — no usable blueprint : ${dropped.length}`);
console.log(`withheld — shared blueprint   : ${withheld.length}  (${new Set(withheld.map((w) => w.illustration)).size} drawing(s) backing >1 craft)`);
console.log(`WORK (identities)             : ${work.length}   covering ${work.reduce((n, c) => n + c.rows.length, 0)} catalog rows`);
if (LIMIT > 0) console.log(`emitted (--limit=${LIMIT})         : ${limited.length}   covering ${rowsCovered} rows`);
console.log(WRITE ? `-> ${path.relative(REPO, OUT).split(path.sep).join('/')}` : 'report only — re-run with --write.');
for (const c of limited.slice(0, 20)) {
  console.log(`   ${String(c.rows.length).padStart(2)} rows  ${c.product}/${c.option}  ${JSON.stringify(c.label)}  [${Object.entries(c.states).map(([s, n]) => s + n).join(' ')}]`);
}
