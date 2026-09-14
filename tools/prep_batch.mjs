#!/usr/bin/env node
/**
 * prep_batch.mjs — turn the next N worklist entries into generation-ready
 * payloads: persisted spec, locked prompt, pre-flight gate, blueprint path.
 *
 * Everything here is free. Nothing in this file spends a credit, and that is
 * deliberate — the whole point is that an option is fully proven on paper
 * before any money is committed to it.
 *
 * An entry that fails its pre-flight gate is DROPPED from the batch and
 * reported, never silently generated anyway.
 *
 * Usage
 *   node tools/prep_batch.mjs --n=12            # next 12 not yet prepared
 *   node tools/prep_batch.mjs --n=12 --from=24
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
/**
 * The RECONCILED list, built from the A-E decision queue by wave_worklist.mjs.
 *
 * This used to default to `generation-worklist.json`, which is built from QC
 * verdicts — and QC stopped being the authority the moment the owner's
 * decisions became one (V4 §5, §12). The two disagree substantially: 201
 * identities against 371. Defaulting to the superseded list means a batch can
 * silently prepare crafts the owner has already ruled on and skip ones they
 * have not, which is the exact failure V4 §5 exists to prevent.
 *
 * The QC-derived list is still reachable with
 *   --worklist=public/images/reports/generation-worklist.json
 * for comparison, but it is no longer what you get by accident.
 */
const DEFAULT_WORKLIST = path.join(REPO, 'public/images/reports/wave-worklist.json');
const LEGACY_WORKLIST = path.join(REPO, 'public/images/reports/generation-worklist.json');
const PIPE = path.join(REPO, '.craft-pipeline');
const SKILL_TP = path.join(os.homedir(), '.claude/skills/tech-pack-interpreter/scripts');
const SKILL_GD = path.join(os.homedir(), '.claude/skills/garment-image-director/scripts');
const OUT = path.join(REPO, 'public/images/reports/batch-payload.json');

const arg = (k, d) => { const h = process.argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const N = Number(arg('n', 12));
const FROM = Number(arg('from', 0));
const COMPACT = process.argv.includes('--compact');
/** Skip the live reachability gate - only for offline prep, never before spending. */
const NO_VERIFY = process.argv.includes('--no-verify-urls');

// The storefront serves blueprints over plain HTTPS, so the image service can
// fetch them directly and the per-image signed-upload dance is unnecessary.
//
// "Confirmed 2026-08-08: all 504 worklist illustrations return 200" USED to sit
// here as a standing guarantee. It is not one. A blueprint published to the repo
// today does not exist on the origin until a deploy, and on 2026-08-26 a freshly
// prepared 40-craft batch had 39 of its 40 blueprint URLs returning 404 - every
// one of them a drawing added earlier that same day. That is the worst failure
// this pipeline has: the prompt says "THE DRAWING IS LAW ... the SOLE authority",
// the fetch quietly fails, and the image is generated from prose alone while
// claiming a blueprint it never saw. Reachability is a live GATE now. See EXPOSURE-FINDINGS.md — this host is public whether or
// not the pipeline uses it, so using it adds no exposure.
const PUBLIC_ORIGIN = arg('origin', 'https://customsuits.net');

// The work list is a parameter, not a constant: `generation-worklist.json` is
// built from QC verdicts, which stopped being the authority when the owner's
// decisions became one (V4 §5, §12). `tools/wave_worklist.mjs` emits the same
// shape from the A–E decision queue — pass it with --worklist=.
const WORKLIST = (() => {
  const p = arg('worklist', '');
  if (p) return path.isAbsolute(p) ? p : path.join(REPO, p);
  return fs.existsSync(DEFAULT_WORKLIST) ? DEFAULT_WORKLIST : LEGACY_WORKLIST;
})();
const wl = JSON.parse(fs.readFileSync(WORKLIST, 'utf8'));
console.log(`worklist : ${path.relative(REPO, WORKLIST).split(path.sep).join('/')}  (${wl.work.length} identities)`);

/** Orientation the drawing shows. The naming hint is the fallback, not the rule. */
function orientationFor(w) {
  const t = `${w.section} ${w.field} ${w.label}`.toLowerCase();
  if (/back|vent|seat|yoke|rear/.test(t)) return 'back';
  if (/interior|lining|inside|curtain/.test(t)) return 'interior';
  if (/cuff|sleeve|pocket|waistband|hem|belt|placket|collar|lapel|front|button|dart|pleat|fly/.test(t)) return 'front';
  return 'front';
}

const node = process.execPath;
const run = (script, args) => execFileSync(node, [script, ...args], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });


/**
 * Non-withheld owner reference photographs for a craft, as public URLs.
 * `withheld` means the reference was reviewed and found NOT to depict this exact
 * option - build_prompt already refuses to claim those, and neither may we.
 */
function ownerReferenceUrlsFor(productId, optionId) {
  const f = path.join(PIPE, productId, optionId, 'owner-references.json');
  if (!fs.existsSync(f)) return [];
  let doc;
  try { doc = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; }
  return (doc.references ?? [])
    .filter((r) => !r.withheld)
    .map((r) => (typeof r === 'string' ? r : r.path))
    .filter((p) => typeof p === 'string' && p.startsWith('/'))
    .filter((p) => fs.existsSync(path.join(REPO, 'public', p.replace(/^\//, ''))))
    .map((p) => PUBLIC_ORIGIN + p.split('/').map(encodeURIComponent).join('/').replace(/^%2F/, '/'));
}

const prepared = [];
const dropped = [];
let i = FROM;
while (prepared.length < N && i < wl.work.length) {
  const w = wl.work[i]; i += 1;
  // Skip anything already photographed and graded — but ONLY when the work list
  // is the QC-derived one. A decision-queue work list has already applied the
  // owner's ruling, and a state-C entry is there precisely because the owner
  // rejected an image that QC had passed. Skipping on the QC verdict there
  // would silently cancel the retry the owner asked for (V4 §7).
  if (!wl.source) {
    const qc = path.join(PIPE, w.product, w.option, 'qc.json');
    if (fs.existsSync(qc)) {
      try {
        const v = JSON.parse(fs.readFileSync(qc, 'utf8')).verdict;
        if (v === 'PASS' || v === 'PASS_WAIVED') continue;
      } catch { /* fall through and re-prepare */ }
    }
  }
  const orientation = orientationFor(w);
  try {
    // --section is required, not optional: 382 options share an option id with
    // a DIFFERENT option inside the same product (`stitch-01-top` names a
    // collar, a placket and a cuff option). Without it extract_spec refuses,
    // and refusing is correct — guessing would write one option's geometry
    // into another's spec. See tools/shared_image_check.mjs for what that
    // collision already cost: a trouser coin pocket sold as a jacket's.
    run(path.join(SKILL_TP, 'extract_spec.mjs'),
      [`--product=${w.product}`, `--section=${w.section}`, `--option=${w.option}`, `--orientation=${orientation}`, '--write']);
    // `--write` as well as `--json`, for two reasons.
    //
    // 1. It PERSISTS prompt.json. Without it the prompt exists only inside this
    //    process and inside batch-payload.json, which the next batch overwrites.
    //    That is why 29 of the 41 candidates queued for owner review had no
    //    recoverable prompt at all: V4 §11.7 requires the review screen to show
    //    the prompt an image was made from, and it had been thrown away.
    // 2. It makes the two outputs AGREE. build_prompt applies the spec-only
    //    language transform (BLUEPRINT LOCK -> SPECIFICATION LOCK, "as drawn" ->
    //    "as specified") inside the `--write` branch, which runs before the
    //    `--json` branch and mutates the same object. Calling with `--json`
    //    alone returns the untransformed text, so the payload and the saved file
    //    would differ for exactly the crafts where the difference matters most.
    const built = JSON.parse(run(path.join(SKILL_GD, 'build_prompt.mjs'),
      [`--product=${w.product}`, `--option=${w.option}`, '--json', '--write', ...(COMPACT ? ['--compact'] : [])]));
    // The pre-flight gate decides, not this script.
    run(path.join(SKILL_GD, 'validate_prompt.mjs'), [`--product=${w.product}`, `--option=${w.option}`]);
    if (!built.illustrationDisk || !fs.existsSync(built.illustrationDisk)) {
      dropped.push({ ...w, reason: 'blueprint not on disk' }); continue;
    }
    prepared.push({
      index: prepared.length,
      identity: w.identity, product: w.product, option: w.option, field: w.field,
      label: w.label, part: w.part, orientation,
      rows: w.rows,
      illustrationDisk: built.illustrationDisk,
      filename: path.basename(built.illustrationDisk),
      // Encode each path segment: several blueprint filenames contain spaces
      // and parentheses, and an unencoded URL would 404 silently.
      publicUrl: PUBLIC_ORIGIN + String(w.illustration).split('/').map(encodeURIComponent).join('/').replace(/^%2F/, '/'),
      /**
       * The owner's own reference photographs, as PUBLIC URLs ready to import.
       *
       * These were missing, and it was the most expensive gap in the pipeline.
       * When an owner rejects an image they can upload photographs of what the
       * option should actually look like, and build_prompt then writes into the
       * prompt: "Those photographs are attached and OUTRANK the supplier line
       * drawing wherever the two disagree." Measured 2026-08-27: 25 of 190
       * staged prompts said exactly that, 41 photographs existed on disk and all
       * returned 200 from the origin - and not one was ever attached, because
       * the payload never carried them and the submitter had nothing to send.
       *
       * So the model was told to defer to evidence it could not see, on the very
       * crafts the owner had already rejected once. Two of them (ext-straight,
       * fly-button) went through wave-03 that way; ext-straight's recorded
       * rejection reason is "Unrealistic / AI look", which is precisely what a
       * real photograph fixes.
       *
       * A submitter must import each of these and pass them in medias[] next to
       * the illustration. If it cannot, the prompt must not claim them.
       */
      ownerReferenceUrls: ownerReferenceUrlsFor(w.product, w.option),
      prompt: built.prompt,
      requiredTokens: built.requiredTokens,
      checklist: built.checklist,
    });
  } catch (e) {
    const msg = String(e.stdout || e.message || e).split('\n').filter(Boolean).slice(-3).join(' | ');
    dropped.push({ ...w, reason: msg.slice(0, 300) });
  }
}

// -- reachability gate ----------------------------------------------------
// A prepared entry whose blueprint cannot be FETCHED is not generation-ready,
// however good its prompt is. Drop it, name it, and let the deploy fix it.
let reachable = 0;
const unreachable = [];
if (!NO_VERIFY && prepared.length) {
  const urls = [...new Set(prepared.map((x) => x.publicUrl).filter(Boolean))];
  const status = new Map();
  const queue = [...urls];
  const worker = async () => {
    for (;;) {
      const u = queue.shift();
      if (!u) return;
      try { const r = await fetch(u, { method: 'HEAD' }); status.set(u, r.ok ? 200 : r.status); }
      catch (e) { status.set(u, String(e.message ?? e).slice(0, 60)); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(8, urls.length) }, worker));
  for (let k = prepared.length - 1; k >= 0; k -= 1) {
    const st = status.get(prepared[k].publicUrl);
    if (st === 200) { reachable += 1; continue; }
    unreachable.push({ product: prepared[k].product, option: prepared[k].option, publicUrl: prepared[k].publicUrl, status: st });
    dropped.push({ product: prepared[k].product, option: prepared[k].option, reason: `blueprint URL not reachable (${st}) - needs a deploy`, publicUrl: prepared[k].publicUrl });
    prepared.splice(k, 1);
  }
  prepared.forEach((x, n) => { x.index = n; });
}

fs.writeFileSync(OUT, JSON.stringify({
  generatedAt: new Date().toISOString(), from: FROM, nextFrom: i,
  blueprintUrlsVerified: !NO_VERIFY, blueprintsReachable: reachable, blueprintsUnreachable: unreachable.length,
  prepared: prepared.length, dropped: dropped.length, items: prepared, droppedItems: dropped,
}, null, 2) + '\n', 'utf8');

console.log(`prepared : ${prepared.length}`);
console.log(`dropped  : ${dropped.length}`);
for (const d of dropped.slice(0, 6)) console.log(`   DROP ${d.product}/${d.option} — ${d.reason}`);
if (unreachable.length) {
  console.log(`BLUEPRINT URLS NOT REACHABLE : ${unreachable.length} - those crafts were DROPPED.`);
  console.log('They exist in the repo but not on the origin. Deploy, then re-run this.');
  for (const u of unreachable.slice(0, 8)) console.log(`   ${u.product}/${u.option}  ${u.publicUrl}`);
  if (unreachable.length > 8) console.log(`   ... and ${unreachable.length - 8} more`);
}
console.log(`nextFrom : ${i}`);
for (const p of prepared) console.log(`   [${p.index}] ${p.product}/${p.option}  ${JSON.stringify(p.label)}  (${p.rows.length} rows)`);
