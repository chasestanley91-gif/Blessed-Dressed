#!/usr/bin/env node
/**
 * flag_photo_ambiguous.mjs — mark options whose primary photo cannot show what
 * makes them different from a sibling, so the builder leads with the drawing.
 *
 * Why
 * ---
 * The supplier often has ONE drawing for several variants (eleven peak-lapel
 * angles behind a single Peak.jpg; six lower-pocket options behind one photo).
 * QC scores fidelity to the drawing, so regenerating cannot separate them — it
 * actively drives the images together. Until a real per-variant drawing exists,
 * showing the same photograph for options a customer is asked to choose between
 * is the misleading part. The drawing at least matches the family.
 *
 * Grouping is by PART + FIELD — jacket options are shared across suit-2pc,
 * suit-3pc and sport-coat, so the same option appearing on three products is
 * NOT a collision. Only distinct option ids sharing one photo are.
 *
 * Writes exactly one key: `photoAmbiguous: true`. Clears it when the collision
 * is gone. Touches nothing else, and never deletes an option.
 *
 * Usage
 *   node tools/flag_photo_ambiguous.mjs            # dry run
 *   node tools/flag_photo_ambiguous.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const PUBLIC = path.join(REPO, 'public');
const REPORT = path.join(REPO, 'public', 'images', 'reports', 'photo-ambiguous.json');

const APPLY = process.argv.includes('--apply');

/** Jacket options are one identity across all three jacket products. */
const PART_OF = { 'suit-2pc': 'jacket', 'suit-3pc': 'jacket', 'sport-coat': 'jacket' };

const hashCache = new Map();
function contentHash(rel) {
  if (!rel || !rel.startsWith('/')) return rel || null; // remote urls key on themselves
  if (hashCache.has(rel)) return hashCache.get(rel);
  let h = null;
  try {
    h = crypto.createHash('sha1').update(fs.readFileSync(path.join(PUBLIC, rel.replace(/^\//, '').split('?')[0]))).digest('hex').slice(0, 12);
  } catch { h = null; }
  hashCache.set(rel, h);
  return h;
}

// ── collect every option with its part/field identity ──────────────────────
const files = {};
const rows = [];
for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const cfg = JSON.parse(fs.readFileSync(path.join(OPTIONS_DIR, file), 'utf8'));
  files[file] = { cfg, raw: fs.readFileSync(path.join(OPTIONS_DIR, file), 'utf8') };
  for (const s of cfg.sections ?? []) {
    for (const f of s.fields ?? []) {
      for (const o of f.options ?? []) {
        let part = PART_OF[product] ?? product;
        const sid = String(s.id ?? '');
        if (/^vest/i.test(sid)) part = 'vest';
        else if (/^trouser/i.test(sid)) part = 'trousers';
        rows.push({ file, product, part, field: f.id, opt: o });
      }
    }
  }
}

// ── group by part|field|photo-content ──────────────────────────────────────
const groups = new Map();
for (const r of rows) {
  const photo = (r.opt.photos ?? [])[0];
  if (!photo) continue;
  const h = contentHash(photo);
  if (!h) continue; // missing file — the invariants gate reports those separately
  const key = `${r.part}|${r.field}|${h}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

const ambiguous = new Set(); // rows to flag
const families = [];
for (const [key, g] of groups) {
  const distinctOptions = new Set(g.map((r) => r.opt.id));
  if (distinctOptions.size < 2) continue; // same option on 3 products is correct, not a collision
  const drawingHashes = new Set(g.map((r) => contentHash(r.opt.illustration) ?? 'none'));
  for (const r of g) ambiguous.add(r);
  families.push({
    key,
    part: g[0].part,
    field: g[0].field,
    options: [...distinctOptions],
    rows: g.length,
    drawingsDiffer: drawingHashes.size > 1,
  });
}

// ── apply / clear ──────────────────────────────────────────────────────────
let set = 0, cleared = 0;
for (const r of rows) {
  const should = ambiguous.has(r);
  if (should && r.opt.photoAmbiguous !== true) { r.opt.photoAmbiguous = true; set += 1; }
  else if (!should && r.opt.photoAmbiguous !== undefined) { delete r.opt.photoAmbiguous; cleared += 1; }
}

if (APPLY) {
  for (const [file, { cfg, raw }] of Object.entries(files)) {
    fs.writeFileSync(path.join(OPTIONS_DIR, file), JSON.stringify(cfg, null, 2) + (raw.endsWith('\n') ? '\n' : ''), 'utf8');
  }
}

const fixable = families.filter((f) => f.drawingsDiffer).reduce((n, f) => n + f.rows, 0);
const stuck = families.filter((f) => !f.drawingsDiffer).reduce((n, f) => n + f.rows, 0);

console.log(`collision families (part+field): ${families.length} | rows flagged: ${ambiguous.size}`);
console.log(`  drawings differ -> leading with the drawing separates them: ${fixable} rows`);
console.log(`  drawing is shared too -> flagged AND needs a real per-variant drawing: ${stuck} rows`);
console.log(`photoAmbiguous set ${set}, cleared ${cleared}`);
console.log(APPLY ? 'APPLIED' : 'DRY RUN — re-run with --apply to write');

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  families: families.sort((a, b) => b.rows - a.rows),
  totals: { families: families.length, rowsFlagged: ambiguous.size, fixableByDrawing: fixable, needsPerVariantDrawing: stuck },
}, null, 2) + '\n', 'utf8');
console.log(`ledger -> ${path.relative(REPO, REPORT).split(path.sep).join('/')}`);
