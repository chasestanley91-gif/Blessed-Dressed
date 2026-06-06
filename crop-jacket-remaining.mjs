/**
 * Crops remaining jacket option tiles not handled by crop-jacket-v3.mjs.
 * - lapel_bh_style: 185822 (3×9=27) + 185836 row-2 extras (28-31)
 * - pick_stitch_pos: 191039 (1×4)
 * - contrast_pos: 191141 (1×9)
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

const src = 'C:/Users/ChaseStanley/Downloads/Jacket options';
const dest = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/public/images';

const file = f => `Screenshot_11-5-2026_${f}_mtm.baoxiniao.co.jpeg`;

async function cropRow(f, dir, count, hdr = 38) {
  const p = join(src, f);
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

async function cropGrid(f, dir, rows, cols, hdr = 38) {
  const p = join(src, f);
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

console.log('Cropping remaining jacket option tiles...\n');
let errors = 0;

const jobs = async () => {
  // ── lapel buttonhole style (185822): 3 rows × 9 cols = pictures 1–27 ──────
  // Row 1: None, Real(M), Fake Round, Smoking Pipe, Lumi, Eyelet, Pinpoint, 005 hand, 006 hand
  // Row 2: 007 hand, Dragon Horn, Glory Rays, LOVE, Monotree, Cloud, 017 hand, Roman Eye, 018 Eye
  // Row 3: Decorative, Squred Functional, Fake Square-end, Rome 2.3M, Rome 1.8H, Rome 1.8M, Rome H, Milanese 2CM, Milanese 2.3CM
  await cropGrid(file('185822'), 'lapel_bh_style', 3, 9, 30)
    .catch(e => { console.error(`  ✗ lapel_bh_style grid: ${e.message}`); errors++; });

  // ── lapel buttonhole style extras (185836): row 2 only = pictures 28–31 ───
  // Row 2: Milanese 2.5CM, Milanese, Curved Milanese(one color), 008 by hand
  try {
    const p = join(src, file('185836'));
    const meta = await sharp(p).metadata();
    const tileW = Math.floor(meta.width / 9);
    const contentH = meta.height - 10;
    const tileH = Math.floor(contentH / 2);
    mkdirSync(join(dest, 'lapel_bh_style'), { recursive: true });
    for (let c = 0; c < 4; c++) {
      await sharp(p)
        .extract({ left: c * tileW, top: 10 + tileH, width: tileW, height: tileH })
        .resize(240, 200, { fit: 'cover', position: 'top' })
        .jpeg({ quality: 88 })
        .toFile(join(dest, 'lapel_bh_style', `picture-${28 + c}.jpg`));
    }
    console.log('  ✓ lapel_bh_style extras (pictures 28–31)');
  } catch (e) {
    console.error(`  ✗ lapel_bh_style extras: ${e.message}`);
    errors++;
  }

  // ── pick stitch position (191039): 4 tiles in a row ──────────────────────
  // 1: Lapel+Collar+Front+Pocket+Sleeve Vent  2: +Back  3: Collar+Plkt…  4: All seams
  await cropRow(file('191039'), 'pick_stitch_pos', 4, 38)
    .catch(e => { console.error(`  ✗ pick_stitch_pos: ${e.message}`); errors++; });

  // ── contrast position (191141): 9 tiles in a row ─────────────────────────
  // 1: Top collar  2: Lapel  3: Chest pocket  4: Lower pocket besom
  // 5: Ticket pocket flap  6: Lower pocket flap  7: Ticket pocket besom
  // 8: 1cm satin splicing on Lapel  9: Removable Shawl Lapel
  await cropRow(file('191141'), 'contrast_pos', 9, 38)
    .catch(e => { console.error(`  ✗ contrast_pos: ${e.message}`); errors++; });
};

jobs().then(() => {
  console.log(`\nDone — ${errors === 0 ? 'all sections cropped successfully' : `${errors} error(s)`}`);
});
