#!/usr/bin/env node
// Build the owner image-review queue.
//
// Owner decision (2026-08-02): from here on every remaining craft option gets
// ONE generation, and the owner approves or rejects it rather than the pipeline
// self-approving. This scans .craft-pipeline for candidates that have not yet
// been decided, copies each candidate and its supplier drawing into
// public/images/review/ (the .craft-pipeline tree is outside Next's static
// root, so the browser cannot load it directly), and writes the queue.
//
// Decisions live in data-store/image-review-decisions.json and are written by
// the admin UI. This tool never touches them - it only reports which options
// still need one.
//
//   node tools/build_review_queue.mjs            # report
//   node tools/build_review_queue.mjs --write    # copy assets + write queue

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const require = createRequire(path.join(ROOT, 'package.json'));
const sharp = require('sharp');

const PIPE = path.join(ROOT, '.craft-pipeline');
const REVIEW_DIR = path.join(ROOT, 'public', 'images', 'review');
const QUEUE_FILE = path.join(ROOT, 'data-store', 'image-review-queue.json');
const DECISIONS_FILE = path.join(ROOT, 'data-store', 'image-review-decisions.json');

const WRITE = process.argv.includes('--write');

function readJson(p, fallback = null) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

const decisions = readJson(DECISIONS_FILE, {}) || {};

// ── collect candidates ──────────────────────────────────────────────────────
const rows = [];
if (!fs.existsSync(PIPE)) {
  console.error('no .craft-pipeline directory');
  process.exit(1);
}

for (const product of fs.readdirSync(PIPE)) {
  const pdir = path.join(PIPE, product);
  if (!fs.statSync(pdir).isDirectory()) continue;
  for (const option of fs.readdirSync(pdir)) {
    if (option.startsWith('_')) continue;
    const odir = path.join(pdir, option);
    if (!fs.existsSync(odir) || !fs.statSync(odir).isDirectory()) continue;

    const cands = fs.readdirSync(odir)
      .filter((f) => /^candidate-\d+\.png$/i.test(f))
      .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));
    if (!cands.length) continue;

    const latest = cands[cands.length - 1];
    const attempt = +latest.match(/\d+/)[0];
    const key = `${product}/${option}`;

    // Already decided at this attempt? Skip. A newer attempt reopens it.
    const d = decisions[key];
    if (d && d.attempt >= attempt) continue;

    const spec = readJson(path.join(odir, 'spec.json'), {}) || {};
    const prompt = readJson(path.join(odir, 'prompt.json'), {}) || {};
    const gen = readJson(path.join(odir, 'generation.json'), {}) || {};
    const qc = readJson(path.join(odir, 'qc.json'), null);

    // What the pipeline itself concluded, so the owner can see whether they are
    // confirming a ship or looking at something the pipeline already rejected.
    // The owner's verdict overrides this either way.
    const qcVerdict = qc
      ? (qc.verdict || (Array.isArray(qc.attempts) && qc.attempts.length
          ? qc.attempts[qc.attempts.length - 1].verdict : null))
      : null;
    const pipelineStatus = !qcVerdict ? 'ungraded'
      : /^PASS/.test(qcVerdict) ? 'shipped'
      : 'pipeline-rejected';

    const illDisk = spec.illustration && spec.illustration.disk;
    const illPath = spec.illustration && spec.illustration.path;

    rows.push({
      key,
      product,
      option,
      attempt,
      addr: spec.addr || key,
      label: (spec.profile && spec.profile.option) || spec.label || option,
      field: (spec.profile && spec.profile.field) || spec.fieldLabel || '',
      part: spec.part || '',
      orientation: spec.orientation || '',
      description: (spec.profile && spec.profile.distinguishingDetail) || '',
      candidateDisk: path.join(odir, latest),
      drawingDisk: illDisk && fs.existsSync(illDisk) ? illDisk : null,
      drawingOriginalPath: illPath || null,
      promptText: typeof prompt.prompt === 'string' ? prompt.prompt : '',
      // The owner's own rejection history for this craft, so the review screen
      // can say "this is the retry of the one you rejected, and here is why
      // you rejected it" instead of presenting a replacement as a stranger.
      rejectionHistory: (prompt.ownerCorrections || []).map((c) => ({
        attemptRejected: c.attemptRejected, decidedAt: c.decidedAt,
        tags: c.tags || [], notes: c.notes || '', references: c.references || [],
      })),
      isReplacementForRejected: (prompt.ownerCorrections || []).length > 0,
      jobId: gen.jobId || (gen.attempts && gen.attempts.length
        ? gen.attempts[gen.attempts.length - 1].jobId : null),
      checklist: spec.checklist || [],
      qcVerdict,
      pipelineStatus,
      mtime: fs.statSync(path.join(odir, latest)).mtimeMs,
    });
  }
}

// Freshest work first: a retry the owner has never seen matters more than a
// months-old image that already shipped. Within a bucket, newest candidate first.
const BUCKET = { ungraded: 0, 'pipeline-rejected': 1, shipped: 2 };
rows.sort((a, b) =>
  (BUCKET[a.pipelineStatus] - BUCKET[b.pipelineStatus]) ||
  (b.attempt - a.attempt) ||
  (b.mtime - a.mtime) ||
  a.key.localeCompare(b.key));

console.log(`candidates awaiting an owner decision: ${rows.length}`);
const byProduct = {};
const byStatus = {};
for (const r of rows) {
  byProduct[r.product] = (byProduct[r.product] || 0) + 1;
  byStatus[r.pipelineStatus] = (byStatus[r.pipelineStatus] || 0) + 1;
}
console.log('  by product:', JSON.stringify(byProduct));
console.log('  by pipeline status:', JSON.stringify(byStatus));
console.log(`  already decided by owner: ${Object.keys(decisions).length}`);

if (!WRITE) {
  console.log('\n(dry run - pass --write to copy assets and write the queue)');
  process.exit(0);
}

// ── copy assets into public/images/review ───────────────────────────────────
fs.mkdirSync(REVIEW_DIR, { recursive: true });

const out = [];
for (const r of rows) {
  const base = `${r.product}__${r.option}__a${r.attempt}`;
  const candName = `${base}.webp`;
  const candOut = path.join(REVIEW_DIR, candName);
  if (!fs.existsSync(candOut)) {
    await sharp(r.candidateDisk).webp({ quality: 88 }).toFile(candOut);
  }

  let drawName = null;
  if (r.drawingDisk) {
    drawName = `${base}__drawing.webp`;
    const drawOut = path.join(REVIEW_DIR, drawName);
    if (!fs.existsSync(drawOut)) {
      await sharp(r.drawingDisk).webp({ quality: 88 }).toFile(drawOut);
    }
  }

  out.push({
    key: r.key,
    product: r.product,
    option: r.option,
    attempt: r.attempt,
    addr: r.addr,
    label: r.label,
    field: r.field,
    part: r.part,
    orientation: r.orientation,
    description: r.description,
    checklist: r.checklist,
    jobId: r.jobId,
    qcVerdict: r.qcVerdict,
    pipelineStatus: r.pipelineStatus,
    candidateUrl: `/images/review/${candName}`,
    drawingUrl: drawName ? `/images/review/${drawName}` : null,
    drawingOriginalPath: r.drawingOriginalPath,
    promptText: r.promptText,
    rejectionHistory: r.rejectionHistory,
    isReplacementForRejected: r.isReplacementForRejected,
  });
}

fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
fs.writeFileSync(QUEUE_FILE, JSON.stringify({
  generatedAt: new Date().toISOString(),
  count: out.length,
  items: out,
}, null, 1));

console.log(`\nwrote ${QUEUE_FILE}`);
console.log(`copied ${out.length} candidate(s) + drawings into public/images/review/`);
console.log('review at: http://localhost:3000/admin/image-review');
