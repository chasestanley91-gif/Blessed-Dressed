#!/usr/bin/env node
// compare_prep.mjs — gather everything needed for the agent's visual
// comparison in one call: the illustration path, the latest generated
// candidate path, the per-option checklist, and the score-card categories.
// Doesn't do the comparison itself (that needs vision — Read both images)
// but removes any need to hand-assemble paths from three separate JSON files
// written by the other two skills in the pipeline.
//
// Usage:
//   node compare_prep.mjs --product=shirt --option=<id>
//   node compare_prep.mjs --product=shirt --option=<id> --attempt=2   # a specific attempt

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, resolveRepoRoot, pipelineDir, readJson } from './lib/util.mjs';

const args = parseArgs();
for (const req of ['product', 'option']) {
  if (!args[req]) {
    console.error(`ERROR: --${req} is required.`);
    process.exit(1);
  }
}

const root = args.root || resolveRepoRoot();
const dir = pipelineDir(root, args.product, args.option);

const specPath = path.join(dir, 'spec.json');
const promptPath = path.join(dir, 'prompt.json');
const genPath = path.join(dir, 'generation.json');

const REQUIRED = [
  ['spec.json', specPath, 'Run tech-pack-interpreter first.'],
  ['prompt.json', promptPath, "Run garment-image-director's build_prompt.mjs --write first."],
  ['generation.json', genPath, "Run garment-image-director's record_generation.mjs first."],
];
for (const [label, p, hint] of REQUIRED) {
  if (!fs.existsSync(p)) {
    console.error(`ERROR: ${label} not found at ${p}.`);
    console.error(hint);
    process.exit(1);
  }
}

const spec = readJson(specPath);
const built = readJson(promptPath);
const gen = readJson(genPath);

// BLUEPRINT PROVENANCE GATE — refuse to set up a comparison against anything
// that is not a real manufacturing drawing.
//
// tech-pack-interpreter's resolveBlueprint() already blocks these at spec-write
// time, but a spec.json written BEFORE that guard existed (or before a catalog
// re-point) still carries the old path on disk, and this script would happily
// hand it to the agent as "the illustration". That is exactly how two
// candidates scored 98+ in all nine categories against an AI photograph.
//
// This gate is deliberately duplicated rather than trusted from upstream: the
// QC gate scores fidelity TO WHATEVER REFERENCE IT IS SHOWN, so a wrong
// reference cannot be caught by any score, any rubric, or any amount of care
// by the grader. It has to be refused before the comparison starts.
const badBlueprint = (s) =>
  typeof s !== 'string' ||
  !s ||
  /(^|\/)images\/(generated|ai)\//i.test(s) ||
  /\.svg(\?|#|$)/i.test(s);

if (badBlueprint(spec.illustration && spec.illustration.path)) {
  const p = (spec.illustration && spec.illustration.path) || '(none)';
  console.error(`ERROR: refusing to QC "${spec.addr}" — its blueprint is not a manufacturing drawing.`);
  console.error(`  spec.illustration.path = ${p}`);
  console.error('');
  console.error('  A verdict against this reference would be meaningless: QC scores fidelity to');
  console.error('  the reference, so a wrong reference scores HIGHER the more faithful the render.');
  console.error('');
  console.error('  Fix upstream, then re-run:');
  console.error(`    node <tech-pack-interpreter>/scripts/extract_spec.mjs --product=${args.product} --option=${args.option}`);
  console.error('  If that also reports [NONE], the option genuinely has no supplier drawing and');
  console.error('  belongs in needs-source — do not generate or QC it.');
  process.exit(1);
}

let candidatePath = gen.candidatePath;
if (args.attempt && Number(args.attempt) !== gen.attempt) {
  const altPath = path.join(dir, `candidate-${args.attempt}${path.extname(gen.candidatePath)}`);
  if (fs.existsSync(altPath)) candidatePath = altPath;
  else console.error(`WARN: no candidate found for attempt ${args.attempt}; using latest (attempt ${gen.attempt}).`);
}

const out = {
  addr: spec.addr,
  productId: spec.productId,
  optionId: spec.optionId,
  sourceFile: spec.sourceFile,
  part: spec.part,
  label: spec.label,
  orientation: spec.view.orientation,
  absence: spec.absence,
  illustration: {
    path: spec.illustration.path,
    disk: spec.illustration.disk,
    remote: spec.illustration.remote,
  },
  candidatePath,
  attempt: gen.attempt,
  forbidden: spec.forbidden,
  checklist: built.checklist,
  scoreCard: built.scoreCard,
  profile: built.profile,
};

console.log(JSON.stringify(out, null, 2));
