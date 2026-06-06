// integrate-factory-images.mjs
// Copies factory images to public/images/factory/ and generates a mapping report
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FACTORY_DIR = path.join(__dirname, "factory-screenshots");
const PUBLIC_FACTORY = path.join(__dirname, "public", "images", "factory");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeName(s) {
  return s.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function copyFile(src, dest) {
  if (!existsSync(src) || statSync(src).size === 0) return false;
  mkdirSync(path.dirname(dest), { recursive: true });
  if (existsSync(dest)) return true; // skip existing
  copyFileSync(src, dest);
  return true;
}

// ─── 1. Copy kutetailor.net images ────────────────────────────────────────────

const kuteCategories = ["jacket", "trousers", "vest", "shirt"];
const kuteManifest = {};

for (const cat of kuteCategories) {
  const optionsFile = path.join(FACTORY_DIR, "kute", cat, "options.json");
  if (!existsSync(optionsFile)) { console.log(`[kute] No options.json for ${cat}`); continue; }

  const options = JSON.parse(readFileSync(optionsFile, "utf8"));
  kuteManifest[cat] = [];

  let copied = 0, skipped = 0;
  for (const opt of options) {
    if (!opt.image) continue;
    const ext = opt.image.split(".").pop().split("?")[0] || "jpg";
    const sectionSafe = safeName(opt.section.replace(/ > /g, "__"));
    const nameSafe = safeName(opt.en);
    const ecode = opt.ecode ? safeName(opt.ecode) : opt.id;
    const destName = `${ecode}__${nameSafe}.${ext}`;
    const destPath = path.join(PUBLIC_FACTORY, "kute", cat, sectionSafe, destName);

    // Reproduction of kute-extract.mjs path logic
    const srcSectionSafe = opt.section.replace(/[^a-zA-Z0-9._\- >]/g, "_").replace(/ > /g, "/").slice(0, 100);
    const srcLabel = opt.en.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 50);
    const srcFile = `${opt.ecode || opt.id}_${srcLabel}.${ext}`;
    const srcPath = path.join(FACTORY_DIR, "kute", cat, srcSectionSafe, srcFile);

    const ok = copyFile(srcPath, destPath);
    if (ok) { copied++; }
    else { skipped++; }

    kuteManifest[cat].push({
      id: opt.id,
      en: opt.en,
      ecode: opt.ecode,
      section: opt.section,
      code: opt.code,
      publicPath: `/images/factory/kute/${cat}/${sectionSafe}/${destName}`,
      copied: ok,
    });
  }
  console.log(`[kute/${cat}] ${copied} copied, ${skipped} not found`);
}

writeFileSync(path.join(PUBLIC_FACTORY, "kute-manifest.json"), JSON.stringify(kuteManifest, null, 2));

// ─── 2. Copy mtm.baoxiniao.co images ──────────────────────────────────────────

const baoxinaoCats = [
  { dir: "suit-jacket",  name: "jacket"   },
  { dir: "shirt",        name: "shirt"    },
  { dir: "trousers",     name: "trousers" },
  { dir: "vest",         name: "vest"     },
];

const baoxinaoManifest = {};

for (const { dir, name } of baoxinaoCats) {
  const catDir = path.join(FACTORY_DIR, dir);
  if (!existsSync(catDir)) continue;

  const manifestFile = path.join(catDir, "manifest.json");
  if (!existsSync(manifestFile)) continue;

  const entries = JSON.parse(readFileSync(manifestFile, "utf8"));
  baoxinaoManifest[name] = [];

  let copied = 0, skipped = 0;
  for (const entry of entries) {
    if (!entry.localPath) continue;
    const src = path.join(FACTORY_DIR, entry.localPath);
    const ext = path.extname(entry.localPath) || ".jpg";
    const destPath = path.join(PUBLIC_FACTORY, "baoxiniao", name, entry.field, entry.value + ext);

    const ok = copyFile(src, destPath);
    if (ok) { copied++; }
    else { skipped++; }

    baoxinaoManifest[name].push({
      field: entry.field,
      fieldLabel: entry.fieldLabel,
      value: entry.value,
      label: entry.label,
      publicPath: `/images/factory/baoxiniao/${name}/${entry.field}/${entry.value}${ext}`,
      copied: ok,
    });
  }
  console.log(`[baoxiniao/${name}] ${copied} copied, ${skipped} missing`);
}

writeFileSync(path.join(PUBLIC_FACTORY, "baoxiniao-manifest.json"), JSON.stringify(baoxinaoManifest, null, 2));

// ─── 3. Generate field mapping report ─────────────────────────────────────────
// Show which kute sections map to which builder fields

const BUILDER_FIELD_MAP = {
  // Jacket suit.ts fields → kute section paths
  "sleeve-head":            "Style > Shoulder > Shoulder shape",
  "canvas":                 "Style > Canvas",
  "shoulder-pad":           "Style > Shoulder > Shoulder pad",
  "lapel-style":            "Lapel > Lapel Style",
  "lapel-width":            "Lapel > Lapel width",
  "lapel-bh-style":         "Lapel > Hole Style",
  "lapel-bh-position":      "Lapel > Hole Position",
  "collar-felt":            "Collar felt",
  "chest-pocket":           "Pocket > Chest pocket",
  "lower-pocket":           "Pocket > Lower pocket",
  "lower-pocket-bartack":   "Pocket > Pocket bartack",
  "ticket-pocket":          "Pocket > Ticket pocket",
  "back-vent-style":        "Back design",
  "sleeve-vent":            "Sleeve > Sleeve vent",
  "cuff-style":             "Sleeve > Sleeve cuff",
  "cuff-button-number":     "Bttn & Thread > Sleeve button number",
  "lining-coverage":        "Lining > Lining",
  "button-config":          "Style > Front bttn",
  "front-buttonhole":       "Style > Front bttn",
  "contrast-position":      "Contrast",
};

// Build lookup from kute options by section
const kuteBySection = {};
for (const cat of kuteCategories) {
  const optFile = path.join(FACTORY_DIR, "kute", cat, "options.json");
  if (!existsSync(optFile)) continue;
  const opts = JSON.parse(readFileSync(optFile, "utf8"));
  kuteBySection[cat] = {};
  for (const opt of opts) {
    const sec = opt.section;
    if (!kuteBySection[cat][sec]) kuteBySection[cat][sec] = [];
    kuteBySection[cat][sec].push(opt);
  }
}

console.log("\n=== Kute jacket section → option counts ===");
const jacketSections = kuteBySection["jacket"] || {};
for (const [sec, opts] of Object.entries(jacketSections)) {
  const withImg = opts.filter(o => o.image).length;
  console.log(`  ${sec}: ${opts.length} options (${withImg} with images)`);
}

// Report which builder fields have kute matches
console.log("\n=== Builder field → kute mapping ===");
for (const [fieldId, kutePath] of Object.entries(BUILDER_FIELD_MAP)) {
  const opts = jacketSections[kutePath];
  console.log(`  ${fieldId} → "${kutePath}": ${opts ? opts.length + " kute options" : "NOT FOUND"}`);
}

console.log("\n=== DONE ===");
console.log(`Public images written to: ${PUBLIC_FACTORY}`);
console.log("Manifests: kute-manifest.json, baoxiniao-manifest.json");
