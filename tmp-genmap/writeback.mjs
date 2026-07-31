import fs from 'fs';

const items = JSON.parse(fs.readFileSync('tmp-genmap/placed.json', 'utf8'));
const products = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];

// group items by product, keyed by "section>field>optId" from addr for precise addressing
const byProduct = {};
for (const it of items) {
  const segs = it.addr.split('>').map(s => s.trim());
  const key = segs.slice(1).join('>'); // section>field>optId
  (byProduct[it.product] = byProduct[it.product] || new Map()).set(key, it);
}

const report = { updated: 0, perProduct: {}, missing: [] };
for (const p of products) {
  const map = byProduct[p];
  if (!map) continue;
  const file = 'data-store/options/' + p + '.json';
  const raw = fs.readFileSync(file, 'utf8');
  const d = JSON.parse(raw);
  let updated = 0;
  const seen = new Set();
  for (const section of d.sections || []) {
    for (const field of section.fields || []) {
      for (const opt of field.options || []) {
        const key = section.id + '>' + field.id + '>' + opt.id;
        const it = map.get(key);
        if (!it) continue;
        seen.add(key);
        const newPath = '/' + it.dest.replace(/^public\//, '');
        if (!fs.existsSync(it.dest)) { report.missing.push(key + ' file missing'); continue; }
        // preserve the blueprint: keep prior image under techpackIllustration unless already recorded
        if (!opt.techpackIllustration && !opt.techpackPrev && opt.image && opt.image !== newPath) {
          opt.techpackIllustration = opt.image;
        }
        opt.image = newPath;
        opt.realImage = newPath;
        updated++;
      }
    }
  }
  for (const key of map.keys()) if (!seen.has(key)) report.missing.push(p + '|' + key + ' not found in JSON walk');
  fs.writeFileSync(file, JSON.stringify(d, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
  report.updated += updated;
  report.perProduct[p] = updated;
}
console.log('updated options:', report.updated, report.perProduct);
if (report.missing.length) {
  console.log('missing (' + report.missing.length + '):');
  report.missing.slice(0, 20).forEach(m => console.log('  -', m));
  fs.writeFileSync('tmp-genmap/writeback-missing.json', JSON.stringify(report.missing, null, 1));
}
