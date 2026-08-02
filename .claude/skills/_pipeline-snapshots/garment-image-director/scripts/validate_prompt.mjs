#!/usr/bin/env node
// validate_prompt.mjs — the pre-flight gate that runs BEFORE any credit is
// spent. It fails loudly unless the locked prompt is sound, so a malformed or
// geometry-dropping prompt can never reach the image model.
//
// Checks, for the selected option(s):
//   1. illustration path is set AND the file exists on disk (the blueprint),
//   2. the BLUEPRINT LOCK block is present in the prompt,
//   3. every extracted dimension, angle, shape and flag is echoed in the prompt
//      (nothing silently dropped between the spec and the prompt),
//   4. the NEGATIVE block is present,
//   5. the VIEW/orientation line is present.
//
// Usage:
//   node validate_prompt.mjs --spec=<path/to/spec.json>
//   node validate_prompt.mjs --product=shirt --option=<id>        # auto-locate spec.json
//   node validate_prompt.mjs --all --root=<repo>                  # every spec.json under .craft-pipeline
//   node validate_prompt.mjs --all --product=shirt --root=<repo>  # scoped to one product
//   echo '<prompt text>' | node validate_prompt.mjs --check-text --tokens="5.0 cm,square"
//
// Exit code 0 = all selected options pass; 1 = at least one failed.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, resolveRepoRoot, pipelineDir, readJson } from './lib/util.mjs';
import { specFromRecord, buildPrompt, isWaistbandFamily } from './lib/prompt.mjs';

const args = parseArgs();

function checkPrompt(prompt, requiredTokens, illu = {}, spec = null) {
  const fails = [];
  const warns = [];
  if (!prompt.includes('BLUEPRINT LOCK')) fails.push('missing BLUEPRINT LOCK block');
  if (!prompt.includes('Avoid:')) fails.push('missing NEGATIVE/Avoid block');
  if (!prompt.includes('VIEW —')) fails.push('missing VIEW/orientation line');
  const lower = prompt.toLowerCase();
  for (const tok of requiredTokens) {
    if (!lower.includes(String(tok).toLowerCase())) fails.push(`prompt does not echo required token: "${tok}"`);
  }
  // Waistband ENGINEERING-FAMILY gate: the differentiating component must be
  // locked as the primary craft, in a single fastened state, with the hardware
  // count/orientation pinned whenever the option carries hardware.
  if (spec && isWaistbandFamily(spec.part)) {
    if (!prompt.includes('PRIMARY CRAFT')) fails.push('waistband family: missing PRIMARY CRAFT block (craft not dominant)');
    if (!/fully fastened|laid open|unfastened and laid open/i.test(prompt)) fails.push('waistband family: missing SINGLE STATE (fastened, or open for extension-length)');
    const counts = spec.counts || [];
    const flags = (spec.flags || []).join(' ');
    const hasHardware = counts.some((c) => /-(hook|button|loop)$/.test(c)) || /buckle|hardware|closure|adjuster/.test(flags);
    if (hasHardware && !prompt.includes('HARDWARE LOCK')) fails.push('waistband family: hardware present but missing HARDWARE LOCK block');
  }
  // Blueprint reference must be usable by Higgsfield: either a local file on
  // disk (→ upload) or a remote https URL (→ passed directly / downloaded).
  // Only an absent blueprint, or a local path whose file is missing, is fatal.
  if (illu.checkIllustration) {
    if (!illu.web) {
      (illu.allowMissingIllu ? warns : fails).push('no illustration/blueprint for this option — cannot trace geometry');
    } else if (illu.remote) {
      warns.push('illustration is a remote URL — pass it directly to Higgsfield as the reference, or download it first if the fetch fails: ' + illu.web);
    } else if (!(illu.disk && fs.existsSync(illu.disk))) {
      (illu.allowMissingIllu ? warns : fails).push('local illustration path not found on disk: ' + illu.disk);
    }
  }
  return { fails, warns };
}

// Mode A: validate a raw prompt piped on stdin (used after manual edits).
if (args['check-text']) {
  const text = fs.readFileSync(0, 'utf8');
  const tokens = (args.tokens || '').split(',').map((s) => s.trim()).filter(Boolean);
  const { fails, warns } = checkPrompt(text, tokens, { checkIllustration: false });
  warns.forEach((w) => console.warn('WARN: ' + w));
  if (fails.length) {
    fails.forEach((f) => console.error('FAIL: ' + f));
    process.exit(1);
  }
  console.log('PASS: prompt contains the lock block, the negative block, and all ' + tokens.length + ' token(s).');
  process.exit(0);
}

// Mode B: validate one or more persisted spec.json files.
function collectSpecPaths() {
  if (args.spec) return [args.spec];
  const root = args.root || resolveRepoRoot();
  if (args.all) {
    const base = path.join(root, '.craft-pipeline');
    if (!fs.existsSync(base)) return [];
    const products = args.product ? [args.product] : fs.readdirSync(base);
    const out = [];
    for (const p of products) {
      const productDir = path.join(base, p);
      if (!fs.existsSync(productDir) || !fs.statSync(productDir).isDirectory()) continue;
      for (const optionId of fs.readdirSync(productDir)) {
        const specPath = path.join(productDir, optionId, 'spec.json');
        if (fs.existsSync(specPath)) out.push(specPath);
      }
    }
    return out;
  }
  if (args.product && args.option) {
    return [`${pipelineDir(root, args.product, args.option)}/spec.json`];
  }
  console.error('ERROR: pass --spec=<path>, --product+--option, or --all (optionally with --product) to scope a batch.');
  process.exit(1);
}

const specPaths = collectSpecPaths();
if (!specPaths.length) {
  console.error('No spec.json files matched. Run tech-pack-interpreter first.');
  process.exit(1);
}

let total = 0;
let failed = 0;
for (const specPath of specPaths) {
  if (!fs.existsSync(specPath)) {
    console.error(`FAIL: spec not found: ${specPath}`);
    failed++;
    continue;
  }
  const record = readJson(specPath);
  const spec = specFromRecord(record);
  if (spec.excluded && !args['include-excluded']) continue; // out-of-scope swatch
  total++;
  const built = buildPrompt(spec);
  const { fails, warns } = checkPrompt(built.prompt, built.requiredTokens, {
    checkIllustration: true,
    web: spec.illustration,
    disk: spec.illustrationDisk,
    remote: spec.illustrationRemote,
    // spec-only records (owner ruling 2026-08-01) are generable WITHOUT a
    // drawing by design — the missing blueprint is a warning, never a failure.
    allowMissingIllu: args['allow-missing-illustration'] || record.specOnly === true,
  }, spec);
  if (warns.length || fails.length) {
    console.log(`\n${spec.addr}  [${spec.part}]`);
    warns.forEach((w) => console.warn('  WARN: ' + w));
    fails.forEach((f) => console.error('  FAIL: ' + f));
  }
  if (fails.length) failed++;
}

if (!total) {
  console.error('No in-scope options matched.');
  process.exit(1);
}
console.log(`\n${total - failed}/${total} option(s) passed the pre-flight gate.`);
process.exit(failed ? 1 : 0);
