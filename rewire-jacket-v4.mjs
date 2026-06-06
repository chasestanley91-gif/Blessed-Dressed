/**
 * rewire-jacket-v4.mjs
 * Updates all remaining SVG image paths in suit.ts with factory photos.
 * Runs line-by-line; safe for single-line option objects.
 */
import { readFileSync, writeFileSync } from 'fs';

const suitPath =
  'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/src/data/options/suit.ts';

// id → new image path (null = remove the image property entirely)
const imageMap = {
  // ── lapel-width: no factory photo → remove ────────────────────────────────
  'lw-45': null, 'lw-50': null, 'lw-55': null, 'lw-60': null, 'lw-65': null,
  'lw-70': null, 'lw-75': null, 'lw-80': null, 'lw-85': null, 'lw-90': null,
  'lw-95': null, 'lw-100': null, 'lw-105': null, 'lw-110': null,
  'lw-115': null, 'lw-120': null, 'lw-125': null,

  // ── lapel buttonhole style → /images/lapel_bh_style/picture-N.jpg ────────
  // 185822 3×9 grid (row1: 1-9, row2: 10-18, row3: 19-27) + 185836 row2: 28-31
  'lbh-none':           '/images/lapel_bh_style/picture-1.jpg',   // None
  'lbh-real':           '/images/lapel_bh_style/picture-2.jpg',   // Real(M)
  'lbh-fake-round':     '/images/lapel_bh_style/picture-3.jpg',   // Fake round(M)
  'lbh-smoking-pipe':   '/images/lapel_bh_style/picture-4.jpg',   // Smoking Pipe
  'lbh-lumi':           '/images/lapel_bh_style/picture-5.jpg',   // Lumi
  'lbh-pinpoint':       '/images/lapel_bh_style/picture-7.jpg',   // Pinpoint(one color)
  'lbh-005-hand':       '/images/lapel_bh_style/picture-8.jpg',   // 005 by hands
  'lbh-006-hand':       '/images/lapel_bh_style/picture-9.jpg',   // 006 by hands
  'lbh-dragon-horn':    '/images/lapel_bh_style/picture-11.jpg',  // Dragon Horn
  'lbh-glory-rays':     '/images/lapel_bh_style/picture-12.jpg',  // Glory Rays
  'lbh-cloud':          '/images/lapel_bh_style/picture-15.jpg',  // Cloud
  'lbh-017-hand':       '/images/lapel_bh_style/picture-16.jpg',  // 017 by hands
  'lbh-fake-square':    '/images/lapel_bh_style/picture-21.jpg',  // Fake Square-end
  'lbh-rome-23m':       '/images/lapel_bh_style/picture-22.jpg',  // Rome 2.3CM(M)
  'lbh-rome-18':        '/images/lapel_bh_style/picture-23.jpg',  // Rome 1.8CM(H)
  'lbh-rome-18m':       '/images/lapel_bh_style/picture-24.jpg',  // Rome 1.8CM(M)
  'lbh-milanese-20':    '/images/lapel_bh_style/picture-26.jpg',  // Milanese 2CM
  'lbh-milanese-23':    '/images/lapel_bh_style/picture-27.jpg',  // Milanese 2.3CM
  'lbh-milanese-25':    '/images/lapel_bh_style/picture-28.jpg',  // Milanese 2.5CM (from 185836 row2)
  'lbh-milanese-curved':'/images/lapel_bh_style/picture-30.jpg',  // Curved Milanese
  'lbh-008-hand':       '/images/lapel_bh_style/picture-31.jpg',  // 008 by hand

  // ── lapel buttonhole position: no useful factory screenshot → remove ──────
  'lbp-left': null, 'lbp-right': null, 'lbp-left-double': null,
  'lbp-both': null, 'lbp-both-double': null, 'lbp-3l-2r': null, 'lbp-3l-1r': null,

  // ── chest pocket → /images/chest_pocket/picture-N.jpg ────────────────────
  // 19048 3×9 grid: row1 1-9, row2 10-18, row3 19-27
  // Row1: Welt2.5, RoundPatch, TulipPatch, 2InvertedPleat, InvertedPleat, Boat3cm, Boat2.8cm, Welt2.3, Jetted
  // Row2: AngledBoxPleat, Welt2.7, MultiPleat, CurvedWelt2.3, CurvedWelt2.5, CurvedWelt2.7, Patch, None, Boat
  // Row3: CurvedWelt2.9, Trapezoid
  'cp-none':                 '/images/chest_pocket/picture-17.jpg', // None (also fixes wrong columbia_piping img)
  'cp-welt-25':              '/images/chest_pocket/picture-1.jpg',
  'cp-patch-round':          '/images/chest_pocket/picture-2.jpg',
  'cp-patch-tulip':          '/images/chest_pocket/picture-3.jpg',
  'cp-inverted-pleat-2flap': '/images/chest_pocket/picture-4.jpg',
  'cp-inverted-pleat-flap':  '/images/chest_pocket/picture-5.jpg',
  'cp-boat-30':              '/images/chest_pocket/picture-6.jpg',
  'cp-boat-28':              '/images/chest_pocket/picture-7.jpg',
  'cp-welt-23':              '/images/chest_pocket/picture-8.jpg',
  'cp-jetted':               '/images/chest_pocket/picture-9.jpg',
  'cp-patch-angled':         '/images/chest_pocket/picture-10.jpg',
  'cp-welt-27':              '/images/chest_pocket/picture-11.jpg',
  'cp-patch-multi':          '/images/chest_pocket/picture-12.jpg',
  'cp-welt-curved-23':       '/images/chest_pocket/picture-13.jpg',
  'cp-welt-curved-25':       '/images/chest_pocket/picture-14.jpg',
  'cp-welt-curved-27':       '/images/chest_pocket/picture-15.jpg',
  'cp-patch':                '/images/chest_pocket/picture-16.jpg',
  'cp-welt-curved-29':       '/images/chest_pocket/picture-19.jpg',
  'cp-trapezoid':            '/images/chest_pocket/picture-20.jpg',

  // ── lower pocket → /images/lower_pocket/picture-N.jpg ────────────────────
  // 1915 3×9 grid:
  // Row1: WaterDrop, CustBtn, SlantedReg6cm, StraightJetted5.5, StraightJetted6, LargeSlanted5.5, LargeSlanted6, LargeSlantedPatch, PatchBasicFlap
  // Row2: InvPleat+AngledFlap+Btn, Jetted+BtnTab, InvPleat+BasicFlap, StraightJetted6.5, RegSlanted6.5, TulipPatch, BoxPatch+Flap, WaterDrop2, InvPleat+BasicFlap+Btn
  // Row3: Patch+BasicFlap+Btn, RoundPatchTopStitch2cm, LargeSlanted6.5, RegSlanted5.5, PatchAngledBtnTab, PatchStraightBtnTab, PatchRoundBtnTab, RegSlanted5.5(2), StraightJetted4cm
  'lp-water-drop':              '/images/lower_pocket/picture-1.jpg',
  'lp-slanted-flap-60':         '/images/lower_pocket/picture-3.jpg',
  'lp-straight-jetted-55':      '/images/lower_pocket/picture-4.jpg',
  'lp-straight-jetted-60':      '/images/lower_pocket/picture-5.jpg',
  'lp-large-slanted-55':        '/images/lower_pocket/picture-6.jpg',
  'lp-large-slanted-60':        '/images/lower_pocket/picture-7.jpg',
  'lp-patch-flap':              '/images/lower_pocket/picture-9.jpg',
  'lp-inverted-angled-flap-btn':'/images/lower_pocket/picture-10.jpg',
  'lp-jetted-btn-tab':          '/images/lower_pocket/picture-11.jpg',
  'lp-inverted-flap':           '/images/lower_pocket/picture-12.jpg',
  'lp-straight-jetted-65':      '/images/lower_pocket/picture-13.jpg',
  'lp-slanted-flap-65':         '/images/lower_pocket/picture-14.jpg',
  'lp-box-pleat-flap':          '/images/lower_pocket/picture-16.jpg',
  'lp-inverted-flap-btn':       '/images/lower_pocket/picture-18.jpg',
  'lp-patch-flap-btn':          '/images/lower_pocket/picture-19.jpg',
  'lp-patch-rounded':           '/images/lower_pocket/picture-20.jpg',
  'lp-large-slanted-65':        '/images/lower_pocket/picture-21.jpg',
  'lp-slanted-flap-55':         '/images/lower_pocket/picture-22.jpg',
  'lp-patch-btn-tab-angled':    '/images/lower_pocket/picture-23.jpg',
  'lp-patch-btn-tab-straight':  '/images/lower_pocket/picture-24.jpg',
  'lp-patch-btn-tab-round':     '/images/lower_pocket/picture-25.jpg',
  'lp-jetted-4':                '/images/lower_pocket/picture-27.jpg',
  // no factory photo for these → remove SVG
  'lp-slanted-flap-40': null, 'lp-slanted-flap-45': null, 'lp-slanted-flap-50': null,
  'lp-large-slanted-40': null, 'lp-large-slanted-45': null, 'lp-large-slanted-50': null,
  'lp-straight-jetted-40': null, 'lp-straight-jetted-45': null, 'lp-straight-jetted-50': null,
  'lp-straight-jetted': null, 'lp-slanted-jetted': null, 'lp-large-slanted-jetted': null,
  'lp-welt-10': null, 'lp-welt-12': null, 'lp-welt-15': null,
  'lp-rl-flat-55': null, 'lp-patch': null, 'lp-angled-box-pleat': null, 'lp-multi-pleat': null,

  // ── sleeve cuff style → /images/sleeve_cuff/picture-N.jpg ────────────────
  // 19831 row: Angled Vent, Square, Round, Turn Back 3.5cm, Turn Back 4cm
  'cuff-angled':       '/images/sleeve_cuff/picture-1.jpg',
  'cuff-square':       '/images/sleeve_cuff/picture-2.jpg',
  'cuff-round':        '/images/sleeve_cuff/picture-3.jpg',
  'cuff-turnback-35':  '/images/sleeve_cuff/picture-4.jpg',
  'cuff-turnback-40':  '/images/sleeve_cuff/picture-5.jpg',
  'cuff-british':      null,  // no factory photo

  // ── sleeve button count → /images/cuff_button_number/picture-N.jpg ───────
  // 19842 row: Four(1), One(2), Two(3), Three(4), Five(5), Six(6)
  'cb-4': '/images/cuff_button_number/picture-1.jpg',
  'cb-1': '/images/cuff_button_number/picture-2.jpg',
  'cb-2': '/images/cuff_button_number/picture-3.jpg',
  'cb-3': '/images/cuff_button_number/picture-4.jpg',
  'cb-5': '/images/cuff_button_number/picture-5.jpg',
  'cb-6': '/images/cuff_button_number/picture-6.jpg',

  // ── pick stitching style: no useful factory photo → remove ────────────────
  'ps-none': null, 'ps-015-machine': null, 'ps-06-machine': null, 'ps-top-06': null,
  'ps-top-4cm': null, 'ps-015-hand': null, 'ps-06-hand': null, 'ps-double': null,

  // ── pick stitching position → /images/pick_stitch_pos/picture-N.jpg ──────
  // 191039 row4: Lapel+Collar+Front+Pocket+SleeveVent, +Back, Collar+Plkt…, All seams
  'psp-lapel-front': '/images/pick_stitch_pos/picture-1.jpg',
  'psp-plus-back':   '/images/pick_stitch_pos/picture-2.jpg',
  'psp-all-seams':   '/images/pick_stitch_pos/picture-4.jpg',

  // ── contrast position → /images/contrast_pos/picture-N.jpg ───────────────
  // 191141 row9: TopCollar, Lapel, ChestPocket, LowerPocketBesom, TicketPocketFlap,
  //              LowerPocketFlap, TicketPocketBesom, 1cmSatin, RemovableShawl
  'contrast-none':          null,  // no factory image
  'contrast-collar':        '/images/contrast_pos/picture-1.jpg',
  'contrast-lapel':         '/images/contrast_pos/picture-2.jpg',
  'contrast-chest-pocket':  '/images/contrast_pos/picture-3.jpg',
  'contrast-lower-besom':   '/images/contrast_pos/picture-4.jpg',
  'contrast-ticket-flap':   '/images/contrast_pos/picture-5.jpg',
  'contrast-lower-flap':    '/images/contrast_pos/picture-6.jpg',
  'contrast-ticket-besom':  '/images/contrast_pos/picture-7.jpg',
  'contrast-satin-lapel':   '/images/contrast_pos/picture-8.jpg',

  // ── lining: no factory photo for "unlined" → remove ──────────────────────
  'lc-none': null,
};

const lines = readFileSync(suitPath, 'utf8').split('\n');
let changed = 0;

const output = lines.map(line => {
  const m = line.match(/id:\s*"([^"]+)"/);
  if (!m) return line;
  const id = m[1];
  if (!(id in imageMap)) return line;

  const newPath = imageMap[id];
  let next;

  if (newPath === null) {
    // Remove image property (handles both `, image: "..."` and ` image: "..."` variants)
    next = line.replace(/,?\s*image:\s*"[^"]*"/, '');
  } else if (line.includes('image:')) {
    // Update existing image path
    next = line.replace(/image:\s*"[^"]*"/, `image: "${newPath}"`);
  } else {
    // Add image property before closing }
    next = line.replace(/(\s*\})(,?\s*)$/, `, image: "${newPath}"$1$2`);
  }

  if (next !== line) changed++;
  return next;
});

writeFileSync(suitPath, output.join('\n'), 'utf8');
console.log(`Done — ${changed} line(s) updated in suit.ts`);
