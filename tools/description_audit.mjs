#!/usr/bin/env node
// description_audit.mjs — find catalog descriptions that will sabotage their own
// photograph, before a credit is spent on them.
//
// WHY THIS EXISTS. The description is an INPUT to the prompt, not documentation
// of it: tech-pack-interpreter derives dimensions, angles, counts and
// construction flags from description text, and that text reaches the generator.
// So a sentence in the catalog is an instruction to the camera. This has now been
// demonstrated, not assumed — jeans-arc's description said the pocket mouth ran
// "down to the side seam", the generator put it on the side seam, and correcting
// the sentence moved inboard travel from 0 to 0.78 belt-loop pitches against a
// drawn 0.78, with nothing else in the pipeline changed.
//
// Every pattern below is derived from a defect that actually happened here:
//
//   OCCLUDER          a necktie once covered the band, spread and top button
//                     across 216 clusters. cp-welt-25 still says the pocket
//                     "allows a generous display of pocket square" - over the
//                     welt that is the entire subject of the photograph.
//   EXCLUDED_SHAPE    naming the shape an option is NOT produced
//                     ["curved hem","straight hem"] from "Straight Hem", and the
//                     generator drew both. lp-slanted-flap-55 says the flap can
//                     be "tucked in to reveal a pure besom pocket".
//   CLOSURE_ASSERTED  the drawing decides buttoned/open, never the prose.
//   NO_GEOMETRY       lapel-shawl-0005 offers "micro-differences ... visible to
//                     the educated eye" - nothing a camera can be pointed at.
//   DUPLICATE_PROSE   lp-straight-jetted carries lp-straight-jetted-40's text
//                     verbatim, asserting a flap over a besom blueprint. Two
//                     options with identical prose cannot render differently.
//   UNLABELLED_FIGURE a measurement in the prose that the label does not carry.
//                     "68 degrees" in a label was not a measurement of the
//                     drawing and cost four generations; prose figures are the
//                     same hazard one step earlier.
//
// This flags candidates for a human read. It does NOT rewrite anything and it
// does not claim a flagged row is wrong - OCCLUDER on a "pocket square" option
// would be correct, for instance. Read the drawing before acting on any hit.
//
// Usage: node tools/description_audit.mjs [--product suit-2pc] [--ids a,b,c] [--json]

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'data-store/options');
const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const onlyProduct = arg('--product');
const onlyIds = arg('--ids') ? new Set(arg('--ids').split(',').map((s) => s.trim())) : null;

// Accessories that would sit ON TOP of a showcased feature. Scoped to the parts
// they can actually occlude, so a tie mentioned on a trouser option is not
// flagged and a pocket square on a breast-pocket option is.
const OCCLUDERS = [
  { re: /\bpocket square|\bhandkerchief|\bpuff fold|\bsquare\b(?=[^.]*\b(?:display|arch|fold|peek))/i, hides: /welt|chest|breast|cp-/i, what: 'pocket square over a breast-pocket feature' },
  { re: /\bnecktie\b|\btie\b(?!\s*(?:tack|bar|clip))|\bcravat|\bbow ?tie/i, hides: /collar|placket|band|spread|neck|throat|coll-/i, what: 'necktie over a collar/placket feature' },
  { re: /\bscarf|\bmuffler/i, hides: /collar|lapel|neck/i, what: 'scarf over a collar/lapel feature' },
  { re: /\bboutonniere|\blapel flower|\bbuttonhole flower/i, hides: /lapel|bh-|buttonhole/i, what: 'flower over a lapel buttonhole' },
  { re: /\bwatch chain|\bpocket watch/i, hides: /vest|waistcoat|wc-/i, what: 'watch chain over a waistcoat feature' },
  { re: /\bcufflink/i, hides: /cuff/i, what: 'cufflink over a cuff feature' },
  { re: /\bbelt\b(?! ?loop)/i, hides: /waistband|wb-|adjuster/i, what: 'belt over a waistband feature' },
];

// Naming what the option is NOT, or what it turns into. Both put the excluded
// shape into the generator's head.
const EXCLUDED_SHAPE = [
  { re: /\btucked in\b[^.]*\breveal/i, what: '"tucked in ... reveals" describes a second, different pocket' },
  { re: /\bcan be (?:tucked|worn|left|folded)\b[^.]*\b(?:instead|underneath|beneath)/i, what: 'describes an alternate state of the same option' },
  { re: /\b(?:unlike|as opposed to|in contrast to|rather than) (?:a|the|its)\b/i, what: 'explicitly contrasts against another shape' },
  { re: /\bnotch-free\b|\bwithout a notch\b|\bno notch\b/i, what: 'names the notch it lacks' },
  { re: /\bpresents as\b|\breads as a\b[^.]*\bpocket\b/i, what: 'says the option presents as a different feature' },
  // Both of these were MISSED by the first version of this rule and found by hand.
  // cp-trapezoid said it "departs from both the rectangle and the arc" — naming
  // two sibling shapes, and the word "arc" alone was enough to make spec
  // extraction emit a spurious `arc buttonhole`. lp-straight-jetted-40 said it was
  // "more formal than the slanted hacking pocket", naming a third.
  { re: /\bdeparts? from (?:both )?(?:the|a)\b[^.]{0,70}/i, what: 'names the shape(s) it departs from' },
  { re: /\b(?:more|less) \w+ than (?:a|the)\b[^.]{0,60}/i, what: 'compares against a named sibling shape' },
];

// CLOSURE is the pattern most prone to false positives, because "open" and
// "closed" are ordinary tailoring vocabulary that has nothing to do with whether
// the garment is fastened: a collar has an OPEN ROLL, a weave is an OPEN weave, a
// pocket has a CLOSED mouth. The first draft of this rule flagged "the roll is
// pressed soft and open" as a closure assertion, which is wrong. So the word must
// sit next to a garment-front noun, and must NOT sit next to a construction noun
// that legitimately owns it.
const CLOSURE_NEAR = /\b(?:jacket|coat|front|fronts|quarters|waistcoat|vest|garment)\b/i;
const CLOSURE_OWNED = /\b(?:roll|rolled|weave|woven|pressed|mouth|seam|stitch|hem|edge|cuff|collar stand|drape|hand)\b/i;
const CLOSURE = [
  { re: /\b(?:fully )?(?:buttoned|fastened|done up)\b[^.]{0,40}/i, what: 'asserts a closed/buttoned state the drawing must decide', ctx: true },
  { re: /\b(?:worn\s+)?(?:unbuttoned|undone)\b[^.]{0,40}/i, what: 'asserts an unbuttoned state the drawing must decide', ctx: true },
  { re: /\bworn open\b[^.]{0,40}|\bhangs? open\b[^.]{0,40}/i, what: 'asserts an open state the drawing must decide', ctx: false },
];

// Words that describe a photographable thing. A description with none of these
// cannot direct a camera.
const GEOMETRY = /\b(?:cm|mm|degree|angle|width|wide|deep|depth|height|tall|long|length|edge|seam|stitch|corner|curve|curved|straight|round|rounded|point|pointed|square|slant|angled|parallel|taper|radius|horizontal|vertical|centre|center|flap|jet|welt|button|hole|pleat|dart|vent|hem|cuff|collar|lapel|placket|pocket|band|strip|panel|fold|roll|crease|top|bottom|inch)\b/i;
const VAGUE = /\b(?:educated eye|discerning|subtle(?:ly)?|micro-difference|personality|signature|sophisticat|elegan|refined|timeless|old-money|understat|communicates|conveys|air of|sense of)\b/i;

const FIGURE = /(\d+(?:\.\d+)?)\s*(cm|mm|degrees?|°|inch(?:es)?|")/gi;

const rows = [];
for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.json')) continue;
  const product = f.replace(/\.json$/, '');
  if (onlyProduct && product !== onlyProduct) continue;
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const seen = new Set();
  const walk = (n, field) => {
    if (Array.isArray(n)) return n.forEach((x) => walk(x, field));
    if (!n || typeof n !== 'object') return;
    const nextField = n.id && Array.isArray(n.options) ? n.id : field;
    if (n.id && typeof n.description === 'string' && !seen.has(n.id)) {
      seen.add(n.id);
      rows.push({ product, field: field || '', id: n.id, label: n.label || '', description: n.description });
    }
    for (const v of Object.values(n)) walk(v, nextField);
  };
  walk(j, null);
}

const scoped = rows.filter((r) => !onlyIds || onlyIds.has(r.id));
const byText = new Map();
for (const r of scoped) {
  const k = r.description.trim();
  if (!byText.has(k)) byText.set(k, []);
  byText.get(k).push(r);
}

const findings = [];
for (const r of scoped) {
  const hay = `${r.id} ${r.field} ${r.label}`;
  const d = r.description;
  const hits = [];

  // Every hit carries the text it matched. A tool whose output drives catalog
  // rewrites has to show its evidence, or its false positives become edits.
  const snip = (re) => { const m = d.match(re); return m ? m[0].trim().replace(/\s+/g, ' ').slice(0, 90) : null; };

  for (const o of OCCLUDERS) if (o.re.test(d) && o.hides.test(hay)) hits.push({ kind: 'OCCLUDER', what: o.what, matched: snip(o.re) });
  for (const e of EXCLUDED_SHAPE) if (e.re.test(d)) hits.push({ kind: 'EXCLUDED_SHAPE', what: e.what, matched: snip(e.re) });
  for (const c of CLOSURE) {
    const m = snip(c.re);
    if (!m) continue;
    if (c.ctx && !CLOSURE_NEAR.test(m)) continue;      // needs a garment-front noun beside it
    if (CLOSURE_OWNED.test(m)) continue;               // a construction noun legitimately owns the word
    hits.push({ kind: 'CLOSURE_ASSERTED', what: c.what, matched: m });
  }

  const geomHits = (d.match(new RegExp(GEOMETRY.source, 'gi')) || []).length;
  const vagueHits = (d.match(new RegExp(VAGUE.source, 'gi')) || []).length;
  if (geomHits < 4 || (vagueHits >= 3 && geomHits < 8)) {
    hits.push({ kind: 'NO_GEOMETRY', what: `${geomHits} concrete terms vs ${vagueHits} vague ones — little for a camera to aim at` });
  }
  if (d.trim().length < 120) hits.push({ kind: 'STUB', what: `${d.trim().length} characters` });

  // figures in prose that the label does not carry
  const labelFigs = new Set((r.label.match(FIGURE) || []).map((s) => s.replace(/\s+/g, '').toLowerCase()));
  const proseFigs = [...new Set((d.match(FIGURE) || []).map((s) => s.replace(/\s+/g, '').toLowerCase()))];
  const extra = proseFigs.filter((x) => !labelFigs.has(x));
  if (extra.length) hits.push({ kind: 'UNLABELLED_FIGURE', what: `prose states ${extra.join(', ')}; the label does not` });

  const dup = byText.get(d.trim());
  if (dup.length > 1) {
    const others = [...new Set(dup.map((x) => x.id))].filter((x) => x !== r.id);
    if (others.length) hits.push({ kind: 'DUPLICATE_PROSE', what: `identical text to ${others.join(', ')} — cannot render differently` });
  }

  if (hits.length) findings.push({ ...r, hits });
}

const tally = {};
for (const f of findings) for (const h of f.hits) tally[h.kind] = (tally[h.kind] || 0) + 1;

if (argv.includes('--json')) {
  console.log(JSON.stringify({ scanned: scoped.length, findings }, null, 2));
} else {
  console.log(`\ndescription_audit — scanned ${scoped.length} descriptions, ${findings.length} carry at least one hazard\n`);
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(18)} ${String(v).padStart(4)}`);
  const show = onlyIds ? findings : findings.filter((f) => f.hits.some((h) => h.kind !== 'NO_GEOMETRY'));
  console.log(`\n  --- ${onlyIds ? 'all' : 'hazards other than NO_GEOMETRY'} (${show.length}) ---`);
  for (const f of show.slice(0, onlyIds ? 999 : 60)) {
    console.log(`\n  ${f.product}/${f.field}/${f.id}  "${f.label}"`);
    for (const h of f.hits) {
      console.log(`     ${h.kind}: ${h.what}`);
      if (h.matched) console.log(`        matched: "${h.matched}"`);
    }
  }
  if (!onlyIds && show.length > 60) console.log(`\n  ... and ${show.length - 60} more`);
}

const out = path.join(ROOT, 'public/images/reports/description-audit.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), scanned: scoped.length, tally, findings }, null, 2));
console.log(`\nwrote ${path.relative(ROOT, out).split(path.sep).join('/')}`);
