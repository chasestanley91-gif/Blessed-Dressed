import fs from 'fs';

const products = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];

// 1) rename misassigned files to their true identity
const renames = [
  ['public/images/generated/trousers/fly-stitch-straight.png', 'public/images/generated/trousers/pocket-stitch-015.png'],
  ['public/images/generated/trousers/darts-single.png', 'public/images/generated/trousers/pleat-no-single-dart.png'],
  ['public/images/generated/trousers/darts-double.png', 'public/images/generated/trousers/pleat-no-double-dart.png'],
];
for (const [from, to] of renames) {
  if (fs.existsSync(from)) { fs.copyFileSync(from, to); fs.unlinkSync(from); console.log('moved', from, '->', to); }
  else if (fs.existsSync(to)) console.log('already moved:', to);
  else console.log('MISSING', from);
}

// 2) revert displaced options to original illustration; 3) point true options at the renamed files
const revert = new Set(['fly-stitch-straight', 'darts-single', 'darts-double']);
const point = {
  'pocket-stitch-015': '/images/generated/trousers/pocket-stitch-015.png',
  'pleat-no-single-dart': '/images/generated/trousers/pleat-no-single-dart.png',
  'pleat-no-double-dart': '/images/generated/trousers/pleat-no-double-dart.png',
};

for (const p of products) {
  const file = 'data-store/options/' + p + '.json';
  const raw = fs.readFileSync(file, 'utf8');
  const d = JSON.parse(raw);
  let changed = 0;
  for (const s of d.sections || []) for (const f of s.fields || []) for (const o of f.options || []) {
    if (revert.has(o.id) && String(o.image || '').startsWith('/images/generated/')) {
      if (o.techpackIllustration) { o.image = o.techpackIllustration; delete o.techpackIllustration; }
      delete o.realImage;
      changed++;
      console.log(p, 'reverted', o.id, '->', String(o.image).slice(0, 70));
    } else if (point[o.id]) {
      if (!o.techpackIllustration && !o.techpackPrev && o.image && !String(o.image).startsWith('/images/generated/')) {
        o.techpackIllustration = o.image;
      }
      o.image = point[o.id];
      o.realImage = point[o.id];
      changed++;
      console.log(p, 'pointed', o.id, '->', point[o.id]);
    }
  }
  if (changed) fs.writeFileSync(file, JSON.stringify(d, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
}
console.log('repair done');
