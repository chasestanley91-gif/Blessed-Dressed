import fs from 'fs';
import crypto from 'crypto';
import https from 'https';

const md5 = b => crypto.createHash('md5').update(b).digest('hex');
const products = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];

// collect remote illustration URLs from build output
const remoteUrls = new Set();
for (const p of products) {
  const d = JSON.parse(fs.readFileSync('tmp-genmap/prompts-' + p + '.json', 'utf8'));
  for (const o of d) if (o.illustrationRemote && o.illustration) remoteUrls.add(o.illustration);
}
console.log('unique remote illustration URLs:', remoteUrls.size);

const unmatched = JSON.parse(fs.readFileSync('tmp-genmap/ref-unmatched.json', 'utf8'));
const refHashes = {};
for (const id of unmatched) {
  refHashes[md5(fs.readFileSync('tmp-genmap/refs/' + id + '.bin'))] = id;
}

fs.mkdirSync('tmp-genmap/remote', { recursive: true });
const fetchBuf = u => new Promise((res, rej) => {
  https.get(u, r => {
    if (r.statusCode !== 200) return res(null);
    const chunks = [];
    r.on('data', c => chunks.push(c));
    r.on('end', () => res(Buffer.concat(chunks)));
  }).on('error', () => res(null));
});

const refToUrl = {};
const q = [...remoteUrls];
let done = 0;
await Promise.all(Array.from({ length: 10 }, async () => {
  while (q.length) {
    const u = q.shift();
    const cache = 'tmp-genmap/remote/' + crypto.createHash('md5').update(u).digest('hex') + '.bin';
    let buf;
    if (fs.existsSync(cache)) buf = fs.readFileSync(cache);
    else { buf = await fetchBuf(u); if (buf) fs.writeFileSync(cache, buf); }
    done++;
    if (!buf) continue;
    const h = md5(buf);
    if (refHashes[h]) refToUrl[refHashes[h]] = u;
  }
}));
console.log('remote urls fetched:', done, '| stray refs resolved to remote URLs:', Object.keys(refToUrl).length, 'of', unmatched.length);
fs.writeFileSync('tmp-genmap/ref-to-remote.json', JSON.stringify(refToUrl, null, 1));
console.log(JSON.stringify(refToUrl, null, 1).slice(0, 1500));
