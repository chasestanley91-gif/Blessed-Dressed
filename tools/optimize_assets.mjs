#!/usr/bin/env node
/**
 * optimize_assets.mjs — build web-serveable derivatives of the generated craft
 * photos, without breaking the QC provenance chain.
 *
 * WHY
 * ---
 * public/images/generated holds 578 PNGs totalling ~1.14 GB (median 2.0 MB,
 * max 9.3 MB), and public/ is deliberately NOT in .vercelignore. The builder
 * renders these through a plain <img> with no width constraint, so selecting a
 * collar style can pull several megabytes for a thumbnail. At the finished
 * catalog size (~1,140 images) that is ~2.3 GB shipped to Vercel.
 *
 * THE PROVENANCE PROBLEM
 * ----------------------
 * publish_approved.mjs proves "the shipped pixels are the pixels QC graded" by
 * SHA-1 byte-identity between public/images/generated/<id>.png and the graded
 * .craft-pipeline/<product>/<option>/candidate-<attempt>.png. A lossy
 * derivative can never be byte-identical, so converting in place would destroy
 * that guarantee.
 *
 * This tool therefore does NOT touch the PNG master or that gate. It writes a
 * sibling .webp and records, in the manifest, the SHA-1 of the master it was
 * derived from. The chain becomes:
 *
 *   qc.json(attempt N)
 *     -> candidate-N.png            (SHA-1 X, graded by QC)
 *     -> generated/<id>.png         (SHA-1 X, byte-identical — gate unchanged)
 *     -> generated/<id>.webp        (derived; manifest records sourceSha1 = X)
 *
 * So every served asset still traces back to a specific QC verdict.
 *
 * USAGE
 *   node tools/optimize_assets.mjs                 # dry run — show the plan
 *   node tools/optimize_assets.mjs --apply         # write .webp derivatives
 *   node tools/optimize_assets.mjs --apply --repoint
 *                                                  # ...and repoint the catalog
 *   node tools/optimize_assets.mjs --apply --force # rebuild existing derivatives
 *   node tools/optimize_assets.mjs --apply --limit=25
 *
 * Exit 0 = every attempted conversion succeeded; 1 = at least one failed.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED_DIR = path.join(REPO, 'public', 'images', 'generated');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const MANIFEST = path.join(REPO, 'public', 'images', 'reports', 'asset-optimization-log.json');

// A craft-detail photo is inspected closely (the customer is judging a 2 mm
// stitch), so we keep more resolution than a typical product thumbnail.
const MAX_WIDTH = 1400;
const QUALITY = 82;

// Hard per-asset ceiling. A craft thumbnail that costs the customer half a
// megabyte defeats the point of the migration, and tests/e2e/asset-delivery
// asserts it. One master in 578 (a densely-textured vest piping detail) lands
// at 654 KB from the default settings, so the encoder steps quality down until
// the budget is met rather than leaving a single outlier to fail the gate.
const MAX_BYTES = 400 * 1024;
const QUALITY_FLOOR = 60;

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const APPLY = has('--apply');
const FORCE = has('--force');
const REPOINT = has('--repoint');
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;

const sha1 = (buf) => crypto.createHash('sha1').update(buf).digest('hex');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const webUrl = (abs) => '/' + path.relative(path.join(REPO, 'public'), abs).split(path.sep).join('/');

async function main() {
  let sharp;
  try {
    ({ default: sharp } = await import('sharp'));
  } catch {
    console.error('sharp is required: npm i -D sharp');
    process.exit(1);
  }

  const masters = walk(GENERATED_DIR).filter((f) => /\.png$/i.test(f));
  if (masters.length === 0) {
    console.error(`No PNG masters under ${GENERATED_DIR}`);
    process.exit(1);
  }

  const results = { ok: [], skipped: [], failed: [] };
  let processed = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  for (const master of masters) {
    if (processed >= LIMIT) break;
    const target = master.replace(/\.png$/i, '.webp');
    const rel = path.relative(REPO, master);

    // Skip only when the derivative is CURRENT. A webp older than its master
    // means the master was replaced (allow-swap ship over a legacy image) and
    // the customer would silently keep seeing the OLD bytes — the staleness
    // hazard found 2026-08-02 (11 stale webps, incl. certified ladder rungs).
    if (fs.existsSync(target) && !FORCE
        && fs.statSync(target).mtimeMs >= fs.statSync(master).mtimeMs - 1000) {
      results.skipped.push({ master: rel, reason: 'derivative up to date' });
      continue;
    }
    processed += 1;

    const srcBuf = fs.readFileSync(master);
    const sourceSha1 = sha1(srcBuf);
    bytesBefore += srcBuf.length;

    if (!APPLY) {
      results.ok.push({ master: rel, target: path.relative(REPO, target), sourceSha1, dryRun: true });
      continue;
    }

    try {
      let outBuf;
      let usedQuality = QUALITY;
      let usedWidth = MAX_WIDTH;
      // Quality first, width only as a last resort: a craft option is judged on
      // ~2 mm of stitching, so resolution is the thing worth protecting. A
      // handful of densely-textured masters (one 9.1 MB vest piping detail)
      // cannot reach the budget on quality alone; those step down in width
      // rather than shipping half a megabyte to every visitor.
      outer: for (const w of [MAX_WIDTH, 1200, 1000]) {
        for (let q = QUALITY; q >= QUALITY_FLOOR; q -= 6) {
          outBuf = await sharp(srcBuf)
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality: q })
            .toBuffer();
          usedQuality = q;
          usedWidth = w;
          if (outBuf.length <= MAX_BYTES) break outer;
        }
      }
      if (outBuf.length > MAX_BYTES) {
        console.warn(
          `  over budget: ${path.relative(REPO, target)} is ${(outBuf.length / 1024).toFixed(0)}KB ` +
            `even at quality ${QUALITY_FLOOR} / width 1000 — needs a tighter crop or a re-shoot`
        );
      } else if (usedQuality !== QUALITY || usedWidth !== MAX_WIDTH) {
        console.log(
          `  budget fit: ${path.relative(REPO, target)} at quality ${usedQuality}, width ${usedWidth}`
        );
      }
      fs.writeFileSync(target, outBuf);
      bytesAfter += outBuf.length;
      results.ok.push({
        master: rel,
        masterBytes: srcBuf.length,
        sourceSha1,
        target: path.relative(REPO, target),
        targetBytes: outBuf.length,
        targetSha1: sha1(outBuf),
        quality: usedQuality,
        width: usedWidth,
        web: webUrl(target),
      });
    } catch (err) {
      results.failed.push({ master: rel, error: String(err && err.message ? err.message : err) });
    }
  }

  // ── Optionally repoint the catalog at the derivatives ──────────────────────
  // Only rewrites an `image` that points at a generated PNG for which we have a
  // verified derivative. Never invents a path, never touches techpackIllustration.
  const repointed = [];
  if (REPOINT) {
    const haveWebp = new Set(
      results.ok.filter((r) => !r.dryRun).map((r) => r.web)
        .concat(walk(GENERATED_DIR).filter((f) => /\.webp$/i.test(f)).map(webUrl))
    );
    for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
      const p = path.join(OPTIONS_DIR, file);
      const raw = fs.readFileSync(p, 'utf8');
      const tree = JSON.parse(raw);
      let changed = 0;
      const visit = (node) => {
        if (Array.isArray(node)) return node.forEach(visit);
        if (!node || typeof node !== 'object') return;
        if (typeof node.image === 'string' && /^\/images\/generated\/.+\.png$/i.test(node.image)) {
          const candidate = node.image.replace(/\.png$/i, '.webp');
          if (haveWebp.has(candidate)) {
            repointed.push({ file, optionId: node.id ?? null, from: node.image, to: candidate });
            node.image = candidate;
            changed += 1;
          }
        }
        for (const v of Object.values(node)) visit(v);
      };
      visit(tree);
      if (changed && APPLY) {
        fs.writeFileSync(p, JSON.stringify(tree, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
      }
    }
  }

  // ── Manifest ───────────────────────────────────────────────────────────────
  const manifest = {
    at: new Date().toISOString(),
    settings: { maxWidth: MAX_WIDTH, quality: QUALITY, format: 'webp' },
    applied: APPLY,
    counts: {
      masters: masters.length,
      converted: results.ok.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
      repointed: repointed.length,
    },
    bytes: { before: bytesBefore, after: bytesAfter, savedPct: bytesBefore ? +(100 * (1 - bytesAfter / bytesBefore)).toFixed(1) : 0 },
    note: 'targetSha1 is the derivative; sourceSha1 is the PNG master QC graded. The master and publish_approved.mjs byte-identity gate are untouched.',
    results,
    repointed,
  };
  if (APPLY) {
    fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  }

  const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — masters ${masters.length}, converted ${results.ok.length}, skipped ${results.skipped.length}, failed ${results.failed.length}`);
  if (APPLY && bytesBefore) console.log(`size: ${mb(bytesBefore)} -> ${mb(bytesAfter)}  (${manifest.bytes.savedPct}% smaller)`);
  if (REPOINT) console.log(`catalog refs repointed to .webp: ${repointed.length}${APPLY ? '' : ' (dry run)'}`);
  if (results.failed.length) {
    console.error('\nFAILED:');
    for (const f of results.failed.slice(0, 20)) console.error(`  ${f.master}: ${f.error}`);
  }
  if (APPLY) console.log(`manifest: ${path.relative(REPO, MANIFEST)}`);
  process.exit(results.failed.length ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
