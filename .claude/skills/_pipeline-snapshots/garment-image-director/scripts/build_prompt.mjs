#!/usr/bin/env node
// build_prompt.mjs — emit the locked photography prompt for one option, read
// from the spec.json tech-pack-interpreter already wrote. This script never
// recomputes a spec from raw catalog text — if spec.json doesn't exist yet,
// that's tech-pack-interpreter's job to produce first.
//
// Usage:
//   node build_prompt.mjs --spec=<path/to/spec.json>
//   node build_prompt.mjs --product=shirt --option=collar-small-square-50-btn   # auto-locate
//   node build_prompt.mjs --product=shirt --option=<id> --json
//   node build_prompt.mjs --product=shirt --option=<id> --write   # also persist prompt.json
//
// --json emits { addr, label, illustration, prompt, requiredTokens, checklist,
// scoreCard, profile } so the skill / a workflow can pipe straight into
// generate_image. --write additionally saves that object to
// .craft-pipeline/<productId>/<optionId>/prompt.json.

import { parseArgs, resolveRepoRoot, pipelineDir, readJson, writeJson } from './lib/util.mjs';
import { specFromRecord, buildPrompt } from './lib/prompt.mjs';
import fs from 'node:fs';

const args = parseArgs();

function locateSpecPath() {
  if (args.spec) return args.spec;
  if (!args.product || !args.option) {
    console.error('ERROR: pass --spec=<path/to/spec.json>, or both --product and --option to auto-locate it.');
    process.exit(1);
  }
  const root = args.root || resolveRepoRoot();
  return `${pipelineDir(root, args.product, args.option)}/spec.json`;
}

let specPath;
try {
  specPath = locateSpecPath();
} catch (e) {
  console.error('ERROR: ' + e.message);
  process.exit(1);
}

if (!fs.existsSync(specPath)) {
  console.error(`ERROR: no spec found at ${specPath}.`);
  console.error('Run tech-pack-interpreter first: node <tech-pack-interpreter>/scripts/extract_spec.mjs ' +
    `--product=${args.product || '<p>'} --option=${args.option || '<id>'} --orientation=<value> --write`);
  process.exit(1);
}

const record = readJson(specPath);
const spec = specFromRecord(record);
const built = buildPrompt(spec);

const out = {
  addr: spec.addr,
  label: spec.label,
  part: spec.part,
  orientation: spec.orientation,
  excluded: spec.excluded, // 'button'|'thread-color'|'fabric'|null — swatch, skip generation
  generate: spec.generate, // in scope for photo generation?
  sourceFile: spec.sourceFile, // write-back target the catalog builder reads
  source: spec.source,
  illustration: spec.illustration,
  illustrationDisk: spec.illustrationDisk,
  illustrationExists: spec.illustrationExists,
  illustrationRemote: spec.illustrationRemote, // true → pass URL directly to Higgsfield
  profile: built.profile, // the structured engineering profile (source of truth)
  requiredTokens: built.requiredTokens,
  checklist: built.checklist, // per-option verification targets — garment-image-qc walks these
  scoreCard: built.scoreCard, // categories to grade post-generation (min 98 each)
  prompt: built.prompt,
};

if (args.write) {
  const root = args.root || resolveRepoRoot();
  const dir = pipelineDir(root, spec.productId, spec.optionId);
  const file = writeJson(`${dir}/prompt.json`, { ...out, builtAt: new Date().toISOString() });
  console.error(`Wrote ${file}`);
}

if (args.json) {
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

const illuNote = out.illustrationExists
  ? '  (local, on disk → upload)'
  : out.illustrationRemote
    ? '  (remote URL → pass directly / download)'
    : '  ⚠ NO BLUEPRINT';
console.log('═'.repeat(72));
console.log(out.addr + '   [' + out.part + ']   view: ' + out.orientation);
if (out.excluded) console.log('⚠ EXCLUDED CATEGORY: ' + out.excluded + ' (swatch — out of scope, do not generate)');
console.log('illustration: ' + (out.illustration || '(none)') + illuNote);
console.log('required tokens: ' + (out.requiredTokens.join(' | ') || '(none parsed)'));
console.log('─'.repeat(72));
console.log(out.prompt);
console.log('\nVERIFY (garment-image-qc walks this against the generated output):');
for (const c of out.checklist) console.log('  ✓ ' + c);
console.log('');
