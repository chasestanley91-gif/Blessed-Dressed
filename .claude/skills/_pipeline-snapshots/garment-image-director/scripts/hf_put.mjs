#!/usr/bin/env node
// hf_put.mjs — upload one local illustration's bytes to a Higgsfield presigned
// URL. This is the ONE step of the reference-image upload that is not an MCP
// call: Claude calls media_upload (MCP) to get the presigned PUT URL, runs this
// to push the bytes, then calls media_confirm (MCP) to obtain the media UUID.
//
// Usage:
//   node hf_put.mjs --url="<presigned PUT url>" --file="<repo>/public/images/lapel/foo.jpg"
//   node hf_put.mjs --url="…" --file="…" --content-type="image/jpeg"   # override MIME
//
// Prints JSON: { ok, status, bytes, contentType }. Exit 1 on any non-2xx.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './lib/util.mjs';

const args = parseArgs();
if (!args.url || !args.file) {
  console.error('ERROR: --url=<presigned> and --file=<local path> are required.');
  process.exit(1);
}
if (!fs.existsSync(args.file)) {
  console.error('ERROR: file not found: ' + args.file);
  process.exit(1);
}

const EXT_MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
};
const ext = path.extname(args.file).toLowerCase();
const contentType = args['content-type'] || EXT_MIME[ext] || 'application/octet-stream';
const body = fs.readFileSync(args.file);

try {
  const res = await fetch(args.url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, 'Content-Length': String(body.length) },
    body,
  });
  const ok = res.status >= 200 && res.status < 300;
  console.log(JSON.stringify({ ok, status: res.status, bytes: body.length, contentType }));
  if (!ok) {
    const text = await res.text().catch(() => '');
    if (text) console.error(text.slice(0, 500));
    process.exit(1);
  }
} catch (e) {
  console.error('ERROR: PUT failed: ' + e.message);
  process.exit(1);
}
