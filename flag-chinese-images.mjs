// flag-chinese-images.mjs
// Scans kute factory images for likely Chinese-character annotations.
// Heuristic: Chinese text in technical diagrams appears as dense clusters
// of dark pixels against a white/light background, with a characteristic
// aspect ratio and pixel-density signature distinct from line art.
// Outputs public/images/factory/flagged.json with a ranked list.

import sharp from "sharp";
import { readdirSync, statSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KUTE_DIR  = path.join(__dirname, "public", "images", "factory", "kute");
const OUT_FILE  = path.join(__dirname, "public", "images", "factory", "flagged.json");

// ─── Config ───────────────────────────────────────────────────────────────────

// A score >= THRESHOLD is flagged. Tune if too many false positives.
const THRESHOLD = 0.18;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function walkFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { recursive: true })) {
    const full = path.join(dir, entry);
    try {
      if (statSync(full).isFile() && /\.(jpe?g|png|webp)$/i.test(entry)) {
        results.push(full);
      }
    } catch (_) {}
  }
  return results;
}

// Score an image for "likely has Chinese text annotations".
// Returns a float 0–1 (higher = more suspicious).
//
// Method:
//   1. Convert to greyscale, resize to a manageable tile (128×128).
//   2. Compute the fraction of near-black pixels (dark ink).
//   3. Compute a "run-length heterogeneity" — how often the image
//      transitions between dark and light horizontally. Dense character
//      glyphs produce many short dark runs, unlike continuous line-art strokes.
//   4. Combine into a score.
async function scoreImage(filePath) {
  let raw;
  try {
    const { data, info } = await sharp(filePath)
      .greyscale()
      .resize(128, 128, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    raw = data;
  } catch (_) {
    return 0;
  }

  const len = raw.length; // 128*128 = 16384 bytes

  // Fraction of dark pixels (< 80 luminance out of 255)
  let darkCount = 0;
  for (let i = 0; i < len; i++) {
    if (raw[i] < 80) darkCount++;
  }
  const darkFrac = darkCount / len;

  // Too few dark pixels → no ink → not a text image
  // Too many → solid dark image → not text either
  if (darkFrac < 0.01 || darkFrac > 0.60) return 0;

  // Horizontal run-length transitions per row
  // Chinese glyphs are 10–20px wide at diagram scale; they produce
  // many short dark runs. Pure line art has fewer, longer runs.
  let transitions = 0;
  const W = 128;
  for (let row = 0; row < 128; row++) {
    const base = row * W;
    for (let col = 1; col < W; col++) {
      const a = raw[base + col - 1] < 80;
      const b = raw[base + col]     < 80;
      if (a !== b) transitions++;
    }
  }
  // Normalise: max possible transitions = 128 rows × 127 = 16256
  const transFrac = transitions / 16256;

  // Ratio of transitions to dark-pixel fraction is the key signal.
  // Text: many transitions relative to overall ink coverage.
  // Line art: fewer transitions relative to ink coverage.
  const ratio = darkFrac > 0 ? transFrac / darkFrac : 0;

  // Score: weight transition density heavily; penalise extremes of darkFrac.
  // Empirically, Chinese-annotated diagrams score ~0.20–0.45.
  const score = Math.min(1, ratio * 0.30 + transFrac * 0.70);

  return parseFloat(score.toFixed(4));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const categories = ["jacket", "trousers", "vest", "shirt"];
  const flagged = [];
  let total = 0, checked = 0;

  for (const cat of categories) {
    const catDir = path.join(KUTE_DIR, cat);
    const files  = walkFiles(catDir);
    total += files.length;
    console.log(`[${cat}] ${files.length} images`);

    for (const file of files) {
      const score = await scoreImage(file);
      checked++;

      if (score >= THRESHOLD) {
        const publicPath = "/images/factory/kute/" + cat + "/" +
          path.relative(catDir, file).replace(/\\/g, "/");
        flagged.push({ score, cat, publicPath, file: path.basename(file) });
      }

      if (checked % 100 === 0) {
        process.stdout.write(`  ${checked}/${total} checked, ${flagged.length} flagged so far\r`);
      }
    }
  }

  console.log(`\nTotal: ${checked} images checked, ${flagged.length} flagged (score >= ${THRESHOLD})`);

  // Sort highest score first
  flagged.sort((a, b) => b.score - a.score);

  const output = {
    generated: new Date().toISOString(),
    threshold: THRESHOLD,
    totalChecked: checked,
    flaggedCount: flagged.length,
    items: flagged,
  };

  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Written: ${OUT_FILE}`);

  // Print top 20
  console.log("\n=== Top 20 most suspicious ===");
  for (const item of flagged.slice(0, 20)) {
    console.log(`  [${item.score.toFixed(3)}] ${item.cat}/${item.file}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
