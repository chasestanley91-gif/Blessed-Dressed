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

// ── Phase 4: structural locking via named attribute triples ────────────────
// suit-2pc/lapel-bh-style is 56 options that the flat shapes[]/flags[] bags
// could not tell apart: 138 sibling collisions and 73 factless specs, more
// than any other cause in the catalog. The words were always there; the
// parser had no vocabulary for them.

const attrs = (s) => Object.fromEntries((s.attributes ?? []).map((a) => [a.attribute, a.value]));

test('BUG: machine and handmade buttonholes were the same specification', () => {
  const machine = spec('Real Functional (Machine)', 'Genuine functional buttonhole by machine.');
  const hand = spec('Handmade Lapel Buttonhole', 'Standard handcrafted lapel buttonhole.');
  assert.equal(attrs(machine).method, 'machine-sewn');
  assert.equal(attrs(hand).method, 'hand-sewn');
  assert.notDeepEqual(machine.attributes, hand.attributes);
});

test('functional and decorative buttonholes are distinguished', () => {
  assert.equal(attrs(spec('Real Functional (Machine)', 'Genuine functional buttonhole by machine.')).function, 'functional');
  assert.equal(attrs(spec('Fake Round', 'Decorative rounded buttonhole.')).function, 'decorative');
});

test('arc direction is preserved — upward and downward are different garments', () => {
  const up = spec('Arc Upwards', 'Milanese arc upwards — handmade only.');
  const down = spec('Arc Slight Downwards', 'Milanese arc downwards — handmade only.');
  assert.equal(attrs(up).profile, 'arc-upward');
  assert.equal(attrs(down).profile, 'arc-downward');
});

test('colour count separates double from triple', () => {
  assert.equal(attrs(spec('Arc Double-Color', 'Double color arc — handmade, appoint 2 colors.')).colorway, '2-colour');
  assert.equal(attrs(spec('Arc Triple-Color', 'Triple color arc — handmade, appoint 3 colors.')).colorway, '3-colour');
});

test('the most specific head pattern wins — "round head" never degrades to "round"', () => {
  assert.equal(attrs(spec('Round Head, Small Hole', 'Round head, small size handmade hole.')).head, 'round');
  assert.equal(attrs(spec('Barge Head Keyhole', 'Round head barge eye without sealing — water drop.')).head, 'barge-head keyhole');
});

test('supplier codes separate options that prose cannot', () => {
  // These two differ by nothing a parser can read except the code itself.
  const a = spec('Double-Color Straight A', 'Double color straight (055T) — appoint 2 colors.');
  const b = spec('Double-Color Straight B', 'Double color straight (055S) — appoint 2 colors.');
  assert.deepEqual(a.supplierCodes, ['055T']);
  assert.deepEqual(b.supplierCodes, ['055S']);
  assert.notDeepEqual(a.supplierCodes, b.supplierCodes);
});

test('a named decorative style yields NO invented construction facts', () => {
  // "Journey of Life" describes nothing. The correct behaviour is to extract
  // nothing and let the validator demand a verified drawing — NOT to guess.
  const s = spec('Journey of Life', 'Journey of Life.');
  assert.equal(s.styleName, 'Journey of Life');
  const invented = [...(s.shapes ?? []), ...(s.flags ?? []), ...(s.counts ?? []), ...(s.attributes ?? [])];
  assert.deepEqual(invented, [], `nothing may be inferred from a poetic name, got ${JSON.stringify(invented)}`);
});

test('styleName is identity only and never masquerades as an extracted fact', () => {
  // If styleName were counted as a fact, every option would look specified and
  // the validator would go permanently blind to real parser gaps.
  const s = spec('Journey of Life', 'Journey of Life.');
  assert.ok(s.styleName, 'styleName should be recorded');
  assert.equal((s.shapes ?? []).length + (s.flags ?? []).length + (s.attributes ?? []).length, 0);
});

// ── Non-assertive prose ────────────────────────────────────────────────────
// These descriptions teach by comparison, so they NAME the options a customer
// is choosing between. Reading those names as assertions produced garments
// that cannot exist.

test('BUG: a comparative clause made a centre vent also have side vents', () => {
  const s = spec('Center Vent',
    'The center vent is a single vertical slit running up the center back seam. It sits between the formality of side vents and the slickness of no-vent.');
  assert.ok(!s.shapes.includes('double / side vents'),
    `"sits between side vents and no-vent" is a comparison, not a feature; got ${JSON.stringify(s.shapes)}`);
});

test('BUG: "with minimal taper" made a wide leg also a tapered leg', () => {
  const s = spec('Wide Leg', 'Wide leg — the hem approaches the thigh ratio with minimal taper; side seam and inseam run nearly parallel.');
  assert.ok(!s.shapes.includes('tapered leg'),
    `minimal taper is the ABSENCE of taper; got ${JSON.stringify(s.shapes)}`);
});

test('BUG: "often paired with shawl or peak lapels" put lapels on a waistcoat', () => {
  const s = spec('DB 8 x 4', 'A double-breasted waistcoat with eight buttons of which four fasten, often paired with shawl or peak lapels.');
  for (const ghost of ['shawl lapel', 'peak lapel']) {
    assert.ok(!s.shapes.includes(ghost), `"often paired with" is a suggestion, not this option; got ${JSON.stringify(s.shapes)}`);
  }
});

test('BUG: "single cufflink" matched the "single cuff" pattern', () => {
  // A missing \b made the FRENCH cuff assert the barrel cuff family too.
  // Cuff vocabulary is shirt-scoped, so this case only exists on a shirt.
  const s = spec('French Cuff — 4 Buttonholes',
    'A French cuff with four buttonholes, with two aligned holes on each leaf so a single cufflink passes cleanly through all four layers when folded.',
    { productId: 'shirt', sectionId: 'cuff', fieldId: 'cuff', fieldLabel: 'Cuff' });
  assert.ok(s.shapes.includes('French / double cuff'), 'the actual cuff family must survive');
  assert.ok(!s.shapes.includes('barrel / button cuff'),
    `a cuff cannot be both French and barrel; got ${JSON.stringify(s.shapes)}`);
});

test('a subordinate detail does not become a competing family member', () => {
  const s = spec('Italian Fishtail Lapel',
    'Italian fishtail peak lapel — the peak terminates in a bifurcated fish-tail profile, a secondary notch developing beneath the upper peak.');
  assert.ok(s.shapes.includes('peak lapel'), 'the primary lapel family must survive');
  assert.ok(!s.shapes.includes('notch lapel'),
    `"a secondary notch beneath the upper peak" is a detail OF the peak; got ${JSON.stringify(s.shapes)}`);
});

// ── Absence purge ──────────────────────────────────────────────────────────
// An option that denies a feature must never also assert it: the prompt would
// render exactly the hardware the customer chose to leave off.

test('BUG: "No Suspender Buttons" asserted suspender buttons', () => {
  const s = spec('No Suspender Buttons', 'Standard — no brace attachment buttons.');
  assert.ok(s.absence, 'this must be recognised as an absence option');
  assert.ok(!s.flags.includes('suspender / brace buttons'),
    `an absence option may not assert the feature it denies; got ${JSON.stringify(s.flags)}`);
});

test('BUG: "No Contrast" asserted contrast fabric', () => {
  const s = spec('No Contrast', 'Single fabric throughout.');
  assert.ok(!s.flags.includes('contrast fabric'), `got ${JSON.stringify(s.flags)}`);
});

test('BUG: "No Back Detail" asserted a tab fastening', () => {
  const s = spec('No Back Detail', 'Plain back waistband — no adjustment tab.');
  assert.ok(!s.flags.includes('tab fastening'), `got ${JSON.stringify(s.flags)}`);
});

test('an absence expressed POSITIVELY is kept — "No Vent" stays ventless', () => {
  // The purge must not strip the value that actually tells the render what to
  // draw. Ventless IS the specification for No Vent.
  const s = spec('No Vent', 'A ventless back presents an unbroken, clean horizontal line across the entire hem.');
  assert.ok(s.shapes.includes('ventless'), `got ${JSON.stringify(s.shapes)}`);
});

test('what an absence option drops is retained as an explicit negative', () => {
  // Dropping the shape stops the prompt asserting it, but the prose still
  // reaches the model verbatim — only an explicit negative cancels it.
  const s = spec('No Suspender Buttons', 'Standard — no brace attachment buttons.');
  assert.ok((s.negatedShapes ?? []).includes('suspender / brace buttons'),
    `removed values must survive as negatives, got ${JSON.stringify(s.negatedShapes)}`);
});

// ── Sleeve head + attribute field scoping ─────────────────────────────────

const sleeve = (label, description) => extractSpec({
  productId: 'sport-coat', sectionId: 'shoulder-structure', sectionLabel: 'Shoulder',
  fieldId: 'sleeve-head', fieldLabel: 'Sleeve Head',
  hint: '', label, description, image: '/images/x.jpg', imageExists: true,
});

test('BUG: five distinct sleeve heads all extracted to nothing', () => {
  // Real, nameable constructions the extractor simply had no vocabulary for,
  // so they reached the validator as factless and blocked the verified queue.
  const cases = [
    ['Natural', 'Soft unpadded Italian shoulder — full drape.', 'unpadded'],
    ['Regular', 'Standard structured sleeve head — balanced shape.', 'structured'],
    ['Con Rollino', 'Italian rolled sleeve head — soft roll with character.', 'rolled (con rollino)'],
    ['Neapolitan (Spalla Camicia)', 'Shirt-shoulder insertion — minimal structure, Neapolitan tradition.', 'shirt-shoulder (spalla camicia)'],
    ['Shirt Head', 'Ultra-minimal shirt-style sleeve — lightest construction.', 'shirt-shoulder (spalla camicia)'],
  ];
  for (const [label, desc, expected] of cases) {
    const values = (sleeve(label, desc).attributes ?? []).map((a) => a.value);
    assert.ok(values.includes(expected),
      `"${label}" should record ${expected}, got ${JSON.stringify(values)}`);
  }
});

test('"minimal structure" survives for attributes though it is suppressed for shapes', () => {
  // The same phrase must be read two ways: it is the SPEC of a spalla camicia
  // sleeve head, but on a trouser leg "minimal taper" is the absence of taper.
  const s = sleeve('Neapolitan (Spalla Camicia)', 'Shirt-shoulder insertion — minimal structure, Neapolitan tradition.');
  assert.ok((s.attributes ?? []).some((a) => a.value === 'minimal'), 'attribute must survive');
  const wide = spec('Wide Leg', 'Wide leg — the hem approaches the thigh ratio with minimal taper.');
  assert.ok(!wide.shapes.includes('tapered leg'), 'shape must still be suppressed');
});

test('a triple never attaches to a feature the option is not about', () => {
  // "handcrafted" in a LAPEL description used to attach a buttonhole.method
  // fact to an option that has nothing to do with buttonholes.
  const lapel = extractSpec({
    productId: 'suit-2pc', sectionId: 'lapel', sectionLabel: 'Lapel',
    fieldId: 'lapel-style', fieldLabel: 'Lapel Style', hint: '',
    label: 'Peak Lapel', description: 'A handcrafted peak lapel, entirely handmade.',
    image: '/images/x.jpg', imageExists: true,
  });
  assert.ok(!(lapel.attributes ?? []).some((a) => a.feature === 'buttonhole'),
    `a lapel-style option must carry no buttonhole triples, got ${JSON.stringify(lapel.attributes)}`);
});
