#!/usr/bin/env node
/**
 * propose_kute_mapping.mjs — mine the SECOND supplier library for the craft
 * options baoxiniao could not answer.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every mapping attempt so far has gone through baoxiniao, whose dictionary is a
 * FLAT list of field codes: `REKPO`, `GTECP`, `KFABL`. It carries no grouping at
 * all, which is precisely why three catalog fields could not be separated —
 * nothing in the data says whether a bartack belongs to the inner pocket or the
 * hip pocket.
 *
 * `public/images/factory/kute/` holds 848 drawings from the OTHER supplier, and
 * its manifest carries the thing baoxiniao lacks:
 *
 *     { en: "Casual U canvas", ecode: "00BU", section: "Style > Canvas" }
 *
 * A SECTION PATH. "Pocket > Inner > Inside pocket shape" and
 * "Pocket > Lower > Ticket pocket" are different places on the garment, stated
 * by the manufacturer rather than inferred by us. That is exactly the evidence
 * the baoxiniao route was missing.
 *
 * WHAT IT DOES
 * ------------
 * For every catalog field that still has options with no drawing, it scores each
 * kute section on two independent signals and prints both:
 *
 *   labelHits   catalog option labels found among that section's English labels
 *   sectionSim  token overlap between the section path and the catalog
 *               field/section names — meaningful HERE because the path is real
 *               taxonomy, not a field label with a default value baked in
 *
 * IT PROPOSES. IT NEVER APPLIES. Same rule as everywhere else: a wrong field
 * mapping is invisible to QC, which scores fidelity to whatever it is handed.
 *
 * USAGE
 *   node tools/propose_kute_mapping.mjs
 *   node tools/propose_kute_mapping.mjs --write
 *   node tools/propose_kute_mapping.mjs --field=chest-pocket
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KUTE = path.join(REPO, 'public/images/factory/kute-manifest.json');
const QUEUE = path.join(REPO, 'data-store/generation-queue.json');
const OUT = path.join(REPO, 'public/images/reports/kute-mapping-candidates.json');

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const WRITE = process.argv.includes('--write');
const ONLY = arg('field', '');
const TOP = Number(arg('top', '3'));

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tight = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const toks = (s) => new Set(norm(s).split(' ').filter((t) => t.length > 2));
function jac(a, b) { if (!a.size || !b.size) return 0; let i = 0; for (const t of a) if (b.has(t)) i += 1; return i / (a.size + b.size - i); }

function partFor(product, sectionId) {
  if (/^Trousers-/i.test(sectionId) || product === 'trousers') return 'trousers';
  if (/^Vest-/i.test(sectionId) || product === 'vest') return 'vest';
  if (product === 'shirt') return 'shirt';
  return 'jacket';
}

// ── kute library, grouped by garment + section path ────────────────────────
const kute = JSON.parse(fs.readFileSync(KUTE, 'utf8'));
const sections = new Map(); // "part :: section" -> entries[]
for (const part of Object.keys(kute)) {
  for (const e of kute[part]) {
    const k = `${part} :: ${e.section ?? '?'}`;
    if (!sections.has(k)) sections.set(k, []);
    sections.get(k).push(e);
  }
}

// ── catalog fields still missing drawings ──────────────────────────────────
const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
const needy = new Map();
for (const e of queue.entries) {
  if (e.state !== 'A' || e.why !== 'illustration missing') continue;
  const part = partFor(e.product, e.sectionId);
  const key = `${part}|${e.fieldId}`;
  if (!needy.has(key)) needy.set(key, { part, fieldId: e.fieldId, sectionId: e.sectionId, rows: 0, options: new Map() });
  const n = needy.get(key);
  n.rows += 1;
  n.options.set(e.optionId, e.label);
}

const out = [];
for (const n of needy.values()) {
  if (ONLY && n.fieldId !== ONLY) continue;
  const ourLabels = [...n.options.values()];
  const ourTight = ourLabels.map(tight);
  const fieldToks = toks(`${n.fieldId.replace(/-/g, ' ')} ${String(n.sectionId).replace(/^(Trousers|Vest)-/i, '').replace(/-/g, ' ')}`);

  const scored = [];
  for (const [key, entries] of sections) {
    const [part, section] = key.split(' :: ');
    if (part !== n.part) continue;
    // A "hit" only counts if it lands on a DRAWING NOBODY ELSE CLAIMED. Without
    // this, three different patch pockets ("Patch + Rounded Button Tab",
    // "+ Straight", "+ Angled") all prefix-match the single generic entry
    // "Patch" and the section scored 4/11 STRONG — while actually proposing one
    // plate for four crafts, the shared-image defect wearing a rosette.
    // Collapsed matches are counted separately and reported, never as hits.
    let hits = 0;
    let collapsed = 0;
    const samples = [];
    const claimedBy = new Map();
    for (let i = 0; i < ourTight.length; i += 1) {
      const m = entries.find((e) => tight(e.en) === ourTight[i]
        || (ourTight[i].length > 4 && tight(e.en).startsWith(ourTight[i]))
        || (tight(e.en).length > 4 && ourTight[i].startsWith(tight(e.en))));
      if (!m) continue;
      if (!claimedBy.has(m.ecode)) claimedBy.set(m.ecode, []);
      claimedBy.get(m.ecode).push({ ours: ourLabels[i], theirs: m.en, ecode: m.ecode, path: m.publicPath });
    }
    for (const [, group] of claimedBy) {
      if (group.length > 1) { collapsed += group.length; continue; }
      hits += 1;
      if (samples.length < 5) samples.push(group[0]);
    }
    const sim = jac(fieldToks, toks(section));
    if (!hits && !collapsed && sim < 0.25) continue;
    scored.push({ section, drawings: entries.length, labelHits: hits, collapsedMatches: collapsed, ourOptionCount: ourLabels.length, sectionSim: Number(sim.toFixed(3)), samples });
  }
  scored.sort((a, b) => b.labelHits - a.labelHits || b.sectionSim - a.sectionSim || b.drawings - a.drawings);
  if (!scored.length) continue;

  out.push({
    catalogField: n.fieldId, part: n.part, rowsAtStake: n.rows, optionCount: n.options.size,
    optionLabels: ourLabels.slice(0, 10),
    verdict: scored[0].labelHits >= 2 ? 'STRONG' : scored[0].labelHits === 1 ? 'WEAK' : 'SECTION_ONLY',
    candidates: scored.slice(0, TOP),
  });
}
out.sort((a, b) => b.rowsAtStake - a.rowsAtStake);

const byVerdict = {};
for (const c of out) byVerdict[c.verdict] = (byVerdict[c.verdict] ?? 0) + 1;
const payload = { generatedAt: new Date().toISOString(), note: 'CANDIDATES ONLY - nothing applied.', fieldsWithACandidate: out.length, byVerdict, fields: out };
if (WRITE) fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');

console.log(`needy fields with a kute candidate : ${out.length}`);
console.log(`  by verdict : ${JSON.stringify(byVerdict)}`);
for (const c of out.slice(0, 16)) {
  const t = c.candidates[0];
  console.log(`${String(c.rowsAtStake).padStart(3)}r ${c.catalogField.padEnd(24)}[${c.part.padEnd(8)}] ${c.verdict.padEnd(12)} hits=${t.labelHits}/${t.ourOptionCount} draw=${String(t.drawings).padStart(2)} sim=${t.sectionSim}  "${t.section}"`);
}
console.log(WRITE ? `\n-> ${path.relative(REPO, OUT).split(path.sep).join('/')}` : '\nreport only - re-run with --write.');
