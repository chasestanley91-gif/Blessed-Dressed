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
  season?: string[];
  occasion?: string[];
};

// ── Fabric filter ──────────────────────────────────────────────────

export function filterFabrics(
  fabrics: TaggedFabric[],
  dq: Record<string, string>
): TaggedFabric[] {
  if (Object.keys(dq).length === 0) return fabrics;

  const passes = (f: TaggedFabric) => {
    if (dq.weight && dq.weight !== "any" && f.weight && f.weight !== dq.weight) return false;
    if (dq.occasion && dq.occasion !== "any" && f.occasion && !f.occasion.includes(dq.occasion)) return false;
    if (dq.color && dq.color !== "any" && f.color && !f.color.includes(dq.color)) return false;
    if (dq.pattern && dq.pattern !== "any" && f.pattern && f.pattern !== dq.pattern) return false;
    if (dq.priority === "luxury" && !f.premium) return false;
    return true;
  };

  // Try full filter first
  const strict = fabrics.filter(passes);
  if (strict.length > 0) return strict;

  // Graceful fallback: relax filters one at a time (priority → pattern → color → weight)
  const relaxed = (omitKeys: string[]) =>
    fabrics.filter((f) => {
      const reduced = Object.fromEntries(
        Object.entries(dq).filter(([k]) => !omitKeys.includes(k))
      );
      if (Object.keys(reduced).length === 0) return true;
      return passes({ ...f, ...Object.fromEntries(omitKeys.map((k) => [k, undefined])) });
    });

  const fallback1 = relaxed(["priority"]);
  if (fallback1.length > 0) return fallback1;
  const fallback2 = relaxed(["priority", "pattern"]);
  if (fallback2.length > 0) return fallback2;
  const fallback3 = relaxed(["priority", "pattern", "color"]);
  if (fallback3.length > 0) return fallback3;

  // Return all fabrics rather than empty
  return fabrics;
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
