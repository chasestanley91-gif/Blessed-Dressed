import fs from 'fs';
import https from 'https';
import crypto from 'crypto';

const md5 = b => crypto.createHash('md5').update(b).digest('hex');
const assignments = JSON.parse(fs.readFileSync('tmp-genmap/assignments.json', 'utf8'));
const validate = JSON.parse(fs.readFileSync('tmp-genmap/validate-list.json', 'utf8'));
const valKeys = new Set(validate.map(v => v.product + '|' + v.optId));

// all gens assigned (any confidence) to a validation option
const genToOpts = new Map();
for (const a of assignments) {
  for (const o of a.options) {
    const k = o.product + '|' + o.optId;
    if (valKeys.has(k)) {
      if (!genToOpts.has(a.genId)) genToOpts.set(a.genId, { rawUrl: a.rawUrl, keys: new Set() });
      genToOpts.get(a.genId).keys.add(k);
    }
  }
}
console.log('gens assigned to validation options:', genToOpts.size);

fs.mkdirSync('tmp-genmap/dl', { recursive: true });
const fetchBuf = u => new Promise(res => {
  https.get(u, r => {
    if (r.statusCode !== 200) return res(null);
    const chunks = [];
    r.on('data', c => chunks.push(c));
    r.on('end', () => res(Buffer.concat(chunks)));
  }).on('error', () => res(null));
});

const hashToGen = new Map();
const q = [...genToOpts.entries()];
await Promise.all(Array.from({ length: 10 }, async () => {
  while (q.length) {
    const [genId, info] = q.shift();
    const cache = 'tmp-genmap/dl/' + genId + '.png';
    let buf;
    if (fs.existsSync(cache)) buf = fs.readFileSync(cache);
    else { buf = await fetchBuf(info.rawUrl); if (buf) fs.writeFileSync(cache, buf); }
    if (!buf) continue;
    hashToGen.set(md5(buf), { genId, keys: info.keys });
  }
}));

let sameOption = 0, otherOption = 0, notFound = 0;
const bad = [];
for (const v of validate) {
  const k = v.product + '|' + v.optId;
  const eh = md5(fs.readFileSync(v.existing));
  const hit = hashToGen.get(eh);
  if (!hit) { notFound++; bad.push({ k, why: 'disk file not among my assigned gens' }); }
  else if (hit.keys.has(k)) sameOption++;
  else { otherOption++; bad.push({ k, why: 'disk file belongs to gen I assigned elsewhere: ' + [...hit.keys].slice(0, 3).join(',') }); }
}
console.log('disk file = an older gen of the SAME option (benign):', sameOption);
console.log('disk file = gen I assigned to a DIFFERENT option (conflict):', otherOption);
console.log('disk file not among assigned gens (unknown origin):', notFound);
fs.writeFileSync('tmp-genmap/validate2-bad.json', JSON.stringify(bad, null, 1));
bad.slice(0, 15).forEach(b => console.log('  ', b.k, '|', b.why));
