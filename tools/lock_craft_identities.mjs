#!/usr/bin/env node
/**
 * lock_craft_identities.mjs
 *
 * Permanent identity lock: one catalog craft ↔ one location-tied name ↔ one
 * supplier illustration. Matching by a bare option id (stitch-06-top) is how
 * collar photos landed on cuffs. This file is the fix.
 *
 *   node tools/lock_craft_identities.mjs                 # diagnose only
 *   node tools/lock_craft_identities.mjs --apply-reviews
 *   node tools/lock_craft_identities.mjs --rename
 *   node tools/lock_craft_identities.mjs --lock
 *   node tools/lock_craft_identities.mjs --all
 *
 * Never deletes an option, illustration, or lock row. Renames colliding ids
 * in place and keeps formerIds so old keys still resolve.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { fieldIsSkipped } from './craft-review-scope.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const SUPPLIER_DIR = path.join(REPO, 'data-store', 'supplier');
const PUBLIC = path.join(REPO, 'public');
const STORE = path.join(REPO, 'data-store');
const BXN_SCRAPE = path.join(REPO, 'factory-screenshots', 'baoxiniao');
const OUT_DIR = path.join(PUBLIC, 'images', 'reports', 'craft-lock');
const LOCK_JSON = path.join(OUT_DIR, 'canonical-craft-lock.json');
const LOCK_STORE = path.join(STORE, 'canonical-craft-lock.json');
const DEST_REL = '/images/blueprints/baoxiniao-lock';
const DEST_ABS = path.join(PUBLIC, 'images', 'blueprints', 'baoxiniao-lock');

const APPLY_REVIEWS = process.argv.includes('--apply-reviews') || process.argv.includes('--all');
const RENAME = process.argv.includes('--rename') || process.argv.includes('--all');
const LOCK = process.argv.includes('--lock') || process.argv.includes('--all');
const APPLY = APPLY_REVIEWS || RENAME || LOCK;

const CAT_PART = { BB: 'jacket', BC: 'shirt', BD: 'trousers', BM: 'vest' };
const PRODUCT_PART = {
  shirt: 'shirt', trousers: 'trousers', vest: 'vest',
  'suit-2pc': 'jacket', 'suit-3pc': 'jacket', 'sport-coat': 'jacket',
};
const LOC_WORDS = [
  'collar', 'cuff', 'placket', 'shoulder', 'lapel', 'pocket', 'waistband',
  'hem', 'vent', 'sleeve', 'yoke', 'back', 'front', 'chest', 'ticket', 'coin',
  'fly', 'belt', 'lining', 'buttonhole', 'button', 'trouser', 'vest', 'jacket',
  'canvas', 'pleat', 'dart', 'gusset', 'stay', 'stand', 'tab',
];
const STOP = new Set(['the', 'on', 'of', 'and', 'a', 'an', 'to', 'for', 'with', 'in']);

const readJson = (p, d = null) => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; }
};
const writeJson = (p, data) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 1) + '\n');
};
const sha1File = (abs) => crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex');
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 1 && !STOP.has(w)));
function jaccard(a, b) {
  const A = tokens(a); const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  return inter / new Set([...A, ...B]).size;
}
function toAbs(p) {
  if (!p || typeof p !== 'string') return null;
  const n = p.replace(/\\/g, '/').split('?')[0];
  if (n.startsWith('/images/')) return path.join(PUBLIC, n.slice(1));
  return null;
}

function loadCatalog() {
  const products = [];
  for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
    const product = file.replace(/\.json$/, '');
    const cfg = JSON.parse(fs.readFileSync(path.join(OPTIONS_DIR, file), 'utf8'));
    products.push({ product, file, cfg });
  }
  return products;
}

function walkOptions(products, fn) {
  for (const p of products) {
    for (const s of p.cfg.sections ?? []) {
      for (const f of s.fields ?? []) {
        for (const o of f.options ?? []) {
          fn({
            product: p.product, cfg: p.cfg, section: s, field: f, option: o,
            craftId: `${p.product}|${s.id}|${f.id}|${o.id}`,
          });
        }
      }
    }
  }
}

function locationPrefix(fieldId, fieldLabel, sectionId) {
  const t = `${fieldId} ${fieldLabel} ${sectionId}`.toLowerCase().replace(/[_-]/g, ' ');
  for (const loc of LOC_WORDS) {
    if (new RegExp(`\\b${loc}\\b`).test(t)) return loc;
  }
  const bits = String(fieldId || '').toLowerCase().split(/[_-]+/).filter((x) => x && !STOP.has(x));
  return bits.slice(0, 2).join('-') || 'craft';
}

function uniqueName(prefix, optionId) {
  if (optionId.startsWith(`${prefix}-`)) return optionId;
  if (optionId.startsWith('shl-') && prefix === 'shoulder') return optionId;
  return `${prefix}-${optionId}`;
}

function findCollisions(products) {
  const byProductId = new Map();
  walkOptions(products, (row) => {
    if (fieldIsSkipped(row.field.id, row.field.label || '', row.option.label || '')) return;
    const key = `${row.product}::${row.option.id}`;
    if (!byProductId.has(key)) byProductId.set(key, []);
    byProductId.get(key).push(row);
  });
  const collisions = [];
  for (const [key, rows] of byProductId) {
    const fields = new Set(rows.map((r) => r.field.id));
    if (fields.size < 2) continue;
    collisions.push({
      product: rows[0].product,
      optionId: rows[0].option.id,
      fields: [...fields].map((fid) => {
        const r = rows.find((x) => x.field.id === fid);
        return {
          craftId: r.craftId,
          fieldId: fid,
          fieldLabel: r.field.label,
          sectionId: r.section.id,
          prefix: locationPrefix(fid, r.field.label, r.section.id),
          proposedId: uniqueName(locationPrefix(fid, r.field.label, r.section.id), r.option.id),
          label: r.option.label,
        };
      }),
    });
  }
  return collisions.sort((a, b) => b.fields.length - a.fields.length || a.optionId.localeCompare(b.optionId));
}

function loadBxn() {
  const names = readJson(path.join(SUPPLIER_DIR, 'field-names.json'), {});
  const labels = {};
  const images = {};
  for (const [code, part] of Object.entries(CAT_PART)) {
    labels[part] = readJson(path.join(SUPPLIER_DIR, `craft-labels-${code}.json`), { fields: {} }).fields || {};
    const man = readJson(path.join(BXN_SCRAPE, `manifest-${code}.json`), { images: [] });
    images[part] = man.images || [];
    images[code] = man.images || [];
  }
  return { names, labels, images, categories: names.categories || CAT_PART };
}

function supplierFieldsForPart(bxn, part) {
  const cat = Object.entries(CAT_PART).find(([, p]) => p === part)?.[0];
  const named = cat ? (bxn.names?.byCategory?.[cat]?.fields || {}) : {};
  const values = bxn.labels[part] || {};
  const out = [];
  const codes = new Set([...Object.keys(named), ...Object.keys(values)]);
  for (const code of codes) {
    out.push({
      code,
      name: named[code]?.name || values[code]?.fieldLabel || code,
      group: named[code]?.group || '',
      values: values[code]?.values || [],
    });
  }
  return out;
}

function parseBxnFromPath(p) {
  if (!p || typeof p !== 'string') return null;
  const m = String(p).replace(/\\/g, '/').match(
    /\/blueprints\/baoxiniao\/(?:(?:shirt|jacket|trousers|vest)\/)?([A-Z][A-Z0-9]+)\/([^/]+)\.(?:jpg|jpeg|png|webp)$/i,
  );
  if (!m) return null;
  return { field: m[1].toUpperCase(), value: m[2].replace(/\.[^.]+$/, '') };
}

function matchFieldToBxn(catalogField, supplierFields) {
  const want = `${catalogField.label || ''} ${String(catalogField.id || '').replace(/[_-]/g, ' ')}`;
  let best = null;
  let bestScore = 0;
  let second = 0;
  for (const sf of supplierFields) {
    const score = Math.max(jaccard(want, sf.name), jaccard(catalogField.label || '', sf.name));
    if (score > bestScore) { second = bestScore; bestScore = score; best = sf; }
    else if (score > second) second = score;
  }
  if (best && bestScore >= 0.5 && (bestScore - second >= 0.08 || second < 0.5)) {
    return { ...best, score: +bestScore.toFixed(3), how: 'field-name' };
  }
  const optionLabels = (catalogField.options || []).map((o) => o.label).filter(Boolean);
  if (optionLabels.length >= 2) {
    const votes = new Map();
    for (const label of optionLabels) {
      const wantExact = norm(label);
      const wantNum = wantExact.replace(/(\d)\s*(cm|centimet(?:er|re)s?)/g, '$1cm');
      for (const sf of supplierFields) {
        const hit = (sf.values || []).some((v) => {
          const got = norm(v.label);
          const gotNum = got.replace(/(\d)\s*(cm|centimet(?:er|re)s?)/g, '$1cm');
          return got === wantExact || gotNum === wantNum;
        });
        if (hit) votes.set(sf.code, (votes.get(sf.code) || 0) + 1);
      }
    }
    if (votes.size) {
      const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
      const [code, count] = ranked[0];
      const total = [...votes.values()].reduce((a, b) => a + b, 0);
      if (count >= 2 && count / total >= 0.5) {
        const sf = supplierFields.find((x) => x.code === code);
        if (sf) return { ...sf, score: +(count / optionLabels.length).toFixed(3), how: 'voted' };
      }
    }
  }
  return null;
}

function matchValue(option, supplierField) {
  const want = norm(option.label);
  const wantNum = want.replace(/(\d)\s*(cm|centimet(?:er|re)s?)/g, '$1cm').replace(/(\d)\s*(deg|degrees?)/g, '$1deg');
  for (const v of supplierField.values || []) {
    const got = norm(v.label);
    const gotNum = got.replace(/(\d)\s*(cm|centimet(?:er|re)s?)/g, '$1cm');
    if (got === want || gotNum === wantNum) return { ...v, how: 'label' };
  }
  return null;
}

function bxnLocalPath(part, field, value) {
  const cat = Object.entries(CAT_PART).find(([, p]) => p === part)?.[0];
  if (!cat) return null;
  const rel = path.join(cat, field, `${value}.jpg`);
  const abs = path.join(BXN_SCRAPE, rel);
  if (fs.existsSync(abs)) return { abs, rel: rel.replace(/\\/g, '/'), cat };
  const altExt = ['.jpeg', '.png', '.JPG'];
  for (const ext of altExt) {
    const p = path.join(BXN_SCRAPE, cat, field, `${value}${ext}`);
    if (fs.existsSync(p)) return { abs: p, rel: `${cat}/${field}/${value}${ext}`, cat };
  }
  return null;
}

function copyLockImage(srcAbs, cat, field, value) {
  const destDir = path.join(DEST_ABS, cat, field);
  const dest = path.join(destDir, `${value}${path.extname(srcAbs) || '.jpg'}`);
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(srcAbs, dest);
  }
  return `${DEST_REL}/${cat}/${field}/${path.basename(dest)}`;
}

function addrToCraftId(addr) {
  if (!addr || !addr.includes('>')) return '';
  return addr.split('>').map((p) => p.trim()).join('|');
}

function applyReviews(products) {
  const completed = new Set(readJson(path.join(STORE, 'image-review-completed.json'), { craftIds: [] }).craftIds || []);
  const overlays = readJson(path.join(STORE, 'image-review-overlays.json'), {}) || {};
  const log = readJson(path.join(STORE, 'image-review-decisions-log.json'), []) || [];
  const stats = { crafts: 0, photosCleared: 0, photosAdded: 0, drawingsSet: 0 };
  const hashCache = new Map();
  const hashOf = (p) => {
    const abs = toAbs(p);
    if (!abs || !fs.existsSync(abs)) return null;
    if (hashCache.has(abs)) return hashCache.get(abs);
    const h = sha1File(abs);
    hashCache.set(abs, h);
    return h;
  };

  walkOptions(products, (row) => {
    const over = overlays[row.craftId];
    const done = completed.has(row.craftId);
    if (!over && !done) return;
    stats.crafts += 1;
    const removed = new Set(over?.removedSha1 || []);
    let photos = [...(row.option.photos || [])];
    const before = photos.length;
    photos = photos.filter((p) => {
      const h = hashOf(p);
      return !h || !removed.has(h);
    });
    if (photos.length < before) stats.photosCleared += before - photos.length;

    for (const p of over?.photos || []) {
      if (!p || p.verdict === 'rejected') continue;
      if (p.sha1 && removed.has(p.sha1)) continue;
      const pathStr = typeof p.path === 'string' && p.path.startsWith('/images/') ? p.path : null;
      if (!pathStr) continue;
      if (!photos.includes(pathStr)) { photos.push(pathStr); stats.photosAdded += 1; }
    }

    for (const e of log) {
      if (e.event !== 'decision' || e.verdict !== 'approved') continue;
      if (addrToCraftId(e.addr) !== row.craftId) continue;
      const ip = e.imagePath;
      if (typeof ip === 'string' && ip.startsWith('/images/') && !photos.includes(ip)) {
        if (e.imageSha1 && removed.has(e.imageSha1)) continue;
        photos.push(ip);
        stats.photosAdded += 1;
      }
    }

    row.option.photos = photos;

    if (over?.drawing?.path && over.drawing.path.startsWith('/images/')) {
      row.option.illustration = over.drawing.path;
      row.option.techpackIllustration = over.drawing.path;
      row.option.illustrationStatus = 'drawing';
      stats.drawingsSet += 1;
    }
  });
  return stats;
}

function buildRemap(collisions, products) {
  const existing = new Set();
  walkOptions(products, (row) => existing.add(`${row.product}::${row.option.id}`));
  const claimed = new Set();
  const remap = [];
  for (const col of collisions) {
    for (const f of col.fields) {
      let next = f.proposedId;
      const keyOf = (id) => `${col.product}::${id}`;
      if (existing.has(keyOf(next)) && next !== col.optionId) {
        next = `${f.prefix}-${slug(f.fieldId)}-${col.optionId}`;
      }
      let n = 2;
      while ((existing.has(keyOf(next)) && next !== col.optionId) || claimed.has(keyOf(next))) {
        next = `${f.prefix}-${col.optionId}-${n}`;
        n += 1;
        if (n > 9) break;
      }
      claimed.add(keyOf(next));
      remap.push({
        fromCraftId: f.craftId,
        product: col.product,
        fieldId: f.fieldId,
        fromId: col.optionId,
        toId: next,
        prefix: f.prefix,
        label: f.label,
      });
    }
  }
  return remap;
}

function applyRename(products, remap) {
  const byFrom = new Map(remap.map((r) => [r.fromCraftId, r]));
  const overlayFile = path.join(STORE, 'image-review-overlays.json');
  const completedFile = path.join(STORE, 'image-review-completed.json');
  const overlays = readJson(overlayFile, {}) || {};
  const completed = readJson(completedFile, { craftIds: [] });

  walkOptions(products, (row) => {
    const r = byFrom.get(row.craftId);
    if (!r) {
      row.option.stableId = `${row.field.id}__${row.option.id}`;
      return;
    }
    const oldId = row.option.id;
    row.option.formerIds = [...new Set([...(row.option.formerIds || []), oldId])];
    row.option.id = r.toId;
    row.option.stableId = `${row.field.id}__${r.toId}`;
    if (row.field.defaultValue === oldId) row.field.defaultValue = r.toId;
  });

  const newOverlays = {};
  for (const [k, v] of Object.entries(overlays)) {
    const r = byFrom.get(k);
    newOverlays[r ? `${r.product}|${k.split('|')[1]}|${r.fieldId}|${r.toId}` : k] = v;
  }
  const newCompleted = {
    ...completed,
    craftIds: (completed.craftIds || []).map((id) => {
      const r = byFrom.get(id);
      return r ? `${r.product}|${id.split('|')[1]}|${r.fieldId}|${r.toId}` : id;
    }),
    updatedAt: new Date().toISOString(),
  };

  if (APPLY) {
    writeJson(overlayFile, newOverlays);
    writeJson(completedFile, newCompleted);
  }
  return { overlays: Object.keys(newOverlays).length, completed: newCompleted.craftIds.length };
}

function rewriteShirtTs(remap) {
  const tsPath = path.join(REPO, 'src', 'data', 'options', 'shirt.ts');
  if (!fs.existsSync(tsPath)) return { ok: false, reason: 'missing' };
  let src = fs.readFileSync(tsPath, 'utf8');
  const shirtRemap = remap.filter((r) => r.product === 'shirt');
  const byField = new Map();
  for (const r of shirtRemap) {
    if (!byField.has(r.fieldId)) byField.set(r.fieldId, []);
    byField.get(r.fieldId).push(r);
  }

  const collar = byField.get('decoration_stitching_on_collar') || [];
  if (collar.length) {
    src = src.replace(
      /const stitchingOptions = \[[\s\S]*?\];/,
      (block) => {
        let b = block;
        for (const r of collar) {
          b = b.replaceAll(`id: "${r.fromId}"`, `id: "${r.toId}"`);
        }
        return b;
      },
    );
    src = src.replace(
      /id: "decoration_stitching_on_collar",\s*label: "Collar Decoration Stitching",\s*defaultValue: "[^"]+"/,
      (m) => m.replace(/defaultValue: "[^"]+"/, `defaultValue: "${collar.find((r) => r.fromId === 'stitch-none')?.toId || 'collar-stitch-none'}"`),
    );
  }

  function rewriteFieldBlock(fieldId, rows) {
    if (!rows.length) return;
    const re = new RegExp(`(id: "${fieldId}"[\\s\\S]*?options: \\[)([\\s\\S]*?)(\\n\\s*\\],)`, 'm');
    src = src.replace(re, (all, a, body, c) => {
      let b = body;
      for (const r of rows) {
        b = b.replaceAll(`id: "${r.fromId}"`, `id: "${r.toId}"`);
      }
      const none = rows.find((r) => r.fromId === 'stitch-none');
      let head = a;
      if (none) head = head.replace(/defaultValue: "[^"]+"/, `defaultValue: "${none.toId}"`);
      return head + b + c;
    });
  }
  rewriteFieldBlock('decoration_stitching_on_cuff', byField.get('decoration_stitching_on_cuff') || []);
  rewriteFieldBlock('decoration_stitching_on_placket', byField.get('decoration_stitching_on_placket') || []);

  if (APPLY) fs.writeFileSync(tsPath, src);
  return { ok: true, fields: [...byField.keys()] };
}

function buildLock(products, bxn, remap) {
  const remapByCraft = new Map(remap.map((r) => [r.fromCraftId, r]));
  const crafts = [];
  const scrape = [];
  for (const [part, imgs] of Object.entries(bxn.images)) {
    if (part.length !== 2) continue;
    for (const img of imgs) {
      scrape.push({
        category: img.category || part,
        part: CAT_PART[img.category || part] || img.part,
        field: img.field,
        fieldLabel: img.fieldLabel,
        value: img.value,
        label: img.label,
        localPath: img.localPath,
        url: img.url,
      });
    }
  }

  walkOptions(products, (row) => {
    const part = /^vest/i.test(row.section.id) ? 'vest'
      : /^trouser/i.test(row.section.id) ? 'trousers'
      : (PRODUCT_PART[row.product] || row.product);
    const skipped = fieldIsSkipped(row.field.id, row.field.label || '', row.option.label || '');
    const prefix = locationPrefix(row.field.id, row.field.label, row.section.id);
    const supplierFields = supplierFieldsForPart(bxn, part);
    const fromPath = parseBxnFromPath(row.option.illustration || row.option.techpackIllustration || row.option.image);
    const fieldMatch = skipped ? null : matchFieldToBxn(row.field, supplierFields);
    let valueMatch = fieldMatch ? matchValue(row.option, fieldMatch) : null;
    if (!valueMatch && fromPath) {
      const sf = supplierFields.find((x) => x.code === fromPath.field);
      if (sf) {
        const v = (sf.values || []).find((x) => String(x.code) === String(fromPath.value));
        if (v) valueMatch = { ...v, how: 'illustration-path' };
      }
    }
    const useField = fieldMatch || (fromPath ? supplierFields.find((x) => x.code === fromPath.field) : null);
    let lockPath = null;
    let bxnHit = null;
    if (useField && (valueMatch || fromPath)) {
      const fieldCode = useField.code;
      const valueCode = valueMatch?.code || fromPath?.value;
      const disk = valueCode ? bxnLocalPath(part, fieldCode, valueCode) : null;
      if (disk && LOCK) lockPath = copyLockImage(disk.abs, disk.cat, fieldCode, valueCode);
      else if (disk) lockPath = `${DEST_REL}/${disk.cat}/${fieldCode}/${valueCode}${path.extname(disk.abs) || '.jpg'}`;
      bxnHit = {
        category: Object.entries(CAT_PART).find(([, p]) => p === part)?.[0] || null,
        part,
        field: fieldCode,
        fieldName: useField.name,
        value: valueCode,
        valueLabel: valueMatch?.label || fromPath?.value,
        score: fieldMatch?.score || 1,
        how: valueMatch?.how || fieldMatch?.how || 'illustration-path',
      };
      if (APPLY) {
        row.option.bxn = { field: fieldCode, value: valueCode, desc: `${useField.name} / ${bxnHit.valueLabel}` };
      }
    }
    const former = row.option.formerIds || [];
    const r = remapByCraft.get(`${row.product}|${row.section.id}|${row.field.id}|${former[0] || row.option.id}`);
    crafts.push({
      craftId: `${row.product}|${row.section.id}|${row.field.id}|${row.option.id}`,
      product: row.product,
      sectionId: row.section.id,
      sectionLabel: row.section.label,
      fieldId: row.field.id,
      fieldLabel: row.field.label,
      optionId: row.option.id,
      formerIds: former,
      stableId: row.option.stableId || `${row.field.id}__${row.option.id}`,
      displayName: `${prefix} ${row.option.label}`.trim(),
      location: prefix,
      label: row.option.label,
      skipped,
      illustration: row.option.illustration || row.option.techpackIllustration || null,
      image: row.option.image || null,
      photos: row.option.photos || [],
      bxn: bxnHit,
      lockIllustration: lockPath,
      neverDelete: true,
    });
  });

  return {
    builtAt: new Date().toISOString(),
    builder: 'tools/lock_craft_identities.mjs',
    rule: 'Never match by bare option id. Identity is product|section|field|option. Location is part of the name.',
    totals: {
      crafts: crafts.length,
      mappedToBxn: crafts.filter((c) => c.bxn).length,
      withIllustration: crafts.filter((c) => c.illustration).length,
      scrapeImages: scrape.length,
      renamed: remap.length,
    },
    crafts,
    scrapeInventory: scrape,
  };
}

function writeGraph(lock) {
  const byProduct = {};
  for (const c of lock.crafts) {
    byProduct[c.product] ??= {};
    const fk = `${c.fieldId}::${c.fieldLabel}`;
    byProduct[c.product][fk] ??= { fieldId: c.fieldId, fieldLabel: c.fieldLabel, location: c.location, options: [] };
    byProduct[c.product][fk].options.push({
      id: c.optionId,
      label: c.label,
      displayName: c.displayName,
      craftId: c.craftId,
      bxn: c.bxn ? `${c.bxn.field}/${c.bxn.value}` : null,
      illustration: c.lockIllustration || c.illustration,
      formerIds: c.formerIds,
    });
  }
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<title>Blessed & Dressed — Craft identity lock</title>
<style>
  :root { color-scheme: dark; --bg:#10141a; --card:#1a2129; --ink:#e8ece8; --muted:#93a0ad; --line:#2c3540; --accent:#d4b45a; --ok:#5fbf8c; --bad:#e08a76; }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,sans-serif}
  header{padding:28px 32px 16px;border-bottom:1px solid var(--line)}
  h1{margin:0 0 6px;font-size:28px} .sub{color:var(--muted);max-width:70ch}
  .stats{display:flex;gap:18px;flex-wrap:wrap;margin-top:14px;font-family:ui-monospace,monospace;font-size:12px;color:var(--muted)}
  .stats b{color:var(--ink)}
  input{width:min(640px,100%);margin:16px 32px;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:14px/1.4 inherit}
  main{padding:0 32px 48px}
  details{background:var(--card);border:1px solid var(--line);border-radius:10px;margin:0 0 12px}
  summary{cursor:pointer;padding:12px 16px;font-weight:650}
  .field{margin:0 12px 12px;padding:10px 12px;border-top:1px solid var(--line)}
  .opt{display:grid;grid-template-columns:minmax(180px,1.2fr) minmax(140px,.8fr) minmax(160px,.9fr);gap:8px;padding:6px 0;border-bottom:1px solid #24303a;font-size:13px}
  .opt span{color:var(--muted);font-family:ui-monospace,monospace;font-size:11px}
  .ok{color:var(--ok)} .miss{color:var(--bad)}
  img.th{width:42px;height:42px;object-fit:contain;background:#fff;border-radius:4px}
</style></head><body>
<header>
  <h1>Craft identity lock</h1>
  <p class="sub">Every builder option is tied to one location and one illustration. Collar 0.6 cm top stitching can never match a cuff or placket stitch again.</p>
  <div class="stats">
    <div>Crafts <b>${lock.totals.crafts}</b></div>
    <div>Mapped to mtm.bxn <b>${lock.totals.mappedToBxn}</b></div>
    <div>With illustration <b>${lock.totals.withIllustration}</b></div>
    <div>Scrape images inventoried <b>${lock.totals.scrapeImages}</b></div>
    <div>Renamed colliding ids <b>${lock.totals.renamed}</b></div>
    <div>Built <b>${lock.builtAt}</b></div>
  </div>
</header>
<input id="q" placeholder="Search collar stitch, GCLLI, stitch-06-top, cuff…"/>
<main id="root"></main>
<script>
const DATA = ${JSON.stringify(byProduct)};
const root = document.getElementById('root');
const q = document.getElementById('q');
function render() {
  const s = q.value.trim().toLowerCase();
  root.innerHTML = '';
  for (const [product, fields] of Object.entries(DATA)) {
    const wrap = document.createElement('details');
    wrap.open = !!s;
    const sum = document.createElement('summary');
    sum.textContent = product;
    wrap.appendChild(sum);
    let shown = 0;
    for (const field of Object.values(fields)) {
      const opts = field.options.filter((o) => {
        if (!s) return true;
        return (o.displayName + o.id + o.craftId + (o.bxn||'') + (o.formerIds||[]).join(' ')).toLowerCase().includes(s);
      });
      if (!opts.length) continue;
      shown += opts.length;
      const f = document.createElement('div');
      f.className = 'field';
      f.innerHTML = '<strong>' + field.location + ' · ' + field.fieldLabel + '</strong> <span style="color:#93a0ad">(' + field.fieldId + ')</span>';
      for (const o of opts) {
        const row = document.createElement('div');
        row.className = 'opt';
        row.innerHTML = '<div><b>' + o.displayName + '</b><br><span>' + o.id + (o.formerIds?.length ? ' ← ' + o.formerIds.join(', ') : '') + '</span></div>'
          + '<div>' + (o.bxn ? '<span class="ok">' + o.bxn + '</span>' : '<span class="miss">no bxn map</span>') + '</div>'
          + '<div>' + (o.illustration ? (o.illustration.endsWith('.jpg') || o.illustration.endsWith('.png') || o.illustration.endsWith('.webp') ? '<img class="th" src="' + o.illustration + '" alt=""> ' : '') + '<span>' + o.illustration + '</span>' : '<span class="miss">no drawing</span>') + '</div>';
        f.appendChild(row);
      }
      wrap.appendChild(f);
    }
    sum.textContent = product + ' · ' + shown + ' options';
    if (shown) root.appendChild(wrap);
  }
}
q.addEventListener('input', render);
render();
</script>
</body></html>`;
  fs.writeFileSync(path.join(OUT_DIR, 'graph.html'), html);
}

function stripCrossedPhotos(products, collisions) {
  const collidingIds = [...new Set(collisions.map((c) => c.optionId))].sort((a, b) => b.length - a.length);
  let stripped = 0;
  walkOptions(products, (row) => {
    const own = new Set([row.option.id, ...(row.option.formerIds || [])]);
    const photos = row.option.photos || [];
    const kept = photos.filter((p) => {
      const stem = path.basename(String(p)).replace(/\.(webp|png|jpe?g|avif)$/i, '');
      const review = stem.match(/^[a-z0-9-]+__([a-z0-9-]+)__/i);
      const named = review ? review[1] : stem;
      const hit = collidingIds.find((id) => named === id || named.startsWith(`${id}-v`) || named.startsWith(`${id}__`));
      if (!hit) return true;
      return own.has(hit);
    });
    if (kept.length !== photos.length) {
      stripped += photos.length - kept.length;
      row.option.photos = kept;
    }
  });
  return stripped;
}

function backupOptions() {
  const dest = path.join(STORE, `options.backup-2026-09-16-craft-lock`);
  if (fs.existsSync(dest)) return dest;
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(OPTIONS_DIR).filter((x) => x.endsWith('.json'))) {
    fs.copyFileSync(path.join(OPTIONS_DIR, f), path.join(dest, f));
  }
  return dest;
}

function saveCatalog(products) {
  for (const p of products) writeJson(path.join(OPTIONS_DIR, p.file), p.cfg);
}

function scrapeStats(bxn) {
  const out = {};
  for (const [code, part] of Object.entries(CAT_PART)) {
    const imgs = bxn.images[code] || [];
    const fields = new Set(imgs.map((i) => i.field));
    out[code] = { part, images: imgs.length, fields: fields.size };
  }
  return out;
}

// ── main ──────────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
const products = loadCatalog();
const collisions = findCollisions(products);
const bxn = loadBxn();
const remap = buildRemap(collisions, products);

console.log('catalog options:', products.reduce((n, p) => n + p.cfg.sections.reduce((a, s) => a + s.fields.reduce((b, f) => b + (f.options?.length || 0), 0), 0), 0));
console.log('id collisions (same option id, different fields, in-scope):', collisions.length);
console.log('  colliding option ids:', collisions.slice(0, 12).map((c) => `${c.product}/${c.optionId}×${c.fields.length}`).join(', '), collisions.length > 12 ? '…' : '');
console.log('mtm.bxn scrape:', JSON.stringify(scrapeStats(bxn)));
console.log('proposed renames:', remap.length);

writeJson(path.join(OUT_DIR, 'collisions.json'), { builtAt: new Date().toISOString(), collisions });
writeJson(path.join(OUT_DIR, 'id-remap.json'), { builtAt: new Date().toISOString(), remap });

let reviewStats = null;
let renameStats = null;
if (APPLY) {
  const bak = backupOptions();
  console.log('backup:', bak);
}
if (APPLY_REVIEWS) {
  reviewStats = applyReviews(products);
  console.log('reviews applied:', JSON.stringify(reviewStats));
}
if (RENAME) {
  renameStats = applyRename(products, remap);
  const ts = rewriteShirtTs(remap);
  console.log('renamed:', JSON.stringify(renameStats), 'shirt.ts', JSON.stringify(ts));
}
if (APPLY_REVIEWS || RENAME) {
  const stripped = stripCrossedPhotos(products, collisions);
  console.log('crossed photos stripped:', stripped);
}

const lock = buildLock(products, bxn, remap);
if (APPLY) saveCatalog(products);
writeJson(LOCK_JSON, lock);
writeJson(LOCK_STORE, { ...lock, scrapeInventory: undefined, note: 'Full scrape inventory lives in public/images/reports/craft-lock/canonical-craft-lock.json' });
writeGraph(lock);
fs.writeFileSync(path.join(OUT_DIR, 'README.md'), `# Craft identity lock

Built ${lock.builtAt}.

This folder is the permanent record of every builder craft option and its
illustration. Do not delete it. Matching by a short option id such as
\`stitch-06-top\` is forbidden — that id used to mean collar stitching AND cuff
stitching AND placket stitching.

## Identity

\`product|section|field|optionId\`

Example after the rename:

- \`shirt|collar|decoration_stitching_on_collar|collar-stitch-06-top\`
- \`shirt|cuffs|decoration_stitching_on_cuff|cuff-stitch-06-top\`

## Files

- \`canonical-craft-lock.json\` — every craft, former ids, BXN field/value, illustration path
- \`graph.html\` — searchable map
- \`id-remap.json\` — old id → location-tied id
- \`collisions.json\` — what was crossed up

## Commands

\`\`\`
node tools/lock_craft_identities.mjs
node tools/inspect_craft_lock.mjs --craft=collar-stitch-06-top
\`\`\`
`);

console.log('lock written:', LOCK_JSON);
console.log('graph:', path.join(OUT_DIR, 'graph.html'));
console.log('mapped to bxn:', lock.totals.mappedToBxn, '/', lock.totals.crafts);
if (!APPLY) console.log('dry run only — pass --apply-reviews --rename --lock or --all to write');
