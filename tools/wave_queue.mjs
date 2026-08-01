#!/usr/bin/env node
/**
 * wave_queue.mjs — order the outstanding generation work by leverage.
 *
 * The catalog's 1,979 in-scope rows collapse to far fewer DISTINCT craft
 * identities, because the same option recurs across shirt / sport-coat /
 * suit-2pc / suit-3pc / trousers / vest. Publishing per identity instead of per
 * row is what makes the catalog affordable at all, and the safe clustering key
 * was proven to be `part|field|option|label` — 1,140 identities, 487 of them
 * multi-row, with ZERO blueprint divergence. (`field|option` alone diverges on 4
 * coin-pocket identities, because a coin pocket on trousers is not the same
 * photograph as one on a jacket.)
 *
 * This tool groups the outstanding work on that key and sorts it by rows
 * unlocked per generation, so the most leveraged clusters run first and the
 * reserve floor bites as late as possible.
 *
 * It also refuses to queue anything it cannot generate honestly:
 *   - no blueprint at all                      -> NEEDS_SOURCE
 *   - blueprint is still a hand-drawn UI glyph -> NEEDS_SOURCE (see
 *     repoint_supplier_blueprints.mjs; generating from a navy rectangle
 *     produces a confident, wrong image that QC cannot see is wrong)
 *   - members disagree about the blueprint     -> BLUEPRINT_DIVERGENCE
 *
 * USAGE
 *   node tools/wave_queue.mjs                 # summary + the next 20 clusters
 *   node tools/wave_queue.mjs --all --json    # the whole queue as JSON
 *   node tools/wave_queue.mjs --write         # persist to public/images/reports/
 *   node tools/wave_queue.mjs --stage=not-started,failed-retry-due
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const PUBLIC = path.join(REPO, 'public');
const INDEX = path.join(PUBLIC, 'images', 'reports', 'repo-index.json');
const OUT = path.join(PUBLIC, 'images', 'reports', 'wave-queue.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
  })
);

const STAGES = new Set(
  (typeof args.stage === 'string' ? args.stage : 'not-started,failed-retry-due,generated-awaiting-qc,prompt-built,spec-only')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

const BRAND_INK = /#?0B1B2E|#?C8BFA8/i;
function isBrandGlyph(webPath) {
  if (typeof webPath !== 'string' || !/\.svg$/i.test(webPath)) return false;
  const abs = path.join(PUBLIC, decodeURIComponent(webPath).replace(/^\//, ''));
  if (!fs.existsSync(abs) || fs.statSync(abs).size > 4096) return false;
  return BRAND_INK.test(fs.readFileSync(abs, 'utf8'));
}

// THE TRIAGE GATE.
// A correct filename is not evidence that a file is a technical drawing.
// /images/jacket/underarm-shield/*.jpg are crops of BUTTON photographs;
// /images/jacket/coin-pocket/both.jpg is a sheet of fabric swatches;
// /images/jacket/sleeve-vent/functional-mock.jpg is blank. Generating from any
// of them produces a confident, wrong image, and garment-image-qc CANNOT catch
// it, because QC scores fidelity to the blueprint — a render faithful to a
// picture of a button scores high.
//
// So a cluster is only generatable when tools/blueprint_triage.mjs has verified
// its blueprint from the pixels. Anything it could not verify waits for a human
// look rather than for a credit.
const TRIAGE = path.join(PUBLIC, 'images', 'reports', 'blueprint-triage.json');
const triageOf = new Map();
if (fs.existsSync(TRIAGE)) {
  for (const r of JSON.parse(fs.readFileSync(TRIAGE, 'utf8')).results || []) {
    triageOf.set(r.blueprint, r);
  }
}

if (!fs.existsSync(INDEX)) {
  console.error(`No ${path.relative(REPO, INDEX)}. Run: node tools/project_state.mjs`);
  process.exit(1);
}
const index = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
const records = index.records || index.options || index;
if (!Array.isArray(records)) {
  console.error('repo-index.json has no records array');
  process.exit(1);
}

const clusters = new Map();
for (const r of records) {
  if (!r.inScope) continue;
  if (!STAGES.has(r.stage)) continue;
  // The proven-safe key. `part` is what separates jacket-pocket from
  // trouser-small-pocket; `label` catches the 4 identities whose rows disagree.
  const key = [r.part ?? '(no part)', r.fieldId ?? r.field, r.optionId ?? r.option, r.label].join('|');
  if (!clusters.has(key)) clusters.set(key, { key, part: r.part ?? null, field: r.fieldId ?? r.field, option: r.optionId ?? r.option, label: r.label, rows: [], blueprints: new Set() });
  const c = clusters.get(key);
  c.rows.push({ product: r.productId ?? r.product, addr: r.addr, stage: r.stage });
  if (r.illustration) c.blueprints.add(r.illustration);
}

const queue = [];
const blocked = [];
for (const c of clusters.values()) {
  const blueprints = [...c.blueprints];
  const entry = {
    key: c.key,
    part: c.part,
    field: c.field,
    option: c.option,
    label: c.label,
    rowsUnlocked: c.rows.length,
    products: [...new Set(c.rows.map((r) => r.product))],
    rows: c.rows,
    blueprint: blueprints[0] ?? null,
    blueprints,
  };
  if (blueprints.length === 0) {
    blocked.push({ ...entry, blockedBy: 'NEEDS_SOURCE', why: 'no technical drawing exists for this option' });
  } else if (blueprints.length > 1) {
    blocked.push({ ...entry, blockedBy: 'BLUEPRINT_DIVERGENCE', why: `cluster members point at ${blueprints.length} different drawings; one photograph cannot serve them` });
  } else if (isBrandGlyph(blueprints[0])) {
    blocked.push({ ...entry, blockedBy: 'NEEDS_SOURCE', why: `blueprint is still a hand-drawn UI glyph (${blueprints[0]}) — generating from it yields a confident wrong image that QC scores as faithful` });
  } else {
    const t = triageOf.get(blueprints[0]);
    if (!t) {
      blocked.push({ ...entry, blockedBy: 'UNTRIAGED', why: 'no blueprint_triage verdict for this drawing — run node tools/blueprint_triage.mjs --all' });
    } else if (t.verdict === 'NOT_A_DRAWING' || t.verdict === 'MISSING') {
      blocked.push({ ...entry, blockedBy: 'NOT_A_DRAWING', triage: t.reasons, why: `blueprint_triage refused this file: ${(t.reasons || []).join('; ')}` });
    } else if (t.verdict === 'SUSPECT') {
      blocked.push({ ...entry, blockedBy: 'UNVERIFIED_BLUEPRINT', triage: t.reasons, why: `blueprint_triage could not verify this file from its pixels: ${(t.reasons || []).join('; ')}` });
    } else if (t.verdict === 'LINE_DRAWING_SMALL') {
      // Generatable, but the drawing is authored below the verified canvas, so
      // roughly 1px is 3-4mm. Fine terminal geometry cannot be read off it —
      // that limit is exactly what closed collar-small-sq-50 and
      // collar-sq-65-btn as UNMET on squared-versus-pointed tips. Carry the
      // caveat through so QC states it rather than inventing a reading.
      queue.push({
        ...entry,
        triage: { verdict: t.verdict, canvas: `${t.width}x${t.height}`, edgeDensity: t.edgeDensity },
        resolutionCaveat: `blueprint is ${t.width}x${t.height} — about 1px per 3-4mm. Grade shape families and counts from it; do NOT claim fine terminal geometry (squared vs pointed tip, 1mm stitch settings) either way.`,
      });
    } else {
      queue.push({ ...entry, triage: { verdict: t.verdict, canvas: `${t.width}x${t.height}`, edgeDensity: t.edgeDensity } });
    }
  }
}

queue.sort((a, b) => b.rowsUnlocked - a.rowsUnlocked || a.key.localeCompare(b.key));
blocked.sort((a, b) => b.rowsUnlocked - a.rowsUnlocked);

const totalRows = queue.reduce((n, c) => n + c.rowsUnlocked, 0);
const blockedRows = blocked.reduce((n, c) => n + c.rowsUnlocked, 0);
const CREDITS_PER_IMAGE = 0.5;
const ATTEMPTS = 1.75; // observed on the live test: ~2 attempts, better after the re-point

const report = {
  generatedAt: new Date().toISOString(),
  by: 'tools/wave_queue.mjs',
  clusterKey: 'part|field|option|label — proven zero blueprint divergence across the in-scope catalog',
  stagesIncluded: [...STAGES],
  generatable: { clusters: queue.length, rows: totalRows, rowsPerGeneration: totalRows / (queue.length || 1) },
  blocked: { clusters: blocked.length, rows: blockedRows, byReason: blocked.reduce((m, b) => ((m[b.blockedBy] = (m[b.blockedBy] || 0) + 1), m), {}) },
  budget: {
    creditsPerImage: CREDITS_PER_IMAGE,
    assumedAttempts: ATTEMPTS,
    estimatedCredits: Math.round(queue.length * ATTEMPTS * CREDITS_PER_IMAGE),
  },
  queue,
  blocked_detail: blocked,
};

if (args.write) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
}

if (args.json) {
  console.log(JSON.stringify(args.all ? report : { ...report, queue: queue.slice(0, 20), blocked_detail: blocked.slice(0, 20) }, null, 2));
  process.exit(0);
}

console.log(`wave_queue — outstanding generation work, ordered by leverage\n`);
console.log(`  GENERATABLE   ${String(queue.length).padStart(4)} clusters  ->  ${totalRows} catalog rows  (${(totalRows / (queue.length || 1)).toFixed(2)} rows per generation)`);
console.log(`  estimated     ${report.budget.estimatedCredits} credits at ${CREDITS_PER_IMAGE}/image x ${ATTEMPTS} attempts\n`);
console.log(`  BLOCKED       ${String(blocked.length).padStart(4)} clusters  ->  ${blockedRows} catalog rows`);
for (const [reason, n] of Object.entries(report.blocked.byReason)) console.log(`                ${String(n).padStart(4)} ${reason}`);

console.log(`\n  NEXT ${Math.min(20, queue.length)} CLUSTERS:`);
for (const c of queue.slice(0, 20)) {
  console.log(`    ${String(c.rowsUnlocked).padStart(2)} rows  ${c.field}/${c.option}  "${c.label}"`);
  console.log(`            ${c.products.join(', ')}  <-  ${c.blueprint}`);
}
if (args.write) console.log(`\nwrote ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
