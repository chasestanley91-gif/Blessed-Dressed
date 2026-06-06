/**
 * Updates suit.ts image paths to use the new picture-N.jpg crops.
 * Also fixes canvas options to match the actual factory tool options.
 */
import { readFileSync, writeFileSync } from 'fs';

const suitPath = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/src/data/options/suit.ts';
let src = readFileSync(suitPath, 'utf8');

// ── 1. Lapel photo map: suit.ts option ID → picture-N path ─────────────────
// Factory order (131923 screenshot, 3×9 grid, left-to-right top-to-bottom):
// 1=Notch, 2=Peak(standard), 3=Shawl, 4=Semi-notch, 5=Semi-peak
// 6=CustomerBtn(skip), 7=Peak(wide), 8=Peak115°, 9=Notch+Tab
// 10=Peak105°, 11=Peak110°, 12=Peak105°(B), 13=LowPeak110°, 14=StraightNotch
// 15=StraightPeak108°, 16=CurvedGorgePeak107°, 17=Peak99°, 18=AsymmetricShawl
// 19=Peak102°, 20=CurvedPeak103°, 21=D-Shawl, 22=Shawl(B), 23=Notch+PointedTab
// 24=0005Shawl, 25=0EShawl, 26=0AShawl, 27=Peak100°
const lapelMap = {
  'lapel-notch-55':          '/images/lapel/picture-1.jpg',
  'lapel-notch-50':          '/images/lapel/picture-1.jpg',
  'lapel-notch-65':          '/images/lapel/picture-1.jpg',
  'lapel-peak-101':          '/images/lapel/picture-2.jpg',
  'lapel-shawl':             '/images/lapel/picture-3.jpg',
  'lapel-notch-45':          '/images/lapel/picture-4.jpg',
  'lapel-peak-114':          '/images/lapel/picture-5.jpg',
  'lapel-peak-120-curved':   '/images/lapel/picture-7.jpg',
  'lapel-peak-115':          '/images/lapel/picture-8.jpg',
  'lapel-notch-tab-basic':   '/images/lapel/picture-9.jpg',
  'lapel-peak-105':          '/images/lapel/picture-10.jpg',
  'lapel-peak-110':          '/images/lapel/picture-11.jpg',
  'lapel-peak-102-rl':       '/images/lapel/picture-12.jpg',
  'lapel-peak-110-low':      '/images/lapel/picture-13.jpg',
  'lapel-notch-73':          '/images/lapel/picture-14.jpg',
  'lapel-notch-68':          '/images/lapel/picture-14.jpg',
  'lapel-peak-108':          '/images/lapel/picture-15.jpg',
  'lapel-peak-107':          '/images/lapel/picture-16.jpg',
  'lapel-peak-99':           '/images/lapel/picture-17.jpg',
  'lapel-shawl-asymmetric':  '/images/lapel/picture-18.jpg',
  'lapel-peak-102':          '/images/lapel/picture-19.jpg',
  'lapel-peak-103-curved':   '/images/lapel/picture-20.jpg',
  'lapel-shawl-d':           '/images/lapel/picture-21.jpg',
  'lapel-notch-tab':         '/images/lapel/picture-23.jpg',
  'lapel-shawl-0005':        '/images/lapel/picture-24.jpg',
  'lapel-shawl-0e':          '/images/lapel/picture-25.jpg',
  'lapel-shawl-0a':          '/images/lapel/picture-26.jpg',
  'lapel-peak-removable-shawl': '/images/lapel/picture-3.jpg',
};

// ── 2. All other section photo maps ─────────────────────────────────────────
// Format: option-id → picture-N path
// Matches the factory screenshot order verified from actual screenshots.
const sectionMap = {
  // Shoulder head (131812): Natural, Regular, Con rollino, Neapolitan, Shirt Head
  'sleeve-natural':          '/images/shoulder_head/picture-1.jpg',
  'sleeve-regular':          '/images/shoulder_head/picture-2.jpg',
  'sleeve-con-rollino':      '/images/shoulder_head/picture-3.jpg',
  'sleeve-neapolitan':       '/images/shoulder_head/picture-4.jpg',
  'sleeve-shirt-head':       '/images/shoulder_head/picture-5.jpg',

  // Canvas (13190): Regular Fused, Regular Half Canvas, Regular Full Canvas, Light Half Canvas, Light Full Canvas, No Canvas
  'fused':                   '/images/canvas/picture-1.jpg',
  'half-canvas':             '/images/canvas/picture-2.jpg',
  'full-canvas':             '/images/canvas/picture-3.jpg',
  'light-half-canvas':       '/images/canvas/picture-4.jpg',
  'light-full-canvas':       '/images/canvas/picture-5.jpg',
  'no-canvas':               '/images/canvas/picture-6.jpg',

  // Back vent (191222): None, Center vent, Side Vents, Side vents w/inner belt, Side Vents+Fixed Belt
  'bv-none':                 '/images/back_vent/picture-1.jpg',
  'bv-center':               '/images/back_vent/picture-2.jpg',
  'bv-side':                 '/images/back_vent/picture-3.jpg',
  'bv-side-belt':            '/images/back_vent/picture-4.jpg',
  'bv-side-fixed-belt':      '/images/back_vent/picture-5.jpg',

  // External decoration (191212): Horizontal Loop, None, Slanted Loop
  'ext-loop-flat':           '/images/external_decoration/picture-1.jpg',
  'ext-none':                '/images/external_decoration/picture-2.jpg',
  'ext-loop-slanted':        '/images/external_decoration/picture-3.jpg',

  // Front buttonhole (191254): By machine, By hands
  'fbh-machine':             '/images/front_buttonhole/picture-1.jpg',
  'fbh-hands':               '/images/front_buttonhole/picture-2.jpg',

  // Sewing button style (19028): Regular machine, Cross stitch, Down stitch, EQ stitch, SQ stitch, Under layer
  'sbs-machine':             '/images/sewing_style/picture-1.jpg',
  'sbs-cross-hand':          '/images/sewing_style/picture-2.jpg',
  'sbs-down-hand':           '/images/sewing_style/picture-3.jpg',
  'sbs-eq-hand':             '/images/sewing_style/picture-4.jpg',
  'sbs-sq-hand':             '/images/sewing_style/picture-5.jpg',
  'sbs-under-hand':          '/images/sewing_style/picture-6.jpg',

  // Handmade decorative (191028): None, Shoulder seam, Shoulder+vent, Full
  'hmd-none':                '/images/handmade_decorative/picture-1.jpg',
  'hmd-shoulder':            '/images/handmade_decorative/picture-2.jpg',
  'hmd-shoulder-vent':       '/images/handmade_decorative/picture-3.jpg',
  'hmd-full':                '/images/handmade_decorative/picture-4.jpg',

  // Pen pocket (19103): Left jetted, Left drop, Left diamond, Right jetted, Right drop, Right diamond, None
  'pen-left-jetted':         '/images/pen_pocket/picture-1.jpg',
  'pen-left-drop':           '/images/pen_pocket/picture-2.jpg',
  'pen-left-diamond':        '/images/pen_pocket/picture-3.jpg',
  'pen-right-jetted':        '/images/pen_pocket/picture-4.jpg',
  'pen-right-drop':          '/images/pen_pocket/picture-5.jpg',
  'pen-right-diamond':       '/images/pen_pocket/picture-6.jpg',
  'pen-none':                '/images/pen_pocket/picture-7.jpg',

  // Facing (19166): Facing 4, 5, 9, 2, 1, half, none, 7
  'facing-4':                '/images/facing/picture-1.jpg',
  'facing-5':                '/images/facing/picture-2.jpg',
  'facing-9':                '/images/facing/picture-3.jpg',
  'facing-2':                '/images/facing/picture-4.jpg',
  'facing-1':                '/images/facing/picture-5.jpg',
  'facing-half':             '/images/facing/picture-6.jpg',
  'facing-none':             '/images/facing/picture-7.jpg',
  'facing-7':                '/images/facing/picture-8.jpg',

  // Lining coverage (19178): Full lining, Half lining
  'lc-full':                 '/images/lining/picture-1.jpg',
  'lc-half':                 '/images/lining/picture-2.jpg',

  // Columbia/piping (19132): None, Columbia, Piping, Columbia+Piping
  'cp-none':                 '/images/columbia_piping/picture-1.jpg',
  'cp-columbia':             '/images/columbia_piping/picture-2.jpg',
  'cp-piping':               '/images/columbia_piping/picture-3.jpg',
  'cp-both':                 '/images/columbia_piping/picture-4.jpg',

  // Inner ticket pocket (192311): Left, Right, None, Left and right
  'itp-left':                '/images/inner_ticket_pocket/picture-1.jpg',
  'itp-right':               '/images/inner_ticket_pocket/picture-2.jpg',
  'itp-none':                '/images/inner_ticket_pocket/picture-3.jpg',
  'itp-both':                '/images/inner_ticket_pocket/picture-4.jpg',

  // Namecard pocket (192324): Left, Right, Both, None, Left 15cm, Right 15cm
  'nc-left':                 '/images/namecard_pocket/picture-1.jpg',
  'nc-right':                '/images/namecard_pocket/picture-2.jpg',
  'nc-both':                 '/images/namecard_pocket/picture-3.jpg',
  'nc-none':                 '/images/namecard_pocket/picture-4.jpg',

  // MP3 pocket (192333): None, Left, Right, Both
  'mp3-none':                '/images/mp3_pocket/picture-1.jpg',
  'mp3-left':                '/images/mp3_pocket/picture-2.jpg',
  'mp3-right':               '/images/mp3_pocket/picture-3.jpg',

  // Inner pocket closure (192250): D-bartack, I-bartack, X-bartack, None
  'ipc-d':                   '/images/inner_pocket_closure/picture-1.jpg',
  'ipc-i':                   '/images/inner_pocket_closure/picture-2.jpg',
  'ipc-x':                   '/images/inner_pocket_closure/picture-3.jpg',
  'ipc-none':                '/images/inner_pocket_closure/picture-4.jpg',

  // Pocket bartack (192155): D-bartack, I-bartack, X-bartack, None
  'bartack-d':               '/images/pocket_bartack/picture-1.jpg',
  'bartack-i':               '/images/pocket_bartack/picture-2.jpg',
  'bartack-x':               '/images/pocket_bartack/picture-3.jpg',
  'bartack-none':            '/images/pocket_bartack/picture-4.jpg',

  // Coin pocket (19420): None, Left, Right, Both
  'coin-none':               '/images/coin_pocket/picture-1.jpg',
  'coin-left':               '/images/coin_pocket/picture-2.jpg',
  'coin-right':              '/images/coin_pocket/picture-3.jpg',
  'coin-both':               '/images/coin_pocket/picture-4.jpg',

  // Sleeve vent (19644): Functional, Mock, Functional+Mock, Functional no-BH, None
  'sv-functional':           '/images/sleeve_vent/picture-1.jpg',
  'sv-mock':                 '/images/sleeve_vent/picture-2.jpg',
  'sv-functional-mock':      '/images/sleeve_vent/picture-3.jpg',
  'sv-functional-no-bh':    '/images/sleeve_vent/picture-4.jpg',
  'sv-none':                 '/images/sleeve_vent/picture-5.jpg',

  // Chest dart (19612): -2, -3, +2, +3, Standard
  'cd-minus-2':              '/images/chest_dart/picture-1.jpg',
  'cd-minus-3':              '/images/chest_dart/picture-2.jpg',
  'cd-plus-2':               '/images/chest_dart/picture-3.jpg',
  'cd-plus-3':               '/images/chest_dart/picture-4.jpg',
  'cd-standard':             '/images/chest_dart/picture-5.jpg',

  // Hem (19625): DR Round, Small curve, Round+0.6, Big curve, Big curve 2, Round, Squared
  'hem-dr-round':            '/images/hem/picture-1.jpg',
  'hem-small-curve':         '/images/hem/picture-2.jpg',
  'hem-round-06':            '/images/hem/picture-3.jpg',
  'hem-big-curve':           '/images/hem/picture-4.jpg',
  'hem-round':               '/images/hem/picture-6.jpg',
  'hem-squared':             '/images/hem/picture-7.jpg',

  // Sleeve buttonhole (185946): By machine, By hands
  'slbh-machine':            '/images/sleeve_buttonhole/picture-1.jpg',
  'slbh-hands':              '/images/sleeve_buttonhole/picture-2.jpg',

  // Sleeve cuff (19831): Angled Vent, Square, Round, Turn Back 3.5, Turn Back 4
  'sc-angled':               '/images/sleeve_cuff/picture-1.jpg',
  'sc-square':               '/images/sleeve_cuff/picture-2.jpg',
  'sc-round':                '/images/sleeve_cuff/picture-3.jpg',
  'sc-turnback-35':          '/images/sleeve_cuff/picture-4.jpg',
  'sc-turnback-40':          '/images/sleeve_cuff/picture-5.jpg',

  // Ticket pocket (191922): Jetted, Welt, None, Flap-50, Flap-50b, Flap, Flap-55, Flap-60, Flap-40
  'tp-jetted':               '/images/ticket_pocket/picture-1.jpg',
  'tp-welt':                 '/images/ticket_pocket/picture-2.jpg',
  'tp-none':                 '/images/ticket_pocket/picture-3.jpg',
  'tp-flap-50':              '/images/ticket_pocket/picture-4.jpg',
  'tp-card-italian':         '/images/ticket_pocket/picture-5.jpg',
  'tp-card-formal':          '/images/ticket_pocket/picture-6.jpg',
  'tp-rl-card':              '/images/ticket_pocket/picture-6.jpg',
  'tp-flap-40':              '/images/ticket_pocket/picture-9.jpg',
  'tp-flap-45':              '/images/ticket_pocket/picture-4.jpg',
  'tp-flap-55':              '/images/ticket_pocket/picture-7.jpg',
  'tp-flap-60':              '/images/ticket_pocket/picture-8.jpg',

  // Front style (19437 grid 2×9): picture-1..9 row1, picture-10..18 row2
  // Row 1: SB1, SB2, SB3, SB4, SB3R2, SB4R3, DB2×1, DB4×1, DB4×2
  // Row 2: DB6×1, DB6×2, DB6×3, CustomerBtn(13=skip), SB5hidden(14), SB5(15)
  'sb-1':                    '/images/front_style/picture-1.jpg',
  'sb-2':                    '/images/front_style/picture-2.jpg',
  'sb-3':                    '/images/front_style/picture-3.jpg',
  'sb-4':                    '/images/front_style/picture-4.jpg',
  'sb-3-roll-2':             '/images/front_style/picture-5.jpg',
  'sb-4-roll-3':             '/images/front_style/picture-6.jpg',
  'db-2x1':                  '/images/front_style/picture-7.jpg',
  'db-4x1':                  '/images/front_style/picture-8.jpg',
  'db-4x2':                  '/images/front_style/picture-9.jpg',
  'db-6x1':                  '/images/front_style/picture-10.jpg',
  'db-6x2':                  '/images/front_style/picture-11.jpg',
  'db-6x3':                  '/images/front_style/picture-12.jpg',
  'sb-5-hidden':             '/images/front_style/picture-14.jpg',
  'sb-5':                    '/images/front_style/picture-15.jpg',
};

// ── 3. Combine lapel + section maps ─────────────────────────────────────────
const photoMap = { ...lapelMap, ...sectionMap };

// ── 4. Replace image paths in suit.ts ───────────────────────────────────────
let updated = 0;
const result = src.replace(
  /\{ id: "([^"]+)",[^\n}]+\}/g,
  (line, id) => {
    const newPath = photoMap[id];
    if (!newPath) return line;
    if (line.includes('image:')) {
      const replaced = line.replace(/,?\s*image:\s*"[^"]*"/, `, image: "${newPath}"`);
      if (replaced !== line) updated++;
      return replaced;
    } else {
      updated++;
      return line.replace(/\s*\}$/, `, image: "${newPath}" }`);
    }
  }
);

// ── 5. Fix canvas options: replace ultra-thin-half and quarter-canvas ────────
// Remove ultra-thin-half (doesn't exist in factory)
const fixed = result
  .replace(
    /\n?\s*\{ id: "ultra-thin-half",[^\n}]+\},?\n/g,
    '\n'
  )
  // Replace quarter-canvas with light-full-canvas (Light Full Canvas)
  .replace(
    /\{ id: "quarter-canvas", label: "Quarter Canvas"[^\n}]+\}/,
    '{ id: "light-full-canvas", label: "Light Full Canvas", description: "Full structural canvas, lighter weight — extended lead time.", priceAdj: 100, image: "/images/canvas/picture-5.jpg" }'
  );

// Check if no-canvas option already exists; if not, insert after full-canvas
const hasNoCanvas = fixed.includes('"no-canvas"');
let final = fixed;
if (!hasNoCanvas) {
  final = fixed.replace(
    /(\{ id: "full-canvas"[^\n}]+\})/,
    '$1,\n          { id: "no-canvas", label: "No Canvas", description: "Fully fused — lightest weight, maximum structure stability.", image: "/images/canvas/picture-6.jpg" }'
  );
}

writeFileSync(suitPath, final, 'utf8');
console.log(`✓ suit.ts — updated ${updated} image paths`);
console.log(`✓ Canvas: removed ultra-thin-half, replaced quarter-canvas → light-full-canvas, ${hasNoCanvas ? 'no-canvas already present' : 'added no-canvas'}`);
