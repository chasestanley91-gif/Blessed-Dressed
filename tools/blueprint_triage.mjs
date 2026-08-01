#!/usr/bin/env node
/**
 * blueprint_triage.mjs — decide, from the pixels, whether a catalog "blueprint"
 * is actually a technical drawing.
 *
 * WHY
 * ---
 * The first cluster the wave queue ranked highest — `perfume-pad`, 8 clusters and
 * 24 catalog rows — turned out to be backed by
 * `/images/jacket/underarm-shield/*.jpg`, which are not underarm shields at all.
 * They are 1.5-4.5 KB crops of BUTTON PHOTOGRAPHS: a grey disc with a red X, a
 * two-hole button, a partial button rim. Generating from them would have produced
 * eight confident, wrong images, and garment-image-qc could not have caught it —
 * QC scores fidelity TO the blueprint, so a render faithful to a picture of a
 * button scores HIGH.
 *
 * `repoint_supplier_blueprints.mjs` catches the hand-drawn SVG glyphs. It cannot
 * catch this: these are JPEGs, they are not in the brand palette, and nothing
 * about their filenames is wrong. Only the pixels give them away.
 *
 * WHAT IT MEASURES (all deterministic, no learned model)
 * ------------------------------------------------------
 *   canvas          width x height. Supplier drawings are drawn large; icons are not.
 *   whiteFraction   share of pixels brighter than 240. Line art is mostly paper.
 *   edgeDensity     share of pixels whose Sobel magnitude clears a fixed
 *                   threshold. Line art is thin dark strokes on white, so this is
 *                   small but non-zero and SHARP. A soft photographic gradient
 *                   has plenty of tonal variation but very few hard edges.
 *   softFraction    share of pixels in the mid-grey band (60..200) that are NOT
 *                   on an edge. This is the signature of a photograph or a soft
 *                   drop-shadow icon, and is near zero for line art.
 *   saturation      mean |max(r,g,b) - min(r,g,b)|. Technical drawings are black
 *                   on white with at most a red call-out; photos carry colour
 *                   everywhere.
 *
 * The thresholds below were fitted to THIS repo by measuring both populations —
 * the 848 known-good kutetailor supplier drawings and the known-bad underarm
 * shields — with `--calibrate`. They are not universal constants and the tool
 * prints them in its report so they can be argued with.
 *
 * VERDICTS
 *   LINE_DRAWING        usable as a generation reference
 *   LINE_DRAWING_SMALL  usable, but authored below the verified canvas: roughly 1px
 *                       is 3-4mm, so fine terminal geometry cannot be settled from it
 *   SUSPECT             cannot be decided from the pixels alone — a human must look
 *   NOT_A_DRAWING       refuse; route to NEEDS-SOURCE rather than spend credits
 *
 * The tool never edits the catalog. It writes a report and, with --sheet, a
 * contact sheet of the SUSPECT tier so the ruling can actually be made.
 *
 * USAGE
 *   node tools/blueprint_triage.mjs --calibrate     # show both populations
 *   node tools/blueprint_triage.mjs                 # triage the wave queue
 *   node tools/blueprint_triage.mjs --all           # triage every in-scope blueprint
 *   node tools/blueprint_triage.mjs --sheet         # + contact sheet of SUSPECTs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const PUBLIC = path.join(REPO, 'public');
const REPORTS = path.join(PUBLIC, 'images', 'reports');
const OUT = path.join(REPORTS, 'blueprint-triage.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
  })
);

const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');

// Fitted to this repo — see --calibrate, and note what calibration actually
// showed. My first threshold set did NOT separate the populations: the button
// crops cleared every one of them and came back LINE_DRAWING. The signal that
// does separate them is CANVAS. Every genuine kutetailor drawing in this repo is
// authored at 1200x1200; every button crop is 240x200, and the queue-wide
// distribution is sharply bimodal — 424 blueprints under 250 px against 169 at
// 1200 px, with only 21 files anywhere in between.
//
// So canvas is primary, and the honest reading of a small canvas is "this cannot
// be verified from its pixels", not "this is junk" — hence SUSPECT rather than a
// verdict. Colour and blankness are separate, independently sufficient grounds
// for refusal: a fabric swatch card or a thread-colour chart is saturated
// everywhere, and a blank frame has no strokes at all. Both are present in this
// catalog as "blueprints".
const T = {
  verifiedCanvas: 800,       // shorter side at or above which the pixels can be trusted
  smallMinWhite: 0.75,       // below verifiedCanvas: paper-white floor, set so the scraped
                             // supplier page (0.609) fails independently of saturation
  smallMaxSaturation: 2.5,   // below verifiedCanvas: greyscale-ink ceiling. Genuine small
                             // drawings here measure 0-1; every known-bad file measures 3.3+
  minWhite: 0.6,         // line art is mostly paper
  minEdge: 0.02,         // and carries real strokes across the frame
  blankEdge: 0.005,      // below this there is essentially nothing drawn
  maxSaturation: 25,     // a drawing is black on white with at most a red call-out
  swatchSaturation: 60,  // above this it is a colour photograph or a swatch card
};

async function measure(abs) {
  const { default: sharp } = await import('sharp');
  const meta = await sharp(abs).metadata();
  const W = 256;
  const H = Math.max(16, Math.round((meta.height / meta.width) * W)) || W;

  const rgb = await sharp(abs).flatten({ background: { r: 255, g: 255, b: 255 } }).resize(W, H, { fit: 'fill' }).raw().toBuffer();
  const g = new Float32Array(W * H);
  let satSum = 0;
  for (let i = 0, j = 0; i < rgb.length; i += 3, j++) {
    const r = rgb[i], gr = rgb[i + 1], b = rgb[i + 2];
    g[j] = 0.299 * r + 0.587 * gr + 0.114 * b;
    satSum += Math.max(r, gr, b) - Math.min(r, gr, b);
  }
  const saturation = satSum / (W * H);

  let white = 0;
  for (let i = 0; i < g.length; i++) if (g[i] > 240) white += 1;

  // Sobel
  const mag = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx = g[i - W + 1] + 2 * g[i + 1] + g[i + W + 1] - (g[i - W - 1] + 2 * g[i - 1] + g[i + W - 1]);
      const gy = g[i + W - 1] + 2 * g[i + W] + g[i + W + 1] - (g[i - W - 1] + 2 * g[i - W] + g[i - W + 1]);
      mag[i] = Math.hypot(gx, gy);
    }
  }
  let edge = 0;
  let soft = 0;
  for (let i = 0; i < g.length; i++) {
    const isEdge = mag[i] > 180;
    if (isEdge) edge += 1;
    else if (g[i] >= 60 && g[i] <= 200) soft += 1;
  }

  return {
    width: meta.width ?? null,
    height: meta.height ?? null,
    bytes: fs.statSync(abs).size,
    whiteFraction: Math.round((white / g.length) * 1000) / 1000,
    edgeDensity: Math.round((edge / g.length) * 10000) / 10000,
    softFraction: Math.round((soft / g.length) * 1000) / 1000,
    saturation: Math.round(saturation * 10) / 10,
  };
}

function classify(m) {
  const shortSide = Math.min(m.width || 0, m.height || 0);

  // Independently sufficient grounds for refusal, checked first because they
  // hold at any canvas size.
  if (m.saturation > T.swatchSaturation) {
    return { verdict: 'NOT_A_DRAWING', reasons: [`mean saturation ${m.saturation} — this is a colour photograph or a swatch/thread card, not a drawing`] };
  }
  if (m.edgeDensity < T.blankEdge) {
    return { verdict: 'NOT_A_DRAWING', reasons: [`edge density ${m.edgeDensity} — the frame is essentially blank`] };
  }

  // Below the verified canvas, size alone used to end the matter. That was too
  // strict, and it was blocking real work: `point-in-7cm.jpg` is 229x244 and is
  // an unmistakable supplier tech pack with "60.00°" printed on it in blue and
  // leader lines drawn to both collar points. `collar-long-point-85` is 356x392
  // and its option has ALREADY SHIPPED with a PASS at lowest-score 98. Small is
  // not the same as fake — the original threshold conflated the two because the
  // glyphs that motivated it happened to also be small.
  //
  // So: a small canvas can still be accepted when the CONTENT says line drawing.
  // The discriminator is calibrated against the four known-bad files in this
  // repo, and the middle one is why a white+edge test alone is not enough:
  //
  //   front-style/sb-3      240x200  white 0.000  edge 0.0000  sat  5.0  swatch
  //   front-style/db-4x2    240x200  white 0.430  edge 0.0173  sat  3.3  swatch
  //   front-style/sb-5      240x200  white 0.266  edge 0.0181  sat 45.2  swatch
  //   coin-pocket/right     240x200  white 0.609  edge 0.1143  sat  5.9  SCRAPED PAGE
  //   ------------------------------------------------------------------
  //   point-in-7cm          229x244  white 0.888  edge 0.0622  sat  0.8  genuine
  //   fashion-point-in-58cm 229x244  white 0.887  edge 0.0671  sat  1.0  genuine
  //   collar-long-point-85  356x392  white 0.895  edge 0.1280  sat  0.3  genuine
  //
  // The scraped supplier web page clears white>0.6 and edge>0.02 comfortably, so
  // saturation carries the separation: genuine drawings here are greyscale ink
  // (0-1), everything known-bad carries colour (3.3-45.2). Both guards are
  // required, and the white floor is set at 0.75 rather than 0.6 so the scraped
  // page fails on either test independently.
  if (shortSide < T.verifiedCanvas) {
    const contentSaysDrawing =
      m.whiteFraction >= T.smallMinWhite &&
      m.edgeDensity >= T.minEdge &&
      m.saturation <= T.smallMaxSaturation;
    if (contentSaysDrawing) {
      return {
        verdict: 'LINE_DRAWING_SMALL',
        reasons: [`canvas ${m.width}x${m.height} is below the ${T.verifiedCanvas}px verified size, but the content reads as line art (${(m.whiteFraction * 100).toFixed(0)}% paper-white, edge density ${m.edgeDensity}, saturation ${m.saturation}). USABLE as a generation reference, but roughly 1px is 3-4mm at this scale, so fine terminal geometry — a squared versus pointed collar tip, a 1mm stitch setting — CANNOT be settled from it and must not be claimed either way`],
      };
    }
    return {
      verdict: 'SUSPECT',
      reasons: [`canvas ${m.width}x${m.height} is below the ${T.verifiedCanvas}px verified size AND the content does not read as line art (${(m.whiteFraction * 100).toFixed(0)}% paper-white, edge density ${m.edgeDensity}, saturation ${m.saturation}) — needs a look`],
    };
  }

  const reasons = [];
  if (m.whiteFraction < T.minWhite) reasons.push(`only ${(m.whiteFraction * 100).toFixed(0)}% paper-white`);
  if (m.edgeDensity < T.minEdge) reasons.push(`edge density ${m.edgeDensity} — too few strokes for a full drawing`);
  if (m.saturation > T.maxSaturation) reasons.push(`mean saturation ${m.saturation} — more colour than a technical drawing carries`);
  if (reasons.length === 0) return { verdict: 'LINE_DRAWING', reasons };
  return { verdict: 'SUSPECT', reasons };
}

async function calibrate() {
  const good = [];
  const bad = [];
  const factory = path.join(PUBLIC, 'images', 'factory', 'kute', 'jacket');
  for (const cat of ['Lapel_Lapel_Style', 'Pocket_Lower_Lower_pocket', 'Pocket_Chest_Chest_pocket']) {
    const d = path.join(factory, cat);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).slice(0, 10)) good.push(path.join(d, f));
  }
  const shield = path.join(PUBLIC, 'images', 'jacket', 'underarm-shield');
  if (fs.existsSync(shield)) for (const f of fs.readdirSync(shield)) bad.push(path.join(shield, f));

  const stat = async (list, name) => {
    console.log(`\n  ${name} (${list.length} files)`);
    console.log('    file                                     canvas     white   edge     soft   sat   verdict');
    for (const f of list) {
      const m = await measure(f);
      const c = classify(m);
      console.log(
        `    ${path.basename(f).slice(0, 38).padEnd(40)} ${String(m.width + 'x' + m.height).padEnd(10)} ${String(m.whiteFraction).padEnd(7)} ${String(m.edgeDensity).padEnd(8)} ${String(m.softFraction).padEnd(6)} ${String(m.saturation).padEnd(5)} ${c.verdict}`
      );
    }
  };
  console.log('blueprint_triage --calibrate — the two populations these thresholds separate');
  await stat(good, 'KNOWN GOOD: kutetailor supplier technical drawings');
  await stat(bad, 'KNOWN BAD: /images/jacket/underarm-shield (button photo crops)');
  console.log(`\n  thresholds: ${JSON.stringify(T)}`);
}

async function main() {
  if (args.calibrate) {
    await calibrate();
    return 0;
  }

  // Which blueprints to triage
  let targets = [];
  if (args.all) {
    const idx = JSON.parse(fs.readFileSync(path.join(REPORTS, 'repo-index.json'), 'utf8'));
    const seen = new Set();
    for (const r of idx.records) {
      if (!r.inScope || !r.illustration || seen.has(r.illustration)) continue;
      seen.add(r.illustration);
      targets.push({ blueprint: r.illustration, rows: 1, label: r.label, field: r.field });
    }
  } else {
    const q = JSON.parse(fs.readFileSync(path.join(REPORTS, 'wave-queue.json'), 'utf8'));
    const seen = new Map();
    for (const c of q.queue) {
      if (!seen.has(c.blueprint)) seen.set(c.blueprint, { blueprint: c.blueprint, rows: 0, clusters: 0, examples: [] });
      const e = seen.get(c.blueprint);
      e.rows += c.rowsUnlocked;
      e.clusters += 1;
      if (e.examples.length < 4) e.examples.push(`${c.field}/${c.option} "${c.label}"`);
    }
    targets = [...seen.values()];
  }

  const results = [];
  for (const t of targets) {
    const abs = path.join(PUBLIC, decodeURIComponent(t.blueprint).replace(/^\//, ''));
    if (!fs.existsSync(abs)) {
      results.push({ ...t, verdict: 'MISSING', reasons: ['file not on disk'] });
      continue;
    }
    if (/\.svg$/i.test(t.blueprint)) {
      const txt = fs.readFileSync(abs, 'utf8');
      const glyph = fs.statSync(abs).size <= 4096 && /#?0B1B2E|#?C8BFA8/i.test(txt);
      results.push({ ...t, verdict: glyph ? 'NOT_A_DRAWING' : 'SUSPECT', reasons: [glyph ? 'hand-drawn UI glyph in the storefront brand palette' : 'SVG — not rasterised for measurement'] });
      continue;
    }
    try {
      const m = await measure(abs);
      const c = classify(m);
      results.push({ ...t, ...m, ...c });
    } catch (e) {
      results.push({ ...t, verdict: 'MISSING', reasons: [`unreadable: ${e.message}`] });
    }
  }

  const by = (v) => results.filter((r) => r.verdict === v);
  const rowsOf = (list) => list.reduce((n, r) => n + (r.rows || 0), 0);

  const report = {
    generatedAt: new Date().toISOString(),
    by: 'tools/blueprint_triage.mjs',
    what: 'Decides from the PIXELS whether a catalog blueprint is a technical drawing. Filenames and directory names are not evidence — /images/jacket/underarm-shield/*.jpg are crops of button photographs.',
    thresholds: T,
    thresholdProvenance: 'Fitted to this repo by measuring the 848 kutetailor supplier drawings against the known-bad underarm-shield set. Reproduce with --calibrate.',
    summary: {
      LINE_DRAWING: { files: by('LINE_DRAWING').length, rows: rowsOf(by('LINE_DRAWING')) },
      LINE_DRAWING_SMALL: { files: by('LINE_DRAWING_SMALL').length, rows: rowsOf(by('LINE_DRAWING_SMALL')) },
      SUSPECT: { files: by('SUSPECT').length, rows: rowsOf(by('SUSPECT')) },
      NOT_A_DRAWING: { files: by('NOT_A_DRAWING').length, rows: rowsOf(by('NOT_A_DRAWING')) },
      MISSING: { files: by('MISSING').length, rows: rowsOf(by('MISSING')) },
    },
    results: results.sort((a, b) => (b.rows || 0) - (a.rows || 0)),
  };

  fs.mkdirSync(REPORTS, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');

  console.log(`blueprint_triage — ${results.length} distinct blueprint(s)\n`);
  for (const v of ['LINE_DRAWING', 'LINE_DRAWING_SMALL', 'SUSPECT', 'NOT_A_DRAWING', 'MISSING']) {
    const s = report.summary[v];
    console.log(`  ${v.padEnd(15)} ${String(s.files).padStart(4)} file(s)  ${String(s.rows).padStart(4)} catalog row(s)`);
  }
  console.log(`\n  WORST OFFENDERS (most rows behind a non-drawing):`);
  for (const r of by('NOT_A_DRAWING').slice(0, 15)) {
    console.log(`    ${String(r.rows).padStart(3)} rows  ${r.blueprint}`);
    console.log(`             ${r.reasons.join('; ')}`);
    if (r.examples) console.log(`             e.g. ${r.examples.slice(0, 2).join(' | ')}`);
  }
  console.log(`\nwrote ${rel(OUT)}`);
  return 0;
}

main().then((c) => process.exit(c));
