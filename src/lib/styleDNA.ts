/**
 * styleDNA — pure functions for the Progressive Bespoke Discovery Engine
 *
 * Fabric ranking: soft-reorders a fabric list based on discovery quiz answers
 * (every fabric kept; best matches surfaced first). Design-field DNA lives in
 * quizEngine.ts.
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
