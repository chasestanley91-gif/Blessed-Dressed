#!/usr/bin/env node
/**
 * stage_unreviewed_for_owner.mjs — put every never-reviewed image in front of
 * the owner at /admin/image-review.
 *
 * `build_review_queue.mjs` only sees candidates that still have a
 * `.craft-pipeline` folder. Most of the images unwired on 2026-08-10 were
 * published by earlier waves and have no pipeline record left, so they would
 * never reach the review page at all — they would simply be gone, which is not
 * what the owner asked for. They asked to review them.
 *
 * This stages them from `unpublish-ledger.json`: the image itself, plus that
 * option's tech-pack drawing beside it so the two can be compared.
 *
 * "Never reviewed" means no decision in EITHER record — the admin portal's
 * `image-review-decisions.json` or the 2026-07-30 review file. Consulting only
 * one of them is the mistake that unwired 150 approved images earlier today.
 *
 * Additive: existing queue entries and every decision already made are kept.
 *
 *   node tools/stage_unreviewed_for_owner.mjs            # report only
 *   node tools/stage_unreviewed_for_owner.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PUBLIC = path.join(REPO, 'public');
const REVIEW_DIR = path.join(PUBLIC, 'images', 'review');
const QUEUE = path.join(REPO, 'data-store', 'image-review-queue.json');
const PORTAL = path.join(REPO, 'data-store', 'image-review-decisions.json');
const V3 = path.join(REPO, 'public/images/reports/review-decisions-v3-2026-07-30.json');
const LEDGER = path.join(REPO, 'public/images/reports/unpublish-ledger.json');

const APPLY = process.argv.includes('--apply');
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

const ledger = readJson(LEDGER, { changes: [] });
const portal = readJson(PORTAL, {});
const v3 = readJson(V3, {});
const queue = readJson(QUEUE, { items: [] });

const norm = (s) => String(s).replace(/^\/?images\//, '').replace(/^\//, '');
const v3Files = new Set([...(v3.image_keeps ?? []), ...(v3.image_rejects ?? [])].map((r) => norm(r.src)));
const v3Keys = new Set(v3.accepted_keys ?? []);

const scopeOf = (product, sectionId) => {
  if (product === 'trousers') return 'trousers';
  if (product === 'vest') return 'vest';
  if (product === 'shirt') return 'shirt';
  if (/^trousers[-_]/i.test(sectionId)) return 'trousers';
  if (/^vest[-_]/i.test(sectionId)) return 'vest';
  return 'jacket';
};

/** Has a human ever ruled on this, in either record? */
function decidedAnywhere(c) {
  if (portal[`${c.product}/${c.option}`]) return 'portal';
  if (v3Keys.has(`${scopeOf(c.product, c.section)}|${c.field}|${c.option}`)) return 'v3-key';
  const a = norm(c.removed), b = norm(c.removed.replace(/\.webp$/, '.png'));
  if (v3Files.has(a) || v3Files.has(b)) return 'v3-file';
  return null;
}

const existing = new Set((queue.items ?? []).map((i) => i.key));
const todo = [];
const seen = new Set();
for (const c of ledger.changes ?? []) {
  const key = `${c.product}/${c.option}`;
  if (seen.has(key) || existing.has(key)) continue;
  if (decidedAnywhere(c)) continue;
  const disk = path.join(PUBLIC, c.removed.replace(/^\//, ''));
  if (!fs.existsSync(disk)) continue;      // nothing to look at
  seen.add(key);
  todo.push({ ...c, disk, key });
}

console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'}`);
console.log(`ledger rows                       : ${(ledger.changes ?? []).length}`);
console.log(`already in the review queue       : ${(queue.items ?? []).length}`);
console.log(`NEVER reviewed in either record   : ${todo.length}`);

if (!APPLY) { console.log('\nre-run with --apply to stage them.'); process.exit(0); }

fs.mkdirSync(REVIEW_DIR, { recursive: true });
const added = [];
let noDrawing = 0;
for (const t of todo) {
  const safe = `${t.product}__${t.option}`.replace(/[^a-z0-9_.-]/gi, '-');
  const candName = `${safe}__owner.webp`;
  await sharp(t.disk).webp({ quality: 88 }).toFile(path.join(REVIEW_DIR, candName));

  // The drawing sits beside it so the owner is comparing, not guessing. Only a
  // real drawing counts — never another render.
  let drawingUrl = null;
  const drawing = t.replacedWith;
  if (drawing && !drawing.includes('/images/generated/')) {
    const src = path.join(PUBLIC, drawing.replace(/^\//, ''));
    if (fs.existsSync(src)) {
      const dName = `${safe}__owner__drawing.webp`;
      try {
        await sharp(src).webp({ quality: 88 }).toFile(path.join(REVIEW_DIR, dName));
        drawingUrl = `/images/review/${dName}`;
      } catch { /* unreadable drawing — show the candidate alone */ }
    }
  }
  if (!drawingUrl) noDrawing += 1;

  added.push({
    key: t.key, product: t.product, option: t.option, attempt: 1,
    addr: `${t.product} > ${t.section} > ${t.field} > ${t.option}`,
    label: t.label ?? t.option, field: t.field, part: '', orientation: '',
    description: 'Was live without approval; unwired 2026-08-10 pending your decision.',
    checklist: [], jobId: '', qcVerdict: t.ownerVerdict === 'REJECTED' ? 'previously-rejected' : 'never-reviewed',
    pipelineStatus: 'awaiting-owner',
    candidateUrl: `/images/review/${candName}`,
    drawingUrl, drawingOrigin: t.replacedWith ?? null,
    formerlyLiveAt: t.removed,
  });
}

queue.items = [...(queue.items ?? []), ...added];
queue.generatedAt = new Date().toISOString();
fs.writeFileSync(QUEUE, JSON.stringify(queue, null, 2) + '\n', 'utf8');

console.log(`staged                            : ${added.length}`);
console.log(`  without a drawing to compare    : ${noDrawing}`);
console.log(`queue now holds                   : ${queue.items.length}`);
console.log('\nOpen /admin/image-review — approving one re-publishes it, rejecting leaves it off.');
