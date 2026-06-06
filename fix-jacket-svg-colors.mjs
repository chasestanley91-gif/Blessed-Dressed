/**
 * Re-colors all jacket SVG illustrations for the dark builder UI.
 * - Replaces light fills with transparent or dark navy
 * - Replaces dark/gray strokes with cream (#F5F1E6) or gold (#D4AF37)
 * - Adds a subtle dark background rect so the SVG area is defined
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const base = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/public/images/jacket';

function fixSvg(content) {
  return content
    // Remove inline white/style background if present
    .replace(/style="[^"]*background[^"]*"/g, '')
    // Light fills → transparent (the jacket silhouette should be an outline, not a filled shape)
    .replace(/fill="#[CEDFced][0-9A-Fa-f]{5}"/g, 'fill="none"')
    .replace(/fill="#[EeFf][0-9A-Fa-f]{5}"/g, 'fill="none"')
    .replace(/fill="#D8D0C0"/g, 'fill="none"')
    .replace(/fill="#E8E4DC"/g, 'fill="none"')
    .replace(/fill="#F0ECE4"/g, 'fill="none"')
    .replace(/fill="#B0A888"/g, 'fill="none"')
    .replace(/fill="#C0B8A0"/g, 'fill="none"')
    .replace(/fill="white"/g, 'fill="none"')
    // Keep fill="none" as is
    // Dark/black strokes → cream
    .replace(/stroke="#1C1C1C"/g, 'stroke="#F5F1E6"')
    .replace(/stroke="#111"/g, 'stroke="#F5F1E6"')
    .replace(/stroke="#333"/g, 'stroke="#F5F1E6"')
    .replace(/stroke="#444"/g, 'stroke="#F5F1E6"')
    .replace(/stroke="#555"/g, 'stroke="#C8BFA8"')
    .replace(/stroke="#666"/g, 'stroke="#C8BFA8"')
    .replace(/stroke="#777"/g, 'stroke="#C8BFA8"')
    .replace(/stroke="#888"/g, 'stroke="#C8BFA8"')
    .replace(/stroke="#999"/g, 'stroke="#C8BFA8"')
    .replace(/stroke="#AAA"/g, 'stroke="#C8BFA8"')
    .replace(/stroke="#aaa"/g, 'stroke="#C8BFA8"')
    .replace(/stroke="#CCC"/g, 'stroke="#C8BFA8"')
    .replace(/stroke="#ccc"/g, 'stroke="#C8BFA8"')
    // Gold accent strokes → keep gold (#B5975A → use our gold #D4AF37)
    .replace(/stroke="#B5975A"/g, 'stroke="#D4AF37"')
    // Text colors
    .replace(/fill="#666"/g, 'fill="#C8BFA8"')
    .replace(/fill="#B5975A"/g, 'fill="#D4AF37"')
    .replace(/fill="#999"/g, 'fill="#C8BFA8"')
    .replace(/fill="#CCC"/g, 'fill="#C8BFA8"')
    .replace(/fill="#ccc"/g, 'fill="#C8BFA8"')
    // Add dark background to all SVGs (insert after opening <svg ...>)
    .replace(/(<svg[^>]*>)/, '$1<rect width="100%" height="100%" fill="#0B1B2E"/>');
}

let count = 0;
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!f.endsWith('.svg')) continue;
    const original = readFileSync(p, 'utf8');
    const fixed = fixSvg(original);
    writeFileSync(p, fixed, 'utf8');
    count++;
  }
}

walk(base);
console.log(`✓ Re-colored ${count} SVG files for dark background`);
