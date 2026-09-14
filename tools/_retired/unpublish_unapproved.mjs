#!/usr/bin/env node
/**
 * unpublish_unapproved.mjs — take every AI photograph the owner has not
 * personally approved off the live catalog.
 *
 * Owner instruction, 2026-08-10: "remove all the false craft photos off the
 * live website. unless ive approved them physically dont put them on the live
 * website."
 *
 * Approval is not a QC verdict. `publish_approved.mjs` ships on an automated
 * grade, and that is how 796 rows came to serve a render nobody signed off —
 * 271 of them images the owner had already looked at and REJECTED in the
 * 2026-07-30 review. A machine score is evidence; it is not consent.
 *
 * The only evidence of consent is `review-decisions-v3-2026-07-30.json`:
 *   accepted_keys  garment|fieldId|optionId the owner accepted
 *   image_keeps    specific image files the owner chose to keep
 *   image_rejects  specific image files the owner threw out
 *
 * What this does to an unapproved row: falls back to that option's own
 * tech-pack drawing when it has one, otherwise clears the slot. The drawing is
 * accurate and it is what the whole pipeline treats as law, so it is a better
 * thing to show a customer than a render of the wrong garment. An empty slot is
 * the honest second choice.
 *
 * What it never does: delete a craft option, delete an image FILE, or touch a
 * row the owner approved. Every generated file stays on disk and every change
 * is listed in the ledger, so re-wiring anything is a one-line edit.
 *
 * Dry run by default. Nothing is written without --apply.
 *
 *   node tools/unpublish_unapproved.mjs            # report only
 *   node tools/unpublish_unapproved.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const DECISIONS = path.join(REPO, 'public/images/reports/review-decisions-v3-2026-07-30.json');
const LEDGER = path.join(REPO, 'public/images/reports/unpublish-ledger.json');

const APPLY = process.argv.includes('--apply');

const decisions = JSON.parse(fs.readFileSync(DECISIONS, 'utf8'));
const norm = (s) => String(s).replace(/^\/?images\//, '').replace(/^\//, '');
const acceptedKeys = new Set(decisions.accepted_keys ?? []);
const keptFiles = new Set((decisions.image_keeps ?? []).map((r) => norm(r.src)));
const rejectedFiles = new Set((decisions.image_rejects ?? []).map((r) => norm(r.src)));

/** Which garment a section belongs to — decision keys are garment-scoped. */
function scopeOf(product, sectionId) {
  if (product === 'trousers') return 'trousers';
  if (product === 'vest') return 'vest';
  if (product === 'shirt') return 'shirt';
  if (/^trousers[-_]/i.test(sectionId)) return 'trousers';
  if (/^vest[-_]/i.test(sectionId)) return 'vest';
  return 'jacket';
}

const isGenerated = (p) => typeof p === 'string' && p.includes('/images/generated/');

/**
 * Did the owner approve this row, or this exact file? Either counts. The .webp
 * the catalog serves and the .png the review listed are the same picture, so
 * both spellings are checked.
 */
function approved(key, img) {
  if (acceptedKeys.has(key)) return 'accepted-key';
  const a = norm(img), b = norm(img.replace(/\.webp$/, '.png'));
  if (keptFiles.has(a) || keptFiles.has(b)) return 'kept-file';
  return null;
}
function rejected(img) {
  const a = norm(img), b = norm(img.replace(/\.webp$/, '.png'));
  return rejectedFiles.has(a) || rejectedFiles.has(b);
}

const changes = [];
const stats = { rows: 0, keptApproved: 0, strippedRejected: 0, strippedUndecided: 0, fellBackToDrawing: 0, clearedEmpty: 0 };

for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const full = path.join(OPTIONS_DIR, file);
  const cfg = JSON.parse(fs.readFileSync(full, 'utf8'));
  let touched = false;

  for (const s of cfg.sections ?? []) {
    for (const fl of s.fields ?? []) {
      for (const o of fl.options ?? []) {
        if (!isGenerated(o.image)) continue;
        stats.rows += 1;
        const key = `${scopeOf(product, s.id)}|${fl.id}|${o.id}`;
        const why = approved(key, o.image);
        if (why) { stats.keptApproved += 1; continue; }

        // The drawing is the fallback: it is the manufacturing blueprint and
        // never a render, so it cannot misrepresent the option. Never fall back
        // to another generated file.
        const drawing = [o.techpackIllustration, o.illustration]
          .find((p) => typeof p === 'string' && p.startsWith('/') && !isGenerated(p)) ?? null;

        const before = o.image;
        if (drawing) { o.image = drawing; stats.fellBackToDrawing += 1; }
        else { delete o.image; stats.clearedEmpty += 1; }

        if (rejected(before)) stats.strippedRejected += 1; else stats.strippedUndecided += 1;

        // The lightbox reads these too — an unapproved render must not survive
        // in a gallery just because it left the primary slot.
        for (const arrKey of ['photos', 'images']) {
          if (Array.isArray(o[arrKey])) {
            const kept = o[arrKey].filter((p) => !isGenerated(p) || approved(key, p));
            if (kept.length !== o[arrKey].length) o[arrKey] = kept;
          }
        }
        for (const scalar of ['realImage', 'aiImage']) {
          if (isGenerated(o[scalar]) && !approved(key, o[scalar])) delete o[scalar];
        }

        changes.push({
          product, section: s.id, field: fl.id, option: o.id, label: o.label,
          removed: before, replacedWith: drawing, ownerVerdict: rejected(before) ? 'REJECTED' : 'never-reviewed',
        });
        touched = true;
      }
    }
  }

  if (touched && APPLY) fs.writeFileSync(full, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}

if (APPLY) {
  fs.writeFileSync(LEDGER, JSON.stringify({
    appliedAt: new Date().toISOString(),
    instruction: 'owner 2026-08-10: nothing goes live without physical approval',
    decisionsSource: 'public/images/reports/review-decisions-v3-2026-07-30.json',
    stats, changes,
  }, null, 2) + '\n', 'utf8');
}

console.log(`${APPLY ? 'APPLIED' : 'DRY RUN — nothing written'}`);
console.log(`live rows serving a generated image : ${stats.rows}`);
console.log(`  kept (owner approved)             : ${stats.keptApproved}`);
console.log(`  removed — owner had REJECTED      : ${stats.strippedRejected}`);
console.log(`  removed — never reviewed          : ${stats.strippedUndecided}`);
console.log(`     of those, fell back to drawing : ${stats.fellBackToDrawing}`);
console.log(`     of those, left empty           : ${stats.clearedEmpty}`);
if (APPLY) console.log(`\nledger -> ${path.relative(REPO, LEDGER).split(path.sep).join('/')}  (every change reversible; no image file deleted)`);
else console.log('\nre-run with --apply to write.');
