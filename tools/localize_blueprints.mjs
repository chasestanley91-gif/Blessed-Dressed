#!/usr/bin/env node
// localize_blueprints.mjs — pull remote blueprint URLs into the repo.
//
// A blueprint held as a CDN URL is not usable by the pipeline: garment-image-
// director has to attach the drawing to the generation request as a hard
// geometry reference, and garment-image-qc has to Read it back to grade the
// result against it. Neither can happen over an https:// string, so every
// option whose blueprint is remote is silently unstartable — which is what the
// REMOTE_BLUEPRINT audit finding counts.
//
// The supplier's CDN is also not a durable store. These drawings are the source
// of truth for the whole catalog; keeping them in the repo is what makes the
// project reproducible.
//
// Safety:
//   - Never overwrites an existing local file. A blueprint already on disk has
//     been generated against and possibly QC-approved; replacing it silently
//     would invalidate every verdict that referenced it.
//   - Verifies each download really is an image (magic bytes) before keeping it,
//     so a CDN error page never lands on disk masquerading as a drawing.
//   - Rewrites the catalog only for URLs that downloaded and verified cleanly.
//
// Usage:
//   node tools/localize_blueprints.mjs              # dry run — show the plan
//   node tools/localize_blueprints.mjs --apply      # download + rewrite catalog
//   node tools/localize_blueprints.mjs --apply --limit=20
//
// Exit 0 = every attempted download succeeded. Exit 1 = at least one failed.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(path.join(HERE, '..'));
const OPTIONS = path.join(REPO, 'data-store', 'options');
const PUBLIC = path.join(REPO, 'public');
const DEST_ROOT = path.join(PUBLIC, 'images', 'blueprints', 'remote');
const LEDGER = path.join(PUBLIC, 'images', 'reports', 'localize-blueprints-log.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
  })
);
const LIMIT = args.limit ? Number(args.limit) : Infinity;

// Which catalog fields can legitimately hold a blueprint pointer. `image` is the
// live/displayed value and doubles as the blueprint whenever no dedicated
// techpackIllustration was ever recorded.
const BLUEPRINT_FIELDS = ['techpackIllustration', 'image'];

const isRemote = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);

// Magic-byte sniff. A CDN that answers 200 with an HTML error page is the
// failure mode that would otherwise poison the blueprint library.
function imageExt(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return '.webp';
  if (buf.subarray(0, 6).toString('ascii').startsWith('GIF8')) return '.gif';
  return null;
}

// --- collect every remote blueprint in the catalog ---------------------------
const products = {};
const jobs = new Map(); // url -> { url, dest, refs: [{productId, optionId, field}] }

for (const file of fs.readdirSync(OPTIONS).filter((f) => f.endsWith('.json'))) {
  const productId = file.replace(/\.json$/, '');
  const full = path.join(OPTIONS, file);
  const raw = fs.readFileSync(full, 'utf8');
  products[productId] = { file: full, json: JSON.parse(raw), endsWithNewline: raw.endsWith('\n'), dirty: false };

  for (const section of products[productId].json.sections || []) {
    for (const field of section.fields || []) {
      for (const option of field.options || []) {
        for (const key of BLUEPRINT_FIELDS) {
          const val = option[key];
          if (!isRemote(val)) continue;
          // One canonical local path per URL, keyed by content-independent hash
          // so two options citing the same drawing share one file.
          const stem = crypto.createHash('sha1').update(val).digest('hex').slice(0, 12);
          const base = (val.split('/').pop() || 'blueprint').split('?')[0].replace(/[^\w.-]/g, '_');
          const job = jobs.get(val) || { url: val, stem, base, refs: [] };
          job.refs.push({ productId, optionId: option.id, key, option });
          jobs.set(val, job);
        }
      }
    }
  }
}

const all = [...jobs.values()];
console.log(`localize_blueprints — ${all.length} distinct remote URL(s) across ${all.reduce((n, j) => n + j.refs.length, 0)} catalog reference(s)\n`);

if (!args.apply) {
  for (const j of all.slice(0, 15)) {
    console.log(`  ${j.url}`);
    console.log(`     <- ${j.refs.map((r) => `${r.productId}/${r.optionId}.${r.key}`).join(', ')}`);
  }
  if (all.length > 15) console.log(`  … ${all.length - 15} more`);
  console.log(`\nDry run. Re-run with --apply to download into ${path.relative(REPO, DEST_ROOT).split(path.sep).join('/')} and rewrite the catalog.`);
  process.exit(0);
}

// --- download ----------------------------------------------------------------
fs.mkdirSync(DEST_ROOT, { recursive: true });

const results = { ok: [], failed: [], skipped: [] };
let n = 0;

for (const job of all) {
  if (n >= LIMIT) break;
  n++;

  // A file already present is authoritative — never re-fetch over it.
  const existing = fs.readdirSync(DEST_ROOT).find((f) => f.startsWith(job.stem + '__'));
  let localName = existing || null;

  if (!localName) {
    try {
      const res = await fetch(job.url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = imageExt(buf);
      if (!ext) throw new Error(`not an image (${buf.length} bytes, starts ${JSON.stringify(buf.subarray(0, 16).toString('ascii'))})`);
      localName = `${job.stem}__${job.base.replace(/\.[^.]*$/, '')}${ext}`;
      fs.writeFileSync(path.join(DEST_ROOT, localName), buf);
      results.ok.push({ url: job.url, local: localName, bytes: buf.length });
      console.log(`  [${n}/${Math.min(all.length, LIMIT)}] ok    ${localName}  (${buf.length} bytes)`);
    } catch (err) {
      results.failed.push({ url: job.url, error: String(err.message || err) });
      console.log(`  [${n}/${Math.min(all.length, LIMIT)}] FAIL  ${job.url} — ${err.message || err}`);
      continue;
    }
  } else {
    results.skipped.push({ url: job.url, local: localName });
    console.log(`  [${n}/${Math.min(all.length, LIMIT)}] have  ${localName}`);
  }

  // Rewrite every catalog reference to point at the local copy.
  const localPath = `/images/blueprints/remote/${localName}`;
  for (const ref of job.refs) {
    ref.option[ref.key] = localPath;
    products[ref.productId].dirty = true;
  }
}

for (const [, p] of Object.entries(products)) {
  if (!p.dirty) continue;
  fs.writeFileSync(p.file, JSON.stringify(p.json, null, 2) + (p.endsWithNewline ? '\n' : ''), 'utf8');
  console.log(`\nwrote ${path.relative(REPO, p.file).split(path.sep).join('/')}`);
}

fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
fs.writeFileSync(
  LEDGER,
  JSON.stringify({ at: new Date().toISOString(), downloaded: results.ok.length, reused: results.skipped.length, failed: results.failed.length, results }, null, 2) + '\n',
  'utf8'
);

console.log(`\ndownloaded ${results.ok.length}, reused ${results.skipped.length}, failed ${results.failed.length}`);
console.log(`ledger: ${path.relative(REPO, LEDGER).split(path.sep).join('/')}`);
process.exit(results.failed.length ? 1 : 0);
