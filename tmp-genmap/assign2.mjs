import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const md5f = f => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
const gens = JSON.parse(fs.readFileSync('tmp-genmap/generations.json', 'utf8'));
const products = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];
const norm = s => String(s || '').toLowerCase().replace(/[—–]/g, '-').replace(/[°]/g, ' deg ').replace(/\s+/g, ' ').trim();

// ---- load options from build output
let opts = [];
for (const p of products) {
  JSON.parse(fs.readFileSync('tmp-genmap/prompts-' + p + '.json', 'utf8')).forEach(o => {
    o.product = p;
    o.optId = o.addr.split('>').pop().trim();
    o.field = o.addr.split('>')[2].trim();
    opts.push(o);
  });
}
const gensable = opts.filter(o => o.generate && o.label);
for (const o of gensable) {
  o.nlabel = norm(o.label);
  o.nprompt = norm(o.prompt);
  o.ntokens = (o.requiredTokens || []).map(norm);
}

// ---- gather every local image path tied to each option from raw JSON (image, techpackPrev, techpackIllustration, bxn)
const localPathsByKey = new Map(); // product|optId -> Set(paths)
for (const p of products) {
  const d = JSON.parse(fs.readFileSync('data-store/options/' + p + '.json', 'utf8'));
  const walk = o => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === 'object') {
      if (o.id && (o.image !== undefined)) {
        const k = p + '|' + o.id;
        const set = localPathsByKey.get(k) || new Set();
        const add = v => {
          if (typeof v === 'string' && v.startsWith('/images/')) set.add('public' + v);
        };
        add(o.image); add(o.techpackPrev); add(o.techpackIllustration);
        if (o.bxn && typeof o.bxn === 'object') Object.values(o.bxn).forEach(add);
        localPathsByKey.set(k, set);
      }
      for (const k2 of Object.keys(o)) walk(o[k2]);
    }
  };
  walk(d);
}

// ---- index options by content hash of all their known illustration files
const optByHash = new Map(); // md5 -> [options]
const hashCache = new Map();
const hashOf = f => {
  if (hashCache.has(f)) return hashCache.get(f);
  let h = null;
  try { h = md5f(f); } catch (e) { }
  hashCache.set(f, h);
  return h;
};
for (const o of gensable) {
  const set = new Set();
  if (o.illustrationDisk) {
    const rel = path.relative(process.cwd(), o.illustrationDisk).split(path.sep).join('/');
    set.add(rel);
  }
  const extra = localPathsByKey.get(o.product + '|' + o.optId);
  if (extra) for (const v of extra) set.add(v);
  o.allHashes = new Set();
  for (const f of set) {
    const h = hashOf(f);
    if (!h) continue;
    o.allHashes.add(h);
    if (!optByHash.has(h)) optByHash.set(h, []);
    optByHash.get(h).push(o);
  }
}
console.log('hash index entries:', optByHash.size);

// ---- ref media id -> hash
const refHashById = {};
for (const f of fs.readdirSync('tmp-genmap/refs')) {
  refHashById[f.replace('.bin', '')] = md5f('tmp-genmap/refs/' + f);
}

function labelScore(o, p) {
  let s = 0;
  if (p === o.nprompt) return 10000;
  if (o.nlabel.length >= 4 && p.includes(o.nlabel)) s += o.nlabel.length * 3;
  if (o.ntokens.length) {
    const f = o.ntokens.filter(t => p.includes(t)).length;
    s += 40 * (f / o.ntokens.length);
  }
  if (p.includes(o.field.replace(/-/g, ' '))) s += 15;
  return s;
}

const assignments = [];
for (const g of gens) {
  const p = norm(g.params.prompt);
  let hashCands = null;
  for (const m of (g.params.medias || [])) {
    const u = m.data && m.data.url;
    if (!u) continue;
    const id = u.split('/').pop().split('.')[0];
    const h = refHashById[id];
    if (h && optByHash.has(h)) hashCands = optByHash.get(h);
  }
  const pool = (hashCands && hashCands.length) ? hashCands : gensable;
  let best = [], bestScore = -1;
  for (const o of pool) {
    const s = labelScore(o, p);
    if (s > bestScore) { bestScore = s; best = [o]; }
    else if (s === bestScore) best.push(o);
  }
  const groups = new Set(best.map(o => o.nlabel + '|' + o.part));
  let confidence;
  if (bestScore >= 10000) confidence = 'exact-prompt';
  else if (hashCands && bestScore >= 30 && groups.size === 1) confidence = 'hash+label';
  else if (hashCands && groups.size === 1) confidence = 'hash-unique';
  else if (hashCands && groups.size > 1 && bestScore >= 30) confidence = 'hash-ambiguous';
  else if (!hashCands && bestScore >= 60 && groups.size === 1) confidence = 'label-strong';
  else confidence = 'unresolved';
  assignments.push({
    genId: g.id, createdAt: g.createdAt, rawUrl: g.results && g.results.rawUrl,
    confidence, score: Math.round(bestScore * 10) / 10, hadRef: !!hashCands,
    options: ['exact-prompt', 'hash+label', 'hash-unique', 'label-strong'].includes(confidence)
      ? best.map(o => ({ product: o.product, addr: o.addr, optId: o.optId, label: o.label, part: o.part }))
      : [],
    cands: confidence !== 'unresolved' ? undefined : best.slice(0, 4).map(o => o.product + ' :: ' + o.addr + ' (' + o.label + ')'),
    promptHead: (g.params.prompt || '').slice(0, 110).replace(/\n/g, ' ')
  });
}

const counts = {};
assignments.forEach(a => counts[a.confidence] = (counts[a.confidence] || 0) + 1);
console.log('assignment confidence:', counts);

const perOption = new Map();
for (const a of assignments) {
  for (const o of a.options) {
    const k = o.product + '|' + o.optId;
    const prev = perOption.get(k);
    if (!prev || a.createdAt > prev.createdAt) {
      perOption.set(k, { ...o, genId: a.genId, createdAt: a.createdAt, rawUrl: a.rawUrl, confidence: a.confidence, score: a.score });
    }
  }
}
console.log('distinct options with a mapped generation:', perOption.size);
const byProduct = {};
for (const v of perOption.values()) byProduct[v.product] = (byProduct[v.product] || 0) + 1;
console.log('per product:', byProduct);

fs.writeFileSync('tmp-genmap/assignments.json', JSON.stringify(assignments, null, 1));
fs.writeFileSync('tmp-genmap/per-option.json', JSON.stringify([...perOption.values()], null, 1));

const un = assignments.filter(a => a.confidence === 'unresolved' || a.confidence === 'hash-ambiguous');
console.log('--- unresolved/ambiguous:', un.length, '(of which after 06-09:', un.filter(a => a.createdAt > 1781000000).length + ')');
