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
function measuredList(spec) {
  const parts = [];
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
      : `A clean studio DOCUMENTATION photograph of the deliberate ABSENCE of a feature. ` +
        `${spec.fieldLabel}: "${spec.label}". The clean, unbroken area where the ${feature} would be IS ` +
        `the subject, identifiable within one second.`;
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
  const texture = `Extremely realistic ${spec.fabric} texture, fine stitching.`;

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
    PHOTO_BLOCK,
    texture,
    NEGATIVE,
    forbiddenBlock,
  ].filter(Boolean).join('\n\n');

  // Tokens the validator must find echoed in the final prompt. Absence options
  // render a clean area and deliberately echo no positive geometry, so they
  // require none (a stray flag parsed from prose like "no adjustment tab" must
  // not be demanded of a prompt that intentionally omits it).
  const requiredTokens = spec.absence
    ? []
    : [
        ...spec.dimensions,
        ...spec.angles,
        ...(spec.counts || []),
        ...spec.shapes,
        ...spec.flags,
      ];

  const checklist = buildChecklist(spec, styling);
  const profile = engineeringProfile(spec, styling);
  const scoreCard = SCORE_CATEGORIES.map((c) => ({ category: c, score: null, min: SCORE_MIN }));

  return { prompt, negative: NEGATIVE, styling, requiredTokens, checklist, profile, scoreCard };
}
