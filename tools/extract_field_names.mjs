#!/usr/bin/env node
/**
 * extract_field_names.mjs — recover the supplier's HUMAN field names.
 *
 * WHY THIS EXISTS
 * ---------------
 * `craft-labels-<CAT>.json` records, per field code, a `fieldLabel` taken from
 * `valueList[0].tprot`. In this payload `tprot` is always equal to `tprop`, the
 * VALUE label — so `fieldLabel` for KMPCD reads "None" and for KNAMD reads
 * "Left". That is not a field name, and its absence is what made four different
 * interior-pocket fields look identical: every one of them publishes exactly
 * Left / Right / Both / None. Three catalog fields sat blocked for months
 * because nothing in the data said which supplier field was which.
 *
 * The names were never missing. A DIFFERENT endpoint captured in the same
 * session, `getZlpmd`, carries `field` -> `tfiel` (the human name) and `tcont`
 * (the group it appears under in the wizard). The capture tool saved the whole
 * response to `wiz-json-<CAT>.json` and only ever read `getMergeZlcustomData`.
 *
 * Reading it resolves the ambiguity outright:
 *     KMPCD  "Mp3 pocket"                 KAXDK  "Lower coin pocket"
 *     REAPB  "Inner ticket pocket"        KNAMD  "Namecard pocket"
 *     GTECP  "Lapel buttonhole position"  <- not an interior pocket at all
 *
 * Read-only. Writes one merged dictionary.
 *
 * USAGE
 *   node tools/extract_field_names.mjs
 *   node tools/extract_field_names.mjs --grep=pocket
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAP = path.join(REPO, 'factory-screenshots', 'baoxiniao-capture');
const OUT = path.join(REPO, 'data-store', 'supplier', 'field-names.json');
const CATEGORY_PART = { BB: 'jacket', BC: 'shirt', BD: 'trousers', BM: 'vest' };

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const GREP = arg('grep', '');

const byCategory = {};
let total = 0;
const missing = [];

for (const [cat, part] of Object.entries(CATEGORY_PART)) {
  const f = path.join(CAP, `wiz-json-${cat}.json`);
  if (!fs.existsSync(f)) { missing.push(`wiz-json-${cat}.json`); continue; }
  const cap = JSON.parse(fs.readFileSync(f, 'utf8'));
  const hit = cap.find((c) => c.url?.includes('getZlpmd') && c.body?.data?.datas);
  if (!hit) { missing.push(`${cat}: no getZlpmd response in the capture`); continue; }

  const fields = {};
  // datas -> { <profile>: { <contp>: { zlpmdList: [ ... ] } } }
  for (const profile of Object.values(hit.body.data.datas ?? {})) {
    for (const group of Object.values(profile ?? {})) {
      for (const r of group?.zlpmdList ?? []) {
        if (!r?.field) continue;
        // A field can repeat across profiles; first write wins, and a later row
        // may only fill in a name the first one left blank.
        const prev = fields[r.field];
        if (prev && prev.name) continue;
        fields[r.field] = { name: r.tfiel ?? '', group: r.tcont ?? '', contp: r.contp ?? group?.contp ?? '' };
      }
    }
  }
  byCategory[cat] = { part, fieldCount: Object.keys(fields).length, fields };
  total += Object.keys(fields).length;
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'getZlpmd.data.datas[*][*].zlpmdList — field -> tfiel (name), tcont (wizard group)',
  note: 'The human field names. craft-labels-<CAT>.json has NO usable field name: its `fieldLabel` is valueList[0].tprot, which equals the first VALUE label. Join on this file, not on that one.',
  categories: CATEGORY_PART,
  totalFields: total,
  byCategory,
};
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');

console.log(`field names recovered: ${total}`);
for (const [cat, v] of Object.entries(byCategory)) console.log(`   ${cat} ${v.part.padEnd(9)} ${v.fieldCount} fields`);
for (const m of missing) console.log(`   SKIP ${m}`);
if (GREP) {
  const re = new RegExp(GREP, 'i');
  console.log(`\nfields whose name matches /${GREP}/i:`);
  for (const [cat, v] of Object.entries(byCategory)) {
    for (const [code, d] of Object.entries(v.fields)) {
      if (re.test(d.name)) console.log(`   ${cat} ${code.padEnd(9)} ${String(d.group).padEnd(22)} ${d.name}`);
    }
  }
}
console.log(`\n-> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
