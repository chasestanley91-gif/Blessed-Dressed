#!/usr/bin/env node
/**
 * decompose_option_assets.mjs — split the overloaded `image` slot into explicit
 * `illustration` + `photos[]` so every option can carry BOTH its technical
 * drawing and every photograph of it.
 *
 * Why this exists
 * ---------------
 * `image` has always been a single slot. It holds a tech-pack drawing for ~1,402
 * options and an AI photo for ~1,336, and there is not one option where a
 * drawing and a photo coexist there — because shipping a photo OVERWRITES the
 * drawing it was generated from. 1,144 drawings survive in `techpackIllustration`,
 * but that field is not in the TS type and is rendered nowhere, so the customer
 * never sees them.
 *
 * What it does
 * ------------
 * Derives, per option, ADDITIVELY:
 *   illustration        — the drawing. Preferred from `techpackIllustration`,
 *                         else `image` when that is not a photo and not an SVG
 *                         brand glyph. NEVER synthesised from anything else.
 *   photos[]            — every photograph, best first, de-duplicated:
 *                         approved render (image) -> realImage -> aiImage -> images[]
 *   illustrationStatus  — drawing | unverified | needs-source
 *
 * What it must never do
 * ---------------------
 * Delete an option, empty a field, or invent a path. `image`, `realImage`,
 * `aiImage`, `images` and `techpackIllustration` are left byte-identical — the
 * admin UI, the bundled fallback and the e2e suite still read them.
 *
 * Usage
 *   node tools/decompose_option_assets.mjs              # dry run (default)
 *   node tools/decompose_option_assets.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const REPORT = path.join(REPO, 'public', 'images', 'reports', 'decompose-assets.json');

const APPLY = process.argv.includes('--apply');

/** A path under these roots is our own generated photography, not a drawing. */
const PHOTO_DIR = /^\/images\/(generated|ai)\//i;
/** Brand glyphs authored in the storefront palette — icons, never tech packs. */
const GLYPH = /\.svg(\?|#|$)/i;

const isLocal = (p) => typeof p === 'string' && p.startsWith('/');
const isPhotoPath = (p) => isLocal(p) && PHOTO_DIR.test(p);
const isIllustrationPath = (p) => isLocal(p) && !PHOTO_DIR.test(p) && !GLYPH.test(p);

function countOptions(config) {
  let n = 0;
  for (const s of config.sections ?? []) for (const f of s.fields ?? []) n += (f.options ?? []).length;
  return n;
}

const summary = {
  generatedAt: new Date().toISOString(),
  apply: APPLY,
  perFile: {},
  totals: {
    options: 0,
    illustrationSet: 0,
    photosSet: 0,
    photoEntries: 0,
    duplicatesRemoved: 0,
    status: { drawing: 0, unverified: 0, 'needs-source': 0 },
  },
};

for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const full = path.join(OPTIONS_DIR, file);
  const raw = fs.readFileSync(full, 'utf8');
  const config = JSON.parse(raw);
  const before = countOptions(config);

  const per = { options: before, illustrationSet: 0, photosSet: 0, photoEntries: 0, duplicatesRemoved: 0, status: { drawing: 0, unverified: 0, 'needs-source': 0 } };

  for (const section of config.sections ?? []) {
    for (const field of section.fields ?? []) {
      for (const opt of field.options ?? []) {
        // ---- illustration: strictly preferential, never invented -------------
        const illustration = isIllustrationPath(opt.techpackIllustration)
          ? opt.techpackIllustration
          : isIllustrationPath(opt.image)
            ? opt.image
            : null;

        // ---- photos: ordered, de-duplicated, order-stable --------------------
        const photos = [];
        const seen = new Set();
        let dupes = 0;
        const push = (url) => {
          if (typeof url !== 'string' || !url) return;
          if (seen.has(url)) { dupes += 1; return; }
          seen.add(url);
          photos.push(url);
        };
        if (isPhotoPath(opt.image)) push(opt.image); // the approved render leads
        push(opt.realImage);
        push(opt.aiImage);
        for (const u of opt.images ?? []) push(u);

        // ---- write back, additively ------------------------------------------
        if (illustration) opt.illustration = illustration;
        if (photos.length) opt.photos = photos;
        opt.illustrationStatus = illustration
          ? 'drawing'
          : (opt.techpackIllustration || opt.image)
            ? 'unverified' // something was recorded, but it is not a usable drawing
            : 'needs-source';

        if (illustration) per.illustrationSet += 1;
        if (photos.length) { per.photosSet += 1; per.photoEntries += photos.length; }
        per.duplicatesRemoved += dupes;
        per.status[opt.illustrationStatus] += 1;
      }
    }
  }

  const after = countOptions(config);
  if (after !== before) {
    console.error(`ABORT: option count changed in ${file}: ${before} -> ${after}`);
    process.exit(1);
  }

  summary.perFile[file] = per;
  summary.totals.options += per.options;
  summary.totals.illustrationSet += per.illustrationSet;
  summary.totals.photosSet += per.photosSet;
  summary.totals.photoEntries += per.photoEntries;
  summary.totals.duplicatesRemoved += per.duplicatesRemoved;
  for (const k of Object.keys(per.status)) summary.totals.status[k] += per.status[k];

  if (APPLY) {
    const endsWithNewline = raw.endsWith('\n');
    fs.writeFileSync(full, JSON.stringify(config, null, 2) + (endsWithNewline ? '\n' : ''), 'utf8');
  }

  console.log(
    `${file.padEnd(18)} options ${String(per.options).padStart(4)} | illustration ${String(per.illustrationSet).padStart(4)} | photos ${String(per.photosSet).padStart(4)} (${per.photoEntries} entries, ${per.duplicatesRemoved} dupes dropped)`
  );
}

const t = summary.totals;
console.log('---');
console.log(`options            ${t.options}`);
console.log(`illustration set   ${t.illustrationSet}`);
console.log(`photos set         ${t.photosSet} (${t.photoEntries} entries, ${t.duplicatesRemoved} duplicates removed)`);
console.log(`status             drawing ${t.status.drawing} | unverified ${t.status.unverified} | needs-source ${t.status['needs-source']}`);
console.log(APPLY ? 'APPLIED' : 'DRY RUN — re-run with --apply to write');

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.log(`ledger -> ${path.relative(REPO, REPORT).split(path.sep).join('/')}`);
