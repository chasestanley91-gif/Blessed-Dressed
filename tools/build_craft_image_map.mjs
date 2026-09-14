#!/usr/bin/env node
/**
 * build_craft_image_map.mjs — one row per craft: drawing + every photo we can
 * prove exists, with owner verdicts. Writes NO catalog data.
 *
 *   node tools/build_craft_image_map.mjs
 *
 * Output:
 *   data-store/craft-image-map.json
 *   reports/craft-image-map-flags.csv
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';


const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const PIPE = path.join(REPO, '.craft-pipeline');
const PUBLIC = path.join(REPO, 'public');
const LEDGER = path.join(REPO, 'data-store/image-decision-ledger.json');
const MAP_OUT = path.join(REPO, 'data-store/craft-image-map.json');
const CSV_OUT = path.join(REPO, 'reports/craft-image-map-flags.csv');

const PHOTO_DIR = /^\/images\/(generated|ai|real|review|review-refs)\//i;
const GLYPH = /\.svg(\?|#|$)/i;
const IMG_EXT = /\.(webp|png|jpg|jpeg|avif|jfif)$/i;
const REJECT = new Set(['rejected', 'reject-file', 'remake', 'discard']);
const APPROVE = new Set(['approved', 'keep-file']);

const GENERATED_DIRS = {
  shirt: ['shirt'],
  trousers: ['trousers'],
  vest: ['vest'],
  'sport-coat': ['sport-coat', 'jacket'],
  'suit-2pc': ['suit-2pc', 'jacket'],
  'suit-3pc': ['suit-3pc', 'jacket'],
};

const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const sha1Of = (p) => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
const hashCache = new Map();
function hashFile(abs) {
  if (hashCache.has(abs)) return hashCache.get(abs);
  let h = null;
  try { if (fs.existsSync(abs) && fs.statSync(abs).isFile()) h = sha1Of(abs); } catch { /* */ }
  hashCache.set(abs, h);
  return h;
}
function toAbs(served) {
  if (!served) return null;
  if (served.startsWith('http://') || served.startsWith('https://')) return null;
  const p = served.replace(/\\/g, '/');
  if (p.startsWith('/images/')) return path.join(PUBLIC, p.replace(/^\//, '').split('?')[0]);
  if (p.startsWith('images/')) return path.join(PUBLIC, p.split('?')[0]);
  if (p.startsWith('.craft-pipeline/') || p.startsWith('public/')) return path.join(REPO, p.split('?')[0]);
  if (p.startsWith('/')) return path.join(PUBLIC, p.replace(/^\//, '').split('?')[0]);
  return path.join(REPO, p.split('?')[0]);
}
function servedOf(abs) {
  const n = abs.replace(/\\/g, '/');
  const pub = PUBLIC.replace(/\\/g, '/');
  const repo = REPO.replace(/\\/g, '/');
  if (n.toLowerCase().startsWith(pub.toLowerCase())) {
    let rel = n.slice(pub.length).replace(/\\/g, '/');
    if (!rel.startsWith('/')) rel = '/' + rel;
    return rel;
  }
  if (n.startsWith(repo)) return n.slice(repo.length + 1);
  return n;
}
function isRemote(p) { return typeof p === 'string' && /^https?:\/\//i.test(p); }
function isLocalImage(p) { return typeof p === 'string' && p.startsWith('/') && IMG_EXT.test(p.split('?')[0]); }
function isDrawingPath(p) {
  if (!p || isRemote(p) || GLYPH.test(p) || PHOTO_DIR.test(p)) return false;
  if (p.startsWith('/images/factory/')) return false;
  return isLocalImage(p) || (typeof p === 'string' && p.startsWith('/images/'));
}
function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  try { return fs.readdirSync(dir).map((f) => path.join(dir, f)).filter((f) => fs.statSync(f).isFile()); }
  catch { return []; }
}

const ledger = readJson(LEDGER, null);
if (!ledger?.crafts) {
  console.error('no ledger — run: node tools/build_decision_ledger.mjs --write');
  process.exit(1);
}

console.error('repo', REPO);

function localExcluded(opt) {
  const t = `${opt.fieldId} ${opt.fieldLabel || ''} ${opt.label} ${opt.description || ''}`.replace(/[-_]/g, ' ').toLowerCase();
  if (/\bthread\b/.test(t) && /colou?r/.test(t)) return 'thread-color';
  if (/\bbutton\b/.test(t) && /colou?r|catalogue|catalog|sewing style/.test(t)) return 'button';
  if (/\bfabric\b/.test(t) && /swatch|book|lining fabric|cloth/.test(t)) return 'fabric';
  if (/^btn[-_ ]|^thread[-_ ]|^fabric[-_ ]/.test(String(opt.fieldId).toLowerCase())) return 'swatch';
  return null;
}

const auditVerdict = new Map();
try {
  const audit = readJson(path.join(PUBLIC, 'images/reports/subject-audit-consolidated.json'), {});
  for (const r of audit.results ?? []) auditVerdict.set(r.bp, r.v);
} catch { /* */ }

const unresolvedKeys = new Set((ledger.unresolved ?? []).map((u) => u.key));

function indexByBasename(dir, pred) {
  const map = new Map();
  if (!fs.existsSync(dir)) return map;
  let entries = [];
  try { entries = fs.readdirSync(dir); } catch { return map; }
  for (const name of entries) {
    const abs = path.join(dir, name);
    try { if (!fs.statSync(abs).isFile()) continue; } catch { continue; }
    if (pred && !pred(name)) continue;
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(abs);
  }
  return map;
}

const generatedIndex = new Map(); // productDir -> basename-without-ext -> [abs]
for (const dirName of new Set(Object.values(GENERATED_DIRS).flat())) {
  const gdir = path.join(PUBLIC, 'images', 'generated', dirName);
  const idx = new Map();
  if (fs.existsSync(gdir)) {
    for (const name of fs.readdirSync(gdir)) {
      const abs = path.join(gdir, name);
      try { if (!fs.statSync(abs).isFile()) continue; } catch { continue; }
      const base = name.replace(/\.(webp|png|jpg|jpeg|avif)$/i, '');
      if (!idx.has(base)) idx.set(base, []);
      idx.get(base).push(abs);
    }
  }
  generatedIndex.set(dirName, idx);
}

const reviewByPrefix = new Map();
{
  const reviewDir = path.join(PUBLIC, 'images', 'review');
  if (fs.existsSync(reviewDir)) {
    for (const name of fs.readdirSync(reviewDir)) {
      if (name.includes('__drawing')) continue;
      const abs = path.join(reviewDir, name);
      try { if (!fs.statSync(abs).isFile()) continue; } catch { continue; }
      const prefix = name.split('__a')[0] + '__';
      if (!reviewByPrefix.has(prefix)) reviewByPrefix.set(prefix, []);
      reviewByPrefix.get(prefix).push(abs);
    }
  }
}

const pipelineCandidates = new Map();
if (fs.existsSync(PIPE)) {
  for (const product of fs.readdirSync(PIPE)) {
    const pdir = path.join(PIPE, product);
    try { if (!fs.statSync(pdir).isDirectory()) continue; } catch { continue; }
    for (const option of fs.readdirSync(pdir)) {
      const dir = path.join(pdir, option);
      try { if (!fs.statSync(dir).isDirectory()) continue; } catch { continue; }
      const files = listFiles(dir).filter((f) => /^candidate-\d+\.(png|webp|jpg)$/i.test(path.basename(f)));
      if (files.length) pipelineCandidates.set(`${product}/${option}`, files);
    }
  }
}

const slotIndex = { real: new Map(), ai: new Map() };
for (const folder of ['real', 'ai']) {
  const d = path.join(PUBLIC, 'images', folder);
  if (!fs.existsSync(d)) continue;
  for (const name of fs.readdirSync(d)) {
    const abs = path.join(d, name);
    try { if (!fs.statSync(abs).isFile()) continue; } catch { continue; }
    const base = name.replace(/\.(webp|png|jpg|jpeg|avif)$/i, '');
    const id = base.split('-')[0] === name ? base : name.replace(/\.(webp|png|jpg|jpeg|avif)$/i, '');
    const key = base;
    if (!slotIndex[folder].has(key)) slotIndex[folder].set(key, []);
    slotIndex[folder].get(key).push(abs);
  }
}

const rows = [];
for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  const cfg = readJson(path.join(OPTIONS_DIR, file), {});
  for (const s of cfg.sections ?? []) {
    for (const fl of s.fields ?? []) {
      for (const o of fl.options ?? []) {
        rows.push({
          product,
          sectionId: s.id,
          sectionLabel: s.label,
          fieldId: fl.id,
          fieldLabel: fl.label,
          optionId: o.id,
          label: o.label ?? o.id,
          description: o.description ?? '',
          option: o,
        });
      }
    }
  }
}

const drawingUsers = new Map();
const crafts = [];

for (const row of rows) {
  const craftId = `${row.product}|${row.sectionId}|${row.fieldId}|${row.optionId}`;
  const lc = ledger.crafts[craftId] ?? null;
  const optLike = {
    productId: row.product,
    sectionId: row.sectionId,
    fieldId: row.fieldId,
    optionId: row.optionId,
    fieldLabel: row.fieldLabel,
    label: row.label,
    description: row.description,
    image: row.option.image,
    imageExists: false,
  };
  const excluded = localExcluded(optLike);

  const flags = [];
  const cur = row.option;
  const ledgerDraw = lc?.illustration ?? null;
  let drawPath = ledgerDraw?.path ?? cur.illustration ?? cur.techpackIllustration ?? null;
  const reviewDrawing = path.join(PUBLIC, 'images', 'review', `${row.product}__${row.optionId}__drawing.webp`);
  if ((!drawPath || !toAbs(drawPath) || !fs.existsSync(toAbs(drawPath))) && fs.existsSync(reviewDrawing)) {
    drawPath = servedOf(reviewDrawing);
  }
  if (drawPath && isRemote(drawPath)) { flags.push('DRAWING_IS_REMOTE'); drawPath = null; }
  if (drawPath && PHOTO_DIR.test(drawPath)) { flags.push('DRAWING_IS_PHOTO'); drawPath = null; }
  if (drawPath && drawPath.startsWith('/images/factory/')) { flags.push('DRAWING_FACTORY_PATH'); drawPath = null; }
  if (drawPath && drawPath.startsWith('/images/jacket/') && auditVerdict.get(drawPath) !== 'MATCH') {
    flags.push('DRAWING_UNTRUSTED_JACKET');
    drawPath = null;
  }
  const drawAbs = drawPath ? toAbs(drawPath) : null;
  const drawExists = !!(drawAbs && fs.existsSync(drawAbs));
  let drawStatus = 'missing';
  if (drawPath && !drawExists) { flags.push('DRAWING_FILE_MISSING'); drawStatus = 'missing'; }
  else if (!drawPath) { flags.push('NO_DRAWING'); drawStatus = 'missing'; }
  else if (ledgerDraw?.status === 'suspect-mismatch' || ledgerDraw?.status === 'suspect-ambiguous') {
    flags.push('DRAWING_SUSPECT');
    drawStatus = ledgerDraw.status;
  } else if (ledgerDraw?.status === 'verified-match') drawStatus = 'verified-match';
  else { drawStatus = 'drawing-unverified'; flags.push('DRAWING_UNCONFIRMED'); }

  if (drawPath && drawExists) {
    const k = `${row.product}|${row.sectionId}|${row.fieldId}|${drawPath}`;
    drawingUsers.set(k, (drawingUsers.get(k) ?? []).concat(craftId));
  }

  const photoBySha = new Map();
  function addPhoto(abs, source) {
    if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) return;
    if (!IMG_EXT.test(abs)) return;
    const sha = hashFile(abs);
    if (!sha) return;
    const rec = photoBySha.get(sha) ?? { sha1: sha, paths: [], sources: new Set(), verdict: 'unreviewed' };
    rec.paths.push(servedOf(abs));
    rec.sources.add(source);
    photoBySha.set(sha, rec);
  }

  const localSlots = [cur.image, cur.realImage, cur.aiImage, ...(cur.photos ?? []), ...(cur.images ?? [])];
  const externals = [];
  for (const p of localSlots) {
    if (!p) continue;
    if (isRemote(p)) { externals.push(p); continue; }
    const abs = toAbs(p);
    if (abs) addPhoto(abs, 'catalog');
  }

  for (const dirName of GENERATED_DIRS[row.product] ?? [row.product]) {
    const idx = generatedIndex.get(dirName);
    if (!idx) continue;
    for (const [base, files] of idx) {
      if (base === row.optionId || base.startsWith(row.optionId + '-')) {
        for (const f of files) addPhoto(f, 'generated');
      }
    }
  }

  const rprefix = `${row.product}__${row.optionId}__`;
  for (const f of reviewByPrefix.get(rprefix) ?? []) addPhoto(f, 'review');

  for (const f of pipelineCandidates.get(`${row.product}/${row.optionId}`) ?? []) addPhoto(f, 'pipeline');

  for (const folder of ['real', 'ai']) {
    for (const [base, files] of slotIndex[folder]) {
      if (base === row.optionId || base.startsWith(row.optionId + '-')) {
        for (const f of files) addPhoto(f, folder);
      }
    }
  }

  const events = (lc?.events ?? []).filter((e) => !e.machine);
  function verdictFor(sha, paths) {
    let latest = null;
    for (const e of events) {
      const img = e.image;
      if (!img) continue;
      const hit = (img.sha1 && img.sha1 === sha)
        || (img.path && paths.some((p) => p.replace(/\\/g, '/') === String(img.path).replace(/\\/g, '/')));
      if (!hit) continue;
      latest = e;
    }
    if (!latest) return 'unreviewed';
    if (REJECT.has(latest.verdict)) return 'rejected';
    if (APPROVE.has(latest.verdict)) return 'approved';
    return 'unreviewed';
  }

  const photos = [];
  for (const rec of photoBySha.values()) {
    const paths = [...new Set(rec.paths)];
    const verdict = verdictFor(rec.sha1, paths);
    rec.verdict = verdict;
    photos.push({
      sha1: rec.sha1,
      path: paths[0],
      aliases: paths.slice(1),
      sources: [...rec.sources],
      verdict,
      preTicked: verdict === 'approved',
    });
  }
  photos.sort((a, b) => Number(b.preTicked) - Number(a.preTicked) || a.path.localeCompare(b.path));

  const refDir = path.join(PUBLIC, 'images', 'review-refs', row.product, row.optionId);
  const references = listFiles(refDir).filter((f) => IMG_EXT.test(f)).map((f) => ({
    path: servedOf(f),
    bytes: fs.statSync(f).size,
  }));

  const po = `${row.product}/${row.optionId}`;
  if (unresolvedKeys.has(po)) flags.push('UNPLACEABLE_DECISION');
  if (externals.length) flags.push('EXTERNAL_WEB_PHOTO');
  if (!excluded && photos.filter((p) => p.verdict !== 'rejected').length === 0) flags.push('NO_USABLE_PHOTO');
  if (references.length && photos.every((p) => p.verdict !== 'approved')) flags.push('HAS_OWNER_REFS');

  crafts.push({
    craftId,
    product: row.product,
    sectionId: row.sectionId,
    sectionLabel: row.sectionLabel,
    fieldId: row.fieldId,
    fieldLabel: row.fieldLabel,
    optionId: row.optionId,
    label: row.label,
    inScope: !excluded,
    excluded,
    drawing: { path: drawExists ? drawPath : null, status: drawStatus, exists: drawExists },
    photos,
    references,
    external: externals,
    flags,
  });
}

for (const [, ids] of drawingUsers) {
  if (ids.length < 2) continue;
  for (const id of ids) {
    const c = crafts.find((x) => x.craftId === id);
    if (c && !c.flags.includes('SHARED_DRAWING')) c.flags.push('SHARED_DRAWING');
  }
}

const byProduct = {};
const totals = {
  crafts: crafts.length,
  inScope: 0,
  excluded: 0,
  drawingOk: 0,
  drawingMissing: 0,
  drawingFlagged: 0,
  photosApproved: 0,
  photosUnreviewed: 0,
  photosRejected: 0,
  craftsNoUsablePhoto: 0,
  craftsWithRefs: 0,
  craftsWithExternal: 0,
};
for (const c of crafts) {
  const p = byProduct[c.product] ?? (byProduct[c.product] = {
    crafts: 0, inScope: 0, drawingOk: 0, drawingMissing: 0, drawingFlagged: 0,
    approved: 0, unreviewed: 0, rejected: 0, noUsablePhoto: 0, refs: 0, external: 0,
  });
  p.crafts += 1;
  totals.crafts += 0;
  if (!c.inScope) { totals.excluded += 1; continue; }
  totals.inScope += 1;
  p.inScope += 1;
  if (c.drawing.exists && !c.flags.includes('DRAWING_SUSPECT') && !c.flags.includes('DRAWING_UNTRUSTED_JACKET')) {
    totals.drawingOk += 1; p.drawingOk += 1;
  } else if (!c.drawing.exists) { totals.drawingMissing += 1; p.drawingMissing += 1; }
  else { totals.drawingFlagged += 1; p.drawingFlagged += 1; }
  const ap = c.photos.filter((x) => x.verdict === 'approved').length;
  const un = c.photos.filter((x) => x.verdict === 'unreviewed').length;
  const rj = c.photos.filter((x) => x.verdict === 'rejected').length;
  if (ap) { totals.photosApproved += 1; p.approved += 1; }
  if (un) { totals.photosUnreviewed += 1; p.unreviewed += 1; }
  if (rj) { totals.photosRejected += 1; p.rejected += 1; }
  if (c.flags.includes('NO_USABLE_PHOTO')) { totals.craftsNoUsablePhoto += 1; p.noUsablePhoto += 1; }
  if (c.references.length) { totals.craftsWithRefs += 1; p.refs += 1; }
  if (c.external.length) { totals.craftsWithExternal += 1; p.external += 1; }
}

const map = {
  builtAt: new Date().toISOString(),
  builder: 'tools/build_craft_image_map.mjs',
  note: 'Read-only map. Does not rewrite the catalog. Key is product|section|field|option.',
  unresolved: ledger.unresolved ?? [],
  totals,
  byProduct,
  crafts,
};

fs.mkdirSync(path.dirname(CSV_OUT), { recursive: true });
fs.writeFileSync(MAP_OUT, JSON.stringify(map, null, 1) + '\n', 'utf8');

const csvEsc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csvLines = [['craftId', 'product', 'label', 'inScope', 'drawing', 'drawingStatus', 'flags', 'approved', 'unreviewed', 'rejected', 'refs', 'externals'].join(',')];
for (const c of crafts) {
  csvLines.push([
    csvEsc(c.craftId), csvEsc(c.product), csvEsc(c.label), c.inScope ? 'yes' : 'no',
    csvEsc(c.drawing.path), csvEsc(c.drawing.status), csvEsc(c.flags.join('|')),
    c.photos.filter((p) => p.verdict === 'approved').length,
    c.photos.filter((p) => p.verdict === 'unreviewed').length,
    c.photos.filter((p) => p.verdict === 'rejected').length,
    c.references.length,
    c.external.length,
  ].join(','));
}
try {
  fs.writeFileSync(CSV_OUT, csvLines.join('\n') + '\n', 'utf8');
} catch (err) {
  const alt = CSV_OUT.replace(/\.csv$/, `-${Date.now()}.csv`);
  fs.writeFileSync(alt, csvLines.join('\n') + '\n', 'utf8');
  console.warn('csv locked, wrote', alt, err.message);
}

console.log(`crafts ${totals.crafts}  in-scope ${totals.inScope}  excluded ${totals.excluded}`);
console.log(`drawings  ok ${totals.drawingOk}  missing ${totals.drawingMissing}  flagged ${totals.drawingFlagged}`);
console.log(`crafts with photos  approved ${totals.photosApproved}  unreviewed ${totals.photosUnreviewed}  rejected ${totals.photosRejected}`);
console.log(`no usable photo ${totals.craftsNoUsablePhoto}  has refs ${totals.craftsWithRefs}  has external URLs ${totals.craftsWithExternal}`);
console.log('\nper garment (in-scope):');
for (const [g, p] of Object.entries(byProduct)) {
  console.log(`  ${g.padEnd(12)} in-scope ${String(p.inScope).padStart(4)}  draw-ok ${p.drawingOk}  draw-miss ${p.drawingMissing}  approved ${p.approved}  unreviewed ${p.unreviewed}  no-photo ${p.noUsablePhoto}  external ${p.external}`);
}
console.log(`\nmap -> ${path.relative(REPO, MAP_OUT)}`);
console.log(`csv -> ${path.relative(REPO, CSV_OUT)}`);
