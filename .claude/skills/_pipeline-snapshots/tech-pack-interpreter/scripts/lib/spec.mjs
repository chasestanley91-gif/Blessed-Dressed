// spec.mjs — deterministically extract the exact engineering spec of a craft
// option from its catalog text (label + description + hint + image filename).
// NOTHING here is inferred by a language model: the same input always yields
// the same spec. This is the "geometry-lock" step — turning a tech-pack
// illustration's surrounding metadata into structured facts before any prompt
// or photograph exists. Coverage spans shirts, jackets (suit / sport coat),
// trousers and waistcoats.
//
// What lives here: WHAT the garment is (dimensions, angles, counts, shapes,
// flags, part). HOW to photograph it (camera/crop/composition) is a
// downstream concern owned by the garment-image-director skill's camera.mjs —
// that keeps "interpret the construction" and "direct the photography"
// cleanly separated, per this skill family's split.

import path from 'node:path';
import { isRemote } from './catalog.mjs';

// ---- product -> the garment noun used in the subject sentence -------------
const GARMENT_NOUN = {
  shirt: 'white bespoke cotton dress shirt',
  'suit-2pc': 'navy bespoke suit jacket',
  'suit-3pc': 'navy bespoke suit jacket',
  'sport-coat': 'bespoke sport coat',
  trousers: 'pair of bespoke wool tailored trousers',
  vest: 'bespoke tailored waistcoat',
};

// A SUIT IS NOT ONE GARMENT.
// ---------------------------------------------------------------------------
// `suit-2pc` and `suit-3pc` are multi-garment products: their catalog sections
// run `lapel`, `suit-pockets`, … and then `Trousers-waistband`,
// `Trousers-bottom-hem`, `Vest-pockets`, `Vest-lapel-neckline`. Keying the
// garment noun on productId alone told the image model to photograph a
// "navy bespoke suit jacket" while a TROUSER waistband drawing was attached as
// the geometry reference — a prompt that contradicts its own reference image on
// the most basic fact in it.
//
// Measured on 2026-07-31 during the first generation wave: 33 of one slice's 51
// clusters were affected, and one agent refused to spend credits on them at all
// rather than generate from a self-contradictory prompt. (Two other agents found
// the attached blueprint usually won, so the renders came out correct — but
// "usually" is not a gate, and the contradiction was costing retries.)
//
// The section prefix is the authority, because it is what the catalog itself
// uses to say which garment a field belongs to.
const SECTION_GARMENT = [
  [/^trousers[-_]/i, 'trousers'],
  [/^vest[-_]/i, 'vest'],
];

function garmentKeyFor(productId, sectionId) {
  for (const [pattern, key] of SECTION_GARMENT) {
    if (pattern.test(String(sectionId ?? ''))) return key;
  }
  return productId;
}

const FABRIC = {
  shirt: 'crisp cotton poplin',
  'suit-2pc': 'fine wool suiting with visible weave',
  'suit-3pc': 'fine wool suiting with visible weave',
  'sport-coat': 'textured wool/hopsack with visible weave',
  trousers: 'fine wool trouser cloth with visible weave',
  vest: 'fine wool suiting',
};

// ---- product scopes (which garments a shape term may apply to) ------------
const SHIRT = ['shirt'];
const JACKET = ['suit-2pc', 'suit-3pc', 'sport-coat'];
const TROUSER = ['trousers'];
const VEST = ['vest'];
const POCKETS = [...JACKET, ...TROUSER, ...VEST]; // pockets are shared tailored vocab
const LAPELS = [...JACKET, ...VEST];

// ---- shape vocabulary (ordered: most specific first) ----------------------
// Each entry: [canonical, regex, scope?]. scope (optional) limits the term to
// certain products so garment-specific words don't leak across categories
// (e.g. a trouser "Flat Front" must not also tag the vest term "flat bottom").
const SHAPES = [
  // shirt collars
  ['double cutaway', /double cut[- ]?away/, SHIRT],
  ['long point', /long[- ]?point/, SHIRT],
  ['fashion point', /fashion[- ]?point/, SHIRT],
  ['curved point', /curve[d]?[- ]?point/, SHIRT],
  ['rounded point', /round(ed)?[- ]?point/, SHIRT],
  ['button-down point', /button[- ]?down/, SHIRT],
  ['cutaway / spread', /cut[- ]?away/, SHIRT],
  ['semi-spread', /semi[- ]?spread/, SHIRT],
  ['spread', /\bspread\b/, SHIRT],
  ['point', /\bpoint collar\b|\bpoint\b/, SHIRT],
  ['small square', /small square/, SHIRT],
  ['square', /\bsquare\b/, SHIRT],
  ['club / rounded', /\bclub\b|rounded corner/, SHIRT],
  ['wing', /\bwing\b/, SHIRT],
  ['mandarin / band', /mandarin|band collar|stand[- ]?up collar/, SHIRT],
  ['cuban', /\bcuban\b/, SHIRT],
  ['wrap', /\bwrap\b/, SHIRT],
  // lapels (jacket + vest neckline)
  ['peak lapel', /peak/, LAPELS],
  ['notch lapel', /notch/, LAPELS],
  ['shawl lapel', /shawl/, LAPELS],
  ['V-neckline', /v[- ]?neck/, VEST],
  ['U-neckline', /u[- ]?neck/, VEST],
  // pockets — jacket / trouser / vest
  ['barchetta (boat) welt', /barchetta|boat/, POCKETS],
  ['jetted / besom welt', /jetted|besom|piped pocket/, POCKETS],
  ['slant pocket', /\bslant\b/, POCKETS],
  // 'side seam' alone is a drafting DATUM ('3.2 cm drop from the side seam'),
  // not a pocket construction — only tag when the opening is IN the seam.
  ['on-seam (side-seam) pocket', /on[- ]?seam|side[- ]?seam pocket|(?:set|cut|placed|built)s+(?:directlys+)?into the side[- ]?seam|opening coincides with the side[- ]?seam/, POCKETS],
  ['welt pocket', /\bwelt\b/, POCKETS],
  ['flap pocket', /\bflap\b/, POCKETS],
  ['patch pocket', /\bpatch\b/, POCKETS],
  ['jeans square pocket', /square jeans|jeans.*square/, TROUSER],
  ['jeans diamond pocket', /diamond/, TROUSER],
  ['jeans arc pocket', /\barc\b/, TROUSER],
  ['jeans round pocket', /round jeans|jeans.*round/, TROUSER],
  ['ticket pocket', /ticket/, POCKETS],
  ['watch pocket', /watch pocket/, TROUSER],
  ['coin pocket', /coin pocket/, TROUSER],
  // shirt chest-pocket + hem shapes (distinguishers that must reach the prompt)
  ['hexagon pocket', /hexagon/, SHIRT],
  ['triangle pocket', /triangle/, SHIRT],
  ['pentagon pocket', /pentagon/, SHIRT],
  ['rounded-bottom pocket', /round (pocket|bottom)|rounded/, SHIRT],
  ['curved hem', /curved hem|round hem/, SHIRT],
  ['straight hem', /straight hem/, SHIRT],
  ['squared hem', /square[d]? (bottom|hem)/, SHIRT],
  ['side vents', /side vent/, SHIRT],
  ['pentagon gusset', /pentagon gusset|gusset/, SHIRT],
  // decorative lapel-buttonhole shapes (jacket)
  ['musical-note buttonhole', /musical note/, JACKET],
  ['antler buttonhole', /antler/, JACKET],
  ['dragon-horn buttonhole', /dragon ?horn/, JACKET],
  ['rose buttonhole', /\brose\b/, JACKET],
  ['water-drop buttonhole', /water ?drop/, JACKET],
  ['arc buttonhole', /\barc\b/, JACKET],
  // cuffs (shirt)
  ['French / double cuff', /french cuff|double cuff/, SHIRT],
  ['barrel / button cuff', /barrel|button cuff|single cuff/, SHIRT],
  ['convertible cuff', /convertible/, SHIRT],
  ['mitered corner', /miter|mitre/, SHIRT],
  // vents (jacket back)
  ['double / side vents', /double vent|side vent/, JACKET],
  ['single centre vent', /single vent|center vent|centre vent/, JACKET],
  ['ventless', /no vent|ventless/, JACKET],
  // trouser pleats / darts (direction-specific first, then generic)
  ['double forward pleat', /(double|two) forward.{0,8}pleat/, TROUSER],
  ['double reverse pleat', /(double|two) (reverse|back).{0,10}pleat/, TROUSER],
  ['single forward pleat', /(single|one) forward.{0,8}pleat/, TROUSER],
  ['single reverse pleat', /(single|one) (reverse|back).{0,10}pleat/, TROUSER],
  ['double pleat', /double pleat|two pleats?\b/, TROUSER],
  ['single pleat', /single pleat|one pleat/, TROUSER],
  ['double dart front', /double dart/, TROUSER],
  ['single dart front', /single dart/, TROUSER],
  ['flat front', /flat[- ]?front|no pleat|plain front|no dart/, TROUSER],
  // trouser leg + hem
  ['tapered leg', /taper/, TROUSER],
  ['straight leg', /straight (cut|leg)/, TROUSER],
  ['wide leg', /wide leg/, TROUSER],
  ['turn-up / cuffed hem', /turn[- ]?up|cuffed hem|\bcuff\b.*hem/, TROUSER],
  ['plain hem', /plain hem/, TROUSER],
  // waistband / closure
  ['extended-tab waistband', /extended tab/, TROUSER],
  ['standard waistband', /standard waistband/, TROUSER],
  // vest front / bottom
  ['pointed bottom', /small point|pointed|\bpoint\b/, VEST],
  ['square bottom', /\bsquare\b/, VEST],
  ['flat bottom', /\bflat\b/, VEST],
  ['single-breasted', /single[- ]?breast|\bsb\b/, VEST],
  ['double-breasted', /double[- ]?breast|\bdb\b/, VEST],
];

// ---- binary flags ---------------------------------------------------------
const FLAGS = [
  ['hidden button fastening', /hidden button/],
  ['collar/closure button', /with button|button[- ]?fasten|with collar button/],
  ['tab fastening', /\btab\b/],
  ['zigzag decorative stitching', /zig[- ]?zag/],
  ['eyelet holes', /small holes|eyelet|holes\b/],
  ['cufflink closure', /cuff[- ]?link|link closure/],
  ['contrast fabric', /contrast/],
  ['contrast stripe', /stripe/],
  ['working buttonholes', /working button|functional button|surgeon/],
  ['pick / AMF edge stitch', /pick stitch|amf/],
  ['top stitch', /top[- ]?stitch/],
  ['side adjuster', /side adjust|adjuster|adjust buckle/],
  ['extended waistband tab', /extended tab|french bearer/],
  ['belt loops', /belt loop/],
  ['suspender / brace buttons', /suspender|brace button/],
  ['hook & button closure', /hook (&|and) button|button (&|and) hook/],
  ['zip fly', /zip fly/],
  ['button fly', /button fly/],
  ['strap & buckle back', /strap|buckle/],
  ['fixed / top-stitched half-belt', /fixed belt|tap strap|decorative.*belt|top.?stitched belt/],
  ['adjustable inner strap', /inner belt|inner strap|adjustable.*strap/],
  ['functional / surgeon working vent', /surgeon|functional (cuff|button|vent)|working (button|cuff|vent)/],
  ['mock / non-functional vent', /\bmock\b|non[- ]?functional/],
  ['hand-worked buttonhole', /hand[- ]?work|handmade buttonhole|milanese/],
  ['vertical buttonhole orientation', /vertical (buttonhole|direction)/],
  ['horizontal buttonhole orientation', /horizontal (buttonhole|direction)/],
];

// ---- universal finishing-detail classifier --------------------------------
// Applied to "<fieldId> <fieldLabel>" for ANY product. This is what makes the
// skill catalogue-wide and future-proof: every finishing option (thread colour,
// stitching, buttonhole, button-sewing, contrast, lining, label, piping, dart,
// interlining, splice, patch, epaulet, gusset, canvas, yoke, bias, tab,
// adjustment) gets its OWN specific profile instead of a coarse fallback —
// and a field added later auto-classifies by its label. Order = specific first.
function classifyFinish(t) {
  if (/thread colou?r|stitching colou?r|buttoning thread|colou?r on (collar|cuff|placket|band)|\bthread\b/.test(t))
    return 'fin-thread-color';
  if (/piping|columbia/.test(t)) return 'fin-piping';
  if (/buttonhole/.test(t)) return 'fin-buttonhole';
  if (/sewing button|button sewing|button style|sewing style|button choice|covered button|placket button|suspender|brace button|shirt[- ]?stay|stay button/.test(t))
    return 'fin-button';
  if (/pick stitch|top[- ]?stitch|decorat|handmade|stitch(ing)?|\bamf\b|bartack|bar tack/.test(t))
    return 'fin-stitch';
  if (/cut[- ]?out/.test(t)) return 'fin-cutout';
  if (/contrast/.test(t)) return 'fin-contrast';
  if (/lining|facing/.test(t)) return 'fin-lining';
  if (/label/.test(t)) return 'fin-label';
  if (/\bdarts?\b/.test(t)) return 'fin-dart';
  if (/felt|interlin|folded collar|fold craft|fold collar/.test(t)) return 'fin-interlining';
  if (/splic/.test(t)) return 'fin-splice';
  if (/elbow/.test(t)) return 'fin-patch';
  if (/epaulet/.test(t)) return 'fin-epaulet';
  if (/gusset/.test(t)) return 'fin-gusset';
  if (/canvas/.test(t)) return 'fin-canvas';
  if (/\byoke\b/.test(t)) return 'fin-yoke';
  if (/\bpleat\b/.test(t)) return 'fin-pleat-detail';
  if (/\bbias\b/.test(t)) return 'fin-bias';
  if (/\btab\b/.test(t)) return 'fin-tab';
  if (/adjust|fitting|extras|additional|shield|perfume|underarm|crease|heel|depth/.test(t)) return 'fin-adjust';
  return null;
}

// ---- EXCLUSION: buttons, thread colours, fabrics ---------------------------
// These are colour/material SWATCHES, not geometry — no photo is generated for
// them. They are still discovered and mapped (so coverage stays catalogue-wide),
// but flagged generate:false so the pipeline skips them. Geometric cousins that
// share these words are KEPT: contrast/fabric PLACEMENT, lining
// COVERAGE/SHAPE/CRAFT, button STANCE/COUNT/CONFIG, buttonholes, interlining.
// `t` is normalised (hyphens/underscores → spaces, lowercased).
function classifyExcluded(t) {
  // 1) thread colour / thread choice — always a swatch
  if (/thread colou?r|buttoning thread|stitching colou?r|decoration thread|\bthread\b/.test(t)) return 'thread-color';
  // 2) buttons (the fastener: sewing style / choice / covered / placket button /
  //    suspender) — but NOT button stance/count/config/number/direction/
  //    orientation (geometry), and NOT "placket buttonhole" (a buttonhole, kept)
  if (/sewing button|button sewing|button style|button choice|covered button|placket button(?!hole)|suspender|brace button|stay button|inner waistband.*button/.test(t) &&
      !/position|count|distance|spacing|stance|config|number|direction|orientation/.test(t))
    return 'button';
  // 2b) a button PICKER field. `t` begins with the fieldId, so anchoring at ^ means
  //     this fires only when the FIELD ITSELF is "button on <part>" — never on a
  //     description that happens to mention a button on something. Every option in
  //     such a field is a supplier button code (FK321201, BK267/FKE01678, "None"),
  //     which carries no geometry: it is a button swatch like any other and the
  //     mission excludes it. Found 2026-08-02: shirt/button_on_collar_stand had 140
  //     SKU rows sitting in scope, queued for photography that must not happen.
  if (/^button on (the )?(collar stand|collar|cuff|placket|front|sleeve|waistband)\b/.test(t))
    return 'button';
  // 3) fabric / lining-colour swatches — KEEP geometry (coverage/shape/craft/
  //    placement) and interlining. Collar/undercollar FELT is a melton colour swatch.
  // Note: cut-out FABRIC options are bare fabric codes (swatches), so cut-out is
  // NOT treated as keep-geometry here — it falls through to the fabric branch.
  const placement = /position|placement|coverage|shape|craft|where|height|width|length|depth/.test(t);
  if (/collar felt|undercollar felt|felt match|melton colou?r/.test(t) && !/edge|shape|width|height/.test(t)) return 'fabric';
  if (!placement) {
    if (/contrast fabric|\bfabric\b|body lining|sleeve lining|back fabric|stitching material|appoint.*(fabric|lining)/.test(t)) return 'fabric';
    if (/\blining\b/.test(t) && !/interlin/.test(t)) return 'fabric';
  }
  return null;
}

// Explicit-absence options ("No Pocket", "None", "Ventless", "Clean lapel") must
// NOT be pushed through the positive pipeline — they describe the absence of a
// feature, and ordering the model to render it produces a phantom. Detected from
// the label START so qualifiers like "Flat Front (No Dart)" (a real feature) are
// not misread as absence.
export function isAbsence(label) {
  const l = (label || '').trim().toLowerCase();
  if (/^(flat front|standard|regular|matched|match)\b/.test(l)) return false;
  return /^(no\b|none\b|without\b|clean\b|ventless\b|unlined\b)/.test(l);
}

// ---- canonical garment "part" from section/field --------------------------
// Primary structural components are matched explicitly; everything else is
// routed through classifyFinish so it still earns a specific profile. The
// garment "<x>-detail" return is the last resort (now essentially unused).
function resolvePart({ productId: rawProductId, sectionId, fieldId, fieldLabel, label }) {
  // Same authority as garmentKeyFor: a `Trousers-*` or `Vest-*` section inside a
  // suit product is a trouser or waistcoat part, and must take that branch below
  // rather than the jacket one. Without this, every trouser option filed under
  // suit-2pc classified as `jacket-detail` — so the spec, the part template and
  // the forbidden[] list were all built for the wrong garment.
  const productId = garmentKeyFor(rawProductId, sectionId);
  const f = (fieldId || '').toLowerCase();
  const s = (sectionId || '').toLowerCase();
  const fl = (fieldLabel || '').toLowerCase();
  const lab = (label || '').toLowerCase(); // option label — for option-level routing
  const t = `${f} ${fl}`.replace(/[-_]/g, ' '); // normalised for keyword classifiers
  const fin = () => classifyFinish(t);

  // SHIRT --------------------------------------------------------------
  if (productId === 'shirt') {
    if (s === 'collar' && (f === 'lapel' || fl.includes('collar style'))) return 'shirt-collar';
    if (s === 'collar' && /(stand|stay|button_on|height|design)/.test(f)) return 'shirt-collar-stand';
    if (s === 'cuffs' && f === 'cuff') return 'shirt-cuff';
    if (f === 'pocket') return 'shirt-pocket';
    if (f === 'hem') return 'shirt-hem';
    if (s === 'canvas-front' && /front|canvas|craft|sleeve/.test(f)) return 'shirt-front';
    if (s === 'back-structure' && /^back$|yoke/.test(f)) return 'shirt-back';
    const finned = fin();
    if (finned) return finned;
    if (s === 'placket') return 'shirt-placket'; // button spacing / count layout on the placket
    if (s === 'cuffs' && /(width|pleat|tab)/.test(f)) return 'shirt-cuff';
    return s === 'collar' ? 'shirt-collar-detail' : s === 'cuffs' ? 'shirt-cuff-detail' : 'shirt-detail';
  }

  // JACKETS (suit-2pc / suit-3pc / sport-coat) -------------------------
  if (productId === 'suit-2pc' || productId === 'suit-3pc' || productId === 'sport-coat') {
    if (s === 'lapel' && /^lapel-(style|width)/.test(f)) return 'jacket-lapel';
    if (s === 'lapel' && /(bh-position|position)/.test(f)) return 'jacket-lapel-bh-position';
    if (s === 'lapel' && /buttonhole|bh/.test(f)) return 'jacket-lapel-buttonhole';
    if (s === 'suit-pockets' && /chest/.test(f)) return 'jacket-chest-pocket';
    if (s === 'suit-pockets' && /ticket/.test(f)) return 'jacket-ticket-pocket';
    if (s === 'suit-pockets' && /pocket/.test(f)) return 'jacket-pocket';
    if (s === 'front-style' && /buttonhole|bh/.test(f)) return 'jacket-front-buttonhole';
    if (s === 'front-style' && /button/.test(f)) return 'jacket-front';
    if (s === 'sleeves-cuffs' && /buttonhole|bh/.test(f)) return 'jacket-sleeve-buttonhole';
    if (s === 'sleeves-cuffs' && /vent/.test(f)) return 'jacket-sleeve-vent';
    if (s === 'sleeves-cuffs' && /cuff|button|sleeve/.test(f)) return 'jacket-sleeve';
    if (s === 'back-vents' && /(belt|strap)/.test(lab)) return 'jacket-back-belt';
    if (s === 'back-vents' && /vent/.test(f)) return 'jacket-vent';
    if (s === 'shoulder-structure' && /canvas/.test(f)) return 'jacket-canvas';
    if (s === 'shoulder-structure' && /shoulder|sleeve-head|pad/.test(f)) return 'jacket-shoulder';
    if (s === 'suit-lining' || s === 'interior') return fin() || 'jacket-interior';
    return fin() || (s === 'lapel' ? 'jacket-lapel-detail' : 'jacket-detail');
  }

  // TROUSERS -----------------------------------------------------------
  if (productId === 'trousers') {
    if (s === 'front-pockets' && /front-pocket|^pocket-style/.test(f)) return 'trouser-front-pocket';
    // pocket DEPTH is an interior dimension — routed to its own part so the
    // camera profile shoots the BAG (interior view) with the waistband as anchor.
    if (/pocket-depth/.test(f)) return 'trouser-pocket-depth';
    if (s === 'front-pockets' && /(watch|coin)/.test(f)) return 'trouser-small-pocket';
    if (/^pleat|pleat-style|pleat-depth/.test(f)) return 'trouser-pleat';
    if (/fly/.test(f)) return 'trouser-fly';
    if (s === 'waistband' && /canvas/.test(f)) return 'trouser-canvas';
    // Waistband ENGINEERING FAMILIES — the differentiating component is the
    // product, not the trouser. Split the old single 'trouser-waistband' so
    // each family earns a craft-dominant macro composition (see camera.mjs in
    // garment-image-director) and its own deterministic geometry/hardware
    // extraction (see extractSpec below).
    if (/extension[- ]?length|ext[- ]?len/.test(f)) return 'trouser-extension-length';    // Family A — extension LENGTH (dimensioned)
    if (/waistband-width|^wband|\bwidth\b/.test(f)) return 'trouser-waistband-width';     // band height / width
    if (/waistband-extension|extension|closure/.test(f)) return 'trouser-extension';      // Families B+C — extension shape + hardware
    if (/metal-adjuster|adjuster|waist-detail|adjust/.test(f)) return 'trouser-adjuster'; // Family D — side / back adjuster
    if (/belt-loop/.test(f)) return 'trouser-belt-loops';                                 // supporting — loop count / placement
    if (s === 'waistband' || /\bwaist\b|waistband/.test(f)) return 'trouser-waistband';   // band construction style (fallthrough)
    if (/back-pocket/.test(f)) return 'trouser-back-pocket';
    if (s === 'back' && /^back$|center-seam|seat/.test(f)) return 'trouser-back';
    if (/hem-style|turn/.test(f)) return 'trouser-hem';
    if (/leg-shape/.test(f)) return 'trouser-leg';
    return fin() || 'trouser-detail';
  }

  // VEST / WAISTCOAT ---------------------------------------------------
  if (productId === 'vest') {
    if (s === 'front-style' && /canvas/.test(f)) return 'vest-canvas';
    if (s === 'front-style' && /bottom-shape/.test(f)) return 'vest-bottom';
    if (s === 'front-style' && /buttonhole/.test(f)) return 'vest-buttonhole';
    if (s === 'front-style' && /stance|placket/.test(f)) return 'vest-front';
    if (s === 'lapel-neckline' && /buttonhole|hole-style/.test(f)) return 'vest-buttonhole';
    if (s === 'lapel-neckline' && /neckline|lapel/.test(f)) return 'vest-lapel';
    if (/chest-pocket/.test(f)) return 'vest-chest-pocket';
    if (/pocket/.test(f)) return 'vest-pocket';
    if (s === 'back-fit' || /\bback\b/.test(f)) return 'vest-back';
    return fin() || 'vest-detail';
  }

  return classifyFinish(t) || 'generic-detail';
}

function scanList(text, table, productId) {
  const found = [];
  for (const [canonical, re, scope] of table) {
    if (scope && productId && !scope.includes(productId)) continue;
    if (re.test(text) && !found.includes(canonical)) found.push(canonical);
  }
  return found;
}

// Dimensions, angles and button counts — authoritative from label+description.
function extractMeasures(text) {
  const dims = [];
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*cm\b/gi)) {
    const v = `${m[1]} cm`;
    if (!dims.includes(v)) dims.push(v);
  }
  const angles = [];
  for (const re of [/(\d+(?:\.\d+)?)\s*°/g, /(\d+(?:\.\d+)?)\s*(?:degrees?|deg)\b/gi]) {
    for (const m of text.matchAll(re)) {
      const v = `${m[1]}°`;
      if (!angles.includes(v)) angles.push(v);
    }
  }
  const counts = [];
  // Counts are frequently WORDED, not digits: "Three on left, two on right" is
  // the entire discriminator of lapel-bh-position, and a digits-only regex
  // captured NOTHING from it. The spec then reached the prompt with an empty
  // counts[], leaving the render free to draw any number — the silent-lie
  // failure mode this file warns about elsewhere.
  const WORD_NUM = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12 };
  const NUM = '(\d+|' + Object.keys(WORD_NUM).join('|') + ')';
  const toNum = (s) => (/^\d+$/.test(s) ? s : String(WORD_NUM[String(s).toLowerCase()] ?? s));
  for (const m of text.matchAll(new RegExp(NUM + '\\s*buttonholes?\\b', 'gi'))) {
    const v = `${toNum(m[1])}-buttonhole`;
    if (!counts.includes(v)) counts.push(v);
  }
  for (const m of text.matchAll(new RegExp(NUM + '\\s*buttons?\\b', 'gi'))) {
    const v = `${toNum(m[1])}-button`;
    if (!counts.includes(v)) counts.push(v);
  }
  // Positional counts with the noun elided — "Three on left, two on right".
  // The SIDE matters as much as the number: these options differ only by which
  // lapel carries how many, and handedness is structurally invisible to QC.
  for (const m of text.matchAll(new RegExp(NUM + '\\s+on\\s+(?:the\\s+)?(left|right)\\b', 'gi'))) {
    const v = `${toNum(m[1])}-on-${m[2].toLowerCase()}`;
    if (!counts.includes(v)) counts.push(v);
  }

  // Buttonholes first (a distinct feature), then plain buttons. The \b after
  // "buttons?" already excludes "buttonhole" (n|h is not a word boundary).
  for (const m of text.matchAll(/(\d+)\s*buttonholes?\b/gi)) {
    const v = `${m[1]}-buttonhole`;
    if (!counts.includes(v)) counts.push(v);
  }
  for (const m of text.matchAll(/(\d+)\s*buttons?\b/gi)) {
    const v = `${m[1]}-button`;
    if (!counts.includes(v)) counts.push(v);
  }
  // Order matters: MOST SPECIFIC FIRST. The qualifier ("narrow"/"semi"/"cutaway")
  // must be tested before the bare noun "spread", otherwise a description like
  // "creating a narrow spread" matches /\bspread\b/ and is recorded as its exact
  // opposite — "wide spread". That inversion then propagates into the locked
  // prompt and the photo is generated wrong on purpose.
  // There must be a branch for EVERY qualifier the catalog actually uses, or the
  // unmatched ones fall through to the bare-noun branch and are recorded as
  // "wide". Four "Regular Collar" options describe a MODERATE spread and were
  // being specced as "wide spread" — aiming them at their own wide-spread
  // siblings. A missing branch is silent; it does not error, it just lies.
  const moderate = /\bmoderat|\bmid[- ]?cut/i.test(text);
  const spreadWord = [];
  if (/\bcut[- ]?away\b/i.test(text)) spreadWord.push(moderate ? 'moderate cutaway spread' : 'wide cutaway spread');
  else if (/\bsemi[- ]?spread\b/i.test(text)) spreadWord.push('moderate semi-spread');
  else if (/\bnarrow\b/i.test(text)) spreadWord.push('narrow spread');
  else if (moderate) spreadWord.push('moderate spread');
  else if (/\bspread\b/i.test(text)) spreadWord.push('wide spread');
  return { dims, angles, counts, spreadWord };
}

// ---- WAISTBAND ENGINEERING-FAMILY extractors ------------------------------
// Run ONLY for the waistband-family parts (see extractSpec). Kept out of the
// global SHAPES/FLAGS tables so plain words like "round"/"square"/"double" in an
// unrelated trouser description can never mis-tag a non-waistband option.

// Family B — extension tab geometry. The smallest differentiator between two
// otherwise-identical closures is the corner/point profile of the tab.
function classifyExtensionShape(text) {
  const t = text.toLowerCase();
  const shapes = [];
  // a doubled / overlapping (double-WIDTH) extension tab — distinct from "double hooks"
  const dbl = /\bdouble (sharp|round|square)\b|\bdouble extension\b|double[- ]?width/.test(t);
  if (/sword[- ]?point/.test(t)) shapes.push('sword-point extension tab');
  else if (/notch(ed)?[- ]?point|notched point/.test(t)) shapes.push('notched-point extension tab');
  else if (/double[- ]?point/.test(t)) shapes.push('double-point extension tab');
  else if (/\bsharp\b|\bpointed\b|\bpoint\b/.test(t)) shapes.push((dbl ? 'double ' : '') + 'sharp pointed extension tab');
  else if (/\bround(ed)?\b/.test(t)) shapes.push((dbl ? 'double ' : '') + 'rounded extension tab');
  else if (/\bsquare\b/.test(t)) shapes.push((dbl ? 'double ' : '') + 'square extension tab');
  else if (/\bstraight\b/.test(t)) shapes.push('straight extension tab');
  else if (/single[- ]?side/.test(t)) shapes.push('single-side extension tab');
  if (dbl && !shapes.some((s) => s.startsWith('double'))) shapes.push('double-width extension tab');
  if (/no extension/.test(t)) shapes.push('no extension tab — closure flush to the band');
  return shapes;
}

// Family C — closure hardware. Hook count is the product for the hook variants;
// hooks are never parsed by extractMeasures, so do it here.
function extractHardware(text) {
  const t = text.toLowerCase();
  const counts = [];
  const flags = [];
  let hooks = 0;
  if (/\bfour hooks?\b|\b4 hooks?\b/.test(t)) hooks = 4;
  else if (/\bdouble hooks?\b|\btwo hooks?\b|\b2 hooks?\b/.test(t)) hooks = 2;
  else if (/\bdouble (button|btn)[- ]?(?:&|and|\s)?[- ]?hook\b/.test(t)) hooks = 2; // "double button & hook"
  else if (/\bhook\b/.test(t)) hooks = 1;
  let buttons = 0;
  if (/\bdouble (button|btn)\b|\btwo buttons?\b|\b2 buttons?\b/.test(t)) buttons = 2;
  else if (/\bbutton\b/.test(t)) buttons = 1;
  if (hooks) counts.push(`${hooks}-hook`);
  if (buttons) counts.push(`${buttons}-button`);
  if (/\bvertical\b/.test(t)) flags.push('vertical hook orientation');
  if (/\bhorizontal\b/.test(t)) flags.push('horizontal hook orientation');
  if (hooks && buttons) flags.push('hook & button closure');
  else if (hooks) flags.push('hook-only closure');
  else if (buttons) flags.push('button-only closure');
  if (/\bbuckle\b/.test(t)) flags.push('buckle hardware');
  if (/square[- ]?head/.test(t)) flags.push('square-head hardware');
  return { counts, flags };
}

// Family D — side / back adjuster mechanism.
function classifyAdjuster(text) {
  const t = text.toLowerCase();
  const shapes = [];
  const flags = [];
  if (/no adjuster|standard \(no/.test(t)) {
    shapes.push('no side adjuster — clean plain waistband side');
    return { shapes, flags };
  }
  if (/buckle/.test(t)) shapes.push('metal side-adjuster with buckle');
  if (/square.*(button|tab)|button adjust|tab adjust|adjust(ment)? tab/.test(t)) shapes.push('square button-tab adjuster');
  if (/\bloop\b/.test(t)) shapes.push('adjuster paired with a belt loop');
  if (/\bstrap\b/.test(t)) shapes.push('strap-and-buckle adjuster');
  if (!shapes.length) shapes.push('side-adjuster mechanism');
  if (/outseam/.test(t)) flags.push('adjuster on the outseam');
  if (/waistband|back/.test(t)) flags.push('adjuster on the waistband');
  return { shapes, flags };
}

// ---- MUTUALLY-EXCLUSIVE SHAPE FAMILIES -----------------------------------
// A description often names a SIBLING option to contrast against it ("avoids
// the droop of a ROUND hem", "unlike a NOTCH lapel"). scanList reads the whole
// text, so those contrast mentions get tagged as if the option HAD that shape,
// producing a self-contradictory spec ("curved hem, straight hem") that tells
// the image model to render two incompatible geometries at once.
//
// Resolution: the option's LABEL is its identity in this catalog. Within a
// family whose members cannot co-exist, if the label names one or more members,
// keep only those and drop the rest (they came from prose). If the label names
// none, keep everything — we cannot disambiguate deterministically, and
// silently picking one would be inventing. Genuinely dual options ("Peak +
// Removable Shawl") name both in the label and correctly keep both.
const EXCLUSIVE_SHAPE_FAMILIES = [
  { members: ['peak lapel', 'notch lapel', 'shawl lapel'],
    label: { 'peak lapel': /peak/i, 'notch lapel': /notch/i, 'shawl lapel': /shawl/i } },
  { members: ['curved hem', 'straight hem', 'squared hem'],
    label: { 'curved hem': /curved|round/i, 'straight hem': /straight/i, 'squared hem': /square/i } },

  // POCKET MOUTH CONSTRUCTION. How the opening is finished — these cannot
  // co-exist on one pocket. Measured 2026-08-01: `cp-welt-23` extracted BOTH
  // `jetted / besom welt` AND `welt pocket`, because its description mentioned
  // "jetted work on the welt fabric", while its siblings cp-welt-25 and -27
  // extracted `welt pocket` alone. `cp-jetted` carried the same contradiction in
  // the other direction. A welt pocket has a standing welt; a besom does not.
  // Telling the model to render both is the "curved hem, straight hem" failure
  // exactly, on a family that had no rule.
  //
  // `flap pocket` is deliberately NOT a member: a flap sits over a jetted mouth,
  // so the two legitimately co-occur. Nor are `slant`/`on-seam` (orientation and
  // placement, not construction) or `ticket`/`watch`/`coin` (identity).
  { members: ['patch pocket', 'jetted / besom welt', 'welt pocket', 'barchetta (boat) welt'],
    label: {
      'patch pocket': /patch/i,
      'jetted / besom welt': /jetted|besom/i,
      'welt pocket': /\bwelt\b/i,
      'barchetta (boat) welt': /barchetta|boat/i,
    } },

  // JEANS POCKET SHAPE. jeans-arc and jeans-square rendered the same pocket and
  // scored 15-24; their descriptions each named the other's geometry.
  { members: ['jeans square pocket', 'jeans arc pocket', 'jeans diamond pocket', 'jeans round pocket'],
    label: {
      'jeans square pocket': /square/i,
      'jeans arc pocket': /\barc\b/i,
      'jeans diamond pocket': /diamond/i,
      'jeans round pocket': /round/i,
    } },

  // WAISTCOAT NECKLINE. u-neckline's own description described a wide, deep
  // opening when the drawing shows a long narrow one with near-parallel edges —
  // prose that names the sibling shape it is not.
  { members: ['V-neckline', 'U-neckline'],
    label: { 'V-neckline': /v[- ]?neck/i, 'U-neckline': /u[- ]?neck/i } },
];

// Styles so distinctive that they must be NAMED IN THE LABEL to be real. The
// family rule above cannot catch these: it only fires when two family members
// are both present AND the label supports one of them. "Hidden Button 7.5 cm"
// mentions neither "point" nor "button-down", so the family rule bails out and
// the false positive survives.
//
// Measured 2026-07-28: three options were tagged 'button-down point' purely from
// contrast prose — "the sweet spot between the long traditional point and the
// casual BUTTON-DOWN", "marries the tidiness of a BUTTON-DOWN", "functionally
// similar to a BUTTON-DOWN collar but invisible". The first rendered a button on
// the collar leaf and became indistinguishable from its sibling
// collar-point-70-btn; the other two are HIDDEN-button options, where a visible
// button is the exact opposite of what the option means.
const LABEL_GATED_SHAPES = [
  { shape: 'button-down point', label: /button[- ]?down/i },
];

function resolveExclusiveShapes(shapes, label, _productId, removed = []) {
  if (!Array.isArray(shapes) || shapes.length === 0) return shapes;
  const lab = String(label || '');
  let out = shapes.slice();

  // The label gate runs BEFORE the "fewer than two shapes, nothing to resolve"
  // shortcut, and that ordering is the point. A LABEL_GATED_SHAPE is false
  // whenever the label does not name it, regardless of what else was extracted —
  // an option left holding ONLY `button-down point`, scraped from a contrast
  // clause, is exactly as wrong as one holding it alongside a real shape, and
  // more dangerous, because there is no competing shape to make the conflict
  // visible. The old guard returned early in precisely that case.
  for (const g of LABEL_GATED_SHAPES) {
    if (out.includes(g.shape) && !g.label.test(lab)) {
      out = out.filter((s) => s !== g.shape);
      // Report it. Dropping the shape stops the prompt ASSERTING the feature,
      // but the sentence that produced it is still in the catalog description,
      // and the prompt quotes that description verbatim. So the model is still
      // told about a "casual button-down" — just no longer told to render one.
      // The caller turns each removal into an explicit NEGATIVE, which is the
      // only thing that actually cancels the prose.
      removed.push(g.shape);
    }
  }

  if (out.length < 2) return out;                        // nothing left to resolve
  for (const fam of EXCLUSIVE_SHAPE_FAMILIES) {
    const present = out.filter((s) => fam.members.includes(s));
    if (present.length < 2) continue;                    // no conflict in this family
    const supported = present.filter((s) => fam.label[s] && fam.label[s].test(lab));
    if (!supported.length || supported.length === present.length) continue; // label can't disambiguate
    const drop = new Set(present.filter((s) => !supported.includes(s)));
    out = out.filter((s) => !drop.has(s));
  }
  return out;
}

// Main entry: option record (from catalog.mjs) -> structured spec.
export function extractSpec(opt) {
  const fileStem = opt.image ? path.basename(opt.image).replace(/\.[a-z0-9]+$/i, '') : '';
  const textCore = `${opt.label} ${opt.description}`;
  const text = `${textCore} ${opt.hint} ${fileStem.replace(/[-_]/g, ' ')}`.toLowerCase();

  const part = resolvePart(opt);
  const { dims, angles, counts, spreadWord } = extractMeasures(textCore + ' ' + opt.hint);
  // `negatedShapes` are styles the description NAMED but the label does not
  // claim — almost always a comparative clause ("the sweet spot between the long
  // traditional point and the casual button-down"). Dropping them from `shapes`
  // stops the prompt asserting the feature, but the prose survives verbatim in
  // the prompt's description block, so the model is still told about it. The
  // director turns each of these into an explicit NEGATIVE, which is the only
  // thing that actually cancels the sentence.
  const negatedShapes = [];
  const shapes = resolveExclusiveShapes(
    scanList(text, SHAPES, opt.productId), opt.label, opt.productId, negatedShapes);
  const flags = scanList(text, FLAGS, opt.productId);

  // Absence must be resolved BEFORE family augmentation so a positive shape /
  // hardware token is never attached to an option that is the ABSENCE of a
  // feature (e.g. "No Back Detail" / "no adjustment tab" must not parse as an
  // adjuster, and would then render a phantom).
  let absence = isAbsence(opt.label);
  // "No Extension, Button/Hook Only" is the absence of the TAB, not of the
  // closure — there is still real hardware to photograph, so keep it positive.
  if (part === 'trouser-extension' && /button|hook/.test(textCore.toLowerCase())) absence = false;

  // WAISTBAND ENGINEERING-FAMILY augmentation — parse the differentiating
  // component (extension shape, closure hardware, adjuster, loop count) so it
  // reaches requiredTokens, the prompt and the verification checklist. The
  // width family already carries its cm via extractMeasures (dims). Skipped for
  // absence options (they render a clean area, not a phantom feature).
  const famText = `${textCore} ${fileStem.replace(/[-_]/g, ' ')}`;
  // The tab's corner/point profile is canonical in the LABEL (and the factory
  // filename) — the prose description may say e.g. "sharp, finished front" about
  // the look, which must not be read as a sharp-point tab. So shape from label.
  const shapeText = `${opt.label} ${fileStem.replace(/[-_]/g, ' ')}`;
  const merge = (arr, vals) => { for (const v of vals) if (!arr.includes(v)) arr.push(v); };
  if (!absence && part === 'trouser-extension') {
    merge(shapes, classifyExtensionShape(shapeText));
    const hw = extractHardware(textCore);
    merge(counts, hw.counts);
    merge(flags, hw.flags);
  } else if (!absence && part === 'trouser-adjuster') {
    const adj = classifyAdjuster(famText);
    merge(shapes, adj.shapes);
    merge(flags, adj.flags);
    const hw = extractHardware(textCore);
    merge(counts, hw.counts);
    merge(flags, hw.flags);
  } else if (!absence && part === 'trouser-belt-loops') {
    for (const m of textCore.toLowerCase().matchAll(/(\d+)\s*loops?\b/g)) merge(counts, [`${m[1]}-loop`]);
    if (/passant|double/.test(textCore.toLowerCase())) merge(shapes, ['double / passant loops']);
    if (/x[- ]?style|crossed/.test(textCore.toLowerCase())) merge(shapes, ['X-style crossed front loops']);
    if (/one loop|single.*loop|right front only/.test(textCore.toLowerCase())) merge(counts, ['1-loop']);
  }

  // Exclusion axis (buttons / thread colours / fabrics) — swatches we do not
  // generate. Considered across fieldId + fieldLabel + the option label itself.
  const exclText = `${opt.fieldId} ${opt.fieldLabel} ${opt.label} ${opt.description}`.replace(/[-_]/g, ' ').toLowerCase();
  const excluded = classifyExcluded(exclText);
  const hasBlueprint = Boolean(opt.imageExists || isRemote(opt.image));

  return {
    addr: opt.addr,
    productId: opt.productId,
    sectionId: opt.sectionId,
    fieldId: opt.fieldId,
    optionId: opt.optionId,
    sourceFile: opt.sourceFile,
    source: opt.source,
    part,
    // Keyed on the SECTION where the section names a garment, else the product.
    // See SECTION_GARMENT above.
    garmentNoun: GARMENT_NOUN[garmentKeyFor(opt.productId, opt.sectionId)] || 'bespoke garment',
    fabric: FABRIC[garmentKeyFor(opt.productId, opt.sectionId)] || 'fine cloth',
    label: opt.label,
    description: opt.description,
    fieldLabel: opt.fieldLabel,
    sectionLabel: opt.sectionLabel,
    dimensions: dims,
    angles,
    counts,
    spread: spreadWord,
    shapes,
    negatedShapes,
    flags,
    illustration: opt.image,
    illustrationDisk: opt.imageDisk,
    illustrationExists: opt.imageExists,
    illustrationRemote: isRemote(opt.image),
    excluded, // 'button' | 'thread-color' | 'fabric' | null — swatch, do not generate
    absence, // true → the option is the ABSENCE of a feature (render clean, not a phantom)
    hasBlueprint,
    generate: hasBlueprint && !excluded, // the option is in scope for photo generation
  };
}

// ---- forbidden-feature list -------------------------------------------
// The structural half of the negative-constraint system (the user's "FORBIDDEN
// FEATURES" list) — derived purely from the spec, before any photography
// concern is added. garment-image-director merges this with its own universal
// photography negatives (illustration/CGI look, watermark, annotation text…)
// when it assembles the final prompt. Kept per-option, not one generic list for
// every garment, per the option-isolation rule.
export function computeForbidden(spec) {
  const out = [];
  const feature = (spec.fieldLabel || spec.label || 'this feature').toLowerCase();
  if (spec.absence) {
    out.push(`any ${feature} rendered anywhere in frame — this option is its deliberate absence`);
  }
  out.push('a generic version of this part standing in for the exact drawn option (generic-category substitution)');
  out.push('any feature, count, or geometry borrowed from a neighboring craft option on the same field');
  out.push('a feature that belongs on the opposite face of the garment from what this illustration shows (front/back/side confusion)');
  for (const c of spec.counts || []) {
    const m = c.match(/^(\d+)-(hook|button|buttonhole|loop)$/);
    if (m) out.push(`any ${m[2]} count other than exactly ${m[1]}`);
  }
  if (spec.shapes.some((s) => /ventless/i.test(s))) out.push('any back vent (this option is ventless)');
  if (spec.flags.some((f) => /no side adjuster/i.test(f))) out.push('a side adjuster of any kind');

  // SIBLING-SHAPE NEGATIVES. Saying what a thing IS does not stop the model
  // reaching for its training prior — a "Square 6.5 cm" collar came back with
  // sharp acute points twice, because "dress shirt collar" overwhelmingly means
  // "pointed" to the model. Naming the WRONG terminal shape explicitly is what
  // actually suppresses it, so for each mutually-exclusive terminal-shape
  // family we forbid every member the option is not.
  for (const fam of TERMINAL_SHAPE_FAMILIES) {
    const mine = fam.groups.filter((g) => g.match.some((m) => spec.shapes.includes(m)));
    if (mine.length !== 1) continue; // absent, or genuinely dual — say nothing
    // Each group's `forbid` already names the shapes that group is NOT, so it
    // is emitted for the option's OWN group. (Emitting the other groups'
    // strings forbids the option's own shape — verified wrong.)
    out.push(`${mine[0].forbid} — this option's ${fam.what} is ${mine[0].describe}`);
  }
  return out;
}

// Mutually-exclusive terminal shapes, per garment part. Only one group can be
// true of a given option, so the others are safe to forbid outright.
const TERMINAL_SHAPE_FAMILIES = [
  {
    what: 'collar point termination',
    groups: [
      { match: ['point', 'long point', 'fashion point'],
        describe: 'a straight acute point',
        forbid: 'collar leaves ending in a squared/blunt flat edge, or in a rounded club tip' },
      { match: ['curved point', 'rounded point'],
        describe: 'a softly curved point',
        forbid: 'collar leaves ending in a hard straight acute point, a squared flat edge, or a full club round' },
      { match: ['square', 'small square'],
        describe: 'a flat SQUARED-OFF terminal edge',
        forbid: 'collar leaves tapering to a sharp acute point or to a rounded club tip' },
      { match: ['club / rounded'],
        describe: 'a fully rounded club tip',
        forbid: 'collar leaves ending in a sharp acute point or a squared flat edge' },
    ],
  },
];
