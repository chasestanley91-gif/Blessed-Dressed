#!/usr/bin/env node
// record_generation.mjs — download a Higgsfield generation result and persist
// generation.json into the pipeline cache. This is the hand-off artifact
// garment-image-qc reads: it never has to re-derive which file is the
// candidate for which attempt.
//
// Usage:
//   node record_generation.mjs --product=shirt --option=<id> \
//     --model=<model id> --job-id=<id> --result-url="<https url>"
//   node record_generation.mjs ... --attempt=2   # override auto-increment
//
// Auto-increments the attempt number from any prior qc.json in the same
// pipeline folder (attempt N's rejection → this call defaults to N+1).
// Prints the downloaded candidate path — Read that next to the illustration.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, resolveRepoRoot, pipelineDir, writeJson, readJson } from './lib/util.mjs';

const args = parseArgs();
for (const req of ['product', 'option', 'result-url']) {
  if (!args[req]) {
    console.error(`ERROR: --${req} is required.`);
    process.exit(1);
  }
}

const root = args.root || resolveRepoRoot();
const dir = pipelineDir(root, args.product, args.option);
fs.mkdirSync(dir, { recursive: true });

// The attempt number decides the candidate FILENAME, so getting it wrong
// destroys paid work.
//
// This used to derive solely from qc.json: attempt N's recorded rejection made
// the next call N+1. That silently couples "I recorded a verdict" to "my next
// generation is safe" — and when a second image was generated before the first
// was graded, it overwrote candidate-1 with no warning. Measured 2026-08-07 on
// suit-2pc/lbp-3l-2r: attempt 2 replaced attempt 1's file, and the only reason
// nothing was lost is that the result URL was still in the transcript.
//
// The filesystem is the authority now. Whatever qc.json says, never write over
// a candidate that already exists.
let attempt = Number(args.attempt);
if (!attempt) {
  const qcPath = path.join(dir, 'qc.json');
  attempt = fs.existsSync(qcPath) ? (Number(readJson(qcPath).attempt) || 0) + 1 : 1;
}
const takenAttempt = (n) =>
  ['.png', '.jpg', '.jpeg', '.webp'].some((e) => fs.existsSync(path.join(dir, `candidate-${n}${e}`)));
if (!args.attempt) {
  while (takenAttempt(attempt)) attempt += 1;
} else if (takenAttempt(attempt)) {
  console.error(
    `ERROR: candidate-${attempt} already exists in ${dir}. Refusing to overwrite a generation that has already been paid for. ` +
    `Pass a free --attempt=N, or delete the existing candidate deliberately.`
  );
  process.exit(1);
}

const res = await fetch(args['result-url']);
if (!res.ok) {
  console.error(`ERROR: could not fetch result URL (HTTP ${res.status}): ${args['result-url']}`);
  process.exit(1);
}
const contentType = res.headers.get('content-type') || '';
const EXT_BY_TYPE = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const ext = EXT_BY_TYPE[contentType.split(';')[0].trim()] || path.extname(new URL(args['result-url']).pathname) || '.jpg';
const buf = Buffer.from(await res.arrayBuffer());
const candidatePath = path.join(dir, `candidate-${attempt}${ext}`);
fs.writeFileSync(candidatePath, buf);

const record = {
  addr: `${args.product} > ${args.option}`,
  productId: args.product,
  optionId: args.option,
  attempt,
  model: args.model || null,
  jobId: args['job-id'] || null,
  resultUrl: args['result-url'],
  candidatePath,
  bytes: buf.length,
  generatedAt: new Date().toISOString(),
};
const file = writeJson(path.join(dir, 'generation.json'), record);
console.log(`Wrote ${file}`);
console.log(`Candidate image: ${candidatePath}`);
console.log(JSON.stringify(record, null, 2));
