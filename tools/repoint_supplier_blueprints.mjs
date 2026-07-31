#!/usr/bin/env node
/**
 * repoint_supplier_blueprints.mjs — replace hand-drawn UI glyphs with the
 * supplier's real technical drawings.
 *
 * WHY THIS EXISTS
 * ---------------
 * 69 catalog blueprints are not tech packs. They are hand-authored UI icons in
 * the storefront's brand palette (navy #0B1B2E ground, #C8BFA8 stroke, 80x100
 * viewBox), 223-641 bytes each, batch-written 2026-05-18, and they back 474
 * in-scope craft options between them. What they encode is nothing:
 *
 *   peak-lapel.svg         a navy rectangle with a crude gold outline. Carries NO
 *                          gorge angle, yet backs all ten options from 101 to 115 deg.
 *   jetted-flap-6-5cm.svg  draws its pocket mouth at height=6 while calling itself 6.5cm.
 *   square-cuff.svg        draws horizontal edges, and backs cuff-angled, whose
 *                          entire defining feature is a SLANT.
 *
 * This is load-bearing for the whole generation run, and the reason it must be
 * fixed BEFORE any credit is spent:
 *
 *     garment-image-qc scores fidelity TO THE BLUEPRINT. A wrong blueprint is
 *     therefore INVISIBLE to the entire gate — the more faithful the render, the
 *     HIGHER it scores. Two false approvals have already been traced to exactly
 *     this, and two rounds of prompt engineering were spent arguing with a
 *     reference image that was simply the wrong picture.
 *
 * Meanwhile public/images/factory/ holds 8,073 genuine supplier reference images
 * (kute 848 across 54 jacket / 43 shirt categories, baoxiniao 7,222), gitignored
 * and vercelignored as "dev-only scraping reference images".
 *
 * WHAT THIS TOOL WILL AND WILL NOT DECIDE
 * ---------------------------------------
 * It proposes a re-point ONLY on positive, auditable evidence, and records which
 * evidence it used on every single one:
 *
 *   supplier-code   The token before "__" in the filename is a supplier part
 *                   code (090A, 0005, 00JC, 0689, 02B1...). Where that code also
 *                   appears in the option id or label the join is exact and
 *                   self-evidencing: lapel-shawl-0a -> 090A__A_shawl.jpeg.
 *   exact-label     The filename's descriptive part, normalised, equals the
 *                   option label, normalised. "Very slanted" == "Very Slanted".
 *
 * It will NOT fuzzy-match, score similarity, or pick a "closest" drawing. A
 * plausible-but-wrong blueprint is the single most expensive failure mode this
 * project has, precisely because QC cannot see it. Everything the two strategies
 * do not settle is written to the review manifest with its candidate drawings
 * and waits for a human to look at both pictures. Never invent missing tailoring
 * detail; never approximate; never guess.
 *
 * USAGE
 *   node tools/repoint_supplier_blueprints.mjs --list
 *       Inventory the glyph-backed options, grouped by the glyph behind them.
 *
 *   node tools/repoint_supplier_blueprints.mjs --propose
 *       Run the evidence strategies. Writes the proposal + review manifest.
 *
 *   node tools/repoint_supplier_blueprints.mjs --apply
 *       Promote the accepted drawings into the tracked tree and repoint the
 *       catalog. Reads the decisions file; refuses anything not in it.
 *
 * OPTIONS
 *   --decisions=<path>  decisions file (default data-store/blueprint-repoint.json)
 *   --field=<fieldId>   restrict to one catalog field
 *   --limit=<n>         cap the number of re-points applied
 *   --json              machine-readable output
 *
 * SAFETY, inherited from tools/localize_blueprints.mjs and
 * tools/promote_factory_assets.mjs which have both already run clean:
 *   - dry run by default; --apply is explicit
 *   - magic-byte sniffed, so a stray HTML error page can never land as a drawing
 *   - NEVER overwrites an existing destination (an on-disk asset may already back
 *     a QC verdict)
 *   - only ever repoints an option whose CURRENT blueprint is a brand glyph or
 *     missing; an option already carrying a real supplier drawing is left alone
 *   - the previous blueprint is preserved in `glyphIllustration` so nothing is lost
 *   - ledgered to public/images/reports/repoint-supplier-log.json
 *
 * Exit 0 = clean. Exit 1 = a referenced source is missing or unreadable.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const PUBLIC = path.join(REPO, 'public');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const FACTORY = path.join(PUBLIC, 'images', 'factory');
const DEST_REL = 'images/blueprints/supplier';
const DEST_ABS = path.join(PUBLIC, DEST_REL);
const REPORTS = path.join(PUBLIC, 'images', 'reports');
const LEDGER = path.join(REPORTS, 'repoint-supplier-log.json');
const PROPOSAL = path.join(REPORTS, 'repoint-supplier-proposal.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
  })
);
const DECISIONS_PATH = path.join(REPO, typeof args.decisions === 'string' ? args.decisions : 'data-store/blueprint-repoint.json');
const LIMIT = Number(args.limit) > 0 ? Number(args.limit) : Infinity;
const FIELD = typeof args.field === 'string' ? args.field : null;

const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

// ---------------------------------------------------------------------------
// FIELD -> SUPPLIER CATEGORY. Hand-authored, because a wrong mapping here would
// quietly offer chest-pocket drawings as candidates for a lower pocket and a
// reviewer skimming a contact sheet could accept one. Each entry is a decision,
// not a guess; a field with no confident category is simply absent, and its
// options go to review with no candidates rather than with wrong ones.
// ---------------------------------------------------------------------------
const FIELD_CATEGORIES = {
  'lapel-style': ['jacket/Lapel_Lapel_Style'],
  'lapel-bh-style': ['jacket/Lapel_Hole_Style', 'jacket/Lapel_Handmade_lapel_buttonhole'],
  'lapel-bh-position': ['jacket/Lapel_Hole_Position'],
  'lower-pocket': ['jacket/Pocket_Lower_Lower_pocket'],
  'ticket-pocket': ['jacket/Pocket_Lower_Ticket_pocket'],
  'chest-pocket': ['jacket/Pocket_Chest_Chest_pocket', 'jacket/Pocket_Chest_Chest_pocket_design'],
  'inner-pocket': ['jacket/Pocket_Inner_Inside_pocket_shape', 'jacket/Pocket_Inner_Inner-Other'],
  'cuff-style': ['jacket/Sleeve_Cuff_style'],
  'cuff-button-number': ['jacket/Sleeve_Sleeve_bttn'],
  'sleeve-buttonhole': ['jacket/Sleeve_Sleeve_Bttnhole', 'jacket/Sleeve_Buttonhole_design'],
  'elbow-patch': ['jacket/Sleeve_Elbow'],
  'shoulder-shape': ['jacket/Style_Shoulder_Shoulder_shape'],
  'shoulder-pad': ['jacket/Style_Shoulder_Shoulder_pad'],
  'canvas': ['jacket/Style_Canvas'],
  'front-bottom': ['jacket/Style_Front_Bottom'],
  'front-button': ['jacket/Style_Front_bttn'],
  'back-design': ['jacket/Back_design'],
  'lining-style': ['jacket/Lining_Lining_Style'],
  'body-lining': ['jacket/Lining_Body_lining', 'jacket/Lining_Body_lining_Regular_Lining'],
  'sleeve-lining': ['jacket/Lining_Sleeve_lining', 'jacket/Lining_Sleeve_lining_Regular_Lining'],
  'lapel: collar': ['shirt/Collar_Collar_Style'],
  'collar-style': ['shirt/Collar_Collar_Style'],
  'collar-band': ['shirt/Collar_Band', 'shirt/Collar_Band_style'],
  'collar_stand': ['shirt/Collar_Band', 'shirt/Collar_Band_style'],
  'collar-point': ['shirt/Collar_Point', 'shirt/Collar_Point_with_bttn'],
  'collar_stay': ['shirt/Collar_Stay'],
  'collar_linings': ['shirt/Collar_Interlining'],
  'placket_style': ['shirt/Placket_Placket_Style'],
  'placket_width': ['shirt/Placket_Width'],
  'cuff_style': ['shirt/Sleeve_Long_sleeve_Cuff_style'],
  'cuff_height': ['shirt/Sleeve_Long_sleeve_Cuff_height'],
  'cuff_lining': ['shirt/Sleeve_Long_sleeve_Interlining'],
  'sleeve_placket': ['shirt/Sleeve_Long_sleeve_Pleat_style'],
  'pocket_style': ['shirt/Pocket_Style'],
  'pocket_size': ['shirt/Pocket_Size'],
  'pocket_flap': ['shirt/Pocket_Flap'],
  'back_style': ['shirt/Back_Back_Style'],
  hem: ['shirt/Leisure_design_Bottom'],
  'bottom-style': ['trousers/Bottom_Bottom_style'],
};

// ---------------------------------------------------------------------------
// The glyph test. A blueprint is a hand-drawn UI icon, not a tech pack, when it
// is a tiny SVG carrying the storefront's brand colours. Both conditions are
// required: the catalog does contain legitimate SVG line art from the supplier.
// ---------------------------------------------------------------------------
const BRAND_INK = /#?0B1B2E|#?C8BFA8/i;
const GLYPH_MAX_BYTES = 4096;

function isBrandGlyph(webPath) {
  if (typeof webPath !== 'string' || !/\.svg$/i.test(webPath)) return false;
  const abs = path.join(PUBLIC, decodeURIComponent(webPath).replace(/^\//, ''));
  if (!fs.existsSync(abs)) return false;
  const st = fs.statSync(abs);
  if (st.size > GLYPH_MAX_BYTES) return false;
  return BRAND_INK.test(fs.readFileSync(abs, 'utf8'));
}

/** Magic-byte sniff, so a stray HTML error page never lands as a drawing. */
function imageKind(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.toString('binary', 1, 4) === 'PNG') return 'png';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buf.length > 6 && buf.toString('ascii', 0, 3) === 'GIF') return 'gif';
  if (/^\s*<(\?xml|svg)/i.test(buf.toString('utf8', 0, 200))) return 'svg';
  return null;
}

const sanitize = (s) => s.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// Normalise a human string for exact comparison: case, punctuation, separators
// and the decorative degree/cm suffixes all fall away, but WORDS never do.
const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[_\-–—]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ---------------------------------------------------------------------------
// SUPPLIER LIBRARY
// ---------------------------------------------------------------------------
function loadSupplierLibrary() {
  const byCategory = new Map();
  if (!fs.existsSync(FACTORY)) return byCategory;
  for (const supplier of fs.readdirSync(FACTORY)) {
    const supDir = path.join(FACTORY, supplier);
    if (!fs.statSync(supDir).isDirectory()) continue;
    for (const garment of fs.readdirSync(supDir)) {
      const gDir = path.join(supDir, garment);
      if (!fs.existsSync(gDir) || !fs.statSync(gDir).isDirectory()) continue;
      for (const category of fs.readdirSync(gDir)) {
        const cDir = path.join(gDir, category);
        if (!fs.existsSync(cDir) || !fs.statSync(cDir).isDirectory()) continue;
        const key = `${garment}/${category}`;
        const list = byCategory.get(key) || [];
        for (const file of fs.readdirSync(cDir)) {
          const abs = path.join(cDir, file);
          if (!fs.statSync(abs).isFile()) continue;
          // "0689__Notch_with_high_gorge.jpeg" -> code 0689, name "Notch with high gorge"
          const stem = file.replace(/\.[^.]+$/, '');
          const split = stem.split('__');
          const code = split.length > 1 ? split[0] : null;
          const name = (split.length > 1 ? split.slice(1).join('__') : stem).replace(/_/g, ' ');
          list.push({ supplier, garment, category, file, abs, code, name, normName: norm(name) });
        }
        byCategory.set(key, list);
      }
    }
  }
  return byCategory;
}

// ---------------------------------------------------------------------------
// CATALOG
// ---------------------------------------------------------------------------
function loadCatalog() {
  const out = {};
  for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
    const p = path.join(OPTIONS_DIR, file);
    const raw = fs.readFileSync(p, 'utf8');
    out[file] = { path: p, json: JSON.parse(raw), endsWithNewline: raw.endsWith('\n') };
  }
  return out;
}

function eachOption(json, visit) {
  for (const section of json.sections || []) {
    for (const field of section.fields || []) {
      for (const option of field.options || []) {
        if (option && typeof option === 'object') visit(option, field, section);
      }
    }
  }
}

/** Every in-scope option whose blueprint is a brand glyph (or absent). */
function glyphBackedOptions(catalog) {
  const rows = [];
  for (const [file, { json }] of Object.entries(catalog)) {
    const productId = file.replace(/\.json$/, '');
    eachOption(json, (opt, field, section) => {
      if (FIELD && field.id !== FIELD) return;
      const current = opt.techpackIllustration ?? opt.image ?? null;
      if (!isBrandGlyph(current)) return;
      rows.push({
        product: productId,
        section: section.id,
        field: field.id,
        option: opt.id,
        label: opt.label ?? '',
        glyph: current,
        key: `${productId}|${field.id}|${opt.id}`,
      });
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// EVIDENCE STRATEGIES — positive identification only.
// ---------------------------------------------------------------------------

/**
 * A supplier part code carried by the option itself. Codes are alphanumeric
 * tokens like 090A / 0005 / 00JC / 0689 / 02B1. We accept a code only when it
 * appears as a WHOLE TOKEN in the option id or label, because a substring hit
 * ("05" inside "lp-patch-flap-05") means nothing.
 */
function matchBySupplierCode(row, candidates) {
  const tokens = new Set(
    `${row.option} ${row.label}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
  const hits = candidates.filter((c) => c.code && tokens.has(c.code.toLowerCase()));
  return hits.length === 1 ? { file: hits[0], matchedBy: 'supplier-code', evidence: `option carries the supplier code "${hits[0].code}"` } : null;
}

/** The filename's descriptive part, normalised, equals the option label. */
function matchByExactLabel(row, candidates) {
  const target = norm(row.label);
  if (!target) return null;
  const hits = candidates.filter((c) => c.normName === target);
  return hits.length === 1
    ? { file: hits[0], matchedBy: 'exact-label', evidence: `label "${row.label}" equals supplier drawing name "${hits[0].name}"` }
    : null;
}

const STRATEGIES = [matchBySupplierCode, matchByExactLabel];

// ---------------------------------------------------------------------------
// PROPOSE
// ---------------------------------------------------------------------------
function propose() {
  const catalog = loadCatalog();
  const library = loadSupplierLibrary();
  const rows = glyphBackedOptions(catalog);

  const matched = [];
  const review = [];
  for (const row of rows) {
    const categories = FIELD_CATEGORIES[row.field] || [];
    const candidates = categories.flatMap((c) => library.get(c) || []);

    let hit = null;
    for (const strategy of STRATEGIES) {
      hit = strategy(row, candidates);
      if (hit) break;
    }

    if (hit) {
      matched.push({ ...row, source: rel(hit.file.abs), supplierCode: hit.file.code, supplierName: hit.file.name, matchedBy: hit.matchedBy, evidence: hit.evidence });
    } else {
      review.push({
        ...row,
        categories,
        candidateCount: candidates.length,
        // The reviewer needs the actual options, not a similarity score.
        candidates: candidates.map((c) => ({ code: c.code, name: c.name, path: rel(c.abs) })),
        why: categories.length === 0
          ? `no supplier category is mapped for field "${row.field}" — FIELD_CATEGORIES has no entry, deliberately, rather than a guessed one`
          : 'neither the supplier-code nor the exact-label strategy identified a single drawing; a human must compare the pictures',
      });
    }
  }

  // Group the review by (field, glyph) — that is the unit a person can actually
  // sit down and rule on, and it keeps 474 rows from reading as 474 decisions.
  const groups = new Map();
  for (const r of review) {
    const k = `${r.field} <- ${r.glyph}`;
    if (!groups.has(k)) groups.set(k, { field: r.field, glyph: r.glyph, categories: r.categories, candidates: r.candidates, options: [] });
    groups.get(k).options.push({ product: r.product, option: r.option, label: r.label, key: r.key });
  }

  return { rows, matched, review, groups: [...groups.values()].sort((a, b) => b.options.length - a.options.length) };
}

// ---------------------------------------------------------------------------
// APPLY
// ---------------------------------------------------------------------------
function apply(decisions) {
  const catalog = loadCatalog();
  const rows = glyphBackedOptions(catalog);
  const byKey = new Map(rows.map((r) => [r.key, r]));

  const missing = [];
  const skipped = [];
  const plan = [];

  for (const d of decisions) {
    if (plan.length >= LIMIT) break;
    const row = byKey.get(d.key);
    if (!row) {
      // Either already repointed (so no longer glyph-backed) or the option moved.
      skipped.push({ key: d.key, reason: 'not currently glyph-backed — already repointed, or the option no longer exists' });
      continue;
    }
    const srcAbs = path.isAbsolute(d.source) ? d.source : path.join(REPO, d.source);
    if (!fs.existsSync(srcAbs)) {
      missing.push({ key: d.key, source: d.source, reason: 'source drawing not on disk' });
      continue;
    }
    const buf = fs.readFileSync(srcAbs);
    const kind = imageKind(buf);
    if (!kind) {
      missing.push({ key: d.key, source: d.source, reason: 'not a recognisable image (magic-byte sniff failed)' });
      continue;
    }
    // Key the destination name on the SOURCE path, so one drawing cited by many
    // options is promoted exactly once and they all share it.
    const base = sanitize(path.basename(d.source).replace(/\.[^.]+$/, ''));
    const name = `${sha1(d.source).slice(0, 12)}__${base}.${kind}`;
    plan.push({
      ...row,
      source: d.source,
      matchedBy: d.matchedBy ?? 'decision-file',
      evidence: d.evidence ?? null,
      srcAbs,
      destAbs: path.join(DEST_ABS, name),
      to: `/${DEST_REL}/${name}`,
      bytes: buf.length,
      kind,
    });
  }

  if (!args.apply) return { plan, missing, skipped, copied: 0, reused: 0, repointed: 0 };

  fs.mkdirSync(DEST_ABS, { recursive: true });
  let copied = 0;
  let reused = 0;
  for (const p of plan) {
    if (fs.existsSync(p.destAbs)) {
      reused += 1; // never overwrite — an on-disk asset may already back a QC verdict
    } else {
      fs.copyFileSync(p.srcAbs, p.destAbs);
      copied += 1;
    }
  }

  const byKeyPlan = new Map(plan.map((p) => [p.key, p]));
  const touched = new Set();
  let repointed = 0;
  for (const [file, entry] of Object.entries(catalog)) {
    const productId = file.replace(/\.json$/, '');
    eachOption(entry.json, (opt, field) => {
      const p = byKeyPlan.get(`${productId}|${field.id}|${opt.id}`);
      if (!p) return;
      // Preserve what was there. The glyph is still what the BUILDER UI shows;
      // only the generation reference changes.
      const previous = opt.techpackIllustration ?? opt.image ?? null;
      if (previous && !opt.glyphIllustration) opt.glyphIllustration = previous;
      opt.techpackIllustration = p.to;
      repointed += 1;
      touched.add(file);
    });
  }
  for (const file of touched) {
    const e = catalog[file];
    fs.writeFileSync(e.path, JSON.stringify(e.json, null, 2) + (e.endsWithNewline ? '\n' : ''));
  }

  fs.mkdirSync(REPORTS, { recursive: true });
  fs.writeFileSync(
    LEDGER,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        by: 'tools/repoint_supplier_blueprints.mjs',
        rule: 'A re-point is applied only from the decisions file, only to an option whose current blueprint is a brand glyph, and only from a magic-byte-verified source. The previous glyph is preserved in glyphIllustration.',
        copied,
        reused,
        repointed,
        missing,
        skipped,
        entries: plan.map(({ key, product, field, option, label, glyph, source, to, matchedBy, evidence, bytes, kind }) => ({
          key, product, field, option, label, from: glyph, source, to, matchedBy, evidence, bytes, kind,
        })),
      },
      null,
      2
    ) + '\n'
  );

  return { plan, missing, skipped, copied, reused, repointed, touched: [...touched] };
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
function main() {
  if (args.list) {
    const rows = glyphBackedOptions(loadCatalog());
    const byGlyph = new Map();
    for (const r of rows) {
      const k = `${r.glyph}`;
      if (!byGlyph.has(k)) byGlyph.set(k, []);
      byGlyph.get(k).push(r);
    }
    const sorted = [...byGlyph.entries()].sort((a, b) => b[1].length - a[1].length);
    if (args.json) {
      console.log(JSON.stringify({ glyphs: sorted.length, options: rows.length, byGlyph: Object.fromEntries(sorted) }, null, 2));
      return 0;
    }
    console.log(`repoint_supplier_blueprints --list\n${sorted.length} UI glyph(s) backing ${rows.length} in-scope option(s)\n`);
    for (const [glyph, list] of sorted) {
      const fields = [...new Set(list.map((r) => r.field))].join(', ');
      console.log(`  ${String(list.length).padStart(3)}  ${glyph}   [${fields}]`);
    }
    return 0;
  }

  if (args.apply || args.decisions || fs.existsSync(DECISIONS_PATH)) {
    if (!fs.existsSync(DECISIONS_PATH)) {
      console.error(`No decisions file at ${rel(DECISIONS_PATH)}. Run --propose first, review it, then --apply.`);
      return 1;
    }
    const decisions = JSON.parse(fs.readFileSync(DECISIONS_PATH, 'utf8'));
    const list = Array.isArray(decisions) ? decisions : decisions.decisions || [];
    const r = apply(list);
    console.log(`repoint_supplier_blueprints ${args.apply ? '--apply' : '(dry run)'}\n`);
    console.log(`  ${r.plan.length} re-point(s) planned from ${list.length} decision(s)`);
    for (const p of r.plan.slice(0, 15)) {
      console.log(`    ${p.product}/${p.field}/${p.option}  "${p.label}"`);
      console.log(`      ${p.glyph}  ->  ${p.source}   [${p.matchedBy}]`);
    }
    if (r.plan.length > 15) console.log(`    … ${r.plan.length - 15} more`);
    if (r.skipped.length) {
      console.log(`\n  ${r.skipped.length} skipped:`);
      for (const s of r.skipped.slice(0, 8)) console.log(`    ${s.key} — ${s.reason}`);
    }
    if (r.missing.length) {
      console.log(`\n  ${r.missing.length} REFUSED (cannot promote):`);
      for (const m of r.missing) console.log(`    ${m.key} <- ${m.source} — ${m.reason}`);
    }
    if (args.apply) {
      console.log(`\ncopied ${r.copied}, reused ${r.reused}, repointed ${r.repointed} option(s) across ${r.touched.length} catalog file(s)`);
      console.log(`ledger: ${rel(LEDGER)}`);
      console.log('Re-run: node tools/project_state.mjs');
    } else {
      console.log(`\nDry run. Re-run with --apply.`);
    }
    return r.missing.length ? 1 : 0;
  }

  // --propose (the default)
  const { rows, matched, review, groups } = propose();
  fs.mkdirSync(REPORTS, { recursive: true });
  fs.writeFileSync(
    PROPOSAL,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        by: 'tools/repoint_supplier_blueprints.mjs --propose',
        rule: 'Proposals come ONLY from positive identification (supplier code, or exact label equality). Nothing is fuzzy-matched. Everything else is listed for human review with its candidate drawings, because a plausible-but-wrong blueprint is invisible to garment-image-qc — it scores fidelity TO the blueprint.',
        glyphBackedOptions: rows.length,
        autoMatched: matched.length,
        needsReview: review.length,
        decisions: matched.map(({ key, product, field, option, label, glyph, source, supplierCode, supplierName, matchedBy, evidence }) => ({
          key, product, field, option, label, from: glyph, source, supplierCode, supplierName, matchedBy, evidence,
        })),
        review: groups,
      },
      null,
      2
    ) + '\n'
  );

  console.log(`repoint_supplier_blueprints --propose\n`);
  console.log(`  ${rows.length} glyph-backed option(s)`);
  console.log(`  ${matched.length} positively identified`);
  console.log(`  ${review.length} need a human to compare the pictures\n`);
  for (const m of matched) {
    console.log(`  ${m.product}/${m.field}/${m.option}  "${m.label}"`);
    console.log(`      -> ${m.source}`);
    console.log(`         [${m.matchedBy}] ${m.evidence}`);
  }
  console.log(`\n  REVIEW QUEUE, grouped by the glyph that must be replaced:`);
  for (const g of groups.slice(0, 20)) {
    console.log(`    ${String(g.options.length).padStart(3)} option(s)  ${g.field}  <- ${g.glyph}`);
    console.log(`         ${g.candidates.length} candidate drawing(s) in ${g.categories.join(', ') || '(no mapped category)'}`);
  }
  if (groups.length > 20) console.log(`    … ${groups.length - 20} more group(s)`);
  console.log(`\nwrote ${rel(PROPOSAL)}`);
  console.log(`Review it, write the accepted rows to ${rel(DECISIONS_PATH)}, then --apply.`);
  return 0;
}

process.exit(main());
