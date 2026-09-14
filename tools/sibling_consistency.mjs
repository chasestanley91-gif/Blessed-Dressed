#!/usr/bin/env node
/**
 * sibling_consistency.mjs — measure, mechanically, whether the members of a
 * measurement family were shot as one set.
 *
 * WHAT THIS CATCHES, AND WHAT IT DOES NOT
 * ---------------------------------------
 * Opening the `suit-2pc/lower-pocket` "Slanted Flap" family by eye showed three
 * separate divergences between siblings that differ only by flap depth:
 *
 *   camera distance   4.0 cm shot with the model's hand and cuff in frame;
 *                     6.5 cm shot tight, no hand
 *   cloth             plain birdseye / soft flannel / twill serge
 *   styling           two members in navy trousers, one in grey
 *
 * Only the first needs vision. **Cloth and lighting divergence is arithmetic**:
 * a plain navy birdseye and a navy twill under the same light still differ in
 * mean colour, in saturation, and in how much high-frequency texture they carry.
 * A grey trouser leg entering the bottom of one frame and not the others moves
 * the whole-image statistics measurably.
 *
 * So this tool decides the part that can be decided and stays quiet about the
 * rest. It reports colour, tone and texture spread across each set, and flags the
 * sets whose members were plainly not shot together. It does NOT claim to measure
 * framing — a human or a vision pass still has to do that, and
 * `sibling_framing_sets.mjs` assembles the sets for exactly that purpose.
 *
 * METRICS, per member (sharp, downsampled — this is about the whole frame, not
 * pixel detail):
 *   meanL, meanA, meanB   average colour in CIE Lab, so "how different do these
 *                         two cloths look" is a perceptual distance, not an RGB one
 *   sd                    standard deviation of lightness — global contrast, a
 *                         proxy for how hard the light is
 *   texture               mean absolute difference between neighbouring pixels at
 *                         a fixed small size — a twill reads higher than a plain
 *                         weave even after downsampling
 *
 * A set is FLAGGED when the spread across its members exceeds a threshold chosen
 * to sit well above normal variation between two shots of the same cloth.
 *
 * USAGE
 *   node tools/sibling_consistency.mjs
 *   node tools/sibling_consistency.mjs --set=suit-2pc/lower-pocket
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETS = path.join(REPO, 'public/images/reports/sibling-framing-sets.json');
const OUT = path.join(REPO, 'public/images/reports/sibling-consistency.json');
const NL = String.fromCharCode(10);

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const ONLY = arg('set', '');

/** Thresholds. Deliberately loose — the point is to catch "different cloth",
 *  not to police lighting nuance between two good shots of the same jacket. */
const T = {
  deltaE: 9,      // perceptual colour spread across the set
  sd: 14,         // contrast spread — different lighting setups
  texture: 5.0,   // weave spread — plain vs twill
};

if (!fs.existsSync(SETS)) {
  console.error('missing sibling-framing-sets.json — run tools/sibling_framing_sets.mjs first.');
  process.exit(1);
}
const { sets } = JSON.parse(fs.readFileSync(SETS, 'utf8'));

async function measure(rel) {
  const abs = path.join(REPO, rel);
  if (!fs.existsSync(abs)) return null;
  // Downsample hard: this is a question about the whole photograph — its cloth,
  // its light — not about fine detail. 64px also makes texture comparable across
  // images that were framed differently.
  const img = sharp(abs).resize(64, 64, { fit: 'fill' });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  // sRGB -> linear -> XYZ -> Lab, D65.
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  let L = 0, A = 0, B = 0, n = 0;
  const lum = [];
  for (let i = 0; i < data.length; i += ch) {
    const toLin = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const r = toLin(data[i]), g = toLin(data[i + 1]), b = toLin(data[i + 2]);
    const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    const fx = f(X), fy = f(Y), fz = f(Z);
    L += 116 * fy - 16; A += 500 * (fx - fy); B += 200 * (fy - fz);
    lum.push(116 * fy - 16);
    n += 1;
  }
  L /= n; A /= n; B /= n;
  const sd = Math.sqrt(lum.reduce((a, v) => a + (v - L) ** 2, 0) / n);
  // Neighbour difference across the 64x64 grid — weave energy.
  let tex = 0, tn = 0;
  for (let y = 0; y < 64; y += 1) {
    for (let x = 1; x < 64; x += 1) {
      tex += Math.abs(lum[y * 64 + x] - lum[y * 64 + x - 1]); tn += 1;
    }
  }
  return { meanL: +L.toFixed(2), meanA: +A.toFixed(2), meanB: +B.toFixed(2), sd: +sd.toFixed(2), texture: +(tex / tn).toFixed(2) };
}

const spread = (xs) => (xs.length < 2 ? 0 : Math.max(...xs) - Math.min(...xs));

const results = [];
for (const s of sets) {
  const key = `${s.product}/${s.field}`;
  if (ONLY && key !== ONLY) continue;
  const shot = s.members.filter((m) => m.shot && m.latest);
  if (shot.length < 2) continue;
  const members = [];
  for (const m of shot) {
    const stats = await measure(m.latest);
    if (stats) members.push({ option: m.option, label: m.label, path: m.latest, ...stats });
  }
  if (members.length < 2) continue;
  // Perceptual colour spread: the largest Lab distance between any two members.
  let maxDE = 0, pair = null;
  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const a = members[i], b = members[j];
      const de = Math.hypot(a.meanL - b.meanL, a.meanA - b.meanA, a.meanB - b.meanB);
      if (de > maxDE) { maxDE = de; pair = [a.label, b.label]; }
    }
  }
  const sdSpread = spread(members.map((m) => m.sd));
  const texSpread = spread(members.map((m) => m.texture));
  const reasons = [];
  if (maxDE > T.deltaE) reasons.push(`colour spread ΔE ${maxDE.toFixed(1)} across the set (${pair?.join(' vs ')}) — these are not the same cloth under the same light`);
  if (sdSpread > T.sd) reasons.push(`contrast spread ${sdSpread.toFixed(1)} — different lighting setups`);
  if (texSpread > T.texture) reasons.push(`weave-energy spread ${texSpread.toFixed(1)} — plain vs twill, or very different camera distance`);
  results.push({
    set: key, stem: s.stem, complete: s.complete,
    membersMeasured: members.length, membersTotal: s.membersTotal,
    maxDeltaE: +maxDE.toFixed(2), sdSpread: +sdSpread.toFixed(2), textureSpread: +texSpread.toFixed(2),
    flagged: reasons.length > 0, reasons, members,
  });
}

results.sort((a, b) => b.maxDeltaE - a.maxDeltaE);
const flagged = results.filter((r) => r.flagged);
fs.writeFileSync(OUT, JSON.stringify({
  ranAt: new Date().toISOString(),
  note: 'Mechanical consistency check across measurement-family siblings. Measures what arithmetic can settle - cloth colour, lighting contrast, weave energy - and deliberately does NOT claim to measure framing, which needs vision. A flagged set was not shot as one set, and must not be published as a side-by-side comparison.',
  thresholds: T, setsMeasured: results.length, setsFlagged: flagged.length, results,
}, null, 2) + NL, 'utf8');

console.log(`sets measured : ${results.length}`);
console.log(`sets FLAGGED  : ${flagged.length}`);
for (const r of flagged.slice(0, 10)) {
  console.log(`   ${r.set.padEnd(28)} ${r.membersMeasured}/${r.membersTotal} shot  ΔE ${r.maxDeltaE}`);
  for (const why of r.reasons) console.log(`        ${why}`);
}
console.log(`-> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
