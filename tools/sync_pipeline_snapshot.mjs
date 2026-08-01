#!/usr/bin/env node
// sync_pipeline_snapshot.mjs — keep .claude/skills/_pipeline-snapshots/ in step
// with the live skills in ~/.claude/skills/.
//
// The three skills that produce every craft photograph live OUTSIDE this repo, in
// the operator's personal skills directory, which is not a git repository at all.
// So the logic deciding what the catalog's images depict has no history: a change
// leaves no diff and no way to tell which build produced which image. The
// snapshot directory exists to fix that, and its README asks the operator to
// "refresh these copies whenever the skills change".
//
// That instruction is a manual step, and manual steps are the exact failure mode
// this project keeps hitting — a rule that is written down but does not reach the
// place it has to act. It already drifted: the waistcoat NO-TIE fix was made live
// and the snapshot went stale the moment it was saved.
//
// So: --check makes divergence a mechanical, non-zero exit rather than something
// to remember, and plain invocation refreshes.
//
// Usage:
//   node tools/sync_pipeline_snapshot.mjs --check    report drift, exit 1 if any
//   node tools/sync_pipeline_snapshot.mjs            copy live -> snapshot
//   node tools/sync_pipeline_snapshot.mjs --reverse  copy snapshot -> live (restore)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SNAP = path.join(ROOT, '.claude/skills/_pipeline-snapshots');
const LIVE = path.join(os.homedir(), '.claude/skills');
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const REVERSE = argv.includes('--reverse');

if (!fs.existsSync(SNAP)) { console.error(`no snapshot directory at ${SNAP}`); process.exit(2); }

const SKILLS = fs.readdirSync(SNAP, { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name);

// Compare on CONTENT WITH LINE ENDINGS NORMALISED. The repo checks out CRLF on
// this machine while the live skills are LF, so a raw byte compare reports every
// file as divergent and the signal is lost entirely.
const norm = (b) => b.toString('utf8').replace(/\r\n/g, '\n');
const hash = (p) => crypto.createHash('sha1').update(norm(fs.readFileSync(p))).digest('hex');

const walk = (dir, base = dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
};

const drift = { changed: [], onlyLive: [], onlySnap: [] };

for (const skill of SKILLS) {
  const snapDir = path.join(SNAP, skill);
  const liveDir = path.join(LIVE, skill);
  if (!fs.existsSync(liveDir)) { drift.onlySnap.push(`${skill}/ (whole skill missing from live)`); continue; }

  const snapFiles = new Set(walk(snapDir));
  const liveFiles = new Set(walk(liveDir).filter((f) => !/node_modules|\.git/.test(f)));

  for (const f of snapFiles) {
    if (!liveFiles.has(f)) { drift.onlySnap.push(`${skill}/${f}`); continue; }
    if (hash(path.join(snapDir, f)) !== hash(path.join(liveDir, f))) drift.changed.push(`${skill}/${f}`);
  }
  // Only report live-only files that look like pipeline logic; the personal
  // skills dir holds plenty the snapshot was never meant to mirror.
  for (const f of liveFiles) {
    if (!snapFiles.has(f) && /\.(mjs|js|md|json)$/.test(f)) drift.onlyLive.push(`${skill}/${f}`);
  }
}

const total = drift.changed.length + drift.onlyLive.length + drift.onlySnap.length;

if (CHECK) {
  if (!total) { console.log(`pipeline snapshot is in step with ~/.claude/skills (${SKILLS.length} skills)`); process.exit(0); }
  console.log(`\npipeline snapshot has DRIFTED from the live skills — ${total} file(s)\n`);
  for (const f of drift.changed) console.log(`  changed     ${f}`);
  for (const f of drift.onlyLive) console.log(`  live only   ${f}   (never snapshotted)`);
  for (const f of drift.onlySnap) console.log(`  snap only   ${f}   (deleted live?)`);
  console.log('\nThe live skills are the runtime. Run without --check to record them,');
  console.log('or --reverse to restore the snapshot over a live change you did not intend.');
  process.exit(1);
}

let copied = 0;
const src = REVERSE ? SNAP : LIVE;
const dst = REVERSE ? SNAP : SNAP; // default direction writes into the snapshot
for (const f of [...drift.changed, ...(REVERSE ? [] : drift.onlyLive)]) {
  const from = path.join(REVERSE ? SNAP : LIVE, f);
  const to = path.join(REVERSE ? LIVE : SNAP, f);
  if (!fs.existsSync(from)) continue;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`  ${REVERSE ? 'restored' : 'recorded'}  ${f}`);
  copied += 1;
}
console.log(copied ? `\n${copied} file(s) synced ${REVERSE ? 'snapshot -> live' : 'live -> snapshot'}.` : '\nalready in step; nothing to do.');
void src; void dst;
