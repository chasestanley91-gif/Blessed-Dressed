import fs from 'fs';
import path from 'path';

const gens = JSON.parse(fs.readFileSync('tmp-genmap/generations.json', 'utf8'));
const refToPath = JSON.parse(fs.readFileSync('tmp-genmap/ref-to-path.json', 'utf8'));
const products = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];

const norm = s => String(s || '').toLowerCase().replace(/[—–]/g, '-').replace(/[°]/g, ' deg ').replace(/\s+/g, ' ').trim();

let opts = [];
for (const p of products) {
  JSON.parse(fs.readFileSync('tmp-genmap/prompts-' + p + '.json', 'utf8')).forEach(o => {
    o.product = p;
    o.optId = o.addr.split('>').pop().trim();
    o.field = o.addr.split('>')[2].trim();
    o.section = o.addr.split('>')[1].trim();
    opts.push(o);
  });
}
const gensable = opts.filter(o => o.generate && o.label);
for (const o of gensable) {
  o.nlabel = norm(o.label);
  o.nprompt = norm(o.prompt);
  o.ntokens = (o.requiredTokens || []).map(norm);
  // normalize illustration disk path to 'public/images/...' forward-slash form
  if (o.illustrationDisk) {
    const rel = path.relative(process.cwd(), o.illustrationDisk).split(path.sep).join('/');
    o.illKey = rel;
  } else o.illKey = null;
}

// index options by illustration path
const byIll = new Map();
for (const o of gensable) {
  if (!o.illKey) continue;
  if (!byIll.has(o.illKey)) byIll.set(o.illKey, []);
  byIll.get(o.illKey).push(o);
}

function labelScore(o, p) {
  let s = 0;
  if (p === o.nprompt) return 10000;
  if (o.nlabel.length >= 4 && p.includes(o.nlabel)) s += o.nlabel.length * 3;
  if (o.ntokens.length) {
    const f = o.ntokens.filter(t => p.includes(t)).length;
    s += 40 * (f / o.ntokens.length);
  }
  const fieldWords = o.field.replace(/-/g, ' ');
  if (p.includes(fieldWords)) s += 15;
  return s;
}

const assignments = []; // {gen, options:[...], confidence}
for (const g of gens) {
  const p = norm(g.params.prompt);
  // hash candidates from reference media
  let hashCands = null;
  const medias = g.params.medias || [];
  for (const m of medias) {
    const u = m.data && m.data.url;
    if (!u) continue;
    const id = u.split('/').pop().split('.')[0];
    const paths = refToPath[id];
    if (paths) {
      hashCands = [];
      for (const pp of paths) if (byIll.has(pp)) hashCands.push(...byIll.get(pp));
    }
  }
  const pool = (hashCands && hashCands.length) ? hashCands : gensable;
  let best = [], bestScore = -1;
  for (const o of pool) {
    const s = labelScore(o, p);
    if (s > bestScore) { bestScore = s; best = [o]; }
    else if (s === bestScore) best.push(o);
  }
  // distinct label+part groups among winners
  const groups = new Set(best.map(o => o.nlabel + '|' + o.part));
  let confidence;
  if (bestScore >= 10000) confidence = 'exact-prompt';
  else if (hashCands && hashCands.length && bestScore >= 30 && groups.size === 1) confidence = 'hash+label';
  else if (hashCands && hashCands.length && groups.size === 1) confidence = 'hash-unique';
  else if (!hashCands && bestScore >= 60 && groups.size === 1) confidence = 'label-strong';
  else confidence = 'unresolved';
  assignments.push({
    genId: g.id, createdAt: g.createdAt,
    rawUrl: g.results && g.results.rawUrl,
    confidence, score: Math.round(bestScore * 10) / 10,
    hadRef: !!(hashCands && hashCands.length),
    options: confidence === 'unresolved' ? [] : best.map(o => ({ product: o.product, addr: o.addr, optId: o.optId, label: o.label, part: o.part })),
    candDump: confidence === 'unresolved' ? best.slice(0, 5).map(o => o.product + ' :: ' + o.addr) : undefined,
    promptHead: (g.params.prompt || '').slice(0, 100).replace(/\n/g, ' ')
  });
}

const counts = {};
assignments.forEach(a => counts[a.confidence] = (counts[a.confidence] || 0) + 1);
console.log('assignment confidence:', counts);

// per-option winner: latest gen
const perOption = new Map(); // key product|optId -> {opt, gen}
for (const a of assignments) {
  if (a.confidence === 'unresolved') continue;
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

// unresolved dump
const un = assignments.filter(a => a.confidence === 'unresolved');
console.log('--- unresolved:', un.length);
un.slice(0, 15).forEach(a => console.log('  ', new Date(a.createdAt * 1000).toISOString().slice(5, 16), 'score=' + a.score, 'ref=' + a.hadRef, a.promptHead.slice(0, 80)));
