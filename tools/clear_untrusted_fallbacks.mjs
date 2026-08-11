#!/usr/bin/env node
/**
 * clear_untrusted_fallbacks.mjs — an unverified drawing is not approved content.
 *
 * `unpublish_unapproved.mjs` fell back to each option's tech-pack drawing on the
 * reasoning that a manufacturing blueprint cannot misrepresent the option. That
 * is true of a real blueprint. It is not true of `/images/jacket/`, which was
 * audited at **5.8% usable** — 39 MISMATCH and 3 AMBIGUOUS against 3 MATCH.
 * Those files are fabric-swatch catalogue pages, button catalogue pages and
 * website screenshots filed as drawings. Showing one as a craft illustration is
 * the same failure the owner objected to, just with a different wrong picture.
 *
 * So the fallback gets the same test as anything else: keep it only where the
 * subject audit verified it MATCHes the option. Everything else is cleared.
 *
 * Also fixes one collision the restore could not see. The admin portal keys
 * approvals as `product/option`, and `suit-2pc/coin-left` names BOTH the jacket
 * coin pocket and the trouser one. Approving the trouser photograph therefore
 * re-wired the jacket row to a picture of trousers. The trouser row keeps it;
 * the jacket row does not.
 *
 *   node tools/clear_untrusted_fallbacks.mjs            # report only
 *   node tools/clear_untrusted_fallbacks.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const AUDIT = path.join(REPO, 'public/images/reports/subject-audit-consolidated.json');

const APPLY = process.argv.includes('--apply');

const audit = JSON.parse(fs.readFileSync(AUDIT, 'utf8'));
const verdict = new Map((audit.results ?? []).map((r) => [r.bp, r.v]));

/** Only a drawing proven to show this option survives. Unaudited is not proven. */
const trusted = (p) => !p.startsWith('/images/jacket/') || verdict.get(p) === 'MATCH';

let cleared = 0, keptVerified = 0, collisionFixed = 0;
const sample = [];

for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const full = path.join(OPTIONS_DIR, file);
  const cfg = JSON.parse(fs.readFileSync(full, 'utf8'));
  let touched = false;

  for (const s of cfg.sections ?? []) {
    for (const fl of s.fields ?? []) {
      for (const o of fl.options ?? []) {
        // The jacket coin-pocket row must not serve the trouser photograph.
        const isJacketSection = !/^(trousers|vest)[-_]/i.test(s.id) && product !== 'trousers' && product !== 'vest';
        if (isJacketSection && fl.id === 'coin-pocket' && typeof o.image === 'string'
            && o.image.includes('/images/generated/suit-2pc/coin-')) {
          delete o.image; collisionFixed += 1; touched = true; continue;
        }
        if (typeof o.image !== 'string' || !o.image.startsWith('/images/jacket/')) continue;
        if (trusted(o.image)) { keptVerified += 1; continue; }
        if (sample.length < 6) sample.push(`${product} ${fl.id}/${o.id} -> ${o.image} (${verdict.get(o.image) ?? 'never audited'})`);
        delete o.image; cleared += 1; touched = true;
      }
    }
  }
  if (touched && APPLY) fs.writeFileSync(full, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}

console.log(`${APPLY ? 'APPLIED' : 'DRY RUN — nothing written'}`);
console.log(`cleared — drawing not verified to show this option : ${cleared}`);
console.log(`kept    — audited MATCH                            : ${keptVerified}`);
console.log(`jacket rows unwired from a trouser photograph      : ${collisionFixed}`);
for (const s of sample) console.log(`   ${s}`);
if (!APPLY) console.log('\nre-run with --apply to write.');
