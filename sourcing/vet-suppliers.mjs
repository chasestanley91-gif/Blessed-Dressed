#!/usr/bin/env node
/**
 * MTM supplier vetting filter for Blessed & Dressed.
 *
 * Scores every supplier in japan-suppliers.json against the MTM Wholesale
 * Supplier Requirements (mtm-vetting-criteria.json): four hard gates, then
 * ten weighted capability categories. Emits vetted-japan-suppliers.json
 * (full scorecards, unknowns to close, verdicts) sorted best-first.
 *
 * Usage: node sourcing/vet-suppliers.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, "japan-suppliers.json"), "utf8"));
const criteria = JSON.parse(readFileSync(join(here, "mtm-vetting-criteria.json"), "utf8"));

const levelScore = (level) => criteria.evidenceScores[level] ?? 0.15;

function runGates(s) {
  const failures = [];
  if (s.excluded) failures.push(s.excludedReason || "excluded in prior research");
  const onePiece = s.evidence.onePieceMtm?.level;
  if (onePiece !== "VERIFIED" && onePiece !== "LIKELY") failures.push("one-garment MTM capability not evidenced");
  const flagText = (s.flags || []).join(" ").toLowerCase();
  if (flagText.includes("batch-only")) failures.push("batch minimums incompatible with per-customer MTM");
  if (flagText.includes("captive") && s.evidence.b2bContract?.level !== "VERIFIED") failures.push("captive factory — no third-party contract evidence");
  const b2b = s.evidence.b2bContract?.level;
  if (b2b === "UNKNOWN") failures.push("no B2B wholesale/contract evidence");
  if ((s.excludedReason || "").toLowerCase().includes("china")) failures.push("production outside Japan");
  return failures;
}

function scoreCategory(s, cat) {
  // A category's score is the mean evidence strength of its fields, times weight.
  const strengths = cat.evidenceFields.map((f) => levelScore(s.evidence[f]?.level ?? "UNKNOWN"));
  let mean = strengths.reduce((a, b) => a + b, 0) / strengths.length;
  // Commercial category blends in the cost band (lead-time-adjusted pricing fit).
  if (cat.id === "commercial") {
    const costFit = criteria.costBandScores[String(s.costBand)] ?? 0.15;
    mean = mean * 0.5 + costFit * 0.5;
  }
  // Production category rewards published/short lead times.
  if (cat.id === "production" && s.leadTimeWeeksMax != null) {
    const leadFit = s.leadTimeWeeksMax <= 4 ? 1.0 : s.leadTimeWeeksMax <= 6 ? 0.8 : s.leadTimeWeeksMax <= 8 ? 0.6 : 0.4;
    mean = mean * 0.6 + leadFit * 0.4;
  }
  return Math.round(mean * cat.weight * 10) / 10;
}

function unknownsFor(s) {
  return Object.entries(s.evidence)
    .filter(([, v]) => v.level === "UNKNOWN")
    .map(([k]) => k);
}

const results = data.suppliers.map((s) => {
  const gateFailures = runGates(s);
  const categoryScores = {};
  let total = 0;
  for (const cat of criteria.categories) {
    const sc = scoreCategory(s, cat);
    categoryScores[cat.id] = sc;
    total += sc;
  }
  total = Math.round(total * 10) / 10;
  let verdict, action;
  if (gateFailures.length > 0) {
    verdict = "DISQUALIFIED";
    action = "Do not contact for the MTM program: " + gateFailures.join("; ");
  } else {
    const band = criteria.verdictBands.find((b) => total >= b.min);
    verdict = band.verdict;
    action = band.action;
  }
  return {
    id: s.id,
    name: s.name,
    location: s.location,
    type: s.type,
    products: s.products,
    priorResearchScore: s.priorScore,
    mtmVetScore: total,
    verdict,
    action,
    gateFailures,
    categoryScores,
    leadTimeWeeks: s.leadTimeWeeksMin != null ? `${s.leadTimeWeeksMin}-${s.leadTimeWeeksMax}` : "unknown",
    costBand: s.costBand,
    unknownsToClose: unknownsFor(s),
    contact: s.contact,
    flags: s.flags || []
  };
});

const order = { QUALIFIED: 0, CONDITIONAL: 1, BACKUP: 2, DISQUALIFIED: 3 };
results.sort((a, b) => order[a.verdict] - order[b.verdict] || b.mtmVetScore - a.mtmVetScore);

const summary = {
  standard: criteria.standard,
  generatedFrom: "japan-suppliers.json",
  counts: results.reduce((acc, r) => ((acc[r.verdict] = (acc[r.verdict] || 0) + 1), acc), {}),
  results
};

writeFileSync(join(here, "vetted-japan-suppliers.json"), JSON.stringify(summary, null, 2) + "\n");

for (const r of results) {
  const lead = r.leadTimeWeeks.padEnd(8);
  console.log(
    `${r.verdict.padEnd(13)} ${String(r.mtmVetScore).padStart(5)}  lead ${lead} cost ${String(r.costBand).padEnd(9)} ${r.name}` +
      (r.gateFailures.length ? `  [${r.gateFailures[0]}]` : "")
  );
}
console.log(`\nWrote vetted-japan-suppliers.json (${results.length} suppliers): ` + JSON.stringify(summary.counts));
