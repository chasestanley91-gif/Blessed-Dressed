import fs from 'fs';
import https from 'https';

const list = JSON.parse(fs.readFileSync('tmp-genmap/rescue-list.json', 'utf8'));
const products = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];

function categoryOf(v) {
  if (v.product === 'shirt') return 'shirt';
  if (v.product === 'vest') return 'vest';
  if (v.product === 'trousers') return 'trousers';
  if (v.product === 'sport-coat') return 'jacket';
  const s = v.sectionId.toLowerCase();
  if (s.startsWith('trousers')) return 'trousers';
  if (s.startsWith('vest')) return 'vest';
  return 'jacket';
}

const fetchBuf = u => new Promise(res => {
  https.get(u, r => {
    if (r.statusCode !== 200) return res(null);
    const chunks = [];
    r.on('data', c => chunks.push(c));
    r.on('end', () => res(Buffer.concat(chunks)));
  }).on('error', () => res(null));
});

// download distinct gens and place
const items = list.map(v => ({ ...v, dest: 'public/images/generated/' + categoryOf(v) + '/' + v.optId + '.png' }));
// collision guard: if dest exists already from main pass with a DIFFERENT gen, suffix
for (const it of items) {
  if (fs.existsSync(it.dest)) it.dest = it.dest.replace(/\.png$/, '--' + it.genId.slice(0, 8) + '.png');
}
const byGen = new Map();
for (const it of items) {
  if (!byGen.has(it.genId)) byGen.set(it.genId, { rawUrl: it.rawUrl, dests: new Set() });
  byGen.get(it.genId).dests.add(it.dest);
}
let placed = 0;
for (const [genId, info] of byGen) {
  const cache = 'tmp-genmap/dl/' + genId + '.png';
  let buf = null;
  if (fs.existsSync(cache) && fs.statSync(cache).size > 0) buf = fs.readFileSync(cache);
  else { buf = await fetchBuf(info.rawUrl); if (buf) fs.writeFileSync(cache, buf); }
  if (!buf) { console.log('DL FAIL', genId); continue; }
  for (const d of info.dests) { fs.writeFileSync(d, buf); placed++; }
}
console.log('rescue files placed:', placed);

// write back
const byProduct = {};
for (const it of items) (byProduct[it.product] = byProduct[it.product] || []).push(it);
let updated = 0;
for (const p of products) {
  const its = byProduct[p];
  if (!its) continue;
  const file = 'data-store/options/' + p + '.json';
  const raw = fs.readFileSync(file, 'utf8');
  const d = JSON.parse(raw);
  for (const s of d.sections || []) for (const f of s.fields || []) for (const o of f.options || []) {
    const it = its.find(x => x.sectionId === s.id && x.fieldId === f.id && x.optId === o.id);
    if (!it) continue;
    const newPath = '/' + it.dest.replace(/^public\//, '');
    if (!fs.existsSync(it.dest)) continue;
    if (!o.techpackIllustration && !o.techpackPrev && o.image && o.image !== newPath) o.techpackIllustration = o.image;
    o.image = newPath;
    o.realImage = newPath;
    updated++;
  }
  fs.writeFileSync(file, JSON.stringify(d, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
}
console.log('rescue options updated in JSON:', updated);
