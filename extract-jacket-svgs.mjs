/**
 * Extracts all jacket option SVG illustrations from designer_2.html,
 * saves them as .svg files, and logs a mapping for suit.ts.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const html = readFileSync('C:/Users/ChaseStanley/Downloads/designer_2.html', 'utf8');
const publicBase = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/public/images';

// Only look inside the jacket panel
const panelStart = html.indexOf('id="panel-jacket"');
const panelEnd = html.indexOf('id="panel-pants"');
const jacketHtml = html.substring(panelStart, panelEnd > 0 ? panelEnd : html.length);

// Parse all illus-tiles: onclick="pick(this,'fieldId','displayLabel','value')"
const tileRe = /onclick="pick\(this,'([^']+)','([^']+)','([^']*)'\)"[^>]*class="illus-tile[^"]*">([\s\S]*?)<\/div>\s*<div class="illus-lbl">([^<]*)<\/div>\s*<\/div>/g;

const groups = {}; // fieldId -> [{label, svg}]
let m;
while ((m = tileRe.exec(jacketHtml)) !== null) {
  const [, fieldId, , , innerHtml, lbl] = m;
  // Extract SVG
  const svgStart = innerHtml.indexOf('<svg');
  const svgEnd = innerHtml.lastIndexOf('</svg>') + 6;
  const svg = svgStart >= 0 ? innerHtml.substring(svgStart, svgEnd) : null;
  if (!groups[fieldId]) groups[fieldId] = [];
  groups[fieldId].push({ label: lbl.trim(), svg });
}

// Save SVGs and print mapping
const mappings = [];
for (const [fieldId, opts] of Object.entries(groups)) {
  const dir = join(publicBase, 'jacket', fieldId);
  mkdirSync(dir, { recursive: true });
  console.log(`\n[${fieldId}] — ${opts.length} options`);
  for (const { label, svg } of opts) {
    if (!svg) { console.log(`  (no svg) ${label}`); continue; }
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = `${slug}.svg`;
    writeFileSync(join(dir, filename), svg, 'utf8');
    console.log(`  "${label}" → /images/jacket/${fieldId}/${filename}`);
    mappings.push({ fieldId, label, path: `/images/jacket/${fieldId}/${filename}` });
  }
}

writeFileSync(
  'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/jacket-image-mappings.json',
  JSON.stringify(mappings, null, 2),
  'utf8'
);
console.log(`\nSaved ${mappings.length} SVG files. Mapping written to jacket-image-mappings.json`);
