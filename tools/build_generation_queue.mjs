#!/usr/bin/env node
/**
 * build_generation_queue.mjs — the work list for a generation run.
 *
 * Emits one entry per DISTINCT part-level identity, never per catalog row. A
 * jacket lapel option appears in suit-2pc, suit-3pc and sport-coat: three rows,
 * one garment feature, one photograph. Generating per row would pay ~1.7x for
 * the same image, and the owner's rule is explicit — jacket options are shared
 * across the three jacket products, and likewise for trousers and vest.
 *
 * Only options the validator calls generation-ready are included. Anything it
 * blocks (a drawing proven to show the wrong thing, a named style whose drawing
 * has never been checked, a drawing shared by two different options) is left
 * out: a credit spent on those buys a confident photograph of the wrong thing.
 *
 * Usage
 *   node tools/build_generation_queue.mjs                  # whole ready set
 *   node tools/build_generation_queue.mjs --queue          # audited clusters only
 *   node tools/build_generation_queue.mjs --limit=12
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const PUBLIC = path.join(REPO, 'public');
const PIPE = path.join(REPO, '.craft-pipeline');
const OUT = path.join(REPO, 'public', 'images', 'reports', 'generation-worklist.json');
const SPEC_LIB = pathToFileURL(path.join(os.homedir(), '.claude/skills/tech-pack-interpreter/scripts/lib/spec.mjs')).href;
const { extractSpec } = await import(SPEC_LIB);

const arg = (k) => { const h = process.argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : undefined; };
const LIMIT = Number(arg('limit') || 0);
const QUEUE_ONLY = process.argv.includes('--queue');

// Which options did the validator clear? Re-derive rather than trust a stale file.
const report = JSON.parse(fs.readFileSync(path.join(REPO, 'public/images/reports/spec-validation.json'), 'utf8'));
const BLOCKED = new Set((report.blockedOptions ?? []).map((o) => o.addr));

let QUEUE_KEYS = null;
if (QUEUE_ONLY) {
  const q = JSON.parse(fs.readFileSync(path.join(REPO, 'public/images/reports/generation-queue-verified.json'), 'utf8'));
  QUEUE_KEYS = new Set((q.verified ?? []).filter((r) => r?.field && r?.option).map((r) => `${r.field}|${r.option}`));
  if (!QUEUE_KEYS.size) throw new Error('--queue: no verified clusters; refusing to emit an empty worklist as if it were done work');
}

/**
 * Does the CATALOG already serve a generated photograph for this option?
 *
 * The pipeline folder is not the only record of completed work. Earlier waves
 * published photographs without leaving a qc.json behind, so an option could be
 * live on the storefront and still look pending here. Measured 2026-08-08: two
 * credits were spent regenerating trouser-contrast-covered-btn and
 * trouser-contrast-loop, both of which already had live images — the publisher
 * caught it and refused the swap, but only after the money was gone.
 *
 * A row already pointing at /images/generated/ is finished work.
 */
function alreadyPublished(opt) {
  const served = [opt.image, opt.illustration, ...(opt.photos ?? [])].filter(Boolean);
  return served.some((p) => typeof p === 'string' && /\/images\/generated\//.test(p));
}

/** Already photographed and graded? Then it is not work. */
function alreadyDone(productId, optionId) {
  const qc = path.join(PIPE, productId, optionId, 'qc.json');
  if (!fs.existsSync(qc)) return false;
  try {
    const v = JSON.parse(fs.readFileSync(qc, 'utf8')).verdict;
    return v === 'PASS' || v === 'PASS_WAIVED';
  } catch { return false; }
}

const byIdentity = new Map();
let rows = 0, blocked = 0, done = 0;

for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const cfg = JSON.parse(fs.readFileSync(path.join(OPTIONS_DIR, file), 'utf8'));
  for (const s of cfg.sections ?? []) {
    for (const f of s.fields ?? []) {
      for (const o of f.options ?? []) {
        const addr = `${product}|${s.id}|${f.id}|${o.id}`;
        const illus = o.illustration ?? o.image;
        const disk = illus && illus.startsWith('/')
          ? path.join(PUBLIC, decodeURIComponent(illus.replace(/^\//, '')).split('?')[0]) : null;
        const diskOk = disk ? fs.existsSync(disk) : false;
        let spec;
        try {
          spec = extractSpec({
            productId: product, sectionId: s.id, sectionLabel: s.label,
            fieldId: f.id, fieldLabel: f.label, hint: f.hint,
            label: o.label, description: o.description, image: illus, imageExists: diskOk,
          });
        } catch { continue; }
        if (!spec.generate) continue;
        rows += 1;
        if (BLOCKED.has(addr)) { blocked += 1; continue; }
        if (QUEUE_KEYS && !QUEUE_KEYS.has(`${f.id}|${o.id}`)) continue;
        if (!diskOk) continue;

        // ONE photograph per garment feature, fanned out to every product row
        // that shares it.
        const identity = `${spec.part}|${f.id}|${o.id}|${o.label}`;
        if (!byIdentity.has(identity)) {
          if (alreadyDone(product, o.id) || alreadyPublished(o)) { done += 1; byIdentity.set(identity, null); continue; }
          byIdentity.set(identity, {
            identity, part: spec.part, product, section: s.id, field: f.id, option: o.id,
            label: o.label, orientation: null,
            illustration: illus, illustrationDisk: disk,
            rows: [addr],
          });
        } else if (byIdentity.get(identity)) {
          byIdentity.get(identity).rows.push(addr);
        }
      }
    }
  }
}

let work = [...byIdentity.values()].filter(Boolean);
// Cheapest-confidence-first: options with more measured facts are the ones the
// prompt can actually pin down, so they fail least often.
work.sort((a, b) => b.rows.length - a.rows.length || a.identity.localeCompare(b.identity));
if (LIMIT) work = work.slice(0, LIMIT);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  generatedAt: new Date().toISOString(), queueOnly: QUEUE_ONLY,
  inScopeRows: rows, blockedRows: blocked, alreadyDone: done,
  identities: work.length, rowsCovered: work.reduce((n, w) => n + w.rows.length, 0),
  work,
}, null, 2) + '\n', 'utf8');

console.log(`in-scope rows        : ${rows}`);
console.log(`blocked by validator : ${blocked}`);
console.log(`already PASSed       : ${done}`);
console.log(`WORK (identities)    : ${work.length}   covering ${work.reduce((n, w) => n + w.rows.length, 0)} catalog rows`);
console.log(`-> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
