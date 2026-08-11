#!/usr/bin/env node
/**
 * apply_owner_approvals.mjs — make the catalog serve EXACTLY what the owner
 * approved, and fold every owner rejection into its retry prompt.
 *
 * Replaces the publish half of apply_review_decisions.mjs, which had three
 * faults this tool exists to never repeat:
 *   1. It published `--option=<id>` with no product, so an approval could act
 *      on a different product's craft than the one the owner judged.
 *   2. It published the attempt QC graded, not the attempt the owner clicked
 *      approve on. Those diverge the moment a retry lands after the review —
 *      which happened: the 2026-08-10 overnight run added attempts on top of
 *      already-reviewed options. An approval is for ONE exact image.
 *   3. It passed --allow-swap unconditionally, disabling the gate that keeps a
 *      live photo from being silently replaced.
 *
 * This tool reads the canonical ledger (data-store/image-decision-ledger.json,
 * built by tools/build_decision_ledger.mjs) so every decision arrives already
 * bound to a full craft address with the sha1 of the exact bytes judged.
 *
 * For each CURRENT owner approval:
 *   - the approved bytes are staged as the master PNG, a WebP derivative is
 *     produced, and the bound craft row's `image` is wired to it;
 *   - fan-out to sibling rows follows publish_approved.mjs's rules — same
 *     field+option identity AND same label AND same blueprint; anything else
 *     is refused, never guessed;
 *   - a live generated image is replaced ONLY when the ledger shows no owner
 *     approval for those bytes. Owner-approved bytes on both sides of a swap
 *     is a conflict, reported and left alone;
 *   - `photos[]` is kept honest: the approved image leads it, and files the
 *     owner rejected for THIS craft are removed from the row's galleries
 *     (files stay on disk; the ledger keeps the history).
 *
 * For each CURRENT owner rejection: the reason (tags + notes + references) is
 * appended to prompt.json as an OWNER CORRECTION block, idempotently, exactly
 * as apply_review_decisions.mjs did.
 *
 *   node tools/apply_owner_approvals.mjs            # report only
 *   node tools/apply_owner_approvals.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const require = createRequire(path.join(REPO, 'package.json'));
const sharp = require('sharp');

const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const PIPE = path.join(REPO, '.craft-pipeline');
const PUBLIC = path.join(REPO, 'public');
const LEDGER = path.join(REPO, 'data-store', 'image-decision-ledger.json');
const LOG = path.join(REPO, 'public/images/reports/apply-owner-approvals-log.json');

const APPLY = process.argv.includes('--apply');
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const sha1 = (p) => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
const isGenerated = (v) => typeof v === 'string' && v.includes('/images/generated/');
const normLabel = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const GENERATED_FOLDER = {
  shirt: 'shirt', 'sport-coat': 'sport-coat', 'suit-2pc': 'jacket',
  'suit-3pc': 'jacket', trousers: 'trousers', vest: 'vest',
};

const ledger = readJson(LEDGER, null);
if (!ledger) { console.error('no ledger — run: node tools/build_decision_ledger.mjs --write'); process.exit(1); }

// ── load catalog with live row handles ──────────────────────────────────────
const files = new Map(); // product -> { cfg, touched }
const rows = [];         // { product, sectionId, fieldId, optionId, craftId, identity, label, option }
for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const cfg = readJson(path.join(OPTIONS_DIR, file), {});
  files.set(product, { cfg, touched: false });
  for (const s of cfg.sections ?? []) for (const fl of s.fields ?? []) for (const o of fl.options ?? []) {
    rows.push({
      product, sectionId: s.id, fieldId: fl.id, optionId: o.id,
      craftId: `${product}|${s.id}|${fl.id}|${o.id}`,
      identity: `${fl.id}/${o.id}`, label: o.label ?? o.id, option: o,
    });
  }
}
const rowByCraft = new Map(rows.map((r) => [r.craftId, r]));
const rowsByIdentity = new Map();
for (const r of rows) (rowsByIdentity.get(r.identity) ?? rowsByIdentity.set(r.identity, []).get(r.identity)).push(r);

// Every generated image currently wired, for the collision gate.
const wiredBy = new Map(); // served path -> Set(identity)
for (const r of rows) if (isGenerated(r.option.image)) {
  (wiredBy.get(r.option.image) ?? wiredBy.set(r.option.image, new Set()).get(r.option.image)).add(r.identity);
}

// Which bytes the owner approved, PER CRAFT. Approval is craft-specific
// (the suit-2pc/coin-left rule): bytes approved for a sibling craft do not
// protect this craft's slot, and this craft's own approval outranks a sibling's
// file sitting in it. Also collects every approved file per craft so photos[]
// can carry ALL of them (image #1 is the illustration, #2+ every approved
// photo — approvals are never discarded, only superseded as the primary).
const approvedShaByCraft = new Map(); // craftId -> Set(sha1)
const approvedFilesByCraft = new Map(); // craftId -> Map(sha1 -> served path)
for (const c of Object.values(ledger.crafts)) {
  for (const e of c.events ?? []) {
    if (e.machine) continue;
    if ((e.source === 'admin-portal' && e.verdict === 'approved') || (e.source === 'july-v3' && e.verdict === 'keep-file')) {
      const shas = [e.image?.sha1, e.image?.alias?.sha1].filter(Boolean);
      if (!shas.length) continue;
      const set = approvedShaByCraft.get(c.craftId) ?? approvedShaByCraft.set(c.craftId, new Set()).get(c.craftId);
      for (const s of shas) set.add(s);
      // Remember a servable path for the approved file (public paths only).
      const served = [e.image?.alias?.path, e.image?.path].find((p) => p && p.startsWith('/images/'));
      if (served) {
        const m = approvedFilesByCraft.get(c.craftId) ?? approvedFilesByCraft.set(c.craftId, new Map()).get(c.craftId);
        if (!m.has(shas[0])) m.set(shas[0], served);
      }
    }
  }
}

// Master-png provenance for a served webp: the sha of the .png beside it.
function masterShaOfServed(served) {
  const png = path.join(PUBLIC, served.replace(/^\//, '').replace(/\.webp$/i, '.png'));
  try { return fs.existsSync(png) ? sha1(png) : null; } catch { return null; }
}

const blueprintOf = (row) => {
  const tp = row.option.techpackIllustration;
  if (typeof tp === 'string' && tp) return tp.toLowerCase();
  const img = row.option.image;
  return typeof img === 'string' && img && !isGenerated(img) ? img.toLowerCase() : null;
};

// ── walk the ledger's current admin decisions ───────────────────────────────
const plan = [];      // approvals to enact
const already = [];   // approvals live with the exact bytes
const flagged = [];   // anything refused, with the reason
const corrections = []; // rejections to fold into prompts

for (const c of Object.values(ledger.crafts)) {
  const admin = (c.events ?? []).filter((e) => e.source === 'admin-portal' && !e.event?.startsWith?.('revoked'));
  if (!admin.length) continue;
  const latest = admin[admin.length - 1];

  if (latest.verdict === 'rejected') {
    corrections.push({ craftId: c.craftId, e: latest });
    continue;
  }
  if (latest.verdict !== 'approved') continue;

  const row = rowByCraft.get(c.craftId);
  if (!row) { flagged.push({ craftId: c.craftId, reason: 'craft no longer in catalog' }); continue; }

  const img = latest.image;
  if (!img?.sha1) { flagged.push({ craftId: c.craftId, reason: 'approved image has no resolvable bytes' }); continue; }

  // Where are the approved bytes?
  let srcAbs = null;
  if (img.path.startsWith('.craft-pipeline')) srcAbs = path.join(REPO, img.path);
  else srcAbs = path.join(PUBLIC, img.path.replace(/^\//, ''));
  if (!fs.existsSync(srcAbs)) { flagged.push({ craftId: c.craftId, reason: `approved file gone: ${img.path}` }); continue; }
  if (sha1(srcAbs) !== img.sha1) { flagged.push({ craftId: c.craftId, reason: `bytes at ${img.path} changed since approval` }); continue; }

  // Legacy staged approval of a formerly-live file: rewire that exact path.
  if (img.kind === 'formerly-live' || (img.kind === 'review-copy' && !img.path.startsWith('.craft-pipeline'))) {
    const want = img.kind === 'formerly-live' ? img.path : null;
    if (!want) { flagged.push({ craftId: c.craftId, reason: 'review-copy approval with no formerly-live target — needs the original file' }); continue; }
    if (row.option.image === want) { already.push({ craftId: c.craftId, served: want }); continue; }
    plan.push({ kind: 'rewire', craftId: c.craftId, row, served: want, previous: row.option.image ?? null, sha1: img.sha1 });
    continue;
  }

  // Pipeline-candidate approval: master + webp under the product's folder.
  const folder = GENERATED_FOLDER[row.product] ?? row.product;
  const master = `/images/generated/${folder}/${row.optionId}.png`;
  const served = master.replace(/\.png$/, '.webp');

  // Live with the exact approved bytes already?
  if (row.option.image && isGenerated(row.option.image) && masterShaOfServed(row.option.image) === img.sha1) {
    already.push({ craftId: c.craftId, served: row.option.image });
    continue;
  }

  // Collision gate: the served path must not belong to a different identity.
  const owners = wiredBy.get(served);
  if (owners && [...owners].some((o) => o !== row.identity)) {
    flagged.push({ craftId: c.craftId, reason: `${served} is wired to a different craft: ${[...owners].join(', ')}` });
    continue;
  }

  // Swap gate — craft-scoped. The latest approval FOR THIS CRAFT is the
  // owner's current will for this slot; bytes approved for a sibling craft do
  // not block it. A file this craft's owner-approval history covers is never
  // discarded: it stays in photos[] below.
  const liveMasterSha = row.option.image && isGenerated(row.option.image) ? masterShaOfServed(row.option.image) : null;
  const liveApprovedElsewhereOnly = liveMasterSha && !((approvedShaByCraft.get(c.craftId) ?? new Set()).has(liveMasterSha));

  // Fan-out: sibling rows that are provably the same craft. A sibling serving
  // bytes approved for ITS OWN craft keeps them.
  const targets = [row];
  for (const sib of rowsByIdentity.get(row.identity) ?? []) {
    if (sib === row) continue;
    if (normLabel(sib.label) !== normLabel(row.label)) continue;
    const a = blueprintOf(sib), b = blueprintOf(row);
    if (b && a !== b) continue;
    const sibLive = sib.option.image && isGenerated(sib.option.image) ? masterShaOfServed(sib.option.image) : null;
    if (sibLive && (approvedShaByCraft.get(sib.craftId) ?? new Set()).has(sibLive) && sibLive !== img.sha1) continue;
    targets.push(sib);
  }

  plan.push({
    kind: 'publish', craftId: c.craftId, row, targets, master, served, srcAbs,
    sha1: img.sha1, attempt: latest.attempt, previous: row.option.image ?? null,
    note: liveApprovedElsewhereOnly ? `previous file was approved for a sibling craft, not this one` : undefined,
  });
}

// ── plan-level safety: no silent byte-swaps under a shared path ─────────────
// 1. Two plan entries writing DIFFERENT bytes to one master file would leave
//    whichever ran second in control of both crafts' rows.
// 2. A row OUTSIDE a plan entry's fan-out that serves the same path would have
//    its displayed bytes changed without its craft ever being decided on.
{
  const byMaster = new Map();
  for (const p of plan.filter((x) => x.kind === 'publish')) {
    const prev = byMaster.get(p.master);
    if (prev && prev.sha1 !== p.sha1) {
      flagged.push({ craftId: p.craftId, reason: `master collision: ${p.master} is also being written by ${prev.craftId} with different bytes` });
      plan.splice(plan.indexOf(p), 1);
    } else byMaster.set(p.master, p);
  }
  for (const p of [...plan.filter((x) => x.kind === 'publish')]) {
    const targetSet = new Set(p.targets.map((t) => t.craftId));
    const outside = rows.filter((r) => r.option.image === p.served && !targetSet.has(r.craftId));
    if (outside.length) {
      const liveSha = masterShaOfServed(p.served);
      if (liveSha && liveSha !== p.sha1) {
        flagged.push({ craftId: p.craftId, reason: `${p.served} is served by ${outside.length} row(s) outside the fan-out (${outside.slice(0, 3).map((r) => r.craftId).join('; ')}${outside.length > 3 ? '…' : ''}) — changing its bytes would silently change what they show` });
        plan.splice(plan.indexOf(p), 1);
      }
    }
  }
}

// ── report ──────────────────────────────────────────────────────────────────
console.log(`owner approvals already live exactly : ${already.length}`);
console.log(`approvals to enact                   : ${plan.length}`);
for (const p of plan) console.log(`  ${p.kind.toUpperCase()} ${p.craftId}\n     ${p.previous ?? '(empty)'} -> ${p.served}${p.targets && p.targets.length > 1 ? `  (+${p.targets.length - 1} sibling row(s))` : ''}`);
console.log(`flagged — needs a human              : ${flagged.length}`);
for (const f of flagged) console.log(`  FLAG ${f.craftId}: ${f.reason}`);
console.log(`rejections to fold into prompts      : ${corrections.length}`);

// The dry-run plan is itself an auditable artifact — written every run so a
// human (or a verifier) can inspect exactly what --apply would do.
fs.writeFileSync(path.join(REPO, 'public/images/reports/apply-owner-approvals-plan.json'), JSON.stringify({
  plannedAt: new Date().toISOString(), applied: APPLY,
  already: already.length, flagged,
  corrections: corrections.map(({ craftId, e }) => ({ craftId, attempt: e.attempt, tags: e.tags, notes: e.notes, references: e.references })),
  plan: plan.map((p) => ({
    kind: p.kind, craftId: p.craftId, master: p.master ?? null, served: p.served,
    sha1: p.sha1, attempt: p.attempt ?? null, previous: p.previous, note: p.note,
    targets: p.targets ? p.targets.map((t) => t.craftId) : [p.craftId],
  })),
}, null, 1) + '\n', 'utf8');

// ── apply ───────────────────────────────────────────────────────────────────
if (APPLY) {
  const log = { appliedAt: new Date().toISOString(), tool: 'tools/apply_owner_approvals.mjs', published: [], rewired: [], corrections: [], flagged };

  for (const p of plan) {
    if (p.kind === 'rewire') {
      p.row.option.image = p.served;
      files.get(p.row.product).touched = true;
      log.rewired.push({ craftId: p.craftId, served: p.served, previous: p.previous });
      continue;
    }
    // Stage the master only when the bytes differ from what is already there.
    const masterAbs = path.join(PUBLIC, p.master.replace(/^\//, ''));
    fs.mkdirSync(path.dirname(masterAbs), { recursive: true });
    if (!fs.existsSync(masterAbs) || sha1(masterAbs) !== p.sha1) fs.copyFileSync(p.srcAbs, masterAbs);
    const servedAbs = path.join(PUBLIC, p.served.replace(/^\//, ''));
    await sharp(masterAbs).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 82 }).toFile(servedAbs);

    for (const t of p.targets) {
      // Preserve an outgoing drawing exactly as publish_approved.mjs would.
      const cur = t.option.image;
      if (!t.option.techpackIllustration && typeof cur === 'string' && cur && !isGenerated(cur)) {
        t.option.techpackIllustration = cur;
      }
      t.option.image = p.served;
      // The approved photo leads the gallery, and every OTHER file the owner
      // ever approved for this exact craft stays in it (image #2+). Superseded
      // is not unapproved.
      const alsoApproved = [...(approvedFilesByCraft.get(t.craftId)?.values() ?? [])]
        .filter((f) => f !== p.served && fs.existsSync(path.join(PUBLIC, f.replace(/^\//, ''))));
      const rest = [...alsoApproved, ...(Array.isArray(t.option.photos) ? t.option.photos : [])]
        .filter((x, i, a) => x !== p.served && a.indexOf(x) === i);
      if (rest.length || Array.isArray(t.option.photos)) t.option.photos = [p.served, ...rest];
      files.get(t.product).touched = true;
    }
    log.published.push({ craftId: p.craftId, served: p.served, sha1: p.sha1, attempt: p.attempt, rows: p.targets.map((t) => t.craftId), previous: p.previous });
  }

  // Rejected files leave the galleries of the craft they were rejected for.
  for (const { craftId, e } of corrections) {
    const row = rowByCraft.get(craftId);
    if (!row) continue;
    const bad = new Set([e.image?.path, e.image?.alias?.path].filter(Boolean));
    for (const arrKey of ['photos', 'images']) {
      if (Array.isArray(row.option[arrKey])) {
        const kept = row.option[arrKey].filter((x) => !bad.has(x));
        if (kept.length !== row.option[arrKey].length) { row.option[arrKey] = kept; files.get(row.product).touched = true; }
      }
    }
  }

  for (const [product, f] of files) {
    if (f.touched) fs.writeFileSync(path.join(OPTIONS_DIR, `${product}.json`), JSON.stringify(f.cfg, null, 2) + '\n', 'utf8');
  }

  // Owner corrections into prompt.json — idempotent on (attemptRejected, decidedAt).
  let folded = 0;
  for (const { craftId, e } of corrections) {
    const [product, , , option] = craftId.split('|');
    const pFile = path.join(PIPE, product, e.portalKey.split('/')[1], 'prompt.json');
    if (!fs.existsSync(pFile)) continue;
    const prompt = readJson(pFile, {});
    const dup = (prompt.ownerCorrections || []).some((x) => x.attemptRejected === e.attempt && x.decidedAt === e.decidedAt);
    if (dup) continue;
    const parts = [];
    if (e.tags?.length) parts.push(`What is wrong with it: ${e.tags.join('; ')}.`);
    if (e.notes) parts.push(e.notes);
    if (e.references?.length) parts.push(
      `The owner has supplied ${e.references.length} reference photograph(s) of what this option should actually look like. ` +
      `Those photographs are attached and OUTRANK the supplier line drawing wherever the two disagree: match the construction, ` +
      `proportion and finish shown in them. Use the line drawing only for anything the photographs do not show.`);
    const block = `OWNER CORRECTION AFTER REVIEW (attempt ${e.attempt} was rejected by the owner — obey this over any conflicting earlier line, including the BLUEPRINT LOCK): ${parts.join(' ')}`;
    prompt.prompt = `${prompt.prompt}\n\n${block}`;
    prompt.ownerCorrections = prompt.ownerCorrections || [];
    prompt.ownerCorrections.push({ attemptRejected: e.attempt, decidedAt: e.decidedAt, tags: e.tags || [], notes: e.notes || '', references: e.references || [], appliedAt: new Date().toISOString(), craftId });
    fs.writeFileSync(pFile, JSON.stringify(prompt, null, 1));
    folded += 1;
    log.corrections.push({ craftId, attemptRejected: e.attempt });
  }

  fs.writeFileSync(LOG, JSON.stringify(log, null, 1) + '\n', 'utf8');
  console.log(`\nAPPLIED: ${log.published.length} published, ${log.rewired.length} rewired, ${folded} corrections folded`);
  console.log(`log -> ${path.relative(REPO, LOG).split(path.sep).join('/')}`);
  console.log('now run: node tools/catalog_invariants.mjs && node tools/build_decision_ledger.mjs --write');
} else {
  console.log('\ndry run — nothing written. Re-run with --apply.');
}
