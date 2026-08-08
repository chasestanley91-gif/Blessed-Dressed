#!/usr/bin/env node
/**
 * run_generation.mjs — the unattended generation runner.
 *
 * WHY THIS EXISTS
 * ---------------
 * Generating through the assistant costs roughly 5,000 characters of relayed
 * prompt per image, which caps a working session at about a dozen photographs.
 * The work itself is not the constraint — the relay is. With a Higgsfield API
 * key this script does the whole loop locally and the cap disappears.
 *
 * WHAT IT DOES NOT DO
 * -------------------
 * It does not approve anything. Quality control needs eyes on the pixels, and
 * the whole project standard is that a faithful render of a WRONG reference
 * scores higher, not lower. This script generates and records; a human or the
 * assistant still grades each candidate and runs log_qc_result.mjs.
 *
 * SETUP
 *   1. Create an account at https://cloud.higgsfield.ai
 *   2. Generate API credentials in the dashboard (a KEY and a SECRET)
 *   3. Set them in this shell:
 *        export HIGGSFIELD_API_KEY=...
 *        export HIGGSFIELD_API_SECRET=...
 *
 * USAGE — always probe first
 *   node tools/run_generation.mjs --probe
 *       Submits ONE generation and prints the raw response. Confirms the
 *       endpoint, the reference-image field and the result shape against the
 *       live API before 200+ images are attempted on an assumption.
 *
 *   node tools/run_generation.mjs --limit=10 --apply
 *   node tools/run_generation.mjs --apply            # the whole work list
 *
 * The reference-image field is NOT documented publicly. Rather than guess it,
 * --probe tries the known candidates and reports which one the API accepts.
 * Guessing would mean generating from text alone, which invents geometry — the
 * single failure this pipeline exists to prevent.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PAYLOAD = path.join(REPO, 'public/images/reports/batch-payload.json');
const LEDGER = path.join(REPO, 'public/images/reports/run-generation-log.json');
const SKILL_GD = path.join(os.homedir(), '.claude/skills/garment-image-director/scripts');

const arg = (k, d) => { const h = process.argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const FLAG = (k) => process.argv.includes(`--${k}`);
const APPLY = FLAG('apply');
const PROBE = FLAG('probe');
const LIMIT = Number(arg('limit', 0));
const MODEL = arg('model', 'higgsfield-ai/soul/standard');
const BASE = arg('base', 'https://platform.higgsfield.ai');

const KEY = process.env.HIGGSFIELD_API_KEY;
const SECRET = process.env.HIGGSFIELD_API_SECRET;
if (!KEY || !SECRET) {
  console.error(
    'ERROR: HIGGSFIELD_API_KEY and HIGGSFIELD_API_SECRET are not set.\n' +
    '  Create them at https://cloud.higgsfield.ai (dashboard -> API credentials), then:\n' +
    '    export HIGGSFIELD_API_KEY=...\n' +
    '    export HIGGSFIELD_API_SECRET=...\n' +
    'Refusing to run: without a reference drawing attached this would generate from text alone.');
  process.exit(1);
}

const headers = {
  Authorization: `Key ${KEY}:${SECRET}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

/**
 * Candidate field names for the reference image.
 *
 * The blueprint is not optional decoration — it is the entire specification, so
 * a request that silently drops it must never be treated as success. --probe
 * establishes which of these the API honours, and everything afterwards uses
 * only the confirmed one.
 */
const REFERENCE_FIELDS = [
  (url) => ({ image_url: url }),
  (url) => ({ input_image: url }),
  (url) => ({ reference_image: url }),
  (url) => ({ image: url }),
  (url) => ({ images: [url] }),
  (url) => ({ input_images: [url] }),
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep raw */ }
  return { status: res.status, ok: res.ok, json, text };
}

async function getJson(url) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  try { return { status: res.status, json: JSON.parse(text) }; } catch { return { status: res.status, text }; }
}

/** Pull the first https URL that looks like a finished image out of any shape. */
function findResultUrl(obj, depth = 0) {
  if (!obj || depth > 6) return null;
  if (typeof obj === 'string') return /^https:\/\/.*\.(png|jpe?g|webp)(\?|$)/i.test(obj) ? obj : null;
  if (Array.isArray(obj)) { for (const v of obj) { const h = findResultUrl(v, depth + 1); if (h) return h; } return null; }
  if (typeof obj === 'object') {
    for (const k of ['result_url', 'output_url', 'url', 'image_url', 'output', 'result', 'results', 'data']) {
      if (k in obj) { const h = findResultUrl(obj[k], depth + 1); if (h) return h; }
    }
    for (const v of Object.values(obj)) { const h = findResultUrl(v, depth + 1); if (h) return h; }
  }
  return null;
}

function statusOf(obj) {
  const s = String(obj?.status ?? obj?.state ?? '').toLowerCase();
  if (/(^|_)(completed|succeeded|success|done|finished)/.test(s)) return 'done';
  if (/(fail|error|cancel|reject)/.test(s)) return 'failed';
  return 'pending';
}

const node = process.execPath;
const run = (script, args) => execFileSync(node, [script, ...args], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// ── load the prepared batch ────────────────────────────────────────────────
if (!fs.existsSync(PAYLOAD)) {
  console.error(`ERROR: ${path.relative(REPO, PAYLOAD)} not found. Run:\n` +
    '  node tools/validate_spec.mjs && node tools/build_generation_queue.mjs && node tools/prep_batch.mjs --n=50 --compact');
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(PAYLOAD, 'utf8'));
let items = payload.items ?? [];
if (!items.length) { console.error('ERROR: batch payload contains no prepared items.'); process.exit(1); }
if (LIMIT) items = items.slice(0, LIMIT);

// ── probe ──────────────────────────────────────────────────────────────────
if (PROBE) {
  const it = items[0];
  console.log(`PROBE — ${it.product}/${it.option} "${it.label}"`);
  console.log(`  model     : ${MODEL}`);
  console.log(`  blueprint : ${it.publicUrl}`);
  console.log('');
  for (const build of REFERENCE_FIELDS) {
    const ref = build(it.publicUrl);
    const field = Object.keys(ref)[0];
    const body = { prompt: it.prompt, aspect_ratio: '3:4', ...ref };
    process.stdout.write(`  trying reference field "${field}" ... `);
    const r = await post(`${BASE}/${MODEL}`, body);
    console.log(`HTTP ${r.status}`);
    if (r.ok) {
      console.log('\n  ACCEPTED. Raw response:\n');
      console.log(JSON.stringify(r.json ?? r.text, null, 2).slice(0, 4000));
      console.log(`\n  Use: --ref-field=${field}`);
      console.log('  Check your credit balance now and compare it against the web balance —');
      console.log('  it is not documented whether the API draws on the same pool.');
      process.exit(0);
    }
    console.log(`     ${String(r.text).slice(0, 200)}`);
  }
  console.error('\nNo reference-image field was accepted. Do NOT fall back to a text-only request: ' +
    'the drawing is the specification. Check the model id and the docs at https://docs.higgsfield.ai.');
  process.exit(1);
}

const REF_FIELD = arg('ref-field', null);
if (!REF_FIELD) {
  console.error('ERROR: --ref-field is required. Run `node tools/run_generation.mjs --probe` first to discover it.\n' +
    'Refusing to guess: a request that drops the blueprint generates from text alone.');
  process.exit(1);
}
if (!APPLY) {
  console.log(`Dry run — would generate ${items.length} image(s) with reference field "${REF_FIELD}".`);
  for (const it of items) console.log(`  ${it.product}/${it.option}  ${JSON.stringify(it.label)}`);
  console.log('\nRe-run with --apply to spend credits.');
  process.exit(0);
}

// ── run ────────────────────────────────────────────────────────────────────
const ledger = [];
let ok = 0, failed = 0;
for (const [i, it] of items.entries()) {
  const tag = `[${i + 1}/${items.length}] ${it.product}/${it.option}`;
  process.stdout.write(`${tag} ... `);
  const body = { prompt: it.prompt, aspect_ratio: '3:4', [REF_FIELD]: it.publicUrl };
  const sub = await post(`${BASE}/${MODEL}`, body);
  if (!sub.ok) {
    console.log(`SUBMIT FAILED (HTTP ${sub.status})`);
    ledger.push({ ...pick(it), error: `submit HTTP ${sub.status}: ${String(sub.text).slice(0, 300)}` });
    failed += 1;
    // A submit failure is usually systemic (auth, quota, bad model). Stop rather
    // than burn the rest of the list against the same broken call.
    if (failed >= 3) { console.error('\nABORTING: 3 submit failures. Fix the cause before continuing.'); break; }
    continue;
  }

  const jobId = sub.json?.id ?? sub.json?.job_id ?? sub.json?.request_id ?? null;
  let resultUrl = findResultUrl(sub.json);
  const pollUrl = sub.json?.status_url ?? sub.json?.url ?? (jobId ? `${BASE}/job/${jobId}` : null);

  for (let t = 0; !resultUrl && pollUrl && t < 60; t += 1) {
    await sleep(5000);
    const p = await getJson(pollUrl);
    const st = statusOf(p.json);
    if (st === 'failed') break;
    resultUrl = findResultUrl(p.json);
  }

  if (!resultUrl) {
    console.log('NO RESULT URL');
    ledger.push({ ...pick(it), jobId, error: 'no result url after polling' });
    failed += 1;
    continue;
  }

  // Record IMMEDIATELY. The credit is spent at submit, but the artifact only
  // becomes durable here; an interruption in between destroys paid work.
  try {
    run(path.join(SKILL_GD, 'record_generation.mjs'), [
      `--product=${it.product}`, `--option=${it.option}`,
      `--model=${MODEL}`, `--job-id=${jobId ?? 'unknown'}`, `--result-url=${resultUrl}`,
    ]);
    console.log('recorded');
    ledger.push({ ...pick(it), jobId, resultUrl });
    ok += 1;
  } catch (e) {
    console.log('RECORD FAILED');
    ledger.push({ ...pick(it), jobId, resultUrl, error: `record failed: ${String(e.message).slice(0, 300)}` });
    failed += 1;
  }
}

function pick(it) {
  return { identity: it.identity, product: it.product, option: it.option, label: it.label, blueprint: it.publicUrl };
}

fs.writeFileSync(LEDGER, JSON.stringify({ generatedAt: new Date().toISOString(), model: MODEL, ok, failed, ledger }, null, 2) + '\n', 'utf8');
console.log(`\ngenerated ${ok}, failed ${failed}`);
console.log(`-> ${path.relative(REPO, LEDGER).split(path.sep).join('/')}`);
console.log('\nNOTHING IS APPROVED YET. Every candidate still needs grading:');
console.log('  crop the feature, enlarge 3-4x, count it, then run log_qc_result.mjs');
process.exit(failed ? 1 : 0);
