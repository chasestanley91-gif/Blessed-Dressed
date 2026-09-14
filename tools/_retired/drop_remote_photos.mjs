#!/usr/bin/env node
/**
 * drop_remote_photos.mjs — stop displaying photography that belongs to other
 * companies.
 *
 * Why
 * ---
 * `images[]` accumulated 1,590 remote URLs across 34 hosts. Only 36 of them are
 * the supplier's own (kutetailor / baoxiniao). The rest are editorial and
 * retailer photographs lifted from third parties — Suit Supply, Proper Cloth,
 * Senszio, Hangrr, Permanent Style, Bond Suits and similar, several of them
 * direct competitors. Hot-linking them was already questionable; self-hosting
 * them on a commercial storefront would be worse. Owner decision 2026-08-06:
 * drop them.
 *
 * What it does
 * ------------
 * Removes third-party remote URLs from the DISPLAY list (`photos[]`) only.
 * The original `images[]` array is left byte-identical, so nothing is lost and
 * the decision is reversible by re-running decompose_option_assets.mjs.
 * Supplier-owned URLs are kept (they are ours to use) and reported for
 * localisation.
 *
 * No option is ever deleted. Option count must not change.
 *
 * Usage
 *   node tools/drop_remote_photos.mjs            # dry run
 *   node tools/drop_remote_photos.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const REPORT = path.join(REPO, 'public', 'images', 'reports', 'dropped-remote-photos.json');

const APPLY = process.argv.includes('--apply');

/** Hosts whose imagery is ours to serve because we buy from them. */
const SUPPLIER = /(^|\.)(kutetailor|baoxiniao)\.(com|co|net)$/i;

const isRemote = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
const hostOf = (u) => { try { return new URL(u).host; } catch { return '(unparseable)'; } };

const dropped = new Map();  // host -> count
const keptSupplier = new Map();
let optionsTouched = 0, urlsDropped = 0, urlsKept = 0, total = 0;
let optionsLeftWithNoPhoto = 0;

for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const full = path.join(OPTIONS_DIR, file);
  const raw = fs.readFileSync(full, 'utf8');
  const cfg = JSON.parse(raw);

  for (const s of cfg.sections ?? []) {
    for (const f of s.fields ?? []) {
      for (const o of f.options ?? []) {
        total += 1;
        if (!Array.isArray(o.photos) || !o.photos.length) continue;

        const before = o.photos.length;
        const kept = o.photos.filter((u) => {
          if (!isRemote(u)) return true;
          const host = hostOf(u);
          if (SUPPLIER.test(host)) { keptSupplier.set(host, (keptSupplier.get(host) ?? 0) + 1); urlsKept += 1; return true; }
          dropped.set(host, (dropped.get(host) ?? 0) + 1);
          urlsDropped += 1;
          return false;
        });

        if (kept.length !== before) {
          optionsTouched += 1;
          if (kept.length) o.photos = kept;
          else { delete o.photos; optionsLeftWithNoPhoto += 1; } // empty array would be noise
        }
      }
    }
  }

  if (APPLY) fs.writeFileSync(full, JSON.stringify(cfg, null, 2) + (raw.endsWith('\n') ? '\n' : ''), 'utf8');
}

console.log(`options scanned ${total} | options touched ${optionsTouched}`);
console.log(`third-party photo refs dropped from display: ${urlsDropped} across ${dropped.size} hosts`);
console.log(`supplier photo refs kept: ${urlsKept}`);
console.log(`options left with no photo (drawing still shown): ${optionsLeftWithNoPhoto}`);
console.log('top hosts dropped:');
for (const [h, n] of [...dropped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`   ${String(n).padStart(4)}  ${h}`);
console.log(APPLY ? 'APPLIED' : 'DRY RUN — re-run with --apply to write');

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  policy: 'Third-party photography removed from photos[] (display). images[] left intact — nothing deleted, decision reversible.',
  urlsDropped, urlsKept, optionsTouched, optionsLeftWithNoPhoto,
  droppedByHost: Object.fromEntries([...dropped.entries()].sort((a, b) => b[1] - a[1])),
  keptSupplierByHost: Object.fromEntries(keptSupplier),
}, null, 2) + '\n', 'utf8');
console.log(`ledger -> ${path.relative(REPO, REPORT).split(path.sep).join('/')}`);
