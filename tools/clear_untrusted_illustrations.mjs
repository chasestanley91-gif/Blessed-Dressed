#!/usr/bin/env node
/**
 * clear_untrusted_illustrations.mjs — an unverified drawing is not a tech pack.
 *
 * The 2026-08-11 cleanup (clear_untrusted_fallbacks.mjs) removed untrusted
 * `/images/jacket/` files from the PHOTO slot (`image`) — but 328 crafts still
 * carry one in `illustration`/`techpackIllustration`, the slot the builder
 * shows FIRST and the slot the generation pipeline treats as construction law.
 * A fabric-swatch page sitting there poisons both: the customer sees a wrong
 * "tech pack", and QC grades every future render against the wrong drawing.
 *
 * Rules, same evidence the catalog_invariants check 8 enforces:
 *   - `/images/jacket/` path without a subject-audit MATCH  -> cleared
 *   - any path the subject audit called MISMATCH            -> cleared
 *   - AMBIGUOUS verdicts are NOT cleared — they are flagged for investigation
 *     (the audit could not prove them wrong; removing them would destroy
 *     possibly-correct references on a guess).
 *
 * A cleared slot sets `illustrationStatus: "needs-source"` so the gap shows up
 * as state A in the generation queue instead of vanishing. Nothing is deleted
 * from disk; `image` (the photo slot) is never touched; every change lands in
 * a ledger file for reversibility.
 *
 *   node tools/clear_untrusted_illustrations.mjs            # report only
 *   node tools/clear_untrusted_illustrations.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const AUDIT = path.join(REPO, 'public/images/reports/subject-audit-consolidated.json');
const OUT = path.join(REPO, 'public/images/reports/cleared-untrusted-illustrations.json');

const APPLY = process.argv.includes('--apply');
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

const audit = readJson(AUDIT, { results: [] });
const verdict = new Map((audit.results ?? []).map((r) => [r.bp, r.v]));

const untrusted = (p) => {
  if (typeof p !== 'string' || !p) return null;
  const v = verdict.get(p);
  if (p.startsWith('/images/jacket/') && v !== 'MATCH') return v ?? 'never-audited';
  if (v === 'MISMATCH') return 'MISMATCH';
  return null;
};

const changes = [];
const ambiguous = [];

for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const full = path.join(OPTIONS_DIR, file);
  const cfg = readJson(full, {});
  let touched = false;

  for (const s of cfg.sections ?? []) {
    for (const fl of s.fields ?? []) {
      for (const o of fl.options ?? []) {
        const addr = `${product}|${s.id}|${fl.id}|${o.id}`;
        for (const slot of ['illustration', 'techpackIllustration']) {
          const p = o[slot];
          if (typeof p !== 'string' || !p) continue;
          if (verdict.get(p) === 'AMBIGUOUS' && !p.startsWith('/images/jacket/')) {
            ambiguous.push({ addr, slot, path: p });
            continue;
          }
          const why = untrusted(p);
          if (!why) continue;
          changes.push({ addr, slot, removed: p, verdict: why });
          if (APPLY) {
            delete o[slot];
            if (slot === 'illustration') o.illustrationStatus = 'needs-source';
            touched = true;
          }
        }
      }
    }
  }
  if (touched && APPLY) fs.writeFileSync(full, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}

const bySlot = { illustration: 0, techpackIllustration: 0 };
for (const c of changes) bySlot[c.slot] += 1;

console.log(`${APPLY ? 'APPLIED' : 'DRY RUN — nothing written'}`);
console.log(`slots cleared                     : ${changes.length} (illustration ${bySlot.illustration}, techpackIllustration ${bySlot.techpackIllustration})`);
console.log(`  never audited /images/jacket/   : ${changes.filter((c) => c.verdict === 'never-audited').length}`);
console.log(`  audited MISMATCH                : ${changes.filter((c) => c.verdict === 'MISMATCH').length}`);
console.log(`  audited AMBIGUOUS (jacket set)  : ${changes.filter((c) => c.verdict === 'AMBIGUOUS').length}`);
console.log(`flagged AMBIGUOUS elsewhere (kept): ${ambiguous.length}`);

if (APPLY) {
  fs.writeFileSync(OUT, JSON.stringify({
    appliedAt: new Date().toISOString(),
    rule: 'jacket-set requires MATCH; MISMATCH cleared anywhere; AMBIGUOUS outside the jacket set kept + flagged',
    changes, ambiguousKept: ambiguous,
  }, null, 1) + '\n', 'utf8');
  console.log(`\nledger -> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
  console.log('now run: node tools/catalog_invariants.mjs && node tools/build_decision_ledger.mjs --write && node tools/generation_queue.mjs');
} else {
  console.log('\nre-run with --apply to write.');
}
