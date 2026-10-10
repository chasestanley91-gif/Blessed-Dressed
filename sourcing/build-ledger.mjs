#!/usr/bin/env node
// Regenerates the supplier tables in FABRIC-SUPPLIERS.md and the outreach tracker
// CSV from fabric-suppliers.json, so the readable ledger can never drift from data.
//   node sourcing/build-ledger.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const db = JSON.parse(readFileSync(join(here, 'fabric-suppliers.json'), 'utf8'));

const TIER_LABEL = {
  A: 'A — open now',
  B: 'B — worth a letter',
  C: 'C — reference / backup',
  D: 'D — deprioritised',
};

const cell = (v) => {
  if (v === true) return 'yes';
  if (v === false) return 'no';
  if (v === null || v === undefined) return '—';
  return String(v).replace(/\|/g, '\\|');
};

const contactLine = (c = {}) =>
  [c.person, c.email, c.phone, c.url, c.address].filter(Boolean).join('<br>') || '—';

function table(rows) {
  const head =
    '| Supplier | Country | Type | Segment | Own garment arm | Price band | Super range | Swatch terms | Cut lengths | Contact | Evid. |\n' +
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |';
  const body = rows
    .map((s) =>
      [
        `**${cell(s.name)}**`,
        cell(s.country),
        cell(s.type),
        cell(s.segment),
        s.garment_arm === true ? '**YES**' : cell(s.garment_arm),
        cell(s.price_band),
        cell(s.super_range),
        cell(s.swatch_program),
        cell(s.cut_lengths),
        contactLine(s.contacts),
        cell(s.evidence),
      ].join(' | '),
    )
    .map((r) => `| ${r} |`)
    .join('\n');
  return `${head}\n${body}`;
}

// ---- markdown tables, grouped by tier ----------------------------------------
const sections = ['A', 'B', 'C', 'D']
  .map((tier) => {
    const rows = db.suppliers.filter((s) => s.tier === tier);
    if (!rows.length) return null;
    return `### Tier ${TIER_LABEL[tier]} (${rows.length})\n\n${table(rows)}`;
  })
  .filter(Boolean)
  .join('\n\n');

const notes = db.suppliers
  .filter((s) => s.notes)
  .map((s) => `- **${s.name}** — ${s.notes}`)
  .join('\n');

const generated = `<!-- BEGIN GENERATED: node sourcing/build-ledger.mjs -->

${sections}

### Per-supplier notes

${notes}

<!-- END GENERATED -->`;

const mdPath = join(here, 'FABRIC-SUPPLIERS.md');
const md = readFileSync(mdPath, 'utf8');
const start = md.indexOf('<!-- BEGIN GENERATED');
const end = md.indexOf('<!-- END GENERATED -->');
if (start === -1 || end === -1) throw new Error('generated markers missing in FABRIC-SUPPLIERS.md');
writeFileSync(mdPath, md.slice(0, start) + generated + md.slice(end + '<!-- END GENERATED -->'.length));

// ---- outreach tracker CSV ----------------------------------------------------
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const cols = [
  'tier', 'wave', 'name', 'country', 'segment', 'garment_arm', 'price_band',
  'super_range', 'swatch_program', 'moq', 'cut_lengths', 'ships_us',
  'contact_person', 'contact_email', 'contact_phone', 'contact_url',
  'evidence', 'status',
];
const order = { A: 0, B: 1, C: 2, D: 3 };
const csvRows = [...db.suppliers]
  .sort((a, b) => order[a.tier] - order[b.tier] || a.name.localeCompare(b.name))
  .map((s) =>
    [
      s.tier, s.wave, s.name, s.country, s.segment, s.garment_arm, s.price_band,
      s.super_range, s.swatch_program, s.moq, s.cut_lengths, s.ships_us,
      s.contacts?.person, s.contacts?.email, s.contacts?.phone, s.contacts?.url,
      s.evidence, s.status,
    ].map(csvCell).join(','),
  );

const tracking = ['date_sent', 'channel', 'replied', 'reply_date', 'terms_quoted', 'swatches_received', 'next_action', 'owner_notes'];
writeFileSync(
  join(here, 'outreach-tracker.csv'),
  [[...cols, ...tracking].join(','), ...csvRows.map((r) => r + ',' + tracking.map(() => '""').join(','))].join('\n') + '\n',
);

const countries = new Set(db.suppliers.map((s) => s.country.replace(/\s*\(.*/, '').trim()));

// ---- progress stats (generated into PROGRESS.md) -----------------------------
const tierCounts = ['A', 'B', 'C', 'D'].map((t) => [t, db.suppliers.filter((s) => s.tier === t).length]);
const reachable = db.suppliers.filter((s) => s.contacts?.email || s.contacts?.phone).length;
const urlOnly = db.suppliers.length - reachable;
const countryCount = countries.size;
const contacted = db.suppliers.filter((s) => s.status !== 'not_contacted').length;

const statsBlock = `<!-- BEGIN GENERATED: node sourcing/build-ledger.mjs -->

**${db.suppliers.length} fabric suppliers identified across ${countryCount} countries. ${contacted} contacted.**

Research is no longer the bottleneck. Outreach is. The ledger has more qualified
suppliers than a company at this stage can work at once, and every single row still
reads \`not_contacted\`. The next unit of progress is an email, not another search.

## Where the workstream stands

| Stage | Count | Notes |
| --- | --- | --- |
| Identified | ${db.suppliers.length} | Across ${countryCount} countries, tiered A–D |
| Direct email or phone on file | ${reachable} | ${urlOnly} have only a website or postal address |
| Re-verified against live site | 0 | **Blocks Wave 2 sending** — see below |
| Contacted | ${contacted} | — |
| Replied | 0 | — |
| Trade account open | 0 | — |
| Swatches in hand | 0 | — |
| Cloth purchased | 0 | — |

**By tier:** ${tierCounts.map(([t, n]) => `${t} ${n}`).join(' · ')} — A = open now, B = worth a letter, C = reference, D = deprioritised

**By evidence:** ${['VERIFIED', 'LIKELY', 'UNVERIFIED'].map((e) => `${e} ${db.suppliers.filter((s) => s.evidence === e).length}`).join(' · ')}

**Mills with their own garment arm:** ${db.suppliers.filter((s) => s.garment_arm === true).length} — buy cloth from these, share nothing else

<!-- END GENERATED -->`;

const progPath = join(here, 'PROGRESS.md');
const prog = readFileSync(progPath, 'utf8');
const ps = prog.indexOf('<!-- BEGIN GENERATED');
const pe = prog.indexOf('<!-- END GENERATED -->');
if (ps === -1 || pe === -1) throw new Error('generated markers missing in PROGRESS.md');
writeFileSync(progPath, prog.slice(0, ps) + statsBlock + prog.slice(pe + '<!-- END GENERATED -->'.length));

console.log(`ledger: ${db.suppliers.length} suppliers across ${countries.size} country labels`);
