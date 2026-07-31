// util.mjs — small shared helpers used across this skill's scripts. Kept
// self-contained (not imported across skill folders) so garment-image-qc can
// be installed independently of its siblings.

import fs from 'node:fs';
import path from 'node:path';

export function findUp(start, rel) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i++) {
    const cand = path.join(dir, rel);
    if (fs.existsSync(cand)) return cand;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
    else out._.push(a);
  }
  return out;
}

export function resolveRepoRoot(start = process.cwd()) {
  const optionsDir =
    findUp(start, path.join('data-store', 'options')) ||
    findUp(start, path.join('src', 'data', 'options'));
  if (!optionsDir) {
    throw new Error(
      'Could not locate the repo (no data-store/options or src/data/options found walking up from ' +
        start + '). Pass --root=<repo root> explicitly.'
    );
  }
  let repoRoot = path.resolve(optionsDir, '..', '..');
  if (!fs.existsSync(path.join(repoRoot, 'public'))) {
    const found = findUp(optionsDir, 'public');
    if (found) repoRoot = path.dirname(found);
  }
  return repoRoot;
}

export function pipelineDir(repoRoot, productId, optionId) {
  return path.join(repoRoot, '.craft-pipeline', productId, optionId);
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return file;
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
