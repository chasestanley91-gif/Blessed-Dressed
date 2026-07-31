#!/usr/bin/env node
/**
 * promote_factory_assets.mjs — move catalog-referenced images out of the
 * dev-only scrape tree and into a tracked, deployable directory.
 *
 * WHY
 * ---
 * public/images/factory/ holds ~8,073 kutetailor reference images and is
 * excluded twice over:
 *
 *   .gitignore    /public/images/factory/
 *   .vercelignore public/images/factory
 *                 ("dev-only scraping reference images … not served in the app")
 *
 * That comment stopped being true. data-store/options/*.json points real craft
 * options at /images/factory/kute/... — 78 distinct files, 332 references. They
 * exist only on the machine that scraped them, so on a fresh clone, on CI and in
 * production every one of them 404s, while passing locally because the files are
 * sitting right there on disk. tests/repo/deploy-assets.spec.ts asserts this.
 *
 * The fix is to promote the referenced files into public/images/blueprints/factory/
 * (tracked and shipped) and repoint the catalog — the same move
 * tools/localize_blueprints.mjs already performs for remote CDN URLs. Nothing is
 * deleted from the scrape tree; it stays as the working set.
 *
 * USAGE
 *   node tools/promote_factory_assets.mjs              # dry run — show the plan
 *   node tools/promote_factory_assets.mjs --apply      # copy + repoint
 *   node tools/promote_factory_assets.mjs --apply --limit=10
 *
 * Exit 0 = every referenced file resolved; 1 = at least one is missing on disk
 * (which means it cannot be promoted and the reference is already broken).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(REPO, 'public');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const DEST_REL = 'images/blueprints/factory';
const DEST_ABS = path.join(PUBLIC, DEST_REL);
const LEDGER = path.join(PUBLIC, 'images', 'reports', 'promote-factory-log.json');

const SOURCE_PREFIX = '/images/factory/';
const FIELDS = ['image', 'techpackIllustration'];

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

/** Magic-byte sniff, so a stray HTML error page never lands as a drawing. */
function imageKind(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.toString('binary', 1, 4) === 'PNG') return 'png';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buf.length > 6 && buf.toString('ascii', 0, 3) === 'GIF') return 'gif';
  return null;
}

const sanitize = (s) => s.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

function loadCatalog() {
  const out = {};
  for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
    const p = path.join(OPTIONS_DIR, file);
    const raw = fs.readFileSync(p, 'utf8');
    out[file] = { path: p, json: JSON.parse(raw), endsWithNewline: raw.endsWith('\n') };
  }
  return out;
}

function eachOption(node, visit) {
  if (Array.isArray(node)) return node.forEach((n) => eachOption(n, visit));
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node.options)) node.options.forEach((o) => o && typeof o === 'object' && visit(o));
  for (const v of Object.values(node)) eachOption(v, visit);
}

const catalog = loadCatalog();

// ── collect every distinct factory path the catalog references ───────────────
const refs = new Map(); // web path -> [{file, optionId, field}]
for (const [file, { json }] of Object.entries(catalog)) {
  eachOption(json, (opt) => {
    for (const field of FIELDS) {
      const v = opt[field];
      if (typeof v === 'string' && v.startsWith(SOURCE_PREFIX)) {
        if (!refs.has(v)) refs.set(v, []);
        refs.get(v).push({ file, optionId: opt.id ?? null, field });
      }
    }
  });
}

const plan = [];
const missing = [];

for (const [webPath, users] of refs) {
  if (plan.length >= LIMIT) break;
  const diskPath = path.join(PUBLIC, decodeURIComponent(webPath).replace(/^\//, ''));
  if (!fs.existsSync(diskPath)) {
    missing.push({ webPath, users: users.length });
    continue;
  }
  const buf = fs.readFileSync(diskPath);
  const kind = imageKind(buf);
  if (!kind) {
    missing.push({ webPath, users: users.length, reason: 'not a recognisable image' });
    continue;
  }
  // Key on the SOURCE PATH so one file promotes once, however many options cite it.
  const base = sanitize(path.basename(decodeURIComponent(webPath)).replace(/\.[^.]+$/, ''));
  const name = `${sha1(webPath).slice(0, 12)}__${base}.${kind}`;
  plan.push({
    from: webPath,
    to: `/${DEST_REL}/${name}`,
    destAbs: path.join(DEST_ABS, name),
    bytes: buf.length,
    kind,
    users,
  });
}

// ── report ───────────────────────────────────────────────────────────────────
const totalRefs = [...refs.values()].reduce((a, b) => a + b.length, 0);
console.log(
  `promote_factory_assets — ${refs.size} distinct file(s) referenced by ${totalRefs} catalog field(s)\n`
);
for (const p of plan.slice(0, 12)) {
  console.log(`  ${p.from}`);
  console.log(`    -> ${p.to}  (${(p.bytes / 1024).toFixed(0)} KB, ${p.users.length} reference(s))`);
}
if (plan.length > 12) console.log(`  … ${plan.length - 12} more`);
if (missing.length) {
  console.log('\n  NOT ON DISK — already broken, cannot promote:');
  for (const m of missing) console.log(`    ${m.webPath} (${m.users} reference(s))${m.reason ? ' — ' + m.reason : ''}`);
}

if (!APPLY) {
  console.log(`\nDry run. Re-run with --apply to copy ${plan.length} file(s) and repoint ${totalRefs} reference(s).`);
  process.exit(missing.length ? 1 : 0);
}

// ── apply ────────────────────────────────────────────────────────────────────
fs.mkdirSync(DEST_ABS, { recursive: true });
let copied = 0;
let reused = 0;
for (const p of plan) {
  if (fs.existsSync(p.destAbs)) {
    reused += 1; // never overwrite — an on-disk asset may already back a QC verdict
  } else {
    fs.copyFileSync(path.join(PUBLIC, decodeURIComponent(p.from).replace(/^\//, '')), p.destAbs);
    copied += 1;
  }
}

const rewrite = new Map(plan.map((p) => [p.from, p.to]));
const touched = new Set();
let repointed = 0;
for (const [file, entry] of Object.entries(catalog)) {
  eachOption(entry.json, (opt) => {
    for (const field of FIELDS) {
      const v = opt[field];
      if (typeof v === 'string' && rewrite.has(v)) {
        opt[field] = rewrite.get(v);
        repointed += 1;
        touched.add(file);
      }
    }
  });
}
for (const file of touched) {
  const e = catalog[file];
  fs.writeFileSync(e.path, JSON.stringify(e.json, null, 2) + (e.endsWithNewline ? '\n' : ''));
  console.log(`wrote data-store/options/${file}`);
}

fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
fs.writeFileSync(
  LEDGER,
  JSON.stringify(
    {
      at: new Date().toISOString(),
      by: 'tools/promote_factory_assets.mjs',
      copied,
      reused,
      repointed,
      missing,
      files: plan.map(({ from, to, bytes, kind, users }) => ({ from, to, bytes, kind, users })),
    },
    null,
    2
  ) + '\n'
);

console.log(`\ncopied ${copied}, reused ${reused}, repointed ${repointed} catalog reference(s)`);
console.log(`ledger: ${path.relative(REPO, LEDGER).split(path.sep).join('/')}`);
console.log('Re-run: node tools/project_state.mjs');
process.exit(missing.length ? 1 : 0);
