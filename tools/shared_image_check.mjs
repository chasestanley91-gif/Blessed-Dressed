#!/usr/bin/env node
/**
 * shared_image_check.mjs — no photograph may sell two different craft options.
 *
 * One generated file legitimately serves many catalog rows: a jacket lapel
 * appears on suit-2pc, suit-3pc and sport-coat, and that is one garment feature
 * photographed once. What is never legitimate is one file serving two rows that
 * are genuinely different options — a 7-loop waistband standing in for the
 * 5-loop option, or a trouser coin pocket standing in for the jacket's.
 *
 * Why this exists: 382 options share an option id with a DIFFERENT option
 * inside the same product file (68 ids in shirt alone — `stitch-01-top` names
 * a collar, a placket and a cuff option). The pipeline stores work at
 * `.craft-pipeline/<product>/<optionId>/`, so those three overwrite one
 * another's spec.json and a single PASS marks all three finished. Measured
 * 2026-08-10: that collision put a trouser coin-pocket photograph on three
 * jacket rows, and provenance in spec.json was destroyed so the metadata could
 * not be used to detect it. Only the wiring can.
 *
 * The identity of a craft option is (garment scope, field, option) — NOT the
 * option id, and NOT the field id alone, because `coin-pocket` names both a
 * jacket field and a trouser field.
 *
 * Exit 1 on any defect. Run at every checkpoint.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const ALLOWLIST = path.join(REPO, 'public/images/reports/shared-image-allowlist.json');

/**
 * Which garment does this section describe? A suit file carries jacket,
 * trouser and vest sections; the standalone files carry only their own, and
 * their sections are NOT prefixed, so the product has to be consulted first.
 */
function scopeOf(product, sectionId) {
  if (product === 'trousers') return 'TROUSERS';
  if (product === 'vest') return 'VEST';
  if (product === 'shirt') return 'SHIRT';
  if (/^trousers[-_]/i.test(sectionId)) return 'TROUSERS';
  if (/^vest[-_]/i.test(sectionId)) return 'VEST';
  return 'JACKET';
}

const allow = new Set(fs.existsSync(ALLOWLIST)
  ? (JSON.parse(fs.readFileSync(ALLOWLIST, 'utf8')).allow ?? [])
  : []);

const byFile = new Map();
for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const cfg = JSON.parse(fs.readFileSync(path.join(OPTIONS_DIR, file), 'utf8'));
  for (const s of cfg.sections ?? []) {
    for (const fl of s.fields ?? []) {
      for (const o of fl.options ?? []) {
        // Only our own output is checked. A supplier drawing shared by two
        // options is a different defect, already covered by validate_spec.
        for (const img of [o.image, o.illustration, ...(o.photos ?? [])]) {
          if (typeof img !== 'string' || !img.includes('/images/generated/')) continue;
          if (!byFile.has(img)) byFile.set(img, []);
          byFile.get(img).push({
            product, sectionId: s.id, fieldId: fl.id, optionId: o.id, label: o.label,
            identity: `${scopeOf(product, s.id)}|${fl.id}|${o.id}`,
          });
        }
      }
    }
  }
}

const defects = [];
for (const [img, rows] of byFile) {
  const identities = [...new Set(rows.map((r) => r.identity))];
  if (identities.length > 1 && !allow.has(img)) defects.push({ img, identities, rows });
}

for (const d of defects) {
  console.log(`DEFECT  ${d.img}`);
  console.log(`        sells ${d.identities.length} different craft options:`);
  for (const r of d.rows) {
    console.log(`          ${r.identity.padEnd(34)} ${r.product} > ${r.sectionId}/${r.fieldId} > ${r.optionId}  ${JSON.stringify(r.label)}`);
  }
}

console.log(`\ngenerated files in use : ${byFile.size}`);
console.log(`allowlisted            : ${allow.size}`);
console.log(defects.length
  ? `DEFECTS                : ${defects.length}  — a photograph is selling an option it does not show`
  : 'no shared-image defects');

process.exit(defects.length ? 1 : 0);
