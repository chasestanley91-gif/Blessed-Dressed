#!/usr/bin/env node
/**
 * promote_baoxiniao_v2.mjs — publish the CORRECT-category supplier drawings.
 *
 * WHY THIS EXISTS
 * ---------------
 * `public/images/factory/baoxiniao/` was built from a scrape that used the wrong
 * garment category codes (documented in tools/download_baoxiniao_images.mjs):
 *
 *     shirt was scraped as BS  — BS is OVERCOAT; shirt is BC
 *     vest  was scraped as BV  — not a category at all; vest is BM
 *
 * So roughly 5,000 of those 7,224 files sit under the wrong garment. That is the
 * most expensive error this project can make: garment-image-qc scores fidelity
 * TO the reference, so an overcoat drawing faithfully rendered onto a shirt
 * option scores HIGH. Nothing may map a shirt or vest option to that tree again.
 *
 * The corrected downloads live under `factory-screenshots/baoxiniao/<CAT>/` with
 * a `manifest-<CAT>.json` recording field, value, English label and source URL.
 * This tool copies them into a NEW public namespace and writes one combined
 * manifest.
 *
 * NOTHING IS DELETED. The old tree stays exactly where it is — it is still the
 * correct source for BB/jacket, and V4 §13 forbids destroying history either
 * way. What changes is which manifest downstream tools read.
 *
 *   public/images/factory/baoxiniao-v2/<part>/<FIELD>/<VALUE>.jpg
 *   public/images/factory/baoxiniao-v2-manifest.json
 *
 * SAFETY
 *   - dry run by default; --apply is explicit
 *   - magic-byte sniffed, so an HTML error page can never land as a drawing
 *   - never overwrites an existing destination file
 *   - skips zero-byte and implausibly small payloads and reports them
 *
 * USAGE
 *   node tools/promote_baoxiniao_v2.mjs
 *   node tools/promote_baoxiniao_v2.mjs --apply
 *   node tools/promote_baoxiniao_v2.mjs --apply --category=BD
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_ROOT = path.join(REPO, 'factory-screenshots', 'baoxiniao');
const BB_LABELLED = path.join(REPO, 'data-store', 'supplier', 'bb-images-labelled.json');
const BB_SRC_ROOT = path.join(REPO, 'public', 'images', 'factory', 'baoxiniao', 'jacket');
const DEST_ROOT = path.join(REPO, 'public', 'images', 'factory', 'baoxiniao-v2');
const OUT_MANIFEST = path.join(REPO, 'public', 'images', 'factory', 'baoxiniao-v2-manifest.json');

const CATEGORY_PART = { BB: 'jacket', BC: 'shirt', BD: 'trousers', BM: 'vest' };

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const APPLY = process.argv.includes('--apply');
const ONLY = arg('category', '').toUpperCase();

/** Real image, or an HTML error page the server returned with a 200? */
function sniff(buf) {
  if (buf.length < 128) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (buf.slice(0, 6).toString('ascii').startsWith('GIF8')) return 'gif';
  return null;
}

const out = [];
const skipped = [];
let copied = 0, existed = 0;

function place(part, field, value, label, fieldLabel, absSrc, provenance) {
  if (!fs.existsSync(absSrc)) { skipped.push({ part, field, value, why: 'source file missing', src: absSrc }); return; }
  const buf = fs.readFileSync(absSrc);
  const kind = sniff(buf);
  if (!kind) { skipped.push({ part, field, value, why: `not an image (${buf.length} bytes)` }); return; }
  // The supplier serves a tiny placeholder for options that have no artwork.
  // Those are not drawings and must never back a craft option.
  if (buf.length < 1024) { skipped.push({ part, field, value, why: `placeholder-sized (${buf.length} bytes)` }); return; }

  const destDir = path.join(DEST_ROOT, part, field);
  const destAbs = path.join(destDir, `${value}.${kind}`);
  const publicPath = `/images/factory/baoxiniao-v2/${part}/${field}/${value}.${kind}`;
  if (fs.existsSync(destAbs)) { existed += 1; }
  else if (APPLY) { fs.mkdirSync(destDir, { recursive: true }); fs.writeFileSync(destAbs, buf); copied += 1; }
  else { copied += 1; }

  out.push({ part, field, fieldLabel: fieldLabel ?? '', value, label: label ?? '', publicPath, bytes: buf.length, provenance });
}

// ── BB / jacket ────────────────────────────────────────────────────────────
// Prefer `manifest-BB.json` when it exists. `bb-images-labelled.json` is an OLD
// capture covering only 48 of the 244 BB fields - it is why 13 catalog fields
// looked like "the supplier publishes nothing" when in truth they had never been
// requested. A full BB download writes the manifest like every other category.
const BB_MANIFEST = path.join(SRC_ROOT, 'manifest-BB.json');
if ((!ONLY || ONLY === 'BB') && fs.existsSync(BB_MANIFEST)) {
  for (const e of JSON.parse(fs.readFileSync(BB_MANIFEST, 'utf8')).images ?? []) {
    const leaf = String(e.localPath ?? '').split('/').join(path.sep);
    place('jacket', e.field, e.value, e.label, e.fieldLabel, path.join(SRC_ROOT, leaf), 'manifest-BB.json');
  }
} else if (!ONLY || ONLY === 'BB') {
  if (fs.existsSync(BB_LABELLED)) {
    for (const e of JSON.parse(fs.readFileSync(BB_LABELLED, 'utf8')).images ?? []) {
      // localPath is recorded as `suit-jacket/<FIELD>/<VALUE>.jpg`; the files
      // themselves already sit in the public jacket tree, which BB got right.
      const leaf = String(e.localPath ?? '').split('/').slice(1).join(path.sep);
      place('jacket', e.field, e.value, e.label, e.fieldLabel, path.join(BB_SRC_ROOT, leaf), 'bb-images-labelled.json');
    }
  } else skipped.push({ part: 'jacket', why: 'bb-images-labelled.json not found' });
}

// ── BC / BD / BM: the corrected re-downloads ───────────────────────────────
for (const [cat, part] of Object.entries(CATEGORY_PART)) {
  if (cat === 'BB') continue;
  if (ONLY && ONLY !== cat) continue;
  const manifest = path.join(SRC_ROOT, `manifest-${cat}.json`);
  if (!fs.existsSync(manifest)) {
    skipped.push({ part, why: `manifest-${cat}.json not found — run tools/download_baoxiniao_images.mjs --category=${cat}` });
    continue;
  }
  for (const e of JSON.parse(fs.readFileSync(manifest, 'utf8')).images ?? []) {
    const leaf = String(e.localPath ?? '').split('/').join(path.sep);
    place(part, e.field, e.value, e.label, e.fieldLabel, path.join(SRC_ROOT, leaf), `manifest-${cat}.json`);
  }
}

const byPart = {};
for (const e of out) byPart[e.part] = (byPart[e.part] ?? 0) + 1;
const fieldsByPart = {};
for (const e of out) (fieldsByPart[e.part] ??= new Set()).add(e.field);

const payload = {
  generatedAt: new Date().toISOString(),
  note: 'Supplier drawings under the CORRECT garment categories (BB jacket / BC shirt / BD trousers / BM vest). '
    + 'Supersedes baoxiniao-manifest.json, whose shirt bucket was scraped as BS (overcoat) and whose vest bucket was scraped as BV (not a category). '
    + 'The old tree is retained, never deleted; it remains valid for jacket only.',
  categories: CATEGORY_PART,
  counts: byPart,
  fieldCounts: Object.fromEntries(Object.entries(fieldsByPart).map(([k, v]) => [k, v.size])),
  images: out,
};
if (APPLY) fs.writeFileSync(OUT_MANIFEST, JSON.stringify(payload, null, 2) + '\n', 'utf8');

console.log(`images placed      : ${out.length}`);
console.log(`  by part          : ${JSON.stringify(byPart)}`);
console.log(`  fields per part  : ${JSON.stringify(payload.fieldCounts)}`);
console.log(`newly copied       : ${copied}`);
console.log(`already present    : ${existed}`);
console.log(`skipped            : ${skipped.length}`);
for (const s of skipped.slice(0, 8)) console.log(`   SKIP ${s.part ?? '?'}/${s.field ?? '?'}/${s.value ?? '?'} — ${s.why}`);
if (skipped.length > 8) console.log(`   … and ${skipped.length - 8} more`);
console.log(APPLY ? `-> ${path.relative(REPO, OUT_MANIFEST).split(path.sep).join('/')}` : 'dry run — re-run with --apply.');
