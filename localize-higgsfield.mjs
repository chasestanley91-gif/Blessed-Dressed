#!/usr/bin/env node
/**
 * localize-higgsfield.mjs — pull Higgsfield CloudFront photos into the repo.
 *
 * For every option whose `realImage` points at the Higgsfield CDN:
 *   - downloads the photo (each unique URL fetched once)
 *   - saves it as  public/images/generated/<category>/<optionId>.png
 *   - rewrites `realImage` to that local web path
 *
 * `image` / `techpackIllustration` are left alone — apply_generated.mjs owns
 * that flip. Idempotent: already-localized options are skipped.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const OPTIONS_DIR = path.join(REPO, 'data-store/options');
const PUBLIC_DIR = path.join(REPO, 'public/images');
const CDN_HOST = 'd8j0ntlcm91z4.cloudfront.net';

function categoryOf(opt, product) {
  const img = typeof opt.image === 'string' ? opt.image : '';
  const m = img.match(/\/images\/(?:generated\/)?([^/]+)\//);
  return m ? m[1] : product;
}

function collectOptions(node, acc = []) {
  if (Array.isArray(node)) for (const x of node) collectOptions(x, acc);
  else if (node && typeof node === 'object') {
    if (typeof node.id === 'string' && typeof node.realImage === 'string') acc.push(node);
    for (const k of Object.keys(node)) collectOptions(node[k], acc);
  }
  return acc;
}

const urlCache = new Map(); // url -> Buffer
async function fetchOnce(url) {
  if (urlCache.has(url)) return urlCache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error(`suspiciously small (${buf.length}B): ${url}`);
  urlCache.set(url, buf);
  return buf;
}

const destOwner = new Map(); // destPath -> source url (conflict detection)
let rewired = 0, filesWritten = 0, conflicts = 0;

for (const f of fs.readdirSync(OPTIONS_DIR).filter((x) => x.endsWith('.json'))) {
  const file = path.join(OPTIONS_DIR, f);
  const product = path.basename(f, '.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const opts = collectOptions(json).filter((o) => o.realImage.includes(CDN_HOST));
  let touched = 0;

  for (const opt of opts) {
    const cat = categoryOf(opt, product);
    const webPath = `/images/generated/${cat}/${opt.id}.png`;
    const diskPath = path.join(PUBLIC_DIR, 'generated', cat, `${opt.id}.png`);

    const prevOwner = destOwner.get(webPath);
    if (prevOwner && prevOwner !== opt.realImage) {
      console.warn(`  ⚠ conflict: ${product} ${cat}/${opt.id} wants a different photo than already written — skipped`);
      conflicts++;
      continue;
    }
    destOwner.set(webPath, opt.realImage);

    if (!fs.existsSync(diskPath)) {
      const buf = await fetchOnce(opt.realImage);
      fs.mkdirSync(path.dirname(diskPath), { recursive: true });
      fs.writeFileSync(diskPath, buf);
      filesWritten++;
    }
    opt.realImage = webPath;
    touched++;
    rewired++;
  }

  if (touched) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
    console.log(`${f}: localized ${touched} realImage refs`);
  }
}

console.log(`\nunique URLs downloaded: ${urlCache.size}`);
console.log(`files written:          ${filesWritten}`);
console.log(`realImage rewired:      ${rewired}`);
if (conflicts) console.log(`conflicts skipped:      ${conflicts}`);
