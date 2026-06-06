/**
 * Crops all jacket option tiles from factory screenshots.
 * Saves to public/images/{section}/picture-N.jpg (240×200px, 88% quality)
 * Uses left-to-right, top-to-bottom ordering for grid sections.
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

const src = 'C:/Users/ChaseStanley/Downloads/Jacket options';
const dest = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/public/images';

async function cropRow(file, dir, count, hdr = 38) {
  const p = join(src, file);
  const meta = await sharp(p).metadata();
  const tileW = Math.floor(meta.width / count);
  const contentH = meta.height - hdr;
  mkdirSync(join(dest, dir), { recursive: true });
  for (let i = 0; i < count; i++) {
    await sharp(p)
      .extract({ left: i * tileW, top: hdr, width: tileW, height: contentH })
      .resize(240, 200, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 88 })
      .toFile(join(dest, dir, `picture-${i + 1}.jpg`));
  }
  console.log(`  ✓ ${dir} (${count} tiles)`);
}

async function cropGrid(file, dir, rows, cols, hdr = 38) {
  const p = join(src, file);
  const meta = await sharp(p).metadata();
  const tileW = Math.floor(meta.width / cols);
  const contentH = meta.height - hdr;
  const tileH = Math.floor(contentH / rows);
  mkdirSync(join(dest, dir), { recursive: true });
  let n = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      await sharp(p)
        .extract({ left: c * tileW, top: hdr + r * tileH, width: tileW, height: tileH })
        .resize(240, 200, { fit: 'cover', position: 'top' })
        .jpeg({ quality: 88 })
        .toFile(join(dest, dir, `picture-${n}.jpg`));
      n++;
    }
  }
  console.log(`  ✓ ${dir} (${rows}×${cols} = ${rows * cols} tiles)`);
}

const file = f => `Screenshot_11-5-2026_${f}_mtm.baoxiniao.co.jpeg`;

console.log('Cropping jacket option tiles...\n');

let errors = 0;
const jobs = async () => {
  // ── SINGLE-ROW SECTIONS ─────────────────────────────────────────────────────
  // Shoulder head: Natural, Regular, Con rollino, Neapolitan, Shirt Head
  await cropRow(file('131812'), 'shoulder_head', 5).catch(e => { console.error(`  ✗ shoulder_head: ${e.message}`); errors++; });

  // Canvas: Regular Fused, Regular Half Canvas, Regular Full Canvas, Light Half Canvas, Light Full Canvas, No Canvas
  await cropRow(file('13190'), 'canvas', 6).catch(e => { console.error(`  ✗ canvas: ${e.message}`); errors++; });

  // Back vent: None, Center vent, Side Vents, Side vents w/inner belt, Side Vents+Fixed Belt
  await cropRow(file('191222'), 'back_vent', 5).catch(e => { console.error(`  ✗ back_vent: ${e.message}`); errors++; });

  // External decoration: Horizontal Loop, None, Slanted Loop
  await cropRow(file('191212'), 'external_decoration', 3).catch(e => { console.error(`  ✗ external_decoration: ${e.message}`); errors++; });

  // Front buttonhole: By machine, By hands
  await cropRow(file('191254'), 'front_buttonhole', 2).catch(e => { console.error(`  ✗ front_buttonhole: ${e.message}`); errors++; });

  // Sewing button style: Regular machine, Cross stitch, Down stitch, EQ stitch, SQ stitch, Under layer
  await cropRow(file('19028'), 'sewing_style', 6).catch(e => { console.error(`  ✗ sewing_style: ${e.message}`); errors++; });

  // Handmade decorative: None, Shoulder seam, Shoulder+vent, Full
  await cropRow(file('191028'), 'handmade_decorative', 4).catch(e => { console.error(`  ✗ handmade_decorative: ${e.message}`); errors++; });

  // Pen pocket: Left jetted, Left drop, Left diamond, Right jetted, Right drop, Right diamond, None
  await cropRow(file('19103'), 'pen_pocket', 7).catch(e => { console.error(`  ✗ pen_pocket: ${e.message}`); errors++; });

  // Facing: Facing 4, 5, 9, 2, 1, half-lining, no-lining, 7
  await cropRow(file('19166'), 'facing', 8).catch(e => { console.error(`  ✗ facing: ${e.message}`); errors++; });

  // Lining coverage: Full lining, Half lining
  await cropRow(file('19178'), 'lining', 2).catch(e => { console.error(`  ✗ lining: ${e.message}`); errors++; });

  // Columbia/piping: None, Columbia, Piping, Columbia+Piping
  await cropRow(file('19132'), 'columbia_piping', 4).catch(e => { console.error(`  ✗ columbia_piping: ${e.message}`); errors++; });

  // Inner ticket pocket: Left, Right, None, Left and right
  await cropRow(file('192311'), 'inner_ticket_pocket', 4).catch(e => { console.error(`  ✗ inner_ticket_pocket: ${e.message}`); errors++; });

  // Namecard pocket: Left, Right, Both, None, Left 15cm, Right 15cm
  await cropRow(file('192324'), 'namecard_pocket', 6).catch(e => { console.error(`  ✗ namecard_pocket: ${e.message}`); errors++; });

  // MP3 pocket: None, Left, Right, Both
  await cropRow(file('192333'), 'mp3_pocket', 4).catch(e => { console.error(`  ✗ mp3_pocket: ${e.message}`); errors++; });

  // Inner pocket closure: D-bartack, I-bartack, X-bartack, None
  await cropRow(file('192250'), 'inner_pocket_closure', 4).catch(e => { console.error(`  ✗ inner_pocket_closure: ${e.message}`); errors++; });

  // Lower pocket bartack: D-bartack, I-bartack, X-bartack, None
  await cropRow(file('192155'), 'pocket_bartack', 4).catch(e => { console.error(`  ✗ pocket_bartack: ${e.message}`); errors++; });

  // Coin pocket: None, Left, Right, Both
  await cropRow(file('19420'), 'coin_pocket', 4).catch(e => { console.error(`  ✗ coin_pocket: ${e.message}`); errors++; });

  // Sleeve vent: Functional, Mock, Functional+Mock, Functional no-BH, None
  await cropRow(file('19644'), 'sleeve_vent', 5).catch(e => { console.error(`  ✗ sleeve_vent: ${e.message}`); errors++; });

  // Chest dart: -2, -3, +2, +3, Standard
  await cropRow(file('19612'), 'chest_dart', 5).catch(e => { console.error(`  ✗ chest_dart: ${e.message}`); errors++; });

  // Hem: DR Round, Small curve, Round+0.6, Big curve, Big curve 2, Round, Squared
  await cropRow(file('19625'), 'hem', 7).catch(e => { console.error(`  ✗ hem: ${e.message}`); errors++; });

  // Sleeve buttonhole: By machine, By hands
  await cropRow(file('185946'), 'sleeve_buttonhole', 2).catch(e => { console.error(`  ✗ sleeve_buttonhole: ${e.message}`); errors++; });

  // Sleeve cuff: Angled Vent, Square, Round, Turn Back 3.5cm, Turn Back 4cm
  await cropRow(file('19831'), 'sleeve_cuff', 5).catch(e => { console.error(`  ✗ sleeve_cuff: ${e.message}`); errors++; });

  // Cuff button number: Four, One, Two, Three, Five, Six
  await cropRow(file('19842'), 'cuff_button_number', 6).catch(e => { console.error(`  ✗ cuff_button_number: ${e.message}`); errors++; });

  // Collar tab fabric: None, FP010043, FP010114, FP010115, FP011011, FP011014
  await cropRow(file('132050'), 'collar_tab_fabric', 6).catch(e => { console.error(`  ✗ collar_tab_fabric: ${e.message}`); errors++; });

  // Collar interlining: Regular, No Linen
  await cropRow(file('13220'), 'collar_interlining', 2).catch(e => { console.error(`  ✗ collar_interlining: ${e.message}`); errors++; });

  // Underarm shield: Triangle, Round-2, Round-1, U-2, U-1, None, U-3, Round-3
  await cropRow(file('191455'), 'underarm_shield', 8).catch(e => { console.error(`  ✗ underarm_shield: ${e.message}`); errors++; });

  // Ticket pocket: Jetted, Welt, None, Flap-50, Flap-50b, Flap, Flap-55, Flap-60, Flap-40
  await cropRow(file('191922'), 'ticket_pocket', 9).catch(e => { console.error(`  ✗ ticket_pocket: ${e.message}`); errors++; });

  // ── GRID SECTIONS ───────────────────────────────────────────────────────────
  // Lapel: 3 rows × 9 cols = 27 options
  // Row 1: Notch, Peak, Shawl, Semi-notch, Semi-peak, Customer, Peak(wide), Peak 115°, Notch+Tab
  // Row 2: Peak 105°, Peak 110°, Peak 105°(B), Low Peak 110°, Straight Notch, Straight Peak 108°, Peak 107° curved, Peak 99°, Asymmetric Shawl
  // Row 3: Peak 102°, Curved Peak 103°, D-Shawl, Shawl(B), Notch+Pointed Tab, 0005 Shawl, 0E Shawl, 0A Shawl, Peak 100°
  await cropGrid(file('131923'), 'lapel', 3, 9, 30).catch(e => { console.error(`  ✗ lapel: ${e.message}`); errors++; });

  // Chest pocket: 3 rows × 9 cols (20 of 27 filled)
  // Row 1: Straight Welt 2.5, Round Patch, Tulip Patch, Two Inverted Pleated, Inverted Pleated, Boat-shaped 3cm, Boat-shaped 2.8cm, Straight Welt 2.3, Jetted
  // Row 2: Angled Box Pleat, Straight Welt 2.7, Multi-Pleated Patch, Curved Welt 2.3, Curved Welt 2.5, Curved Welt 2.7, Patch, None, Boat
  // Row 3: Curved Welt 2.9, Trapezoid (only 2 filled)
  await cropGrid(file('19048'), 'chest_pocket', 3, 9, 55).catch(e => { console.error(`  ✗ chest_pocket: ${e.message}`); errors++; });

  // Lower pocket: 3 rows × 9 cols = 27 options
  // Row 1: Water-drop Patch, Customer Button, Regular Slanted 6cm, Straight Jetted 5.5cm, Straight Jetted 6cm, Large Slanted 5.5cm, Large Slanted 6cm, Large Slanted Patch, Patch w/Basic Flap
  // Row 2: Inverted Pleated w/Angled Flap&Button, Jetted w/Button Tab, Inverted Pleated w/Basic Flap, Straight Jetted 6.5cm, Regular Slanted 6.5cm, Tulip Shape Patch, Box Patch w/Flap, Water-drop Patch(2), Inverted Pleated w/Basic Flap&Button
  // Row 3: Patch w/Basic Flap&Button, Round Patch Top Stitch 2CM, Large Slanted 6.5cm, Regular Slanted 5.5cm, Patch Angled Button Tab, Patch Straight Button Tab, Patch Rounded Button Tab, Regular Slanted 5.5cm(2), Straight Jetted 4cm
  await cropGrid(file('1915'), 'lower_pocket', 3, 9, 30).catch(e => { console.error(`  ✗ lower_pocket: ${e.message}`); errors++; });

  // Front style: 2 rows × 9 cols (15 of 18 filled)
  // Row 1: SB1, SB2, SB3, SB4, SB3R2, SB4R3, DB2×1, DB4×1, DB4×2
  // Row 2: DB6×1, DB6×2, DB6×3, Customer(skip), SB5hidden, SB5
  await cropGrid(file('19437'), 'front_style', 2, 9, 38).catch(e => { console.error(`  ✗ front_style: ${e.message}`); errors++; });
};

jobs().then(() => {
  console.log(`\nDone — ${errors === 0 ? 'all sections cropped successfully' : `${errors} errors`}`);
});
