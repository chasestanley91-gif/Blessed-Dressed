/**
 * seed-quiz-metadata.mjs — one-time backfill for the dynamic quiz engine.
 *
 * Writes `option.group` and `field.quiz` into data-store/options/*.json for the
 * meaningful style-family categories (lapel, collar, cuff, pocket, vent, pleat,
 * neckline, canvas, button stance…). Swatch/code categories (thread colors,
 * button codes, fabric codes) are intentionally left without a quiz so they
 * render as normal grids.
 *
 * Idempotent: re-running reproduces the same result. Ported from the previously
 * hardcoded `filterOptions` / `QUESTIONS_BY_PRODUCT` knowledge so behavior is
 * preserved, then becomes admin-editable.
 *
 * Usage:  node seed-quiz-metadata.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE = join(__dirname, "data-store", "options");
const PRODUCTS = ["suit-2pc", "suit-3pc", "sport-coat", "shirt", "trousers", "vest"];

const has = (id, ...subs) => subs.some((s) => id.includes(s));

/**
 * Config keyed by field id. Applied to any product that has that field with
 * >= 5 options. `group(id)` returns the cluster key for an option; answers'
 * `matchGroups` must reference those same keys.
 */
const FIELD_QUIZ = {
  // ── Jacket: suit-2pc / suit-3pc / sport-coat ───────────────────────────────
  "lapel-style": {
    question: "Which lapel shape appeals to you most?",
    group: (id) =>
      has(id, "notch") ? "notch" : has(id, "peak") ? "peak" : has(id, "shawl") ? "shawl" : "other",
    answers: [
      { id: "notch", label: "Notch", description: "Classic V-shaped notch — the timeless business choice.", matchGroups: ["notch"] },
      { id: "peak", label: "Peak", description: "Sharp upward points — authority and formality.", matchGroups: ["peak"] },
      { id: "shawl", label: "Shawl", description: "Smooth rounded lapel — dinner jacket and black tie.", matchGroups: ["shawl"] },
    ],
  },
  "button-config": {
    question: "Single or double breasted?",
    group: (id) => (id.startsWith("sb-") ? "single" : id.startsWith("db-") ? "double" : "other"),
    answers: [
      { id: "single", label: "Single Breasted", description: "One row of buttons — versatile and modern.", matchGroups: ["single"] },
      { id: "double", label: "Double Breasted", description: "Two overlapping rows — bold and classic.", matchGroups: ["double"] },
    ],
  },
  canvas: {
    question: "How structured should your jacket feel?",
    group: (id) =>
      ["full-canvas", "half-canvas", "light-half-canvas"].includes(id) ? "structured" : "soft",
    answers: [
      { id: "structured", label: "Structured & Sharp", description: "Full or half canvas — defined shape that lasts.", matchGroups: ["structured"] },
      { id: "soft", label: "Soft & Natural", description: "Light or fused construction — relaxed, breathable.", matchGroups: ["soft"] },
    ],
  },
  "sleeve-head": {
    question: "How should the jacket sit on your shoulders?",
    group: (id) =>
      has(id, "natural") ? "natural"
      : has(id, "con-rollino", "continental") ? "continental"
      : has(id, "regular") ? "structured"
      : has(id, "neapolitan") ? "neapolitan"
      : "other",
    answers: [
      { id: "natural", label: "Soft & Natural", description: "Follows your shoulder's curve — Italian softness.", matchGroups: ["natural"] },
      { id: "continental", label: "Continental Roll", description: "A slight roll at the sleeve head — refined.", matchGroups: ["continental"] },
      { id: "structured", label: "Structured & Defined", description: "Sharp British shoulder — authority and presence.", matchGroups: ["structured"] },
      { id: "neapolitan", label: "Neapolitan", description: "Hand-sewn shirred sleeve — the pinnacle of craft.", matchGroups: ["neapolitan"] },
    ],
  },
  "lower-pocket": {
    question: "How polished should the pockets look?",
    group: (id) =>
      has(id, "flap") ? "flap"
      : has(id, "jetted", "besom", "welt") ? "jetted"
      : has(id, "patch") ? "patch"
      : "other",
    answers: [
      { id: "flap", label: "Flap", description: "Relaxed and approachable — the everyday standard.", matchGroups: ["flap"] },
      { id: "jetted", label: "Jetted", description: "Clean, minimal, ceremonial.", matchGroups: ["jetted"] },
      { id: "patch", label: "Patch", description: "Casual character — sport coats and soft tailoring.", matchGroups: ["patch"] },
    ],
  },
  "back-vent-style": {
    question: "How do you move through your day?",
    group: (id) => (has(id, "side") ? "side" : id === "bv-none" ? "none" : has(id, "center") ? "center" : "other"),
    answers: [
      { id: "side", label: "Active & Moving", description: "Side / double vents — freedom and easy sitting.", matchGroups: ["side"] },
      { id: "none", label: "Mostly Standing", description: "No vent — clean drape, classic silhouette.", matchGroups: ["none"] },
      { id: "center", label: "Center Vent", description: "A single center vent — traditional and practical.", matchGroups: ["center"] },
    ],
  },

  // ── Shirt ──────────────────────────────────────────────────────────────────
  // Collar lives in the field literally named "lapel" in the shirt config.
  lapel: {
    question: "What collar style suits you?",
    group: (id) =>
      has(id, "cutaway") ? "cutaway"
      : has(id, "button-down", "cuban", "frog", "mandarin", "hexagon") ? "casual"
      : has(id, "stand", "one-piece", "tuxedo", "wrap") ? "band"
      : has(id, "round", "curve") ? "round"
      : has(id, "sq") ? "square"
      : has(id, "point") ? "point"
      : has(id, "regular", "af1", "french") ? "spread"
      : "other",
    answers: [
      { id: "point", label: "Classic Point", description: "Traditional points — the dress-shirt staple.", matchGroups: ["point"] },
      { id: "spread", label: "Spread & Cutaway", description: "Wider spread — modern, confident, great with a tie.", matchGroups: ["cutaway", "spread", "round"] },
      { id: "casual", label: "Casual & Band", description: "Button-down, Cuban, mandarin — relaxed and expressive.", matchGroups: ["casual", "band", "square"] },
    ],
  },
  cuff: {
    question: "Preferred cuff style?",
    group: (id) => (has(id, "french") ? "french" : "button"),
    answers: [
      { id: "button", label: "Button Cuff", description: "Classic barrel cuff — everyday elegance.", matchGroups: ["button"] },
      { id: "french", label: "French / Double Cuff", description: "Folded back, worn with cufflinks — formal and refined.", matchGroups: ["french"] },
    ],
  },

  // ── Trousers ────────────────────────────────────────────────────────────────
  "pleat-style": {
    question: "Front pleat preference?",
    group: (id) =>
      has(id, "flat", "no-") ? "flat"
      : id.startsWith("single") ? "single"
      : id.startsWith("double") ? "double"
      : "other",
    answers: [
      { id: "flat", label: "Flat Front", description: "Clean and contemporary — a slim silhouette.", matchGroups: ["flat"] },
      { id: "single", label: "Single Pleat", description: "One forward pleat — comfort with elegance.", matchGroups: ["single"] },
      { id: "double", label: "Double Pleat", description: "Two pleats — classic tailored fullness.", matchGroups: ["double"] },
    ],
  },
  "front-pocket-style": {
    question: "What front pocket style?",
    group: (id) =>
      has(id, "slant") ? "slant"
      : has(id, "seam") ? "seam"
      : has(id, "jetted", "welt") ? "jetted"
      : has(id, "quarter") ? "quarter"
      : has(id, "no-front") ? "none"
      : "other",
    answers: [
      { id: "slant", label: "Slanted", description: "Angled opening — easy access, sporty line.", matchGroups: ["slant"] },
      { id: "seam", label: "Side-Seam", description: "Hidden in the seam — the cleanest look.", matchGroups: ["seam"] },
      { id: "jetted", label: "Jetted / Welt", description: "Sharp horizontal welt — formal and tidy.", matchGroups: ["jetted"] },
    ],
  },
  "back-pocket-style": {
    question: "Back pocket style?",
    group: (id) =>
      has(id, "welt") ? "welt"
      : has(id, "jetted") ? "jetted"
      : has(id, "besom") ? "besom"
      : has(id, "patch") ? "patch"
      : has(id, "none") ? "none"
      : "other",
    answers: [
      { id: "welt", label: "Welt", description: "Buttoned welt — the tailored default.", matchGroups: ["welt"] },
      { id: "jetted", label: "Jetted / Besom", description: "Minimal piped opening — refined.", matchGroups: ["jetted", "besom"] },
      { id: "patch", label: "Patch", description: "Applied pocket — casual and relaxed.", matchGroups: ["patch"] },
    ],
  },
  "hem-style": {
    question: "How should the trouser hem finish?",
    group: (id) =>
      has(id, "no-cuff") ? "plain"
      : has(id, "turnup", "cuff") ? "cuffed"
      : has(id, "blind", "plain") ? "plain"
      : "other",
    answers: [
      { id: "plain", label: "Plain Hem", description: "Clean finish — modern and versatile.", matchGroups: ["plain"] },
      { id: "cuffed", label: "Cuffed / Turn-Up", description: "Folded turn-up — traditional weight and structure.", matchGroups: ["cuffed"] },
    ],
  },

  // ── Vest ─────────────────────────────────────────────────────────────────────
  "button-stance": {
    question: "Single or double breasted?",
    group: (id) => (id.startsWith("sb-") ? "single" : id.startsWith("db-") ? "double" : "other"),
    answers: [
      { id: "single", label: "Single Breasted", description: "One row of buttons — clean and versatile.", matchGroups: ["single"] },
      { id: "double", label: "Double Breasted", description: "Overlapping rows — a bold statement.", matchGroups: ["double"] },
    ],
  },
  "neckline-style": {
    question: "Which neckline appeals to you most?",
    group: (id) =>
      id === "v-neckline" ? "vneck"
      : id === "u-neckline" ? "uneck"
      : has(id, "notch") ? "notch"
      : has(id, "peak") ? "peak"
      : has(id, "shawl") ? "shawl"
      : "collar",
    answers: [
      { id: "vneck", label: "V-Neck", description: "The classic waistcoat opening.", matchGroups: ["vneck"] },
      { id: "uneck", label: "U-Neck", description: "A deeper, rounder opening for formalwear.", matchGroups: ["uneck"] },
      { id: "notch", label: "Notch Lapel", description: "A jacket-style notch on the vest.", matchGroups: ["notch"] },
      { id: "peak", label: "Peak Lapel", description: "Sharp peaks — double-breasted favourite.", matchGroups: ["peak", "collar"] },
      { id: "shawl", label: "Shawl", description: "Smooth rounded lapel — black tie.", matchGroups: ["shawl"] },
    ],
  },
  "canvas-vest": {
    question: "How structured should the vest feel?",
    group: (id) => (has(id, "full", "half") ? "structured" : "soft"),
    answers: [
      { id: "structured", label: "Structured", description: "Full or half canvas — crisp shape.", matchGroups: ["structured"] },
      { id: "soft", label: "Soft", description: "Unconstructed or fused — light and easy.", matchGroups: ["soft"] },
    ],
  },
  "lower-pockets-vest": {
    question: "What lower pocket style?",
    group: (id) =>
      has(id, "welt") ? "welt"
      : has(id, "jetted") ? "jetted"
      : has(id, "besom") ? "besom"
      : has(id, "patch") ? "patch"
      : has(id, "slant") ? "slant"
      : has(id, "none") ? "none"
      : "other",
    answers: [
      { id: "welt", label: "Welt", description: "The tailored standard.", matchGroups: ["welt"] },
      { id: "jetted", label: "Jetted / Besom", description: "Minimal piped opening.", matchGroups: ["jetted", "besom"] },
      { id: "patch", label: "Patch", description: "Applied pocket — casual.", matchGroups: ["patch"] },
      { id: "slanted", label: "Slanted", description: "Angled opening for a sporty line.", matchGroups: ["slant"] },
    ],
  },
};

let totalFields = 0;
let totalOptions = 0;

for (const product of PRODUCTS) {
  const file = join(STORE, `${product}.json`);
  if (!existsSync(file)) {
    console.warn(`  skip ${product}: file not found`);
    continue;
  }
  const cfg = JSON.parse(readFileSync(file, "utf8"));
  const applied = [];
  for (const section of cfg.sections ?? []) {
    for (const field of section.fields ?? []) {
      const conf = FIELD_QUIZ[field.id];
      if (!conf) continue;
      if ((field.options?.length ?? 0) < 5) continue; // 0–4 options → no question
      for (const opt of field.options) {
        opt.group = conf.group(opt.id);
        totalOptions++;
      }
      field.quiz = { question: conf.question, answers: conf.answers };
      applied.push(`${field.id}(${field.options.length})`);
      totalFields++;
    }
  }
  writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
  console.log(`✓ ${product}: ${applied.join(", ") || "no quizzable fields"}`);
}

console.log(`\nDone — seeded ${totalFields} questions across ${totalOptions} options.`);
