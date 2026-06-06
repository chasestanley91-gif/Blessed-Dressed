// crop-sleeve-bh.mjs — crops sleeve_buttonhole section from 191442 screenshot
import sharp from "sharp";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SS_DIR = "C:/Users/ChaseStanley/Downloads/Jacket options";
const IMG_DIR = path.join(__dirname, "public/images");

async function main() {
  const src = path.join(SS_DIR, "Screenshot_11-5-2026_191442_mtm.baoxiniao.co.jpeg");
  const outDir = path.join(IMG_DIR, "sleeve_buttonhole");
  mkdirSync(outDir, { recursive: true });

  const { width: W, height: H } = await sharp(src).metadata();
  const hdr = 38;
  const cols = 2;
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

  console.log("Done: sleeve_buttonhole/picture-1.jpg (By machine), picture-2.jpg (By hands)");
}

main().catch(err => { console.error(err); process.exit(1); });
