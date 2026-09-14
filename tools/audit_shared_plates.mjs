#!/usr/bin/env node
/**
 * audit_shared_plates.mjs — every drawing serving more than one craft, with the
 * evidence needed to say which craft it actually belongs to.
 *
 * WHY
 * ---
 * Two contaminations have been found so far by stumbling onto them:
 *
 *   GTECP/E  - an INTERIOR POCKET position plate behind a LAPEL buttonhole option
 *   31A6     - a POCKET topstitch plate behind a FLY topstitch option
 *
 * Both were live, both owner-approved, and both photographs happened to come out
 * right anyway. Finding these one at a time is not a method. This enumerates
 * them all.
 *
 * WHAT IT REPORTS, per shared plate:
 *   - every craft using it, with its field and its owner-decision counts
 *   - the FIELD FAMILY the plate's own filename points at: supplier codes are
 *     grouped (31A1 / 31A6 / 31A9 all belong to one family), so the field that
 *     uses the most siblings of this plate is the field it most likely belongs
 *     to, and the others are borrowers
 *   - whether the sharing is legitimate: swatch/thread/button options excluded
 *     from generation by design may share a colour plate (V4 §6)
 *
 * It DECIDES NOTHING. A borrower may be correct and the family heuristic wrong;
 * the point is to put every case on one page with its evidence.
 *
 * USAGE
 *   node tools/audit_shared_plates.mjs
 *   node tools/audit_shared_plates.mjs --write
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPT_DIR = path.join(REPO, 'data-store', 'options');
const QUEUE = path.join(REPO, 'data-store', 'generation-queue.json');
const LEDGER = path.join(REPO, 'data-store', 'image-decision-ledger.json');
const OUT = path.join(REPO, 'public/images/reports/shared-plate-audit.json');

const WRITE = process.argv.includes('--write');

function partFor(product, sectionId) {
  if (/^Trousers-/i.test(sectionId) || product === 'trousers') return 'trousers';
  if (/^Vest-/i.test(sectionId) || product === 'vest') return 'vest';
  if (product === 'shirt') return 'shirt';
  return 'jacket';
}

/** The supplier "family" a plate belongs to: its directory plus the code stem. */
function family(p) {
  const file = p.split('/').pop() ?? '';
  const dir = p.split('/').slice(0, -1).join('/');
  // kutetailor: <hash>__<CODE>__<name>.jpg  -> family is the CODE's leading letters+digits
  const m = file.match(/__([A-Z0-9]{3,6})__/i) ?? file.match(/__([A-Z0-9]{3,6})\./i);
  const code = m ? m[1] : file.replace(/\.[a-z0-9]+$/i, '');
  return `${dir}::${code.replace(/[0-9]+$/, '')}`;
}

const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
const excluded = new Set();
for (const e of queue.entries) {
  if (e.state === 'X') excluded.add(`${partFor(e.product, e.sectionId)}|${e.fieldId}|${e.optionId}`);
}
const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
const decisionsFor = (part, field, option) => {
  let approvals = 0, rejections = 0, live = null;
  for (const [k, c] of Object.entries(ledger.crafts)) {
    const seg = k.split('|');
    if (seg[2] !== field || seg[3] !== option) continue;
    approvals += c.approvedPhotoEvents ?? 0;
    rejections += c.rejectionEvents ?? 0;
    live = live ?? (c.current?.image ?? null);
  }
  return { approvals, rejections, live };
};

// every craft, and every plate in use
const useByPlate = new Map();
const platesByField = new Map();
for (const file of fs.readdirSync(OPT_DIR)) {
  if (!file.endsWith('.json')) continue;
  const doc = JSON.parse(fs.readFileSync(path.join(OPT_DIR, file), 'utf8'));
  const productId = doc.productId ?? path.basename(file, '.json');
  for (const section of doc.sections ?? []) {
    const part = partFor(productId, section.id ?? '');
    for (const field of section.fields ?? []) {
      for (const opt of field.options ?? []) {
        const ill = opt.illustration ?? opt.techpackIllustration;
        if (typeof ill !== 'string' || !ill) continue;
        const craft = `${part}|${field.id}|${opt.id}`;
        if (!useByPlate.has(ill)) useByPlate.set(ill, new Map());
        useByPlate.get(ill).set(craft, { part, field: field.id, option: opt.id, label: opt.label });
        const fk = `${part}|${field.id}`;
        if (!platesByField.has(fk)) platesByField.set(fk, new Set());
        platesByField.get(fk).add(ill);
      }
    }
  }
}

// which field owns each family? the one using the most of its members
const familyUse = new Map();
for (const [fk, plates] of platesByField) {
  for (const p of plates) {
    const f = family(p);
    if (!familyUse.has(f)) familyUse.set(f, new Map());
    familyUse.get(f).set(fk, (familyUse.get(f).get(fk) ?? 0) + 1);
  }
}

const findings = [];
for (const [plate, crafts] of useByPlate) {
  if (crafts.size < 2) continue;
  const real = [...crafts.values()].filter((c) => !excluded.has(`${c.part}|${c.field}|${c.option}`));
  if (real.length < 2) continue;
  const fields = [...new Set(real.map((c) => `${c.part}|${c.field}`))];
  // SAME OPTION IN TWO FIELDS IS NOT CONTAMINATION.
  // `collar_splicing` and `placket_splicing` carry IDENTICAL option sets - all
  // 15 ids appear in both - so `splice-lower-cuff` legitimately uses the same
  // drawing in each. The first version of this audit flagged 15 plates as
  // "borrowed" on that basis alone, which is crying wolf: the drawing is for the
  // OPTION, and the option genuinely exists twice. Contamination means two
  // DIFFERENT crafts sharing one plate.
  const optionIds = new Set(real.map((c) => c.option));
  const sameOptionInTwoFields = optionIds.size === 1 && fields.length > 1;
  const fam = family(plate);
  const owners = [...(familyUse.get(fam) ?? new Map())].sort((a, b) => b[1] - a[1]);
  const likelyOwner = owners.length ? owners[0][0] : null;
  const crossField = fields.length > 1 && !sameOptionInTwoFields;
  findings.push({
    plate,
    family: fam,
    crossField,
    sameOptionInTwoFields,
    duplicateFieldNote: sameOptionInTwoFields
      ? `the option id "${[...optionIds][0]}" exists in ${fields.join(' and ')} - duplicated fields, not a borrowed plate`
      : null,
    fieldsSharing: fields,
    familyOwner: likelyOwner,
    familyUsage: owners.map(([f, n]) => `${f}:${n}`),
    borrowers: crossField && likelyOwner ? fields.filter((f) => f !== likelyOwner) : [],
    crafts: real.map((c) => ({ ...c, ...decisionsFor(c.part, c.field, c.option) })),
  });
}
findings.sort((a, b) => (b.crossField ? 1 : 0) - (a.crossField ? 1 : 0) || b.crafts.length - a.crafts.length);

const crossField = findings.filter((f) => f.crossField);
const payload = { generatedAt: new Date().toISOString(), sharedPlates: findings.length, crossFieldPlates: crossField.length, findings };
if (WRITE) fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');

console.log(`plates serving 2+ generatable crafts : ${findings.length}`);
console.log(`  of those, spanning DIFFERENT fields : ${crossField.length}   <- contamination candidates`);
console.log('');
for (const f of crossField) {
  console.log(`${f.plate.split('/').slice(-1)[0].slice(0, 46)}`);
  console.log(`   fields    : ${f.fieldsSharing.join('  |  ')}`);
  console.log(`   family    : ${f.familyOwner ?? '?'}   (usage ${f.familyUsage.join(', ')})`);
  if (f.borrowers.length) console.log(`   BORROWERS : ${f.borrowers.join(', ')}`);
  for (const c of f.crafts) console.log(`      ${c.field}/${c.option}  approvals=${c.approvals} rejections=${c.rejections}${c.live ? ' LIVE' : ''}`);
}
console.log(WRITE ? `\n-> ${path.relative(REPO, OUT).split(path.sep).join('/')}` : '\nreport only - re-run with --write.');
