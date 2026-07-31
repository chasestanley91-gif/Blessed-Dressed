// apply-decisions.mjs — apply a format-3 review export (per-image verdicts) to the catalog.
//
// Policy:
//  - images[] candidates: rejected URLs are removed outright.
//  - aiImage / realImage / techpackIllustration: cleared when rejected.
//  - image (the displayed asset): only REPLACED when a kept local substitute exists;
//    otherwise left in place and listed in needs_replacement (usually also in remakes).
//  - discarded options are removed from every catalog; defaultValue repointed if needed.
//  - every reject/keep is also recorded in data-store/image-rejections.json so
//    build-review.mjs and the image pipeline can honor them.
//
// Run: node apply-decisions.mjs "<path-to-decisions.json>" [--dry]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_DIR = path.join(ROOT, 'data-store', 'options');
const CATALOGS = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];

const decisionsPath = process.argv[2];
const DRY = process.argv.includes('--dry');
if (!decisionsPath) { console.error('usage: node apply-decisions.mjs <decisions.json> [--dry]'); process.exit(1); }
const D = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
if (D.format !== 3) { console.error('expected format 3 export, got', D.format); process.exit(1); }

const groupOf = (catalog, sectionId) => {
  if (catalog === 'shirt') return 'shirt';
  if (catalog === 'trousers') return 'trousers';
  if (catalog === 'vest') return 'vest';
  if (/^Trousers-/.test(sectionId)) return 'trousers';
  if (/^Vest-/.test(sectionId)) return 'vest';
  return 'jacket';
};
const rel = src => String(src).replace(/^\/images\//, '').replace(/^\//, '');
const isRemote = s => /^https?:\/\//i.test(s);
// local paths compare extension-insensitively: png↔webp conversions of the same
// asset share a path stem and mean the same image to the reviewer
const stem = p => rel(p).replace(/\.[a-z0-9]+$/i, '');
const same = (a, b) => {
  if (!a || !b) return false;
  if (isRemote(a) || isRemote(b)) return a === b;
  return stem(a) === stem(b);
};

// ---- index decisions by garment|fieldId|id
const ck = x => `${x.garment}|${x.fieldId}|${x.id}`;
const rejects = new Map(), keeps = new Map();
for (const r of D.image_rejects) { const k = ck(r); (rejects.get(k) || rejects.set(k, []).get(k)).push(r); }
for (const r of D.image_keeps) { const k = ck(r); (keeps.get(k) || keeps.set(k, []).get(k)).push(r); }
const discardSet = new Set(D.discards.map(ck));
const remakeMap = new Map(D.remakes.map(x => [ck(x), x]));
const badtpMap = new Map(D.bad_tech_packs.map(x => [ck(x), x]));

const KEEP_PREF = ['generated', 'real', 'builder', 'ai', 'techpack', 'candidate'];
const bestKeep = (list, { local = true, role = null } = {}) => {
  let pool = (list || []).filter(x => !local || !isRemote(x.src));
  if (role) pool = pool.filter(x => (x.roles || []).includes(role));
  pool.sort((a, b) => {
    const ra = Math.min(...(a.roles || ['candidate']).map(r => KEEP_PREF.indexOf(r)));
    const rb = Math.min(...(b.roles || ['candidate']).map(r => KEEP_PREF.indexOf(r)));
    return ra - rb;
  });
  return pool[0] || null;
};
const toSrc = p => isRemote(p) ? p : '/images/' + rel(p);

// ---- walk catalogs
const stats = { candidates_removed: 0, fields_cleared: 0, images_replaced: 0, options_discarded: 0 };
const needsReplacement = [], replaced = [], cleared = [], discarded = [];

for (const cat of CATALOGS) {
  const file = path.join(CATALOG_DIR, cat + '.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let touched = false;
  for (const sec of data.sections) {
    for (const field of sec.fields) {
      const g = groupOf(cat, sec.id);
      const before = (field.options || []).length;
      field.options = (field.options || []).filter(o => {
        const k = `${g}|${field.id}|${o.id}`;
        if (discardSet.has(k)) {
          discarded.push({ catalog: cat, key: k, label: o.label });
          stats.options_discarded++; touched = true;
          return false;
        }
        return true;
      });
      if (field.options.length !== before && field.defaultValue &&
          !field.options.some(o => o.id === field.defaultValue)) {
        field.defaultValue = field.options[0] ? field.options[0].id : undefined;
        touched = true;
      }
      for (const o of field.options) {
        const k = `${g}|${field.id}|${o.id}`;
        const rj = rejects.get(k), kp = keeps.get(k);
        if (!rj || !rj.length) continue;
        const isRejected = src => rj.some(r => same(r.src, src));

        // candidates
        if (Array.isArray(o.images) && o.images.length) {
          const kept = o.images.filter(u => !isRejected(u));
          if (kept.length !== o.images.length) {
            stats.candidates_removed += o.images.length - kept.length;
            o.images = kept; touched = true;
          }
        }
        // auxiliary fields: clear on reject
        for (const fkey of ['aiImage', 'realImage', 'techpackIllustration']) {
          if (o[fkey] && isRejected(o[fkey])) {
            // techpack: substitute a kept techpack if the reviewer marked one
            const sub = fkey === 'techpackIllustration' ? bestKeep(kp, { role: 'techpack' }) : null;
            cleared.push({ catalog: cat, key: k, field: fkey, was: o[fkey], now: sub ? toSrc(sub.src) : null });
            if (sub) o[fkey] = toSrc(sub.src); else delete o[fkey];
            stats.fields_cleared++; touched = true;
          }
        }
        // displayed image: replace only with a kept local substitute
        if (o.image && isRejected(o.image)) {
          const sub = bestKeep((kp || []).filter(x => !same(x.src, o.image)));
          if (sub) {
            replaced.push({ catalog: cat, key: k, was: o.image, now: toSrc(sub.src) });
            o.image = toSrc(sub.src);
            stats.images_replaced++; touched = true;
          } else {
            needsReplacement.push({ catalog: cat, key: k, label: o.label, image: o.image,
                                    in_remakes: remakeMap.has(k), in_badtp: badtpMap.has(k) });
          }
        }
      }
    }
  }
  if (touched && !DRY) fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log((DRY ? '[dry] ' : '') + cat + (touched ? ' — updated' : ' — no changes'));
}

// ---- persistent rejection/keep registry for all downstream tooling
const registryPath = path.join(ROOT, 'data-store', 'image-rejections.json');
const registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : {};
registry.updated = new Date().toISOString();
registry.source = path.basename(decisionsPath);
registry.rejects = D.image_rejects.map(r => ({ key: ck(r), src: r.src, roles: r.roles }));
registry.keeps = D.image_keeps.map(r => ({ key: ck(r), src: r.src, roles: r.roles }));
if (!DRY) fs.writeFileSync(registryPath, JSON.stringify(registry, null, 1));

// ---- worklists
const reportsDir = path.join(ROOT, 'public', 'images', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const remakeQueue = D.remakes.map(x => ({ ...x, key: ck(x),
  kept: (keeps.get(ck(x)) || []).map(e => e.src),
  rejected: (rejects.get(ck(x)) || []).map(e => e.src) }));
const badtpQueue = D.bad_tech_packs.map(x => ({ ...x, key: ck(x),
  kept_techpack: (keeps.get(ck(x)) || []).filter(e => (e.roles || []).includes('techpack')).map(e => e.src) }));
const applied = { applied: new Date().toISOString(), source: path.basename(decisionsPath), dry: DRY,
  stats, replaced, cleared, discarded, needs_replacement: needsReplacement };
if (!DRY) {
  fs.writeFileSync(path.join(reportsDir, `remake-queue-${stamp}.json`), JSON.stringify(remakeQueue, null, 1));
  fs.writeFileSync(path.join(reportsDir, `bad-techpack-queue-${stamp}.json`), JSON.stringify(badtpQueue, null, 1));
  fs.writeFileSync(path.join(reportsDir, `applied-decisions-${stamp}.json`), JSON.stringify(applied, null, 1));
}

console.log('\n' + (DRY ? 'DRY RUN — nothing written\n' : ''));
console.log('discarded options       :', stats.options_discarded);
console.log('candidate URLs removed  :', stats.candidates_removed);
console.log('aux fields cleared/subst:', stats.fields_cleared);
console.log('display images replaced :', stats.images_replaced);
console.log('display images needing replacement (left in place):', needsReplacement.length,
  '| of those queued for remake:', needsReplacement.filter(x => x.in_remakes).length);
console.log('remake queue:', remakeQueue.length, '| bad tech pack queue:', badtpQueue.length);
