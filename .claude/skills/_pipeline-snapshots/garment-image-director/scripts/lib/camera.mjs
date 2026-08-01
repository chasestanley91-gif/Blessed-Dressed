// camera.mjs — how each garment part is presented and framed. This is the
// HOW-to-photograph half of what used to be one combined table; the WHAT-is-it
// half (the `part` classification itself) lives in tech-pack-interpreter's
// spec.mjs. Keeping them separate means a part's construction facts never
// change when its photography style is tuned, and vice versa.
//
// `resolveStyling(spec)` takes a garment spec (loaded from spec.json — see
// `specFromRecord` in prompt.mjs) and returns { base, focus[], crop, accessory }.

const STYLE = {
  // SHIRT
  // COLLARS ARE SHOT GARMENT-ONLY, matching how the reference images present
  // them. Demanding "worn on a male model" when the reference is a garment-only
  // detail forces the model to re-stage the shot, and re-staging is where it
  // falls back on its prior and loses the drawn geometry — square collar tips
  // came back as sharp points every time. Removing the wearer also removes the
  // jaw/face intrusion that QC flagged on nearly every collar candidate.
  'shirt-collar': { base: 'presented on a crisply pressed white dress shirt as a close product detail, with NO model, NO face, NO neck and NO skin anywhere in frame', focus: ['collar point geometry', 'collar stand', 'collar roll', 'stitching precision'], crop: 'tight on the collar and neckline' },
  'shirt-collar-stand': { base: 'presented on a crisply pressed white dress shirt, collar shown in profile, with NO model, NO face, NO neck and NO skin anywhere in frame', focus: ['collar stand height', 'band seam', 'interlining edge', 'topstitch'], crop: 'macro on the collar band/stand' },
  'shirt-collar-detail': { base: 'presented on a crisply pressed white dress shirt as a close product detail, with NO model, NO face, NO neck and NO skin anywhere in frame', focus: ['the named collar detail', 'stitching', 'edge finish'], crop: 'macro on the collar detail' },
  'shirt-placket': { base: 'worn on a male model', focus: ['placket width', 'button spacing', 'edge stitching', 'buttonholes'], crop: 'vertical macro down the placket' },
  'shirt-cuff': { base: 'worn on a male model, forearm raised to present the cuff', focus: ['cuff edge', 'closure', 'corner shape', 'topstitch'], crop: 'tight on the cuff' },
  'shirt-cuff-detail': { base: 'worn on a male model, cuff presented', focus: ['the named cuff detail', 'stitching'], crop: 'macro on the cuff detail' },
  'shirt-pocket': { base: 'worn on a male model', focus: ['chest pocket shape', 'pattern match', 'edge stitch'], crop: 'tight on the left chest pocket' },
  'shirt-hem': { base: 'worn on a male model, untucked to show the hem', focus: ['hem curve/shape', 'side gusset', 'rolled edge'], crop: 'on the shirttail hem' },
  'shirt-front': { base: 'worn on a male model', focus: ['front placket/interlining read', 'drape', 'fabric hand'], crop: 'on the shirt front' },
  'shirt-back': { base: 'worn on a male model, rear three-quarter', focus: ['yoke', 'box/side pleats', 'back seams'], crop: 'on the upper back/yoke' },
  'shirt-detail': { base: 'worn on a male model', focus: ['the named construction detail'], crop: 'macro on the detail' },

  // JACKET
  // NO TIE — third and last part to get this fix. Measured 2026-08-01 on the
  // legacy shipped images: ten of twelve shirt-collar photographs are worn with
  // a necktie, and it conceals the collar band on ALL ten, completely on four.
  // A lapel is no safer. A four-in-hand runs down the opening between the two
  // lapels, over the lower half of each and over the point where they meet —
  // and for the shawl family that foot is precisely the discriminator: measured
  // against the neckband landmark, the three shawl blueprints differ at the foot
  // by 0.101 / 0.247 / 0.365, a 3.6x spread, while differing across the chest by
  // far less. A tie hides the one place they separate.
  // 'relationship to the tie knot' left the tie in the focus list even when the
  // styling dropped it, which is how a removed feature comes back.
  'jacket-lapel': { base: 'worn on a male model over a crisp white dress shirt with NO necktie and nothing at the throat', focus: ['lapel width at its widest point', 'peak/notch/shawl geometry', 'gorge position', 'lapel roll and edge stitch', 'the lower end of the lapel and the exact point at which its edges terminate, completely unobstructed'], crop: 'chest-up, the lapel dominating the frame' },
  'jacket-lapel-buttonhole': { base: 'worn on a male model', focus: ['lapel buttonhole shape and stitch (Milanese/AMF/keyhole/straight)', 'the specific decorative buttonhole form drawn', 'thread'], crop: 'macro on the lapel buttonhole' },
  'jacket-lapel-bh-position': { base: 'worn on a male model, chest-up showing both lapels', focus: ['buttonhole count per lapel', 'left/right placement as drawn', 'symmetry between sides'], crop: 'chest-up, both lapels in frame' },
  'jacket-front-buttonhole': { base: 'worn on a male model', focus: ['front buttonhole construction (hand vs machine)', 'stitch density and keyhole', 'thread'], crop: 'macro on the front buttonhole' },
  'jacket-sleeve-buttonhole': { base: 'worn on a male model, cuff presented', focus: ['sleeve buttonhole orientation (straight vs slanted)', 'which buttonhole is functional', 'stitch'], crop: 'macro on the sleeve cuff buttonholes' },
  'jacket-back-belt': { base: 'worn on a male model, rear three-quarter', focus: ['half-belt panel height and width', 'horizontal placement across the waist seam', 'button/buckle stance, fixed vs adjustable strap', 'the side vents below it'], crop: 'on the back waist half-belt and the vents below it' },
  'jacket-lapel-detail': { base: 'worn on a male model over a white shirt, no necktie', focus: ['the named lapel/collar detail', 'edge', 'roll'], crop: 'on the lapel/collar' },
  'jacket-chest-pocket': { base: 'worn on a male model', focus: ['breast pocket shape (barchetta/welt)', 'curve', 'pattern match'], crop: 'on the left breast pocket' },
  'jacket-ticket-pocket': { base: 'worn on a male model', focus: ['ticket pocket above the hip flap', 'welt alignment'], crop: 'on the right hip pockets' },
  'jacket-pocket': { base: 'worn on a male model', focus: ['pocket style (jetted/flap/patch)', 'welt', 'flap shape', 'pattern match'], crop: 'on the hip pocket' },
  'jacket-front': { base: 'worn on a male model, jacket buttoned', focus: ['button stance/configuration', 'front quarters', 'chest drape'], crop: 'on the jacket front' },
  'jacket-front-detail': { base: 'worn on a male model', focus: ['the named front detail', 'dart/quarter line'], crop: 'on the jacket front' },
  'jacket-sleeve': { base: 'worn on a male model, cuff presented', focus: ['sleeve button count/spacing', 'kissing/stacked buttons', 'cuff edge'], crop: 'on the jacket cuff' },
  'jacket-sleeve-vent': { base: 'worn on a male model, cuff presented', focus: ['working sleeve buttonholes', 'vent open/stacked', 'thread'], crop: 'on the jacket cuff vent' },
  'jacket-vent': { base: 'worn on a male model, rear three-quarter', focus: ['vent style (none/single/double)', 'vent length', 'clean back drape'], crop: 'on the back hem/vent' },
  'jacket-back-detail': { base: 'worn on a male model, rear three-quarter', focus: ['the named back detail'], crop: 'on the back' },
  'jacket-canvas': { base: 'matching the construction depicted in the illustration (cross-section OR draped chest, whichever is drawn)', focus: ['canvas extent as drawn (fused/half/full floating)', 'chest and lapel roll', 'how far the canvas runs'], crop: 'as the blueprint frames it — do not invent a cross-section if none is drawn' },
  'jacket-shoulder': { base: 'worn on a male model, upper-chest/shoulder framing', focus: ['shoulder line and sleeve-head treatment as drawn (roped/extended vs natural vs shirt-sleeve pucker)', 'padding level', 'armhole-seam transition'], crop: 'on the shoulder and sleeve head as the blueprint shows it' },
  'jacket-stitch': { base: 'worn on a male model', focus: ['pick/AMF stitch along the edge', 'stitch pitch', 'thread'], crop: 'macro on the edge stitch' },
  'jacket-interior': { base: 'jacket opened to show the interior', focus: ['lining coverage', 'facing', 'interior pockets', 'piping'], crop: 'on the jacket interior' },
  'jacket-detail': { base: 'worn on a male model', focus: ['the named construction detail'], crop: 'macro on the detail' },

  // TROUSERS
  'trouser-front-pocket': { base: 'on a male model, front three-quarter view of the trousers from waistband to mid-thigh', focus: ['front pocket opening style (slant/on-seam/welt/jeans)', 'opening angle', 'edge stitch'], crop: 'the clean front of the trousers with the hip pocket opening as the sharp focal point' },
  'trouser-small-pocket': { base: 'on a male model, front view of the trousers from waistband to hip', focus: ['watch/coin pocket placement', 'welt', 'size'], crop: 'the upper front of the trousers, the small watch/coin pocket the clear focal point' },
  'trouser-pocket-detail': { base: 'on a male model, front hip framing of the trousers', focus: ['pocket topstitch/bartack', 'stitch lines', 'reinforcement'], crop: 'close on the pocket edge with the trouser hip still legible around it' },
  'trouser-pleat': { base: 'on a male model, front view of the trousers from waistband to knee', focus: ['pleat/dart count and direction', 'pleat depth', 'fall to the knee'], crop: 'the clean trouser front, the pleats falling from the waistband the clear focal point' },
  'trouser-fly': { base: 'on a male model, front view of the trousers from waistband to upper thigh', focus: ['fly style (zip/button)', 'fly topstitch curve', 'closure'], crop: 'the centre front of the trousers, the fly closure the clear focal point' },
  'trouser-crease': { base: 'on a male model, full-length view of the trousers', focus: ['centre crease sharpness', 'leg line'], crop: 'the full trouser front, the centre crease running clean down the leg' },
  'trouser-waistband': { base: 'on a male model, front view of the trousers from waistband to hip', focus: ['waistband style/width', 'closure (hook & button)', 'side adjusters/belt loops/extended tab'], crop: 'the waistband across the front of the trousers as the clear focal point' },
  // Waistband ENGINEERING FAMILIES — luxury-watch / macro documentation framing.
  // The differentiating component is the hero subject (40–60% of frame); the
  // trouser is cropped to context only — no knees, legs, pose, jacket or styling.
  'trouser-waistband-width': { base: 'as an extreme macro of the waistband BAND only, the trouser cropped away above the hip so only the band shows', focus: ['exact waistband band height/width', 'top folded edge', 'bottom seam to the body', 'curtain line just below the band'], crop: 'a tight horizontal macro of the waistband band — its HEIGHT the entire subject, filling 40–60% of the frame; no legs, fly or pocket in frame' },
  'trouser-extension-length': { base: 'as a flat-lay-style macro of the waistband UNFASTENED and laid OPEN, the inner extension (French-bearer) tab extended out flat so its full length reads end to end, the trouser cropped to the waistband only', focus: ['the exact LENGTH of the extended bearer tab from the fly to its end', 'the tab end / termination shape', 'the hook/button at the tab end', 'flat, pressed band with no legs in frame'], crop: 'a tight macro of the OPEN waistband with the bearer tab laid out flat — the tab LENGTH the whole subject, filling 40–60% of the frame; no legs or pose' },
  'trouser-extension': { base: 'as a macro of the waistband CLOSURE area only — the extension tab and its hardware — the trouser cropped to just the band end and the upper edge of the front pocket for context', focus: ['extension tab outline / point / corner geometry as drawn', 'exact hook and button count, placement, orientation and spacing', 'tab termination point', 'flat, pressed, symmetrical closure'], crop: 'a tight macro on the fully-fastened extension tab and its closure hardware, filling 40–60% of the frame; fly and legs excluded' },
  'trouser-adjuster': { base: 'as a macro of the side adjuster on the waistband, the trouser cropped to the side-waist area only', focus: ['adjuster mechanism geometry (buckle / strap / button tab / loop) as drawn', 'placement on the outseam or waistband', 'exact hardware count and left/right symmetry', 'strap / tab shape and how it engages'], crop: 'a tight macro on the side-adjuster hardware, filling 40–60% of the frame; no legs or pose' },
  'trouser-belt-loops': { base: 'as a macro across the front waistband, the trouser cropped to the band only', focus: ['exact belt-loop count and even placement', 'loop width and height', 'how each loop is bartacked to the band'], crop: 'a tight macro across the waistband showing the loops, filling 40–60% of the frame; no legs or pose' },
  'trouser-canvas': { base: 'waistband cut-through construction macro', focus: ['waistband canvas (fused/half/full)', 'curtain/lining'], crop: 'on the inner waistband layers' },
  'trouser-back-pocket': { base: 'on a male model, rear view of the trousers from waistband to mid-thigh', focus: ['back pocket style (welt/button/flap)', 'count and placement', 'bartack'], crop: 'the clean back of the trousers with the rear pocket(s) as the sharp focal point' },
  'trouser-back': { base: 'on a male model, rear view of the trousers from waistband to thigh', focus: ['back darts/seam', 'rise', 'seat drape'], crop: 'the seat and back of the trousers, clean and well-draped' },
  'trouser-hem': { base: 'on a male model, lower-leg view of the trousers from mid-calf to the floor', focus: ['hem finish (plain vs turn-up)', 'cuff depth', 'break', 'heel guard'], crop: 'the trouser hem and its break over the shoe as the clear focal point' },
  'trouser-leg': { base: 'on a male model, full-length view of the trousers', focus: ['leg line (tapered/straight/wide)', 'knee-to-hem taper'], crop: 'the full leg line from waistband to hem' },
  'trouser-stitch': { base: 'on a male model', focus: ['pick/topstitch', 'thread', 'stitch pitch'], crop: 'macro on the stitch' },
  'trouser-detail': { base: 'on a male model', focus: ['the named detail'], crop: 'macro on the detail' },

  // VEST / WAISTCOAT
  'vest-front': { base: 'worn on a male model', focus: ['button stance (SB/DB, count)', 'front drape', 'placket'], crop: 'on the waistcoat front' },
  'vest-bottom': { base: 'worn on a male model', focus: ['front bottom shape (pointed/square/flat)', 'hem points', 'lowest button stance'], crop: 'on the waistcoat front hem' },
  'vest-lapel': { base: 'worn on a male model', focus: ['neckline/lapel geometry (V/U/notch)', 'lapel width', 'gorge', 'edge'], crop: 'on the waistcoat neckline/lapel' },
  'vest-buttonhole': { base: 'worn on a male model', focus: ['buttonhole style/position', 'thread', 'keyhole vs straight'], crop: 'macro on the waistcoat buttonhole' },
  'vest-chest-pocket': { base: 'worn on a male model', focus: ['breast welt/besom pocket', 'angle', 'edge'], crop: 'on the waistcoat breast pocket' },
  'vest-pocket': { base: 'worn on a male model', focus: ['welt pocket shape', 'width', 'edge stitch'], crop: 'on the waistcoat pocket' },
  'vest-canvas': { base: 'chest cut-through macro', focus: ['canvas/chest construction (full/half/unconstructed)', 'chest roll'], crop: 'on the waistcoat chest' },
  'vest-back': { base: 'worn on a male model, rear view', focus: ['back fabric/strap', 'adjuster buckle', 'belt width'], crop: 'on the waistcoat back' },
  'vest-stitch': { base: 'worn on a male model', focus: ['pick/top stitch', 'thread', 'pitch'], crop: 'macro on the stitch' },
  'vest-detail': { base: 'worn on a male model', focus: ['the named detail'], crop: 'macro on the detail' },

  // FINISHING DETAILS (shared across all garments; garment noun supplies context)
  'fin-thread-color': { base: 'worn on a male model', focus: ['the stitch/buttonhole thread colour against the fabric', 'exact thread shade', 'stitch line'], crop: 'macro on the stitched edge' },
  'fin-stitch': { base: 'worn on a male model', focus: ['decorative stitch type and pitch', 'placement and run', 'thread'], crop: 'macro on the stitch line' },
  'fin-buttonhole': { base: 'worn on a male model', focus: ['buttonhole stitch (machine / hand / Milanese)', 'keyhole vs straight', 'thread and bar tack'], crop: 'macro on the buttonhole' },
  'fin-button': { base: 'worn on a male model', focus: ['button and shank', 'sewing pattern (cross / parallel / claw)', 'thread wrap'], crop: 'macro on a fastened button' },
  'fin-contrast': { base: 'worn on a male model', focus: ['contrast fabric panel', 'exact placement/position', 'edge seam join'], crop: 'on the contrast detail' },
  'fin-cutout': { base: 'worn on a male model', focus: ['cut-out fabric shape', 'placement', 'edge finish'], crop: 'macro on the cut-out detail' },
  'fin-lining': { base: 'garment opened to show the interior', focus: ['lining fabric and coverage', 'sheen (Bemberg/cupro)', 'seam'], crop: 'on the interior lining' },
  'fin-label': { base: 'garment opened to show the interior', focus: ['interior label', 'exact placement', 'stitch frame'], crop: 'macro on the interior label' },
  'fin-piping': { base: 'garment opened to show the interior', focus: ['interior piping / Columbia seam geometry and run', 'where the piping sits', 'clean even line'], crop: 'on the interior piping' },
  'fin-dart': { base: 'worn on a male model', focus: ['shaping dart line and length', 'placement', 'press'], crop: 'on the shaping dart' },
  'fin-interlining': { base: 'worn on a male model', focus: ['collar felt / interlining edge', 'roll and fold', 'crispness'], crop: 'macro on the collar interlining' },
  'fin-splice': { base: 'worn on a male model', focus: ['splice seam join', 'pattern alignment', 'stitch'], crop: 'macro on the splice seam' },
  'fin-patch': { base: 'worn on a male model, elbow presented', focus: ['elbow patch shape', 'stitch', 'placement'], crop: 'on the elbow patch' },
  'fin-epaulet': { base: 'worn on a male model', focus: ['shoulder epaulet shape', 'button', 'stitch'], crop: 'on the shoulder epaulet' },
  'fin-gusset': { base: 'worn on a male model', focus: ['side hem gusset', 'reinforcement', 'stitch'], crop: 'on the side hem gusset' },
  'fin-canvas': { base: 'cut-through / cross-section construction macro', focus: ['canvas/construction layer (fused/half/full)', 'chest roll'], crop: 'a labelled construction cross-section' },
  'fin-yoke': { base: 'worn on a male model, rear three-quarter', focus: ['yoke seam and split', 'alignment'], crop: 'on the back yoke' },
  'fin-pleat-detail': { base: 'worn on a male model', focus: ['pleat fold and depth', 'placement'], crop: 'macro on the pleat' },
  'fin-bias': { base: 'worn on a male model', focus: ['bias-cut fabric direction', 'grain at the seam'], crop: 'on the bias-cut panel' },
  'fin-tab': { base: 'worn on a male model', focus: ['tab shape and fastening', 'placement', 'stitch'], crop: 'on the tab' },
  'fin-adjust': { base: 'presented on the garment', focus: ['the named adjustment/feature exactly as drawn'], crop: 'macro on the detail' },

  'generic-detail': { base: 'presented clearly on the garment', focus: ['the named construction detail'], crop: 'macro on the detail' },
};

// Styling overrides driven by shape/flags (accessory + focus tweaks).
export function resolveStyling(spec) {
  const base = STYLE[spec.part] || STYLE['generic-detail'];
  const shapeText = spec.shapes.join(' ').toLowerCase();
  const flagText = spec.flags.join(' ').toLowerCase();
  let accessory = '';
  const styling = { ...base, focus: [...base.focus] };

  if (spec.part.startsWith('shirt-collar')) {
    if (/wing/.test(shapeText)) {
      accessory = 'styled black-tie with a black silk bow tie';
      styling.focus.unshift('wing tip break around the bow tie');
    } else if (/tab/.test(shapeText) || /tab/.test(flagText)) {
      accessory = 'wearing a silk necktie with a neat knot; the collar tab fastened beneath the knot';
      styling.focus.unshift('the tab drawing the collar points together under the knot');
    } else if (/button-down/.test(shapeText)) {
      accessory = 'open-collar with the top button fastened, no tie';
    } else {
      // NO TIE by default. A four-in-hand knot sits exactly on top of the
      // collar band and fills the gap between the points — i.e. it covers the
      // spread, the stand height, the band seam and the top button, which are
      // the features that actually distinguish one collar option from another.
      // A tie is only ever worn when the tie is REQUIRED to demonstrate the
      // option (tab collars fasten under the knot; wing collars are defined by
      // their black-tie context) — both handled above.
      // Closure state DEFERS TO THE DRAWING. Asserting "top button fastened"
      // here beat the BLUEPRINT LOCK (concrete styling wins over a general
      // rule) and closed collars the tech packs draw open — hiding the band
      // interior and the band buttonhole. Three independent QC agents caught
      // it against three different drawings.
      accessory =
        'the collar left open at the throat with NO necktie and the top ' +
        'collar-band button UNFASTENED exactly as the reference shows it, the ' +
        'leaves relaxed apart so the collar points, the spread between them, the ' +
        'full collar band and its buttonhole are all completely unobstructed, and ' +
        'the collar reproduced in the SAME presentation and viewing angle as the ' +
        'attached reference so its exact tip geometry is preserved rather than ' +
        're-staged';
      styling.focus.push('the unobstructed spread between the collar points');
      styling.focus.push('both collar leaves mirroring each other exactly in length, angle and tip shape');
    }
  } else if (spec.part === 'shirt-cuff') {
    if (/french|double/.test(shapeText)) accessory = 'closed with elegant cufflinks';
    else accessory = 'closed with its button(s)';
  } else if (spec.part === 'jacket-lapel') {
    accessory = 'the jacket worn open just enough to read the gorge and lapel roll';
  } else if (spec.part === 'vest-front' || spec.part === 'vest-bottom' || spec.part === 'vest-lapel') {
    // NO TIE, for exactly the reason given in the shirt-collar branch above.
    // That reasoning was written for collars and never carried across, yet a
    // four-in-hand hangs straight down the waistcoat opening — over the neckline
    // apex, the top button, the lapel break and the front edge, which are
    // precisely the features that separate one vest-front option from another.
    // v-neckline vs u-neckline is decided at the apex the tie would cover.
    accessory =
      'over a crisp white dress shirt with NO necktie and nothing at the throat, no jacket, ' +
      'so the entire waistcoat opening reads clearly — the neckline apex, the front edge, ' +
      'the lapel break and every button completely unobstructed from shoulder to hem';
    if (spec.part === 'vest-front' || spec.part === 'vest-lapel') {
      styling.focus.unshift('the unobstructed neckline opening and the exact point at which its two edges meet');
    }
  } else if (spec.part === 'trouser-waistband' || spec.part === 'trouser-fly') {
    accessory = 'shirt tucked, no jacket, so the waistband and closure read clearly';
  } else if (
    spec.part === 'trouser-waistband-width' ||
    spec.part === 'trouser-extension-length' ||
    spec.part === 'trouser-extension' ||
    spec.part === 'trouser-adjuster' ||
    spec.part === 'trouser-belt-loops'
  ) {
    accessory =
      'shirt tucked, no jacket; the trousers cropped tight to the waistband only so the ' +
      'differentiating component is the entire subject — no knees, lower leg, model pose, ' +
      'jacket or styling element anywhere in frame';
  } else if (spec.part === 'trouser-front-pocket') {
    accessory = 'shirt tucked, front three-quarter framing; show the front pocket opening clearly and ignore any secondary watch/coin besom pocket present in the drawing';
  }

  return { ...styling, accessory };
}
