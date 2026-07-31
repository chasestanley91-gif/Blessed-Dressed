#!/usr/bin/env node
// publish_approved.mjs — the missing last step of the three-skill pipeline.
//
// tech-pack-interpreter writes spec.json, garment-image-director writes the
// image, garment-image-qc writes the verdict — and then nothing happened. QC is
// the only authority allowed to approve a catalog write-back, but no tool ever
// performed one, so approved images piled up on disk while the builder kept
// rendering line drawings. That is what the PASS_NOT_SHIPPED finding has been
// reporting; this script is its permanent fix, not a one-off repair.
//
// A publish targets a craft-option IDENTITY (fieldId + optionId), not a product
// row. The same option is offered on up to four products, and one approved photo
// serves all of them — "a 4.5 cm notch lapel is the same lapel whether it is
// ordered on a sport coat, a 2-piece or a 3-piece suit". Publishing per row
// instead of per identity would demand ~840 redundant generations the credit
// balance does not cover. See tools/cluster_map.mjs for the identity rule.
//
// Every publish must clear ALL of these gates, or the option is skipped:
//   0. The pipeline folder resolves to exactly one FIELD. `option.id` is not
//      unique inside a product (`shirt > stitch-01-top` lives on the collar,
//      placket AND cuff stitching fields), so spec.json's recorded fieldId is
//      the authority. Ambiguous and unrecorded => refuse, never guess.
//   1. qc.json exists and its verdict is PASS or PASS_WAIVED. A waiver is a
//      logged, mechanically-computed exception (attempt >= 3, every category
//      >= 95, zero critical/major findings) — never an agent's assertion. The
//      ledger records WHICH verdict authorised each write so a waived image is
//      never indistinguishable from a clean pass.
//   2. The file about to be wired is byte-identical to candidate-<qc.attempt>.png
//      — proof the shipped pixels are the pixels QC actually graded, not a
//      later regeneration that quietly replaced them.
//   3. PER ROW: the row's current image is NOT already a generated photo.
//      Replacing an approved asset is a human decision (--allow-swap), never an
//      automatic one — and a fan-out sibling is never swapped just because the
//      primary was approved. Each row earns its own write.
//   4. The target file is not already wired to a DIFFERENT craft option, so a
//      publish can never create the image-collision defect.
//
// The current image is preserved into `techpackIllustration` before `image` is
// overwritten — per row, so every product keeps its OWN blueprint pointer. For
// most options `image` still holds the authoritative tech-pack drawing and
// nothing else records it, so a naive overwrite would destroy the blueprint that
// every future QC pass has to compare against. A path under /images/generated/
// is our own output and is never preserved as a blueprint.
//
// Usage:
//   node tools/publish_approved.mjs                 # dry run — prints the plan
//   node tools/publish_approved.mjs --apply         # write the catalog
//   node tools/publish_approved.mjs --option=<id>   # restrict to one option id
//   node tools/publish_approved.mjs --no-fanout     # this product's rows only
//   node tools/publish_approved.mjs --allow-swap    # permit replacing a live photo
//
// Exit 0 = nothing blocked. Exit 1 = at least one option or sibling row was
// refused a gate.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { REPO, loadCatalogRows, clusterIndex, resolvePipelineRows, normLabel } from './cluster_map.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PIPELINE = path.join(REPO, '.craft-pipeline');
const PUBLIC = path.join(REPO, 'public');
const LEDGER = path.join(PUBLIC, 'images', 'reports', 'publish-log.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
  })
);

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha1 = (p) => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
const isGenerated = (v) => typeof v === 'string' && v.includes('/images/generated/');

// Verdicts that authorise a write-back. PASS_WAIVED is a logged exception, not a
// second-class PASS: it ships, but the ledger says so.
const SHIPPABLE_VERDICTS = new Set(['PASS', 'PASS_WAIVED']);

// The folder under public/images/generated a product's photos live in. The
// catalog splits suits into 2pc/3pc but they share one jacket photo library.
const GENERATED_FOLDER = {
  shirt: 'shirt',
  'sport-coat': 'sport-coat',
  'suit-2pc': 'jacket',
  'suit-3pc': 'jacket',
  trousers: 'trousers',
  vest: 'vest',
};

// --- load the catalog, keeping a handle on every option object so a write is
//     an in-place mutation of the parsed tree rather than a text substitution.
const { products: catalog, rows: allRows } = loadCatalogRows();
const index = clusterIndex(allRows);

// Every image currently wired, so gate 4 can detect a collision before writing.
// Built from ALL rows — an index keyed on option.id alone would silently drop
// the 79 ids that repeat across fields inside one product.
const wiredBy = new Map(); // imagePath -> Set("fieldId/optionId")
for (const row of allRows) {
  if (isGenerated(row.option.image)) {
    if (!wiredBy.has(row.option.image)) wiredBy.set(row.option.image, new Set());
    wiredBy.get(row.option.image).add(row.identity);
  }
}

// --- walk every pipeline folder and decide what may be published -------------
const plan = [];
const refused = [];
const notes = [];
const plannedIdentity = new Map(); // identity -> plan entry, so two pipeline
                                   // folders for one cluster cannot both publish

const pipelineDirs = [];
for (const productId of fs.existsSync(PIPELINE) ? fs.readdirSync(PIPELINE).sort() : []) {
  const pdir = path.join(PIPELINE, productId);
  if (!fs.statSync(pdir).isDirectory()) continue;
  for (const optionId of fs.readdirSync(pdir).sort()) {
    if (fs.statSync(path.join(pdir, optionId)).isDirectory()) pipelineDirs.push({ productId, optionId });
  }
}

for (const { productId, optionId } of pipelineDirs) {
  if (args.option && args.option !== optionId) continue;
  const odir = path.join(PIPELINE, productId, optionId);
  const qcPath = path.join(odir, 'qc.json');
  const refuse = (reason) => refused.push({ productId, optionId, reason });

  if (!fs.existsSync(qcPath)) continue; // not yet verified — not a defect
  const qc = readJson(qcPath);

  // Gate 1 — only a shippable verdict may publish.
  if (!SHIPPABLE_VERDICTS.has(qc.verdict)) {
    refuse(`verdict is ${qc.verdict}, not PASS or PASS_WAIVED`);
    continue;
  }
  const waived = qc.verdict === 'PASS_WAIVED';

  // Gate 1b — a waiver means "no critical or major findings". Trust the verdict
  // for the score/attempt arithmetic (log_qc_result.mjs owns that), but never
  // ship a waiver that contradicts its own evidence.
  const blocking = (qc.errors || []).filter((e) =>
    ['critical', 'major'].includes(String(e && e.severity).toLowerCase())
  );
  if (waived && blocking.length) {
    refuse(
      `PASS_WAIVED contradicts its own evidence — ${blocking.length} ` +
        `${blocking.map((e) => String(e.severity).toLowerCase()).join('/')} finding(s) recorded`
    );
    continue;
  }

  const scores = Object.values(qc.scores || {}).filter((n) => typeof n === 'number');
  const minCategoryScore = scores.length ? Math.min(...scores) : null;

  // Gate 0 — resolve the pipeline folder to a FIELD before anything else.
  const specPath = path.join(odir, 'spec.json');
  let specFieldId = null;
  if (fs.existsSync(specPath)) {
    try {
      specFieldId = readJson(specPath).fieldId || null;
    } catch {
      specFieldId = null;
    }
  }
  const resolved = resolvePipelineRows(index, productId, optionId, specFieldId);
  if (!resolved.ok) {
    refuse(resolved.reason);
    continue;
  }
  const { fieldId, identity } = resolved;

  // WHERE THE APPROVED MASTER ACTUALLY IS.
  // ---------------------------------------------------------------------
  // Two scripts derive this path independently and they do not agree:
  // log_qc_result.mjs stages under the PRODUCT id (suit-3pc/), while this tool
  // computed it from GENERATED_FOLDER, which maps the suit products onto
  // `jacket/`. Every waistcoat and trouser option inside suit-2pc/suit-3pc
  // therefore staged to one path and was looked for at another, and 12 genuinely
  // QC-approved images were refused as "not on disk" while sitting on disk.
  //
  // The folder is only a lookup. The GUARANTEE is gate 2 below — SHA-1
  // byte-identity against the exact candidate QC graded — so widening the search
  // costs nothing and loses nothing: a file found in the wrong folder still has
  // to prove it is the graded artifact before it can be published.
  const folderCandidates = [...new Set([GENERATED_FOLDER[productId] || productId, productId])];
  let target = null;
  let targetAbs = null;
  for (const folder of folderCandidates) {
    const candidate = `/images/generated/${folder}/${optionId}.png`;
    const abs = path.join(PUBLIC, candidate.replace(/^\//, ''));
    if (fs.existsSync(abs)) {
      target = candidate;
      targetAbs = abs;
      break;
    }
  }
  if (!targetAbs) {
    refuse(
      `approved image not on disk — looked in ${folderCandidates
        .map((f) => `/images/generated/${f}/${optionId}.png`)
        .join(' and ')}`
    );
    continue;
  }

  // Gate 2 — the bytes on disk must be the bytes QC graded.
  const approved = path.join(odir, `candidate-${qc.attempt}.png`);
  if (!fs.existsSync(approved)) {
    refuse(`candidate-${qc.attempt}.png (the graded attempt) is missing`);
    continue;
  }
  if (sha1(approved) !== sha1(targetAbs)) {
    refuse(`${target} does not match the QC-approved candidate-${qc.attempt}.png`);
    continue;
  }

  // Gate 2b — the catalog serves a WebP derivative (see tools/optimize_assets.mjs),
  // because the PNG masters average 2 MB and would be shipped to every visitor.
  // The master and the byte-identity check above are deliberately untouched:
  // provenance is master -> derivative, recorded in the optimization manifest.
  // A lossy derivative can never be byte-identical, so it is verified by being
  // *derived from* the file we just proved is the graded candidate.
  const served = target.replace(/\.png$/i, '.webp');
  const servedAbs = path.join(PUBLIC, served.replace(/^\//, ''));
  if (!fs.existsSync(servedAbs)) {
    refuse(`no WebP derivative at ${served} — run: node tools/optimize_assets.mjs --apply`);
    continue;
  }

  // One cluster, one publish. Two pipeline folders can resolve to the same
  // identity (suit-2pc and suit-3pc both fan out over each other); the first is
  // authoritative, and a SECOND one proposing a different file is a conflict.
  const already = plannedIdentity.get(identity);
  if (already) {
    if (already.served === served) {
      notes.push(
        `${productId}/${optionId} — already covered by the ${already.productId}/${already.optionId} cluster publish`
      );
    } else {
      refuse(
        `identity ${identity} is already being published as ${already.served} ` +
          `(from ${already.productId}/${already.optionId}); refusing to publish a second file for one option`
      );
    }
    continue;
  }

  // Gate 4 — never wire one image to two different craft options. Checked on the
  // identity, so cross-product reuse of ONE option passes and two DISTINCT
  // options sharing a file is still refused.
  const owners = wiredBy.get(served);
  if (owners && [...owners].some((o) => o !== identity)) {
    refuse(`${target} is already wired to a different option (${[...owners].sort().join(', ')})`);
    continue;
  }

  // --- fan-out: every catalog row that IS this craft option -------------------
  const cluster = index.byIdentity.get(identity) || [];
  const candidates = args['no-fanout'] ? cluster.filter((r) => r.productId === productId) : cluster;
  const primaryLabel = normLabel(resolved.rows[0].label);

  // The drawing a row is sold against: its recorded tech pack, else its current
  // image when that is still a real drawing. Our own output is never a blueprint.
  const blueprintOf = (row) => {
    const tp = row.option.techpackIllustration;
    if (typeof tp === 'string' && tp) return tp.toLowerCase();
    const img = row.option.image;
    return typeof img === 'string' && img && !isGenerated(img) ? img.toLowerCase() : null;
  };
  const primaryRow = resolved.rows.find((r) => r.productId === productId) || resolved.rows[0];
  const primaryBlueprint = blueprintOf(primaryRow);

  const targets = [];
  const labelDrift = [];
  const blueprintDrift = [];
  const wouldSwap = [];
  for (const row of candidates.slice().sort((a, b) =>
    a.productId.localeCompare(b.productId) || a.sectionId.localeCompare(b.sectionId)
  )) {
    const where = `${row.productId}/${row.fieldId}/${row.optionId}`;

    // Field equality is guaranteed by the identity key. Label equality is the
    // independent cross-check: if the catalog itself cannot agree what this
    // option is called, it has not established that these are one option.
    if (normLabel(row.label) !== primaryLabel) {
      labelDrift.push({ where, label: row.label });
      continue;
    }

    // BLUEPRINT AGREEMENT — the gate label equality cannot provide.
    // fieldId+optionId+label can all match while the rows are drawn against
    // DIFFERENT tech packs, and then one photo cannot be correct for both.
    // Measured 2026-07-30 over all 1,979 in-scope rows: 549 of 553 multi-row
    // identities agree, and the 4 that diverge are all coin-pocket —
    // `coin-pocket/coin-left` spans /images/jacket/coin-pocket/left.jpg AND a
    // localized trouser drawing. A coin pocket on trousers is simply not the
    // same photograph as one on a jacket. Without this gate, fan-out would wire
    // a jacket photo onto trouser rows.
    // (Keying identity on `part` would also separate them, but `part` is derived
    // by tech-pack-interpreter and is not present in the catalog JSON this tool
    // reads — so the invariant is enforced here, where the evidence exists.)
    const rowBlueprint = blueprintOf(row);
    if (row !== primaryRow && primaryBlueprint && rowBlueprint !== primaryBlueprint) {
      blueprintDrift.push({
        where,
        blueprint: rowBlueprint ?? '(unknown — no tech pack recorded and the live image is our own output)',
      });
      continue;
    }

    const current = row.option.image || null;
    if (current === served) {
      targets.push({ row, action: 'already', previous: current, preserveBlueprint: null });
      continue;
    }

    // Gate 3 — PER ROW. A sibling is never silently swapped off a live photo
    // just because the primary product was approved.
    if (isGenerated(current) && !args['allow-swap']) {
      wouldSwap.push({ where, current });
      continue;
    }

    targets.push({
      row,
      action: 'write',
      previous: current,
      // Only preserve when the field is empty AND the outgoing value is a real
      // drawing — never overwrite a blueprint pointer that is already recorded,
      // and never record our own generated output as a blueprint.
      preserveBlueprint:
        !row.option.techpackIllustration && typeof current === 'string' && !isGenerated(current)
          ? current
          : null,
    });
  }

  // One refusal per reason, listing every row it blocked — a per-row refusal
  // line for a 3-product cluster buries the six other findings in noise.
  if (labelDrift.length) {
    refuse(
      `fan-out blocked for ${labelDrift.length} row(s) — same field+option but the label disagrees with ` +
        `${JSON.stringify(resolved.rows[0].label)}: ` +
        labelDrift.map((d) => `${d.where}=${JSON.stringify(d.label)}`).join(', ') +
        '; resolve the catalog, do not guess'
    );
  }
  if (blueprintDrift.length) {
    refuse(
      `fan-out blocked for ${blueprintDrift.length} row(s) — same field+option+label but drawn against a ` +
        `DIFFERENT tech pack than ${JSON.stringify(primaryBlueprint)}: ` +
        blueprintDrift.map((d) => `${d.where}=${JSON.stringify(d.blueprint)}`).join(', ') +
        '; one photo cannot serve two drawings — publish these rows from their own pipeline folder'
    );
  }
  if (wouldSwap.length) {
    refuse(
      `${wouldSwap.length} row(s) would replace a live photo; rerun with --allow-swap once a human approves: ` +
        wouldSwap.map((d) => `${d.where} (${d.current})`).join(', ')
    );
  }

  if (!targets.some((t) => t.action === 'write')) continue; // fully published already

  const entry = {
    productId,
    optionId,
    fieldId,
    identity,
    target, // the PNG master QC graded — the provenance anchor
    served, // the WebP derivative the catalog actually points at
    verdict: qc.verdict,
    waived,
    attempt: qc.attempt,
    scoreThreshold: qc.scoreMin ?? null,
    minCategoryScore,
    targets,
  };
  plan.push(entry);
  plannedIdentity.set(identity, entry);
}

// --- report ------------------------------------------------------------------
const writeCount = plan.reduce((a, p) => a + p.targets.filter((t) => t.action === 'write').length, 0);
console.log(
  `publish_approved — ${plan.length} option(s) ready across ${writeCount} catalog row(s), ${refused.length} refused` +
    (args['no-fanout'] ? '   [--no-fanout: single product]' : '') +
    '\n'
);

for (const p of plan) {
  const writes = p.targets.filter((t) => t.action === 'write');
  const alsoProducts = [...new Set(writes.map((t) => t.row.productId))].filter((x) => x !== p.productId);
  const also = alsoProducts.length ? `  ->  also ${alsoProducts.join(', ')}` : '';
  const grade = p.waived
    ? `QC PASS_WAIVED (logged exception), attempt ${p.attempt}, lowest category ${p.minCategoryScore}`
    : `QC PASS, attempt ${p.attempt}, lowest category ${p.minCategoryScore}`;

  console.log(`  PUBLISH  ${p.productId}/${p.optionId}${also}`);
  console.log(`           identity: ${p.identity}   (${grade})`);
  console.log(`           master:   ${p.target}   (byte-identical to candidate-${p.attempt}.png)`);
  console.log(`           served:   ${p.served}`);
  for (const t of p.targets) {
    const dup = p.targets.filter((x) => x.row.productId === t.row.productId).length > 1;
    const who = (t.row.productId + (dup ? ` (${t.row.sectionId})` : '')).padEnd(28);
    if (t.action === 'already') {
      console.log(`             ${who} already serving this image`);
    } else {
      console.log(`             ${who} ${t.previous || '(none)'}`);
      if (t.preserveBlueprint) console.log(`             ${' '.repeat(28)}   ^ preserved -> techpackIllustration`);
    }
  }
}
if (refused.length) {
  console.log('');
  for (const r of refused) console.log(`  REFUSED  ${r.productId}/${r.optionId} — ${r.reason}`);
}
if (notes.length) {
  console.log('');
  for (const n of notes) console.log(`  NOTE     ${n}`);
}

if (!args.apply) {
  console.log(`\nDry run. Re-run with --apply to write ${writeCount} catalog row(s) across ${plan.length} option(s).`);
  process.exit(refused.length ? 1 : 0);
}

// --- apply -------------------------------------------------------------------
const touched = new Set();
for (const p of plan) {
  for (const t of p.targets) {
    if (t.action !== 'write') continue;
    if (t.preserveBlueprint) t.row.option.techpackIllustration = t.preserveBlueprint;
    t.row.option.image = p.served;
    touched.add(t.row.productId);
  }
}

for (const productId of [...touched].sort()) {
  const { file, json, endsWithNewline } = catalog[productId];
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + (endsWithNewline ? '\n' : ''), 'utf8');
  console.log(`\nwrote ${path.relative(REPO, file).split(path.sep).join('/')}`);
}

// Append to the ledger so every production write-back is traceable to its verdict.
const ledger = fs.existsSync(LEDGER) ? readJson(LEDGER) : { publishes: [] };
ledger.publishes.push({
  at: new Date().toISOString(),
  by: 'tools/publish_approved.mjs',
  count: plan.length,
  rowCount: writeCount,
  fanout: !args['no-fanout'],
  options: plan.map((p) => {
    const writes = p.targets.filter((t) => t.action === 'write');
    const primary = writes.find((t) => t.row.productId === p.productId) || null;
    return {
      product: p.productId,
      option: p.optionId,
      field: p.fieldId,
      identity: p.identity,
      image: p.served, // what the catalog now serves
      master: p.target, // the QC-graded PNG it was derived from
      previous: primary ? primary.previous : null,
      preservedBlueprint: primary ? primary.preserveBlueprint : null,
      // WHICH verdict authorised this write. A waived image must never be
      // indistinguishable from a clean pass in the audit trail.
      verdict: p.verdict,
      waived: p.waived,
      qcAttempt: p.attempt,
      qcScoreMin: p.scoreThreshold,
      qcMinCategoryScore: p.minCategoryScore,
      rows: writes.map((t) => ({
        product: t.row.productId,
        section: t.row.sectionId,
        field: t.row.fieldId,
        previous: t.previous,
        preservedBlueprint: t.preserveBlueprint,
      })),
    };
  }),
});
fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n', 'utf8');
console.log(`wrote ${path.relative(REPO, LEDGER).split(path.sep).join('/')}`);

console.log(`\nPublished ${writeCount} catalog row(s) from ${plan.length} approved image(s). Re-run: node tools/project_state.mjs`);
process.exit(refused.length ? 1 : 0);
