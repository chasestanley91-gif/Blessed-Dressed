// crop-jacket-v5.mjs
// Fixes all wrong jacket option image folders + crops new ones that had no images.
// Run from blessed-dressed/: node crop-jacket-v5.mjs

import sharp from "sharp";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SS_DIR = "C:/Users/ChaseStanley/Downloads/Jacket options";
const IMG_DIR = path.join(__dirname, "public/images");

function ss(id) {
  return path.join(SS_DIR, `Screenshot_11-5-2026_${id}_mtm.baoxiniao.co.jpeg`);
}

// Crop a single row of `cols` tiles; skip `hdr` px header at top
async function cropRow(ssId, folder, cols, hdr = 38) {
  const src = ss(ssId);
  const outDir = path.join(IMG_DIR, folder);
  mkdirSync(outDir, { recursive: true });

  const { width: W, height: H } = await sharp(src).metadata();
  const contentH = H - hdr;
  const tileW = Math.floor(W / cols);

  await Promise.all(
    Array.from({ length: cols }, (_, i) => {
      const left = i * tileW;
      const width = i < cols - 1 ? tileW : W - left;
      return sharp(src)
        .extract({ left, top: hdr, width, height: contentH })
        .toFile(path.join(outDir, `picture-${i + 1}.jpg`));
    })
  );
  console.log(`  ✓ ${folder}: ${cols} tiles`);
}

// Crop a 2-row grid: row1 then row2 tiles
async function cropTwoRows(ssId, folder, cols1, cols2, hdr = 38) {
  const src = ss(ssId);
  const outDir = path.join(IMG_DIR, folder);
  mkdirSync(outDir, { recursive: true });

  const { width: W, height: H } = await sharp(src).metadata();
  const contentH = H - hdr;
  const rowH = Math.floor(contentH / 2);

  let idx = 1;
  const jobs = [];

  const tw1 = Math.floor(W / cols1);
  for (let i = 0; i < cols1; i++) {
    const left = i * tw1;
    jobs.push(
      sharp(src)
        .extract({ left, top: hdr, width: i < cols1 - 1 ? tw1 : W - left, height: rowH })
        .toFile(path.join(outDir, `picture-${idx++}.jpg`))
    );
  }

  const tw2 = Math.floor(W / cols2);
  for (let i = 0; i < cols2; i++) {
    const left = i * tw2;
    jobs.push(
      sharp(src)
        .extract({ left, top: hdr + rowH, width: i < cols2 - 1 ? tw2 : W - left, height: contentH - rowH })
        .toFile(path.join(outDir, `picture-${idx++}.jpg`))
    );
  }

  await Promise.all(jobs);
  console.log(`  ✓ ${folder}: ${cols1 + cols2} tiles (${cols1}+${cols2} rows)`);
}

async function main() {
  console.log("crop-jacket-v5: starting...\n");

  // ─── RE-CROP WRONG FOLDERS ───────────────────────────────────────────────
  // Tile order confirmed from factory screenshots

  // chest_dart: -2cm | -3cm | +2cm | +3cm | Standard
  await cropRow("19717", "chest_dart", 5);

  // hem: DR round | small curve | round+0.6 | big curve | big curve | round | squared
  await cropRow("19734", "hem", 7);

  // sleeve_vent: Functional | Mock | Functional+Mock | Functional no BH | None
  await cropRow("19748", "sleeve_vent", 5);

  // sleeve_cuff: Angled | Square | Round | Turnback 3.5 | Turnback 4.0
  // (British turn-up not captured in download — stays without image)
  await cropRow("19842", "sleeve_cuff", 5);

  // cuff_button_number: Four | None | One | Two | Three | Five | Six
  await cropRow("19853", "cuff_button_number", 7);

  // ticket_pocket: Jetted | Welt | None | Flap4.5 | Flap5 | Flap5.5 | Flap6 | Flap4
  await cropRow("19318", "ticket_pocket", 8);

  // pocket_bartack: D | I | X | None
  await cropRow("1930", "pocket_bartack", 4);

  // ─── NEW FOLDERS (never had correct images) ───────────────────────────────

  // lapel_width: row1 = 4.5–8.5 (9 tiles), row2 = 9–12.5 (8 tiles) → 17 total
  // Use hdr=50 to clear the search box in this screenshot
  await cropTwoRows("131959", "lapel_width", 9, 8, 50);

  // lapel_bh_position: Left | Right | Left double | Both sides | Each side double
  await cropRow("185946", "lapel_bh_position", 5);

  // elbow_patch: Round elbow | Round sleeve
  await cropRow("19932", "elbow_patch", 2);

  // sleeve_bh_direction: Straight | Slant
  await cropRow("19920", "sleeve_bh_direction", 2);

  // button_spacing: Kissing | NO KISSING
  await cropRow("1997", "button_spacing", 2);

  console.log("\ncrop-jacket-v5: done.");
}

main().catch(err => { console.error(err); process.exit(1); });
