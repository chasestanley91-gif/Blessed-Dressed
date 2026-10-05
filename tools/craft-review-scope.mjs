/**
 * Shared rules for craft photo review.
 *
 * Skip list is the owner's: threads, fabrics, buttons (catalogs), lapel
 * buttonhole styles, monograms — those stay as they are.
 *
 * Filename matching: longest option id wins. `collar-point-70-btn.png` belongs
 * to collar-point-70-btn, NEVER to collar-point-70.
 */
export const SKIP_FIELD_IDS = new Set([
  // threads / stitch colours
  'buttonhole_thread_color_collar_band',
  'buttonhole_thread_color_placket',
  'buttonhole_thread_color_cuff',
  'buttoning_thread_color',
  'decoration_stitching_color_on_collar',
  'decoration_stitching_color_placket',
  'decoration_stitching_color_cuff',
  'sleeve_vent_decoration_thread_color',
  'button-thread',
  'button-thread-color-vest',
  'buttonhole-thread',
  'buttonhole-thread-vest',
  // fabric swatches / colour chips / SKUs
  'contrast_fabric',
  'cut_out_fabric',
  'back-fabric-code',
  'back-waist-belt-fabric',
  'fabric_label_position',
  'lining-color',
  'vest-lining-color',
  'sleeve-lining-color',
  // button catalogues / sewing / covered-button SKUs (not button-config/stance)
  'button_on_collar_stand',
  'placket_button',
  'sewing_button_style',
  'sewing-button-style',
  'sewing-button-style-trouser',
  'button-sewing-style-vest',
  'button-choice-vest',
  'covered-button-vest',
  // lapel buttonhole styles + positions (owner: perfect as-is)
  'lapel-bh-style',
  'lapel-bh-position',
  'lapel-hole-style',
  'lapel-buttonhole-vest',
  // monograms
  'monogram',
  'monograms',
  'embroidery-monogram',
]);

export function fieldIsSkipped(fieldId, fieldLabel = '', label = '') {
  if (SKIP_FIELD_IDS.has(fieldId)) return true;
  const t = `${fieldId} ${fieldLabel} ${label}`.replace(/[-_]/g, ' ').toLowerCase();
  if (/\bmonogram\b/.test(t)) return true;
  if (/\bthread\b/.test(t) && /colou?r/.test(t)) return true;
  if (/\bbutton\b/.test(t) && /colou?r|catalogue|catalog|sewing style/.test(t)) return true;
  if (/^btn |^thread |^fabric /.test(String(fieldId).replace(/[-_]/g, ' ').toLowerCase())) return true;
  return false;
}

/** Suffixes that mean "this file is a version of optionId", not a different option. */
export function isVersionSuffix(rest) {
  if (!rest) return true;
  return /^[-_]?(v\d+|a\d+|\d{10,}[a-z0-9_-]*)$/i.test(rest);
}

/**
 * Map a filename stem onto the longest matching option id.
 * Review files look like `shirt__collar-point-70__a3`.
 *
 * NEVER match a short colliding id (stitch-06-top) when a location-tied id
 * exists (collar-stitch-06-top). Longest id still wins.
 */
export function matchStemToOption(stem, optionIdsLongestFirst) {
  const s = String(stem || '')
    .replace(/\.(webp|png|jpe?g|avif|jfif)$/i, '')
    .trim();
  if (!s) return null;
  const review = s.match(/^[a-z0-9-]+__([a-z0-9-]+)__/i);
  if (review) {
    const id = review[1];
    if (optionIdsLongestFirst.includes(id)) return id;
  }
  const fieldOpt = s.match(/(?:^|__)([a-z0-9-]+)__([a-z0-9-]+)(?:__|$)/i);
  if (fieldOpt) {
    const combined = `${fieldOpt[1]}__${fieldOpt[2]}`;
    if (optionIdsLongestFirst.includes(combined)) return combined;
    if (optionIdsLongestFirst.includes(fieldOpt[2])) {
      const locTied = optionIdsLongestFirst.find((id) => id.endsWith(`-${fieldOpt[2]}`) || id === fieldOpt[2]);
      if (locTied) return locTied;
    }
  }
  for (const id of optionIdsLongestFirst) {
    if (s === id) return id;
    if (s.startsWith(id) && isVersionSuffix(s.slice(id.length))) return id;
  }
  return null;
}

export function optionIdsLongestFirst(ids) {
  return [...new Set(ids)].sort((a, b) => b.length - a.length || a.localeCompare(b));
}
