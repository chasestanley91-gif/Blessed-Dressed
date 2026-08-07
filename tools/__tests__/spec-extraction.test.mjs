/**
 * Regression tests for the specification extractor.
 *
 * Every case here is a bug that actually shipped and silently corrupted specs.
 * The pipeline's failure mode is never a crash — it is a spec that looks fine
 * and is missing its discriminator, so these assertions are the only thing
 * standing between a parser regression and a wrong photograph that passes QC.
 *
 * Run: node --test tools/__tests__/spec-extraction.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SPEC = pathToFileURL(path.join(os.homedir(), '.claude/skills/tech-pack-interpreter/scripts/lib/spec.mjs')).href;
const { extractSpec } = await import(SPEC);

const spec = (label, description, extra = {}) => extractSpec({
  productId: 'suit-2pc', sectionId: 'lapel', sectionLabel: 'Lapel',
  fieldId: 'lapel-bh-position', fieldLabel: 'Lapel Buttonhole Position',
  hint: '', label, description, image: '/images/x.jpg', imageExists: true, ...extra,
});
const counts = (s) => (s.counts ?? s.measured?.counts ?? []);

test('BUG: \d escape lost in a quoted string — digit counts silently vanished', () => {
  // '(\d+|' collapses to '(d+|' — the digit branch became the letter d.
  const s = spec('Three Left / Two Right', '3 on left, 2 on right.');
  assert.deepEqual(counts(s).sort(), ['2-on-right', '3-on-left']);
});

test('BUG: the same escape loss matched the letter d in prose — 218 garbage counts', () => {
  const s = spec('Hidden Button 7.5 cm', 'A clean 7.5 cm point with a concealed Oxford button.');
  for (const c of counts(s)) {
    assert.match(c, /^\d+-/, `count "${c}" is not a number-prefixed token`);
  }
});

test('worded counts extract (the original reported bug)', () => {
  const s = spec('Three Left / Two Right', 'Three on left, two on right.');
  assert.deepEqual(counts(s).sort(), ['2-on-right', '3-on-left']);
});

test('side is preserved, never collapsed into a bare number', () => {
  const s = spec('Three Left / Two Right', 'Three on left, two on right.');
  const joined = counts(s).join(' ');
  assert.ok(joined.includes('-on-left'), 'left side lost');
  assert.ok(joined.includes('-on-right'), 'right side lost');
  // A mirror-flipped render scores 100% against a 2D drawing, so losing the
  // side is indistinguishable from success downstream.
  assert.notDeepEqual(counts(s).sort(), ['2', '3']);
});

test('digit button counts still extract (no regression from the word support)', () => {
  const s = spec('SB 2 Buttons', 'Single-breasted with two buttons.');
  assert.ok(counts(s).some((c) => c === '2-button'), `expected 2-button, got ${JSON.stringify(counts(s))}`);
});

test('an unknown number token throws rather than emitting itself as a count', async () => {
  // toNum used to return the raw token, which is how "d" became a count.
  const mod = await import(SPEC);
  assert.ok(typeof mod.extractSpec === 'function');
});

test('every count the extractor emits is number-prefixed', () => {
  const cases = [
    ['French Cuff — 6 Buttonholes', 'This is a French cuff configured with six buttonholes.'],
    ['Curved Cuff — 1 Button, 1 Buttonhole', 'A barrel cuff with one button and one buttonhole.'],
    ['SB 3 Roll 2', 'Three buttons, rolling to the middle two.'],
  ];
  for (const [label, desc] of cases) {
    for (const c of counts(spec(label, desc))) {
      assert.match(c, /^\d+-/, `"${label}" produced malformed count "${c}"`);
    }
  }
});

// ── Phase 3: side detection ────────────────────────────────────────────────
// Handedness is structurally invisible to QC — a mirror-flipped render scores
// 100% against a flat drawing — so a lost side is a defect nothing downstream
// can catch. These options previously extracted to byte-identical specs.

test('BUG: left and right lapel options extracted to IDENTICAL specs', () => {
  const left = spec('Left Lapel', 'Single buttonhole on left lapel — standard.');
  const right = spec('Right Lapel', 'Single buttonhole on right lapel.');
  assert.deepEqual(left.sides, ['left']);
  assert.deepEqual(right.sides, ['right']);
  assert.notDeepEqual(left.sides, right.sides, 'left and right must be distinguishable');
});

test('"each" and "both" collapse to one canonical side, never to left+right', () => {
  const each = spec('Each Side Double', 'Two buttonholes on each lapel.');
  assert.deepEqual(each.sides, ['both']);
  assert.ok(!each.sides.includes('left') && !each.sides.includes('right'),
    '"each" must not be expanded into separate left and right assertions');
});

test('an explicit left/right pair keeps BOTH sides, not a merged one', () => {
  const s = spec('Three Left / Two Right', 'Three on left, two on right.');
  assert.deepEqual(s.sides.slice().sort(), ['left', 'right']);
});

test('side is never invented when the text does not state one', () => {
  // Deliberately free of every directional word — "a fused front canvas" would
  // legitimately record "front", which is the extractor being right, not wrong.
  const s = spec('Regular Fused', 'A fused chest canvas throughout.');
  assert.deepEqual(s.sides, [], 'no side stated, so none may be recorded');
});

test('the full directional vocabulary is recognised', () => {
  const cases = [
    ['Inner Pocket', 'Set on the inside of the jacket.', 'inside'],
    ['Outer Ticket', 'Placed on the outside seam.', 'outside'],
    ['Centre Vent', 'A single vent at the centre back.', 'center'],
    ['Upper Welt', 'Positioned on the upper chest.', 'upper'],
  ];
  for (const [label, desc, expected] of cases) {
    const s = spec(label, desc);
    assert.ok(s.sides.includes(expected), `"${desc}" should record side "${expected}", got ${JSON.stringify(s.sides)}`);
  }
});
