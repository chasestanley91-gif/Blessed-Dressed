#!/usr/bin/env node
// extract_spec.mjs — turn one catalog option into a persisted, structured
// garment spec (spec.json), conforming to schemas/garment-spec.schema.json.
// This is the pipeline hand-off point to garment-image-director: nothing
// downstream should ever recompute the spec from raw catalog text again —
// that's the fix for the old single-skill pipeline recomputing the spec on
// every script invocation with no canonical artifact to diff against.
//
// Two-step by design, because orientation cannot be determined from text —
// only from actually looking at the illustration:
//
//   1. Preview (no --orientation): prints the deterministic extraction and the
//      illustration path. Read that illustration (vision), then decide the
//      orientation per orientation-rules.md.
//   2. Persist: re-run with --orientation=<front|back|side-left|side-right|
//      three-quarter-front|three-quarter-back|detail|interior> --write to
//      compute forbidden[] and write spec.json into the pipeline cache.
//
// Usage:
//   node extract_spec.mjs --product=shirt --option=<id>
//   node extract_spec.mjs --product=shirt --option=<id> --orientation=front --write
//   node extract_spec.mjs --product=suit-2pc --section=lapel --json   # batch preview, no write

import { resolveCatalog, iterateOptions, parseArgs } from './lib/catalog.mjs';
import { extractSpec, computeForbidden } from './lib/spec.mjs';
import { pipelineDir, writeJson } from './lib/util.mjs';

const ORIENTATIONS = [
  'front', 'back', 'side-left', 'side-right',
  'three-quarter-front', 'three-quarter-back', 'detail', 'interior',
];

const args = parseArgs();
let cat;
try {
  cat = resolveCatalog({ options: args.options, public: args.public });
} catch (e) {
  console.error('ERROR: ' + e.message);
  process.exit(1);
}

const match = (args.match || '').toLowerCase();
const rows = [];
for (const opt of iterateOptions(cat, { product: args.product })) {
  if (args.section && opt.sectionId !== args.section) continue;
  if (args.field && opt.fieldId !== args.field) continue;
  if (args.option && opt.optionId !== args.option) continue;
  if (match && !(`${opt.optionId} ${opt.label}`.toLowerCase().includes(match))) continue;
  rows.push({ opt, spec: extractSpec(opt) });
}

if (!rows.length) {
  console.error('No options matched. Check --product/--section/--field/--option/--match.');
  process.exit(1);
}

// ---- write mode: exactly one option, orientation required -----------------
if (args.write) {
  if (rows.length !== 1) {
    console.error(`ERROR: --write requires exactly one option (${rows.length} matched). Narrow with --option=<id>.`);
    process.exit(1);
  }
  const { spec } = rows[0];
  if (!args.orientation) {
    console.error(
      'ERROR: --orientation is required to write a spec. Read the illustration first ' +
      '(' + (spec.illustrationDisk || spec.illustration || '(no illustration)') + '), determine the ' +
      'view per orientation-rules.md, then re-run with --orientation=<value>.'
    );
    console.error('Valid values: ' + ORIENTATIONS.join(' | '));
    process.exit(1);
  }
  if (!ORIENTATIONS.includes(args.orientation)) {
    console.error(`ERROR: --orientation must be one of: ${ORIENTATIONS.join(' | ')}`);
    process.exit(1);
  }
  // SPEC-ONLY MODE (owner ruling 2026-08-01: the drafting specification is LAW;
  // illustrations aid, they do not direct). --spec-only admits an option with NO
  // drawing into the pipeline on the strength of its spec-derived description
  // alone. It never bypasses a real drawing: if one exists, the flag is refused.
  const SPEC_ONLY = process.argv.includes('--spec-only');
  if (SPEC_ONLY && spec.hasBlueprint) {
    console.error('ERROR: --spec-only refused — this option HAS an illustration. Trace the drawing; drop --spec-only.');
    process.exit(1);
  }
  if (!spec.hasBlueprint && !SPEC_ONLY) {
    console.error('ERROR: this option has no illustration — nothing to trace. Not eligible for the photo pipeline.');
    console.error('If its catalog description carries owner drafting-spec geometry, re-run with --spec-only.');
    process.exit(1);
  }

  const forbidden = computeForbidden(spec);
  const record = {
    schema: 'garment-spec/v1',
    specOnly: SPEC_ONLY || undefined,
    addr: spec.addr,
    productId: spec.productId,
    sectionId: spec.sectionId,
    fieldId: spec.fieldId,
    optionId: spec.optionId,
    sourceFile: spec.sourceFile,
    source: spec.source,
    label: spec.label,
    description: spec.description,
    fieldLabel: spec.fieldLabel,
    sectionLabel: spec.sectionLabel,
    part: spec.part,
    garment: { noun: spec.garmentNoun, fabric: spec.fabric },
    view: {
      orientation: args.orientation,
      wearerPerspective: true,
      confirmedByVisualInspection: true,
    },
    absence: spec.absence,
    measured: {
      dimensions: spec.dimensions,
      angles: spec.angles,
      counts: spec.counts,
      shapes: spec.shapes,
      // Shapes the description named but the label does not claim — dropped
      // from `shapes`, and carried here so the director can turn each into an
      // explicit NEGATIVE. Without this they are silently discarded, and the
      // comparative sentence that produced them still reaches the image model
      // inside the quoted description.
      negatedShapes: spec.negatedShapes || [],
      spread: spec.spread,
      flags: spec.flags,
    },
    illustration: {
      path: spec.illustration,
      disk: spec.illustrationDisk || null,
      exists: spec.illustrationExists,
      remote: spec.illustrationRemote,
    },
    forbidden,
    excluded: spec.excluded,
    // spec-only options are generable BY DESIGN — the false that spec.generate
    // computes for them comes solely from the missing blueprint, which the
    // owner's ruling explicitly waives for these options.
    generate: SPEC_ONLY ? !spec.excluded : spec.generate,
    extractedAt: new Date().toISOString(),
  };

  const dir = pipelineDir(cat.repoRoot, spec.productId, spec.optionId);
  const file = writeJson(`${dir}/spec.json`, record);
  console.log(`Wrote ${file}`);
  console.log(JSON.stringify(record, null, 2));
  process.exit(0);
}

// ---- preview mode -----------------------------------------------------
if (args.json) {
  console.log(JSON.stringify(
    rows.map(({ spec }) => ({ ...spec, orientation: null, note: 'preview only — orientation not yet resolved' })),
    null, 2
  ));
  process.exit(0);
}

console.log(`Catalog: ${cat.optionsDir}`);
console.log(`${rows.length} option(s) — preview (no spec.json written):\n`);
for (const { spec } of rows) {
  const illu = spec.illustrationExists ? 'DISK' : spec.illustrationRemote ? 'URL ' : spec.illustration ? 'MISS' : 'NONE';
  console.log(`• ${spec.addr}   [${spec.part}]`);
  console.log(`    label : ${spec.label}`);
  console.log(`    dims  : ${[...spec.dimensions, ...spec.angles, ...(spec.counts || [])].join(' ') || '-'}   shapes: ${spec.shapes.join('/') || '-'}   flags: ${spec.flags.join(', ') || '-'}`);
  console.log(`    illus : [${illu}] ${spec.illustration || '(none)'}`);
}
console.log(`\nNext: Read each illustration, determine orientation (see orientation-rules.md), then`);
console.log(`  node extract_spec.mjs --product=<p> --option=<id> --orientation=<value> --write`);
