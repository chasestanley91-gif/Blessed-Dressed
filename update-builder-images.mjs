// update-builder-images.mjs — update suit.ts (and other builder options) to use factory images
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = path.join(__dirname, "public", "images", "factory", "kute-manifest.json");

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

// Build ecode → publicPath lookup per category
function buildLookup(catOpts) {
  const m = {};
  for (const opt of catOpts) {
    if (opt.ecode && opt.publicPath) {
      m[opt.ecode] = opt.publicPath;
    }
  }
  return m;
}

const jacketLookup = buildLookup(manifest.jacket || []);
const trousersLookup = buildLookup(manifest.trousers || []);
const vestLookup = buildLookup(manifest.vest || []);
const shirtLookup = buildLookup(manifest.shirt || []);

// ─── JACKET / SUIT mapping ────────────────────────────────────────────────────
// Maps builder option id → kute ecode for jacket images

const JACKET_MAP = {
  // Canvas
  "fused":              "00C1",
  "light-half-canvas":  "00BU",
  "half-canvas":        "000B",
  "full-canvas":        "000A",
  "no-canvas":          "00D1",
  "light-full-canvas":  "00C3",
  // Sleeve head / Shoulder shape
  "sleeve-natural":     "0603",
  "sleeve-regular":     "0601",
  "sleeve-con-rollino": "0A2K",
  "sleeve-neapolitan":  "060N",
  "sleeve-shirt-head":  "06DC",
  // Shoulder pad
  "pad-none":           "060J",
  "pad-01":             "060K",
  "pad-03":             "060K",
  "pad-05-soft":        "060K",
  "pad-05-structured":  "060K",
  // Lapel style
  "lapel-notch-45":     "0003",
  "lapel-notch-50":     "0001",
  "lapel-notch-55":     "0001",
  "lapel-notch-65":     "0001",
  "lapel-notch-68":     "0689",
  "lapel-notch-73":     "0001",
  "lapel-notch-tab":    "0001",
  "lapel-notch-tab-basic": "0001",
  "lapel-peak-99":      "0004",
  "lapel-peak-101":     "0002",
  "lapel-peak-102":     "0002",
  "lapel-peak-102-rl":  "0002",
  "lapel-peak-103-curved": "0002",
  "lapel-peak-105":     "0002",
  "lapel-peak-107":     "0002",
  "lapel-peak-108":     "0002",
  "lapel-peak-110":     "0002",
  "lapel-peak-110-low": "0002",
  "lapel-peak-114":     "0004",
  "lapel-peak-115":     "0002",
  "lapel-peak-120-curved": "0002",
  "lapel-shawl":        "0005",
  "lapel-shawl-d":      "090A",
  "lapel-shawl-0a":     "090A",
  "lapel-shawl-0e":     "090E",
  "lapel-shawl-0005":   "0005",
  "lapel-shawl-asymmetric": "00H4",
  "lapel-peak-removable-shawl": "069P",
  "lapel-notch-removable-shawl": "069P",
  "lapel-fishtail":     "0006",
  // Lapel bh position
  "lbp-left":           "0001",  // use notch as reference
  "lbp-right":          "0001",
  "lbp-left-double":    "0001",
  "lbp-both":           "0001",
  "lbp-both-double":    "0001",
  // Button configuration
  "sb-1":               "0011",
  "sb-2":               "0012",
  "sb-3":               "0013",
  "sb-3-roll-2":        "002B",
  "sb-4":               "0017",
  "sb-4-roll-3":        "0017",
  "sb-5":               "0023",
  "sb-5-hidden":        "0023",
  "db-2x1":             "002F",
  "db-4x1":             "0017",
  "db-4x2":             "0015",
  "db-6x1":             "0018",
  "db-6x2":             "0016",
  "db-6x3":             "0019",
  // Front buttonhole
  "fbh-machine":        "0012",
  "fbh-hands":          "0012",
  // Back vent
  "bv-none":            "04N0",
  "bv-center":          "04N1",
  "bv-side":            "04N2",
  "bv-side-belt":       "04N3",
  "bv-side-fixed-belt": "04H3",
  // Chest pocket
  "cp-none":            "0100",
  "cp-welt-23":         "011A",
  "cp-welt-25":         "0101",
  "cp-welt-27":         "0101",
  "cp-welt-curved-23":  "0102",
  "cp-welt-curved-25":  "0102",
  "cp-welt-curved-27":  "0102",
  "cp-welt-curved-29":  "0102",
  "cp-jetted":          "0110",
  "cp-patch":           "0150",
  "cp-patch-round":     "0150",
  "cp-patch-tulip":     "0157",
  "cp-patch-angled":    "0104",
  "cp-patch-multi":     "0121",
  "cp-boat-28":         "0103",
  "cp-boat-30":         "0103",
  "cp-trapezoid":       "00J2",
  "cp-inverted-pleat-2flap": "0153",
  "cp-inverted-pleat-flap":  "015F",
  // Lower pocket
  "lp-slanted-flap-40": "02A1",
  "lp-slanted-flap-45": "02A1",
  "lp-slanted-flap-50": "02A1",
  "lp-slanted-flap-55": "02A1",
  "lp-slanted-flap-60": "02A1",
  "lp-slanted-flap-65": "02A1",
  "lp-large-slanted-40": "02B1",
  "lp-large-slanted-45": "02B1",
  "lp-large-slanted-50": "02B1",
  "lp-large-slanted-55": "02B1",
  "lp-large-slanted-60": "02B1",
  "lp-large-slanted-65": "02B1",
  "lp-straight-jetted-40": "0201",
  "lp-straight-jetted-45": "0201",
  "lp-straight-jetted-50": "0201",
  "lp-straight-jetted-55": "0201",
  "lp-straight-jetted-60": "0201",
  "lp-straight-jetted-65": "0201",
  "lp-jetted-4":          "0231",
  "lp-straight-jetted":   "0201",
  "lp-slanted-jetted":    "02A6",
  "lp-large-slanted-jetted": "02C1",
  "lp-welt-10":           "0267",
  "lp-welt-12":           "0267",
  "lp-welt-15":           "0267",
  "lp-rl-flat-55":        "0201",
  "lp-patch":             "02J1",
  "lp-patch-rounded":     "02K0",
  "lp-patch-flap":        "02L2",
  "lp-patch-flap-btn":    "02L2",
  "lp-patch-btn-tab-round":  "02M1",
  "lp-patch-btn-tab-straight": "02M1",
  "lp-patch-btn-tab-angled": "02M1",
  "lp-inverted-flap":     "02K4",
  "lp-inverted-flap-btn": "02L4",
  "lp-inverted-angled-flap-btn": "02L4",
  "lp-jetted-btn-tab":    "02M8",
  "lp-box-pleat-flap":    "02K4",
  "lp-angled-box-pleat":  "02K5",
  "lp-multi-pleat":       "02K4",
  "lp-water-drop":        "02KY",
  // Pocket bartack — use mtm.baoxiniao since kute doesn't have bartack section
  // Ticket pocket
  "tp-none":        "027H",
  "tp-jetted":      "027A",
  "tp-welt":        "0271",
  "tp-card-italian": "0270",
  "tp-card-formal": "0270",
  "tp-rl-card":     "0270",
  "tp-flap-40":     "0270",
  "tp-flap-45":     "0270",
  "tp-flap-50":     "0270",
  "tp-flap-55":     "0270",
  "tp-flap-60":     "0270",
  // Sleeve vent
  "sv-none":              "AAAK",
  "sv-mock":              "AAAI",
  "sv-functional":        "AAAJ",
  "sv-functional-mock":   "AAAJ",
  "sv-functional-no-bh":  "AAAJ",
  // Cuff button number
  "cb-none":  "0626",
  "cb-1":     "0623",
  "cb-2":     "0629",
  "cb-3":     "0624",
  "cb-4":     "0621",
  "cb-5":     "0627",
  "cb-6":     "06X1",
  // Lining coverage
  "lc-full":    "AAQL",
  "lc-half":    "AA2Y",
  "lc-quarter": "AA4Y",
  "lc-none":    "AAWY",
  "lc-third":          "AA3Y",
  "lc-sleeve-only":    "AAYY",
  // Half lining style / cut
  "hls-standard":      "AA2Y",
  "hls-small-cutaway": "AA2Y",
  "hls-half":          "AA2Y",
  "hls-third-cutaway": "AA3Y",
  "hls-third":         "AA3Y",
  "hls-quarter-cutaway":"AA4Y",
  "hlc-binding":       "AA2Y",
  "hlc-french":        "AA2Z",
  "hlc-joining":       "AA2Y",
  // Body lining colour
  "bl-matching":       "0711",
  "bl-navy":           "0711",
  "bl-black":          "0711",
  "bl-cream":          "0711",
  "bl-charcoal":       "0711",
  "bl-burgundy":       "0711",
  "bl-gold-paisley":   "0711",
  "bl-pattern":        "072D",
  "bl-custom":         "072D",
  // Sleeve lining
  "sl-matching":       "0721",
  "sl-stripe":         "0723",
  "sl-navy":           "0721",
  "sl-black":          "0721",
  "sl-custom":         "072D",
  // Lining facing
  "facing-1":          "0701",
  "facing-2":          "0702",
  "facing-4":          "0701",
  "facing-5":          "0702",
  "facing-7":          "0701",
  "facing-9":          "0791",
  "facing-half":       "0701",
  "facing-none":       "0702",
  // Canvas
  "quarter-canvas":    "00C3",
  // Collar felt
  "felt-matching":     "0671",
  "felt-self":         "0673",
  "felt-custom":       "0671",
  // Lapel BH style
  "lbh-none":          "0544",
  "lbh-real":          "0554",
  "lbh-fake-round":    "055K",
  "lbh-fake-square":   "0551",
  "lbh-dragon-horn":   "035R",
  "lbh-glory-rays":    "0354",
  "lbh-cloud":         "0352",
  "lbh-rome-18":       "07MB",
  "lbh-rome-18m":      "07MA",
  "lbh-rome-23m":      "07MB",
  "lbh-milanese-20":   "055F",
  "lbh-milanese-23":   "055F",
  "lbh-milanese-25":   "055F",
  "lbh-milanese-curved":"06EG",
  "lbh-smoking-pipe":  "00EF",
  "lbh-lumi":          "055F",
  "lbh-pinpoint":      "00ED",
  "lbh-005-hand":      "064Q",
  "lbh-006-hand":      "035C",
  "lbh-017-hand":      "00EC",
  "lbh-008-hand":      "064Q",
  // Lapel BH position extras
  "lbp-3l-2r":         "0549",
  "lbp-3l-1r":         "054Y",
  // Sleeve BH alignment
  "sbh-straight":      "AAAM",
  "sbh-slant":         "AAAN",
  "slbh-machine":      "AAAM",
  "slbh-hands":        "06S8",
  // Elbow patch
  "ep-round":          "0609",
  "ep-round-sleeve":   "0610",
  // Kissing / waterfall buttons
  "bs-kissing":        "0630",
  // Pick stitching
  "ps-none":           "0570",
  "ps-015-machine":    "0571",
  "ps-06-machine":     "0576",
  "ps-top-06":         "0580",
  "ps-top-4cm":        "0580",
  "ps-015-hand":       "0571",
  "ps-06-hand":        "0576",
  "ps-double":         "09T5",
  "psp-lapel-front":   "0577",
  "psp-plus-back":     "0577",
  "psp-all-seams":     "0577",
  // Button sewing style
  "sbs-machine":       "0643",
  "sbs-cross-hand":    "0644",
  "sbs-down-hand":     "0643",
  "sbs-eq-hand":       "0643",
  "sbs-sq-hand":       "0646",
  "sbs-under-hand":    "0645",
  // Contrast positions
  "contrast-collar":      "065V",
  "contrast-lapel":       "065Q",
  "contrast-chest-pocket":"065K",
  "contrast-lower-besom": "0659",
  "contrast-lower-flap":  "0659",
  "contrast-ticket-flap": "0668",
  "contrast-ticket-besom":"0668",
  "contrast-satin-lapel": "0652",
  "cp-piping":            "085F",
  // Inner pockets
  "pen-none":          "0806",
  "pen-left-jetted":   "0801",
  "pen-left-drop":     "0803",
  "pen-left-diamond":  "0803",
  "pen-right-jetted":  "0808",
  "pen-right-drop":    "0808",
  "pen-right-diamond": "0808",
  "nc-none":           "0806",
  "nc-left":           "080H",
  "nc-right":          "080P",
  "nc-both":           "080X",
  "itp-none":          "0806",
  "itp-left":          "0801",
  "itp-right":         "0808",
  "itp-both":          "080X",
  "mp3-none":          "0804",
  "mp3-left":          "0802",
  "mp3-right":         "0802",
  "ipc-d":             "0862",
  "ipc-i":             "0861",
  "ipc-x":             "0864",
  "bartack-d":         "0862",
  "bartack-i":         "0861",
  "bartack-x":         "0864",
  "bartack-1":         "0861",
  // Sweat pads
  "pp-none":           "074G",
  "pp-triangle":       "0742",
  "pp-round-1":        "0745",
  "pp-round-2":        "0747",
  "pp-round-3":        "0745",
  "pp-u-1":            "0750",
  "pp-u-2":            "0752",
  "pp-u-3":            "0750",
  // Handmade construction
  "hm-none":           "0570",
  "hm-individual":     "08C0",
  "hm-full":           "08C0",
  "hmd-none":          "0570",
  "hmd-shoulder":      "08C0",
  "hmd-shoulder-vent": "08C0",
  "hmd-full":          "08C0",
  // Front hem shape
  "hem-round":         "AAAC",
  "hem-round-06":      "AAAE",
  "hem-squared":       "AAAG",
  "hem-small-curve":   "AAAH",
  "hem-big-curve":     "AAAC",
  "hem-dr-round":      "AAAC",
};

// ─── TROUSERS mapping ─────────────────────────────────────────────────────────

const TROUSERS_MAP = {
  // Pleat style
  "flat-front":      "302L",  // No pleat no dart
  "single-forward":  "3022",  // Single, toward fly
  "double-forward":  "3024",  // Double, toward fly
  "single-reverse":  "3021",  // Single, toward side
  "double-reverse":  "3023",  // Double, toward side
  // Back darts (share pleat-style ecodes — combined in kute)
  "darts-none":      "302L",  // No pleat no dart
  "darts-single":    "302M",  // No pleat, single dart
  "darts-double":    "302Y",  // No pleat, double darts
  // Front pocket
  "slant-pockets":   "3101",  // 3.2cm slant
  "on-seam-pockets": "3130",  // Sideseam
  "quarter-top":     "3104",  // 2.5cm slant (closest)
  "no-front-pockets":"313C",  // No
  "jetted-front":    "3131",  // Besom
  // Watch pocket
  "watch-none":      "3169",  // No
  "watch-right":     "3180",  // Regular right
  "watch-left":      "3171",  // Left welt
  // Back pocket
  "back-none":       "31A0",  // No
  "back-left-welt":  "3221",  // Welt with bttn
  "back-both-welt":  "320B",  // Right&left besom (left bttn) — closest both-sides
  "back-left-jetted":"32C7",  // Left besom bttn&bttnhole
  "back-both-jetted":"3200",  // Double besom
  "back-left-patch": "3230",  // Patch with pointed
  "back-both-patch": "3231",  // Point patch, with bttn (both)
  // Fly
  "fly-zip":         "3420",  // Nylon zip
  "fly-button":      "3422",  // Bttns
  "fly-hook-bar":    "3400",  // Fish-mouth fly
  // Belt loops
  "loops-standard":  "3330",  // Regular
  "loops-5":         "3330",  // Regular (closest)
  "loops-no":        "3329",  // No
  "loops-passant":   "3331",  // Double loop (closest to passant)
  // Waistband extension
  "ext-straight":    "3412",  // Sharp, hook&btn
  "ext-pointed":     "3413",  // Round, hook&btn
  "ext-curved":      "342A",  // Square, hook&btn
  // Bottom / hem
  "hem-no-cuff":     "3600",  // 5.0cm plain
  "hem-blind":       "3607",  // 6.4cm (plain finish closest)
  "hem-machine-plain":"3600", // 5.0cm
  "hem-single-turnup":"3604", // 4.4cm cuff (closest to 4cm)
  "hem-double-turnup":"3605", // 5.1cm cuff (closest to 6cm)
  // Lining
  "lining-none":     "3500",  // No
  "lining-knee":     "3502",  // Front half, pocket inside (knee height)
  "lining-full":     "3506",  // Front&back full, pocket inside
  // Pocket stitching
  "pocket-stitch-none":   "31A6",
  "pocket-stitch-06":     "31A3",
  "pocket-stitch-double": "31A9",
  // Watch pocket — both sides
  "watch-both":           "3532",
  // Waistband adjuster
  "adjuster-none":        "3349",
  "adjuster-both":        "3352",
  "adjuster-left":        "3351",
  // Fly stitching
  "fly-stitch-curved":    "31A3",
  "fly-stitch-straight":  "31A1",
  "fly-stitch-none":      "31A6",
  // Bartack
  "bartack-standard":     "3191",
  // Inner curtain / french tack
  "inner-curtain":        "3430",
  "inner-french-tack":    "3434",
  // Trouser contrast
  "trouser-contrast-side":   "3382",
  "trouser-contrast-pocket": "314A",
  "trouser-contrast-waist":  "33A2",
  // Top button orientation
  "tbtn-cross":    "345B",
  "tbtn-parallel": "345A",
};

// ─── VEST mapping ─────────────────────────────────────────────────────────────

const VEST_MAP = {
  // Button stance
  "sb-3":            "401C",  // 3 bttns
  "sb-4":            "401D",  // 4 bttns
  "sb-5":            "401G",  // 5 bttns
  "sb-6":            "401P",  // 6 bttns
  "sb-7":            "401P",  // 6 bttns (closest — no 7)
  "sb-high-stance":  "401G",  // 5 bttns (closest)
  "db-4x2":          "401M",  // 4 bttns (4X2)
  "db-5x3":          "401K",  // 6 bttns (6X3) (closest)
  "db-6x3":          "401K",  // 6 bttns (6X3)
  "db-8x4":          "401L",  // 8 bttns (8X4)
  "db-10x5":         "401L",  // 8 bttns (closest)
  // Neckline / lapel
  "v-neckline":      "4000",  // V shape without collar
  "u-neckline":      "4001",  // U shape without collar
  "deep-v":          "4000",  // V shape (closest)
  "notch-lapel-vest":"4004",  // Notch without collar band
  "peak-lapel-vest": "4006",  // Peak without collar band
  "shawl-lapel-vest":"4003",  // Shawl without collar band
  "lapel-collar-stand":"4005",// Notch with collar band
  "semi-lapel":      "4004",  // Notch without collar band (closest)
  // Chest pocket
  "vest-chest-none":     "4X06", // No breast pocket
  "vest-chest-left-welt":"4111", // Left welt
  "vest-chest-left-patch":"4125",// Left Patch
  "vest-chest-both-welt":"4142", // Right&Left welt
  "vest-chest-boat":     "4112", // Left besom (closest)
  "vest-chest-jetted":   "4112", // Left besom
  // Lower pockets
  "vest-lower-none":    "4151",  // No
  "vest-lower-welt":    "4300",  // Regular welt
  "vest-lower-jetted":  "4301",  // Besom
  "vest-lower-patch":   "4162",  // Patch
  "vest-lower-slanted": "4169",  // Slant welt
  // Back style
  "back-fabric-vest":   "4211",  // Fabric back
  "back-stretch-vest":  "4202",  // Without belt (no strap — closest)
  "back-strap-vest":    "4200",  // Standard vest with strap
  // Back belt
  "vest-belt-yes":      "4200",  // Standard vest with strap
  "vest-belt-tabs":     "4200",  // Standard (closest)
  "vest-belt-none":     "4202",  // Without belt
  // Lapel buttonhole
  "vest-bh-hand":         "4649",
  "vest-lapel-bh-none":   "4544",
  "vest-lapel-bh-left":   "4541",
  // Ticket pocket
  "vest-ticket-right":    "4201",
  "vest-ticket-left":     "4204",
  // Back fabric
  "vest-back-match":      "4211",
  "vest-back-lining":     "4210",
  "vest-back-custom":     "4213",
  // Bottom shape
  "vest-bottom-round":         "401Y",
  "vest-bottom-straight":      "401Z",
  "vest-bottom-point":         "401H",
  "vest-bottom-double-point":  "401J",
  // Body lining
  "vest-bl-navy":         "4711",
  "vest-bl-black":        "4711",
  "vest-bl-cream":        "4711",
  "vest-bl-gold-paisley": "4711",
  "vest-bl-custom":       "4711",
  // Pick stitching
  "vest-pick-lapel":      "4576",
  "vest-pick-full":       "4580",
  // Contrast
  "vest-contrast-pocket": "41U1",
  "vest-contrast-piping": "4853",
};

// ─── Generate image path for a builder option ─────────────────────────────────

function getJacketImage(optionId) {
  const ecode = JACKET_MAP[optionId];
  if (!ecode) return null;
  return jacketLookup[ecode] || null;
}

function getTrousersImage(optionId) {
  const ecode = TROUSERS_MAP[optionId];
  if (!ecode) return null;
  return trousersLookup[ecode] || null;
}

function getVestImage(optionId) {
  const ecode = VEST_MAP[optionId];
  if (!ecode) return null;
  return vestLookup[ecode] || null;
}

// ─── Patch suit.ts ────────────────────────────────────────────────────────────

function patchOptionsFile(filePath, imageFn) {
  let src = readFileSync(filePath, "utf8");
  let updated = 0;

  // Match: id: "...", ... image: "/images/..."  (or no image field at end of object)
  // Strategy: replace image field if option id maps to a factory image
  // Use a regex to find each option block and update its image

  // Match FLAT option objects only (no nested braces — avoids section/field containers)
  src = src.replace(
    /\{\s*id:\s*"([^"]+)"[^{}]*\}/gs,
    (match, id) => {
      const factoryImg = imageFn(id);
      if (!factoryImg) return match;

      updated++;
      // If already has image field, replace it
      if (match.includes("image:")) {
        return match.replace(/image:\s*"[^"]*"/, `image: "${factoryImg}"`);
      } else {
        // Add image field before the closing brace
        return match.replace(/\s*\}$/, `, image: "${factoryImg}" }`);
      }
    }
  );

  writeFileSync(filePath, src, "utf8");
  return updated;
}

const suitPath = path.join(__dirname, "src", "data", "options", "suit.ts");
if (existsSync(suitPath)) {
  const n = patchOptionsFile(suitPath, getJacketImage);
  console.log(`suit.ts: updated ${n} option images`);
} else {
  console.log("suit.ts not found at", suitPath);
}

const trousersPath = path.join(__dirname, "src", "data", "options", "trousers.ts");
if (existsSync(trousersPath)) {
  const n = patchOptionsFile(trousersPath, getTrousersImage);
  console.log(`trousers.ts: updated ${n} option images`);
} else {
  console.log("trousers.ts not found at", trousersPath);
}

const vestPath = path.join(__dirname, "src", "data", "options", "vest.ts");
if (existsSync(vestPath)) {
  const n = patchOptionsFile(vestPath, getVestImage);
  console.log(`vest.ts: updated ${n} option images`);
} else {
  console.log("vest.ts not found at", vestPath);
}

// ─── Report unmapped options ──────────────────────────────────────────────────

console.log("\n=== Unmapped jacket options (no factory image found) ===");
for (const [optId, ecode] of Object.entries(JACKET_MAP)) {
  if (!jacketLookup[ecode]) console.log(`  ${optId} → ecode ${ecode} has no image`);
}

console.log("\n=== Unmapped trousers options (no factory image found) ===");
for (const [optId, ecode] of Object.entries(TROUSERS_MAP)) {
  if (!trousersLookup[ecode]) console.log(`  ${optId} → ecode ${ecode} has no image`);
}

console.log("\n=== Unmapped vest options (no factory image found) ===");
for (const [optId, ecode] of Object.entries(VEST_MAP)) {
  if (!vestLookup[ecode]) console.log(`  ${optId} → ecode ${ecode} has no image`);
}

console.log("\nDone. suit.ts, trousers.ts, vest.ts updated with factory image paths.");
