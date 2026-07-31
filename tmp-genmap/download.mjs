import fs from 'fs';
import https from 'https';
import crypto from 'crypto';

const md5 = b => crypto.createHash('md5').update(b).digest('hex');
const work = JSON.parse(fs.readFileSync('tmp-genmap/work-list.json', 'utf8'));

// category for an option: garment-specific part prefix wins; else fall back to addr section / product
function categoryOf(v) {
  if (v.part.startsWith('jacket-')) return 'jacket';
  if (v.part.startsWith('trouser-')) return 'trousers';
  if (v.part.startsWith('shirt-')) return 'shirt';
  if (v.part.startsWith('vest-')) return 'vest';
  const section = v.addr.split('>')[1].trim().toLowerCase();
  if (section.startsWith('trousers')) return 'trousers';
  if (section.startsWith('vest')) return 'vest';
  if (v.product === 'shirt') return 'shirt';
  if (v.product === 'trousers') return 'trousers';
  if (v.product === 'vest') return 'vest';
  return 'jacket';
}

// destination per work item; detect collisions (same path, different gen)
const destMap = new Map(); // dest -> genId
const items = [];
let collisions = 0;
for (const v of work) {
  const cat = categoryOf(v);
  let dest = 'public/images/generated/' + cat + '/' + v.optId + '.png';
  const prev = destMap.get(dest);
  if (prev && prev !== v.genId) {
    collisions++;
    dest = 'public/images/generated/' + cat + '/' + v.optId + '--' + v.genId.slice(0, 8) + '.png';
  }
  destMap.set(dest, v.genId);
  items.push({ ...v, cat, dest });
}
console.log('work items:', items.length, '| filename collisions resolved with suffix:', collisions);

for (const c of ['jacket', 'trousers', 'shirt', 'vest']) fs.mkdirSync('public/images/generated/' + c, { recursive: true });

const fetchBuf = u => new Promise(res => {
  https.get(u, r => {
    if (r.statusCode !== 200) return res(null);
    const chunks = [];
    r.on('data', c => chunks.push(c));
    r.on('end', () => res(Buffer.concat(chunks)));
  }).on('error', () => res(null));
});

// download distinct gens (cache in tmp-genmap/dl), then copy to all dests
const byGen = new Map();
for (const it of items) {
  if (!byGen.has(it.genId)) byGen.set(it.genId, { rawUrl: it.rawUrl, dests: new Set() });
  byGen.get(it.genId).dests.add(it.dest);
}
let dlOk = 0, dlFail = 0, placed = 0;
const failed = [];
const q = [...byGen.entries()];
await Promise.all(Array.from({ length: 10 }, async () => {
  while (q.length) {
    const [genId, info] = q.shift();
    const cache = 'tmp-genmap/dl/' + genId + '.png';
    let buf = null;
    if (fs.existsSync(cache) && fs.statSync(cache).size > 0) buf = fs.readFileSync(cache);
    else {
      for (let i = 0; i < 3 && !buf; i++) buf = await fetchBuf(info.rawUrl);
      if (buf) fs.writeFileSync(cache, buf);
    }
    if (!buf) { dlFail++; failed.push(genId); continue; }
    dlOk++;
    // basic sanity: PNG signature
    if (buf.slice(1, 4).toString() !== 'PNG') { console.log('WARN not png:', genId); }
    for (const d of info.dests) { fs.writeFileSync(d, buf); placed++; }
  }
}));
console.log('distinct gens downloaded:', dlOk, '| failed:', dlFail, '| files placed:', placed);
fs.writeFileSync('tmp-genmap/placed.json', JSON.stringify(items, null, 1));
if (failed.length) fs.writeFileSync('tmp-genmap/dl-failed.json', JSON.stringify(failed, null, 1));
