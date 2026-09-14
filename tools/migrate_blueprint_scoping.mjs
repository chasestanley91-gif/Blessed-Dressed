#!/usr/bin/env node
/**
 * migrate_blueprint_scoping.mjs — move catalog illustrations off the UNSCOPED
 * baoxiniao blueprint path and onto the part-scoped one.
 *
 * THE DEFECT
 * ----------
 * apply_field_mapping.mjs used to publish drawings to
 *     /images/blueprints/baoxiniao/<FIELD>/<VALUE>
 * The supplier reuses a field CODE across garments with DIFFERENT artwork
 * behind it:
 *     KFABL  "Lapel width"       jacket (BB) and vest (BM)
 *     GLKMO  "Front buttonhole"  jacket (BB) / "Buttonhole" trousers (BD)
 * so two garments collapse onto one destination file and whichever is copied
 * first wins. The other silently renders the wrong garment's drawing.
 *
 * Worse for GLKMO: BB and BD also INVERT the value codes (BB A="By machine",
 * BD A="By hands"). The trousers' hand-worked option therefore pointed at a
 * picture of a jacket MACHINE buttonhole — wrong garment and wrong technique at
 * once. The shared-plate audit caught it as 4 collisions.
 *
 * WHY THIS IS SEPARATE FROM THE APPLIER
 * ------------------------------------
 * solveField deliberately skips options that already have a drawing and
 * pre-claims their plates, so pushing them back through the join table finds
 * nothing and reports hundreds of false "no evidence join" rows. This migration
 * needs no solving at all: the destination path already names the field and the
 * value, and the part comes from the section. It is a rename with the correct
 * per-part source, nothing more.
 *
 * Never deletes the old file — other things may still reference it, and V4 §13
 * forbids destroying history. It only copies the right source to the right
 * place and repoints the catalog.
 *
 * USAGE
 *   node tools/migrate_blueprint_scoping.mjs
 *   node tools/migrate_blueprint_scoping.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPT_DIR = path.join(REPO, 'data-store', 'options');
const V2 = path.join(REPO, 'public', 'images', 'factory', 'baoxiniao-v2-manifest.json');
const HISTORY = path.join(REPO, 'data-store', 'illustration-history.json');
const DEST_REL = 'images/blueprints/baoxiniao';
const APPLY = process.argv.includes('--apply');
const NL = String.fromCharCode(10);

const partForSection = (productId, sectionId) => {
  const s = String(sectionId ?? '');
  if (/^Trousers-/i.test(s) || productId === 'trousers') return 'trousers';
  if (/^Vest-/i.test(s) || productId === 'vest') return 'vest';
  if (productId === 'shirt') return 'shirt';
  return 'jacket';
};

/** part|FIELD|VALUE -> the source drawing published by promote_baoxiniao_v2. */
const byKey = new Map();
for (const e of JSON.parse(fs.readFileSync(V2, 'utf8')).images ?? []) {
  byKey.set(`${e.part}|${e.field}|${e.value}`, e.publicPath);
}

const UNSCOPED = new RegExp(`^/${DEST_REL}/([^/]+)/([^/]+)$`);
const SCOPED = new RegExp(`^/${DEST_REL}/(jacket|shirt|trousers|vest)/`);

const moved = [];
const stuck = [];
const events = [];

for (const file of fs.readdirSync(OPT_DIR)) {
  if (!file.endsWith('.json')) continue;
  const productId = file.replace(/\.json$/, '');
  const abs = path.join(OPT_DIR, file);
  const doc = JSON.parse(fs.readFileSync(abs, 'utf8'));
  let dirty = false;

  for (const section of doc.sections ?? []) {
    const part = partForSection(productId, section.id ?? '');
    for (const field of section.fields ?? []) {
      for (const node of field.options ?? []) {
        const cur = node.illustration ?? node.techpackIllustration ?? null;
        if (typeof cur !== 'string') continue;
        if (SCOPED.test(cur)) continue;
        const m = cur.match(UNSCOPED);
        if (!m) continue;
        const supplierField = m[1];
        const value = m[2].replace(/\.[^.]+$/, '');
        const src = byKey.get(`${part}|${supplierField}|${value}`);
        if (!src) {
          stuck.push({ product: productId, option: node.id, part, cur, why: `no ${part}|${supplierField}|${value} in the v2 manifest` });
          continue;
        }
        const dstRel = `/${DEST_REL}/${part}/${supplierField}/${value}${path.extname(src)}`;
        const srcAbs = path.join(REPO, 'public', src.replace(/^\//, ''));
        const dstAbs = path.join(REPO, 'public', dstRel.replace(/^\//, ''));
        if (!fs.existsSync(srcAbs)) {
          stuck.push({ product: productId, option: node.id, part, cur, why: `source missing on disk: ${src}` });
          continue;
        }
        if (APPLY) {
          if (!fs.existsSync(dstAbs)) { fs.mkdirSync(path.dirname(dstAbs), { recursive: true }); fs.copyFileSync(srcAbs, dstAbs); }
          node.illustration = dstRel;
          node.techpackIllustration = dstRel;
          dirty = true;
          // The drawing may genuinely CHANGE here (that is the whole point for
          // the collisions), so the spec must be re-derived before generation.
          const specPath = path.join(REPO, '.craft-pipeline', productId, node.id, 'spec.json');
          if (fs.existsSync(specPath)) {
            fs.writeFileSync(path.join(path.dirname(specPath), 'illustration-changed.json'), JSON.stringify({
              product: productId, optionId: node.id, sectionId: section.id ?? '', fieldId: field.id,
              craftId: `${productId}|${section.id ?? ''}|${field.id}|${node.id}`,
              specWasBuiltFrom: cur, illustrationNow: dstRel,
              detectedAt: new Date().toISOString(),
              by: 'migrate_blueprint_scoping.mjs — destination was unscoped and may have held another garment drawing',
            }, null, 2) + NL, 'utf8');
          }
        }
        events.push({ at: new Date().toISOString(), by: 'migrate_blueprint_scoping.mjs', action: 'rescope', field: field.id, option: node.id, previous: cur, next: dstRel, part, supplier: `${supplierField}/${value}` });
        moved.push({ product: productId, part, field: field.id, option: node.id, from: cur, to: dstRel });
      }
    }
  }
  if (APPLY && dirty) fs.writeFileSync(abs, JSON.stringify(doc, null, 2) + NL, 'utf8');
}

if (APPLY && events.length) {
  const hist = fs.existsSync(HISTORY) ? JSON.parse(fs.readFileSync(HISTORY, 'utf8')) : { events: [] };
  const arr = [...(Array.isArray(hist) ? hist : hist.events ?? []), ...events];
  fs.writeFileSync(HISTORY, JSON.stringify(Array.isArray(hist) ? arr : { ...hist, events: arr }, null, 2) + NL, 'utf8');
}

/** Which of these were genuinely serving the WRONG garment before? */
const before = new Map();
for (const m of moved) {
  if (!before.has(m.from)) before.set(m.from, new Set());
  before.get(m.from).add(m.part);
}
const collisions = [...before.entries()].filter((e) => e[1].size > 1);

console.log(`rescoped                       : ${moved.length}`);
console.log(`  paths shared by 2+ garments (a real defect) : ${collisions.length}`);
for (const c of collisions) console.log(`     ${c[0]}  was serving: ${[...c[1]].join(', ')}`);
console.log(`could not rescope              : ${stuck.length}`);
for (const s of stuck.slice(0, 8)) console.log(`     ${s.product}/${s.option} — ${s.why}`);
console.log(APPLY ? 'applied.' : 'dry run — re-run with --apply.');
