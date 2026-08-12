#!/usr/bin/env node
/**
 * reinterpret_changed_illustrations.mjs — re-run stage 1 for every craft whose
 * illustration was replaced under it.
 *
 * promote_owner_references.mjs drops an `illustration-changed.json` marker beside
 * any spec.json that was extracted from a drawing the owner has since replaced.
 * A spec pins its source drawing and a prompt is built from the spec, so
 * generating without re-extracting would shoot the craft against the rejected
 * drawing again. This clears the markers by actually re-deriving the spec.
 *
 * Stage boundaries are respected: this only INVOKES tech-pack-interpreter's own
 * extractor. It never edits a spec itself, and it never touches prompt.json —
 * garment-image-director owns that, and it rebuilds from the fresh spec.
 *
 *   node tools/reinterpret_changed_illustrations.mjs           # list the work
 *   node tools/reinterpret_changed_illustrations.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PIPE = path.join(REPO, '.craft-pipeline');
const SKILLS = process.env.CLAUDE_SKILLS_DIR || 'C:/Users/ChaseStanley/.claude/skills';
const EXTRACT = path.join(SKILLS, 'tech-pack-interpreter', 'scripts', 'extract_spec.mjs');
const APPLY = process.argv.includes('--apply');

if (!fs.existsSync(EXTRACT)) {
  console.error(`tech-pack-interpreter extractor not found: ${EXTRACT}`);
  console.error('set CLAUDE_SKILLS_DIR if the skills live elsewhere.');
  process.exit(2);
}

const markers = [];
for (const product of fs.existsSync(PIPE) ? fs.readdirSync(PIPE) : []) {
  const pdir = path.join(PIPE, product);
  if (!fs.statSync(pdir).isDirectory()) continue;
  for (const optionId of fs.readdirSync(pdir)) {
    const m = path.join(pdir, optionId, 'illustration-changed.json');
    if (fs.existsSync(m)) {
      try { markers.push({ product, optionId, marker: m, ...JSON.parse(fs.readFileSync(m, 'utf8')) }); }
      catch { markers.push({ product, optionId, marker: m, unreadable: true }); }
    }
  }
}

console.log(`crafts with a replaced illustration: ${markers.length}`);
if (!markers.length) { console.log('nothing to re-interpret.'); process.exit(0); }

if (!APPLY) {
  for (const m of markers.slice(0, 40)) console.log(`  ${m.product}/${m.optionId}  ${m.specWasBuiltFrom || '?'} -> ${m.illustrationNow || '?'}`);
  if (markers.length > 40) console.log(`  … ${markers.length - 40} more`);
  console.log('\ndry run — re-run with --apply to re-extract each spec.');
  process.exit(0);
}

const ok = [], failed = [];
for (const m of markers) {
  try {
    const out = execFileSync(process.execPath, [EXTRACT, `--product=${m.product}`, `--option=${m.optionId}`, '--write'],
      { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    // Only clear the marker once a spec exists that names the new drawing.
    const spec = path.join(PIPE, m.product, m.optionId, 'spec.json');
    const now = fs.existsSync(spec) ? JSON.parse(fs.readFileSync(spec, 'utf8'))?.illustration?.path : null;
    if (now && m.illustrationNow && now === m.illustrationNow) {
      fs.unlinkSync(m.marker);
      ok.push(`${m.product}/${m.optionId}`);
    } else {
      failed.push({ craft: `${m.product}/${m.optionId}`, why: `spec still points at ${now || '(none)'}`, out: out.slice(-300) });
    }
  } catch (e) {
    failed.push({ craft: `${m.product}/${m.optionId}`, why: (e.stderr || e.message || '').slice(-300) });
  }
}

console.log(`re-extracted  : ${ok.length}`);
console.log(`still stale    : ${failed.length}`);
for (const f of failed.slice(0, 20)) console.log(`  FAIL ${f.craft} — ${f.why}`);
if (failed.length) {
  console.log('\nmarkers for the failures were left in place on purpose — they are the'
    + '\nrecord that those crafts must not be generated yet.');
  process.exit(1);
}
