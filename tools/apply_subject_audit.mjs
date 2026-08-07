#!/usr/bin/env node
/**
 * apply_subject_audit.mjs — turn the visual subject-match audit into a
 * spend-safe generation queue.
 *
 * Why this gate exists
 * -------------------
 * blueprint_triage.mjs answers "is this file a drawing?" — edge density,
 * dimensions, glyph-ness. It cannot answer "is this the RIGHT drawing?",
 * because subject match is a visual judgement. The distinction is expensive:
 * QC scores fidelity to the reference, so a faithful render of the WRONG
 * drawing scores HIGHER. Such an option passes triage, passes generation,
 * passes QC, and ships a photograph of the wrong thing.
 *
 * Proven on the first cluster ever tested: sleeve-buttonhole "By Hand" is
 * backed by a crop of a lapel-buttonhole POSITION diagram captioned
 * "Both sides" / "Each side of…". Triage passed it as LINE_DRAWING_SMALL.
 *
 * This tool intersects tools/wave_queue.mjs output with the audit verdicts and
 * emits ONLY the clusters whose drawing was visually confirmed to depict the
 * labelled feature.
 *
 * Usage
 *   node tools/apply_subject_audit.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS = path.join(REPO, 'public', 'images', 'reports');
const QUEUE = path.join(REPORTS, 'wave-queue.json');
const OUT = path.join(REPORTS, 'generation-queue-verified.json');

if (!fs.existsSync(QUEUE)) { console.error('run tools/wave_queue.mjs first'); process.exit(1); }

// ── collect every audit batch ──────────────────────────────────────────────
const verdicts = new Map(); // blueprint -> {verdict, evidence}
let batches = 0;
for (const f of fs.readdirSync(REPORTS).filter((f) => /^subject-audit-\d+\.json$/.test(f))) {
  const j = JSON.parse(fs.readFileSync(path.join(REPORTS, f), 'utf8'));
  batches += 1;
  for (const r of j.results ?? []) {
    if (!r.blueprint) continue;
    verdicts.set(r.blueprint, { verdict: String(r.verdict ?? '').toUpperCase(), evidence: r.evidence ?? '' });
  }
}
if (!batches) { console.error('no subject-audit-*.json found — run the audit first'); process.exit(1); }

const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
const verified = [];
const rejected = [];
const unaudited = [];

for (const c of queue.queue ?? []) {
  const bp = c.blueprint;
  const v = bp ? verdicts.get(bp) : undefined;
  if (!v) { unaudited.push(c); continue; }
  if (v.verdict === 'MATCH') verified.push({ ...c, audit: v });
  else rejected.push({ ...c, audit: v });
}

const rowsOf = (list) => list.reduce((n, c) => n + (c.rowsUnlocked ?? 1), 0);
const CREDITS_PER_IMAGE = 0.5;
const ATTEMPTS = 1.75; // historical attempts-per-shipped-image

const summary = {
  generatedAt: new Date().toISOString(),
  auditBatches: batches,
  blueprintsAudited: verdicts.size,
  verified: { clusters: verified.length, rows: rowsOf(verified), estCredits: +(verified.length * CREDITS_PER_IMAGE * ATTEMPTS).toFixed(1) },
  rejected: { clusters: rejected.length, rows: rowsOf(rejected) },
  unaudited: { clusters: unaudited.length, rows: rowsOf(unaudited) },
};

console.log(`audit batches read      ${batches} (${verdicts.size} blueprints)`);
console.log(`VERIFIED  ${String(summary.verified.clusters).padStart(4)} clusters -> ${summary.verified.rows} rows  ~${summary.verified.estCredits} credits`);
console.log(`rejected  ${String(summary.rejected.clusters).padStart(4)} clusters -> ${summary.rejected.rows} rows  (drawing does not depict the label)`);
console.log(`unaudited ${String(summary.unaudited.clusters).padStart(4)} clusters -> ${summary.unaudited.rows} rows  (no verdict — NOT eligible to spend)`);

const byVerdict = {};
for (const r of rejected) byVerdict[r.audit.verdict] = (byVerdict[r.audit.verdict] ?? 0) + 1;
if (Object.keys(byVerdict).length) console.log('rejection reasons:', JSON.stringify(byVerdict));

fs.writeFileSync(OUT, JSON.stringify({
  ...summary,
  note: 'ONLY `verified` may be generated. A cluster without a MATCH verdict is not eligible, because a wrong drawing is invisible to every downstream check.',
  verified, rejected, unaudited,
}, null, 2) + '\n', 'utf8');
console.log(`\n-> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
