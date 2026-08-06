import fs from 'fs';

const gens = JSON.parse(fs.readFileSync('tmp-genmap/generations.json', 'utf8'));
const A = JSON.parse(fs.readFileSync('tmp-genmap/assignments.json', 'utf8'));
const per = JSON.parse(fs.readFileSync('tmp-genmap/per-option.json', 'utf8'));
const covered = new Set(per.map(v => v.product + '|' + v.optId));
const products = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];
const norm = s => String(s || '').toLowerCase().replace(/[—–]/g, '-').replace(/[°]/g, ' deg ').replace(/["“”'’]/g, '').replace(/\s+/g, ' ').trim();

// field labels + option records from raw JSON
const fieldOptions = []; // {product, sectionId, fieldId, fieldLabel, sectionLabel, opt}
for (const p of products) {
  const d = JSON.parse(fs.readFileSync('data-store/options/' + p + '.json', 'utf8'));
  for (const s of d.sections || []) for (const f of s.fields || []) for (const o of f.options || []) {
    fieldOptions.push({ product: p, sectionId: s.id, fieldId: f.id, fieldLabel: f.label || '', sectionLabel: s.label || '', opt: o });
  }
}

const unresolved = A.filter(a => a.confidence === 'unresolved');
const unGens = new Map(unresolved.map(a => [a.genId, a]));

const rescued = [];
for (const g of gens) {
  const a = unGens.get(g.id);
  if (!a) continue;
  const raw = g.params.prompt || '';
  let label = null, fieldDisp = null;
  let m = raw.match(/featuring a precise ["“]?(.+?)["”]? \(([^)]+)\)/);
  if (m) { label = norm(m[1]); fieldDisp = norm(m[2]); }
  if (!fieldDisp) {
    const m2 = raw.match(/: the (.+?) is the dominant subject/);
    if (m2) fieldDisp = norm(m2[1]);
  }
  if (!label || !fieldDisp) continue;
  const cands = fieldOptions.filter(fo =>
    norm(fo.opt.label) === label &&
    (norm(fo.fieldLabel) === fieldDisp || norm(fo.fieldLabel).includes(fieldDisp) || fieldDisp.includes(norm(fo.fieldLabel)))
  );
  if (!cands.length) continue;
  const groups = new Set(cands.map(c => norm(c.opt.label) + '|' + c.opt.id));
  if (groups.size !== 1) continue; // still ambiguous
  rescued.push({
    genId: g.id, createdAt: g.createdAt, rawUrl: g.results && g.results.rawUrl,
    targets: cands.map(c => ({ product: c.product, sectionId: c.sectionId, fieldId: c.fieldId, optId: c.opt.id, label: c.opt.label }))
  });
}
console.log('rescued gens:', rescued.length);

// latest per option, only for options not already covered
const perOpt = new Map();
for (const r of rescued) for (const t of r.targets) {
  const k = t.product + '|' + t.optId;
  if (covered.has(k)) continue;
  const prev = perOpt.get(k);
  if (!prev || r.createdAt > prev.createdAt) perOpt.set(k, { ...t, genId: r.genId, createdAt: r.createdAt, rawUrl: r.rawUrl });
}
console.log('new options covered by rescue:', perOpt.size);
[...perOpt.values()].forEach(v => console.log('  ', v.product, '|', v.fieldId, '>', v.optId, '(', v.label, ')'));
fs.writeFileSync('tmp-genmap/rescue-list.json', JSON.stringify([...perOpt.values()], null, 1));
