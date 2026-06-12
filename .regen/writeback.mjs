import fs from 'node:fs';
import path from 'node:path';
// args: JSON array of {id, src} on argv[2]
const items = JSON.parse(process.argv[2]);
const genDir = path.resolve('public', 'images', 'generated', 'trousers');
fs.mkdirSync(genDir, { recursive: true });
const jsonPath = path.resolve('data-store', 'options', 'trousers.json');
let txt = fs.readFileSync(jsonPath, 'utf8');
const report = [];
for (const { id, src } of items) {
  const destWeb = '/images/generated/trousers/' + id + '.png';
  fs.copyFileSync(src, path.join(genDir, id + '.png'));
  // locate the option block by id, then its image line
  const idIdx = txt.indexOf('"id": "' + id + '"');
  if (idIdx < 0) { report.push(id + ' : ID NOT FOUND'); continue; }
  const imgRe = /(\n([ \t]*)"image": ")([^"]*)(")/g;
  imgRe.lastIndex = idIdx;
  const m = imgRe.exec(txt);
  if (!m) { report.push(id + ' : no image line after id'); continue; }
  const indent = m[2];
  const oldImg = m[3];
  if (oldImg === destWeb) { report.push(id + ' : already set'); continue; }
  const replacement = m[1] + destWeb + m[4] + ',\n' + indent + '"techpackIllustration": "' + oldImg + '"';
  txt = txt.slice(0, m.index) + replacement + txt.slice(m.index + m[0].length);
  report.push(id + ' : image -> ' + destWeb + '  (blueprint kept: ' + oldImg.slice(0, 48) + '...)');
}
JSON.parse(txt); // validate
fs.writeFileSync(jsonPath, txt);
console.log(report.join('\n'));
