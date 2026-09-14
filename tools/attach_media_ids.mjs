#!/usr/bin/env node
/**
 * attach_media_ids.mjs — re-attach Higgsfield media ids to a prepared batch.
 *
 * prep_batch.mjs rewrites batch-payload.json from scratch every run, which drops
 * any media id written onto it. Uploading the same drawing again for every
 * re-prep is wasted work and invites an index/id mismatch, so the mapping lives
 * in its own durable file keyed by the PUBLIC URL of the asset — the one thing
 * that identifies a drawing independently of its position in a batch.
 *
 *   data-store/higgsfield-media-map.json   { "<public url>": "<media uuid>" }
 *
 * USAGE
 *   node tools/attach_media_ids.mjs --set=<url>=<media_id> [--set=...]
 *   node tools/attach_media_ids.mjs --apply     # write ids onto batch-payload.json
 */
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const MAP = path.join(REPO, 'data-store', 'higgsfield-media-map.json');
const PAYLOAD = path.join(REPO, 'public/images/reports/batch-payload.json');
const PIPE = path.join(REPO, '.craft-pipeline');

const sets = process.argv.filter((a) => a.startsWith('--set=')).map((a) => a.slice(6));
const APPLY = process.argv.includes('--apply');

let map = fs.existsSync(MAP) ? JSON.parse(fs.readFileSync(MAP, 'utf8')) : {};
for (const s of sets) {
  const i = s.lastIndexOf('=');
  const url = s.slice(0, i), id = s.slice(i + 1);
  if (!url || !id) { console.error(`bad --set: ${s}`); process.exit(1); }
  if (map[url] && map[url] !== id) console.log(`  note: remapping ${url}\n        ${map[url]} -> ${id}`);
  map[url] = id;
}
if (sets.length) {
  fs.writeFileSync(MAP, JSON.stringify(map, null, 2) + '\n', 'utf8');
  console.log(`media map: ${Object.keys(map).length} entries`);
}

if (!APPLY) process.exit(0);

const ORIGIN = 'https://customsuits.net';
const webToUrl = (p) => ORIGIN + String(p).split('/').map(encodeURIComponent).join('/').replace(/^%2F/, '/');

const b = JSON.parse(fs.readFileSync(PAYLOAD, 'utf8'));
const missing = [];
for (const it of b.items) {
  it.mediaId = map[it.publicUrl] ?? null;
  if (!it.mediaId) missing.push(`[${it.index}] blueprint ${it.publicUrl}`);

  // Owner reference photographs travel with the blueprint. Withheld ones were
  // judged not to depict this craft and must never reach the generator.
  const f = path.join(PIPE, it.product, it.option, 'owner-references.json');
  it.ownerReferenceMedia = [];
  if (fs.existsSync(f)) {
    for (const r of (JSON.parse(fs.readFileSync(f, 'utf8')).references ?? [])) {
      if (r.withheld) continue;
      const url = webToUrl(r.path);
      const id = map[url] ?? null;
      if (!id) { missing.push(`[${it.index}] owner ref ${url}`); continue; }
      it.ownerReferenceMedia.push({ path: r.path, url, mediaId: id });
    }
  }
}
const ids = b.items.map((i) => i.mediaId).filter(Boolean);
if (new Set(ids).size !== ids.length) { console.error('ERROR: duplicate blueprint media id across items.'); process.exit(1); }
fs.writeFileSync(PAYLOAD, JSON.stringify(b, null, 2) + '\n', 'utf8');

console.log(`blueprints attached : ${ids.length} / ${b.items.length}`);
console.log(`owner refs attached : ${b.items.reduce((n, i) => n + i.ownerReferenceMedia.length, 0)}`);
if (missing.length) { console.log(`MISSING media id for ${missing.length}:`); for (const m of missing) console.log('   ' + m); process.exit(1); }
