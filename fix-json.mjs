// fix-json.mjs — repairs truncated JSON from Firecrawl extraction
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(__dirname, "factory-screenshots");

function fixTruncatedJson(raw) {
  // Find the last complete field object: ends with "}]}" (opt array close + field close)
  // Search backwards for the last complete "},{"f": or "...}]}" sequence
  let fixed = raw.trim();

  // Try to parse as-is
  try {
    const data = JSON.parse(fixed);
    return data;
  } catch (_) {}

  // Find last complete array element by scanning backwards
  // A complete field looks like: {...,"o":[...{...}]}
  // The JSON ends mid-field. We need to find the last "," before the broken field.

  // Strategy: find last occurrence of "}]}" which closes a complete field
  let lastComplete = -1;
  for (let i = fixed.length - 1; i >= 0; i--) {
    if (fixed[i] === '}' && fixed.slice(i).startsWith('}]}')) {
      lastComplete = i + 3; // after the "}]}"
      break;
    }
    if (fixed[i] === '}' && i + 2 < fixed.length && fixed[i+1] === ']' && fixed[i+2] === '}') {
      lastComplete = i + 3;
      break;
    }
  }

  if (lastComplete > 0) {
    // Close the outer array
    const repaired = fixed.slice(0, lastComplete) + "]";
    try {
      const data = JSON.parse(repaired);
      console.log(`  Repaired JSON: ${data.length} fields`);
      return data;
    } catch(e) {
      console.log("  Repair failed:", e.message.slice(0, 60));
    }
  }

  // Fallback: truncate at last complete "}]"
  const idx = fixed.lastIndexOf("}]");
  if (idx > 0) {
    const repaired = fixed.slice(0, idx + 2) + "]";
    try {
      const data = JSON.parse(repaired);
      console.log(`  Fallback repair: ${data.length} fields`);
      return data;
    } catch(e) {
      console.log("  Fallback failed:", e.message.slice(0, 60));
    }
  }

  return null;
}

// Process labeled BB data
const bbLabeledPath = path.join(BASE, "suit-jacket", "bb-design-options-labeled.json");
const raw = readFileSync(bbLabeledPath, "utf8");
console.log(`BB labeled length: ${raw.length}`);

const data = fixTruncatedJson(raw);
if (data) {
  console.log(`BB fields: ${data.length}`);
  let totalOpts = 0;
  data.forEach(f => { totalOpts += f.o.length; console.log(`  ${f.f} (${f.l}): ${f.o.length} options`); });
  console.log(`Total options: ${totalOpts}`);
  // Clean labels (remove selected value from label)
  data.forEach(f => {
    f.l = f.l.replace(/\s+/g, ' ').trim();
  });
  writeFileSync(path.join(BASE, "suit-jacket", "design-options-full.json"), JSON.stringify(data, null, 2));
  console.log("Saved to suit-jacket/design-options-full.json");
} else {
  console.log("Could not repair JSON");
}
