#!/usr/bin/env node
/**
 * publish_approved_photos.mjs — write ONLY hash-matched owner-approved local
 * photos onto each craft. Drawing stays in illustration + image.
 *
 *   node tools/publish_approved_photos.mjs
 *   node tools/publish_approved_photos.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const PUBLIC = path.join(REPO, 'public');
const MAP = path.join(REPO, 'data-store/craft-image-map.json');
const APPLY = process.argv.includes('--apply');

const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
const byId = new Map((map.crafts ?? []).map((c) => [c.craftId, c]));

const blocked = [];
const stats = { crafts: 0, published: 0, photos: 0, skippedNoApproval: 0 };

function absOf(p) {
  if (!p) return null;
  p = p.replace(/^\/\/images\//, '/images/');
  if (!p.startsWith('/images/')) return null;
  return path.join(PUBLIC, p.replace(/^\//, '').split('?')[0]);
}
function sha1(abs) {
  return crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex');
}

for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const full = path.join(OPTIONS_DIR, file);
  const cfg = JSON.parse(fs.readFileSync(full, 'utf8'));
  let changed = false;
  for (const s of cfg.sections ?? []) {
    for (const fl of s.fields ?? []) {
      for (const o of fl.options ?? []) {
        const craftId = `${product}|${s.id}|${fl.id}|${o.id}`;
        const row = byId.get(craftId);
        if (!row?.inScope) continue;
        stats.crafts += 1;
        const approved = [];
        for (const p of row.photos ?? []) {
          if (p.verdict !== 'approved') continue;
          const stems = [p.path, ...(p.aliases ?? [])]
            .filter((x) => typeof x === 'string')
            .map((x) => x.replace(/^\/\/images\//, '/images/'));
          const files = new Set();
          for (const s of stems) {
            if (!s.startsWith('/images/')) continue;
            files.add(s);
            if (s.endsWith('.png')) files.add(s.replace(/\.png$/i, '.webp'));
            if (s.endsWith('.webp')) files.add(s.replace(/\.webp$/i, '.png'));
          }
          let hashMatched = false;
          let webpPath = null;
          for (const cand of files) {
            const abs = absOf(cand);
            if (!abs || !fs.existsSync(abs)) continue;
            if (cand.endsWith('.webp')) webpPath = cand;
            if (!p.sha1 || sha1(abs) === p.sha1) hashMatched = true;
          }
          if (hashMatched && webpPath) approved.push(webpPath);
          else blocked.push(`${craftId} cannot publish deployable webp for ${p.path}`);
        }
        if (blocked.length && blocked[blocked.length - 1].startsWith(craftId) && !approved.length) {
          stats.skippedNoApproval += 1;
          continue;
        }
        if (!approved.length) {
          stats.skippedNoApproval += 1;
          continue;
        }
        o.photos = [...new Set(approved)];
        o.images = [];
        const draw = row.drawing?.exists ? row.drawing.path : o.illustration;
        if (draw) {
          o.illustration = draw;
          o.image = draw;
        }
        delete o.realImage;
        delete o.aiImage;
        changed = true;
        stats.published += 1;
        stats.photos += o.photos.length;
      }
    }
  }
  if (changed && APPLY) fs.writeFileSync(full, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}

console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'}  in-scope ${stats.crafts}  crafts published ${stats.published}  photos ${stats.photos}  no-approval ${stats.skippedNoApproval}`);
if (blocked.length) {
  console.log(`blocked ${blocked.length} (first 15):`);
  for (const b of blocked.slice(0, 15)) console.log('  ' + b);
}
if (!APPLY) console.log('\nre-run with --apply to write');
if (blocked.length && APPLY) process.exitCode = 0;
