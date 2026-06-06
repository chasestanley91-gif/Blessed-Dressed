/**
 * Wires jacket SVG illustrations into suit.ts by injecting image: fields.
 * Maps designer_2.html field IDs/labels → suit.ts option IDs.
 */
import { readFileSync, writeFileSync } from 'fs';

const suitPath = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/src/data/options/suit.ts';
let src = readFileSync(suitPath, 'utf8');

// Map: suit.ts option id → image path
const imageMap = {
  // ── Shoulder Head ──────────────────────────────────────────────
  'sleeve-natural':     '/images/jacket/shoulder-head/natural.svg',
  'sleeve-regular':     '/images/jacket/shoulder-head/regular.svg',
  'sleeve-con-rollino': '/images/jacket/shoulder-head/con-rollino.svg',
  'sleeve-neapolitan':  '/images/jacket/shoulder-head/neapolitan.svg',
  'sleeve-shirt-head':  '/images/jacket/shoulder-head/shirt-head.svg',

  // ── Canvas (keep existing JPG images, add SVG only for fused/quarter) ──
  // fused and quarter don't have matching photos; replace with SVGs
  'fused':          '/images/jacket/canvas/regular-fused.svg',
  'ultra-thin-half':'/images/jacket/canvas/light-half.svg',
  'light-half-canvas':'/images/jacket/canvas/light-half.svg',
  // half-canvas, full-canvas, quarter-canvas already have JPG images — keep them

  // ── Lapel Style ────────────────────────────────────────────────
  'lapel-notch-45':   '/images/jacket/lapel/notch-lapel.svg',
  'lapel-notch-50':   '/images/jacket/lapel/notch-lapel.svg',
  'lapel-notch-55':   '/images/jacket/lapel/notch-lapel.svg',
  'lapel-notch-65':   '/images/jacket/lapel/notch-lapel.svg',
  'lapel-notch-68':   '/images/jacket/lapel/notch-lapel.svg',
  'lapel-notch-73':   '/images/jacket/lapel/notch-lapel.svg',
  'lapel-notch-tab':  '/images/jacket/lapel/notch-tab.svg',
  'lapel-notch-tab-basic': '/images/jacket/lapel/notch-tab.svg',
  'lapel-peak-99':    '/images/jacket/lapel/peak-lapel.svg',
  'lapel-peak-101':   '/images/jacket/lapel/peak-lapel.svg',
  'lapel-peak-102':   '/images/jacket/lapel/peak-lapel.svg',
  'lapel-peak-102-rl':'/images/jacket/lapel/peak-lapel.svg',
  'lapel-peak-103-curved': '/images/jacket/lapel/peak-lapel.svg',
  'lapel-peak-105':   '/images/jacket/lapel/peak-105.svg',
  'lapel-peak-107':   '/images/jacket/lapel/peak-105.svg',
  'lapel-peak-108':   '/images/jacket/lapel/peak-105.svg',
  'lapel-peak-110':   '/images/jacket/lapel/peak-105.svg',
  'lapel-peak-110-low':'/images/jacket/lapel/peak-105.svg',
  'lapel-peak-114':   '/images/jacket/lapel/semi-notch.svg',
  'lapel-peak-115':   '/images/jacket/lapel/peak-105.svg',
  'lapel-peak-120-curved': '/images/jacket/lapel/peak-105.svg',
  'lapel-shawl':      '/images/jacket/lapel/shawl-lapel.svg',
  'lapel-shawl-d':    '/images/jacket/lapel/shawl-lapel.svg',
  'lapel-shawl-0a':   '/images/jacket/lapel/shawl-lapel.svg',
  'lapel-shawl-0e':   '/images/jacket/lapel/shawl-lapel.svg',
  'lapel-shawl-0005': '/images/jacket/lapel/shawl-lapel.svg',
  'lapel-shawl-asymmetric': '/images/jacket/lapel/shawl-lapel.svg',
  'lapel-peak-removable-shawl': '/images/jacket/lapel/peak-lapel.svg',
  'lapel-notch-removable-shawl': '/images/jacket/lapel/notch-lapel.svg',
  'lapel-fishtail':   '/images/jacket/lapel/italian-fishtail.svg',

  // ── Lapel Width ────────────────────────────────────────────────
  'lw-45':  '/images/jacket/lapel-width/4-5cm.svg',
  'lw-50':  '/images/jacket/lapel-width/5cm.svg',
  'lw-55':  '/images/jacket/lapel-width/5-5cm.svg',
  'lw-60':  '/images/jacket/lapel-width/6cm.svg',
  'lw-65':  '/images/jacket/lapel-width/6-5cm.svg',
  'lw-70':  '/images/jacket/lapel-width/7cm.svg',
  'lw-75':  '/images/jacket/lapel-width/7-5cm.svg',
  'lw-80':  '/images/jacket/lapel-width/8cm.svg',
  'lw-85':  '/images/jacket/lapel-width/8-5cm.svg',
  'lw-90':  '/images/jacket/lapel-width/9cm.svg',
  'lw-95':  '/images/jacket/lapel-width/9-5cm.svg',
  'lw-100': '/images/jacket/lapel-width/10cm.svg',
  'lw-105': '/images/jacket/lapel-width/10-5cm.svg',
  'lw-110': '/images/jacket/lapel-width/11cm.svg',
  'lw-115': '/images/jacket/lapel-width/11-5cm.svg',
  'lw-120': '/images/jacket/lapel-width/12cm.svg',
  'lw-125': '/images/jacket/lapel-width/12-5cm.svg',

  // ── Lapel Buttonhole Style ─────────────────────────────────────
  'lbh-none':             '/images/jacket/lapel-bh-style/none.svg',
  'lbh-real':             '/images/jacket/lapel-bh-style/real-m.svg',
  'lbh-fake-round':       '/images/jacket/lapel-bh-style/fake-round.svg',
  'lbh-fake-square':      '/images/jacket/lapel-bh-style/fake-round.svg',
  'lbh-smoking-pipe':     '/images/jacket/lapel-bh-style/smoking-pipe.svg',
  'lbh-lumi':             '/images/jacket/lapel-bh-style/lumi.svg',
  'lbh-pinpoint':         '/images/jacket/lapel-bh-style/eyelet.svg',
  'lbh-005-hand':         '/images/jacket/lapel-bh-style/real-m.svg',
  'lbh-006-hand':         '/images/jacket/lapel-bh-style/real-m.svg',
  'lbh-017-hand':         '/images/jacket/lapel-bh-style/real-m.svg',
  'lbh-dragon-horn':      '/images/jacket/lapel-bh-style/fake-round.svg',
  'lbh-glory-rays':       '/images/jacket/lapel-bh-style/fake-round.svg',
  'lbh-cloud':            '/images/jacket/lapel-bh-style/fake-round.svg',
  'lbh-rome-18':          '/images/jacket/lapel-bh-style/rome-2-3cm.svg',
  'lbh-rome-18m':         '/images/jacket/lapel-bh-style/rome-2-3cm.svg',
  'lbh-rome-23m':         '/images/jacket/lapel-bh-style/rome-2-3cm.svg',
  'lbh-milanese-20':      '/images/jacket/lapel-bh-style/milanese-2cm.svg',
  'lbh-milanese-23':      '/images/jacket/lapel-bh-style/milanese-2cm.svg',
  'lbh-milanese-25':      '/images/jacket/lapel-bh-style/milanese-2cm.svg',
  'lbh-milanese-curved':  '/images/jacket/lapel-bh-style/milanese-2cm.svg',
  'lbh-008-hand':         '/images/jacket/lapel-bh-style/real-m.svg',

  // ── Lapel Buttonhole Position ──────────────────────────────────
  'lbp-left':         '/images/jacket/lapel-bh-pos/left.svg',
  'lbp-right':        '/images/jacket/lapel-bh-pos/right.svg',
  'lbp-left-double':  '/images/jacket/lapel-bh-pos/left-double.svg',
  'lbp-both':         '/images/jacket/lapel-bh-pos/both-sides.svg',
  'lbp-both-double':  '/images/jacket/lapel-bh-pos/both-sides.svg',
  'lbp-3l-2r':        '/images/jacket/lapel-bh-pos/both-sides.svg',
  'lbp-3l-1r':        '/images/jacket/lapel-bh-pos/both-sides.svg',

  // ── Chest Pocket ───────────────────────────────────────────────
  'cp-none':                     '/images/jacket/chest-pocket/no-pocket.svg',
  'cp-welt-23':                  '/images/jacket/chest-pocket/straight-welt-2-3cm.svg',
  'cp-welt-25':                  '/images/jacket/chest-pocket/straight-welt-2-5cm.svg',
  'cp-welt-27':                  '/images/jacket/chest-pocket/straight-welt-2-5cm.svg',
  'cp-welt-curved-23':           '/images/jacket/chest-pocket/curved-welt-2-5cm.svg',
  'cp-welt-curved-25':           '/images/jacket/chest-pocket/curved-welt-2-5cm.svg',
  'cp-welt-curved-27':           '/images/jacket/chest-pocket/curved-welt-2-5cm.svg',
  'cp-welt-curved-29':           '/images/jacket/chest-pocket/curved-welt-2-5cm.svg',
  'cp-jetted':                   '/images/jacket/chest-pocket/straight-welt-2-5cm.svg',
  'cp-patch':                    '/images/jacket/chest-pocket/patch-pocket.svg',
  'cp-patch-round':              '/images/jacket/chest-pocket/round-patch.svg',
  'cp-patch-tulip':              '/images/jacket/chest-pocket/tulip-patch.svg',
  'cp-patch-angled':             '/images/jacket/chest-pocket/patch-pocket.svg',
  'cp-patch-multi':              '/images/jacket/chest-pocket/patch-pocket.svg',
  'cp-boat-28':                  '/images/jacket/chest-pocket/boat-pocket.svg',
  'cp-boat-30':                  '/images/jacket/chest-pocket/boat-pocket.svg',
  'cp-trapezoid':                '/images/jacket/chest-pocket/straight-welt-2-5cm.svg',
  'cp-inverted-pleat-2flap':     '/images/jacket/chest-pocket/patch-pocket.svg',
  'cp-inverted-pleat-flap':      '/images/jacket/chest-pocket/patch-pocket.svg',

  // ── Lower Pocket ───────────────────────────────────────────────
  'lp-slanted-flap-40':          '/images/jacket/lower-pocket/slanted-flap.svg',
  'lp-slanted-flap-45':          '/images/jacket/lower-pocket/slanted-flap.svg',
  'lp-slanted-flap-50':          '/images/jacket/lower-pocket/slanted-flap.svg',
  'lp-slanted-flap-55':          '/images/jacket/lower-pocket/jetted-flap-5-5cm.svg',
  'lp-slanted-flap-60':          '/images/jacket/lower-pocket/slanted-flap.svg',
  'lp-slanted-flap-65':          '/images/jacket/lower-pocket/jetted-flap-6-5cm.svg',
  'lp-large-slanted-40':         '/images/jacket/lower-pocket/slanted-flap.svg',
  'lp-large-slanted-45':         '/images/jacket/lower-pocket/slanted-flap.svg',
  'lp-large-slanted-50':         '/images/jacket/lower-pocket/slanted-flap.svg',
  'lp-large-slanted-55':         '/images/jacket/lower-pocket/jetted-flap-5-5cm.svg',
  'lp-large-slanted-60':         '/images/jacket/lower-pocket/slanted-flap.svg',
  'lp-large-slanted-65':         '/images/jacket/lower-pocket/jetted-flap-6-5cm.svg',
  'lp-straight-jetted-40':       '/images/jacket/lower-pocket/jetted-no-flap.svg',
  'lp-straight-jetted-45':       '/images/jacket/lower-pocket/jetted-no-flap.svg',
  'lp-straight-jetted-50':       '/images/jacket/lower-pocket/jetted-no-flap.svg',
  'lp-straight-jetted-55':       '/images/jacket/lower-pocket/jetted-flap-5-5cm.svg',
  'lp-straight-jetted-60':       '/images/jacket/lower-pocket/jetted-flap-6-5cm.svg',
  'lp-straight-jetted-65':       '/images/jacket/lower-pocket/jetted-flap-6-5cm.svg',
  'lp-jetted-4':                 '/images/jacket/lower-pocket/jetted-no-flap.svg',
  'lp-straight-jetted':          '/images/jacket/lower-pocket/jetted-no-flap.svg',
  'lp-slanted-jetted':           '/images/jacket/lower-pocket/slanted-flap.svg',
  'lp-large-slanted-jetted':     '/images/jacket/lower-pocket/slanted-flap.svg',
  'lp-welt-10':                  '/images/jacket/lower-pocket/jetted-no-flap.svg',
  'lp-welt-12':                  '/images/jacket/lower-pocket/jetted-no-flap.svg',
  'lp-welt-15':                  '/images/jacket/lower-pocket/jetted-no-flap.svg',
  'lp-rl-flat-55':               '/images/jacket/lower-pocket/jetted-flap-5-5cm.svg',
  'lp-patch':                    '/images/jacket/lower-pocket/patch-pocket.svg',
  'lp-patch-rounded':            '/images/jacket/lower-pocket/patch-pocket.svg',
  'lp-patch-flap':               '/images/jacket/lower-pocket/patch-pocket.svg',
  'lp-patch-flap-btn':           '/images/jacket/lower-pocket/patch-pocket.svg',
  'lp-patch-btn-tab-round':      '/images/jacket/lower-pocket/patch-pocket.svg',
  'lp-patch-btn-tab-straight':   '/images/jacket/lower-pocket/patch-pocket.svg',
  'lp-patch-btn-tab-angled':     '/images/jacket/lower-pocket/patch-pocket.svg',
  'lp-inverted-flap':            '/images/jacket/lower-pocket/bellows-pocket.svg',
  'lp-inverted-flap-btn':        '/images/jacket/lower-pocket/bellows-pocket.svg',
  'lp-inverted-angled-flap-btn': '/images/jacket/lower-pocket/bellows-pocket.svg',
  'lp-jetted-btn-tab':           '/images/jacket/lower-pocket/jetted-flap-6-5cm.svg',
  'lp-box-pleat-flap':           '/images/jacket/lower-pocket/bellows-pocket.svg',
  'lp-angled-box-pleat':         '/images/jacket/lower-pocket/bellows-pocket.svg',
  'lp-multi-pleat':              '/images/jacket/lower-pocket/bellows-pocket.svg',
  'lp-water-drop':               '/images/jacket/lower-pocket/patch-pocket.svg',

  // ── Ticket Pocket ──────────────────────────────────────────────
  'tp-none':           '/images/jacket/ticket-pocket/no-ticket-pocket.svg',
  'tp-jetted':         '/images/jacket/ticket-pocket/jetted-ticket.svg',
  'tp-welt':           '/images/jacket/ticket-pocket/jetted-ticket.svg',
  'tp-card-italian':   '/images/jacket/ticket-pocket/jetted-ticket.svg',
  'tp-card-formal':    '/images/jacket/ticket-pocket/flap-ticket.svg',
  'tp-rl-card':        '/images/jacket/ticket-pocket/flap-ticket.svg',
  'tp-flap-40':        '/images/jacket/ticket-pocket/flap-ticket.svg',
  'tp-flap-45':        '/images/jacket/ticket-pocket/flap-ticket.svg',
  'tp-flap-50':        '/images/jacket/ticket-pocket/flap-ticket.svg',
  'tp-flap-55':        '/images/jacket/ticket-pocket/flap-ticket.svg',
  'tp-flap-60':        '/images/jacket/ticket-pocket/flap-ticket.svg',

  // ── Button Config ──────────────────────────────────────────────
  'sb-1':         '/images/jacket/front-style/sb-1-button.svg',
  'sb-2':         '/images/jacket/front-style/sb-2-buttons.svg',
  'sb-3':         '/images/jacket/front-style/sb-3-buttons.svg',
  'sb-4':         '/images/jacket/front-style/sb-4-buttons.svg',
  'sb-3-roll-2':  '/images/jacket/front-style/3-roll-2.svg',
  'sb-4-roll-3':  '/images/jacket/front-style/3-roll-2.svg',
  'sb-5-hidden':  '/images/jacket/front-style/sb-5-hidden.svg',
  'sb-5':         '/images/jacket/front-style/sb-5-hidden.svg',
  'db-2x1':       '/images/jacket/front-style/db-2-1.svg',
  'db-4x1':       '/images/jacket/front-style/db-4-1.svg',
  'db-4x2':       '/images/jacket/front-style/db-4-1.svg',
  'db-6x1':       '/images/jacket/front-style/db-6-1.svg',
  'db-6x2':       '/images/jacket/front-style/db-6-2.svg',
  'db-6x3':       '/images/jacket/front-style/db-6-2.svg',

  // ── Sleeve Vent ────────────────────────────────────────────────
  'sv-none':             '/images/jacket/sleeve-vent/no-vent.svg',
  'sv-mock':             '/images/jacket/sleeve-vent/non-functional.svg',
  'sv-functional':       '/images/jacket/sleeve-vent/functional-vent.svg',
  'sv-functional-mock':  '/images/jacket/sleeve-vent/functional-vent.svg',
  'sv-functional-no-bh': '/images/jacket/sleeve-vent/functional-vent.svg',

  // ── Cuff Style ─────────────────────────────────────────────────
  'cuff-angled':        '/images/jacket/sleeve-cuff/square-cuff.svg',
  'cuff-square':        '/images/jacket/sleeve-cuff/square-cuff.svg',
  'cuff-round':         '/images/jacket/sleeve-cuff/round-cuff.svg',
  'cuff-british':       '/images/jacket/sleeve-cuff/turnback-cuff.svg',
  'cuff-turnback-35':   '/images/jacket/sleeve-cuff/turnback-cuff.svg',
  'cuff-turnback-40':   '/images/jacket/sleeve-cuff/turnback-cuff.svg',

  // ── Cuff Button Count ──────────────────────────────────────────
  'cb-2': '/images/jacket/cuff-btn-num/two-buttons.svg',
  'cb-3': '/images/jacket/cuff-btn-num/three-buttons.svg',
  'cb-4': '/images/jacket/cuff-btn-num/four-buttons.svg',
  'cb-5': '/images/jacket/cuff-btn-num/five-buttons.svg',

  // ── Back Vent ──────────────────────────────────────────────────
  'bv-none':            '/images/jacket/back-vent/no-vent.svg',
  'bv-center':          '/images/jacket/back-vent/center-vent.svg',
  'bv-side':            '/images/jacket/back-vent/side-vents.svg',
  'bv-side-belt':       '/images/jacket/back-vent/side-belt.svg',
  'bv-side-fixed-belt': '/images/jacket/back-vent/side-fixed-belt.svg',

  // ── Button Sewing Style ────────────────────────────────────────
  'sbs-machine':    '/images/jacket/sewing-style/regular-machine.svg',
  'sbs-cross-hand': '/images/jacket/sewing-style/cross-stitch.svg',
  'sbs-down-hand':  '/images/jacket/sewing-style/parallel-stitch.svg',
  'sbs-eq-hand':    '/images/jacket/sewing-style/parallel-stitch.svg',
  'sbs-sq-hand':    '/images/jacket/sewing-style/square-stitch.svg',
  'sbs-under-hand': '/images/jacket/sewing-style/under-layer.svg',

  // ── Pick Stitching ─────────────────────────────────────────────
  'ps-none':        '/images/jacket/pick-stitch/none.svg',
  'ps-015-machine': '/images/jacket/pick-stitch/0-15cm-machine.svg',
  'ps-06-machine':  '/images/jacket/pick-stitch/0-6cm-machine.svg',
  'ps-top-06':      '/images/jacket/pick-stitch/0-6cm-top-stitch.svg',
  'ps-top-4cm':     '/images/jacket/pick-stitch/4cm-top-stitch.svg',
  'ps-015-hand':    '/images/jacket/pick-stitch/0-15cm-hand.svg',
  'ps-06-hand':     '/images/jacket/pick-stitch/0-6cm-hand.svg',
  'ps-double':      '/images/jacket/pick-stitch/double-pick.svg',

  // ── Pick Stitching Position ────────────────────────────────────
  'psp-lapel-front':  '/images/jacket/pick-stitch-pos/lapel-collar-front-pocket.svg',
  'psp-plus-back':    '/images/jacket/pick-stitch-pos/back.svg',
  'psp-all-seams':    '/images/jacket/pick-stitch-pos/all-seams.svg',

  // ── Contrast Position ──────────────────────────────────────────
  'contrast-none':          '/images/jacket/contrast-pos/none.svg',
  'contrast-collar':        '/images/jacket/contrast-pos/top-collar.svg',
  'contrast-lapel':         '/images/jacket/contrast-pos/lapel.svg',
  'contrast-chest-pocket':  '/images/jacket/contrast-pos/chest-pocket.svg',
  'contrast-lower-besom':   '/images/jacket/contrast-pos/lower-pocket.svg',
  'contrast-lower-flap':    '/images/jacket/contrast-pos/lower-flap.svg',
  'contrast-ticket-flap':   '/images/jacket/contrast-pos/ticket-pocket.svg',
  'contrast-ticket-besom':  '/images/jacket/contrast-pos/ticket-pocket.svg',
  'contrast-satin-lapel':   '/images/jacket/contrast-pos/lapel-satin.svg',

  // ── Facing Style ───────────────────────────────────────────────
  'facing-1':    '/images/jacket/facing/facing-1-narrow.svg',
  'facing-2':    '/images/jacket/facing/facing-2.svg',
  'facing-4':    '/images/jacket/facing/facing-3.svg',
  'facing-5':    '/images/jacket/facing/facing-5-wide.svg',
  'facing-7':    '/images/jacket/facing/facing-5-wide.svg',
  'facing-9':    '/images/jacket/facing/facing-5-wide.svg',
  'facing-half': '/images/jacket/facing/facing-3.svg',
  'facing-none': '/images/jacket/facing/facing-1-narrow.svg',

  // ── Lining Coverage ────────────────────────────────────────────
  'lc-full':  '/images/jacket/lining/full-lining.svg',
  'lc-half':  '/images/jacket/lining/half-lining.svg',
  'lc-none':  '/images/jacket/lining/no-lining.svg',
};

// Inject image: into each matching option line
// Options look like: { id: "some-id", label: "...", description: "..." }
// or:                { id: "some-id", label: "...", description: "...", priceAdj: N }
// We add image: AFTER description (or priceAdj if present)

let injected = 0;
let skipped = 0;

const result = src.replace(
  /\{ id: "([^"]+)",[^\n}]+\}/g,
  (line, id) => {
    const path = imageMap[id];
    if (!path) { skipped++; return line; }
    // Already has image?
    if (line.includes('image:')) return line;
    // Inject before closing }
    const injectedLine = line.replace(/\s*\}$/, `, image: "${path}" }`);
    injected++;
    return injectedLine;
  }
);

writeFileSync(suitPath, result, 'utf8');
console.log(`✓ suit.ts — injected image paths for ${injected} options (${skipped} skipped / no mapping)`);
