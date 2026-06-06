/**
 * apply-research.mjs
 * Merges research patches (description + images) into option JSON files.
 * Usage: node apply-research.mjs <json-file> <patch-file>
 * Or import applyPatch() directly from other scripts.
 */

import { readFileSync, writeFileSync } from "fs";

export function applyPatch(productFile, patch) {
  const data = JSON.parse(readFileSync(productFile, "utf8"));

  let applied = 0;
  let notFound = [];

  for (const [optionId, update] of Object.entries(patch)) {
    let found = false;
    for (const section of data.sections) {
      for (const field of section.fields) {
        for (const opt of field.options) {
          if (opt.id === optionId) {
            if (update.description) opt.description = update.description;
            if (update.images) opt.images = update.images;
            applied++;
            found = true;
          }
        }
      }
    }
    if (!found) notFound.push(optionId);
  }

  writeFileSync(productFile, JSON.stringify(data, null, 2), "utf8");
  console.log(`✓ ${productFile}: applied ${applied} patches`);
  if (notFound.length) console.warn(`  ⚠ Not found: ${notFound.join(", ")}`);
  return { applied, notFound };
}

// If run directly: node apply-research.mjs <product-json> <patch-json>
if (process.argv[2] && process.argv[3]) {
  const patch = JSON.parse(readFileSync(process.argv[3], "utf8"));
  applyPatch(process.argv[2], patch);
}
