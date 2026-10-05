#!/usr/bin/env node
/**
 * inspect_craft_lock.mjs — look up one craft in the permanent identity lock.
 *
 *   node tools/inspect_craft_lock.mjs --craft=collar-stitch-06-top
 *   node tools/inspect_craft_lock.mjs --field=decoration_stitching_on_collar
 *   node tools/inspect_craft_lock.mjs --bxn=GCLLI/L
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCK = path.join(REPO, 'public', 'images', 'reports', 'craft-lock', 'canonical-craft-lock.json');
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const qCraft = arg('craft').toLowerCase();
const qField = arg('field').toLowerCase();
const qBxn = arg('bxn').toLowerCase();

if (!fs.existsSync(LOCK)) {
  console.error('No lock yet. Run: node tools/lock_craft_identities.mjs --lock');
  process.exit(1);
}
const lock = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
const hits = (lock.crafts || []).filter((c) => {
  if (qCraft) {
    const blob = `${c.craftId} ${c.optionId} ${c.stableId} ${(c.formerIds || []).join(' ')} ${c.label}`.toLowerCase();
    if (!blob.includes(qCraft)) return false;
  }
  if (qField && !`${c.fieldId} ${c.fieldLabel}`.toLowerCase().includes(qField)) return false;
  if (qBxn) {
    const b = c.bxn ? `${c.bxn.field}/${c.bxn.value} ${c.bxn.fieldName}`.toLowerCase() : '';
    if (!b.includes(qBxn)) return false;
  }
  return qCraft || qField || qBxn;
});
if (!qCraft && !qField && !qBxn) {
  console.log(JSON.stringify(lock.totals, null, 2));
  process.exit(0);
}
console.log(`${hits.length} hit(s)`);
for (const c of hits.slice(0, 40)) {
  console.log('—');
  console.log(`  ${c.displayName}`);
  console.log(`  craftId:  ${c.craftId}`);
  console.log(`  stableId: ${c.stableId}`);
  if (c.formerIds?.length) console.log(`  former:   ${c.formerIds.join(', ')}`);
  console.log(`  drawing:  ${c.lockIllustration || c.illustration || '(none)'}`);
  if (c.bxn) console.log(`  bxn:      ${c.bxn.category}/${c.bxn.field}/${c.bxn.value}  ${c.bxn.fieldName} / ${c.bxn.valueLabel}`);
  else console.log('  bxn:      (unmapped)');
}
if (hits.length > 40) console.log(`… ${hits.length - 40} more`);
