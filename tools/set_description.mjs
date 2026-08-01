#!/usr/bin/env node
// set_description.mjs — rewrite an option's description by OPTION ID, in place,
// without reformatting the file.
//
// WHY THIS EXISTS, twice over.
//
// 1. Blind string replacement is unsafe here. Sibling options routinely carry
//    byte-identical prose — lp-slanted-flap-55 and -65 did, as did
//    lp-straight-jetted-40 and lp-straight-jetted. Replacing "the old text" with
//    the 5.5 cm version rewrote the 6.5 cm option too. That happened, and it is
//    exactly the class of silent cross-contamination that a catalog of 2862
//    options cannot absorb.
//
// 2. A JSON round-trip is also unsafe. Measured: shirt/trousers/vest re-serialise
//    losslessly, but sport-coat, suit-2pc and suit-3pc do NOT — they differ by
//    4-10 KB, so parse-mutate-stringify would silently reformat thousands of
//    unrelated lines and bury the real change. Those three are precisely the
//    files that hold the jacket options.
//
// So: locate `"id": "<optionId>"`, walk forward to that object's own
// `"description"`, and splice. Refuses if another `"id":` intervenes, which would
// mean the option has no description of its own and we are about to overwrite a
// neighbour's.
//
// Usage:
//   node tools/set_description.mjs --id lp-patch --text "New description."
//   node tools/set_description.mjs --file edits.json     [{id, text}, ...]
//   ... add --dry-run to preview counts without writing.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'data-store/options');
const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const DRY = argv.includes('--dry-run');

let edits;
if (arg('--file')) edits = JSON.parse(fs.readFileSync(arg('--file'), 'utf8'));
else if (arg('--id')) edits = [{ id: arg('--id'), text: arg('--text') }];
else { console.error('need --id/--text or --file'); process.exit(2); }

for (const e of edits) {
  if (!e.id || typeof e.text !== 'string' || !e.text.trim()) {
    console.error(`bad edit entry: ${JSON.stringify(e)}`); process.exit(2);
  }
}

// Find the end of a JSON string literal that starts at `start` (the opening quote).
function endOfString(text, start) {
  for (let i = start + 1; i < text.length; i += 1) {
    if (text[i] === '\\') { i += 1; continue; }
    if (text[i] === '"') return i;
  }
  return -1;
}

const counts = Object.fromEntries(edits.map((e) => [e.id, 0]));
const problems = [];

for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.json')) continue;
  const p = path.join(DIR, f);
  let text = fs.readFileSync(p, 'utf8');
  let changed = 0;

  for (const e of edits) {
    const needle = `"id": ${JSON.stringify(e.id)}`;
    let from = 0;
    for (;;) {
      const at = text.indexOf(needle, from);
      if (at < 0) break;
      // guard: `"id": "lp-patch"` must not match `"lp-patch-flap"` — JSON.stringify
      // includes the closing quote, so the match is already exact.
      const descAt = text.indexOf('"description":', at);
      const nextId = text.indexOf('"id":', at + needle.length);
      if (descAt < 0 || (nextId >= 0 && nextId < descAt)) {
        problems.push(`${f}: ${e.id} has no description before the next "id:" — skipped`);
        from = at + needle.length;
        continue;
      }
      const q0 = text.indexOf('"', descAt + '"description":'.length);
      const q1 = endOfString(text, q0);
      if (q0 < 0 || q1 < 0) { problems.push(`${f}: ${e.id} unterminated description string`); from = at + needle.length; continue; }

      const replacement = JSON.stringify(e.text);
      text = text.slice(0, q0) + replacement + text.slice(q1 + 1);
      counts[e.id] += 1; changed += 1;
      from = q0 + replacement.length;
    }
  }

  if (changed && !DRY) fs.writeFileSync(p, text);
  if (changed) console.log(`${DRY ? '[dry] ' : ''}${path.relative(ROOT, p).split(path.sep).join('/')}: ${changed} description(s)`);
}

// Validate every file still parses, and that each edit actually landed.
let bad = 0;
for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.json')) continue;
  try { JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (err) { console.error(`INVALID JSON: ${f} — ${err.message}`); bad += 1; }
}

console.log('\nper-option counts:');
for (const [k, v] of Object.entries(counts)) console.log(`  ${v === 0 ? 'MISS' : ' ok '}  ${k.padEnd(26)} ${v}`);
for (const pr of problems) console.log(`  ! ${pr}`);

const missed = Object.entries(counts).filter(([, v]) => v === 0).map(([k]) => k);
if (missed.length) { console.error(`\n${missed.length} id(s) never matched: ${missed.join(', ')}`); process.exit(1); }
if (bad) { console.error(`\n${bad} file(s) no longer parse — RESTORE FROM GIT`); process.exit(1); }
console.log(`\n${Object.values(counts).reduce((s, x) => s + x, 0)} description(s) ${DRY ? 'would be ' : ''}rewritten across ${edits.length} option(s); all files parse.`);
