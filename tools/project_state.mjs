#!/usr/bin/env node
// project_state.mjs — the repository's single source of derived truth.
//
// The catalog, the pipeline artifacts and the shipped image files are three
// separate stores that drift apart. This tool JOINS them, audits the join, and
// regenerates the persistent state documents so that no session has to
// reconstruct project state from chat history.
//
// It READS everything and WRITES ONLY:
//   <reports>/repo-index.json      full searchable join (one record per option)
//   <reports>/state-summary.json   machine roll-up + audit findings
//   STATE.md                       where the project is, right now
//   CONTINUE.md                    what the next session should do first
//   PROJECT_DASHBOARD.md           coverage tables per product
//
// It never touches the catalog, the images or the pipeline artifacts.
//
// Usage:
//   node tools/project_state.mjs                 # write index + state docs
//   node tools/project_state.mjs --audit         # print findings only, write nothing
//   node tools/project_state.mjs --json          # summary JSON to stdout
//   node tools/project_state.mjs --skills=<dir>  # where the 3 pipeline skills live
//
// Exit 0 = join is clean. Exit 1 = at least one blocking audit finding.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv = process.argv.slice(2)) {
  const out = {};
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}
const args = parseArgs();

const REPO = path.resolve(args.repo || path.join(HERE, '..'));
const SKILLS = path.resolve(
  args.skills || process.env.CRAFT_SKILLS_DIR || path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude', 'skills')
);
const REPORTS = path.resolve(args.out || path.join(REPO, 'public', 'images', 'reports'));
const PIPELINE = path.join(REPO, '.craft-pipeline');
const PUBLIC = path.join(REPO, 'public');
const GENERATED = path.join(PUBLIC, 'images', 'generated');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const tryJson = (p) => {
  try {
    return readJson(p);
  } catch {
    return null;
  }
};
const exists = (p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
};
const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');

// ---------------------------------------------------------------------------
// 1. Catalog inventory — the option walk and the structural classification are
//    both owned by tech-pack-interpreter, so its libs are imported rather than
//    re-implemented here. This tool only adds the JOIN (live image, pipeline
//    artifacts, files on disk), which inventory.mjs deliberately does not model.
// ---------------------------------------------------------------------------
async function loadInventory() {
  const libDir = path.join(SKILLS, 'tech-pack-interpreter', 'scripts', 'lib');
  if (!exists(libDir)) {
    throw new Error(`tech-pack-interpreter libs not found at ${libDir}. Pass --skills=<dir containing tech-pack-interpreter>.`);
  }
  const { resolveCatalog, iterateOptions } = await import(pathToFileURL(path.join(libDir, 'catalog.mjs')).href);
  const { extractSpec } = await import(pathToFileURL(path.join(libDir, 'spec.mjs')).href);

  const cat = resolveCatalog({ options: path.join(REPO, 'data-store', 'options'), public: PUBLIC });
  const out = [];
  for (const opt of iterateOptions(cat)) {
    const spec = extractSpec(opt);
    const profiled = spec.part !== 'generic-detail';
    out.push({
      addr: spec.addr,
      product: spec.productId,
      section: opt.sectionId,
      field: opt.fieldId,
      option: opt.optionId,
      label: spec.label,
      part: spec.part,
      kind: spec.part.startsWith('fin-') ? 'finishing' : profiled ? 'structural' : 'unprofiled',
      blueprint: spec.illustrationExists ? 'local' : spec.illustrationRemote ? 'remote' : 'none',
      excluded: spec.excluded || null,
      generate: spec.generate,
      illustration: spec.illustration,
      // The catalog's CURRENT value — what the builder renders today. extractSpec
      // reports the blueprint (tech pack wins), which is a different thing.
      liveImage: opt.liveImage ?? null,
      techpackIllustration: opt.techpackIllustration ?? null,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. Pipeline artifacts — what the three-skill pipeline has actually produced.
// ---------------------------------------------------------------------------
const ARTIFACTS = ['spec.json', 'prompt.json', 'generation.json', 'qc.json'];

function scanPipeline() {
  const byKey = new Map();
  if (!exists(PIPELINE)) return byKey;
  for (const productId of fs.readdirSync(PIPELINE)) {
    const pdir = path.join(PIPELINE, productId);
    if (!fs.statSync(pdir).isDirectory()) continue;
    for (const optionId of fs.readdirSync(pdir)) {
      const odir = path.join(pdir, optionId);
      if (!fs.statSync(odir).isDirectory()) continue;
      const files = fs.readdirSync(odir);
      const have = {};
      for (const a of ARTIFACTS) have[a.replace('.json', '')] = files.includes(a);

      const qc = files.includes('qc.json') ? tryJson(path.join(odir, 'qc.json')) : null;
      const gen = files.includes('generation.json') ? tryJson(path.join(odir, 'generation.json')) : null;

      byKey.set(`${productId}/${optionId}`, {
        productId,
        optionId,
        dir: rel(odir),
        have,
        candidates: files.filter((f) => /^candidate-\d+\.png$/i.test(f)).length,
        // Sidecar files record superseded / rejected attempts; their presence is
        // history, not current state, but the counts matter for the audit trail.
        supersededArtifacts: files.filter((f) => /-(rejected|superseded)(-|\.)/i.test(f)).length,
        needsReverify: files.includes('NEEDS-REVERIFY.json'),
        verdict: qc ? qc.verdict || null : null,
        attempt: (qc && qc.attempt) || (gen && gen.attempt) || null,
        scoreMin: qc ? (qc.scoreMin ?? null) : null,
        lowestScore: qc && qc.scores ? Math.min(...Object.values(qc.scores).filter((n) => typeof n === 'number')) : null,
        belowMin: qc && Array.isArray(qc.belowMinCategories) ? qc.belowMinCategories : [],
        errorSeverities: qc && Array.isArray(qc.errors) ? qc.errors.map((e) => e.severity) : [],
        checkedAt: qc ? qc.checkedAt || null : null,
        generatedAt: gen ? gen.generatedAt || null : null,
        model: gen ? gen.model || null : null,
      });
    }
  }
  return byKey;
}

// ---------------------------------------------------------------------------
// 3. Shipped images on disk — hashed, so reuse of one file across options
//    (a real defect: two craft options must never show the same photo) shows up.
// ---------------------------------------------------------------------------
function scanGenerated() {
  const files = new Map(); // "generated/<dir>/<file>" -> {bytes, sha1}
  if (!exists(GENERATED)) return files;
  for (const d of fs.readdirSync(GENERATED)) {
    const dir = path.join(GENERATED, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const st = fs.statSync(full);
      if (!st.isFile()) continue;
      files.set(`/images/generated/${d}/${f}`, {
        bytes: st.size,
        sha1: crypto.createHash('sha1').update(fs.readFileSync(full)).digest('hex'),
        mtime: st.mtime.toISOString(),
      });
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// 4. Join + audit
// ---------------------------------------------------------------------------
const inventory = await loadInventory();
const pipeline = scanPipeline();
const generated = scanGenerated();

const isGeneratedPath = (s) => typeof s === 'string' && /(^|\/)images\/generated\//i.test(s);
const isRemote = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);

const records = [];
const shippedUse = new Map(); // generated path -> [addr]

for (const inv of inventory) {
  const key = `${inv.product}/${inv.option}`;
  const pipe = pipeline.get(key) || null;

  // What the builder actually renders today. inventory.mjs reports `illustration`
  // as the BLUEPRINT (tech pack wins), so the live value is read back here from
  // the catalog record it preserved.
  const live = inv.liveImage ?? null;
  const shippedPath = isGeneratedPath(live) ? live : null;
  const shippedFile = shippedPath ? generated.get(shippedPath) || null : null;
  if (shippedPath) {
    shippedUse.set(shippedPath, [...(shippedUse.get(shippedPath) || []), inv.addr]);
  }

  records.push({
    key,
    addr: inv.addr,
    product: inv.product,
    section: inv.section,
    field: inv.field,
    option: inv.option,
    label: inv.label,
    part: inv.part,
    kind: inv.kind,
    excluded: inv.excluded,
    inScope: Boolean(inv.generate),
    blueprint: inv.blueprint, // local | remote | none
    illustration: inv.illustration,
    liveImage: live,
    shipped: Boolean(shippedPath && shippedFile),
    shippedPath,
    shippedBytes: shippedFile ? shippedFile.bytes : null,
    shippedSha1: shippedFile ? shippedFile.sha1 : null,
    pipeline: pipe
      ? {
          dir: pipe.dir,
          have: pipe.have,
          verdict: pipe.verdict,
          attempt: pipe.attempt,
          lowestScore: pipe.lowestScore,
          belowMin: pipe.belowMin,
          candidates: pipe.candidates,
          needsReverify: pipe.needsReverify,
          checkedAt: pipe.checkedAt,
        }
      : null,
    // Lifecycle stage, derived — the one field a human or agent should read.
    stage: null, // filled below
  });
}

function deriveStage(r) {
  if (r.excluded) return 'excluded-swatch';
  if (!r.inScope) return r.blueprint === 'none' ? 'no-blueprint' : 'out-of-scope';
  const p = r.pipeline;
  if (p && p.needsReverify) return 'needs-reverify';
  if (p && p.verdict === 'PASS') return r.shipped ? 'shipped' : 'passed-not-shipped';
  if (p && p.verdict === 'FAIL') return 'failed-retry-due';
  if (p && p.verdict === 'UNMET') return 'unmet';
  if (p && p.have.generation) return 'generated-awaiting-qc';
  if (p && p.have.prompt) return 'prompt-built';
  if (p && p.have.spec) return 'spec-only';
  if (r.shipped) return 'legacy-shipped-unverified';
  return 'not-started';
}
for (const r of records) r.stage = deriveStage(r);

// addr -> "field/option": lets the reuse audit collapse the same craft option
// offered on several products down to a single identity.
const optionIdentityByAddr = new Map(records.map((r) => [r.addr, `${r.field}/${r.option}`]));

// --- audit findings ---------------------------------------------------------
const findings = [];
const add = (severity, code, message, items = []) =>
  findings.push({ severity, code, message, count: items.length, items: items.slice(0, 50) });

// Blocking: QC approved but nothing shipped — approved work sitting unpublished.
const passedNotShipped = records.filter((r) => r.stage === 'passed-not-shipped');
if (passedNotShipped.length) {
  add('blocking', 'PASS_NOT_SHIPPED', 'QC PASSed but the catalog does not point at a generated image.',
    passedNotShipped.map((r) => r.addr));
}

// Blocking: catalog points at a generated file that is not on disk.
const brokenShipped = records.filter((r) => r.shippedPath && !r.shippedSha1);
if (brokenShipped.length) {
  add('blocking', 'SHIPPED_FILE_MISSING', 'Catalog references a generated image that does not exist on disk.',
    brokenShipped.map((r) => `${r.addr} -> ${r.shippedPath}`));
}

// The same craft option (same field + option id) offered on several products is
// SUPPOSED to share one photo — a 4.5 cm notch lapel is the same lapel whether it
// is ordered on a sport coat, a 2-piece or a 3-piece suit. Only a collision
// between DISTINCT options is a defect, so identity is keyed on field/option and
// never on the product-qualified address.
const optionIdentity = (r) => `${r.field}/${r.option}`;

// Blocking: one image file wired to two genuinely different craft options — the
// reference then cannot teach a customer the difference between them.
const reusedShipped = [];
for (const [p, addrs] of shippedUse) {
  if (addrs.length < 2) continue;
  const ids = [...new Set(addrs.map((a) => optionIdentityByAddr.get(a)))];
  if (ids.length > 1) reusedShipped.push([p, ids]);
}
if (reusedShipped.length) {
  add('blocking', 'SHIPPED_IMAGE_REUSED', 'One generated image is wired to two or more DISTINCT craft options.',
    reusedShipped.map(([p, ids]) => `${p} <- ${ids.length} options: ${ids.join(' | ')}`));
}

// Blocking: distinct options whose shipped images are byte-identical even though
// the filenames differ. This is the failure the whole catalog exists to prevent —
// e.g. every peak-lapel width pointing at one rendering of "a peak lapel" — and it
// is invisible to a filename-only check, so content is hashed and grouped by the
// OPTION identities behind each hash.
const byHash = new Map();
for (const r of records) {
  if (!r.shippedSha1) continue;
  const g = byHash.get(r.shippedSha1) || { opts: new Set(), files: new Set() };
  g.opts.add(optionIdentity(r));
  g.files.add(r.shippedPath);
  byHash.set(r.shippedSha1, g);
}
const collisions = [...byHash.entries()].filter(([, g]) => g.opts.size > 1)
  .sort((a, b) => b[1].opts.size - a[1].opts.size);
if (collisions.length) {
  add('blocking', 'DISTINCT_OPTION_IMAGE_COLLISION',
    'Byte-identical images ship for craft options that must look different from each other.',
    collisions.map(([h, g]) => `${h.slice(0, 12)} — ${g.opts.size} options share 1 image (${[...g.files].length} filename(s)): ${[...g.opts].join(' | ')}`));
}

// Warning: byte-identical files on disk under different names. Where every copy
// belongs to the SAME option this is only wasted disk and duplicated spend, not a
// customer-visible defect, so it ranks below the collision check above.
const byFileHash = new Map();
for (const [p, meta] of generated) byFileHash.set(meta.sha1, [...(byFileHash.get(meta.sha1) || []), p]);
const dupFiles = [...byFileHash.entries()].filter(([, ps]) => ps.length > 1);
if (dupFiles.length) {
  add('warning', 'DUPLICATE_IMAGE_CONTENT', 'Distinct generated filenames hold byte-identical images.',
    dupFiles.map(([h, ps]) => `${h.slice(0, 12)}: ${ps.join(' , ')}`));
}

// Warning: shipped without any QC record — cannot prove it was ever verified.
const legacyUnverified = records.filter((r) => r.stage === 'legacy-shipped-unverified');
if (legacyUnverified.length) {
  add('warning', 'SHIPPED_WITHOUT_QC', 'Catalog shows a generated image with no qc.json to back it (legacy output).',
    legacyUnverified.map((r) => r.addr));
}

// Warning: pipeline work exists for an option the catalog no longer has.
const invKeys = new Set(records.map((r) => r.key));
const orphanPipeline = [...pipeline.keys()].filter((k) => !invKeys.has(k));
if (orphanPipeline.length) {
  add('warning', 'ORPHAN_PIPELINE_DIR', 'A .craft-pipeline folder has no matching catalog option.', orphanPipeline);
}

// Warning: generated file on disk that no option points at.
//
// A PNG MASTER IS NOT AN ORPHAN WHEN ITS .webp SIBLING IS WIRED.
// ---------------------------------------------------------------
// Since the WebP migration the catalog serves `<id>.webp`, so a naive "is this
// exact path referenced?" test reported all 578 PNG masters as unreferenced —
// 688 orphan warnings, the overwhelming majority of which were the single most
// important file in the provenance chain telling us it was junk. The masters are
// deliberately retained: publish_approved.mjs gate 2 proves the shipped pixels
// are the pixels QC graded by SHA-1 byte-identity against candidate-<attempt>.png,
// and a lossy derivative can never be byte-identical. The chain is
//
//   qc.json (attempt N) -> candidate-N.png (sha X)
//                       -> generated/<id>.png  (sha X, byte-identical, the anchor)
//                       -> generated/<id>.webp (derived; manifest records sourceSha1 X)
//
// So a file is wired if EITHER it is referenced directly, or its counterpart in
// the pair is. Deleting a "orphan" master on this report's say-so would have
// silently destroyed the guarantee while every test still passed.
const wired = new Set([...shippedUse.keys()]);
const counterpartOf = (p) =>
  /\.png$/i.test(p) ? p.replace(/\.png$/i, '.webp') : /\.webp$/i.test(p) ? p.replace(/\.webp$/i, '.png') : null;

const provenanceAnchors = [];
const orphanFiles = [];
for (const p of generated.keys()) {
  if (wired.has(p)) continue;
  const sibling = counterpartOf(p);
  if (sibling && wired.has(sibling)) {
    provenanceAnchors.push(`${p}  (anchor for the served ${sibling})`);
    continue;
  }
  orphanFiles.push(p);
}
if (orphanFiles.length) {
  add('warning', 'ORPHAN_IMAGE_FILE', 'Generated image on disk is not referenced by any catalog option, and has no wired .png/.webp counterpart.', orphanFiles);
}
if (provenanceAnchors.length) {
  add('info', 'PROVENANCE_ANCHOR',
    'Unreferenced by the catalog BY DESIGN: the QC-graded master behind a served derivative. Required by publish_approved.mjs gate 2 — do not delete.',
    provenanceAnchors);
}

// Warning: in-scope option whose blueprint is a remote URL — cannot be attached
// as a hard geometry reference until it is pulled into the repo.
const remoteBlueprints = records.filter((r) => r.inScope && r.blueprint === 'remote');
if (remoteBlueprints.length) {
  add('warning', 'REMOTE_BLUEPRINT', 'In-scope option blueprint is a remote URL, not a local file.',
    remoteBlueprints.map((r) => `${r.addr} -> ${r.illustration}`));
}

// Info: shared blueprints — one drawing behind several in-scope options.
const byIllu = new Map();
for (const r of records) {
  if (!r.inScope || !r.illustration) continue;
  byIllu.set(r.illustration, [...(byIllu.get(r.illustration) || []), r.addr]);
}
const sharedBlueprints = [...byIllu.entries()].filter(([, a]) => a.length > 1).sort((a, b) => b[1].length - a[1].length);
if (sharedBlueprints.length) {
  add('info', 'SHARED_BLUEPRINT',
    'One illustration backs several in-scope options; the reference cannot disambiguate them.',
    sharedBlueprints.map(([p, a]) => `${p} <- ${a.length} options`));
}

// --- roll-ups ---------------------------------------------------------------
const STAGES = [
  'shipped', 'passed-not-shipped', 'needs-reverify', 'failed-retry-due', 'unmet',
  'generated-awaiting-qc', 'prompt-built', 'spec-only', 'legacy-shipped-unverified',
  'not-started', 'no-blueprint', 'excluded-swatch', 'out-of-scope',
];

const perProduct = {};
for (const r of records) {
  const p = (perProduct[r.product] ||= { total: 0, inScope: 0, ...Object.fromEntries(STAGES.map((s) => [s, 0])) });
  p.total++;
  if (r.inScope) p.inScope++;
  p[r.stage]++;
}

const totals = { total: records.length, inScope: 0, ...Object.fromEntries(STAGES.map((s) => [s, 0])) };
for (const r of records) {
  if (r.inScope) totals.inScope++;
  totals[r.stage]++;
}

const inScope = records.filter((r) => r.inScope);
const verified = inScope.filter((r) => r.stage === 'shipped').length;
const pct = (n, d) => (d ? ((n / d) * 100).toFixed(1) : '0.0');

const checkpoint = tryJson(path.join(REPORTS, 'CHECKPOINT.json'));
const blocking = findings.filter((f) => f.severity === 'blocking');

const summary = {
  generatedAt: new Date().toISOString(),
  generatedBy: 'tools/project_state.mjs',
  repo: rel(REPO) || '.',
  catalog: rel(path.join(REPO, 'data-store', 'options')),
  totals,
  perProduct,
  verifiedShipped: verified,
  verifiedShippedPct: pct(verified, inScope.length),
  pipelineDirs: pipeline.size,
  generatedFiles: generated.size,
  sharedBlueprintIllustrations: sharedBlueprints.length,
  sharedBlueprintOptions: sharedBlueprints.reduce((n, [, a]) => n + a.length, 0),
  credits: checkpoint ? checkpoint.credits || (checkpoint.batch_run && checkpoint.batch_run.credits) || null : null,
  findings: findings.map(({ severity, code, message, count }) => ({ severity, code, message, count })),
  blockingCount: blocking.length,
};

// ---------------------------------------------------------------------------
// 5. Emit
// ---------------------------------------------------------------------------
if (args.json) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(blocking.length ? 1 : 0);
}

if (args.audit) {
  console.log(`Audit of ${rel(REPO) || REPO}  (${records.length} options, ${pipeline.size} pipeline dirs, ${generated.size} generated files)\n`);
  for (const f of findings) {
    console.log(`[${f.severity.toUpperCase()}] ${f.code} — ${f.message}  (${f.count})`);
    for (const it of f.items.slice(0, 8)) console.log(`    ${it}`);
    if (f.count > 8) console.log(`    … ${f.count - 8} more`);
  }
  if (!findings.length) console.log('No findings.');
  console.log(`\n${blocking.length} blocking finding(s).`);
  process.exit(blocking.length ? 1 : 0);
}

fs.mkdirSync(REPORTS, { recursive: true });

const write = (p, body) => {
  fs.writeFileSync(p, body, 'utf8');
  console.log('wrote ' + rel(p));
};

write(path.join(REPORTS, 'repo-index.json'), JSON.stringify({ generatedAt: summary.generatedAt, count: records.length, records }, null, 2));
write(path.join(REPORTS, 'state-summary.json'), JSON.stringify({ ...summary, findings }, null, 2));

// --- PROJECT_DASHBOARD.md ---------------------------------------------------
const dashCols = ['shipped', 'passed-not-shipped', 'generated-awaiting-qc', 'spec-only', 'failed-retry-due', 'unmet', 'needs-reverify', 'legacy-shipped-unverified', 'not-started'];
const dashRow = (name, p) =>
  `| ${name} | ${p.total} | ${p.inScope} | ` + dashCols.map((c) => p[c]).join(' | ') + ' |';

write(
  path.join(REPO, 'PROJECT_DASHBOARD.md'),
  `# Project Dashboard — craft-option photography

_Generated by \`tools/project_state.mjs\` at ${summary.generatedAt}. Do not hand-edit; re-run the tool._

**Verified & shipped: ${verified} / ${inScope.length} in-scope options (${summary.verifiedShippedPct}%)**

| product | options | in scope | ${dashCols.join(' | ')} |
|---|---|---|${dashCols.map(() => '---').join('|')}|
${Object.entries(perProduct).map(([n, p]) => dashRow(n, p)).join('\n')}
${dashRow('**TOTAL**', totals)}

## Stage meanings

| stage | meaning |
|---|---|
| shipped | qc.json PASS and the catalog points at the generated image |
| passed-not-shipped | QC approved, catalog not yet updated — publish it |
| generated-awaiting-qc | image exists, no verdict yet |
| spec-only / prompt-built | interpreted, not yet generated |
| failed-retry-due | QC FAIL, a corrected attempt is owed |
| unmet | retries exhausted without reaching the bar |
| needs-reverify | a prior approval was revoked |
| legacy-shipped-unverified | image is live with no qc.json behind it |
| not-started | in scope, no pipeline artifacts |
| no-blueprint / excluded-swatch | out of generation scope by design |

## Audit findings

| severity | code | count | message |
|---|---|---|---|
${findings.length ? findings.map((f) => `| ${f.severity} | ${f.code} | ${f.count} | ${f.message} |`).join('\n') : '| — | none | 0 | Join is clean |'}

Full detail: \`${rel(path.join(REPORTS, 'state-summary.json'))}\` · per-option join: \`${rel(path.join(REPORTS, 'repo-index.json'))}\`

## Reference data

- Pipeline artifact folders: ${pipeline.size}
- Generated image files on disk: ${generated.size}
- Shared blueprints: ${summary.sharedBlueprintIllustrations} illustrations back ${summary.sharedBlueprintOptions} in-scope options
${summary.credits ? `- Credits (from CHECKPOINT.json): ${JSON.stringify(summary.credits)}` : ''}
`
);

// --- STATE.md ---------------------------------------------------------------
const topStages = STAGES.filter((s) => totals[s] > 0).map((s) => `- ${s}: **${totals[s]}**`).join('\n');

write(
  path.join(REPO, 'STATE.md'),
  `# STATE — craft-option photography catalog

_Generated by \`tools/project_state.mjs\` at ${summary.generatedAt}. Machine state: \`${rel(path.join(REPORTS, 'state-summary.json'))}\`._
_Do not hand-edit; re-run \`node tools/project_state.mjs\`._

## Headline

${verified} of ${inScope.length} in-scope craft options are verified and shipped (${summary.verifiedShippedPct}%).
${blocking.length ? `**${blocking.length} blocking audit finding(s)** — see below.` : 'No blocking audit findings.'}

## Every option by lifecycle stage

${topStages}

## Blocking findings

${blocking.length
    ? blocking.map((f) => `### ${f.code} (${f.count})\n${f.message}\n\n${f.items.slice(0, 10).map((i) => `- ${i}`).join('\n')}${f.count > 10 ? `\n- … ${f.count - 10} more in state-summary.json` : ''}`).join('\n\n')
    : '_None._'}

## Warnings

${findings.filter((f) => f.severity === 'warning').map((f) => `- **${f.code}** (${f.count}) — ${f.message}`).join('\n') || '_None._'}

## Stores this state is joined from

| store | path | size |
|---|---|---|
| catalog | \`${rel(path.join(REPO, 'data-store', 'options'))}\` | ${records.length} options |
| pipeline artifacts | \`.craft-pipeline\` | ${pipeline.size} option folders |
| shipped images | \`public/images/generated\` | ${generated.size} files |

## Longer-form history

- \`${rel(path.join(REPORTS, 'CHECKPOINT.json'))}\` — narrative checkpoint (decisions, bugs found, credit ledger)
- \`${rel(path.join(REPORTS, 'failure-log.md'))}\` — prompt lessons; read before writing any new prompt
- \`PROJECT_DASHBOARD.md\` — per-product coverage tables
- \`CONTINUE.md\` — the next concrete action
`
);

// --- CONTINUE.md ------------------------------------------------------------
// Next action is derived from the join, in priority order, so a fresh session
// never has to guess.
const nextActions = [];
if (blocking.length) {
  for (const f of blocking) {
    nextActions.push(`**Clear blocking \`${f.code}\`** (${f.count}) — ${f.message} See STATE.md for the list.`);
  }
}
if (totals['needs-reverify']) {
  nextActions.push(`**Re-verify ${totals['needs-reverify']} option(s)** whose approval was revoked (stage \`needs-reverify\` in repo-index.json).`);
}
if (totals['failed-retry-due']) {
  nextActions.push(`**Run corrected retries** for ${totals['failed-retry-due']} option(s) at QC FAIL — read the qc.json \`correction\` field first.`);
}
if (totals['generated-awaiting-qc']) {
  nextActions.push(`**QC ${totals['generated-awaiting-qc']} generated image(s)** that have no verdict yet (garment-image-qc).`);
}
if (totals['spec-only'] || totals['prompt-built']) {
  nextActions.push(`**Generate ${totals['spec-only'] + totals['prompt-built']} interpreted option(s)** that have a spec but no image (garment-image-director).`);
}
if (totals['not-started']) {
  nextActions.push(`**Start ${totals['not-started']} in-scope option(s)** with no artifacts at all (tech-pack-interpreter first).`);
}
if (totals['legacy-shipped-unverified']) {
  nextActions.push(`**Decide the fate of ${totals['legacy-shipped-unverified']} legacy image(s)** shipped with no qc.json — re-verify or replace.`);
}

write(
  path.join(REPO, 'CONTINUE.md'),
  `# CONTINUE — start here

_Generated by \`tools/project_state.mjs\` at ${summary.generatedAt}. Re-run the tool after any work unit._

## Read first

1. \`STATE.md\` — current position and blocking findings
2. \`${rel(path.join(REPORTS, 'CHECKPOINT.json'))}\` — decisions already made, bugs already fixed, credit ledger
3. \`${rel(path.join(REPORTS, 'failure-log.md'))}\` — prompt lessons; **read before writing any prompt**
4. The pipeline skills, in order: \`tech-pack-interpreter\` → \`garment-image-director\` → \`garment-image-qc\`

## Standing rules

- The tech-pack illustration is law. Never improve it, never redesign it.
- \`garment-image-qc\` is the only authority that may approve a catalog write-back.
- Never overwrite an approved asset. Never generate from \`/images/generated/\` (that is our own output).
- A wrong blueprint is invisible to QC — the more faithful the render, the higher it scores. Check the drawing against the label before spending credits.
- Log every credit spend in \`failure-log.md\`.

## Next actions, in priority order

${nextActions.length ? nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n') : '_Nothing queued — the join is clean and every in-scope option is shipped._'}

## Queries against the index

\`\`\`bash
node tools/project_state.mjs --audit            # findings only, writes nothing
node tools/project_state.mjs --json             # summary roll-up

# every option at a given stage
node -e "const r=require('./${rel(path.join(REPORTS, 'repo-index.json'))}').records; \\
  console.log(r.filter(x=>x.stage==='not-started').map(x=>x.addr).join('\\n'))"
\`\`\`

## Open questions owed by the user

${(checkpoint && checkpoint.batch_run && Array.isArray(checkpoint.batch_run.next_steps)
    ? checkpoint.batch_run.next_steps.filter((s) => /OPEN QUESTION|QUESTION FOR USER/i.test(s)).map((s) => `- ${s}`).join('\n')
    : '') || '_See CHECKPOINT.json → decisions_needed_from_dustin._'}
`
);

console.log(
  `\n${verified}/${inScope.length} in-scope options verified & shipped (${summary.verifiedShippedPct}%)  ·  ` +
    `${findings.length} finding(s), ${blocking.length} blocking`
);
process.exit(blocking.length ? 1 : 0);
