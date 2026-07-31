import fs from 'fs';
import https from 'https';
import crypto from 'crypto';

const md5 = b => crypto.createHash('md5').update(b).digest('hex');
const validate = JSON.parse(fs.readFileSync('tmp-genmap/validate-list.json', 'utf8'));
fs.mkdirSync('tmp-genmap/dl', { recursive: true });

const fetchBuf = u => new Promise(res => {
  https.get(u, r => {
    if (r.statusCode !== 200) return res(null);
    const chunks = [];
    r.on('data', c => chunks.push(c));
    r.on('end', () => res(Buffer.concat(chunks)));
  }).on('error', () => res(null));
});

// download each distinct rawUrl once (cache by genId)
const byUrl = new Map();
for (const v of validate) {
  if (!byUrl.has(v.rawUrl)) byUrl.set(v.rawUrl, []);
  byUrl.get(v.rawUrl).push(v);
}
let match = 0, mismatch = 0, dlfail = 0;
const mismatches = [];
const q = [...byUrl.keys()];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (q.length) {
    const u = q.shift();
    const genId = byUrl.get(u)[0].genId;
    const cache = 'tmp-genmap/dl/' + genId + '.png';
    let buf;
    if (fs.existsSync(cache)) buf = fs.readFileSync(cache);
    else { buf = await fetchBuf(u); if (buf) fs.writeFileSync(cache, buf); }
    if (!buf) { dlfail++; continue; }
    const h = md5(buf);
    for (const v of byUrl.get(u)) {
      const eh = md5(fs.readFileSync(v.existing));
      if (h === eh) match++;
      else { mismatch++; mismatches.push({ key: v.product + '|' + v.optId, existing: v.existing, genId: v.genId, confidence: v.confidence }); }
    }
  }
}));
console.log('validation: match:', match, 'mismatch:', mismatch, 'dl failures:', dlfail);
fs.writeFileSync('tmp-genmap/validate-mismatch.json', JSON.stringify(mismatches, null, 1));
mismatches.slice(0, 20).forEach(m => console.log('  MISMATCH', m.key, m.confidence));
