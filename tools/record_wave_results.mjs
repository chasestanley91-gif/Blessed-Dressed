#!/usr/bin/env node
/**
 * record_wave_results.mjs — turn finished wave jobs into durable artifacts.
 *
 * THE HAZARD THIS CLOSES
 * ----------------------
 * The credit is spent the moment the image is generated; the artifact only
 * becomes durable when it is on disk. Between those two moments the work exists
 * only as a URL in a transcript. This project has already lost a paid candidate
 * that way (2026-08-07, suit-2pc/lbp-3l-2r). So: download FIRST, grade later.
 *
 * Reads the wave job ledger (public/images/reports/wave-NN-jobs.json), takes a
 * results file mapping index -> {job_id, result_url}, downloads each image into
 * `.craft-pipeline/<product>/<option>/candidate-<attempt>.png` and writes
 * generation.json beside it — the hand-off artifact garment-image-qc reads.
 *
 * Never overwrites an existing candidate file: the attempt number is derived
 * from what is already on disk, whatever any qc.json claims.
 *
 * USAGE
 *   node tools/record_wave_results.mjs --wave=wave-02 --results=<path.json>
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PIPE = path.join(REPO, '.craft-pipeline');

const arg = (k, d) => { const h = process.argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const WAVE = arg('wave', 'wave-02');
const RESULTS = arg('results', '');
if (!RESULTS) { console.error('ERROR: --results=<path to json array of {index, job_id, result_url}> is required.'); process.exit(1); }

const jobsPath = path.join(REPO, 'public/images/reports', `${WAVE}-jobs.json`);
const ledger = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
const byIndex = new Map(ledger.submitted.map((s) => [s.index, s]));
const results = JSON.parse(fs.readFileSync(path.isAbsolute(RESULTS) ? RESULTS : path.join(REPO, RESULTS), 'utf8'));

/** Next free attempt number — the filesystem is the authority, not qc.json. */
function nextAttempt(dir) {
  let n = 1;
  while (fs.existsSync(path.join(dir, `candidate-${n}.png`))) n += 1;
  return n;
}

const done = [];
const failed = [];

for (const r of results) {
  const meta = byIndex.get(r.index);
  if (!meta) { failed.push({ ...r, error: 'index not in the wave job ledger' }); continue; }
  if (meta.job_id !== r.job_id) { failed.push({ ...r, error: `job id mismatch for index ${r.index}` }); continue; }
  const dir = path.join(PIPE, meta.product, meta.option);
  fs.mkdirSync(dir, { recursive: true });
  const attempt = nextAttempt(dir);
  const candidate = path.join(dir, `candidate-${attempt}.png`);
  try {
    const res = await fetch(r.result_url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024) throw new Error(`suspiciously small payload (${buf.length} bytes)`);
    fs.writeFileSync(candidate, buf);
    const generation = {
      addr: `${meta.product} > ${meta.option}`,
      productId: meta.product,
      optionId: meta.option,
      label: meta.label,
      rows: meta.rows,
      wave: WAVE,
      attempt,
      model: ledger.model ?? 'gpt_image_2',
      jobId: r.job_id,
      referenceMediaId: meta.mediaId,
      referenceIllustration: meta.illustration,
      resultUrl: r.result_url,
      // The EXACT prompt this image was made from. V4 s11.7 requires the review
      // screen to show it, and a wave driven through prep_batch builds the
      // prompt in memory and never writes prompt.json - so without capturing it
      // here the owner is shown a DIFFERENT prompt than the one that made the
      // picture, or none at all. Measured: 29 of 41 queued candidates had no
      // recoverable prompt.
      promptUsed: meta.promptUsed ?? null,
      candidatePath: candidate,
      bytes: buf.length,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(dir, 'generation.json'), JSON.stringify(generation, null, 2) + '\n', 'utf8');
    done.push({ index: r.index, craft: `${meta.product}/${meta.option}`, attempt, bytes: buf.length });
  } catch (e) {
    // Never regenerate on a download failure — the credit is already spent and
    // the URL is the only handle on it. Report it so it can be retried.
    failed.push({ index: r.index, craft: `${meta.product}/${meta.option}`, job_id: r.job_id, result_url: r.result_url, error: String(e.message ?? e) });
  }
}

ledger.recorded = [...(ledger.recorded ?? []), ...done];
ledger.recordFailures = [...(ledger.recordFailures ?? []), ...failed];
fs.writeFileSync(jobsPath, JSON.stringify(ledger, null, 2) + '\n', 'utf8');

for (const d of done) console.log(`  ok   [${String(d.index).padStart(2)}] ${d.craft}  candidate-${d.attempt}.png  ${(d.bytes / 1024).toFixed(0)} KB`);
for (const f of failed) console.log(`  FAIL [${String(f.index).padStart(2)}] ${f.craft ?? '?'} — ${f.error}\n         ${f.result_url ?? ''}`);
console.log(`\nrecorded ${done.length} / ${results.length}   failures ${failed.length}`);
process.exit(failed.length ? 1 : 0);
