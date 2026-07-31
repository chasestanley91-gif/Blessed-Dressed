// catalog.mjs — locate and walk the Blessed & Dressed craft-option catalog.
//
// The app resolves builder options as: data-store/options/<p>.json (if present,
// served via admin-data) ?? the bundled src/data/options/<p>.ts. This loader
// mirrors that: it reads a product from its JSON export when one exists, and
// otherwise from its single-export TypeScript design file (how trousers & vest
// are stored in the dev repo). Either way it yields the same flat option records
// and remembers the source file so write-back edits the file the builder reads.
//
// Web image paths ("/images/<cat>/<file>") map to "<repo>/public/images/...".

import fs from 'node:fs';
import path from 'node:path';
import { findUp, parseArgs } from './util.mjs';

export { findUp, parseArgs };

// Resolve catalog locations from flags or by walking up.
export function resolveCatalog({ options, public: pub, src, start = process.cwd() } = {}) {
  const optionsDir =
    options ||
    findUp(start, path.join('data-store', 'options')) ||
    findUp(start, path.join('src', 'data', 'options'));
  if (!optionsDir || !fs.existsSync(optionsDir)) {
    throw new Error(
      'Could not locate the catalog. Pass --options=<dir> (data-store/options) ' +
        'or a repo containing src/data/options.'
    );
  }
  // repoRoot = the nearest ancestor that contains public/ (works for both
  // data-store/options and src/data/options layouts).
  let repoRoot = path.resolve(optionsDir, '..', '..');
  if (!fs.existsSync(path.join(repoRoot, 'public'))) {
    const found = findUp(optionsDir, 'public');
    if (found) repoRoot = path.dirname(found);
  }
  const publicDir = pub || path.join(repoRoot, 'public');
  const srcOptionsDir = src || path.join(repoRoot, 'src', 'data', 'options');
  return { optionsDir, repoRoot, publicDir, srcOptionsDir };
}

export const isRemote = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);

export function imageToDisk(imagePath, publicDir) {
  if (!imagePath || isRemote(imagePath)) return undefined;
  return path.join(publicDir, imagePath.replace(/^\//, ''));
}

export function localExists(imagePath, publicDir) {
  const disk = imageToDisk(imagePath, publicDir);
  return Boolean(disk && fs.existsSync(disk));
}

// A path under /images/generated/ is OUR OWN prior output, never a tech pack.
// Generating from one is a copy-of-a-copy that drifts from the manufacturing
// drawing, so it can never serve as the geometry reference.
export const isGeneratedOutput = (s) =>
  typeof s === 'string' && /(^|\/)images\/generated\//i.test(s);

// Paths that can NEVER serve as a geometry reference. Three distinct classes,
// each of which has already produced a false approval in this project:
//
//   1. /images/generated/  our own prior renders — copy-of-a-copy drift.
//   2. /images/ai/         AI-generated PHOTOGRAPHS, not manufacturing drawings.
//                          This is the "AI-based verification" revoked in commit
//                          0d2d49e. Two candidates scored 98+ in all nine QC
//                          categories against one of these before the reference
//                          itself was checked.
//   3. *.svg               brand UI glyphs authored as placeholders (80x100
//                          viewBox, navy ground, gold stroke). They encode no
//                          gorge angle, spread, or dimension of any kind — one
//                          glyph backed all ten peak-lapel options from 101-115
//                          degrees, which is why those ten still collide.
//
// The whole QC gate scores fidelity TO THE REFERENCE, so a wrong reference is
// invisible to it: the more faithful the render, the HIGHER it scores. That
// makes "no blueprint" strictly safer than "a plausible wrong blueprint" —
// returning null routes the option to needs-source, which is the correct
// terminal state rather than a failure.
export const isNotABlueprint = (s) =>
  typeof s !== 'string' ||
  !s ||
  isGeneratedOutput(s) ||
  /(^|\/)images\/ai\//i.test(s) ||
  /\.svg(\?|#|$)/i.test(s);

// Resolve which path is the authoritative BLUEPRINT for an option.
//
// garment-image-qc's write-back sets `image` to the approved photo and preserves
// the original drawing under `techpackIllustration`. Reading `image` back as the
// blueprint would therefore re-generate from the previous generation — so the
// preserved tech pack always wins. If a tech pack is recorded but missing from
// disk, we deliberately report NO blueprint rather than silently falling back to
// the generated photo: that routes the option to needs-source, which is correct.
export function resolveBlueprint(opt) {
  const tp = opt && opt.techpackIllustration;
  if (!isNotABlueprint(tp)) return tp;
  const img = opt && opt.image;
  if (isNotABlueprint(img)) return null; // not a drawing — route to needs-source
  return img;
}

// Parse a single-export TS design file (e.g. trousers.ts, vest.ts) into the
// same object a *.json export would give. We can't assume a transpiler is
// installed in the target repo, so we do a narrow, dependency-free TS-strip:
// drop `import` lines, the `export` keyword, the const type annotation, and the
// one typed arrow-param form these files use — while PRESERVING any top-level
// helper (e.g. `const CDN = (ecode) => \`…${ecode}…\``) and template literals,
// which vest.ts relies on for its image URLs. Then evaluate and return the
// `…Design` const. Used only for products with no JSON export.
function readTsDesign(tsPath) {
  const src = fs.readFileSync(tsPath, 'utf8');
  const nameMatch =
    src.match(/const\s+(\w+)\s*:\s*ProductDesignConfig\s*=/) || src.match(/const\s+(\w+Design)\b/);
  const name = nameMatch && nameMatch[1];
  if (!name) throw new Error('No design const found in ' + tsPath);

  const body = src
    .replace(/^[ \t]*import\b[^\n]*$/gm, '') // drop type/value imports
    .replace(/^([ \t]*)export\s+/gm, '$1') // drop the export keyword
    .replace(/\bconst\s+(\w+)\s*:\s*[^=]+=/g, 'const $1 =') // strip const type annotations
    .replace(/\(\s*(\w+)\s*:\s*[A-Za-z0-9_\[\]<>.]+\s*\)\s*=>/g, '($1) =>'); // typed arrow params

  // eslint-disable-next-line no-new-func
  const design = Function('"use strict";\n' + body + '\n;return ' + name + ';')();
  if (!design || !Array.isArray(design.sections)) {
    throw new Error('TS design file did not evaluate to a design object: ' + tsPath);
  }
  return design;
}

// Files in src/data/options that are NOT single-product designs we can eval.
const TS_SKIP = new Set(['index', 'types', 'suit']); // suit.ts exports two consts

// Discover the source file + loader for one product. JSON wins when present.
export function productSource({ optionsDir, srcOptionsDir }, productId) {
  const json = path.join(optionsDir, productId + '.json');
  if (fs.existsSync(json)) return { productId, file: json, source: 'json' };
  const ts = path.join(srcOptionsDir || '', productId + '.ts');
  if (srcOptionsDir && !TS_SKIP.has(productId) && fs.existsSync(ts)) {
    return { productId, file: ts, source: 'ts' };
  }
  return undefined;
}

// The full product list available across both sources (JSON ∪ single-export TS).
export function listProducts({ optionsDir, srcOptionsDir }) {
  const out = new Map();
  if (fs.existsSync(optionsDir)) {
    for (const f of fs.readdirSync(optionsDir)) {
      if (f.endsWith('.json')) out.set(f.replace(/\.json$/, ''), 'json');
    }
  }
  if (srcOptionsDir && fs.existsSync(srcOptionsDir)) {
    for (const f of fs.readdirSync(srcOptionsDir)) {
      if (!f.endsWith('.ts')) continue;
      const stem = f.replace(/\.ts$/, '');
      if (TS_SKIP.has(stem) || out.has(stem)) continue;
      out.set(stem, 'ts');
    }
  }
  return [...out.keys()].sort();
}

function loadDesign(src) {
  return src.source === 'ts' ? readTsDesign(src.file) : JSON.parse(fs.readFileSync(src.file, 'utf8'));
}

// Iterate every option, yielding a flat record with full address + source file.
export function* iterateOptions(cat, { product } = {}) {
  const products = product ? [product] : listProducts(cat);
  for (const productId of products) {
    const src = productSource(cat, productId);
    if (!src) continue;
    let data;
    try {
      data = loadDesign(src);
    } catch (e) {
      console.error(`WARN: could not load ${productId}: ${e.message}`);
      continue;
    }
    for (const section of data.sections || []) {
      for (const field of section.fields || []) {
        for (const opt of field.options || []) {
          yield {
            productId,
            sourceFile: src.file,
            source: src.source,
            sectionId: section.id,
            sectionLabel: section.label,
            fieldId: field.id,
            fieldLabel: field.label,
            optionId: opt.id,
            label: opt.label,
            description: opt.description || '',
            hint: field.hint || '',
            // `image` here means THE BLUEPRINT, not whatever the site currently
            // renders — see resolveBlueprint(). `liveImage` keeps the catalog's
            // current value so write-back/reporting can still see it.
            image: resolveBlueprint(opt),
            imageDisk: imageToDisk(resolveBlueprint(opt), cat.publicDir),
            imageExists: localExists(resolveBlueprint(opt), cat.publicDir),
            liveImage: opt.image || null,
            techpackIllustration: opt.techpackIllustration || null,
            addr: `${productId} > ${section.id} > ${field.id} > ${opt.id}`,
            raw: opt,
          };
        }
      }
    }
  }
}
