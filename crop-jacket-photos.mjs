/**
 * Crops individual option tiles from factory screenshot images and saves them
 * to public/images/jacket/[section]/ replacing the SVG placeholders.
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

const src = 'C:/Users/ChaseStanley/Downloads/Jacket options';
const dest = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/public/images/jacket';

async function cropRow(file, sectionDir, options, headerHeight = 38) {
  const imgPath = join(src, file);
  const meta = await sharp(imgPath).metadata();
  const w = meta.width;
  const h = meta.height;
  const count = options.length;
  const tileW = Math.floor(w / count);
  // content area (below header)
  const contentH = h - headerHeight;

  mkdirSync(join(dest, sectionDir), { recursive: true });

  for (let i = 0; i < count; i++) {
    const left = i * tileW;
    const outFile = join(dest, sectionDir, `${options[i]}.jpg`);
    await sharp(imgPath)
      .extract({ left, top: headerHeight, width: tileW, height: contentH })
      .resize(240, 200, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 88 })
      .toFile(outFile);
  }
  console.log(`✓ ${sectionDir} — ${count} tiles from ${file}`);
}

// ── Section mappings: [file, sectionDir, [option-slugs]] ─────────────────────
const jobs = [
  // Shoulder head (Natural=first, Regular, Con rollino, Neapolitan, Shirt Head)
  ['Screenshot_11-5-2026_131812_mtm.baoxiniao.co.jpeg', 'shoulder-head',
    ['natural','regular','con-rollino','neapolitan','shirt-head']],

  // Canvas
  ['Screenshot_11-5-2026_13190_mtm.baoxiniao.co.jpeg', 'canvas',
    ['regular-fused','half-canvas','full-canvas','light-half','light-full','no-canvas']],

  // Back vent
  ['Screenshot_11-5-2026_131959_mtm.baoxiniao.co.jpeg', 'back-vent',
    ['no-vent','center-vent','side-vents','side-belt','side-fixed-belt']],

  // External decoration
  ['Screenshot_11-5-2026_131943_mtm.baoxiniao.co.jpeg', 'external-decoration',
    ['front-chest-horizontal-button-loop','none','front-chest-slanted-button-loop']],

  // Front buttonhole (by machine vs by hand)
  ['Screenshot_11-5-2026_132123_mtm.baoxiniao.co.jpeg', 'front-buttonhole',
    ['by-machine','by-hands']],

  // Sewing button style
  ['Screenshot_11-5-2026_19028_mtm.baoxiniao.co.jpeg', 'sewing-style',
    ['regular-machine','cross-stitch','down-stitch','eq-stitch','sq-stitch','under-layer']],

  // Handmade decorative line
  ['Screenshot_11-5-2026_191028_mtm.baoxiniao.co.jpeg', 'handmade-decorative',
    ['none','shoulder-seam','shoulder-vent','full']],

  // Pen pocket
  ['Screenshot_11-5-2026_19103_mtm.baoxiniao.co.jpeg', 'pen-pocket',
    ['left-jetted','left-drop','left-diamond','right-jetted','right-drop','right-diamond','none']],

  // Facing
  ['Screenshot_11-5-2026_191052_mtm.baoxiniao.co.jpeg', 'facing',
    ['facing-4','facing-5','facing-9','facing-2','facing-1','facing-half','facing-none','facing-7']],

  // Lining coverage
  ['Screenshot_11-5-2026_191121_mtm.baoxiniao.co.jpeg', 'lining',
    ['full-lining','half-lining']],

  // Columbia stitching / piping
  ['Screenshot_11-5-2026_19132_mtm.baoxiniao.co.jpeg', 'columbia-piping',
    ['none','columbia','piping','columbia-and-piping']],

  // Inner ticket pocket
  ['Screenshot_11-5-2026_191547_mtm.baoxiniao.co.jpeg', 'inner-ticket-pocket',
    ['left','right','none','left-and-right']],

  // Namecard pocket
  ['Screenshot_11-5-2026_191556_mtm.baoxiniao.co.jpeg', 'namecard-pocket',
    ['left','right','both','none','left-15cm','right-15cm']],

  // MP3 pocket
  ['Screenshot_11-5-2026_191620_mtm.baoxiniao.co.jpeg', 'mp3-pocket',
    ['none','left','right','both']],

  // Inner pocket closure
  ['Screenshot_11-5-2026_191442_mtm.baoxiniao.co.jpeg', 'inner-pocket-closure',
    ['d-bartack','i-bartack','x-bartack','none']],

  // Underarm shield
  ['Screenshot_11-5-2026_191455_mtm.baoxiniao.co.jpeg', 'underarm-shield',
    ['triangle','round-2','round-1','u-2','u-1','none','u-3','round-3']],

  // Lower pocket bartack
  ['Screenshot_11-5-2026_191854_mtm.baoxiniao.co.jpeg', 'pocket-bartack',
    ['d-bartack','i-bartack','x-bartack','none']],

  // Ticket pocket
  ['Screenshot_11-5-2026_191922_mtm.baoxiniao.co.jpeg', 'ticket-pocket',
    ['jetted','welt','none','flap-50','flap-50b','flap','flap-55','flap-60','flap-40']],

  // Lower coin pocket
  ['Screenshot_11-5-2026_191941_mtm.baoxiniao.co.jpeg', 'coin-pocket',
    ['none','left','right','both']],

  // Front style / button config
  ['Screenshot_11-5-2026_191953_mtm.baoxiniao.co.jpeg', 'front-style',
    ['sb-1','sb-2','sb-3','sb-4','sb-3-roll-2','sb-4-roll-3','db-2x1','db-4x1','db-4x2','db-6x1','db-6x2','db-6x3','custom','sb-5-hidden','sb-5'],
    45], // taller header

  // Sleeve vent
  ['Screenshot_11-5-2026_19644_mtm.baoxiniao.co.jpeg', 'sleeve-vent',
    ['functional','mock','functional-mock','functional-no-bh','none']],

  // Chest dart distance
  ['Screenshot_11-5-2026_19612_mtm.baoxiniao.co.jpeg', 'chest-dart',
    ['minus-2','minus-3','plus-2','plus-3','standard']],

  // Hem style
  ['Screenshot_11-5-2026_19625_mtm.baoxiniao.co.jpeg', 'hem',
    ['dr-round','small-curve','round-06','big-curve','big-curve-2','round','squared']],

  // Sleeve buttonhole
  ['Screenshot_11-5-2026_185946_mtm.baoxiniao.co.jpeg', 'sleeve-buttonhole',
    ['by-machine','by-hands']],

  // Contrast position
  ['Screenshot_11-5-2026_13190_mtm.baoxiniao.co.jpeg', 'contrast-pos',
    ['top-collar','lapel','chest-pocket','lower-pocket-besom','ticket-pocket-flap','lower-pocket-flap','ticket-pocket-besom','satin-lapel','removable-shawl']],
];

let errors = 0;
for (const job of jobs) {
  const [file, dir, opts, hdr] = job;
  try {
    await cropRow(file, dir, opts, hdr ?? 38);
  } catch (e) {
    console.error(`✗ ${dir}: ${e.message}`);
    errors++;
  }
}

console.log(`\nDone — ${jobs.length - errors} sections processed, ${errors} errors.`);
