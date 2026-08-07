// prompt.mjs — assemble the locked photography prompt AND the structured
// engineering profile from a persisted garment spec (spec.json, written by
// tech-pack-interpreter). The ENGINEERING PROFILE is the single source of
// truth: the prompt, the verification checklist and the score card all
// derive from it. build_prompt.mjs relies on this module so wording can never
// drift between preview, generation and verification.
//
// This module never recomputes a spec from raw catalog text — that's
// tech-pack-interpreter's job. `specFromRecord()` only reshapes the persisted
// spec.json into the flat internal shape the functions below expect.

import { resolveStyling } from './camera.mjs';

// Flatten a persisted spec.json (garment-spec/v1, nested under
// measured/garment/view/illustration) into the flat shape this module's
// functions operate on.
export function specFromRecord(record) {
  return {
    addr: record.addr,
    productId: record.productId,
    optionId: record.optionId,
    sourceFile: record.sourceFile,
    source: record.source,
    part: record.part,
    garmentNoun: record.garment.noun,
    fabric: record.garment.fabric,
    label: record.label,
    description: record.description,
    fieldLabel: record.fieldLabel,
    sectionLabel: record.sectionLabel,
    dimensions: record.measured.dimensions,
    angles: record.measured.angles,
    counts: record.measured.counts,
    spread: record.measured.spread,
    shapes: record.measured.shapes,
    negatedShapes: record.measured.negatedShapes || [],
    flags: record.measured.flags,
    sides: record.measured.sides || [],
    attributes: record.measured.attributes || [],
    supplierCodes: record.measured.supplierCodes || [],
    unresolved: record.measured.unresolved || [],
    illustration: record.illustration.path,
    illustrationDisk: record.illustration.disk,
    illustrationExists: record.illustration.exists,
    illustrationRemote: record.illustration.remote,
    excluded: record.excluded,
    absence: record.absence,
    generate: record.generate,
    orientation: record.view.orientation,
    forbidden: record.forbidden || [],
  };
}

// The non-negotiable geometry-lock block — the illustration is the sole
// authority; assume nothing.
export const BLUEPRINT_LOCK =
  'BLUEPRINT LOCK — THE DRAWING IS LAW: the attached technical illustration is ' +
  'the manufacturing blueprint for this exact craft option and the SOLE ' +
  'authority for the image. Reproduce its geometry precisely — point/edge ' +
  'shape, lengths, widths, depths, angles, curvature, roll lines, symmetry, ' +
  'button/tab/stay positions, seam and stitch placement, and proportions — ' +
  'within less than 2% deviation. Assume NOTHING from tailoring/menswear/' +
  'fashion convention or model priors; every visible characteristic must come ' +
  'from the drawing. Do not redesign, reinterpret, substitute a similar ' +
  'commercial style, stylise, or "improve" it. Do NOT fall back to a generic ' +
  'version of this category — reproduce THIS option, not a typical one. If ' +
  'convention conflicts with the drawing, the drawing wins. Accuracy over aesthetics. ' +
  'ANNOTATIONS ARE NOT THE GARMENT: the technical drawing may carry measurement ' +
  'callouts — dimension numbers ("2.5cm", "9cm", "115°"), tick / leader / dimension ' +
  'lines, arrows, red or coloured guide marks, and text labels. These are ' +
  'manufacturing documentation, NOT features of the cloth. Reproduce ONLY the ' +
  'finished garment: never render any number, unit, arrow, callout, leader line, ' +
  'measurement mark, or text anywhere in the photograph. The final image is a clean ' +
  'garment photo with zero annotation. ' +
  // Added 2026-07-31 after a measured failure. The clause above already said
  // "red or coloured guide marks" were annotations, and the model still traced
  // them as CLOTH COLOUR: lbp-both came back with two fire-engine-red lapel
  // buttonholes that read as applied plastic tags. Naming the marks was not
  // enough; the instruction has to say what they MEAN. An explicit
  // "red is a position marker, never a colour" clause fixed it in one retry.
  // The same convention applies to flat grey shading, which marks the EXTENT of
  // a lining or panel and was likewise rendered as literal plain-grey cloth.
  'COLOUR IN THE DRAWING IS NOTATION, NOT CLOTH: any red, orange or otherwise ' +
  'highlighted region marks WHERE the craft option sits — it is a position ' +
  'marker, never a colour specification. Flat grey or tinted shading marks the ' +
  'EXTENT of a panel, lining or facing, not its shade. Render every one of those ' +
  'areas in the garment\'s own cloth and thread, in the natural colour that ' +
  'tailoring would use there. There must be no red, no highlighter tint and no ' +
  'flat unshaded grey panel anywhere in the photograph unless the option\'s own ' +
  'label explicitly names that colour.';

// NOTE: the SET/background sentence is mandatory. photography-rules.md requires a
// "clean luxury studio environment, neutral background" with "clear separation
// between garment and background" and explicitly forbids "busy backgrounds that
// compete with the garment" — but until 2026-07-28 none of that reached the
// generated prompt (only "studio lighting" did), so the model was free to invent
// a location set. A hem candidate came back shot against outdoor stone
// architecture and failed QC on composition. State the set explicitly.
export const PHOTO_BLOCK =
  'Savile Row and high-end Italian sartorial aesthetic. Natural daylight ' +
  'studio lighting, Phase One IQ4 medium-format camera, 150MP detail, shallow ' +
  'depth of field, magazine-quality editorial menswear photography. ' +
  'Authentic bespoke craftsmanship, fine hand stitching, premium finishing. ' +
  'SET — shot in a clean luxury photographic studio against a seamless, plain, ' +
  'neutral light-grey background with clear separation between garment and ' +
  'background: no location, no architecture, no furniture, no scenery, no props ' +
  'and no environmental context of any kind competing with the garment.';

// SOME OPTIONS HAVE NO SIGNAL EXCEPT DEPTH, and the default lighting deletes
// them. photography-rules.md has said so since 2026-07-30 — and, like the SET
// sentence before it, the rule lived only in the reference file and never
// reached the prompt string, so it kept costing generations:
//
//   shirt/bias-outer-top-collar   2 attempts   grain, invisible on plain cloth
//   shirt/back-side-pleat         2 attempts   pressed folds under flat light
//   suit-2pc/pocket-stitch-double 2 attempts   tonal stitch rows, flat light
//   trousers/flat-front           1 attempt    flatness itself, unlit
//   trousers/hem-cuff-32 + suit-3pc/hem-single-turnup — flagged mid-wave as
//                                              about to fail the same way
//
// A fold, a dart, a turn-up and a tonal stitch row have no colour and no
// outline. Their ONLY visual signal is the shadow they cast, so lighting stops
// being a styling choice. The remedy is measured: raking the light was the
// single change that fixed back-side-pleat and pocket-stitch-double.
//
// Note this REPLACES the lighting sentence rather than appending a second one.
// Appending would leave "natural daylight studio lighting" and "raking
// sidelight" both in the prompt, and a prompt that contradicts itself loses —
// that is exactly how sport-coat/lapel-notch-68 burned four generations.
//
// Deliberately NOT applied to parts whose feature has an outline of its own
// (vents, cuff shapes, hem curves): those read fine under even light, and
// raking them would trade a real benefit for a cosmetic one.
const DEPTH_SIGNAL_PARTS = /^(fin-stitch|fin-dart|fin-pleat-detail|trouser-pleat|trouser-hem)$/;

const RAKING_LIGHT =
  'Savile Row and high-end Italian sartorial aesthetic. STRONG RAKING SIDELIGHT ' +
  'skimming low and almost parallel across the cloth, across the run of the ' +
  'feature, so every fold, pressed edge and line of stitching throws its own ' +
  'distinct shadow and reads as real depth — this feature has no colour and no ' +
  'outline of its own, and flat frontal light would erase it from its own ' +
  'photograph. Phase One IQ4 medium-format camera, 150MP detail, shallow depth ' +
  'of field, magazine-quality editorial menswear photography. Authentic bespoke ' +
  'craftsmanship, fine hand stitching, premium finishing. ' +
  'SET — shot in a clean luxury photographic studio against a seamless, plain, ' +
  'neutral light-grey background with clear separation between garment and ' +
  'background: no location, no architecture, no furniture, no scenery, no props ' +
  'and no environmental context of any kind competing with the garment.';

export function photoBlockFor(spec) {
  return DEPTH_SIGNAL_PARTS.test(String(spec?.part || '')) ? RAKING_LIGHT : PHOTO_BLOCK;
}

// Universal negatives that apply to every option, every part. Per-option
// negatives (option isolation, absence guard, front/back lock, exact counts)
// come from tech-pack-interpreter's `forbidden[]` and are appended separately
// in buildPrompt() — see negative-constraints.md for why the two are kept apart.
export const NEGATIVE =
  'Avoid: any GENERIC menswear substitution (a generic spread collar, generic ' +
  'notch/peak lapel, generic pocket/pleat/vent/cuff/waistband in place of the ' +
  'drawn one), illustration or line-art style, CGI or 3D-render look, cartoon, ' +
  'mannequin, fashion sketch, inaccurate geometry, altered proportions, missing ' +
  'construction details, asymmetry, watermark, AI-art appearance, AND any text or ' +
  'annotation traced from the drawing: NO measurement numbers, units (cm/mm/°), ' +
  'dimension or leader lines, arrows, callouts, red/coloured guide marks, ruler ' +
  'ticks, or labels anywhere in the frame. This is real garment photography of the ' +
  'exact drawn option — clean cloth only, nothing else.';

// Score categories every generated image is graded on (0–100 each). Minimum
// passing score is 98 in EVERY category — enforced by garment-image-qc, see
// its approval-rubric.md.
export const SCORE_CATEGORIES = [
  'shape', 'geometry', 'dimensions', 'angles', 'construction',
  'placement', 'symmetry', 'composition', 'blueprint-match',
];
export const SCORE_MIN = 98;

// Waistband ENGINEERING FAMILIES — for these parts the differentiating component
// (not the trouser) is the product, so they get a Primary-Craft lead, a hardware
// lock, a single-state rule and a tighter 40–60% dominance target.
export const WAISTBAND_FAMILY = new Set([
  'trouser-waistband-width',
  'trouser-extension-length',
  'trouser-extension',
  'trouser-adjuster',
  'trouser-belt-loops',
]);

export function isWaistbandFamily(part) {
  return WAISTBAND_FAMILY.has(part);
}

// The hero subject for a waistband-family option — what an experienced trouser
// maker must read first.
export function primaryCraft(spec) {
  switch (spec.part) {
    case 'trouser-waistband-width': return 'the waistband band height (its exact width)';
    case 'trouser-extension-length': return 'the extension tab length (how far the tab reaches past the closure)';
    case 'trouser-extension': return 'the extension tab geometry and its closure hardware';
    case 'trouser-adjuster': return 'the side-adjuster mechanism';
    case 'trouser-belt-loops': return 'the belt-loop count and placement';
    default: return spec.fieldLabel || 'the craft detail';
  }
}

const countLabel = (c) =>
  c.replace(/-hook$/, ' hook(s)').replace(/-button$/, ' button(s)').replace(/-loop$/, ' belt loop(s)');

// The micro-craft lock: Primary Craft dominance + Hardware Lock + Single State +
// Flatness. Emitted only for waistband-family parts; '' otherwise.
export function craftLock(spec) {
  if (!isWaistbandFamily(spec.part)) return '';
  const counts = spec.counts || [];
  const flags = spec.flags || [];
  const hooks = counts.find((c) => /-hook$/.test(c));
  const btns = counts.find((c) => /-button$/.test(c));
  const loops = counts.find((c) => /-loop$/.test(c));
  const orient = flags.filter((f) => /orientation/.test(f));
  const parts = [];
  parts.push(
    `PRIMARY CRAFT — ${primaryCraft(spec)} IS the product and the hero subject: it must fill ` +
    `40–60% of the frame and be identifiable within one second. The trouser is context only — ` +
    `crop away the knees, lower leg, model pose, jacket and every styling element; photograph ` +
    `this like a luxury-watch macro of the component, not a fashion shot of trousers.`
  );
  const hasHardware =
    hooks || btns || loops || /buckle|hardware|closure|adjuster/.test(flags.join(' '));
  if (hasHardware) {
    const bits = [];
    if (hooks) bits.push(`exactly ${countLabel(hooks)}`);
    if (btns) bits.push(`exactly ${countLabel(btns)}`);
    if (loops) bits.push(`exactly ${countLabel(loops)}`);
    parts.push(
      `HARDWARE LOCK — reproduce ${bits.length ? bits.join(' and ') + ', ' : 'the closure hardware '}` +
      `as drawn${orient.length ? ' (' + orient.join('; ') + ')' : ''}. Match the count, placement, ` +
      `orientation and spacing in the illustration EXACTLY. Do NOT invent, duplicate, mirror, ` +
      `remove or relocate any hook, button, buckle or loop.`
    );
  }
  // Extension LENGTH is hidden when fastened (the bearer tab sits inside), so it
  // is the one family shown OPEN — the tab laid out flat to reveal its reach.
  parts.push(
    spec.part === 'trouser-extension-length'
      ? 'SINGLE STATE — show the waistband UNFASTENED and laid OPEN with the inner extension ' +
        '(French-bearer) tab extended flat and fully visible so its LENGTH reads end to end; one ' +
        'state only, never half-open.'
      : 'SINGLE STATE — show the closure FULLY FASTENED, one state only; never partially open, and ' +
        'never an interior curtain and a closed exterior at the same time.'
  );
  parts.push(
    'FLATNESS — the band and tab are flat, symmetrical, pressed and tension-balanced; no curled ' +
    'tab, floating extension, twisted band or hanging curtain.'
  );
  return parts.join(' ');
}

function sentenceList(items) {
  return items.filter(Boolean).join(', ');
}

// The literal measured values parsed from catalog metadata.
//
// Everything here is stated OUTRIGHT so the image model never chooses it. A
// fact that is extracted but not emitted is worse than one never extracted:
// the pipeline reports the option as fully specified while the render decides
// the value for itself.
function measuredList(spec) {
  const parts = [];
  // Side first, and phrased as an instruction rather than a label. Handedness
  // is the one property QC structurally cannot check -- a mirror-flipped render
  // scores 100% against a flat 2D drawing -- so it must be unmistakable here.
  const sides = spec.sides || [];
  if (sides.length) {
    const sideText = sides.includes('both')
      ? 'on BOTH sides, symmetrically'
      : `on the ${sides.join(' and ')} side${sides.length > 1 ? 's' : ''} ONLY — do not mirror or swap`;
    parts.push(sideText);
  }
  // Named construction triples: the property, not just the value.
  for (const a of spec.attributes || []) parts.push(`${a.feature} ${a.attribute}: ${a.value}`);
  if (spec.shapes.length) parts.push(`${sentenceList(spec.shapes)} shape`);
  if (spec.dimensions.length) parts.push(`measuring exactly ${sentenceList(spec.dimensions)}`);
  if (spec.angles.length) parts.push(`at ${sentenceList(spec.angles)}`);
  if (spec.counts && spec.counts.length) parts.push(sentenceList(spec.counts));
  if (spec.spread.length) parts.push(sentenceList(spec.spread));
  if (spec.flags.length) parts.push(sentenceList(spec.flags));
  return parts;
}

// The option's catalog description, unless it is a bare fabric/colour code
// (e.g. "EMC70847", "YZ021") — those carry no construction meaning.
function cleanDetail(spec) {
  const d = (spec.description || '').trim();
  if (!d || d.length < 5) return '';
  if (/^[A-Z0-9][A-Z0-9/_.-]{3,}$/.test(d)) return ''; // bare code
  return d;
}

// The structured ENGINEERING PROFILE — single source of truth for this option.
export function engineeringProfile(spec, styling) {
  return {
    addr: spec.addr,
    product: spec.productId,
    field: spec.fieldLabel,
    option: spec.label,
    part: spec.part,
    garment: spec.garmentNoun,
    orientation: spec.orientation,
    absence: Boolean(spec.absence),
    distinguishingDetail: cleanDetail(spec),
    measured: {
      dimensions: spec.dimensions,
      angles: spec.angles,
      counts: spec.counts || [],
      shapes: spec.shapes,
      spread: spec.spread,
      flags: spec.flags,
    },
    // Geometry attributes whose exact value lives in the illustration and must
    // be reproduced from it (not all carry a metadata number).
    reproduceFromIllustration: spec.absence ? [] : styling.focus,
    primaryCraft: isWaistbandFamily(spec.part) ? primaryCraft(spec) : undefined,
    composition: {
      crop: styling.crop,
      dominanceTarget: isWaistbandFamily(spec.part) ? '40–60% of frame' : '40–80% of frame',
      identifyWithin: '1 second',
    },
    forbidden: spec.forbidden,
    excluded: spec.excluded || null,
    generate: spec.generate,
  };
}

// Per-option verification checklist, derived from the profile. Every option gets
// one — the same accuracy standard collars get. garment-image-qc walks this
// during comparison — see its comparison-rules.md.
export function buildChecklist(spec, styling) {
  const items = [];
  const feature = (spec.fieldLabel || 'feature').toLowerCase();
  if (spec.absence) {
    items.push(`the ${feature} is ABSENT — a clean area, no ${feature} rendered`);
    items.push(`the clean area is the subject (40–80% of frame), identifiable within one second`);
    items.push('a real photograph; the absent feature was NOT hallucinated in');
    items.push(`orientation matches the illustration: ${spec.orientation}`);
    return items;
  }
  for (const d of spec.dimensions) items.push(`length/width matches exactly: ${d}`);
  for (const a of spec.angles) items.push(`angle matches exactly: ${a}`);
  for (const c of spec.counts || []) items.push(`exact count: ${c}`);
  for (const sd of spec.sides || []) {
    items.push(sd === 'both'
      ? 'present on BOTH sides, symmetrically — neither side omitted'
      : `on the ${sd} side, NOT mirrored or swapped (check against the drawing, not against convention)`);
  }
  for (const a of spec.attributes || []) items.push(`${a.feature} ${a.attribute} reads as ${a.value}`);
  for (const sh of spec.shapes) items.push(`shape reads as drawn: ${sh}`);
  for (const fl of spec.flags) items.push(`present & positioned as drawn: ${fl}`);
  const detail = cleanDetail(spec);
  if (detail) items.push(`distinguishing detail present: ${detail}`);
  for (const attr of styling.focus) items.push(`reproduced from the illustration: ${attr}`);
  if (isWaistbandFamily(spec.part)) {
    const counts = spec.counts || [];
    const hooks = counts.find((c) => /-hook$/.test(c));
    const btns = counts.find((c) => /-button$/.test(c));
    const loops = counts.find((c) => /-loop$/.test(c));
    items.push(`PRIMARY CRAFT — ${primaryCraft(spec)} dominates the frame (40–60%), identifiable in one second; the trouser is context only`);
    if (hooks) items.push(`HARDWARE — exactly ${hooks.replace('-', ' ')} present; none invented, duplicated, mirrored, removed or relocated`);
    if (btns) items.push(`HARDWARE — exactly ${btns.replace('-', ' ')} present; count matches the drawing`);
    if (loops) items.push(`exactly ${loops.replace('-', ' ')}, evenly placed as drawn`);
    for (const o of (spec.flags || []).filter((f) => /orientation/.test(f))) items.push(`hook orientation matches: ${o}`);
    items.push('closure shown FULLY FASTENED — single state, not partially open');
    items.push('band/tab flat, symmetrical, pressed; no curl, float, twist or hanging curtain');
  }
  items.push(`orientation matches the illustration: ${spec.orientation}`);
  items.push(`the ${spec.fieldLabel || 'detail'} dominates the frame (${isWaistbandFamily(spec.part) ? '40–60%' : '40–80%'}), identifiable within one second, framed ${styling.crop}`);
  items.push('silhouette, proportions, seam & stitch placement match the illustration; left/right symmetry correct');
  items.push('NO generic-category substitution — this exact option, not a typical one');
  items.push('a real photograph of the exact drawn option — not the line-art, no stylisation');
  return items;
}

export function buildPrompt(spec) {
  const styling = resolveStyling(spec);
  const subject =
    `A premium ${spec.garmentNoun} featuring a precise ${spec.label}` +
    (spec.fieldLabel ? ` (${spec.fieldLabel})` : '') + '.';
  const feature = (spec.fieldLabel || 'feature').toLowerCase();
  const detail = cleanDetail(spec);
  const measured = measuredList(spec);
  // Waistband families demand a tighter, craft-dominant crop than the catalogue
  // default so the differentiating component — not the trouser — owns the frame.
  const dominance = isWaistbandFamily(spec.part) ? '40–60%' : '40–80%';

  // SOME OPTIONS ARE A RELATIONSHIP, NOT A DETAIL.
  // ---------------------------------------------------------------------
  // A shoulder option is read at the shoulder END — the point where padding
  // declares itself as a squared, built-up corner. A left/right buttonhole
  // position is read by seeing BOTH lapels. A paired pocket is read by seeing
  // both pockets. Crop in on any of them and the option disappears from its own
  // photograph while the crop still looks tight and confident.
  //
  // Measured on sport-coat/pad-none: three attempts, each carrying an explicit
  // FRAMING LOCK paragraph that declared itself to OUTRANK the close-crop
  // mandate and told the camera to move back. All three came back cropped, with
  // both shoulder end points outside the frame. Declaring one paragraph the
  // winner does not make the model drop the other — the contradiction has to not
  // be emitted. So for these parts the dominance sentence is replaced rather
  // than overridden.
  // Every name below was checked against the live part taxonomy in
  // repo-index.json, not guessed. The first draft of this list said
  // `jacket-lapel-buttonhole-position`; the real part is `jacket-lapel-bh-position`,
  // so the single clearest left/right case in the catalog matched nothing and the
  // list silently covered 44 options instead of 75.
  //
  //   jacket-shoulder        30  padding/shape, judged at the shoulder END
  //   jacket-lapel-bh-position 15  left / right / both — meaningless cropped to one lapel
  //   jacket-sleeve-vent      -   NOT included: one cuff, a genuine detail
  //   jacket-vent             9   one vent vs two is a whole-back comparison
  //   shirt-back              7   pleat placement, read left against right
  //   jacket-back-belt        6   spans the back
  //   vest-back               6   spans the back
  //   fin-epaulet             2   a pair
  //   trouser-back-pocket     -   NOT included: mixed, many are genuinely single-sided
  const RELATIONAL_PARTS = /^(jacket-shoulder|jacket-lapel-bh-position|jacket-vent|jacket-back-belt|vest-back|shirt-back|fin-epaulet)$/;
  const isRelational = RELATIONAL_PARTS.test(String(spec.part || ''));

  let composition, geometry, coverage, detailLine;
  if (spec.absence) {
    // The option is the ABSENCE of a feature — never order the model to draw it.
    composition = isRelational
      ? `A clean studio DOCUMENTATION photograph of the deliberate ABSENCE of a feature. ` +
        `${spec.fieldLabel}: "${spec.label}". The clean, unbroken area where the ${feature} would be IS ` +
        `the subject, identifiable within one second. FRAME WIDE, NOT TIGHT: this option is read across ` +
        `the whole span of the garment, so BOTH ends of it must sit inside the picture with clear ` +
        `background beyond each. Do not crop in on the centre — cropping the ends away removes the very ` +
        `place the absence is judged.`
      // AN ABSENCE MUST BE PROVEN, NOT MERELY UNSHOWN, and the difference is
      // entirely a framing and lighting decision. Measured across four options:
      //
      //   back-besom-no-right  PASSED. The right seat panel is genuinely in
      //                        shot, centre-back seam out to the hip edge with
      //                        background beyond it, and the mirrored position
      //                        where a right besom would sit is lit,
      //                        unobstructed and plain. The absence is PROVEN.
      //   heel-none            FAILED. Shot the OUTSIDE FRONT of the hem. A heel
      //                        guard lives on the inside back, never in frame,
      //                        so the image is identical to heel-standard.
      //   vest-extra-no-seal-stitch  FAILED. The pocket ends occupy a sliver of
      //                        a frame dominated by ornate buttons.
      //   flat-front           FAILED first pass. Near-black cloth, flat frontal
      //                        light: a pleated front would look identical.
      //
      // "No pleat visible" is not the same claim as "flatness demonstrated". The
      // frame has to put the viewer where the feature would have been, at a size
      // where it could not be missed, under light that would reveal it.
      : `A clean studio DOCUMENTATION photograph of the deliberate ABSENCE of a feature. ` +
        `${spec.fieldLabel}: "${spec.label}". The clean, unbroken area where the ${feature} would be IS ` +
        `the subject, identifiable within one second. ` +
        `PROVE THE ABSENCE — do not merely omit the feature. Frame the exact place on the garment where ` +
        `the ${feature} would sit if this option had one, large enough in the picture that a viewer ` +
        `could not miss it were it there, and include enough surrounding construction — seams, edges, ` +
        `the matching position on the opposite side — that the viewer can recognise WHERE they are ` +
        `looking. Light that surface so a ${feature}, if present, would break the plane or throw a ` +
        `shadow: a flatly-lit or shadowed surface proves nothing, because the feature would be ` +
        `invisible there whether or not it existed. The picture must let a customer conclude "there is ` +
        `none here", not merely fail to show one.`;
    geometry = `This option is the ABSENCE of the ${feature}.`;
    coverage =
      `MANDATORY — do NOT render a ${feature}. Reproduce a clean garment with no ${feature}, exactly as ` +
      `the illustration shows; adding the feature is a failure.`;
    detailLine = detail ? `Intent: ${detail}` : '';
  } else {
    composition = isRelational
      ? `A single-subject craft DOCUMENTATION photograph: the ${spec.fieldLabel || 'craft detail'} is the ` +
        `sole subject, identifiable within one second. FRAME WIDE, NOT TIGHT: this option is read across ` +
        `the whole span of the garment, so BOTH ends of it must sit inside the picture with clear ` +
        `background beyond each — a shoulder is judged at its END POINT, a left/right option by seeing ` +
        `both sides, a pair by seeing both. Do not crop in on the centre. There is no frame-fill target ` +
        `for this option; getting both ends in is what matters.`
      : `A single-subject craft DOCUMENTATION photograph: the ${spec.fieldLabel || 'craft detail'} is the ` +
        `dominant subject, filling ${dominance} of the frame and identifiable within one second.`;
    geometry = measured.length
      ? `Exact specification — ${measured.join('; ')} — matching the illustration precisely.`
      : `Reproduce the "${spec.label}" detail exactly as drawn.`;
    coverage =
      `MANDATORY GEOMETRY COVERAGE — reproduce from the illustration, exactly and without assumption, ` +
      `every one of these: ${sentenceList(styling.focus)}. Match each to the drawing.`;
    detailLine = detail ? `Distinguishing construction detail (reproduce exactly as drawn): ${detail}` : '';
  }

  const viewLine = spec.orientation
    ? `VIEW — this illustration is the ${spec.orientation.replace(/-/g, ' ')} of the garment. ` +
      `Photograph the same face; never substitute a different face of the garment.`
    : '';

  const presentation = `Photographed ${styling.base}${styling.accessory ? ', ' + styling.accessory : ''}.`;
  // The second half of the same contradiction. Removing the 40-80% dominance
  // sentence for relational parts is not enough while this line still says
  // "Frame on the shoulder and sleeve head; the detail must read clearly" — the
  // model reads that as permission to move in, which is exactly what cropped both
  // shoulder ends out of pad-none three times. For relational parts the framing
  // instruction has to point OUTWARD, not at the feature.
  const focus = isRelational
    ? `Frame ${styling.crop}, but WIDE — far enough back that both ends of the feature and a margin of ` +
      `plain background beyond each are inside the picture. Completeness across the full span beats ` +
      `closeness; do not move in.`
    : `Frame ${styling.crop}; the detail must read clearly and sharply.`;

  // LADDER OPTIONS: 361 options across 43 families differ from their siblings
  // ONLY by a measurement — 18 lapel angles per jacket product, 13 pocket
  // depths, 12 hem depths, 41 collar point lengths. For those, framing is not
  // a styling choice, it is part of the specification: two images shot at
  // different distances cannot be compared, however accurate each is on its own.
  //
  // Measured on the first pair that reached QC. hem-cuff-32 and
  // hem-single-turnup differ by 3.2 cm against 4.4 cm, and BOTH rendered their
  // depth correctly — the drawn step is 1.23, the rendered step 1.33, against a
  // 1.375 nominal, so the renders separate BETTER than the drawings do. Yet
  // both failed, because they were shot 18% apart in scale (trouser leg 393px
  // against 465px), so a customer comparing them side by side sees the
  // difference overstated by 18%. Each image was right; the PAIR was wrong.
  //
  // This is also the largest defect class measured in the live catalog: of a
  // 24-row sample, 37.5% were INDISTINCT — right family, nothing separating
  // them from their siblings — and ladders are the main cause.
  //
  // The instruction has to be one every sibling derives IDENTICALLY, so it is
  // keyed on the part (shared across the family) and never on this option's own
  // value. It also has to say "do not compensate", because the natural
  // temptation is to zoom in on a small measurement to make it look distinctive,
  // which destroys the very comparison the family exists to support.
  // THE SUPPLIER OFTEN ENCODES THE COUNTING CONVENTION IN THE FILENAME, and it
  // was going straight to waste. The shirt placket family is drawn on files
  // named "7-buttons-NOT-INCLUDING-collar-button.jpg" — the convention is
  // stated outright — and the prompt said only "exactly 7", "7-button".
  //
  // Measured consequence, all three options in the family:
  //   btn-7  promises 7  ->  rendered 7 total, one on the collar stand, 6 on the placket
  //   btn-8  promises 8  ->  7 on the placket
  //   btn-9  promises 9  ->  7 on the placket   (identical to btn-8)
  //
  // The model was not miscounting. It was counting the right number of the
  // wrong thing, because nothing told it where the count applies. A grader
  // confirmed the drawings themselves are correct: each shows a collar-stand
  // mark PLUS the labelled number of placket buttons.
  //
  // So lift the disambiguation out of the filename verbatim. It is free,
  // authoritative, and already written down.
  const illoName = String(spec.illustration || '').split('/').pop() || '';
  const scopeHint = /not[-_ ]?including|excluding|except/i.test(illoName)
    ? illoName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim()
    : null;
  const countScope = (Array.isArray(spec.counts) && spec.counts.length && scopeHint)
    ? `COUNTING CONVENTION — the manufacturer's own drawing for this option is filed as `
      + `"${scopeHint}", and that wording is the specification. The stated number counts ONLY the `
      + `buttons it names and excludes the one it excludes. Render the excluded button too if the `
      + `garment normally has one, but do NOT let it absorb one of the counted buttons: the counted `
      + `run must reach its full stated number on its own, in addition to anything the convention `
      + `sets aside. Frame the shot so the entire counted run is inside the picture from first to `
      + `last, with the garment continuing past the final one — a crop that ends mid-run makes the `
      + `count unverifiable and the image worthless for choosing.`
    : null;

  // DISTINGUISHED BY WHAT IS MISSING — a wider set than spec.absence.
  //
  // spec.absence governs what to RENDER, and it deliberately excludes labels
  // like "Flat Front" and "Standard" (isAbsence() in tech-pack-interpreter,
  // line 273) because those are positive things to photograph: a flat front is
  // a smooth panel, not nothing. That decision is right and is left alone.
  //
  // But the FRAMING requirement is broader than the rendering one. A customer
  // tells "Flat Front (No Dart)" from its pleated siblings by what is ABSENT,
  // so the picture still has to prove the absence — and trousers/flat-front is
  // exactly the option that failed that test, twice, while carrying
  // absence:false. Its label says "(No Dart)" in parentheses, which the
  // start-anchored isAbsence() regex cannot see.
  //
  // So this predicate is for framing only. It never changes what gets rendered.
  const MISSING_FEATURE = /\b(no|none|without|ventless|unlined|flat|plain)\b/i;
  const distinguishedByMissing = Boolean(spec.absence) || MISSING_FEATURE.test(String(spec.label || ''));

  // Fires for options distinguished by what is MISSING, including those
  // spec.absence deliberately excludes (see the predicate above). Framing only.
  const absenceProof = (distinguishedByMissing && !spec.absence)
    ? 'PROVE THE ABSENCE — this option is told apart from its siblings by what is NOT there, so the '
      + 'picture has to show that. Frame the exact place where the missing feature would sit, large '
      + 'enough that a viewer could not miss one were it there, with enough surrounding construction — '
      + 'seams, edges, the matching position on the opposite side — to recognise where they are looking. '
      + 'Light it so the feature, if present, would break the plane or throw a shadow: a flatly-lit '
      + 'surface proves nothing, because the feature would be invisible there whether or not it existed.'
    : null;

  const LADDER_LABEL = /(\d+(?:\.\d+)?)\s*(cm|mm|°|deg)/i;
  const isLadder = LADDER_LABEL.test(String(spec.label || ''));
  const matchedFraming = isLadder
    ? `MATCHED FRAMING — this option belongs to a family whose members differ from one another only `
      + `by a measurement, so this photograph will be shown beside its siblings and compared directly. `
      + `TWO SEPARATE REQUIREMENTS, and both must hold. FIRST, THE GARMENT: build the feature at exactly `
      + `the size the drawing gives it — no larger. Do not exaggerate the dimension to make this option `
      + `look more distinct from its siblings; the difference between them is small in real tailoring `
      + `and must stay small here, because a customer choosing on these numbers is ordering a real `
      + `garment. SECOND, THE CAMERA: frame the shot the way every member of the family must be framed `
      + `— the garment part square to camera, centred, at a standard distance that leaves the whole `
      + `garment occupying the same share of the picture no matter which value this option carries. `
      + `Do not move closer for a small measurement or pull back for a large one. `
      + `Getting one of these right while getting the other wrong is still a failure: an accurate `
      + `feature shot at the wrong distance, or a matched frame containing an exaggerated feature, both `
      + `mislead a customer comparing two pictures side by side.`
    : null;
  // A GRAIN DIRECTION IS INVISIBLE ON PLAIN CLOTH, and the default fabric line
  // deletes it. This is the other half of the same table in
  // photography-rules.md that the raking-light fix covers: depth needs raking
  // light, DIRECTION needs a pattern to run along. Both rules were written
  // 2026-07-30 and neither reached the prompt string.
  //
  // Measured: shirt/bias-outer-top-collar failed TWICE on plain poplin. The
  // blueprint marks the bias with diagonal hatching, and hatching on plain
  // cloth photographs as nothing at all — the image was not slightly wrong, it
  // was empty. On a navy pinstripe the option reads in one second: diagonal
  // stripes on the collar meeting vertical stripes on the body at the seam.
  // Its sibling bias-inner-collar-stand, generated before any of this was
  // understood, is live in the catalog right now rendering the red hatching as
  // a solid navy CONTRAST BAND — annotation mistaken for cloth.
  //
  // Five bias options still have no photograph. This is what stops them
  // repeating it.
  const GRAIN_PARTS = /(^|-)bias($|-)|grain|nap/i;
  const isGrainOption = GRAIN_PARTS.test(String(spec.optionId || '')) || GRAIN_PARTS.test(String(spec.field || ''));
  const texture = isGrainOption
    ? `Extremely realistic ${spec.fabric} in a FINE EVEN STRIPE, and the stripe is not decoration — `
      + `it is the only way this option is visible at all. This option is a GRAIN DIRECTION, which has `
      + `no colour and no outline of its own: on plain cloth it photographs as nothing. Render the `
      + `stripe running at a clear diagonal across the panel this option names, while every other `
      + `panel keeps its stripe running straight, so the two directions meet along the seam between `
      + `them and the difference reads in one second. Fine stitching, legible weave.`
    : `Extremely realistic ${spec.fabric} texture, fine stitching.`;

  // A HAIRLINE FEATURE IS INVISIBLE ON COARSE CLOTH — the same failure as the
  // grain rule above, on the other axis. A grain direction needs a pattern to
  // run along; a sub-millimetre feature needs a weave FINER THAN ITSELF.
  //
  // Measured 2026-08-05 on suit-2pc/pocket-stitch-015 ("0.15 cm Topstitch").
  // Attempt 1 failed for framing: the stitch spanned roughly one pixel in a wide
  // hip shot. Attempt 2 corrected the framing and it worked — waistband depth
  // went 146 px to 242 px — and the render then dropped the topstitch ENTIRELY.
  // A perpendicular cross-section averaged over 650 samples along a rectified
  // mouth line (fit rms 0.53 px, 305 inliers) contained exactly one feature, and
  // it was not a stitch. The photograph became indistinguishable from its
  // pocket-stitch-none sibling in the same field.
  //
  // The cause was the cloth, not the camera. Along-line FFT gave a weave cell of
  // 4.1-4.5 px — about 0.07 cm at that frame's scale, an open basket/hopsack —
  // against a 0.15 cm subject. A weave whose cell is half the width of the
  // feature cannot show it, and zooming closer magnifies the weave along with
  // the stitch, netting nothing. Framing alone can never fix this.
  const HAIRLINE_CM = 1.0;
  const cmInLabel = String(spec.label || '').match(/(\d+(?:\.\d+)?)\s*cm/i);
  const isHairline = Boolean(cmInLabel) && parseFloat(cmInLabel[1]) < HAIRLINE_CM
    && /stitch|topstitch|pick|edge|seam|piping|hairline/i.test(`${spec.optionId || ''} ${spec.field || ''} ${spec.label || ''}`);
  const hairlineCloth = isHairline
    ? `CLOTH MUST BE FINER THAN THE FEATURE — this option's whole subject measures ${cmInLabel[1]} cm, `
      + `which is smaller than the weave cell of any textured cloth. Render it on a SMOOTH, FLAT, `
      + `TIGHTLY-WOVEN fine worsted with a close even surface: no hopsack, no basketweave, no tweed, `
      + `no open or slubby weave, no pronounced texture of any kind. On coarse cloth this feature `
      + `photographs as nothing at all, and moving the camera closer only magnifies the weave along `
      + `with it. The stitch line must be the finest repeating detail in the frame — nothing in the `
      + `cloth itself may be as small as, or smaller than, the stitch.`
    : null;

  // Waistband-family micro-craft lock (Primary Craft / Hardware Lock / Single
  // State / Flatness) — '' for every other part, so it filters out.
  const craft = craftLock(spec);

  // Per-option forbidden list from tech-pack-interpreter (option isolation,
  // absence guard, front/back lock, exact counts) — kept as its own block
  // rather than folded into the universal NEGATIVE constant, so every option
  // gets its own generated exclusion list, not one static list for every
  // garment. See negative-constraints.md.
  // Styles the description NAMED but the label does not claim — nearly always a
  // comparative clause. tech-pack-interpreter drops these from `shapes`, which
  // stops the prompt ASSERTING them, but the sentence that produced them is
  // still quoted verbatim in the description block above, so the model has been
  // told about the feature regardless. Measured: "the sweet spot between the long
  // traditional point and the casual BUTTON-DOWN" put a button on a collar leaf
  // and made the render indistinguishable from its own sibling option. Only an
  // explicit negative cancels a sentence the prompt is still carrying.
  const negated = Array.isArray(spec.negatedShapes) ? spec.negatedShapes : [];
  const negatedClause = negated.map(
    (sh) => `any ${sh} — the description mentions it only by comparison, and this option is NOT that`
  );
  const forbiddenAll = [...(spec.forbidden || []), ...negatedClause];

  const forbiddenBlock = forbiddenAll.length
    ? `FORBIDDEN FOR THIS OPTION — do not render: ${forbiddenAll.join('; ')}.`
    : '';

  const prompt = [
    'Ultra-photorealistic luxury menswear product photography.',
    composition,
    craft,
    subject,
    detailLine,
    geometry,
    coverage,
    viewLine,
    BLUEPRINT_LOCK,
    presentation,
    focus,
    countScope,
    absenceProof,
    matchedFraming,
    photoBlockFor(spec),
    texture,
    // AFTER texture, deliberately: texture names the cloth, this constrains it.
    // A constraint placed before the thing it constrains loses — the ordering
    // lesson from lapel-notch-68, where a correction that contradicted an
    // earlier paragraph was simply ignored.
    hairlineCloth,
    NEGATIVE,
    forbiddenBlock,
  ].filter(Boolean).join('\n\n');

  // Tokens the validator must find echoed in the final prompt. Absence options
  // render a clean area and deliberately echo no positive geometry, so they
  // require none (a stray flag parsed from prose like "no adjustment tab" must
  // not be demanded of a prompt that intentionally omits it).
  // A property the catalog NAMES but never resolves to a value cannot be
  // rendered, only guessed. Refuse to build the prompt at all — the whole
  // purpose of this file is that the model decides nothing.
  if ((spec.unresolved || []).length) {
    throw new Error(
      `SpecificationValidationError — ${spec.addr}: cannot build a prompt from an unresolved specification: ` +
      `${spec.unresolved.join('; ')}. Resolve it in the catalog rather than letting the render choose.`
    );
  }

  const requiredTokens = spec.absence
    ? []
    : [
        ...spec.dimensions,
        ...spec.angles,
        ...(spec.counts || []),
        ...spec.shapes,
        ...spec.flags,
        // Attribute VALUES are required tokens: an extracted fact that the
        // prompt does not echo is worse than one never extracted, because the
        // option is reported as fully specified while the render picks the
        // value itself.
        ...(spec.attributes || []).map((a) => a.value),
        // Side is not added as a bare token ("left" appears in too much
        // incidental prose to be a meaningful test); buildChecklist asserts it
        // explicitly instead, and measuredList states it as an instruction.
      ];

  const checklist = buildChecklist(spec, styling);
  const profile = engineeringProfile(spec, styling);
  const scoreCard = SCORE_CATEGORIES.map((c) => ({ category: c, score: null, min: SCORE_MIN }));

  return { prompt, negative: NEGATIVE, styling, requiredTokens, checklist, profile, scoreCard };
}
