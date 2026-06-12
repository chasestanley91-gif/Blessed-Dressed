/**
 * styleDNA — pure functions for the Progressive Bespoke Discovery Engine
 *
 * Fabric filter: narrows a fabric list based on discovery quiz answers.
 * Style DNA: maps style consultation answers to design field pre-selections.
 */

export type TaggedFabric = {
  id: string;
  label: string;
  detail: string;
  premium: boolean;
  image?: string;
  color?: string[];
  pattern?: string;
  weight?: "light" | "medium" | "heavy";
  finish?: "crisp" | "soft" | "luxurious" | "textured";
  season?: string[];
  occasion?: string[];
};

// ── Fabric ranking (soft) ──────────────────────────────────────────
// Mirrors the craft quiz engine: every fabric is kept and reordered by how
// many active discovery criteria it matches. `bestCount` is the size of the
// top-scoring tier, used to surface "best matches" with a "show all" reveal.

export type RankedFabrics = {
  ranked: TaggedFabric[];
  bestCount: number;
  filtered: boolean;
};

export function rankFabrics(
  fabrics: TaggedFabric[],
  dq: Record<string, string>
): RankedFabrics {
  const active = Object.entries(dq).filter(([, v]) => v && v !== "any");
  if (active.length === 0) {
    return { ranked: fabrics, bestCount: fabrics.length, filtered: false };
  }

  const score = (f: TaggedFabric): number => {
    let s = 0;
    if (dq.color && dq.color !== "any" && f.color?.includes(dq.color)) s++;
    if (dq.pattern && dq.pattern !== "any" && f.pattern === dq.pattern) s++;
    if (dq.weight && dq.weight !== "any" && f.weight === dq.weight) s++;
    if (dq.finish && dq.finish !== "any" && f.finish === dq.finish) s++;
    if (dq.occasion && dq.occasion !== "any" && f.occasion?.includes(dq.occasion)) s++;
    if (dq.priority === "luxury" && f.premium) s++;
    return s;
  };

  const scored = fabrics.map((f, i) => ({ f, s: score(f), i }));
  scored.sort((a, b) => b.s - a.s || a.i - b.i);

  const maxScore = scored.length ? scored[0].s : 0;
  const bestCount = maxScore > 0 ? scored.filter((x) => x.s === maxScore).length : scored.length;

  return {
    ranked: scored.map((x) => x.f),
    bestCount,
    filtered: maxScore > 0 && bestCount < fabrics.length,
  };
}

/** Back-compat helper: returns only the ranked order (best matches first). */
export function filterFabrics(
  fabrics: TaggedFabric[],
  dq: Record<string, string>
): TaggedFabric[] {
  return rankFabrics(fabrics, dq).ranked;
}

// ── Style DNA auto-population map ────────────────────────────────

const DNA_MAP: Record<string, { fieldId: string; optionId: string }> = {
  // Shoulder style
  "shoulderStyle:natural":     { fieldId: "sleeve-head", optionId: "sleeve-natural" },
  "shoulderStyle:continental": { fieldId: "sleeve-head", optionId: "sleeve-con-rollino" },
  "shoulderStyle:structured":  { fieldId: "sleeve-head", optionId: "sleeve-regular" },
  "shoulderStyle:neapolitan":  { fieldId: "sleeve-head", optionId: "sleeve-neapolitan" },
  // Vent style
  "ventStyle:active":   { fieldId: "back-vent-style", optionId: "bv-side" },
  "ventStyle:standing": { fieldId: "back-vent-style", optionId: "bv-none" },
  "ventStyle:seated":   { fieldId: "back-vent-style", optionId: "bv-side" },
  // Pocket style
  "pocketStyle:relaxed":  { fieldId: "lower-pocket", optionId: "lp-slanted-flap-55" },
  "pocketStyle:business": { fieldId: "lower-pocket", optionId: "lp-slanted-flap-55" },
  "pocketStyle:formal":   { fieldId: "lower-pocket", optionId: "lp-straight-jetted" },
  // Lining style
  "liningStyle:classic":   { fieldId: "lining-coverage", optionId: "lc-half" },
  "liningStyle:statement": { fieldId: "lining-coverage", optionId: "lc-full" },
  "liningStyle:minimal":   { fieldId: "lining-coverage", optionId: "lc-quarter" },
};

/**
 * Apply style DNA defaults.
 * Calls setter only for fields that have a quiz answer and no existing selection.
 */
export function applyStyleDNA(
  quiz: Record<string, string>,
  designSelections: Record<string, string>,
  setDesignSelection: (fieldId: string, optionId: string) => void
): void {
  for (const [key, value] of Object.entries(quiz)) {
    const mapping = DNA_MAP[`${key}:${value}`];
    if (!mapping) continue;
    const { fieldId, optionId } = mapping;
    if (!designSelections[fieldId]) {
      setDesignSelection(fieldId, optionId);
    }
  }
}

// ── Human-readable DNA labels ─────────────────────────────────────

const DNA_LABELS: Record<string, Record<string, string>> = {
  lapelFamily:   { notch: "Notch Lapel", peak: "Peak Lapel", shawl: "Shawl Lapel", all: "All Lapels" },
  breasting:     { single: "Single Breasted", double: "Double Breasted", all: "Either" },
  formality:     { formal: "Formal / Black Tie", business: "Business", casual: "Smart Casual" },
  collarFamily:  { point: "Classic Point Collar", cutaway: "Spread & Cutaway", casual: "Casual Collar", all: "All Collars" },
  cuffFamily:    { french: "French Cuff", button: "Button Cuff", all: "Either" },
  pleatFamily:   { flat: "Flat Front", single: "Single Pleat", double: "Double Pleat", all: "All" },
  shoulderStyle: { natural: "Soft & Natural", continental: "Continental Roll", structured: "Structured & Defined", neapolitan: "Neapolitan" },
  ventStyle:     { active: "Active & Moving", standing: "Mostly Standing", seated: "Frequent Sitting" },
  pocketStyle:   { relaxed: "Relaxed (Flap)", business: "Business (Flap)", formal: "Formal (Jetted)" },
  liningStyle:   { classic: "Half Lining", statement: "Full Lining", minimal: "Quarter Lining" },
};

const DNA_SECTION_LABELS: Record<string, string> = {
  lapelFamily:   "Lapel",
  breasting:     "Button Style",
  formality:     "Occasion",
  collarFamily:  "Collar",
  cuffFamily:    "Cuff",
  pleatFamily:   "Front",
  shoulderStyle: "Shoulder",
  ventStyle:     "Vents",
  pocketStyle:   "Pockets",
  liningStyle:   "Lining",
};

export function getDNAEntries(
  quiz: Record<string, string>
): { section: string; value: string }[] {
  return Object.entries(quiz)
    .filter(([key, val]) => val && val !== "all" && DNA_LABELS[key])
    .map(([key, val]) => ({
      section: DNA_SECTION_LABELS[key] ?? key,
      value: DNA_LABELS[key]?.[val] ?? val,
    }));
}
