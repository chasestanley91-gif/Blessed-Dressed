#!/usr/bin/env node
/**
 * repoint_jacket_drawings.mjs — replace the wrong /images/jacket/ drawings with
 * genuine Baoxiniao supplier drawings, matched BY ENGLISH LABEL.
 *
 * Why
 * ---
 * The visual audit inspected 161 blueprints: /images/jacket/ scored 7% usable
 * across 45 of them. It is not a drawing library — it is tiles sliced out of a
 * button catalogue, a pocket chart, a lapel-width chart and an edge-stitch
 * chart, plus Chinese spec text and blank frames. 483 catalog rows depend on it.
 *
 * The supplier's real jacket library (BB, 1,359 drawings) is already on disk,
 * and today's craft-dictionary capture gives every one of them an English
 * label — so an option can be matched to its true drawing by NAME instead of
 * by guessing a value code.
 *
 * Matching is field-scoped by VOTING, the same method proven in
 * map_baoxiniao.mjs: the catalog field's option labels vote for the supplier
 * field they appear in, and a field is only accepted when one supplier field
 * wins at least half the votes with >=2 options agreeing. A lone "None" match
 * proves nothing.
 *
 * PROPOSAL BY DEFAULT. `--apply` also PROMOTES each matched supplier image into
 * public/images/supplier/ (factory-screenshots is gitignored AND vercelignored,
 * so referencing it directly would 404 in production — the exact bug that hit
 * 622 paths earlier).
 *
 * Never deletes an option. Never invents a path.
 *
 * Usage
 *   node tools/repoint_jacket_drawings.mjs            # proposal
 *   node tools/repoint_jacket_drawings.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const SUPPLIER_JSON = path.join(REPO, 'data-store', 'supplier', 'bb-images-labelled.json');
const SRC_ROOT = path.join(REPO, 'factory-screenshots');
const DEST_ROOT = path.join(REPO, 'public', 'images', 'supplier-bb');
const REPORT = path.join(REPO, 'public', 'images', 'reports', 'repoint-jacket-proposal.json');

const APPLY = process.argv.includes('--apply');
const BAD_DIR = '/images/jacket/';
/** Jacket options are ONE identity across these three products. */
const JACKET_PRODUCTS = new Set(['suit-2pc', 'suit-3pc', 'sport-coat']);

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const normNum = (s) => norm(s)
  .replace(/(\d)\s*(°|deg|degrees?)/g, '$1deg')
  .replace(/(\d)\s*(cm|centimet(?:er|re)s?)/g, '$1cm')
  .trim();

const supplier = JSON.parse(fs.readFileSync(SUPPLIER_JSON, 'utf8')).images;
const byField = new Map();
for (const img of supplier) {
  if (!byField.has(img.field)) byField.set(img.field, []);
  byField.get(img.field).push(img);
}

/** Which supplier field do this catalog field's option labels live in? */
function inferField(labels) {
  const votes = new Map();
  for (const label of labels) {
    const a = norm(label); const b = normNum(label);
    if (!a) continue;
    for (const [code, imgs] of byField) {
      if (imgs.some((i) => norm(i.label) === a || normNum(i.label) === b)) {
        votes.set(code, (votes.get(code) ?? 0) + 1);
      }
    }
  }
  if (!votes.size) return null;
  const ranked = [...votes.entries()].sort((x, y) => y[1] - x[1]);
  const [code, count] = ranked[0];
  const total = [...votes.values()].reduce((s, n) => s + n, 0);
  if (count < 2 || count / total < 0.5) return null;
  return { code, votes: count, share: +(count / total).toFixed(2) };
}

const proposals = [];
const unmatched = [];
let scanned = 0;

for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  if (!JACKET_PRODUCTS.has(product)) continue;
  const cfg = JSON.parse(fs.readFileSync(path.join(OPTIONS_DIR, file), 'utf8'));

  for (const section of cfg.sections ?? []) {
    const sid = String(section.id ?? '');
    if (/^vest|^trouser/i.test(sid)) continue; // not jacket parts
    for (const field of section.fields ?? []) {
      const opts = field.options ?? [];
      const affected = opts.filter((o) => [o.illustration, o.image, o.techpackIllustration]
        .some((p) => typeof p === 'string' && p.startsWith(BAD_DIR)));
      if (!affected.length) continue;
      scanned += affected.length;

      const fm = inferField(opts.map((o) => o.label));
      if (!fm) { unmatched.push({ product, field: field.id, label: field.label, options: affected.length }); continue; }

      const pool = byField.get(fm.code) ?? [];
      for (const opt of affected) {
        const a = norm(opt.label); const b = normNum(opt.label);
        const hit = pool.find((i) => norm(i.label) === a) ?? pool.find((i) => normNum(i.label) === b);
        if (!hit) { unmatched.push({ product, field: field.id, option: opt.id, label: opt.label, reason: 'no value match in ' + fm.code }); continue; }
        proposals.push({
          product, section: section.id ?? section.label, field: field.id, option: opt.id,
          catalogLabel: opt.label,
          from: opt.illustration ?? opt.image,
          supplier: { field: fm.code, value: hit.value, label: hit.label, fieldVotes: fm.votes, fieldShare: fm.share },
          srcPath: hit.localPath,
          to: `/images/supplier-bb/${hit.field}/${hit.value}.jpg`,
          exact: norm(hit.label) === a,
        });
      }
    }
  }
}

const identities = new Set(proposals.map((p) => `${p.field}|${p.option}`));
const exact = proposals.filter((p) => p.exact);

console.log(`jacket rows on ${BAD_DIR}: ${scanned}`);
console.log(`re-point proposals        : ${proposals.length} rows -> ${identities.size} distinct options`);
console.log(`  exact label match       : ${exact.length}`);
console.log(`unmatched                 : ${unmatched.length}`);

if (APPLY) {
  // Promote the images into public/ so they actually deploy.
  let copied = 0, missing = 0;
  for (const p of proposals) {
    const src = path.join(SRC_ROOT, p.srcPath);
    const dest = path.join(DEST_ROOT, p.supplier.field, `${p.supplier.value}.jpg`);
    if (!fs.existsSync(src)) { missing += 1; continue; }
    if (!fs.existsSync(dest)) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(src, dest); copied += 1; }
  }
  console.log(`promoted ${copied} supplier images into public/images/supplier-bb/ (${missing} source files missing)`);

  // Rewrite the catalog: illustration only. image/realImage/photos untouched.
  const applied = new Map();
  for (const p of proposals) applied.set(`${p.product}|${p.field}|${p.option}`, p);
  for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
    const product = file.replace(/\.json$/, '');
    if (!JACKET_PRODUCTS.has(product)) continue;
    const full = path.join(OPTIONS_DIR, file);
    const raw = fs.readFileSync(full, 'utf8');
    const cfg = JSON.parse(raw);
    let n = 0;
    for (const s of cfg.sections ?? []) for (const f of s.fields ?? []) for (const o of f.options ?? []) {
      const hit = applied.get(`${product}|${f.id}|${o.id}`);
      if (!hit) continue;
      if (!fs.existsSync(path.join(REPO, 'public', hit.to.replace(/^\//, '')))) continue;
      o.illustration = hit.to;
      o.illustrationStatus = 'drawing';
      o.techpackIllustration = hit.to;
      n += 1;
    }
    fs.writeFileSync(full, JSON.stringify(cfg, null, 2) + (raw.endsWith('\n') ? '\n' : ''), 'utf8');
    console.log(`  ${file}: ${n} options repointed`);
  }
}

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify({
  generatedAt: new Date().toISOString(), apply: APPLY,
  scanned, proposed: proposals.length, identities: identities.size, exactMatches: exact.length,
  proposals, unmatched,
}, null, 2) + '\n', 'utf8');
console.log(APPLY ? 'APPLIED' : 'DRY RUN — re-run with --apply');
console.log(`-> ${path.relative(REPO, REPORT).split(path.sep).join('/')}`);
