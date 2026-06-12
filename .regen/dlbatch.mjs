import fs from 'node:fs'; import https from 'node:https'; import path from 'node:path';
const tr = process.argv[2];
const data = JSON.parse(fs.readFileSync(tr, 'utf8'));
const map = {
 'c30412d8':'ext-curved','26e613af':'ext-no-btn','ff7fb67c':'ext-no-hook','4f04e0fd':'ext-sharp-double',
 '04d8fea6':'ext-round-double','d94e4dd3':'ext-square-double','b14f939f':'ext-sharp-dbl-hooks','dd3d5c1d':'ext-round-dbl-hooks',
 'b0d64f90':'ext-sharp-dbl-btn-hook','e4f571f0':'ext-round-dbl-btn-hook','ab2047c0':'ext-double-ext','6b2e74d4':'ext-hw-buckle',
 '4a76997c':'adjuster-none','fb182f01':'adjuster-left','a932ca65':'adjuster-buckle-loop','658f64ea':'waist-detail-square-tab',
 '71e4879c':'waist-detail-pointed-tab','41f5f682':'loops-standard','17203174':'loops-no','2b3fb501':'loops-passant',
 'd109f520':'loops-20cm','6c6db4f9':'loops-one-right','756462f8':'loops-x-front',
};
const base = path.resolve('.regen','out');
function dl(url,dest){return new Promise((res,rej)=>{https.get(url,r=>{if(r.statusCode!==200)return rej(new Error(r.statusCode));const o=fs.createWriteStream(dest);r.pipe(o);o.on('finish',()=>o.close(()=>res()));}).on('error',rej);});}
let n=0; const got=[];
for (const it of data.items||[]) {
  const pref = (it.id||'').slice(0,8);
  const id = map[pref];
  if (!id) continue;
  if (it.status!=='completed' || !it.results?.rawUrl) { console.log('SKIP '+id+' status='+it.status); continue; }
  await dl(it.results.rawUrl, path.join(base, id+'.png'));
  got.push(id); n++;
}
console.log('downloaded '+n+': '+got.join(', '));
const missing = Object.values(map).filter(v=>!got.includes(v));
if (missing.length) console.log('MISSING ('+missing.length+'): '+missing.join(', '));
