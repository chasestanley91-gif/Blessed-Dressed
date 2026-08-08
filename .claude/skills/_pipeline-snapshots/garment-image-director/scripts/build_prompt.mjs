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
const built = buildPrompt(spec, { compact: Boolean(args.compact) });

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
  // SPEC-ONLY transform (owner ruling 2026-08-01): when the spec was written with
  // --spec-only there is NO attached illustration — the drafting specification is
  // the sole authority. Rewrite the lock language so the model is never told to
  // consult an attachment that does not exist.
  if (record.specOnly) {
    out.prompt = out.prompt
      .replace(/(reproduce exactly as drawn)/g, '(reproduce exactly as specified)')
      .replace(/BLUEPRINT LOCK[^]*?names that colour./,
        'SPECIFICATION LOCK — THE DRAFTING SPECIFICATION IS LAW: this option has no ' +
        'manufacturing drawing; the written specification above is the SOLE authority ' +
        'for the image. Reproduce every stated dimension, radius, angle, count and ' +
        'construction exactly as written. Assume NOTHING from tailoring/menswear/fashion ' +
        'convention or model priors beyond what the specification states; do not redesign, ' +
        'reinterpret, substitute a similar commercial style, stylise, or "improve" it. ' +
        'Do NOT fall back to a generic version of this category — reproduce THIS option ' +
        'as specified, not a typical one. Accuracy over aesthetics. Never render any ' +
        'measurement number, unit, arrow, callout, or text anywhere in the photograph.')
      .replace(/MANDATORY GEOMETRY COVERAGE — reproduce from the illustration, exactly and without assumption/,
        'MANDATORY GEOMETRY COVERAGE — reproduce from the specification, exactly and without assumption')
      .replace(/reproduced from the illustration:/g, 'reproduced from the specification:')
      .replace(/VIEW — this illustration is the ([a-z-]+) of the garment. Photograph the same face; never substitute a different face of the garment./,
        'VIEW — photograph the $1 of the garment; never substitute a different face of the garment.')
      .replace(/Match each to the drawing./, 'Match each to the specification.')
      .replace(/matching the illustration precisely/, 'matching the specification precisely');
    out.checklist = (out.checklist || []).map((c) =>
      c.replace(/reproduced from the illustration:/, 'reproduced from the specification:')
       .replace(/orientation matches the illustration:/, 'orientation matches the specification:')
       .replace(/match the illustration/, 'match the specification')
       .replace(/not the line-art/, 'not an illustration'));
  }
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
