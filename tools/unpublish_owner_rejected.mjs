#!/usr/bin/env node
/**
 * unpublish_owner_rejected.mjs — take the photographs the owner REJECTED off
 * the live catalog, and nothing else.
 *
 * Why this exists alongside unpublish_unapproved.mjs
 * --------------------------------------------------
 * That tool answers a different, blunter question: "did the 2026-07-30 review
 * file approve this row?" It never reads the admin portal, so anything the
 * owner approved IN THE PORTAL looks unapproved to it. Run broadly today it
 * would unwire hundreds of genuine approvals — the precise failure
 * PROJECT-GOAL-V4 §19 was written about after 150 approved images were removed.
 *
 * This tool inverts the test. It does not ask "is there proof of approval?";
 * it asks "is there proof of REJECTION?", and it touches only rows that have
 * it. A row with no decision at all is left exactly as it is — untouched is
 * always the safe answer for an unknown.
 *
 * The evidence is the merged join in public/images/reports/repo-index.json,
 * which carries each row's owner decision together with the QC attempt it was
 * recorded against. A rejection logged on an OLDER attempt does not condemn a
 * NEWER candidate, so `coversGraded` gates every action.
 *
 * What a rejected row becomes: its own tech-pack drawing. That drawing is what
 * the whole pipeline treats as law, so it is a better thing to put in front of
 * a customer than a render the owner has thrown out. A row with no drawing has
 * its image slot cleared — an empty slot is the honest second choice.
 *
 * What this NEVER does: delete a craft option, delete an image FILE, touch a
 * row the owner approved, or touch a row with no decision. Every generated file
 * stays on disk and every change is appended to the ledger, so re-wiring
 * anything is a one-line edit.
 *
 * Dry run by default. Nothing is written without --apply.
 *
 *   node tools/unpublish_owner_rejected.mjs             # report only
 *   node tools/unpublish_owner_rejected.mjs --apply
 *   node tools/unpublish_owner_rejected.mjs --product=suit-2pc --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadCatalogRows } from './cluster_map.mjs';

const REPO = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '..'
);
const INDEX = path.join(REPO, 'public', 'images', 'reports', 'repo-index.json');
const LEDGER = path.join(REPO, 'public', 'images', 'reports', 'owner-rejected-unpublish-ledger.json');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
  })
);
const APPLY = Boolean(args.apply);

const readJson = (p, d = null) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return d;
  }
};

const isGenerated = (v) => typeof v === 'string' && v.includes('/images/generated/');

// ── the rows the owner rejected, that are nonetheless being served ──────────
const index = readJson(INDEX);
if (!index) {
  console.error('No repo-index.json. Run `node tools/project_state.mjs` first.');
  process.exit(1);
}

const condemned = new Map(); // "product|section|field|option" -> record
for (const r of index.records) {
  if (!r.owner || r.owner.verdict !== 'rejected' || !r.owner.coversGraded) continue;
  if (!r.shipped || !isGenerated(r.shippedPath)) continue;
  if (args.product && r.product !== args.product) continue;
  condemned.set(`${r.product}|${r.section}|${r.field}|${r.option}`, r);
}

if (!condemned.size) {
  console.log('Nothing to do: no owner-rejected image is currently being served.');
  process.exit(0);
}

// ── walk the catalog and revert exactly those rows ──────────────────────────
const { products, rows } = loadCatalogRows(OPTIONS_DIR);
const changes = [];
const touchedProducts = new Set();

for (const row of rows) {
  const addr = `${row.productId}|${row.sectionId}|${row.fieldId}|${row.optionId}`;
  const rec = condemned.get(addr);
  if (!rec) continue;

  const o = row.option;
  // The drawing this option is judged against. `techpackIllustration` is the
  // preserved blueprint; `illustration` is the same value on rows that were
  // never published over. Never fall back to a path under /images/generated/ —
  // that is our own output, not a reference.
  const drawing = [o.techpackIllustration, o.illustration].find(
    (v) => typeof v === 'string' && v && !isGenerated(v)
  );

  const before = { image: o.image, realImage: o.realImage, photos: o.photos };

  if (drawing) o.image = drawing;
  else delete o.image;

  if (isGenerated(o.realImage)) delete o.realImage;
  if (Array.isArray(o.photos)) {
    const kept = o.photos.filter((p) => !isGenerated(p));
    if (kept.length) o.photos = kept;
    else o.photos = [];
  }

  changes.push({
    addr: rec.addr,
    product: row.productId,
    section: row.sectionId,
    field: row.fieldId,
    option: row.optionId,
    label: o.label ?? null,
    removed: before.image,
    restoredTo: drawing ?? null,
    clearedSlot: !drawing,
    ownerVerdict: rec.owner.verdict,
    ownerAttempt: rec.owner.attempt,
    ownerDecidedAt: rec.owner.decidedAt,
    before,
  });
  touchedProducts.add(row.productId);
}

// ── report ──────────────────────────────────────────────────────────────────
console.log(
  `${changes.length} row(s) serving an owner-REJECTED image` +
    (APPLY ? '' : '  (dry run — pass --apply to write)')
);
for (const c of changes) {
  console.log(`  ${c.addr}`);
  console.log(`      remove : ${c.removed}`);
  console.log(`      restore: ${c.restoredTo ?? '(no drawing — slot cleared)'}`);
}

const missing = [...condemned.keys()].filter(
  (k) => !changes.some((c) => `${c.product}|${c.section}|${c.field}|${c.option}` === k)
);
if (missing.length) {
  console.log(`\nWARNING: ${missing.length} condemned row(s) not found in the catalog:`);
  for (const m of missing) console.log(`  ${m}`);
}

if (!APPLY) process.exit(0);

// ── write ───────────────────────────────────────────────────────────────────
// Back the catalog up first, using the repo's own prebackup convention, so the
// previous state is one `cp` away rather than a git archaeology exercise.
const stamp = new Date().toISOString().slice(0, 10);
const backup = path.join(REPO, 'data-store', `options.prebackup-${stamp}-unpublish-rejected`);
if (!fs.existsSync(backup)) {
  fs.mkdirSync(backup, { recursive: true });
  for (const f of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
    fs.copyFileSync(path.join(OPTIONS_DIR, f), path.join(backup, f));
  }
  console.log(`\nbacked up catalog -> ${path.relative(REPO, backup)}`);
}

for (const productId of touchedProducts) {
  const p = products[productId];
  const text = JSON.stringify(p.json, null, 2) + (p.endsWithNewline ? '\n' : '');
  fs.writeFileSync(p.file, text);
  console.log(`wrote ${path.relative(REPO, p.file)}`);
}

// Append, never overwrite: PROJECT-GOAL-V4 §13 — decision history is not
// disposable, and the relationship rejected-image -> what replaced it is the
// audit trail that stops us repeating a failed generation.
const ledger = readJson(LEDGER, { runs: [] });
ledger.runs.push({
  at: new Date().toISOString(),
  tool: 'tools/unpublish_owner_rejected.mjs',
  reason:
    'Owner rejected these images; PROJECT-GOAL-V4 §20 requires that zero unapproved images are served.',
  count: changes.length,
  changes,
});
fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n');
console.log(`ledger appended -> ${path.relative(REPO, LEDGER)}`);
console.log('\nRe-run `node tools/project_state.mjs` to refresh the state documents.');
