/**
 * Replaces SVG illustration paths with real cropped factory photos in suit.ts.
 */
import { readFileSync, writeFileSync } from 'fs';

const suitPath = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/src/data/options/suit.ts';
let src = readFileSync(suitPath, 'utf8');

// Map: option id → new photo path (replaces whatever image: is currently set)
const photoMap = {
  // Shoulder head
  'sleeve-natural':     '/images/jacket/shoulder-head/natural.jpg',
  'sleeve-regular':     '/images/jacket/shoulder-head/regular.jpg',
  'sleeve-con-rollino': '/images/jacket/shoulder-head/con-rollino.jpg',
  'sleeve-neapolitan':  '/images/jacket/shoulder-head/neapolitan.jpg',
  'sleeve-shirt-head':  '/images/jacket/shoulder-head/shirt-head.jpg',

  // Canvas (use real photos, replace SVGs; keep existing JPGs for half/full/quarter)
  'fused':              '/images/jacket/canvas/regular-fused.jpg',
  'ultra-thin-half':    '/images/jacket/canvas/light-half.jpg',
  'light-half-canvas':  '/images/jacket/canvas/light-half.jpg',
  'half-canvas':        '/images/jacket/canvas/half-canvas.jpg',
  'full-canvas':        '/images/jacket/canvas/full-canvas.jpg',
  'quarter-canvas':     '/images/jacket/canvas/regular-fused.jpg',

  // Back vent
  'bv-none':            '/images/jacket/back-vent/no-vent.jpg',
  'bv-center':          '/images/jacket/back-vent/center-vent.jpg',
  'bv-side':            '/images/jacket/back-vent/side-vents.jpg',
  'bv-side-belt':       '/images/jacket/back-vent/side-belt.jpg',
  'bv-side-fixed-belt': '/images/jacket/back-vent/side-fixed-belt.jpg',

  // External decoration
  'ext-none':            '/images/jacket/external-decoration/none.jpg',
  'ext-loop-flat':       '/images/jacket/external-decoration/front-chest-horizontal-button-loop.jpg',
  'ext-loop-slanted':    '/images/jacket/external-decoration/front-chest-slanted-button-loop.jpg',

  // Front buttonholes
  'fbh-machine':  '/images/jacket/front-buttonhole/by-machine.jpg',
  'fbh-hands':    '/images/jacket/front-buttonhole/by-hands.jpg',

  // Button sewing style
  'sbs-machine':    '/images/jacket/sewing-style/regular-machine.jpg',
  'sbs-cross-hand': '/images/jacket/sewing-style/cross-stitch.jpg',
  'sbs-down-hand':  '/images/jacket/sewing-style/down-stitch.jpg',
  'sbs-eq-hand':    '/images/jacket/sewing-style/eq-stitch.jpg',
  'sbs-sq-hand':    '/images/jacket/sewing-style/sq-stitch.jpg',
  'sbs-under-hand': '/images/jacket/sewing-style/under-layer.jpg',

  // Handmade decorative
  'hmd-none':           '/images/jacket/handmade-decorative/none.jpg',
  'hmd-shoulder':       '/images/jacket/handmade-decorative/shoulder-seam.jpg',
  'hmd-shoulder-vent':  '/images/jacket/handmade-decorative/shoulder-vent.jpg',
  'hmd-full':           '/images/jacket/handmade-decorative/full.jpg',

  // Pen pocket
  'pen-none':           '/images/jacket/pen-pocket/none.jpg',
  'pen-left-jetted':    '/images/jacket/pen-pocket/left-jetted.jpg',
  'pen-left-drop':      '/images/jacket/pen-pocket/left-drop.jpg',
  'pen-left-diamond':   '/images/jacket/pen-pocket/left-diamond.jpg',
  'pen-right-jetted':   '/images/jacket/pen-pocket/right-jetted.jpg',
  'pen-right-drop':     '/images/jacket/pen-pocket/right-drop.jpg',
  'pen-right-diamond':  '/images/jacket/pen-pocket/right-diamond.jpg',

  // Facing style
  'facing-1':    '/images/jacket/facing/facing-1.jpg',
  'facing-2':    '/images/jacket/facing/facing-2.jpg',
  'facing-4':    '/images/jacket/facing/facing-4.jpg',
  'facing-5':    '/images/jacket/facing/facing-5.jpg',
  'facing-7':    '/images/jacket/facing/facing-7.jpg',
  'facing-9':    '/images/jacket/facing/facing-9.jpg',
  'facing-half': '/images/jacket/facing/facing-half.jpg',
  'facing-none': '/images/jacket/facing/facing-none.jpg',

  // Lining coverage
  'lc-full':  '/images/jacket/lining/full-lining.jpg',
  'lc-half':  '/images/jacket/lining/half-lining.jpg',

  // Columbia piping
  'cp-none':     '/images/jacket/columbia-piping/none.jpg',
  'cp-columbia': '/images/jacket/columbia-piping/columbia.jpg',
  'cp-piping':   '/images/jacket/columbia-piping/piping.jpg',
  'cp-both':     '/images/jacket/columbia-piping/columbia-and-piping.jpg',

  // Inner ticket pocket
  'itp-none':  '/images/jacket/inner-ticket-pocket/none.jpg',
  'itp-left':  '/images/jacket/inner-ticket-pocket/left.jpg',
  'itp-right': '/images/jacket/inner-ticket-pocket/right.jpg',
  'itp-both':  '/images/jacket/inner-ticket-pocket/left-and-right.jpg',

  // Namecard pocket
  'nc-none':  '/images/jacket/namecard-pocket/none.jpg',
  'nc-left':  '/images/jacket/namecard-pocket/left.jpg',
  'nc-right': '/images/jacket/namecard-pocket/right.jpg',
  'nc-both':  '/images/jacket/namecard-pocket/both.jpg',

  // MP3 pocket
  'mp3-none':  '/images/jacket/mp3-pocket/none.jpg',
  'mp3-left':  '/images/jacket/mp3-pocket/left.jpg',
  'mp3-right': '/images/jacket/mp3-pocket/right.jpg',

  // Inner pocket closure
  'ipc-none': '/images/jacket/inner-pocket-closure/none.jpg',
  'ipc-d':    '/images/jacket/inner-pocket-closure/d-bartack.jpg',
  'ipc-i':    '/images/jacket/inner-pocket-closure/i-bartack.jpg',
  'ipc-x':    '/images/jacket/inner-pocket-closure/x-bartack.jpg',

  // Pocket bartack
  'bartack-none': '/images/jacket/pocket-bartack/none.jpg',
  'bartack-d':    '/images/jacket/pocket-bartack/d-bartack.jpg',
  'bartack-i':    '/images/jacket/pocket-bartack/i-bartack.jpg',
  'bartack-x':    '/images/jacket/pocket-bartack/x-bartack.jpg',

  // Ticket pocket
  'tp-none':         '/images/jacket/ticket-pocket/none.jpg',
  'tp-jetted':       '/images/jacket/ticket-pocket/jetted.jpg',
  'tp-welt':         '/images/jacket/ticket-pocket/welt.jpg',
  'tp-card-italian': '/images/jacket/ticket-pocket/welt.jpg',
  'tp-card-formal':  '/images/jacket/ticket-pocket/flap-50.jpg',
  'tp-rl-card':      '/images/jacket/ticket-pocket/flap-50.jpg',
  'tp-flap-40':      '/images/jacket/ticket-pocket/flap-40.jpg',
  'tp-flap-45':      '/images/jacket/ticket-pocket/flap-40.jpg',
  'tp-flap-50':      '/images/jacket/ticket-pocket/flap-50.jpg',
  'tp-flap-55':      '/images/jacket/ticket-pocket/flap-55.jpg',
  'tp-flap-60':      '/images/jacket/ticket-pocket/flap-60.jpg',

  // Coin pocket
  'coin-none':  '/images/jacket/coin-pocket/none.jpg',
  'coin-left':  '/images/jacket/coin-pocket/left.jpg',
  'coin-right': '/images/jacket/coin-pocket/right.jpg',
  'coin-both':  '/images/jacket/coin-pocket/both.jpg',

  // Button config / front style
  'sb-1':         '/images/jacket/front-style/sb-1.jpg',
  'sb-2':         '/images/jacket/front-style/sb-2.jpg',
  'sb-3':         '/images/jacket/front-style/sb-3.jpg',
  'sb-4':         '/images/jacket/front-style/sb-4.jpg',
  'sb-3-roll-2':  '/images/jacket/front-style/sb-3-roll-2.jpg',
  'sb-4-roll-3':  '/images/jacket/front-style/sb-4-roll-3.jpg',
  'db-2x1':       '/images/jacket/front-style/db-2x1.jpg',
  'db-4x1':       '/images/jacket/front-style/db-4x1.jpg',
  'db-4x2':       '/images/jacket/front-style/db-4x2.jpg',
  'db-6x1':       '/images/jacket/front-style/db-6x1.jpg',
  'db-6x2':       '/images/jacket/front-style/db-6x2.jpg',
  'db-6x3':       '/images/jacket/front-style/db-6x3.jpg',
  'sb-5-hidden':  '/images/jacket/front-style/sb-5-hidden.jpg',
  'sb-5':         '/images/jacket/front-style/sb-5.jpg',

  // Sleeve vent
  'sv-none':             '/images/jacket/sleeve-vent/none.jpg',
  'sv-mock':             '/images/jacket/sleeve-vent/mock.jpg',
  'sv-functional':       '/images/jacket/sleeve-vent/functional.jpg',
  'sv-functional-mock':  '/images/jacket/sleeve-vent/functional-mock.jpg',
  'sv-functional-no-bh': '/images/jacket/sleeve-vent/functional-no-bh.jpg',

  // Chest dart
  'cd-minus-2':  '/images/jacket/chest-dart/minus-2.jpg',
  'cd-minus-3':  '/images/jacket/chest-dart/minus-3.jpg',
  'cd-standard': '/images/jacket/chest-dart/standard.jpg',
  'cd-plus-2':   '/images/jacket/chest-dart/plus-2.jpg',
  'cd-plus-3':   '/images/jacket/chest-dart/plus-3.jpg',

  // Hem
  'hem-round':       '/images/jacket/hem/round.jpg',
  'hem-round-06':    '/images/jacket/hem/round-06.jpg',
  'hem-squared':     '/images/jacket/hem/squared.jpg',
  'hem-small-curve': '/images/jacket/hem/small-curve.jpg',
  'hem-big-curve':   '/images/jacket/hem/big-curve.jpg',
  'hem-dr-round':    '/images/jacket/hem/dr-round.jpg',

  // Sleeve buttonholes
  'slbh-machine': '/images/jacket/sleeve-buttonhole/by-machine.jpg',
  'slbh-hands':   '/images/jacket/sleeve-buttonhole/by-hands.jpg',
};

// Replace existing image: paths or inject new ones
let updated = 0;

const result = src.replace(
  /\{ id: "([^"]+)",[^\n}]+\}/g,
  (line, id) => {
    const newPath = photoMap[id];
    if (!newPath) return line;

    if (line.includes('image:')) {
      // Replace existing image path
      const replaced = line.replace(/,?\s*image:\s*"[^"]*"/, `, image: "${newPath}"`);
      if (replaced !== line) updated++;
      return replaced;
    } else {
      // Inject new image path
      const injected = line.replace(/\s*\}$/, `, image: "${newPath}" }`);
      updated++;
      return injected;
    }
  }
);

writeFileSync(suitPath, result, 'utf8');
console.log(`✓ suit.ts — updated image paths for ${updated} options with real photos`);
