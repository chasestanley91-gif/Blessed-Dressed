#!/usr/bin/env node
/**
 * restore_owner_approved.mjs — put back the images the owner DID approve.
 *
 * `unpublish_unapproved.mjs` consulted only the 2026-07-30 review file and
 * missed the admin portal's own record, `data-store/image-review-decisions.json`
 * — 291 decisions, 206 of them approvals, made by the owner in the UI. As a
 * result 150 approved images were unwired along with the genuinely unapproved
 * ones.
 *
 * The lesson, and it is the same one this project keeps relearning: when there
 * is more than one record of a decision, the union of them is the truth, and
 * checking only the one you happen to know about produces a confident wrong
 * answer. Approval evidence now means BOTH files.
 *
 * This reverses exactly those rows from the ledger and nothing else. It restores
 * the previously served path verbatim; it never invents one.
 *
 *   node tools/restore_owner_approved.mjs            # report only
 *   node tools/restore_owner_approved.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const LEDGER = path.join(REPO, 'public/images/reports/unpublish-ledger.json');
const PORTAL = path.join(REPO, 'data-store/image-review-decisions.json');

const APPLY = process.argv.includes('--apply');

const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
const portal = JSON.parse(fs.readFileSync(PORTAL, 'utf8'));
const approvedKeys = new Set(Object.keys(portal).filter((k) => portal[k].verdict === 'approved'));

// Which ledger rows should never have been touched.
const restore = new Map();
for (const c of ledger.changes ?? []) {
  if (approvedKeys.has(`${c.product}/${c.option}`)) {
    restore.set(`${c.product}|${c.section}|${c.field}|${c.option}`, c);
  }
}

let done = 0;
const missingFile = [];
for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const full = path.join(OPTIONS_DIR, file);
  const cfg = JSON.parse(fs.readFileSync(full, 'utf8'));
  let touched = false;

  for (const s of cfg.sections ?? []) {
    for (const fl of s.fields ?? []) {
      for (const o of fl.options ?? []) {
        const hit = restore.get(`${product}|${s.id}|${fl.id}|${o.id}`);
        if (!hit) continue;
        // Never re-wire a path whose file is gone — that would trade a missing
        // image for a broken link, which is worse.
        const disk = path.join(REPO, 'public', hit.removed.replace(/^\//, ''));
        if (!fs.existsSync(disk)) { missingFile.push(hit.removed); continue; }
        o.image = hit.removed;
        done += 1; touched = true;
      }
    }
  }
  if (touched && APPLY) fs.writeFileSync(full, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}

console.log(`${APPLY ? 'APPLIED' : 'DRY RUN — nothing written'}`);
console.log(`approved in the admin portal but unwired : ${restore.size}`);
console.log(`restored to their approved image         : ${done}`);
if (missingFile.length) console.log(`skipped, file no longer on disk          : ${missingFile.length}`);
if (!APPLY) console.log('\nre-run with --apply to write.');
