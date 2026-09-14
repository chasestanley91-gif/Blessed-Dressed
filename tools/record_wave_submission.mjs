#!/usr/bin/env node
/**
 * record_wave_submission.mjs — write the wave job ledger at SUBMIT time,
 * including the exact prompt each image was generated from.
 *
 * WHY
 * ---
 * Two separate lessons, both paid for:
 *
 * 1. The credit is spent at generate_image; the job id is the only handle on it.
 *    Recording ids BEFORE waiting means a crash between submit and download
 *    loses nothing.
 * 2. V4 §11.7 requires the review screen to show the generation prompt. A wave
 *    driven through prep_batch builds its prompt in MEMORY and never writes
 *    prompt.json, so unless the prompt is captured here it is gone: measured on
 *    wave-02, 29 of 41 queued candidates had no recoverable prompt, and the
 *    other 12 could only offer a prompt.json rebuilt later that may differ from
 *    the one that actually made the picture.
 *
 * Reads the prepared batch (public/images/reports/batch-payload.json) and a
 * submission file mapping index -> job_id, and writes/extends
 * public/images/reports/<wave>-jobs.json.
 *
 * USAGE
 *   node tools/record_wave_submission.mjs --wave=wave-03 --jobs=<path.json>
 *
 * where jobs.json is [{ "index": 0, "job_id": "..." }, ...] exactly as the
 * batch generator returns it.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PAYLOAD = path.join(REPO, 'public/images/reports/batch-payload.json');

const arg = (k, d) => { const h = process.argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const WAVE = arg('wave', '');
const JOBS = arg('jobs', '');
if (!WAVE || !JOBS) { console.error('ERROR: --wave=<wave-NN> and --jobs=<path.json> are both required.'); process.exit(1); }

const payload = JSON.parse(fs.readFileSync(PAYLOAD, 'utf8'));
const jobs = JSON.parse(fs.readFileSync(path.isAbsolute(JOBS) ? JOBS : path.join(REPO, JOBS), 'utf8'));
const ledgerPath = path.join(REPO, 'public/images/reports', `${WAVE}-jobs.json`);
const ledger = fs.existsSync(ledgerPath)
  ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))
  : { wave: WAVE, model: payload.model ?? 'gpt_image_2', modelParams: payload.modelParams ?? null, submitted: [] };

let added = 0, skipped = 0, missing = 0;
for (const j of jobs) {
  const it = payload.items[j.index];
  if (!it || it.index !== j.index) { missing += 1; continue; }
  if (ledger.submitted.some((s) => s.job_id === j.job_id)) { skipped += 1; continue; }
  ledger.submitted.push({
    index: j.index,
    job_id: j.job_id,
    product: it.product,
    option: it.option,
    label: it.label,
    rows: it.rows,
    mediaId: it.mediaId,
    ownerReferenceMedia: it.ownerReferenceMedia ?? [],
    illustration: it.publicUrl,
    // The whole point of this tool.
    promptUsed: it.prompt,
    requiredTokens: it.requiredTokens ?? [],
    checklist: it.checklist ?? [],
    submittedAt: new Date().toISOString(),
  });
  added += 1;
}
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n', 'utf8');

const withPrompt = ledger.submitted.filter((s) => typeof s.promptUsed === 'string' && s.promptUsed.length > 0).length;
console.log(`recorded    : ${added} new, ${skipped} already present, ${missing} not found in the batch payload`);
console.log(`ledger total: ${ledger.submitted.length} submitted, ${withPrompt} carrying the prompt they were generated from`);
console.log(`-> ${path.relative(REPO, ledgerPath).split(path.sep).join('/')}`);
