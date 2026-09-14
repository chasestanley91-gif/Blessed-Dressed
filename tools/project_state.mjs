#!/usr/bin/env node
// project_state.mjs — the repository's single source of derived truth.
//
// The catalog, the pipeline artifacts and the shipped image files are three
// separate stores that drift apart. This tool JOINS them, audits the join, and
// regenerates the persistent state documents so that no session has to
// reconstruct project state from chat history.
//
// It READS everything and WRITES ONLY:
//   <reports>/repo-index.json      full searchable join (one record per option)
//   <reports>/state-summary.json   machine roll-up + audit findings
//   STATE.md                       where the project is, right now
//   CONTINUE.md                    what the next session should do first
//   PROJECT_DASHBOARD.md           coverage tables per product
//
// It never touches the catalog, the images or the pipeline artifacts.
//
// Usage:
//   node tools/project_state.mjs                 # write index + state docs
//   node tools/project_state.mjs --audit         # print findings only, write nothing
//   node tools/project_state.mjs --json          # summary JSON to stdout
//   node tools/project_state.mjs --skills=<dir>  # where the 3 pipeline skills live
//
// Exit 0 = join is clean. Exit 1 = at least one blocking audit finding.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv = process.argv.slice(2)) {
  const out = {};
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}
const args = parseArgs();

const REPO = path.resolve(args.repo || path.join(HERE, '..'));
const SKILLS = path.resolve(
  args.skills || process.env.CRAFT_SKILLS_DIR || path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude', 'skills')
);
const REPORTS = path.resolve(args.out || path.join(REPO, 'public', 'images', 'reports'));
const PIPELINE = path.join(REPO, '.craft-pipeline');
const PUBLIC = path.join(REPO, 'public');
const GENERATED = path.join(PUBLIC, 'images', 'generated');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const tryJson = (p) => {
  try {
    return readJson(p);
  } catch {
    return null;
  }
};
const exists = (p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
};
const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');

// ---------------------------------------------------------------------------
// 1. Catalog inventory — the option walk and the structural classification are
//    both owned by tech-pack-interpreter, so its libs are imported rather than
//    re-implemented here. This tool only adds the JOIN (live image, pipeline
//    artifacts, files on disk), which inventory.mjs deliberately does not model.
// ---------------------------------------------------------------------------
async function loadInventory() {
  const libDir = path.join(SKILLS, 'tech-pack-interpreter', 'scripts', 'lib');
  if (!exists(libDir)) {
    throw new Error(`tech-pack-interpreter libs not found at ${libDir}. Pass --skills=<dir containing tech-pack-interpreter>.`);
  }
  const { resolveCatalog, iterateOptions } = await import(pathToFileURL(path.join(libDir, 'catalog.mjs')).href);
  const { extractSpec } = await import(pathToFileURL(path.join(libDir, 'spec.mjs')).href);

  const cat = resolveCatalog({ options: path.join(REPO, 'data-store', 'options'), public: PUBLIC });
  const out = [];
  for (const opt of iterateOptions(cat)) {
    const spec = extractSpec(opt);
    const profiled = spec.part !== 'generic-detail';
    out.push({
      addr: spec.addr,
      product: spec.productId,
      section: opt.sectionId,
      field: opt.fieldId,
      option: opt.optionId,
      label: spec.label,
      part: spec.part,
      kind: spec.part.startsWith('fin-') ? 'finishing' : profiled ? 'structural' : 'unprofiled',
      blueprint: spec.illustrationExists ? 'local' : spec.illustrationRemote ? 'remote' : 'none',
      excluded: spec.excluded || null,
      generate: spec.generate,
      illustration: spec.illustration,
      // The catalog's CURRENT value — what the builder renders today. extractSpec
      // reports the blueprint (tech pack wins), which is a different thing.
      liveImage: opt.liveImage ?? null,
      techpackIllustration: opt.techpackIllustration ?? null,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. Pipeline artifacts — what the three-skill pipeline has actually produced.
// ---------------------------------------------------------------------------
const ARTIFACTS = ['spec.json', 'prompt.json', 'generation.json', 'qc.json'];

function scanPipeline() {
  const byKey = new Map();
  if (!exists(PIPELINE)) return byKey;
  for (const productId of fs.readdirSync(PIPELINE)) {
    const pdir = path.join(PIPELINE, productId);
    if (!fs.statSync(pdir).isDirectory()) continue;
    for (const optionId of fs.readdirSync(pdir)) {
      const odir = path.join(pdir, optionId);
      if (!fs.statSync(odir).isDirectory()) continue;
      const files = fs.readdirSync(odir);
      const have = {};
      for (const a of ARTIFACTS) have[a.replace('.json', '')] = files.includes(a);

      const qc = files.includes('qc.json') ? tryJson(path.join(odir, 'qc.json')) : null;
      const gen = files.includes('generation.json') ? tryJson(path.join(odir, 'generation.json')) : null;
      const spec = files.includes('spec.json') ? tryJson(path.join(odir, 'spec.json')) : null;

      byKey.set(`${productId}/${optionId}`, {
        productId,
        optionId,
        // The pipeline path carries no field; spec.json is the authority on which
        // field this record belongs to (publish_approved.mjs joins the same way).
        fieldId: spec ? spec.fieldId || null : null,
        // ...and a product can even repeat one field/option pair across two
        // SECTIONS (suit-2pc coin-pocket exists in suit-pockets AND
        // Trousers-front-pockets, drawn against different tech packs).
        sectionId: spec ? spec.sectionId || null : null,
        // owner ruling: spec-only options are generable with NO drawing by design
        specOnly: spec ? !!spec.specOnly : false,
        dir: rel(odir),
        have,
        candidates: files.filter((f) => /^candidate-\d+\.png$/i.test(f)).length,
        // Sidecar files record superseded / rejected attempts; their presence is
        // history, not current state, but the counts matter for the audit trail.
        supersededArtifacts: files.filter((f) => /-(rejected|superseded)(-|\.)/i.test(f)).length,
        needsReverify: files.includes('NEEDS-REVERIFY.json'),
        verdict: qc ? qc.verdict || null : null,
        attempt: (qc && qc.attempt) || (gen && gen.attempt) || null,
        scoreMin: qc ? (qc.scoreMin ?? null) : null,
        lowestScore: qc && qc.scores ? Math.min(...Object.values(qc.scores).filter((n) => typeof n === 'number')) : null,
        belowMin: qc && Array.isArray(qc.belowMinCategories) ? qc.belowMinCategories : [],
        errorSeverities: qc && Array.isArray(qc.errors) ? qc.errors.map((e) => e.severity) : [],
        checkedAt: qc ? qc.checkedAt || null : null,
        generatedAt: gen ? gen.generatedAt || null : null,
        model: gen ? gen.model || null : null,
      });
    }
  }
  return byKey;
}

// ---------------------------------------------------------------------------
// 3. Shipped images on disk — hashed, so reuse of one file across options
//    (a real defect: two craft options must never show the same photo) shows up.
// ---------------------------------------------------------------------------
function scanGenerated() {
  const files = new Map(); // "generated/<dir>/<file>" -> {bytes, sha1}
  if (!exists(GENERATED)) return files;
  for (const d of fs.readdirSync(GENERATED)) {
    const dir = path.join(GENERATED, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const st = fs.statSync(full);
      if (!st.isFile()) continue;
      files.set(`/images/generated/${d}/${f}`, {
        bytes: st.size,
        sha1: crypto.createHash('sha1').update(fs.readFileSync(full)).digest('hex'),
        mtime: st.mtime.toISOString(),
      });
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// 4. Join + audit
// ---------------------------------------------------------------------------
const inventory = await loadInventory();
const pipeline = scanPipeline();
const generated = scanGenerated();

const isGeneratedPath = (s) => typeof s === 'string' && /(^|\/)images\/generated\//i.test(s);

// ── the owner's own decisions ───────────────────────────────────────────────
// The admin portal writes data-store/image-review-decisions.json; each entry is
// a human ruling on one option at one attempt.
//
// This tool used to ignore that file completely and derive every lifecycle
// stage from the machine QC verdict alone. That was a defect with teeth in BOTH
// directions: 75 images the owner had REJECTED were reported to the next
// session as "QC approved - publish it", and 40 images the owner had personally
// APPROVED were filed under failed-retry-due/unmet and queued for a
// credit-burning regeneration nobody needed.
//
// Owner ruling, 2026-08-10: "unless ive approved them physically dont put them
// on the live website." A QC verdict is evidence; only the owner grants
// consent. The owner's decision therefore outranks the machine in both
// directions, and it is read HERE so no downstream reader has to remember to.
const DECISIONS = path.join(REPO, 'data-store', 'image-review-decisions.json');
const ownerDecisions = tryJson(DECISIONS) || {};

// A `product/option` key is NOT a craft identity. 17 of them match two different
// catalog rows apiece: suit-3pc/coin-none is BOTH the jacket coin pocket and the
// trouser coin pocket; suit-3pc/sb-5 is both a jacket button config and a vest
// one. Counting the rows that wear each key is what lets a binding refuse to
// guess.
const keyRowCount = new Map();
for (const inv of inventory) {
  const k = `${inv.product}/${inv.option}`;
  keyRowCount.set(k, (keyRowCount.get(k) || 0) + 1);
}

// The append-only decision log records the FULL craft address the owner was
// looking at when they ruled. Where it exists it outranks the ambiguous key.
const DECISIONS_LOG = path.join(REPO, 'data-store', 'image-review-decisions-log.json');
const rawDecisionLog = tryJson(DECISIONS_LOG) || [];
const decisionLogEntries = Array.isArray(rawDecisionLog)
  ? rawDecisionLog
  : rawDecisionLog.entries || [];
const ownerDecisionAddrs = new Map();
for (const e of decisionLogEntries) {
  if (!e || !e.key || !e.addr) continue;
  if (!ownerDecisionAddrs.has(e.key)) ownerDecisionAddrs.set(e.key, new Set());
  ownerDecisionAddrs.get(e.key).add(e.addr);
}

const records = [];
const shippedUse = new Map(); // generated path -> [addr]

for (const inv of inventory) {
  const key = `${inv.product}/${inv.option}`;
  let pipe = pipeline.get(key) || null;
  // Field- and section-aware join: a product/option key can be shared by two
  // DIFFERENT fields (suit-3pc front-style/button-config sb-5 vs Vest
  // button-stance sb-5) and even by one field across two SECTIONS (suit-2pc
  // coin-pocket in suit-pockets vs Trousers-front-pockets). When spec.json
  // names its field/section and either disagrees with this row's, the pipeline
  // record belongs to the sibling — do not let its verdict leak.
  if (pipe && pipe.fieldId && inv.field && pipe.fieldId !== inv.field) pipe = null;
  if (pipe && pipe.sectionId && inv.section && pipe.sectionId !== inv.section) pipe = null;

  // What the builder actually renders today. inventory.mjs reports `illustration`
  // as the BLUEPRINT (tech pack wins), so the live value is read back here from
  // the catalog record it preserved.
  const live = inv.liveImage ?? null;
  const shippedPath = isGeneratedPath(live) ? live : null;
  const shippedFile = shippedPath ? generated.get(shippedPath) || null : null;
  if (shippedPath) {
    shippedUse.set(shippedPath, [...(shippedUse.get(shippedPath) || []), inv.addr]);
  }

  // WHICH CRAFT did the owner actually rule on?
  //
  // Binding a decision by its `product/option` key alone applies one craft's
  // verdict to a DIFFERENT craft - precisely the contamination PROJECT-GOAL-V4
  // §2 and §12 prohibit by name. That is not hypothetical: doing it unpublished
  // the jacket coin-pocket row on the strength of a TROUSER rejection.
  //
  // So the address decides:
  //   address    - the append-only log names this exact craft. Authoritative.
  //   other-craft- the log names a DIFFERENT craft under this key. Not ours.
  //   unique-key - no logged address, but only one row wears the key. Safe.
  //   ambiguous  - no logged address and the key is shared. UNRESOLVED: it binds
  //                to nothing, because §10 forbids acting on an association the
  //                system cannot prove.
  //
  // A decision recorded against an OLDER attempt does not settle a NEWER
  // candidate either: that reopens review rather than closing it.
  const od = ownerDecisions[key] || null;
  const loggedAddrs = ownerDecisionAddrs.get(key) || null;
  let ownerBinding = 'none';
  if (od) {
    if (loggedAddrs) ownerBinding = loggedAddrs.has(inv.addr) ? 'address' : 'other-craft';
    else if ((keyRowCount.get(key) || 0) <= 1) ownerBinding = 'unique-key';
    else ownerBinding = 'ambiguous';
  }
  const owner =
    od && (ownerBinding === 'address' || ownerBinding === 'unique-key')
      ? {
          verdict: od.verdict, // 'approved' | 'rejected'
          attempt: od.attempt ?? null,
          decidedAt: od.decidedAt ?? null,
          boundBy: ownerBinding,
          // No machine verdict => the owner ruled on whatever was in front of
          // them, and that ruling stands unqualified.
          coversGraded:
            !pipe || !pipe.verdict ? true : (od.attempt ?? 0) >= (pipe.attempt ?? 0),
        }
      : null;
  // Kept even though nothing binds, so an unprovable decision is VISIBLE in the
  // report rather than silently absent from it.
  const ownerUnresolved =
    ownerBinding === 'ambiguous'
      ? { key, verdict: od.verdict, decidedAt: od.decidedAt ?? null, rowsSharingKey: keyRowCount.get(key) || 0 }
      : null;

  records.push({
    key,
    owner,
    ownerUnresolved,
    addr: inv.addr,
    product: inv.product,
    section: inv.section,
    field: inv.field,
    option: inv.option,
    label: inv.label,
    part: inv.part,
    kind: inv.kind,
    excluded: inv.excluded,
    inScope: Boolean(inv.generate),
    blueprint: inv.blueprint, // local | remote | none
    illustration: inv.illustration,
    liveImage: live,
    shipped: Boolean(shippedPath && shippedFile),
    shippedPath,
    shippedBytes: shippedFile ? shippedFile.bytes : null,
    shippedSha1: shippedFile ? shippedFile.sha1 : null,
    pipeline: pipe
      ? {
          dir: pipe.dir,
          have: pipe.have,
          verdict: pipe.verdict,
          attempt: pipe.attempt,
          lowestScore: pipe.lowestScore,
          belowMin: pipe.belowMin,
          candidates: pipe.candidates,
          needsReverify: pipe.needsReverify,
          specOnly: pipe.specOnly || false,
          checkedAt: pipe.checkedAt,
        }
      : null,
    // Lifecycle stage, derived — the one field a human or agent should read.
    stage: null, // filled below
  });
}

function deriveStage(r) {
  if (r.excluded) return 'excluded-swatch';
  if (!r.inScope) return r.blueprint === 'none' ? 'no-blueprint' : 'out-of-scope';
  const p = r.pipeline;
  const o = r.owner;

  // ── THE OWNER OUTRANKS THE MACHINE, IN BOTH DIRECTIONS ────────────────────
  // Reading the QC verdict first is what produced two mirror-image defects:
  // images the owner REJECTED were advertised to the next session as
  // "publish it", and images the owner APPROVED were filed as retry-owed and
  // queued to be regenerated at cost. No later gate can recover from either,
  // because both corrupt the instruction the next reader acts on.
  if (o && o.coversGraded) {
    if (o.verdict === 'rejected') return 'owner-rejected';
    if (o.verdict === 'approved') {
      if (!r.shipped) return 'owner-approved-not-shipped';
      // Shipped WITH consent. Keep the strength of the machine's agreement
      // visible rather than flattening it: a clean pass, a logged waiver, an
      // image taken over the machine's objection, and a legacy image the owner
      // vouched for are four different claims.
      if (p && p.verdict === 'PASS') return 'shipped';
      if (p && p.verdict === 'PASS_WAIVED') return 'shipped-waived';
      if (p && p.verdict) return 'shipped-owner-override';
      return 'shipped-owner-approved';
    }
  }

  if (p && p.needsReverify) return 'needs-reverify';

  // Machine-approved, owner has not ruled on THIS attempt. Not shippable, and
  // emphatically not "publish it" - it belongs in front of the owner.
  if (p && (p.verdict === 'PASS' || p.verdict === 'PASS_WAIVED')) return 'awaiting-owner-review';
  // PASS_WAIVED ships too — it is an approval, granted after the retry budget is
  // spent, to an image scoring >=95 in every category with ZERO critical or major
  // findings. This branch did not exist, so every waived image fell through to
  // `generated-awaiting-qc`: it vanished from the shipped count, and the state
  // doc told the next reader to go and QC an image that already carries a logged
  // verdict. Kept as its own stage rather than folded into `shipped`, because a
  // waiver is a weaker claim than a clean pass and the report should keep saying so.
  if (p && p.verdict === 'FAIL') return 'failed-retry-due';
  if (p && p.verdict === 'UNMET') return 'unmet';
  if (p && p.have.generation) return 'generated-awaiting-qc';
  if (p && p.have.prompt) return 'prompt-built';
  if (p && p.have.spec) return 'spec-only';
  if (r.shipped) return 'legacy-shipped-unverified';
  return 'not-started';
}
// Owner ruling (2026-08-01): a spec-only pipeline record makes its option fully
// in scope — the missing drawing is waived, not disqualifying.
const specOnlyIdentities = new Set(
  records.filter((r) => r.pipeline && r.pipeline.specOnly).map((r) => r.field + "/" + r.option)
);
for (const r of records) if (specOnlyIdentities.has(r.field + "/" + r.option)) r.inScope = true;
for (const r of records) r.stage = deriveStage(r);

// addr -> "field/option": lets the reuse audit collapse the same craft option
// offered on several products down to a single identity.
const optionIdentityByAddr = new Map(records.map((r) => [r.addr, `${r.field}/${r.option}`]));

// --- audit findings ---------------------------------------------------------
const findings = [];
const add = (severity, code, message, items = []) =>
  findings.push({ severity, code, message, count: items.length, items: items.slice(0, 50) });

// Blocking: the owner APPROVED this image and the catalog still does not serve
// it. This is the ONLY "publish it" finding there is. The old PASS_NOT_SHIPPED
// finding keyed off the QC verdict instead, so it spent months instructing each
// new session to publish 69 images the owner had explicitly REJECTED.
const approvedNotShipped = records.filter((r) => r.stage === 'owner-approved-not-shipped');
if (approvedNotShipped.length) {
  add('blocking', 'OWNER_APPROVED_NOT_SHIPPED',
    'The owner approved this image but the catalog does not serve it — publish it.',
    approvedNotShipped.map((r) => r.addr));
}

// Blocking: an image the owner REJECTED is being served. This is
// PROJECT-GOAL-V4 §20's "zero unapproved images accidentally published", and
// it is the exact defect unpublish_unapproved.mjs had to repair on 2026-08-10.
// Never let it go quiet again.
const rejectedLive = records.filter(
  (r) => r.owner && r.owner.coversGraded && r.owner.verdict === 'rejected' && r.shipped
);
if (rejectedLive.length) {
  add('blocking', 'OWNER_REJECTED_LIVE',
    'The owner REJECTED this image and it is still being served — unpublish it.',
    rejectedLive.map((r) => `${r.addr} -> ${r.shippedPath}`));
}

// Warning: a decision that cannot be pinned to one craft. It binds to NOTHING,
// so no tool will act on it - but it is a real owner ruling that is currently
// doing no work, and only a human can say which craft it belongs to.
const ownerAmbiguous = records.filter((r) => r.ownerUnresolved);
if (ownerAmbiguous.length) {
  add('warning', 'OWNER_DECISION_AMBIGUOUS',
    'An owner decision exists under a product/option key shared by more than one craft, with no address in the append-only log. It binds to nothing until disambiguated \u2014 never act on it.',
    ownerAmbiguous.map((r) => `${r.addr}  (key ${r.key} \u2192 ${r.ownerUnresolved.verdict}, shared by ${r.ownerUnresolved.rowsSharingKey} crafts)`));
}

// Warning, not blocking: a report cannot hurry a human. But this is the queue
// the whole project gates on, so it must stay visible.
const awaitingOwner = records.filter((r) => r.stage === 'awaiting-owner-review');
if (awaitingOwner.length) {
  add('warning', 'AWAITING_OWNER_REVIEW',
    'QC approved; the owner has not ruled on this attempt. Stage it at /admin/image-review.',
    awaitingOwner.map((r) => r.addr));
}

// Blocking: catalog points at a generated file that is not on disk.
const brokenShipped = records.filter((r) => r.shippedPath && !r.shippedSha1);
if (brokenShipped.length) {
  add('blocking', 'SHIPPED_FILE_MISSING', 'Catalog references a generated image that does not exist on disk.',
    brokenShipped.map((r) => `${r.addr} -> ${r.shippedPath}`));
}

// The same craft option (same field + option id) offered on several products is
// SUPPOSED to share one photo — a 4.5 cm notch lapel is the same lapel whether it
// is ordered on a sport coat, a 2-piece or a 3-piece suit. Only a collision
// between DISTINCT options is a defect, so identity is keyed on field/option and
// never on the product-qualified address.
const optionIdentity = (r) => `${r.field}/${r.option}`;

// Blocking: one image file wired to two genuinely different craft options — the
// reference then cannot teach a customer the difference between them.
const reusedShipped = [];
for (const [p, addrs] of shippedUse) {
  if (addrs.length < 2) continue;
  const ids = [...new Set(addrs.map((a) => optionIdentityByAddr.get(a)))];
  if (ids.length > 1) reusedShipped.push([p, ids]);
}
if (reusedShipped.length) {
  add('blocking', 'SHIPPED_IMAGE_REUSED', 'One generated image is wired to two or more DISTINCT craft options.',
    reusedShipped.map(([p, ids]) => `${p} <- ${ids.length} options: ${ids.join(' | ')}`));
}

// Blocking: distinct options whose shipped images are byte-identical even though
// the filenames differ. This is the failure the whole catalog exists to prevent —
// e.g. every peak-lapel width pointing at one rendering of "a peak lapel" — and it
// is invisible to a filename-only check, so content is hashed and grouped by the
// OPTION identities behind each hash.
const byHash = new Map();
for (const r of records) {
  if (!r.shippedSha1) continue;
  const g = byHash.get(r.shippedSha1) || { opts: new Set(), files: new Set() };
  g.opts.add(optionIdentity(r));
  g.files.add(r.shippedPath);
  byHash.set(r.shippedSha1, g);
}
const collisions = [...byHash.entries()].filter(([, g]) => g.opts.size > 1)
  .sort((a, b) => b[1].opts.size - a[1].opts.size);
if (collisions.length) {
  add('blocking', 'DISTINCT_OPTION_IMAGE_COLLISION',
    'Byte-identical images ship for craft options that must look different from each other.',
    collisions.map(([h, g]) => `${h.slice(0, 12)} — ${g.opts.size} options share 1 image (${[...g.files].length} filename(s)): ${[...g.opts].join(' | ')}`));
}

// Warning: byte-identical files on disk under different names. Where every copy
// belongs to the SAME option this is only wasted disk and duplicated spend, not a
// customer-visible defect, so it ranks below the collision check above.
const byFileHash = new Map();
for (const [p, meta] of generated) byFileHash.set(meta.sha1, [...(byFileHash.get(meta.sha1) || []), p]);
const dupFiles = [...byFileHash.entries()].filter(([, ps]) => ps.length > 1);
if (dupFiles.length) {
  add('warning', 'DUPLICATE_IMAGE_CONTENT', 'Distinct generated filenames hold byte-identical images.',
    dupFiles.map(([h, ps]) => `${h.slice(0, 12)}: ${ps.join(' , ')}`));
}

// Warning: shipped without any QC record — cannot prove it was ever verified.
const legacyUnverified = records.filter((r) => r.stage === 'legacy-shipped-unverified');
if (legacyUnverified.length) {
  add('warning', 'SHIPPED_WITHOUT_QC', 'Catalog shows a generated image with no qc.json to back it (legacy output).',
    legacyUnverified.map((r) => r.addr));
}

// Warning: pipeline work exists for an option the catalog no longer has.
const invKeys = new Set(records.map((r) => r.key));
const orphanPipeline = [...pipeline.keys()].filter((k) => !invKeys.has(k));
if (orphanPipeline.length) {
  add('warning', 'ORPHAN_PIPELINE_DIR', 'A .craft-pipeline folder has no matching catalog option.', orphanPipeline);
}

// Warning: generated file on disk that no option points at.
//
// A PNG MASTER IS NOT AN ORPHAN WHEN ITS .webp SIBLING IS WIRED.
// ---------------------------------------------------------------
// Since the WebP migration the catalog serves `<id>.webp`, so a naive "is this
// exact path referenced?" test reported all 578 PNG masters as unreferenced —
// 688 orphan warnings, the overwhelming majority of which were the single most
// important file in the provenance chain telling us it was junk. The masters are
// deliberately retained: publish_approved.mjs gate 2 proves the shipped pixels
// are the pixels QC graded by SHA-1 byte-identity against candidate-<attempt>.png,
// and a lossy derivative can never be byte-identical. The chain is
//
//   qc.json (attempt N) -> candidate-N.png (sha X)
//                       -> generated/<id>.png  (sha X, byte-identical, the anchor)
//                       -> generated/<id>.webp (derived; manifest records sourceSha1 X)
//
// So a file is wired if EITHER it is referenced directly, or its counterpart in
// the pair is. Deleting a "orphan" master on this report's say-so would have
// silently destroyed the guarantee while every test still passed.
const wired = new Set([...shippedUse.keys()]);
const counterpartOf = (p) =>
  /\.png$/i.test(p) ? p.replace(/\.png$/i, '.webp') : /\.webp$/i.test(p) ? p.replace(/\.webp$/i, '.png') : null;

const provenanceAnchors = [];
const orphanFiles = [];
for (const p of generated.keys()) {
  if (wired.has(p)) continue;
  const sibling = counterpartOf(p);
  if (sibling && wired.has(sibling)) {
    provenanceAnchors.push(`${p}  (anchor for the served ${sibling})`);
    continue;
  }
  orphanFiles.push(p);
}
if (orphanFiles.length) {
  add('warning', 'ORPHAN_IMAGE_FILE', 'Generated image on disk is not referenced by any catalog option, and has no wired .png/.webp counterpart.', orphanFiles);
}
if (provenanceAnchors.length) {
  add('info', 'PROVENANCE_ANCHOR',
    'Unreferenced by the catalog BY DESIGN: the QC-graded master behind a served derivative. Required by publish_approved.mjs gate 2 — do not delete.',
    provenanceAnchors);
}

// Warning: in-scope option whose blueprint is a remote URL — cannot be attached
// as a hard geometry reference until it is pulled into the repo.
const remoteBlueprints = records.filter((r) => r.inScope && r.blueprint === 'remote');
if (remoteBlueprints.length) {
  add('warning', 'REMOTE_BLUEPRINT', 'In-scope option blueprint is a remote URL, not a local file.',
    remoteBlueprints.map((r) => `${r.addr} -> ${r.illustration}`));
}

// Info: shared blueprints — one drawing behind several in-scope options.
const byIllu = new Map();
for (const r of records) {
  if (!r.inScope || !r.illustration) continue;
  byIllu.set(r.illustration, [...(byIllu.get(r.illustration) || []), r.addr]);
}
const sharedBlueprints = [...byIllu.entries()].filter(([, a]) => a.length > 1).sort((a, b) => b[1].length - a[1].length);
if (sharedBlueprints.length) {
  add('info', 'SHARED_BLUEPRINT',
    'One illustration backs several in-scope options; the reference cannot disambiguate them.',
    sharedBlueprints.map(([p, a]) => `${p} <- ${a.length} options`));
}

// --- roll-ups ---------------------------------------------------------------
const STAGES = [
  'shipped', 'shipped-waived', 'shipped-owner-override', 'shipped-owner-approved',
  'owner-approved-not-shipped', 'owner-rejected', 'awaiting-owner-review',
  'needs-reverify', 'failed-retry-due', 'unmet',
  'generated-awaiting-qc', 'prompt-built', 'spec-only', 'legacy-shipped-unverified',
  'not-started', 'no-blueprint', 'excluded-swatch', 'out-of-scope',
];

const perProduct = {};
for (const r of records) {
  const p = (perProduct[r.product] ||= { total: 0, inScope: 0, ...Object.fromEntries(STAGES.map((s) => [s, 0])) });
  p.total++;
  if (r.inScope) p.inScope++;
  p[r.stage]++;
}

const totals = { total: records.length, inScope: 0, ...Object.fromEntries(STAGES.map((s) => [s, 0])) };
for (const r of records) {
  if (r.inScope) totals.inScope++;
  totals[r.stage]++;
}

const inScope = records.filter((r) => r.inScope);
// A waived pass IS shipped and IS verified — it carries a mechanical verdict and
// a logged waiver. Counting only 'shipped' understated coverage by every waived
// image. The waived subtotal is reported alongside so the weaker claim stays
// visible rather than being absorbed into the headline.
const verifiedClean = inScope.filter((r) => r.stage === 'shipped').length;
const verifiedWaived = inScope.filter((r) => r.stage === 'shipped-waived').length;
// An image is DONE when the owner has consented to it and it is live — that is
// the project's own definition (§10). Counting only machine-passed images
// understated coverage by every option the owner personally signed off after the
// machine had objected, or vouched for without a pipeline record at all.
const verifiedOverride = inScope.filter((r) => r.stage === 'shipped-owner-override').length;
const verifiedLegacyOk = inScope.filter((r) => r.stage === 'shipped-owner-approved').length;
const verified = verifiedClean + verifiedWaived + verifiedOverride + verifiedLegacyOk;
const pct = (n, d) => (d ? ((n / d) * 100).toFixed(1) : '0.0');

const checkpoint = tryJson(path.join(REPORTS, 'CHECKPOINT.json'));
const blocking = findings.filter((f) => f.severity === 'blocking');

const summary = {
  generatedAt: new Date().toISOString(),
  generatedBy: 'tools/project_state.mjs',
  repo: rel(REPO) || '.',
  catalog: rel(path.join(REPO, 'data-store', 'options')),
  totals,
  perProduct,
  verifiedShipped: verified,
  verifiedShippedClean: verifiedClean,
  verifiedShippedWaived: verifiedWaived,
  verifiedShippedOwnerOverride: verifiedOverride,
  verifiedShippedOwnerApprovedLegacy: verifiedLegacyOk,
  verifiedShippedPct: pct(verified, inScope.length),
  pipelineDirs: pipeline.size,
  generatedFiles: generated.size,
  sharedBlueprintIllustrations: sharedBlueprints.length,
  sharedBlueprintOptions: sharedBlueprints.reduce((n, [, a]) => n + a.length, 0),
  credits: checkpoint ? checkpoint.credits || (checkpoint.batch_run && checkpoint.batch_run.credits) || null : null,
  findings: findings.map(({ severity, code, message, count }) => ({ severity, code, message, count })),
  blockingCount: blocking.length,
};

// ---------------------------------------------------------------------------
// 5. Emit
// ---------------------------------------------------------------------------
if (args.json) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(blocking.length ? 1 : 0);
}

if (args.audit) {
  console.log(`Audit of ${rel(REPO) || REPO}  (${records.length} options, ${pipeline.size} pipeline dirs, ${generated.size} generated files)\n`);
  for (const f of findings) {
    console.log(`[${f.severity.toUpperCase()}] ${f.code} — ${f.message}  (${f.count})`);
    for (const it of f.items.slice(0, 8)) console.log(`    ${it}`);
    if (f.count > 8) console.log(`    … ${f.count - 8} more`);
  }
  if (!findings.length) console.log('No findings.');
  console.log(`\n${blocking.length} blocking finding(s).`);
  process.exit(blocking.length ? 1 : 0);
}

fs.mkdirSync(REPORTS, { recursive: true });

const write = (p, body) => {
  fs.writeFileSync(p, body, 'utf8');
  console.log('wrote ' + rel(p));
};

write(path.join(REPORTS, 'repo-index.json'), JSON.stringify({ generatedAt: summary.generatedAt, count: records.length, records }, null, 2));
write(path.join(REPORTS, 'state-summary.json'), JSON.stringify({ ...summary, findings }, null, 2));

// --- PROJECT_DASHBOARD.md ---------------------------------------------------
const dashCols = ['shipped', 'shipped-waived', 'shipped-owner-override', 'shipped-owner-approved', 'owner-approved-not-shipped', 'owner-rejected', 'awaiting-owner-review', 'generated-awaiting-qc', 'spec-only', 'failed-retry-due', 'unmet', 'legacy-shipped-unverified', 'not-started'];
const dashRow = (name, p) =>
  `| ${name} | ${p.total} | ${p.inScope} | ` + dashCols.map((c) => p[c]).join(' | ') + ' |';

write(
  path.join(REPO, 'PROJECT_DASHBOARD.md'),
  `# Project Dashboard — craft-option photography

_Generated by \`tools/project_state.mjs\` at ${summary.generatedAt}. Do not hand-edit; re-run the tool._

**Verified & shipped: ${verified} / ${inScope.length} in-scope options (${summary.verifiedShippedPct}%)**

| product | options | in scope | ${dashCols.join(' | ')} |
|---|---|---|${dashCols.map(() => '---').join('|')}|
${Object.entries(perProduct).map(([n, p]) => dashRow(n, p)).join('\n')}
${dashRow('**TOTAL**', totals)}

## Stage meanings

| stage | meaning |
|---|---|
| shipped | owner APPROVED, QC PASS, and the catalog serves it |
| shipped-waived | owner APPROVED, QC waived-pass, and the catalog serves it |
| shipped-owner-override | live because the OWNER approved it over a QC FAIL/UNMET |
| shipped-owner-approved | live legacy image the owner vouched for; no QC record |
| owner-approved-not-shipped | the owner said yes and the catalog does not serve it — **publish it** |
| owner-rejected | the owner said NO. Never publish; owes a failure-aware retry |
| awaiting-owner-review | QC approved, owner has not ruled — belongs at /admin/image-review |
| generated-awaiting-qc | image exists, no verdict yet |
| spec-only / prompt-built | interpreted, not yet generated |
| failed-retry-due | QC FAIL, a corrected attempt is owed |
| unmet | retries exhausted without reaching the bar |
| needs-reverify | a prior approval was revoked |
| legacy-shipped-unverified | image is live with no qc.json behind it |
| not-started | in scope, no pipeline artifacts |
| no-blueprint / excluded-swatch | out of generation scope by design |

## Audit findings

| severity | code | count | message |
|---|---|---|---|
${findings.length ? findings.map((f) => `| ${f.severity} | ${f.code} | ${f.count} | ${f.message} |`).join('\n') : '| — | none | 0 | Join is clean |'}

Full detail: \`${rel(path.join(REPORTS, 'state-summary.json'))}\` · per-option join: \`${rel(path.join(REPORTS, 'repo-index.json'))}\`

## Reference data

- Pipeline artifact folders: ${pipeline.size}
- Generated image files on disk: ${generated.size}
- Shared blueprints: ${summary.sharedBlueprintIllustrations} illustrations back ${summary.sharedBlueprintOptions} in-scope options
${summary.credits ? `- Credits (from CHECKPOINT.json): ${JSON.stringify(summary.credits)}` : ''}
`
);

// --- STATE.md ---------------------------------------------------------------
const topStages = STAGES.filter((s) => totals[s] > 0).map((s) => `- ${s}: **${totals[s]}**`).join('\n');

write(
  path.join(REPO, 'STATE.md'),
  `# STATE — craft-option photography catalog

_Generated by \`tools/project_state.mjs\` at ${summary.generatedAt}. Machine state: \`${rel(path.join(REPORTS, 'state-summary.json'))}\`._
_Do not hand-edit; re-run \`node tools/project_state.mjs\`._

## Headline

${verified} of ${inScope.length} in-scope craft options are verified and shipped (${summary.verifiedShippedPct}%).
${blocking.length ? `**${blocking.length} blocking audit finding(s)** — see below.` : 'No blocking audit findings.'}

## Every option by lifecycle stage

${topStages}

## Blocking findings

${blocking.length
    ? blocking.map((f) => `### ${f.code} (${f.count})\n${f.message}\n\n${f.items.slice(0, 10).map((i) => `- ${i}`).join('\n')}${f.count > 10 ? `\n- … ${f.count - 10} more in state-summary.json` : ''}`).join('\n\n')
    : '_None._'}

## Warnings

${findings.filter((f) => f.severity === 'warning').map((f) => `- **${f.code}** (${f.count}) — ${f.message}`).join('\n') || '_None._'}

## Stores this state is joined from

| store | path | size |
|---|---|---|
| catalog | \`${rel(path.join(REPO, 'data-store', 'options'))}\` | ${records.length} options |
| pipeline artifacts | \`.craft-pipeline\` | ${pipeline.size} option folders |
| shipped images | \`public/images/generated\` | ${generated.size} files |

## Longer-form history

- \`${rel(path.join(REPORTS, 'CHECKPOINT.json'))}\` — narrative checkpoint (decisions, bugs found, credit ledger)
- \`${rel(path.join(REPORTS, 'failure-log.md'))}\` — prompt lessons; read before writing any new prompt
- \`PROJECT_DASHBOARD.md\` — per-product coverage tables
- \`CONTINUE.md\` — the next concrete action
`
);

// --- CONTINUE.md ------------------------------------------------------------
// Next action is derived from the join, in priority order, so a fresh session
// never has to guess.
const nextActions = [];
if (blocking.length) {
  for (const f of blocking) {
    nextActions.push(`**Clear blocking \`${f.code}\`** (${f.count}) — ${f.message} See STATE.md for the list.`);
  }
}
if (totals['owner-rejected']) {
  nextActions.push(`**Regenerate ${totals['owner-rejected']} owner-REJECTED option(s)** with failure-aware prompts — read each rejection reason first. These never publish as they stand.`);
}
if (totals['awaiting-owner-review']) {
  nextActions.push(`**Put ${totals['awaiting-owner-review']} QC-approved image(s) in front of the owner** at /admin/image-review (\`node tools/build_review_queue.mjs --write\`). A QC PASS is not consent.`);
}
if (totals['needs-reverify']) {
  nextActions.push(`**Re-verify ${totals['needs-reverify']} option(s)** whose approval was revoked (stage \`needs-reverify\` in repo-index.json).`);
}
if (totals['failed-retry-due']) {
  nextActions.push(`**Run corrected retries** for ${totals['failed-retry-due']} option(s) at QC FAIL — read the qc.json \`correction\` field first.`);
}
if (totals['generated-awaiting-qc']) {
  nextActions.push(`**QC ${totals['generated-awaiting-qc']} generated image(s)** that have no verdict yet (garment-image-qc).`);
}
if (totals['spec-only'] || totals['prompt-built']) {
  nextActions.push(`**Generate ${totals['spec-only'] + totals['prompt-built']} interpreted option(s)** that have a spec but no image (garment-image-director).`);
}
if (totals['not-started']) {
  nextActions.push(`**Start ${totals['not-started']} in-scope option(s)** with no artifacts at all (tech-pack-interpreter first).`);
}
if (totals['legacy-shipped-unverified']) {
  nextActions.push(`**Decide the fate of ${totals['legacy-shipped-unverified']} legacy image(s)** shipped with no qc.json — re-verify or replace.`);
}

write(
  path.join(REPO, 'CONTINUE.md'),
  `# CONTINUE — start here

_Generated by \`tools/project_state.mjs\` at ${summary.generatedAt}. Re-run the tool after any work unit._

## Read first

1. \`STATE.md\` — current position and blocking findings
2. \`${rel(path.join(REPORTS, 'CHECKPOINT.json'))}\` — decisions already made, bugs already fixed, credit ledger
3. \`${rel(path.join(REPORTS, 'failure-log.md'))}\` — prompt lessons; **read before writing any prompt**
4. The pipeline skills, in order: \`tech-pack-interpreter\` → \`garment-image-director\` → \`garment-image-qc\`

## Standing rules

- The tech-pack illustration is law. Never improve it, never redesign it.
- \`garment-image-qc\` is the only authority that may approve a catalog write-back.
- Never overwrite an approved asset. Never generate from \`/images/generated/\` (that is our own output).
- A wrong blueprint is invisible to QC — the more faithful the render, the higher it scores. Check the drawing against the label before spending credits.
- Log every credit spend in \`failure-log.md\`.

## Next actions, in priority order

${nextActions.length ? nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n') : '_Nothing queued — the join is clean and every in-scope option is shipped._'}

## Queries against the index

\`\`\`bash
node tools/project_state.mjs --audit            # findings only, writes nothing
node tools/project_state.mjs --json             # summary roll-up

# every option at a given stage
node -e "const r=require('./${rel(path.join(REPORTS, 'repo-index.json'))}').records; \\
  console.log(r.filter(x=>x.stage==='not-started').map(x=>x.addr).join('\\n'))"
\`\`\`

## Open questions owed by the user

${(checkpoint && checkpoint.batch_run && Array.isArray(checkpoint.batch_run.next_steps)
    ? checkpoint.batch_run.next_steps.filter((s) => /OPEN QUESTION|QUESTION FOR USER/i.test(s)).map((s) => `- ${s}`).join('\n')
    : '') || '_See CHECKPOINT.json → decisions_needed_from_dustin._'}
`
);

console.log(
  `\n${verified}/${inScope.length} in-scope options verified & shipped (${summary.verifiedShippedPct}%)  ·  ` +
    `${findings.length} finding(s), ${blocking.length} blocking`
);
process.exit(blocking.length ? 1 : 0);
