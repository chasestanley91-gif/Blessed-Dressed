#!/usr/bin/env node
/**
 * map_baoxiniao.mjs — propose a mapping from catalog options to the PRIMARY
 * supplier's craft codes, matched by English label.
 *
 * Why field-scoped
 * ---------------
 * A global label lookup finds "None" or "Regular" in a dozen unrelated fields
 * and would happily wire a collar drawing onto a pocket. Matching is therefore
 * done in two stages: catalog FIELD -> supplier FIELD first, then option label
 * -> value label WITHIN that field only. A value match outside its own field is
 * not evidence.
 *
 * Proposal only. It never edits the catalog: a wrong drawing is invisible to
 * QC (it scores fidelity to the reference, so the more faithfully a wrong
 * drawing is rendered the better it scores), which is exactly why this needs a
 * human read before anything is applied.
 *
 * Usage
 *   node tools/map_baoxiniao.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const SUPPLIER_DIR = path.join(REPO, 'data-store', 'supplier');
const REPORT = path.join(REPO, 'public', 'images', 'reports', 'baoxiniao-mapping-proposal.json');

/** Supplier category code -> the garment part our catalog shares. */
const CATEGORY_PART = { BB: 'jacket', BC: 'shirt', BD: 'trousers', BM: 'vest' };
/** Jacket options are ONE identity across all three jacket products. */
const PRODUCT_PART = { 'suit-2pc': 'jacket', 'suit-3pc': 'jacket', 'sport-coat': 'jacket' };

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** Degrees, centimetres and spacing vary between the two systems. */
const normNum = (s) => norm(s)
  .replace(/(\d)\s*(°|deg|degrees?)/g, '$1deg')
  .replace(/(\d)\s*(cm|centimet(?:er|re)s?)/g, '$1cm')
  .replace(/\s+/g, ' ')
  .trim();

// ── load supplier dictionaries ─────────────────────────────────────────────
const supplier = {};
for (const [code, part] of Object.entries(CATEGORY_PART)) {
  const p = path.join(SUPPLIER_DIR, `craft-labels-${code}.json`);
  if (!fs.existsSync(p)) { console.error(`missing ${p} — run tools/capture_baoxiniao_crafts.mjs --category=${code}`); process.exit(1); }
  supplier[part] = JSON.parse(fs.readFileSync(p, 'utf8')).fields;
}

/**
 * Stage 1 — infer the field mapping by VOTING, not by field name.
 *
 * Supplier field labels embed their default value ("Shoulder head Regular"),
 * so they rarely equal our field names ("Shoulder Style") — name matching found
 * 12 of 370. The option labels are far better evidence: if several options of
 * one catalog field all appear as values of a single supplier field, that IS
 * the mapping, and it is self-validating in a way a name match is not.
 *
 * A field is only accepted when the winning supplier field takes at least half
 * the matched votes AND at least two options agree. One coincidental "None"
 * proves nothing.
 */
function inferField(part, optionLabels) {
  const fields = supplier[part];
  if (!fields) return null;
  const votes = new Map();
  for (const label of optionLabels) {
    const wantExact = norm(label);
    const wantNum = normNum(label);
    if (!wantExact) continue;
    for (const [code, f] of Object.entries(fields)) {
      const hit = (f.values ?? []).some((v) => norm(v.label) === wantExact || normNum(v.label) === wantNum);
      if (hit) votes.set(code, (votes.get(code) ?? 0) + 1);
    }
  }
  if (!votes.size) return null;
  const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  const [code, count] = ranked[0];
  const totalVotes = [...votes.values()].reduce((a, b) => a + b, 0);
  if (count < 2 || count / totalVotes < 0.5) return null;
  return { code, how: 'voted', votes: count, share: +(count / totalVotes).toFixed(2), supplierLabel: fields[code].fieldLabel };
}

// ── walk the catalog ───────────────────────────────────────────────────────
const proposals = [];
const unmatchedFields = [];
const stats = { options: 0, fieldsSeen: 0, fieldsMatched: 0, valueExact: 0, valueNum: 0, valueUnmatched: 0 };

for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const cfg = JSON.parse(fs.readFileSync(path.join(OPTIONS_DIR, file), 'utf8'));

  for (const section of cfg.sections ?? []) {
    const sid = String(section.id ?? '');
    for (const field of section.fields ?? []) {
      let part = PRODUCT_PART[product] ?? product;
      if (/^vest/i.test(sid)) part = 'vest';
      else if (/^trouser/i.test(sid)) part = 'trousers';
      if (!supplier[part]) continue;

      stats.fieldsSeen += 1;
      const fm = inferField(part, (field.options ?? []).map((o) => o.label));
      if (!fm) { unmatchedFields.push({ part, field: field.id, label: field.label ?? field.id, options: (field.options ?? []).length }); continue; }
      stats.fieldsMatched += 1;

      const values = supplier[part][fm.code].values ?? [];
      const byExact = new Map(values.map((v) => [norm(v.label), v]));
      const byNum = new Map(values.map((v) => [normNum(v.label), v]));

      for (const opt of field.options ?? []) {
        stats.options += 1;
        const exact = byExact.get(norm(opt.label));
        const loose = exact ?? byNum.get(normNum(opt.label));
        if (!loose) { stats.valueUnmatched += 1; continue; }
        if (exact) stats.valueExact += 1; else stats.valueNum += 1;

        proposals.push({
          product, part, section: section.id ?? section.label, field: field.id, option: opt.id,
          catalogLabel: opt.label,
          supplier: { field: fm.code, fieldMatch: fm.how, fieldVotes: fm.votes, fieldShare: fm.share, fieldLabel: fm.supplierLabel, value: loose.code, valueLabel: loose.label },
          confidence: exact && fm.share === 1 ? 'high' : 'medium',
        });
      }
    }
  }
}

// Distinct identities — the unit of work, since jacket options repeat across
// three products and should be mapped (and later photographed) once.
const identities = new Set(proposals.map((p) => `${p.part}|${p.field}|${p.option}`));
const high = proposals.filter((p) => p.confidence === 'high');
const highIdentities = new Set(high.map((p) => `${p.part}|${p.field}|${p.option}`));

console.log(`catalog options walked      ${stats.options}`);
console.log(`fields matched to supplier  ${stats.fieldsMatched}/${stats.fieldsSeen}`);
console.log(`option labels matched       ${stats.valueExact} exact + ${stats.valueNum} normalised = ${stats.valueExact + stats.valueNum} (${stats.valueUnmatched} unmatched)`);
console.log(`proposals                   ${proposals.length} rows -> ${identities.size} distinct identities`);
console.log(`  high confidence           ${high.length} rows -> ${highIdentities.size} distinct identities`);

const byPart = {};
for (const p of proposals) byPart[p.part] = (byPart[p.part] ?? 0) + 1;
console.log('by part:', JSON.stringify(byPart));

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  note: 'PROPOSAL ONLY — nothing applied. Field-scoped: an option label is only matched against values of the supplier field its own catalog field mapped to.',
  stats,
  totals: { rows: proposals.length, identities: identities.size, highRows: high.length, highIdentities: highIdentities.size },
  unmatchedFields: unmatchedFields.sort((a, b) => b.options - a.options).slice(0, 100),
  proposals,
}, null, 2) + '\n', 'utf8');
console.log(`\nproposal -> ${path.relative(REPO, REPORT).split(path.sep).join('/')}`);
