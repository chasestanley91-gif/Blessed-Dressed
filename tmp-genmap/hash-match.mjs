import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const md5 = f => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');

// hash all catalog illustration files (skip generated/)
const hashToPaths = {};
const walkDir = d => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name === 'generated') continue; walkDir(p); }
    else if (/\.(png|jpe?g|webp)$/i.test(e.name)) {
      const h = md5(p);
      (hashToPaths[h] = hashToPaths[h] || []).push(p.split(path.sep).join('/'));
    }
  }
};
walkDir('public/images');
const totalFiles = Object.values(hashToPaths).reduce((a, b) => a + b.length, 0);
console.log('catalog image files hashed:', totalFiles, 'unique hashes:', Object.keys(hashToPaths).length);

// hash downloaded reference media
const refHash = {};
for (const f of fs.readdirSync('tmp-genmap/refs')) {
  refHash[f.replace('.bin', '')] = md5('tmp-genmap/refs/' + f);
}
let matched = 0;
const unmatched = [];
const refToPath = {};
for (const [id, h] of Object.entries(refHash)) {
  if (hashToPaths[h]) { matched++; refToPath[id] = hashToPaths[h]; }
  else unmatched.push(id);
}
console.log('refs matched to catalog files:', matched, 'unmatched:', unmatched.length);
fs.writeFileSync('tmp-genmap/ref-to-path.json', JSON.stringify(refToPath, null, 1));
fs.writeFileSync('tmp-genmap/ref-unmatched.json', JSON.stringify(unmatched, null, 1));
