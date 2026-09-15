// Extracts the craft option catalogue and the measurement schema into JSON,
// ready for build-workbooks.py. Run from the repo root:
//   node sourcing/tailorcloth/scripts/extract.mjs [outDir]
import fs from "node:fs";
import path from "node:path";

const OUT = process.argv[2] || path.join("sourcing", "tailorcloth", "scripts", ".data");
fs.mkdirSync(OUT, { recursive: true });

const PRODUCTS = [
  ["shirt", "Shirt"],
  ["sport-coat", "Sport Coat"],
  ["suit-2pc", "Suit (2-Piece)"],
  ["suit-3pc", "Suit (3-Piece)"],
  ["trousers", "Trousers"],
  ["vest", "Vest"],
];

const catalogue = PRODUCTS.map(([file, name]) => {
  const d = JSON.parse(fs.readFileSync(`data-store/options/${file}.json`, "utf8"));
  const rows = [];
  for (const section of d.sections) {
    for (const field of section.fields) {
      for (const o of field.options ?? []) {
        let description = (o.description ?? "").replace(/\s+/g, " ").trim();
        if (description.length > 900) description = `${description.slice(0, 897)}...`;
        rows.push({
          section: section.label,
          field: field.label,
          code: o.id,
          name: o.label,
          group: o.group ?? "",
          isDefault: field.defaultValue === o.id ? "Yes" : "",
          illustration: o.illustration || o.techpackIllustration ? "Yes" : "No",
          photo: o.realImage || o.photos?.length ? "Yes" : "No",
          description,
        });
      }
    }
  }
  return { file, name, basePrice: d.basePrice, sections: d.sections.length, rows };
});

fs.writeFileSync(path.join(OUT, "craft-options.json"), JSON.stringify(catalogue));

// The measurement schema is the single source of truth in the guide component.
const src = fs.readFileSync("src/components/MeasuringGuide.tsx", "utf8");
const grab = (varName) => {
  const start = src.indexOf(`const ${varName}: Measurement[] = [`);
  if (start === -1) throw new Error(`${varName} not found in MeasuringGuide.tsx`);
  const block = src.slice(start, src.indexOf("\n];", start));
  const re = /\{\s*key:\s*"([^"]+)",\s*label:\s*"([^"]+)",[\s\S]*?how:\s*"((?:[^"\\]|\\.)*)"/g;
  const out = [];
  for (let m; (m = re.exec(block)); ) {
    out.push({ key: m[1], label: m[2], how: m[3].replace(/\\"/g, '"') });
  }
  if (!out.length) throw new Error(`${varName} parsed to zero measurements`);
  return out;
};

const measurements = Object.fromEntries(
  ["BODY_JACKET", "BODY_SHIRT", "BODY_TROUSERS",
   "FINISHED_JACKET", "FINISHED_SHIRT", "FINISHED_TROUSERS"].map((v) => [v, grab(v)]),
);
fs.writeFileSync(path.join(OUT, "measurements.json"), JSON.stringify(measurements, null, 1));

const total = catalogue.reduce((a, p) => a + p.rows.length, 0);
const illustrated = catalogue.reduce(
  (a, p) => a + p.rows.filter((r) => r.illustration === "Yes").length, 0);
console.log(`${total} options (${illustrated} illustrated) -> ${OUT}`);
for (const [k, v] of Object.entries(measurements)) console.log(` ${k}: ${v.length}`);
