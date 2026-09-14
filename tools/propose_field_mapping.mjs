#!/usr/bin/env node
/**
 * propose_field_mapping.mjs — surface the EVIDENCE for the catalog fields the
 * supplier mapper could not map, instead of silently dropping them.
 *
 * WHY THIS EXISTS
 * ---------------
 * `map_baoxiniao.mjs` infers a catalog field -> supplier field mapping by
 * voting: if several options of one catalog field appear as VALUE LABELS of one
 * supplier field, that is the mapping, and it is self-validating. It is a good
 * rule and it is kept. But it accepts only a strict majority with >= 2 agreeing
 * options, so it matched 65 of 370 fields and reported the rest as
 * `unmatchedFields` with no detail.
 *
 * Measured against the A-state backlog: of the 74 catalog fields that still have
 * craft options with NO illustration, the mapper covers 18. The other 56 — 469
 * catalog rows — are simply invisible. That is the single largest blocker in the
 * project, and it is a REPORTING gap before it is a matching gap: the supplier
 * dictionaries do contain these parts, nothing has put the two lists side by
 * side.
 *
 * WHAT THIS DOES
 * --------------
 * For every unmapped catalog field that has at least one option lacking a
 * drawing, it scores every supplier field in the right garment category and
 * emits the top candidates with the raw evidence:
 *
 *   labelHits     catalog option labels found among that supplier field's values
 *   fieldNameSim  token overlap between the catalog field name and the supplier
 *                 field label (weak on its own — supplier labels embed their
 *                 default value, e.g. "Shoulder head Regular")
 *   valueCount    how many values that supplier field offers vs our option count
 *   samples       the actual paired labels, so a human can see the join
 *
 * IT PROPOSES. IT NEVER APPLIES. A wrong field mapping puts a chest-pocket
 * drawing behind a ticket pocket, and garment-image-qc cannot see that — it
 * scores fidelity to whatever reference it is handed. Every candidate here has
 * to be read by something that can compare two labels before it is used.
 *
 * USAGE
 *   node tools/propose_field_mapping.mjs
 *   node tools/propose_field_mapping.mjs --write
 *   node tools/propose_field_mapping.mjs --field=ticket-pocket
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUPPLIER_DIR = path.join(REPO, 'data-store', 'supplier');
const QUEUE = path.join(REPO, 'data-store', 'generation-queue.json');
const PROPOSAL = path.join(REPO, 'public', 'images', 'reports', 'baoxiniao-mapping-proposal.json');
const V2 = path.join(REPO, 'public', 'images', 'factory', 'baoxiniao-v2-manifest.json');
const OUT = path.join(REPO, 'public', 'images', 'reports', 'field-mapping-candidates.json');

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const WRITE = process.argv.includes('--write');
const ONLY_FIELD = arg('field', '');
const TOP = Number(arg('top', '4'));

const CATEGORY_PART = { BB: 'jacket', BC: 'shirt', BD: 'trousers', BM: 'vest' };
/** Which supplier dictionary does a catalog row belong to? */
function partFor(product, sectionId) {
  if (/^Trousers-/i.test(sectionId) || product === 'trousers') return 'trousers';
  if (/^Vest-/i.test(sectionId) || product === 'vest') return 'vest';
  if (product === 'shirt') return 'shirt';
  return 'jacket';
}

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = (s) => new Set(norm(s).split(' ').filter((t) => t && t.length > 2));
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

// ── supplier dictionaries ──────────────────────────────────────────────────
const supplier = {};
for (const [code, part] of Object.entries(CATEGORY_PART)) {
  const p = path.join(SUPPLIER_DIR, `craft-labels-${code}.json`);
  if (!fs.existsSync(p)) { console.error(`missing ${p}`); process.exit(1); }
  supplier[part] = JSON.parse(fs.readFileSync(p, 'utf8')).fields;
}

// Which supplier fields actually have a drawing on disk? A field with labels but
// no artwork cannot solve an A-state craft, so rank it last rather than lead a
// reviewer to it.
const withArt = new Map();
if (fs.existsSync(V2)) {
  for (const e of JSON.parse(fs.readFileSync(V2, 'utf8')).images) {
    const k = `${e.part}|${e.field}`;
    withArt.set(k, (withArt.get(k) ?? 0) + 1);
  }
}

// ── the catalog fields that still need a drawing ───────────────────────────
const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
const priorProposals = fs.existsSync(PROPOSAL) ? JSON.parse(fs.readFileSync(PROPOSAL, 'utf8')).proposals : [];
const alreadyMapped = new Set(priorProposals.map((p) => p.field));
/**
 * supplier field -> the catalog field(s) already using it.
 *
 * Read from the LIVE CATALOG, not from the proposal file. Reading the proposal
 * missed both real collisions in this repo: `REKPO` already backs
 * `inner-pocket-closure` (ipc-d/i/x) and `GTECP` already backs
 * `lapel-bh-position`, but both were wired through `/images/supplier-bb/` by an
 * earlier tool and never appeared in the proposal. The catalog is what actually
 * ships, so the catalog is what has to be checked.
 */
const supplierFieldTaken = new Map();
{
  const optDir = path.join(REPO, 'data-store', 'options');
  const record = (code, field) => {
    if (!code) return;
    if (!supplierFieldTaken.has(code)) supplierFieldTaken.set(code, new Set());
    supplierFieldTaken.get(code).add(field);
  };
  const walk = (node, fieldId) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const n of node) walk(n, fieldId); return; }
    const f = node.id && node.options ? node.id : fieldId;
    for (const key of ['image', 'illustration', 'techpackIllustration']) {
      const v = node[key];
      if (typeof v !== 'string') continue;
      const m = v.match(/\/([A-Z]{3,6}\d?)\/[^/]+$/);
      if (m) record(m[1], f ?? '?');
    }
    for (const k of Object.keys(node)) if (typeof node[k] === 'object') walk(node[k], f);
  };
  for (const file of fs.readdirSync(optDir)) {
    if (!file.endsWith('.json')) continue;
    walk(JSON.parse(fs.readFileSync(path.join(optDir, file), 'utf8')), null);
  }
}

const needy = new Map(); // fieldId -> { part, rows, options:Map(optionId->label) }
for (const e of queue.entries) {
  if (e.state !== 'A' || e.why !== 'illustration missing') continue;
  const part = partFor(e.product, e.sectionId);
  const key = e.fieldId;
  if (!needy.has(key)) needy.set(key, { fieldId: key, part, rows: 0, options: new Map() });
  const n = needy.get(key);
  n.rows += 1;
  n.options.set(e.optionId, e.label);
}

const candidates = [];
for (const n of needy.values()) {
  if (alreadyMapped.has(n.fieldId)) continue;
  if (ONLY_FIELD && n.fieldId !== ONLY_FIELD) continue;
  const fields = supplier[n.part] ?? {};
  const ourLabels = [...n.options.values()];
  const ourNormed = ourLabels.map(norm);
  const fieldTok = tokens(n.fieldId.replace(/-/g, ' '));

  const scored = [];
  for (const [code, def] of Object.entries(fields)) {
    // FALSE ATTRACTOR: `REQBV "NJ04/FK3124BK"` is a FABRIC/SKU picker carrying
    // 214 drawings and a generic value list. It surfaced as the top candidate
    // for chest-pocket, pen-pocket, pick-stitching AND sleeve-vent at once, on a
    // single coincidental label hit. A fabric list is never a craft field.
    if (/^[A-Z]{2}\d+\/[A-Z0-9]+$/i.test(String(def.fieldLabel ?? '').trim())) continue;
    const values = def.values ?? [];
    const valueLabels = values.map((v) => v.label);
    const vNormed = valueLabels.map(norm);
    let hits = 0;
    const samples = [];
    for (let i = 0; i < ourNormed.length; i += 1) {
      const j = vNormed.indexOf(ourNormed[i]);
      if (j >= 0) { hits += 1; if (samples.length < 5) samples.push({ ours: ourLabels[i], theirs: valueLabels[j], value: values[j].code }); }
    }
    const nameSim = jaccard(fieldTok, tokens(def.fieldLabel));
    const art = withArt.get(`${n.part}|${code}`) ?? 0;
    if (!hits && nameSim < 0.2) continue;
    scored.push({
      supplierField: code,
      supplierFieldLabel: def.fieldLabel ?? '',
      labelHits: hits,
      ourOptionCount: ourLabels.length,
      supplierValueCount: values.length,
      fieldNameSim: Number(nameSim.toFixed(3)),
      drawingsOnDisk: art,
      samples,
    });
  }
  scored.sort((a, b) => b.labelHits - a.labelHits || b.drawingsOnDisk - a.drawingsOnDisk || b.fieldNameSim - a.fieldNameSim);

  candidates.push({
    catalogField: n.fieldId,
    part: n.part,
    rowsAtStake: n.rows,
    optionCount: n.options.size,
    optionLabels: ourLabels.slice(0, 12),
    verdict: scored.length === 0 ? 'NO_CANDIDATE'
      : scored[0].labelHits >= 2 ? 'STRONG'
      : scored[0].labelHits === 1 ? 'WEAK'
      : 'NAME_ONLY',
    candidates: scored.slice(0, TOP),
  });
}

/**
 * ATTRACTOR DEMOTION.
 *
 * `REQBV` (a fabric SKU list) was excluded by shape. `GTECO "Matching"` — 154
 * values, 154 drawings, a thread/colour picker — is not excluded by shape but
 * behaves identically: it was the TOP candidate for six different catalog fields
 * at once (chest-pocket, pen-pocket, pick-stitching, sleeve-vent,
 * external-decoration, mp3-pocket, elbow-patch) on a single coincidental label
 * hit each time. A field that answers everything answers nothing.
 *
 * So: any supplier field that leads for 3+ catalog fields on ≤1 label hit is
 * demoted out of the top slot everywhere, letting the real second-best candidate
 * surface. It stays in the candidate list, marked, because demoting is a ranking
 * decision and this file must not hide evidence.
 */
// Demotion must REPEAT. Demoting `GTECO` simply promoted `GTEZS` ("Matching to
// fabric", 80 drawings) into the same seven leads, and one pass could not see
// the replacement. Iterate to a fixpoint; a handful of rounds is plenty and the
// bound stops any pathological cycle.
for (let round = 0; round < 8; round += 1) {
  const leads = new Map();
  for (const c of candidates) {
    const t = c.candidates[0];
    if (!t || t.attractor) continue;
    const k = `${c.part}|${t.supplierField}`;
    if (!leads.has(k)) leads.set(k, []);
    leads.get(k).push({ c, t });
  }
  let demoted = 0;
  for (const [, group] of leads) {
    if (group.length < 3) continue;
    if (group.some(({ t }) => t.labelHits > 1)) continue;
    for (const { c, t } of group) {
      t.attractor = `leads ${group.length} catalog fields on ${t.labelHits} label hit(s) - demoted`;
      c.candidates.sort((a, b) => (a.attractor ? 1 : 0) - (b.attractor ? 1 : 0)
        || b.labelHits - a.labelHits || b.drawingsOnDisk - a.drawingsOnDisk || b.fieldNameSim - a.fieldNameSim);
      const nt = c.candidates[0];
      c.verdict = !nt || nt.attractor ? 'NO_CANDIDATE'
        : nt.labelHits >= 2 ? 'STRONG' : nt.labelHits === 1 ? 'WEAK' : 'NAME_ONLY';
      demoted += 1;
    }
  }
  if (!demoted) break;
}

candidates.sort((a, b) => b.rowsAtStake - a.rowsAtStake);

// COLLISION: one supplier field cannot be the answer for two different catalog
// fields. Measured here: REKPO scores 4/4 on `lower-pocket-bartack` AND already
// backs `inner-pocket-closure` — both are D/I/X bartack families with IDENTICAL
// option labels sitting on completely different parts of the jacket. Label
// matching alone can never separate those, so a top candidate claimed by more
// than one catalog field is downgraded and flagged rather than trusted.
const claim = new Map();
for (const c of candidates) {
  const t = c.candidates[0];
  if (!t) continue;
  const k = `${c.part}|${t.supplierField}`;
  if (!claim.has(k)) claim.set(k, []);
  claim.get(k).push(c.catalogField);
}
for (const c of candidates) {
  const t = c.candidates[0];
  if (!t) continue;
  // Claimed by another UNMAPPED field, or already in use by a MAPPED one. The
  // second case is the dangerous one and was invisible at first: REKPO scores
  // 4/4 on `lower-pocket-bartack` while already backing `inner-pocket-closure`
  // — a bartack inside the jacket and a bartack on the hip pocket share the
  // exact D/I/X labels and are different photographs entirely.
  const alsoUnmapped = (claim.get(`${c.part}|${t.supplierField}`) ?? []).filter((f) => f !== c.catalogField);
  const alsoMapped = [...(supplierFieldTaken.get(t.supplierField) ?? [])].filter((f) => f !== c.catalogField);
  const others = [...new Set([...alsoUnmapped, ...alsoMapped])];
  if (!others.length) continue;
  c.collision = {
    supplierField: t.supplierField,
    alsoClaimedBy: others,
    why: 'the same supplier field is the top candidate for more than one catalog field — label evidence cannot separate them; the drawings must be looked at',
  };
  if (c.verdict === 'STRONG') c.verdict = 'STRONG_BUT_COLLIDING';
}

const byVerdict = {};
for (const c of candidates) byVerdict[c.verdict] = (byVerdict[c.verdict] ?? 0) + 1;
const rowsByVerdict = {};
for (const c of candidates) rowsByVerdict[c.verdict] = (rowsByVerdict[c.verdict] ?? 0) + c.rowsAtStake;

const payload = {
  generatedAt: new Date().toISOString(),
  note: 'CANDIDATES ONLY — nothing applied. A field mapping must be confirmed by comparing labels before any drawing is attached to a craft option.',
  unmappedNeedyFields: candidates.length,
  byVerdict, rowsByVerdict,
  fields: candidates,
};
if (WRITE) fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');

console.log(`unmapped catalog fields with missing drawings : ${candidates.length}`);
console.log(`  by verdict : ${JSON.stringify(byVerdict)}`);
console.log(`  rows       : ${JSON.stringify(rowsByVerdict)}`);
console.log('');
for (const c of candidates.slice(0, 14)) {
  const t = c.candidates[0];
  console.log(`${String(c.rowsAtStake).padStart(3)} rows  ${c.catalogField.padEnd(26)} [${c.part}] ${c.verdict}`
    + (t ? `  -> ${t.supplierField} "${String(t.supplierFieldLabel).slice(0, 34)}" hits=${t.labelHits}/${t.ourOptionCount} art=${t.drawingsOnDisk}` : ''));
}
console.log(WRITE ? `\n-> ${path.relative(REPO, OUT).split(path.sep).join('/')}` : '\nreport only — re-run with --write.');
