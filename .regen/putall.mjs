import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
const ups = JSON.parse(fs.readFileSync('.regen/uploads.json', 'utf8'));
const bp = path.resolve('.regen', 'bp');
function put(u) {
  return new Promise((res) => {
    const file = path.join(bp, u.filename);
    const body = fs.readFileSync(file);
    const ct = u.filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const url = new URL(u.upload_url);
    const req = https.request({ method: 'PUT', hostname: url.hostname, path: url.pathname + url.search,
      headers: { 'Content-Type': ct, 'Content-Length': body.length } },
      r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res({ id:u.id, status:r.statusCode })); });
    req.on('error', e => res({ id:u.id, status:'ERR '+e.message }));
    req.end(body);
  });
}
const results = [];
for (const u of ups) results.push(await put(u));
const bad = results.filter(r => r.status !== 200);
console.log('PUT ok: ' + results.filter(r=>r.status===200).length + '/' + results.length);
if (bad.length) console.log('FAILED: ' + bad.map(b=>b.id+'='+b.status).join(', '));
