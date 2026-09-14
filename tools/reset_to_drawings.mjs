#!/usr/bin/env node
/**
 * reset_to_drawings.mjs — customer catalog shows drawings only.
 * Does not delete image files. Dry run by default; pass --apply to write.
 *
 *   node tools/reset_to_drawings.mjs
 *   node tools/reset_to_drawings.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const MAP = path.join(REPO, 'data-store/craft-image-map.json');
const APPLY = process.argv.includes('--apply');

const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
const byId = new Map((map.crafts ?? []).map((c) => [c.craftId, c]));

const stats = {
  files: 0,
  options: 0,
  drawingsSet: 0,
  drawingsCleared: 0,
  remotesStripped: 0,
  photosCleared: 0,
};

function stripRemote(v) {
  if (typeof v === 'string' && /^https?:\/\//i.test(v)) {
    stats.remotesStripped += 1;
    return true;
  }
  return false;
}

for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const full = path.join(OPTIONS_DIR, file);
  const cfg = JSON.parse(fs.readFileSync(full, 'utf8'));
  stats.files += 1;
  let changed = false;

  for (const s of cfg.sections ?? []) {
    for (const fl of s.fields ?? []) {
      for (const o of fl.options ?? []) {
        stats.options += 1;
        const craftId = `${product}|${s.id}|${fl.id}|${o.id}`;
        const row = byId.get(craftId);

        const before = JSON.stringify({
          image: o.image, illustration: o.illustration, photos: o.photos,
          images: o.images, realImage: o.realImage, aiImage: o.aiImage,
          illustrationStatus: o.illustrationStatus,
        });

        if (Array.isArray(o.images)) {
          const next = o.images.filter((p) => typeof p === 'string' && !/^https?:\/\//i.test(p));
          stats.remotesStripped += o.images.length - next.length;
          o.images = [];
        }
        if (Array.isArray(o.photos)) {
          stats.photosCleared += o.photos.length;
        }

        if (row?.inScope) {
          const draw = row.drawing?.exists ? row.drawing.path : null;
          if (draw) {
            o.illustration = draw;
            o.image = draw;
            o.illustrationStatus = row.drawing.status === 'verified-match' ? 'drawing' : 'unverified';
            stats.drawingsSet += 1;
          } else {
            delete o.image;
            delete o.illustration;
            o.illustrationStatus = 'needs-source';
            stats.drawingsCleared += 1;
          }
          o.photos = [];
          o.images = [];
          delete o.realImage;
          delete o.aiImage;
        } else {
          if (stripRemote(o.image)) delete o.image;
          if (stripRemote(o.illustration)) delete o.illustration;
          if (Array.isArray(o.photos)) o.photos = o.photos.filter((p) => typeof p === 'string' && p.startsWith('/images/'));
          o.images = [];
          if (stripRemote(o.realImage)) delete o.realImage;
          if (stripRemote(o.aiImage)) delete o.aiImage;
        }

        const PHOTO = /^\/images\/(generated|ai|real|review)\//i;
        if (typeof o.image === 'string' && PHOTO.test(o.image)) {
          const draw = row?.drawing?.exists ? row.drawing.path
            : (typeof o.illustration === 'string' && !PHOTO.test(o.illustration) ? o.illustration : null);
          if (draw) { o.image = draw; o.illustration = o.illustration || draw; }
          else delete o.image;
        }

        const after = JSON.stringify({
          image: o.image, illustration: o.illustration, photos: o.photos,
          images: o.images, realImage: o.realImage, aiImage: o.aiImage,
          illustrationStatus: o.illustrationStatus,
        });
        if (before !== after) changed = true;
      }
    }
  }

  if (changed && APPLY) {
    fs.writeFileSync(full, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  }
}

console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'}  files ${stats.files}  options ${stats.options}`);
console.log(`drawings set ${stats.drawingsSet}  cleared (no source) ${stats.drawingsCleared}`);
console.log(`photo slots emptied ${stats.photosCleared}  remote URLs stripped ${stats.remotesStripped}`);
if (!APPLY) console.log('\nre-run with --apply to write data-store/options/*.json');
