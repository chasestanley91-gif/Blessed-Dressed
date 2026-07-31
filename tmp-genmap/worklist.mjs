import fs from 'fs';

const per = JSON.parse(fs.readFileSync('tmp-genmap/per-option.json', 'utf8'));
const products = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];

// current image per product|optId from raw JSON
const current = new Map();
for (const p of products) {
  const d = JSON.parse(fs.readFileSync('data-store/options/' + p + '.json', 'utf8'));
  const walk = o => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === 'object') {
      if (o.id && o.image !== undefined) {
        const k = p + '|' + o.id;
        if (!current.has(k)) current.set(k, { image: o.image, hasTechpack: !!(o.techpackIllustration || o.techpackPrev) });
      }
      for (const k2 of Object.keys(o)) walk(o[k2]);
    }
  };
  walk(d);
}

let alreadyGen = 0, needs = 0, missingFile = 0;
const validate = [], work = [];
for (const v of per) {
  const k = v.product + '|' + v.optId;
  const cur = current.get(k);
  if (!cur) { console.log('NOT IN JSON:', k); continue; }
  const img = String(cur.image || '');
  if (img.startsWith('/images/generated/')) {
    alreadyGen++;
    const f = 'public' + img;
    if (fs.existsSync(f)) validate.push({ ...v, existing: f });
    else { missingFile++; work.push(v); }
  } else {
    needs++;
    work.push(v);
  }
}
console.log('mapped options:', per.length, '| already generated in catalog:', alreadyGen, '(missing file on disk:', missingFile + ')', '| need write-back:', needs);
const byP = {};
work.forEach(w => byP[w.product] = (byP[w.product] || 0) + 1);
console.log('write-back work per product:', byP);
fs.writeFileSync('tmp-genmap/validate-list.json', JSON.stringify(validate, null, 1));
fs.writeFileSync('tmp-genmap/work-list.json', JSON.stringify(work, null, 1));

// distinct gen downloads needed
const genUrls = new Set(work.map(w => w.rawUrl));
console.log('distinct generation files to download:', genUrls.size);
const vUrls = new Set(validate.map(w => w.rawUrl));
console.log('validation downloads:', vUrls.size);
