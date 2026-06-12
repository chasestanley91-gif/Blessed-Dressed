import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
const skill = os.homedir() + '/.claude/skills/blessed-dressed-craft-photo-generator/scripts/build_prompt.mjs';
const ups = JSON.parse(fs.readFileSync('.regen/uploads.json', 'utf8'));
const mid = Object.fromEntries(ups.map(u => [u.id, u.media_id]));
const order = [
  ['A', ['ext-len-5','ext-len-55','ext-len-6','ext-len-65','ext-len-7','ext-len-13','ext-straight','ext-pointed']],
  ['B', ['ext-curved','ext-no-btn','ext-no-hook','ext-sharp-double','ext-round-double','ext-square-double','ext-sharp-dbl-hooks','ext-round-dbl-hooks']],
  ['C', ['ext-sharp-dbl-btn-hook','ext-round-dbl-btn-hook','ext-double-ext','ext-hw-buckle','adjuster-none','adjuster-left','adjuster-buckle-loop','waist-detail-square-tab']],
  ['D', ['waist-detail-pointed-tab','loops-standard','loops-no','loops-passant','loops-20cm','loops-one-right','loops-x-front']],
];
for (const [w, ids] of order) {
  const arr = [];
  for (const id of ids) {
    const o = JSON.parse(execFileSync('node', [skill, '--product=trousers', '--option=' + id, '--json'], { encoding: 'utf8', maxBuffer: 1e8 }));
    arr.push({ id, media_id: mid[id], tokens: o.requiredTokens, prompt: o.prompt });
  }
  fs.writeFileSync('.regen/gen-' + w + '.json', JSON.stringify(arr, null, 2));
  console.log('wave ' + w + ': ' + arr.map(a=>a.id).join(', '));
}
