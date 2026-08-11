#!/usr/bin/env node
/**
 * build_decision_ledger.mjs — ONE canonical record of every image decision.
 *
 * The 2026-08-10 incident happened because decisions live in two places — the
 * 2026-07-30 review export and the admin portal's own file — and a tool that
 * consulted only one of them unwired 150 approved images. The fix that day was
 * a targeted restore. The fix that lasts is this file: a single merged ledger
 * every downstream tool reads INSTEAD of picking a source it happens to know.
 *
 * Identity rules, learned the hard way:
 *   - A craft is (product, section, field, option) — `suit-2pc/coin-left`
 *     names BOTH the jacket coin pocket and the trouser one. Decisions keyed
 *     product/option are re-bound to a full address using, in order: the
 *     pipeline spec (which section its candidates were generated for), a
 *     unique catalog match, the review-queue item's address. Anything still
 *     ambiguous lands in `unresolved`, bound to nothing.
 *   - An image is a file, not a filename. Every referenced file that exists is
 *     content-hashed (sha1); .png/.webp spellings of the same stem are aliased,
 *     matching how the catalog serves .webp for a reviewed .png.
 *   - July keys are garment-scoped (`jacket|fieldId|optionId`) and fan out to
 *     every catalog row of that garment — the same rule unpublish/stage used.
 *
 * Owner decisions and machine verdicts are both recorded, but machine events
 * carry `machine: true` and NEVER count as approval. Nothing here deletes
 * history: the ledger is append-shaped (events, not last-writer-wins).
 *
 *   node tools/build_decision_ledger.mjs            # report only
 *   node tools/build_decision_ledger.mjs --write    # write the ledger + reports
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const PIPE = path.join(REPO, '.craft-pipeline');
const PUBLIC = path.join(REPO, 'public');

const PORTAL = path.join(REPO, 'data-store/image-review-decisions.json');
const PORTAL_LOG = path.join(REPO, 'data-store/image-review-decisions-log.json');
const V3 = path.join(REPO, 'public/images/reports/review-decisions-v3-2026-07-30.json');
const QUEUE = path.join(REPO, 'data-store/image-review-queue.json');
const UNPUBLISH = path.join(REPO, 'public/images/reports/unpublish-ledger.json');
const WRONGLY_UNWIRED = path.join(REPO, 'public/images/reports/wrongly-unwired.json');
const SUBJECT_AUDIT = path.join(REPO, 'public/images/reports/subject-audit-consolidated.json');

const LEDGER_OUT = path.join(REPO, 'data-store/image-decision-ledger.json');
const CONFLICTS_OUT = path.join(REPO, 'public/images/reports/ledger-conflicts.json');

const WRITE = process.argv.includes('--write');

const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const norm = (s) => '/' + String(s).replace(/^\/?images\//, 'images/').replace(/^\//, '');

/** Which garment a section belongs to — July decision keys are garment-scoped. */
function scopeOf(product, sectionId) {
  if (product === 'trousers') return 'trousers';
  if (product === 'vest') return 'vest';
  if (product === 'shirt') return 'shirt';
  if (/^trousers[-_]/i.test(sectionId)) return 'trousers';
  if (/^vest[-_]/i.test(sectionId)) return 'vest';
  return 'jacket';
}

// ── 1. enumerate every craft from the catalog (the only enumeration authority) ──
const crafts = new Map();           // craftId -> record
const byProductOption = new Map();  // product/option -> [craftId]
const byScopeFieldOption = new Map(); // scope|fieldId|optionId -> [craftId]

for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const cfg = readJson(path.join(OPTIONS_DIR, file), {});
  for (const s of cfg.sections ?? []) {
    for (const fl of s.fields ?? []) {
      for (const o of fl.options ?? []) {
        const craftId = `${product}|${s.id}|${fl.id}|${o.id}`;
        const scope = scopeOf(product, s.id);
        crafts.set(craftId, {
          craftId, product, sectionId: s.id, fieldId: fl.id, optionId: o.id,
          label: o.label ?? o.id, scope,
          current: {
            image: o.image ?? null,
            techpackIllustration: o.techpackIllustration ?? null,
            illustration: o.illustration ?? null,
            illustrationStatus: o.illustrationStatus ?? null,
            photos: Array.isArray(o.photos) ? o.photos : undefined,
            images: Array.isArray(o.images) ? o.images : undefined,
            realImage: o.realImage ?? undefined,
            aiImage: o.aiImage ?? undefined,
            photoAmbiguous: o.photoAmbiguous ?? undefined,
            verification: o.verification ? { method: o.verification.method, verifiedDate: o.verification.verifiedDate } : undefined,
          },
          events: [],
        });
        const po = `${product}/${o.id}`;
        (byProductOption.get(po) ?? byProductOption.set(po, []).get(po)).push(craftId);
        const sfo = `${scope}|${fl.id}|${o.id}`;
        (byScopeFieldOption.get(sfo) ?? byScopeFieldOption.set(sfo, []).get(sfo)).push(craftId);
      }
    }
  }
}

// ── 2. content-hash every image file a decision could reference ──────────────
const sha1Of = (p) => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
const hashCache = new Map(); // absolute path -> sha1|null
function hashFile(abs) {
  if (hashCache.has(abs)) return hashCache.get(abs);
  let h = null;
  try { if (fs.existsSync(abs) && fs.statSync(abs).isFile()) h = sha1Of(abs); } catch { /* unreadable */ }
  hashCache.set(abs, h);
  return h;
}
/** Resolve a served path (/images/...) to disk, hash it, and record aliases. */
function imageIdentity(servedPath, extra = {}) {
  if (!servedPath) return null;
  const p = norm(servedPath);
  const abs = path.join(PUBLIC, p.replace(/^\//, ''));
  const id = { path: p, sha1: hashFile(abs), exists: hashFile(abs) !== null, ...extra };
  // The catalog serves .webp for images the review recorded as .png and vice
  // versa — same picture, two spellings. Record the sibling when it exists.
  const sibling = p.endsWith('.webp') ? p.replace(/\.webp$/, '.png')
    : p.endsWith('.png') ? p.replace(/\.png$/, '.webp') : null;
  if (sibling) {
    const sabs = path.join(PUBLIC, sibling.replace(/^\//, ''));
    if (fs.existsSync(sabs)) id.alias = { path: sibling, sha1: hashFile(sabs) };
  }
  return id;
}

// ── 3. load evidence sources ────────────────────────────────────────────────
const portal = readJson(PORTAL, {});
const v3 = readJson(V3, {});
const queue = readJson(QUEUE, { items: [] });
const unpublish = readJson(UNPUBLISH, { changes: [] });
const wronglyUnwired = readJson(WRONGLY_UNWIRED, { rows: [] });
const subjectAudit = readJson(SUBJECT_AUDIT, { results: [] });

const queueByKey = new Map();
for (const it of queue.items ?? []) queueByKey.set(it.key, it);

const addrToCraftId = (addr) => {
  if (typeof addr !== 'string') return null;
  const parts = addr.split('>').map((x) => x.trim());
  if (parts.length !== 4) return null;
  const id = parts.join('|');
  return crafts.has(id) ? id : null;
};

const unresolved = [];
const conflicts = [];

function addEvent(craftId, ev) {
  const c = crafts.get(craftId);
  if (!c) return false;
  c.events.push(ev);
  return true;
}

// ── 3a. admin portal decisions — the owner's UI record ──────────────────────
// Two admin sources merge here: the legacy last-per-key map (291 decisions made
// before the log existed) and the append-only log (every decision since, with
// the craft address and image hash recorded at decision time). A revoked log
// event withdraws its decision; the withdrawal itself stays in history.
const portalLog = readJson(PORTAL_LOG, []);

function bindAdmin(key, d, explicitAddr) {
  const [product, option] = key.split('/');
  const matches = byProductOption.get(key) ?? [];
  const fromAddr = addrToCraftId(explicitAddr);
  if (fromAddr) return { craftId: fromAddr, boundBy: 'explicit-addr', matches };
  const spec = readJson(path.join(PIPE, product, option, 'spec.json'), null);
  if (spec?.productId && spec?.sectionId && spec?.fieldId && spec?.optionId) {
    const id = `${spec.productId}|${spec.sectionId}|${spec.fieldId}|${spec.optionId}`;
    if (crafts.has(id)) return { craftId: id, boundBy: 'pipeline-spec', matches };
  }
  if (matches.length === 1) return { craftId: matches[0], boundBy: 'unique-catalog-match', matches };
  const qi = queueByKey.get(key);
  const id = qi ? addrToCraftId(qi.addr) : null;
  if (id) return { craftId: id, boundBy: 'queue-addr', matches };
  return { craftId: null, boundBy: null, matches };
}

function adminImage(key, d) {
  const [product, option] = key.split('/');
  if (d.imagePath && d.imageSha1) {
    // The log writes repo-relative paths ('public/images/review/x.webp').
    // Normalize the public/ spelling to the served form ('/images/...') so
    // every reader resolves it the same one way; pipeline paths stay as-is.
    const p = d.imagePath.startsWith('public/') ? '/' + d.imagePath.slice('public/'.length)
      : d.imagePath.startsWith('.craft-pipeline') ? d.imagePath : norm(d.imagePath);
    return { path: p, sha1: d.imageSha1, exists: true, kind: 'logged-at-decision-time' };
  }
  const qi = queueByKey.get(key);
  const candidateAbs = path.join(PIPE, product, option, `candidate-${d.attempt}.png`);
  if (fs.existsSync(candidateAbs)) {
    return { path: `.craft-pipeline/${product}/${option}/candidate-${d.attempt}.png`, sha1: hashFile(candidateAbs), exists: true, kind: 'pipeline-candidate' };
  }
  if (qi?.formerlyLiveAt) return imageIdentity(qi.formerlyLiveAt, { kind: 'formerly-live' });
  if (qi?.candidateUrl) return imageIdentity(qi.candidateUrl, { kind: 'review-copy' });
  const rv = path.join(PUBLIC, 'images', 'review', `${product}__${option}__a${d.attempt}.webp`);
  const ro = path.join(PUBLIC, 'images', 'review', `${product}__${option}__owner.webp`);
  if (fs.existsSync(rv)) return imageIdentity(`/images/review/${product}__${option}__a${d.attempt}.webp`, { kind: 'review-copy' });
  if (fs.existsSync(ro)) return imageIdentity(`/images/review/${product}__${option}__owner.webp`, { kind: 'review-copy' });
  return null;
}

// Current decision per (key, craft): the log replayed in order, then the legacy
// map filling in whatever the log never touched.
const adminCurrent = new Map(); // `${key}::${craftId}` -> event
const logKeysTouched = new Set();
let adminBound = 0;

for (const e of portalLog) {
  const { craftId, boundBy, matches } = bindAdmin(e.key, e, e.addr);
  if (!craftId) { unresolved.push({ source: 'admin-portal-log', key: e.key, event: e }); continue; }
  const slot = `${e.key}::${craftId}`;
  logKeysTouched.add(slot);
  const ev = {
    source: 'admin-portal', via: 'log', event: e.event, verdict: e.verdict, attempt: e.attempt,
    image: adminImage(e.key, e), notes: e.notes, tags: e.tags, references: e.references,
    decidedAt: e.decidedAt, boundBy, portalKey: e.key,
    ambiguousKey: matches.length > 1 || undefined,
  };
  addEvent(craftId, ev);
  if (e.event === 'revoked') adminCurrent.delete(slot);
  else adminCurrent.set(slot, ev);
}

for (const [key, d] of Object.entries(portal)) {
  const { craftId, boundBy, matches } = bindAdmin(key, d, undefined);
  if (!craftId) { unresolved.push({ source: 'admin-portal', key, decision: d, candidates: matches }); continue; }
  const slot = `${key}::${craftId}`;
  if (logKeysTouched.has(slot)) { adminBound += 1; continue; } // log already carries it, with better identity
  const ev = {
    source: 'admin-portal', via: 'map', verdict: d.verdict, attempt: d.attempt,
    image: adminImage(key, d), notes: d.notes, tags: d.tags, references: d.references,
    decidedAt: d.decidedAt, boundBy, portalKey: key,
    ambiguousKey: matches.length > 1 || undefined,
  };
  addEvent(craftId, ev);
  adminCurrent.set(slot, ev);
  adminBound += 1;
}

// Withdrawn decisions must not count toward approval or rejection — and that
// currency must SURVIVE serialization: a reader of the ledger JSON (the
// applier) has to be able to tell a live decision from a superseded or revoked
// one without replaying the log itself. Verified failure mode 2026-08-11: the
// applier filtered out only the tombstone EVENT and then took the last admin
// event, which was the withdrawn decision — publishing an approval the owner
// had undone. Every admin event now carries current: true/false in the JSON.
const currentAdminEvents = new Set(adminCurrent.values());
for (const c of crafts.values()) {
  for (const e of c.events) {
    if (e.source === 'admin-portal') e.current = currentAdminEvents.has(e);
  }
}

// ── 3b. July 2026-07-30 review export — the owner's bulk review ─────────────
let julyEvents = 0;
const fanOut = (scopeKey) => byScopeFieldOption.get(scopeKey) ?? [];

for (const k of v3.accepted_keys ?? []) {
  for (const craftId of fanOut(k)) {
    // Approval of the row as it stood on 2026-07-30. The exact file is not in
    // the export; unpublish honoured it by leaving the live image alone.
    addEvent(craftId, { source: 'july-v3', verdict: 'approved', binding: 'row-as-of-2026-07-30', julyKey: k, decidedAt: '2026-07-30' });
    julyEvents += 1;
  }
  if (fanOut(k).length === 0) unresolved.push({ source: 'july-v3', list: 'accepted_keys', key: k });
}
for (const [list, verdict] of [['remakes', 'remake'], ['discards', 'discard'], ['bad_tech_packs', 'bad-techpack']]) {
  for (const r of v3[list] ?? []) {
    const k = `${r.garment}|${r.fieldId}|${r.id}`;
    const targets = fanOut(k);
    for (const craftId of targets) {
      addEvent(craftId, { source: 'july-v3', verdict, julyKey: k, note: r.note || undefined, label: r.label, decidedAt: '2026-07-30' });
      julyEvents += 1;
    }
    if (targets.length === 0) unresolved.push({ source: 'july-v3', list, key: k, label: r.label });
  }
}
for (const [list, verdict] of [['image_keeps', 'keep-file'], ['image_rejects', 'reject-file']]) {
  for (const r of v3[list] ?? []) {
    const k = `${r.garment}|${r.fieldId}|${r.id}`;
    const targets = fanOut(k);
    const image = imageIdentity(r.src, { kind: 'july-file', roles: r.roles });
    for (const craftId of targets) {
      addEvent(craftId, { source: 'july-v3', verdict, image, julyKey: k, decidedAt: '2026-07-30' });
      julyEvents += 1;
    }
    if (targets.length === 0) unresolved.push({ source: 'july-v3', list, key: k, src: r.src });
  }
}

// ── 3c. published-state history: the 2026-08-10 unpublish and its correction ─
let historyEvents = 0;
for (const c of unpublish.changes ?? []) {
  const craftId = `${c.product}|${c.section}|${c.field}|${c.option}`;
  if (addEvent(craftId, {
    source: 'unpublish-2026-08-10', verdict: 'unpublished', machine: true,
    image: imageIdentity(c.removed, { kind: 'was-live' }),
    replacedWith: c.replacedWith, ownerVerdictAtTheTime: c.ownerVerdict,
  })) historyEvents += 1;
  else unresolved.push({ source: 'unpublish-ledger', change: c });
}
for (const r of wronglyUnwired.rows ?? []) {
  const craftId = `${r.product}|${r.section}|${r.field}|${r.option}`;
  if (addEvent(craftId, {
    source: 'restore-2026-08-11', verdict: 'restored', machine: true,
    image: imageIdentity(r.removed, { kind: 'restored-live' }),
    reason: 'owner had approved in admin portal; unpublish consulted only the July file',
  })) historyEvents += 1;
}

// ── 3d. machine QC verdicts — evidence, never approval ──────────────────────
let qcEvents = 0;
for (const product of fs.existsSync(PIPE) ? fs.readdirSync(PIPE) : []) {
  const pdir = path.join(PIPE, product);
  if (!fs.statSync(pdir).isDirectory() || product.startsWith('_')) continue;
  for (const option of fs.readdirSync(pdir)) {
    const dir = path.join(pdir, option);
    if (!fs.statSync(dir).isDirectory()) continue;
    const qc = readJson(path.join(dir, 'qc.json'), null);
    if (!qc) continue;
    const spec = readJson(path.join(dir, 'spec.json'), null);
    let craftId = null;
    if (spec?.productId && spec?.sectionId) {
      const id = `${spec.productId}|${spec.sectionId}|${spec.fieldId}|${spec.optionId}`;
      if (crafts.has(id)) craftId = id;
    }
    if (!craftId) {
      const matches = byProductOption.get(`${product}/${option}`) ?? [];
      if (matches.length === 1) craftId = matches[0];
    }
    if (!craftId) { unresolved.push({ source: 'qc', product, option }); continue; }
    const attempt = qc.attempt ?? null;
    const candAbs = attempt != null ? path.join(dir, `candidate-${attempt}.png`) : null;
    addEvent(craftId, {
      source: 'qc', machine: true, verdict: qc.verdict ?? qc.result ?? 'UNKNOWN', attempt,
      image: candAbs && fs.existsSync(candAbs)
        ? { path: `.craft-pipeline/${product}/${option}/candidate-${attempt}.png`, sha1: hashFile(candAbs), exists: true, kind: 'pipeline-candidate' }
        : null,
      correction: qc.correction ?? undefined,
    });
    qcEvents += 1;
  }
}

// ── 4. derive current state per craft ───────────────────────────────────────
// Owner approval = an owner (non-machine) approved/keep event. Rejection the same.
// A craft can hold both (different images, or a true conflict on one image).
const stats = { crafts: crafts.size, adminBound, julyEvents, historyEvents, qcEvents, approvedCrafts: 0, photoApproved: 0, illustrationKeptOnly: 0, rejectedOnly: 0, conflicted: 0, undecided: 0 };

// A July keep of a roles:["techpack"] file is the owner keeping the DRAWING —
// it is not approval of a photograph and must not count as photo coverage.
const isPhotoKeep = (e) => e.verdict !== 'keep-file'
  || (Array.isArray(e.image?.roles ?? e.roles) ? (e.image?.roles ?? e.roles) : []).some((r) => ['generated', 'real', 'builder', 'ai'].includes(r))
  || !(e.image?.roles ?? e.roles); // no roles recorded: treat as photo, the conservative reading for preservation

for (const c of crafts.values()) {
  const owner = c.events.filter((e) => !e.machine
    && (e.source === 'july-v3' || (e.source === 'admin-portal' && currentAdminEvents.has(e))));
  const approvals = owner.filter((e) => ['approved', 'keep-file'].includes(e.verdict));
  const rejections = owner.filter((e) => ['rejected', 'reject-file', 'discard'].includes(e.verdict));
  const photoApprovals = approvals.filter((e) => e.verdict === 'approved' || isPhotoKeep(e));
  const illustrationKeeps = approvals.filter((e) => e.verdict === 'keep-file' && !isPhotoKeep(e));

  // A conflict is the SAME image approved in one source and rejected in the
  // other. Different images are not a conflict — reviewing a retry is normal.
  const bySha = new Map();
  for (const e of [...approvals, ...rejections]) {
    const sha = e.image?.sha1;
    if (!sha) continue;
    const cur = bySha.get(sha) ?? { approved: [], rejected: [] };
    (['approved', 'keep-file'].includes(e.verdict) ? cur.approved : cur.rejected).push(e);
    bySha.set(sha, cur);
  }
  const trueConflicts = [...bySha.entries()].filter(([, v]) => v.approved.length && v.rejected.length);
  if (trueConflicts.length) {
    c.conflict = trueConflicts.map(([sha, v]) => ({ sha1: sha, approvedBy: v.approved.map((e) => e.source), rejectedBy: v.rejected.map((e) => e.source) }));
    conflicts.push({ craftId: c.craftId, label: c.label, detail: c.conflict });
    stats.conflicted += 1;
  }

  c.state = photoApprovals.length ? 'has-owner-photo-approval'
    : illustrationKeeps.length ? 'illustration-kept-only'
    : rejections.length ? 'rejected-only' : 'undecided';
  c.approvedPhotoEvents = photoApprovals.length;
  c.illustrationKeepEvents = illustrationKeeps.length;
  c.rejectionEvents = rejections.length;
  if (approvals.length) stats.approvedCrafts += 1;
  if (photoApprovals.length) stats.photoApproved += 1;
  else if (illustrationKeeps.length) stats.illustrationKeptOnly += 1;
  else if (rejections.length) stats.rejectedOnly += 1;
  else stats.undecided += 1;
}

// ── 4b. illustration verification map — which drawing, and how sure are we ──
// The audit verdict is per blueprint FILE. A MATCH file shared by many sibling
// crafts still cannot distinguish them, so the share count rides along.
const auditVerdict = new Map((subjectAudit.results ?? []).map((r) => [r.bp, r.v]));
const illustrationUsers = new Map(); // path -> count of crafts using it
for (const c of crafts.values()) {
  const p = c.current.illustration ?? c.current.techpackIllustration;
  if (p) illustrationUsers.set(p, (illustrationUsers.get(p) ?? 0) + 1);
}
stats.illustration = { verifiedMatch: 0, drawingUnverified: 0, suspectMismatch: 0, suspectAmbiguous: 0, bannedJacket: 0, needsSource: 0, missing: 0 };
for (const c of crafts.values()) {
  const p = c.current.illustration ?? c.current.techpackIllustration ?? null;
  const v = p ? auditVerdict.get(p) : undefined;
  let status;
  if (!p) status = 'missing';
  else if (p.startsWith('/images/jacket/') && v !== 'MATCH') status = 'banned-jacket-unverified';
  else if (v === 'MISMATCH') status = 'suspect-mismatch';
  else if (v === 'AMBIGUOUS') status = 'suspect-ambiguous';
  else if (v === 'MATCH' || c.current.verification) status = 'verified-match';
  else if (c.current.illustrationStatus === 'needs-source') status = 'needs-source';
  else status = 'drawing-unverified';
  c.illustration = {
    path: p, status,
    auditVerdict: v ?? null,
    sharedWith: p ? illustrationUsers.get(p) - 1 : null,
    sha1: p ? (imageIdentity(p)?.sha1 ?? null) : null,
  };
  const k = { 'verified-match': 'verifiedMatch', 'drawing-unverified': 'drawingUnverified', 'suspect-mismatch': 'suspectMismatch', 'suspect-ambiguous': 'suspectAmbiguous', 'banned-jacket-unverified': 'bannedJacket', 'needs-source': 'needsSource', missing: 'missing' }[status];
  stats.illustration[k] += 1;
}

// ── 5. write ────────────────────────────────────────────────────────────────
const ledger = {
  version: 1,
  builtAt: new Date().toISOString(),
  builder: 'tools/build_decision_ledger.mjs',
  note: 'Canonical merged decision ledger. Downstream tools read THIS, not the individual sources. Machine events (machine:true) are evidence, never approval.',
  sources: {
    'admin-portal': { path: 'data-store/image-review-decisions.json', decisions: Object.keys(portal).length },
    'july-v3': { path: 'public/images/reports/review-decisions-v3-2026-07-30.json', accepted: (v3.accepted_keys ?? []).length, keeps: (v3.image_keeps ?? []).length, rejects: (v3.image_rejects ?? []).length },
    'unpublish-ledger': { path: 'public/images/reports/unpublish-ledger.json', changes: (unpublish.changes ?? []).length },
    'wrongly-unwired': { path: 'public/images/reports/wrongly-unwired.json', rows: (wronglyUnwired.rows ?? []).length },
    qc: { path: '.craft-pipeline/*/*/qc.json', verdicts: qcEvents },
    'subject-audit': { path: 'public/images/reports/subject-audit-consolidated.json', results: (subjectAudit.results ?? []).length },
  },
  stats,
  unresolved,
  crafts: Object.fromEntries([...crafts.entries()]),
};

console.log(`crafts enumerated                  : ${stats.crafts}`);
console.log(`admin decisions bound to a craft   : ${adminBound} / ${Object.keys(portal).length}`);
console.log(`July events fanned to crafts       : ${julyEvents}`);
console.log(`published-state history events     : ${historyEvents}`);
console.log(`machine QC events                  : ${qcEvents}`);
console.log(`crafts with owner PHOTO approval   : ${stats.photoApproved}`);
console.log(`crafts with only a kept DRAWING    : ${stats.illustrationKeptOnly}`);
console.log(`crafts with only rejections        : ${stats.rejectedOnly}`);
console.log(`crafts undecided                   : ${stats.undecided}`);
console.log(`TRUE conflicts (same image, both)  : ${stats.conflicted}`);
console.log(`unresolved references              : ${unresolved.length}`);
console.log(`illustrations                      : ${JSON.stringify(stats.illustration)}`);

if (WRITE) {
  fs.writeFileSync(LEDGER_OUT, JSON.stringify(ledger, null, 1) + '\n', 'utf8');
  fs.writeFileSync(CONFLICTS_OUT, JSON.stringify({ builtAt: ledger.builtAt, conflicts, unresolved }, null, 1) + '\n', 'utf8');
  console.log(`\nledger    -> ${path.relative(REPO, LEDGER_OUT).split(path.sep).join('/')}`);
  console.log(`conflicts -> ${path.relative(REPO, CONFLICTS_OUT).split(path.sep).join('/')}`);
} else {
  console.log('\nreport only — re-run with --write to write the ledger.');
}
