import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const md5f = f => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
const gens = JSON.parse(fs.readFileSync('tmp-genmap/generations.json', 'utf8'));
const products = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];
const norm = s => String(s || '').toLowerCase().replace(/[—–]/g, '-').replace(/[°]/g, ' deg ').replace(/["“”'’]/g, '').replace(/\s+/g, ' ').trim();

let opts = [];
for (const p of products) {
  JSON.parse(fs.readFileSync('tmp-genmap/prompts-' + p + '.json', 'utf8')).forEach(o => {
    o.product = p;
    o.optId = o.addr.split('>').pop().trim();
    opts.push(o);
  });
}
const gensable = opts.filter(o => o.generate && o.label);
for (const o of gensable) {
  o.nlabel = norm(o.label);
  o.nprompt = norm(o.prompt);
  o.ntokens = (o.requiredTokens || []).map(norm);
  o.garment = o.part.startsWith('jacket-') ? 'jacket'
    : o.part.startsWith('shirt-') ? 'shirt'
    : o.part.startsWith('trouser-') ? 'trouser'
    : o.part.startsWith('vest-') ? 'vest' : null; // fin-* => null (never filtered)
}

// option paths from raw JSON for hash index
const localPathsByKey = new Map();
for (const p of products) {
  const d = JSON.parse(fs.readFileSync('data-store/options/' + p + '.json', 'utf8'));
  const walk = o => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === 'object') {
      if (o.id && o.image !== undefined) {
        const k = p + '|' + o.id;
        const set = localPathsByKey.get(k) || new Set();
        const add = v => { if (typeof v === 'string' && v.startsWith('/images/')) set.add('public' + v); };
        add(o.image); add(o.techpackPrev); add(o.techpackIllustration); add(o.realImage);
        localPathsByKey.set(k, set);
      }
      for (const k2 of Object.keys(o)) walk(o[k2]);
    }
  };
  walk(d);
}

const optByHash = new Map();
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
  if (o.illustrationDisk) set.add(path.relative(process.cwd(), o.illustrationDisk).split(path.sep).join('/'));
  const extra = localPathsByKey.get(o.product + '|' + o.optId);
  if (extra) for (const v of extra) set.add(v);
  for (const f of set) {
    const h = hashOf(f);
    if (!h) continue;
    if (!optByHash.has(h)) optByHash.set(h, []);
    optByHash.get(h).push(o);
  }
}

const refHashById = {};
for (const f of fs.readdirSync('tmp-genmap/refs')) refHashById[f.replace('.bin', '')] = md5f('tmp-genmap/refs/' + f);

// ---- prompt feature extraction
function extractFeatures(raw) {
  const labels = [];
  let m;
  if ((m = raw.match(/featuring a precise ["“]?(.+?)["”]? \(([^)]+)\)/))) labels.push(m[1]);
  if ((m = raw.match(/Reproduce the ["“](.+?)["”] detail exactly/))) labels.push(m[1]);
  if ((m = raw.match(/featuring a precise ["“]?([^."“”]{3,60}?)["”]? collar/i))) labels.push(m[1]);
  const head = raw.slice(0, 260).toLowerCase();
  let garment = null;
  const g = head.match(/\b(waistcoat|vest|trousers?|jacket|shirt)\b/);
  if (g) garment = { waistcoat: 'vest', vest: 'vest', trouser: 'trouser', trousers: 'trouser', jacket: 'jacket', shirt: 'shirt' }[g[1]];
  return { labels: labels.map(norm).filter(Boolean), garment };
}

function score(o, p, exLabels) {
  if (p === o.nprompt) return 10000;
  let s = 0;
  if (exLabels.includes(o.nlabel)) s += 600;
  if (o.nlabel.length >= 4 && p.includes(o.nlabel)) s += Math.min(o.nlabel.length, 30) * 3;
  if (o.ntokens.length) s += 40 * (o.ntokens.filter(t => p.includes(t)).length / o.ntokens.length);
  return s;
}

const assignments = [];
for (const g of gens) {
  const raw = g.params.prompt || '';
  const p = norm(raw);
  const { labels: exLabels, garment } = extractFeatures(raw);

  let hashCands = null;
  for (const m of (g.params.medias || [])) {
    const u = m.data && m.data.url;
    if (!u) continue;
    const id = u.split('/').pop().split('.')[0];
    const h = refHashById[id];
    if (h && optByHash.has(h)) hashCands = optByHash.get(h);
  }

  let pool = (hashCands && hashCands.length) ? hashCands : gensable;
  if (garment) {
    const filtered = pool.filter(o => !o.garment || o.garment === garment);
    if (filtered.length) pool = filtered;
  }

  let best = [], bestScore = -1;
  for (const o of pool) {
    const s = score(o, p, exLabels);
    if (s > bestScore) { bestScore = s; best = [o]; }
    else if (s === bestScore) best.push(o);
  }
  const groups = new Set(best.map(o => o.nlabel + "|" + o.optId));
  const labelHit = best.length && (p.includes(best[0].nlabel) || exLabels.includes(best[0].nlabel));
  let confidence;
  if (bestScore >= 10000) confidence = 'exact-prompt';
  else if (bestScore >= 600 && groups.size === 1) confidence = 'label-exact';
  else if (hashCands && bestScore >= 40 && groups.size === 1 && labelHit) confidence = 'hash+label';
  else if (hashCands && groups.size === 1 && bestScore >= 20) confidence = 'hash-weak';
  else if (!hashCands && bestScore >= 45 && groups.size === 1 && labelHit) confidence = 'label-strong';
  else confidence = 'unresolved';

  const ok = ['exact-prompt', 'label-exact', 'hash+label', 'label-strong', 'hash-weak'].includes(confidence);
  assignments.push({
    genId: g.id, createdAt: g.createdAt, rawUrl: g.results && g.results.rawUrl,
    confidence, score: Math.round(bestScore * 10) / 10, hadRef: !!hashCands, garment,
    options: ok ? best.map(o => ({ product: o.product, addr: o.addr, optId: o.optId, label: o.label, part: o.part })) : [],
    cands: ok ? undefined : best.slice(0, 4).map(o => o.product + ' :: ' + o.addr + ' (' + o.label + ')'),
    promptHead: raw.slice(0, 130).replace(/\n/g, ' ')
  });
}

const counts = {};
assignments.forEach(a => counts[a.confidence] = (counts[a.confidence] || 0) + 1);
console.log('assignment confidence:', counts);

// per-option winner: latest gen, but prefer higher-confidence tiers over hash-weak
const tier = { 'exact-prompt': 3, 'label-exact': 3, 'hash+label': 2, 'label-strong': 2, 'hash-weak': 1 };
const perOption = new Map();
for (const a of assignments) {
  for (const o of a.options) {
    const k = o.product + '|' + o.optId;
    const prev = perOption.get(k);
    const cand = { ...o, genId: a.genId, createdAt: a.createdAt, rawUrl: a.rawUrl, confidence: a.confidence, score: a.score, tier: tier[a.confidence] };
    if (!prev) perOption.set(k, cand);
    else if (cand.tier > prev.tier || (cand.tier === prev.tier && cand.createdAt > prev.createdAt)) perOption.set(k, cand);
  }
}
console.log('distinct options with a mapped generation:', perOption.size);
const byProduct = {};
for (const v of perOption.values()) byProduct[v.product] = (byProduct[v.product] || 0) + 1;
console.log('per product:', byProduct);

fs.writeFileSync('tmp-genmap/assignments.json', JSON.stringify(assignments, null, 1));
fs.writeFileSync('tmp-genmap/per-option.json', JSON.stringify([...perOption.values()], null, 1));

const un = assignments.filter(a => a.confidence === 'unresolved');
console.log('--- unresolved:', un.length, '(recent 06-09+:', un.filter(a => a.createdAt > 1781000000).length + ')');
un.filter(a => a.createdAt > 1781000000).slice(0, 12).forEach(a =>
  console.log('  score=' + a.score, 'ref=' + a.hadRef, a.garment || '-', a.promptHead.slice(0, 95)));
