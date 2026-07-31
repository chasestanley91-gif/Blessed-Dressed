// build-review.mjs — thin wrapper. The canonical builder now lives in the
// shirt-image-factory skill so there is exactly ONE review builder to maintain:
//   .claude/skills/shirt-image-factory/scripts/build_review.mjs
// Run: node build-review.mjs   (or invoke the skill script directly with a site root)
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const canonical = path.join(ROOT, '.claude', 'skills', 'shirt-image-factory',
  'scripts', 'build_review.mjs');
const r = spawnSync(process.execPath, [canonical, ROOT], { stdio: 'inherit' });
process.exit(r.status ?? 0);
