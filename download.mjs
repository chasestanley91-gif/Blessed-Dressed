import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
const base = path.resolve('.regen');
fs.mkdirSync(path.join(base, 'bp'), { recursive: true });
fs.mkdirSync(path.join(base, 'out'), { recursive: true });
const jobs = [
  ['https://aws-static-webp.kutetailor.com/comm/process/craft/3414.jpeg', path.join(base, 'bp', 'ext-square-dbl-hooks.jpeg')],
  ['https://aws-static-webp.kutetailor.com/comm/process/craft/342D.jpeg', path.join(base, 'bp', 'ext-square-dbl-btn-hook.jpeg')],
  ['https://d8j0ntlcm91z4.cloudfront.net/user_3DyD2E81EIviG1HGaeP20VNagJz/hf_20260610_131437_1f1b248b-b73d-42c0-88d1-163388fa2d1e.png', path.join(base, 'out', 'ext-len-15.png')],
];
function dl([url, out]) {
  return new Promise((res, rej) => {
    https.get(url, r => {
      if (r.statusCode !== 200) return rej(new Error(url + ' -> ' + r.statusCode));
      const f = fs.createWriteStream(out);
      r.pipe(f); f.on('finish', () => f.close(() => res(path.basename(out) + ' (' + fs.statSync(out).size + 'b)')));
    }).on('error', rej);
  });
}
for (const j of jobs) console.log(await dl(j));
