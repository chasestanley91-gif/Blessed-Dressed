import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
const skill = os.homedir() + '/.claude/skills/blessed-dressed-craft-photo-generator/scripts/build_prompt.mjs';
const bp = path.resolve('.regen', 'bp');
fs.mkdirSync(bp, { recursive: true });
const DONE = new Set(['ext-square-dbl-hooks','ext-square-dbl-btn-hook','ext-len-15','adjuster-both']);
const SKIP = new Set(['loops-5']);
const out = execFileSync('node', [skill, '--product=trousers', '--section=waistband', '--json'], { encoding: 'utf8', maxBuffer: 1e8 });
const arr = JSON.parse(out).filter(o => o.generate && !DONE.has(o.addr.split(' > ').pop()) && !SKIP.has(o.addr.split(' > ').pop()));
function dl(url, dest){return new Promise((res,rej)=>{https.get(url,r=>{if(r.statusCode!==200)return rej(new Error(url+' '+r.statusCode));const f=fs.createWriteStream(dest);r.pipe(f);f.on('finish',()=>f.close(()=>res()));}).on('error',rej);});}
const map = [];
for (const o of arr) {
  const id = o.addr.split(' > ').pop();
  const ext = (o.illustration.match(/\.([a-z0-9]+)$/i)||[,'jpg'])[1].toLowerCase().replace('jpeg','jpg');
  const dest = path.join(bp, id + '.' + ext);
  if (o.illustrationExists) fs.copyFileSync(o.illustrationDisk, dest);
  else await dl(o.illustration, dest);
  map.push({ id, file: dest, filename: id + '.' + ext, part: o.part });
}
fs.writeFileSync(path.resolve('.regen','blueprints.json'), JSON.stringify(map, null, 2));
console.log('staged ' + map.length + ' blueprints:');
for (const m of map) console.log('  ' + m.part.padEnd(26) + ' ' + m.filename + ' (' + fs.statSync(m.file).size + 'b)');
