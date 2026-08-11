#!/usr/bin/env node
/**
 * catalog_invariants.mjs — the gate that runs after every bulk catalog edit.
 *
 * A runaway agent once deleted 96 craft options and stripped 409 illustration
 * pointers while under an explicit read-only instruction. An instruction is not
 * an enforcement mechanism; this file is. Exit 1 on any violation.
 *
 * Checks
 *   1. Option count per file matches the snapshot.
 *   2. ADDRESS SET equality (product|section|field|id) — catches a deletion that
 *      a count check would miss because something else was added.
 *   3. Additions only: every key present in the snapshot is still present with
 *      the same non-empty value. No removals, no blank-outs.
 *   4. `illustration` is drawn only from that option's own techpackIllustration
 *      or image — the tooling cannot invent a path.
 *   5. Every referenced local path exists on disk.
 *   6. Every referenced local path is deploy-included (not gitignored, not
 *      matched by .vercelignore). This is the check that would have caught the
 *      622 PNG paths that 404'd in production.
 *   7. `illustration` is never a photo path and never an .svg glyph.
 *
 * Usage
 *   node tools/catalog_invariants.mjs --snapshot=data-store/options.backup-2026-08-06
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const PUBLIC = path.join(REPO, 'public');

const snapArg = process.argv.find((a) => a.startsWith('--snapshot='));
const SNAPSHOT = snapArg ? path.resolve(REPO, snapArg.split('=')[1]) : null;

/** Paths known broken before this work began; a THIRD one must fail the gate. */
const KNOWN_MISSING = new Set([
  '/images/ultra/ultra-thin-half-OIP.jpg',
  '/images/opt/opt-1779526586804-174107443891659.webp',
]);

const PHOTO_DIR = /^\/images\/(generated|ai)\//i;
const GLYPH = /\.svg(\?|#|$)/i;
const ASSET_KEYS = ['image', 'illustration', 'techpackIllustration', 'realImage', 'aiImage'];

const failures = [];
const fail = (msg) => failures.push(msg);

function loadCatalog(dir) {
  const out = new Map(); // addr -> option
  const perFile = {};
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const cfg = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const product = file.replace(/\.json$/, '');
    let n = 0;
    for (const s of cfg.sections ?? []) {
      for (const f of s.fields ?? []) {
        for (const o of f.options ?? []) {
          out.set(`${product}|${s.id ?? s.label}|${f.id}|${o.id}`, o);
          n += 1;
        }
      }
    }
    perFile[file] = n;
  }
  return { options: out, perFile };
}

const current = loadCatalog(OPTIONS_DIR);

// ── 1 + 2 + 3 — only when a snapshot is supplied ────────────────────────────
// NO SNAPSHOT USED TO MEAN NO CHECK, AND THE GATE STILL SAID "all invariants hold".
//
// Measured 2026-08-08: shirt|collar|lapel|collar-point-70 was lost from the
// catalog — 2862 options became 2861 — and this tool printed a clean pass,
// because the count and address-set checks only ran when --snapshot= was
// supplied and nothing supplies it by default. A gate whose most important
// check is opt-in is not a gate.
//
// git HEAD is always available and is a truthful baseline, so it is used when no
// explicit snapshot is given. Additions are fine; a LOSS is never fine.
if (!SNAPSHOT) {
  const gitShow = (f) => {
    try {
      return execFileSync('git', ['show', `HEAD:data-store/options/${f}`],
        { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch { return null; }
  };
  const baseline = new Map();
  let baseFiles = 0;
  for (const f of fs.readdirSync(OPTIONS_DIR).filter((x) => x.endsWith('.json'))) {
    const raw = gitShow(f);
    if (raw === null) continue;
    baseFiles += 1;
    const product = f.replace(/\.json$/, '');
    let cfg;
    try { cfg = JSON.parse(raw); } catch { continue; }
    for (const s of cfg.sections ?? []) {
      for (const fl of s.fields ?? []) {
        for (const o of fl.options ?? []) baseline.set(`${product}|${s.id ?? s.label}|${fl.id}|${o.id}`, true);
      }
    }
  }
  if (!baseFiles) {
    fail('no baseline available: --snapshot was not given and git HEAD could not be read. ' +
         'Refusing to report a pass without comparing the catalog against anything.');
  } else {
    const lost = [...baseline.keys()].filter((a) => !current.options.has(a));
    console.log(`baseline: git HEAD — ${baseline.size} option(s) across ${baseFiles} file(s)`);
    if (lost.length) {
      fail(`CRAFT OPTIONS LOST vs git HEAD: ${lost.length}. A craft option must never disappear. ` +
           lost.slice(0, 10).join(', ') + (lost.length > 10 ? ` …and ${lost.length - 10} more` : ''));
    }
    const added = current.options.size - (baseline.size - lost.length);
    if (added) console.log(`  (${added} option(s) added since HEAD — additions are permitted)`);
  }
}

if (SNAPSHOT && fs.existsSync(SNAPSHOT)) {
  const snap = loadCatalog(SNAPSHOT);

  for (const [file, n] of Object.entries(snap.perFile)) {
    if (current.perFile[file] !== n) fail(`count changed in ${file}: ${n} -> ${current.perFile[file]}`);
  }

  for (const addr of snap.options.keys()) {
    if (!current.options.has(addr)) fail(`OPTION LOST: ${addr}`);
  }
  for (const addr of current.options.keys()) {
    if (!snap.options.has(addr)) fail(`OPTION APPEARED (unexpected): ${addr}`);
  }

  for (const [addr, before] of snap.options) {
    const after = current.options.get(addr);
    if (!after) continue;
    for (const [k, v] of Object.entries(before)) {
      if (v === undefined || v === null || v === '') continue;
      const now = after[k];
      if (now === undefined || now === null || now === '') { fail(`FIELD EMPTIED: ${addr}.${k}`); continue; }
      if (typeof v === 'string' && now !== v) fail(`FIELD CHANGED: ${addr}.${k}`);
      if (Array.isArray(v) && (!Array.isArray(now) || now.length < v.length)) fail(`ARRAY SHRANK: ${addr}.${k}`);
    }
  }
} else if (SNAPSHOT) {
  fail(`snapshot not found: ${SNAPSHOT}`);
}

// Baseline asset values, read straight from git HEAD, for the provenance check
// below. The address-set baseline above stores only presence flags, and
// provenance needs the values themselves. A failure to read HEAD leaves this
// empty, which makes the check no weaker than it was before — it only ever
// forgives, never accuses.
const baseAssets = new Map();
try {
  for (const f of fs.readdirSync(OPTIONS_DIR).filter((x) => x.endsWith('.json'))) {
    const raw = execFileSync('git', ['show', `HEAD:data-store/options/${f}`],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const product = f.replace(/\.json$/, '');
    const cfg = JSON.parse(raw);
    for (const s of cfg.sections ?? []) {
      for (const fl of s.fields ?? []) {
        for (const o of fl.options ?? []) {
          baseAssets.set(`${product}|${s.id ?? s.label}|${fl.id}|${o.id}`,
            { illustration: o.illustration, techpackIllustration: o.techpackIllustration, image: o.image });
        }
      }
    }
  }
} catch { /* no baseline available; the check falls back to present-tense only */ }

// ── 4 + 5 + 7 — per-option asset sanity ────────────────────────────────────
const referenced = new Set();
for (const [addr, o] of current.options) {
  if (o.illustration) {
    // Provenance is about where the value CAME FROM, not what still sits beside
    // it today. `illustration` is legitimate if it matched one of the option's
    // own asset values either now or in the baseline.
    //
    // Measured 2026-08-10: unwiring 788 unapproved renders deleted `image` on
    // options where `illustration === image` and no techpackIllustration
    // existed, and this check then called 235 untouched illustrations
    // "invented". The illustrations had not changed at all — only the field
    // they were being compared against had gone. A provenance rule that reads
    // only the post-edit record cannot tell a forged value from an orphaned one.
    const base = baseAssets.get(addr);
    const legitimate = o.illustration === o.techpackIllustration
      || o.illustration === o.image
      || (base && (o.illustration === base.illustration
        || o.illustration === base.techpackIllustration
        || o.illustration === base.image));
    if (!legitimate) fail(`ILLUSTRATION INVENTED: ${addr} -> ${o.illustration}`);
    if (PHOTO_DIR.test(o.illustration)) fail(`ILLUSTRATION IS A PHOTO: ${addr} -> ${o.illustration}`);
    if (GLYPH.test(o.illustration)) fail(`ILLUSTRATION IS AN SVG GLYPH: ${addr} -> ${o.illustration}`);
  }
  for (const k of ASSET_KEYS) {
    const v = o[k];
    if (typeof v === 'string' && v.startsWith('/')) referenced.add(v);
  }
  for (const v of [...(o.photos ?? []), ...(o.images ?? [])]) {
    if (typeof v === 'string' && v.startsWith('/')) referenced.add(v);
  }
}

const missing = [];
for (const rel of referenced) {
  const disk = path.join(PUBLIC, decodeURIComponent(rel.replace(/^\//, '')).split('?')[0]);
  if (!fs.existsSync(disk)) missing.push(rel);
}
for (const rel of missing) {
  if (!KNOWN_MISSING.has(rel)) fail(`FILE MISSING ON DISK: ${rel}`);
}

// ── 6 — deploy inclusion ───────────────────────────────────────────────────
const present = [...referenced].filter((r) => !missing.includes(r));

// gitignore
try {
  const rels = present.map((r) => 'public' + r.split('?')[0]).join('\n');
  const out = execFileSync('git', ['check-ignore', '--stdin'], { cwd: REPO, input: rels, encoding: 'utf8' });
  for (const line of out.split('\n').filter(Boolean)) fail(`GITIGNORED (won't deploy): /${line.replace(/^public/, '')}`);
} catch (err) {
  // git check-ignore exits 1 when NOTHING matches — that is the success case.
  if (err.status !== 1) fail(`git check-ignore failed: ${err.message}`);
}

// .vercelignore
const vercelIgnore = path.join(REPO, '.vercelignore');
if (fs.existsSync(vercelIgnore)) {
  const patterns = fs.readFileSync(vercelIgnore, 'utf8')
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const matchers = patterns.map((p) => {
    const rx = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, ' ').replace(/\*/g, '[^/]*').replace(/ /g, '.*');
    return { p, re: new RegExp('^' + rx + '(/|$)') };
  });
  for (const rel of present) {
    const p = 'public' + rel.split('?')[0];
    const hit = matchers.find((m) => m.re.test(p));
    if (hit) fail(`VERCELIGNORED (won't deploy): ${rel}  [pattern: ${hit.p}]`);
  }
}

// ── report ─────────────────────────────────────────────────────────────────
const total = [...current.options].length;
console.log(`options ${total} | referenced local assets ${referenced.size} | missing ${missing.length} (${KNOWN_MISSING.size} allowlisted)`);
if (failures.length) {
  console.error(`\nINVARIANT FAILURES (${failures.length}):`);
  for (const f of failures.slice(0, 40)) console.error('  ' + f);
  if (failures.length > 40) console.error(`  … ${failures.length - 40} more`);
  process.exit(1);
}
console.log('all invariants hold');
