#!/usr/bin/env node
/**
 * apply_field_mapping.mjs — attach a VERIFIED supplier field's drawings to the
 * catalog options of one craft field.
 *
 * SCOPE, AND WHY IT IS THIS NARROW
 * --------------------------------
 * `propose_field_mapping.mjs` scores candidates. It does not decide, because a
 * label match cannot separate craft families that share option labels — `REKPO`
 * (D/I/X bartack) fits `lower-pocket-bartack` 4/4 while already backing
 * `inner-pocket-closure`, and `GTECP` (Left/Right/Both) is claimed by four
 * different fields at once. A wrong field mapping is invisible to QC, which
 * scores fidelity to whatever reference it is handed.
 *
 * So this tool applies ONLY mappings listed in VERIFIED below — each one checked
 * by opening the supplier drawing and confirming it depicts that craft — and it
 * refuses anything it cannot join by label evidence at the OPTION level too.
 *
 * WHAT IT WILL AND WILL NOT WRITE
 *   - fills `illustration` + `techpackIllustration` ONLY where BOTH are empty
 *   - NEVER overwrites an existing drawing (an on-disk asset may already back a
 *     QC verdict or an owner approval)
 *   - never touches the option's `image` (the customer-facing photo) — that is
 *     apply_owner_approvals.mjs's department and needs owner approval
 *   - never adds or removes a craft option; the catalog stays at 2862
 *   - appends every change to data-store/illustration-history.json
 *
 * USAGE
 *   node tools/apply_field_mapping.mjs                 # dry run, all verified
 *   node tools/apply_field_mapping.mjs --field=ticket-pocket
 *   node tools/apply_field_mapping.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPT_DIR = path.join(REPO, 'data-store', 'options');
const V2 = path.join(REPO, 'public', 'images', 'factory', 'baoxiniao-v2-manifest.json');
/**
 * DEPLOYABLE destination. `public/images/factory` is listed in .vercelignore as
 * "dev-only scraping reference images", so a catalog row pointing there renders
 * a broken image in production — caught by catalog_invariants' VERCELIGNORED
 * check on the first attempt. The full 4,311-file corrected library stays in the
 * dev tree; only the drawings a craft option actually uses are copied here, the
 * same pattern repoint_supplier_blueprints.mjs already follows.
 */
const DEST_REL = 'images/blueprints/baoxiniao';
const DEST_ABS = path.join(REPO, 'public', DEST_REL);
const HISTORY = path.join(REPO, 'data-store', 'illustration-history.json');
const LOG = path.join(REPO, 'public', 'images', 'reports', 'apply-field-mapping-log.json');

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const APPLY = process.argv.includes('--apply');
const ONLY = arg('field', '');
/**
 * Replace an EXISTING drawing only when it is a proven shared-image defect:
 * the same plate backing two or more different craft identities. Off by default.
 */
const REPLACE_SHARED = process.argv.includes('--replace-shared');
const replacedFrom = new Map();
const duplicateRefusals = [];

/**
 * Mappings confirmed by OPENING the drawing, not by label score alone.
 *
 *   ticket-pocket -> KPOKD   KPOKD/B highlights, in red, a small pocket sitting
 *                            directly above the right hip pocket on a jacket
 *                            front — a ticket pocket. All 11 catalog options
 *                            have a labelled counterpart among its 11 values.
 *   folded-collar-craft -> KALTP
 *                            KALTP/B shows a jacket collar whose END is turned
 *                            back, highlighted at the collar point. 2 values,
 *                            2 options, exact labels both ways.
 */
const VERIFIED = {
  // ── 2026-08-26 shirt (BC) ─────────────────────────────────────────────────
  // Each of these is a single still-blocked option in an otherwise answered
  // field, and each has ONE exact counterpart. They are aliased rather than
  // joined because in every case a NEAR-miss value also exists and would be the
  // wrong pick: RELCL/FE041114 is a dimensioned "Removable 0.9cm", GTEMS/F adds
  // "on inner plain placket" (which our catalog sells as a separate option),
  // REQDN/F is "Round hem with pentagon gusset" where ours is the SMALL round,
  // and KSHLA/D adds two buttons.
  'collar_stay': {
    part: 'shirt', supplierField: 'RELCL',
    aliases: { 'stay-removable': 'B' },
    evidence: 'RELCL is named "Collar stay"; B is the plain "Removable" (FE041114 is the dimensioned 0.9cm variant we do not sell)',
  },
  'placket': {
    part: 'shirt', supplierField: 'REQBM',
    aliases: { 'placket-half-hidden': 'I' },
    evidence: 'REQBM is named "Placket"; I is the half-hidden placket',
  },
  'decoration_stitching_on_placket': {
    part: 'shirt', supplierField: 'GTEMS',
    aliases: { 'stitch-01-top': 'E' },
    evidence: 'GTEMS is named "Decoration stitching on placket"; E is plain 0.1cm top stitching, F is the inner-plain-placket variant our catalog lists separately',
  },
  'cuff': {
    part: 'shirt', supplierField: 'REQLS',
    aliases: { 'cuff-round-2btn-1bh': 'A' },
    evidence: 'REQLS is named "Cuff"; A is "Round cuff with 2 buttons&1 buttonhole" - our option exactly, and distinct from D which has 2 buttonholes',
  },
  'cuff_lining': {
    part: 'shirt', supplierField: 'GTXKC',
    aliases: { 'cuf-lining-hard-fc390057': 'FC390057' },
    evidence: 'GTXKC is named "Cuff lining" and carries the exact material code our option names',
  },
  // A THIRD GLKMO. Jacket, trousers and shirt each have one, and the code
  // assignment is NOT constant: BB and BC read A="Machine"/H="Hand", BD reads
  // the reverse. Aliased per part for that reason.
  'buttonhole': {
    part: 'shirt', supplierField: 'GLKMO',
    aliases: { 'bh-machine': 'A', 'bh-hand': 'H' },
    evidence: 'BC/GLKMO is named "Buttonhole" and reads A="Machine" / H="Hand-made" - the same assignment as the jacket, and the OPPOSITE of the trousers field of the same code',
  },
  'hem': {
    part: 'shirt', supplierField: 'REQDN',
    aliases: { 'hem-small-round': 'C', 'hem-small-round-pentagon-gusset': 'I' },
    evidence: 'REQDN is named "Hem"; C is "Small Round hem" and I is "Small Round hem with pentagon gusset" - note F is the LARGE round with pentagon gusset',
  },
  'collar_stand': {
    part: 'shirt', supplierField: 'KSHLA',
    aliases: { 'cs-square': 'C' },
    evidence: 'KSHLA is named "Collar stand" (shape); C is the plain square stand, D is the square stand WITH two buttons',
  },
  // ── 2026-08-26 (third pass) ───────────────────────────────────────────────
  // GTEDC is the clearest case of the partial-download damage. The old rejection
  // read: "GTEDC publishes exactly ONE value ('Regular') ... the option that
  // matters - the absence of linen - has no counterpart at all." The full
  // dictionary has TWO values and the second is literally "No Linen".
  'collar-interlining': {
    part: 'jacket', supplierField: 'GTEDC',
    aliases: { 'ci-regular': 'A', 'ci-no-linen': 'NFC00054' },
    evidence: 'GTEDC is named "Collar interlining" and publishes exactly our two options: A "Regular" and NFC00054 "No Linen"',
  },
  // REFUO/D spells out the same four places our "Full" option lists:
  // "Hand Stitch: Shldr/Slv Vent/Bk Vent/Chest Pkt/Btnh". HELD: REFUO has no
  // None value, so "None" keeps no plate rather than borrowing one.
  'handmade-decorative': {
    part: 'jacket', supplierField: 'REFUO',
    aliases: { 'hmd-shoulder': 'B', 'hmd-full': 'D' },
    holdOptions: ['hmd-none'],
    evidence: 'REFUO is named "Handmade decorative line"; B is "shoulder seam" and D enumerates shoulder/sleeve vent/back vent/chest pocket/buttonhole - our "Full" option verbatim',
  },
  // HELD: GCOPA publishes no "no contrast" value. The two positive options join
  // exactly - D is the chest pocket, W is "1cm satin splicing on Laple".
  'contrast-position': {
    part: 'jacket', supplierField: 'GCOPA',
    aliases: { 'contrast-chest-pocket': 'D', 'contrast-satin-lapel': 'W' },
    holdOptions: ['contrast-none'],
    evidence: 'GCOPA is named "Contrast position"; D "Chest pocket" and W "1cm satin splicing on Laple" are our two positive options',
  },
  // HELD: KHALI has no quarter-lining value (Full / Half / No lining only).
  'lining-coverage': {
    part: 'jacket', supplierField: 'KHALI',
    aliases: { 'lc-full': 'A', 'lc-half': 'B', 'lc-none': 'C' },
    holdOptions: ['lc-quarter'],
    evidence: 'KHALI publishes Full lining / Half lining / No lining, matching three of our four options; quarter lining does not exist in the field',
  },
  // This one carries a warning. `cb-4` previously held `0621__4_flat.jpg`,
  // assigned from the FILENAME, and subject-audit-consolidated.json recorded the
  // plate as a MISMATCH - "EIGHT evenly spaced marks, not four". GTEXK is the
  // supplier's own "Cuff button number" field with one plate per count, checked
  // here by comparing GTEXK/4 against GTEXK/6: the 6 plate carries a visibly
  // longer column of buttons. The count now comes from a counted field, not a
  // filename.
  'cuff-button-number': {
    part: 'jacket', supplierField: 'GTEXK',
    aliases: { 'cb-4': '4' },
    evidence: 'GTEXK is named "Cuff button number", value codes ARE the count, and GTEXK/4 vs GTEXK/6 differ in how many buttons are drawn',
  },
  'cuff-button-spacing': {
    part: 'jacket', supplierField: 'GTEXJ',
    aliases: { 'bs-no-kiss': 'B' },
    evidence: 'GTEXJ is named "Cuff button spacing"; B is "NO KISSING", our one still-blocked option',
  },
  // ── 2026-08-26 trousers ───────────────────────────────────────────────────
  // WATCH THE CODE FLIP. `GLKMO` exists in BOTH dictionaries with the SAME two
  // labels and the assignment INVERTED:
  //     BB (jacket)   A = "By machine"   H = "By hands"
  //     BD (trousers) H = "By machine"   A = "By hands"
  // Verified against the drawings rather than assumed: BD GLKMO/A magnifies a
  // buttonhole with an irregular, organic outline (hand-worked) and BD GLKMO/H a
  // clean straight rectangle (machine), on a trouser BACK POCKET both times.
  // Carrying the jacket's alias table across would have inverted every trouser
  // buttonhole in the catalogue.
  'buttonhole-type-trouser': {
    part: 'trousers', supplierField: 'GLKMO',
    aliases: { 'tbh-machine': 'H', 'tbh-hand': 'A' },
    evidence: 'BD GLKMO/A draws an irregular hand-worked buttonhole, BD GLKMO/H a clean machine one, on the trouser back pocket - the OPPOSITE code assignment to the jacket field of the same name',
  },
  // PARTIAL BY DESIGN. KPWAH publishes only "With Center Crease" / "Without
  // Center Crease". Our catalog distinguishes a PRESSED crease from a FUSED
  // (permanent) one, and both are "with" - so both would take the same plate,
  // which is the shared-image defect. Only the absence joins cleanly.
  'center-crease': {
    part: 'trousers', supplierField: 'KPWAH',
    aliases: { 'crease-none': 'B' },
    holdOptions: ['crease-pressed', 'crease-fused'],
    evidence: 'KPWAH is named "Center Crease"; only its "Without Center Crease" value maps to exactly one of our options - pressed and fused are both "with" and cannot share one plate',
  },
  // PARTIAL BY DESIGN, and the earlier value-level rejection stands for the rest:
  // REQST is confirmed by name as "Waistband style", but 17 of its 18 values are
  // adjuster and elastic MECHANISMS (full elastic with drawstring, metal
  // adjusters on outseam, adjustable with button tab) while ours are structural
  // waistband TYPES. "Standard" is the single genuine overlap.
  'waistband-style': {
    part: 'trousers', supplierField: 'REQST',
    aliases: { 'waist-standard': 'A' },
    holdOptions: ['waist-extended-tab', 'waist-waistcoat-back', 'waist-elasticated', 'waist-double', 'waist-no-band'],
    evidence: 'REQST is named "Waistband style" and its A value is a plain standard waistband; the other 17 values are adjuster mechanisms with no counterpart in our structural-type field',
  },
  // ── 2026-08-26 (second pass): mappings settled by the supplier's own FIELD
  // NAMES, recovered by tools/extract_field_names.mjs from the `getZlpmd`
  // response that was captured months ago and never read. Before this, the only
  // text available was VALUE labels — and four different interior-pocket fields
  // all publish exactly Left / Right / Both / None, so each scored a perfect
  // match against the other three. That ambiguity is what held these back.
  //
  //     KMPCD "Mp3 pocket"          KAXDK "Lower coin pocket"
  //     REAPB "Inner ticket pocket" KNAMD "Namecard pocket"
  //     KALDF "Inner pocket closure"
  //     GTECP "Lapel buttonhole position"  <- never an interior pocket at all
  //
  'inner-ticket-pocket': {
    part: 'jacket', supplierField: 'REAPB',
    aliases: { 'itp-none': 'C', 'itp-left': 'A', 'itp-right': 'B', 'itp-both': 'D' },
    evidence: 'REAPB is named "Inner ticket pocket"; 4 values against our 4 options, exact',
  },
  'mp3-pocket': {
    part: 'jacket', supplierField: 'KMPCD',
    aliases: { 'mp3-none': 'A', 'mp3-left': 'B', 'mp3-right': 'C' },
    evidence: 'KMPCD is named "Mp3 pocket"; our three options take A/B/C and its "Both sides" (D) goes unused, which is correct - we do not sell it',
  },
  // KALDF/A draws the interior facing with bartacks marked at each welt end -
  // which is exactly "Inner pocket closure", the name the supplier gives it.
  // Note this field is NOT lower-pocket-bartack (that is REKPO); the two publish
  // near-identical value labels and differ only in where the bartack sits.
  'inner-pocket-closure': {
    part: 'jacket', supplierField: 'KALDF',
    aliases: { 'ipc-none': 'D', 'ipc-d': 'A', 'ipc-i': 'B', 'ipc-x': 'C' },
    evidence: 'KALDF is named "Inner pocket closure" and KALDF/A draws bartacks at the welt ends of the two INTERIOR facing pockets',
  },
  // GLKMO and GXKMO publish IDENTICAL value labels ("By machine" / "By hands")
  // and completely different drawings: GLKMO/H marks buttonholes down the jacket
  // FRONT EDGE, GXKMO/H marks three SLEEVE CUFF buttons with hand-worked holes.
  // Nothing in the value labels could separate them - the field names do.
  // Both were previously rejected against GTECH, which is the LAPEL buttonhole.
  'front-buttonhole': {
    part: 'jacket', supplierField: 'GLKMO',
    aliases: { 'fbh-machine': 'A', 'fbh-hands': 'H' },
    evidence: 'GLKMO is named "Front buttonhole"; GLKMO/H draws buttonholes on the jacket front edge',
  },
  'sleeve-buttonhole-type': {
    part: 'jacket', supplierField: 'GXKMO',
    aliases: { 'slbh-machine': 'A', 'slbh-hands': 'H' },
    evidence: 'GXKMO is named "Sleeve buttonhole"; GXKMO/H draws three sleeve-cuff buttons with hand-worked buttonholes',
  },
  // PARTIAL BY DESIGN: GTECP publishes 6 positions and our field sells 7. The
  // "Three Left / Two Right" and "Three Left / One Right" options have no
  // counterpart, and GTECP/Z (None) has no counterpart in ours. Only the one
  // still-blocked option ("Right Lapel") needs filling; the rest are answered.
  'lapel-bh-position': {
    part: 'jacket', supplierField: 'GTECP',
    aliases: { 'lbp-left': 'A', 'lbp-right': 'B', 'lbp-left-double': 'C', 'lbp-both': 'D', 'lbp-both-double': 'E' },
    evidence: 'GTECP is named "Lapel buttonhole position" - it was never an interior-pocket field, which is why every attempt to make it serve one failed',
  },
  'coin-pocket': {
    part: 'jacket', supplierField: 'KAXDK',
    aliases: { 'coin-none': 'Z', 'coin-left': 'A', 'coin-right': 'B', 'coin-both': 'C' },
    evidence: 'KAXDK is named "Lower coin pocket"; 4 values against our 4 options, exact',
  },
  // ── 2026-08-26: the fields the BB download had never asked for ────────────
  // `bb-images-labelled.json` covered 48 of the 244 BB fields. Everything below
  // was reported for months as "the supplier publishes no artwork" when in fact
  // it had simply never been requested. Every value in each of these fields has
  // a drawing on the supplier's server.
  //
  // KIMOD/E draws jacket body panels laid open with a red TRIANGLE at each
  // underarm and a magnified callout of the pad; KIMOD/B draws the same panels
  // with a ROUNDED pad. 8 values, 8 catalog options, exact bijection including
  // our numbering (Round 1/2/3, U 1/2/3) — because the catalog was built from
  // these codes. One distinct plate per shape, so no shared-image defect.
  // Aliased in full rather than left to the joiner: the supplier says "Round
  // underarm shield 1" where we say "Round Shield 1". The words correspond but
  // the joiner would have to tolerate an excess token to see it, and on a field
  // where the ONLY thing separating three options is a trailing digit, a fuzzy
  // join is exactly the wrong tool. The bijection is written out instead.
  'perfume-pad': {
    part: 'jacket', supplierField: 'KIMOD',
    aliases: {
      'pp-none': 'F', 'pp-triangle': 'E',
      'pp-round-1': 'B', 'pp-round-2': 'A', 'pp-round-3': 'H',
      'pp-u-1': 'D', 'pp-u-2': 'C', 'pp-u-3': 'G',
    },
    evidence: 'KIMOD/E shows a triangular underarm shield in a magnified callout; KIMOD/B shows the rounded one. 8 values, one plate per shape',
  },
  // KINBL draws the interior with the lining panel outlined in red, a different
  // extent per value. HELD: B and E BOTH read "Small cut-away lining" and their
  // drawings differ (B extends noticeably lower than E). Our single "Small
  // Cut-away" cannot be told apart from the labels, so it is left for the owner.
  'half-lining-shape': {
    part: 'jacket', supplierField: 'KINBL',
    holdOptions: ['hls-small-cutaway'],
    evidence: 'KINBL outlines the lining extent in red, one plate per shape; B and E share a label but differ in depth, so hls-small-cutaway is held',
  },
  // GTEZB/D draws the jacket interior with a red DASHED run along the front and
  // lining edges (the Columbia stitching) AND a solid red edge (the piping) —
  // exactly the "Columbia stitching and piping" value. 4 values, 4 options.
  'columbia-piping': { part: 'jacket', supplierField: 'GTEZB', evidence: 'GTEZB/D shows a dashed Columbia stitch run and a solid piped edge together; 4 values match our 4 options' },
  // KNAMD/A draws a small card-sized welt low on the wearer-left interior panel;
  // KNAMD/E is the same pocket annotated "15cm", a depth we do not sell. The
  // field names itself: value G reads "Card Pocket：Self-fabric Patch Fabric".
  // This ALSO disambiguates the interior-pocket family — KNAMD is the namecard
  // field, so it is not one of the candidates for coin / ticket / mp3.
  // "Left Inner" is ambiguous on labels alone - KNAMD/A reads "Left" and KNAMD/E
  // reads "Left Inner Pocket Depth 15CM". The drawings settle it: E is the same
  // pocket annotated "15cm", a depth this catalog does not sell. So A/B, not E/F.
  'namecard-pocket': {
    part: 'jacket', supplierField: 'KNAMD',
    aliases: { 'nc-none': 'D', 'nc-left': 'A', 'nc-right': 'B', 'nc-both': 'C' },
    evidence: 'KNAMD/A shows a small card welt low on the left interior panel; value G reads "Card Pocket". E/F are the 15cm-depth variants we do not sell',
  },
  // KPEND is the pen-pocket field - value B reads "Drop shape left pen pocket".
  // Aliased because the supplier puts the side AFTER the shape ("Drop shape left
  // pen pocket") where we put it first ("Left Drop-shape"); a token join would
  // have to cross two excess words, and left/right is the one axis this project
  // must never get wrong.
  'pen-pocket': {
    part: 'jacket', supplierField: 'KPEND',
    aliases: {
      'pen-none': 'Z',
      'pen-left-jetted': 'A', 'pen-left-drop': 'B', 'pen-left-diamond': 'C',
      'pen-right-jetted': 'D', 'pen-right-drop': 'E', 'pen-right-diamond': 'F',
    },
    evidence: 'KPEND value B reads "Drop shape left pen pocket"; 7 values against our 7 options, jetted/drop/diamond on each side plus None',
  },
  // KINGM names its values exactly as our catalog does - "Facing 1/2/4/5/7/9" -
  // together with "Available for half lining" and "Available for no lining",
  // which are our two EXCLUDED options. That the excluded pair also lines up is
  // what confirms the catalog was generated from this field.
  'facing-style': { part: 'jacket', supplierField: 'KINGM', evidence: 'KINGM publishes Facing 1/2/4/5/7/9 verbatim, plus the half-lining and no-lining variants our catalog excludes' },
  // Baoxiniao publishes exactly TWO bartack fields and this one is settled by
  // elimination plus drawing. KALDF/A draws the jacket INTERIOR facing - two
  // jetted welts and a button, bartacks marked at each welt end - so KALDF is
  // the INNER pocket bartack. REKPO/D draws an OUTSIDE flap pocket corner with
  // no mark, REKPO/A the same corner with a D-bartack magnified. REKPO is also
  // the only one carrying "1-Bartack", which our field lists (as an excluded
  // option) - our option set was built from REKPO's value list.
  'lower-pocket-bartack': { part: 'jacket', supplierField: 'REKPO', evidence: 'REKPO/A magnifies a D-bartack on an OUTSIDE flap pocket corner; KALDF (the only other bartack field) is proven interior by KALDF/A, and only REKPO carries our 1-Bartack value' },
  // KIPRO/A draws the interior seams in red with a magnified callout of a BOUND
  // seam edge. Values are Binding / French / Joining seam + None; our field is
  // the first three exactly.
  'half-lining-craft': { part: 'jacket', supplierField: 'KIPRO', evidence: 'KIPRO/A magnifies a bound interior seam edge; values are the three seam finishes our field sells' },
  'ticket-pocket': { part: 'jacket', supplierField: 'KPOKD', evidence: 'KPOKD/B shows a ticket pocket above the hip pocket, highlighted red' },
  'folded-collar-craft': { part: 'jacket', supplierField: 'KALTP', evidence: 'KALTP/B shows the collar end turned back, highlighted' },
  // GTECH/C shows a notch lapel with a small buttonhole marked in red on the
  // lapel, and its 31 values are lapel buttonhole styles throughout (Milanese,
  // Rome, Real (M), Fake round (M), Fake Square-end, eyelet, hand-worked…).
  // PARTIAL BY DESIGN: our "Double-Color Straight" family has no counterpart
  // here — those drawings come from the kutetailor 055* plates already in use —
  // so the residual bijection cannot fire (4 options vs 27 free values) and the
  // tool fills only what it can join. That is the correct outcome, not a gap.
  // GTECH/B draws an OPEN keyhole on the lapel (round eye + straight bar) and is
  // labelled "Real (M)"; C is a dashed square-ended bar (Fake Square-end) and D
  // the closed round keyhole (Fake round). Our "Real Functional (Machine)" is
  // that same machine-worked functional hole, and once C and D are claimed by
  // their own options B is the only "real" value left. Checked against the plate.
  //
  // RESOLVED 2026-08-27. This family had been RE-LABELLED away from the supplier's
  // naming: the supplier names values by SIZE ("Rome 1.8CM (M)", "008 by hand")
  // while the catalog had been rewritten to THREAD-COLOUR COUNT ("Double-Color
  // Straight A", "1/2 Double-Color Straight"). The vocabularies did not join, and
  // the rewrite actively contradicted the artwork - GTECH/34 is annotated in
  // Chinese as 三色, THREE colour, with three thread codes, under a catalog label
  // claiming DOUBLE colour.
  //
  // Owner instruction: keep the supplier name. 18 option labels per product were
  // restored verbatim from GTECH, joined on the option ids, which were minted
  // from those same supplier labels at import time. Only ids whose EVERY token is
  // accounted for in the supplier label were restored; partial matches (Rose
  // Round Shape vs "Fake round") were left alone. See
  // public/images/reports/lbh-supplier-rename-log.json for every before/after.
  //
  // With the labels back, the ordinary label join reaches these values on its own
  // and the holds are gone. lbh-no1-dc-half stays held: the "No.1" series is a
  // different supplier line (055R/055Y under blueprints/supplier) with no GTECH
  // counterpart at all, so there is nothing here for it to join to.
  'lapel-bh-style': {
    part: 'jacket', supplierField: 'GTECH',
    evidence: 'GTECH/C shows a lapel buttonhole marked on a notch lapel; all 31 values are buttonhole styles',
    aliases: { 'lbh-real': 'B' },
    holdOptions: ['lbh-no1-dc-half'],
  },
  // KFAXK/C2 draws a sleeve panel with a turn-back cuff outlined in red at the
  // hem; its values are Angled Vent / Square / Round / British turn-up /
  // TURN BACK 3.5cm / TURN BACK 4cm — our cuff family exactly, plus one square
  // cuff we do not sell.
  'cuff-style': { part: 'jacket', supplierField: 'KFAXK', evidence: 'KFAXK/C2 shows a sleeve with a turn-back cuff outlined; values are the cuff-style family' },
  // REQGZ/C draws a whole jacket with red dashed pick-stitch runs along the
  // lapel, collar, front edge, pockets and sleeve vent — which is verbatim the
  // label of that value, and of our option.
  'pick-stitching-position': { part: 'jacket', supplierField: 'REQGZ', evidence: 'REQGZ/C shows pick stitching marked along lapel, collar, front, pockets and sleeve vent' },
  // The two biggest holes in the whole A-block, and both were already mapped by
  // map_baoxiniao.mjs months ago — the proposal was simply never applied.
  // REQPD/D draws a jacket front with a horizontal jetted pocket outlined in red
  // at hip level. 18 proposals, every one resolving to a drawing on disk.
  // REQPD/5 draws a patch pocket outlined in red with an ANGLED button tab at the
  // top and a magnified callout of the button. It is labelled "Patch Pocket with
  // Angled Button Tad" - a supplier typo for Tab - which is why the token matcher
  // could not reach our "Patch + Angled Button Tab". Its straight and rounded
  // siblings are separate values (6, 7), so the angled reading is not in doubt.
  //
  // HELD, and why. The welt sizes are each published THREE times: 1cm as N/P/V,
  // 1.2cm as E/K/T, 1.5cm as F/L/U - nine distinct files, no duplicates. Opening
  // N, P and V shows three DIFFERENT pocket angles (near-horizontal, horizontal,
  // and a pronounced slant) all captioned "Straight Welt Pocket in 1cm". Our
  // option is only "Welt Pocket 1.0 cm" and carries no angle, so every join is a
  // coin flip between visibly different garments. Held for the owner, exactly as
  // the KINBL small-cut-away case above.
  'lower-pocket': {
    part: 'jacket', supplierField: 'REQPD',
    evidence: 'REQPD/D shows a jetted hip pocket outlined in red on a jacket front',
    aliases: { 'lp-patch-btn-tab-angled': '5' },
    holdOptions: ['lp-welt-10', 'lp-welt-12', 'lp-welt-15'],
  },
  // KFABL/L draws a jacket whose lapel carries a red dimension line annotated
  // "4.5cm". Each width gets its OWN dimensioned plate, which also retires the
  // shared-image defect where one generic `0002__Peak.jpg` backed every width.
  // TWO garments, one field id - see the array note at the lookup site. The vest
  // entry is PARTIAL BY DESIGN: BM/KFABL runs 5 / 5.5 / 6 / 6.5 / 7 / 7.5 / 8 /
  // 10 cm, so our "Wide 9 cm" has no counterpart and is held rather than rounded
  // to 8 or 10 - a lapel width is a measurement the customer is choosing.
  'lapel-width': [
    { part: 'jacket', supplierField: 'KFABL', evidence: 'KFABL/L shows a lapel with a red dimension line annotated 4.5cm; one plate per width' },
    {
      part: 'vest', supplierField: 'KFABL',
      aliases: { 'vest-lapel-narrow': 'C', 'vest-lapel-standard': 'F' },
      holdOptions: ['vest-lapel-wide'],
      evidence: 'BM/KFABL is named "Lapel width" and publishes a dimensioned plate per width; 6cm -> C and 7.5cm -> F, while 9cm does not exist in the field',
    },
  ],
  // REQCL/22 draws a peak lapel with its gorge angle annotated "102°" in red.
  // Its 39 values are lapel styles throughout, and — critically — it carries a
  // SEPARATE dimensioned plate for every peak angle we sell (99, 101, 102, 103
  // curved, 105, 107, 108, 110, 110 low, 115, 120 curved). That is the direct
  // cure for the shared-image defect that withheld 22 crafts from wave-02, where
  // one generic `0002__Peak.jpg` stood in for all of them.
  'lapel-style': { part: 'jacket', supplierField: 'REQCL', evidence: 'REQCL/22 shows a peak lapel dimensioned 102°; one plate per angle across 39 values' },
  // REQPU/D draws a jacket front with a CURVED (barchetta) welt chest pocket
  // outlined in red and dimensioned "2.3cm". Its 20 values cover our whole
  // chest-pocket family with a plate per measurement - straight welt 2.3/2.5/2.7,
  // curved welt 2.3/2.5/2.7/2.9, boat 2.8/3.0 - which retires three shared-plate
  // defects at once (0101__Normal backing 3 straight welts, 0102__Arc backing 4
  // curved welts, 0103__Ship_shape backing both boats) and fills six options
  // that had no drawing at all.
  'chest-pocket': { part: 'jacket', supplierField: 'REQPU', evidence: 'REQPU/D shows a curved welt chest pocket dimensioned 2.3cm; 20 values, one plate per measurement' },
  // GCOXC/C draws a sleeve cuff with its button column and a magnified callout
  // on the vent. Its five values map one-to-one onto our five, including the
  // supplier's own typo "Fuctional without buttonhole":
  //   None -> N | Mock -> B | Functional -> A |
  //   Functional + Mock -> C | Functional (No Buttonhole) -> D
  'sleeve-vent': { part: 'jacket', supplierField: 'GCOXC', evidence: 'GCOXC/C shows a sleeve cuff and vent with its button column; 5 values matching our 5 options' },
  // GTEGZ/F draws a whole jacket with red dashed DOUBLE pick-stitching along the
  // lapel, collar, front edge and pockets - "0.15*0.6cm double pic stitching".
  // It is the stitch TYPE and gauge, complementing REQGZ which is the POSITION,
  // and its 8 values map one-to-one onto our 8.
  'pick-stitching': { part: 'jacket', supplierField: 'GTEGZ', evidence: 'GTEGZ/F shows double pick stitching along the lapel and front edge; 8 values matching our 8 options' },
  // REQBT/11 draws a double-breasted jacket front with four buttons arranged
  // 2x2 - "DB 4 BY 2". Our whole family joins: SB 5 -> "SB 5", DB 2x1 ->
  // "DB 2 BY 1", and so on through 6x2.
  'button-config': { part: 'jacket', supplierField: 'REQBT', evidence: 'REQBT/11 shows a double-breasted 4x2 button front; 7 of 7 options join' },
  // JWBZS/D draws a jacket front with a horizontal button loop on the chest,
  // marked in red and dimensioned.
  'external-decoration': { part: 'jacket', supplierField: 'JWBZS', evidence: 'JWBZS/D shows a horizontal chest button loop marked and dimensioned' },
  // SHSMD is already the source for this field's other options
  // (/images/supplier-bb/SHSMD/*); this fills the ones still empty.
  'sleeve-head': { part: 'jacket', supplierField: 'SHSMD', evidence: 'SHSMD already backs this field elsewhere in the catalog; Natural and Con rollino join exactly' },
  // REQAP/D draws the BACK of a jacket with side vents at the hem and the inner
  // belt as a shaded panel. Values: None / Center vent / Side Vents / Side vents
  // with inner belt / Side Vents+Fixed Belt. NOTE the orientation is BACK, not
  // front - the spec must be re-extracted with --orientation=back.
  'back-vent-style': { part: 'jacket', supplierField: 'REQAP', orientation: 'back', evidence: 'REQAP/D shows a jacket BACK with side vents and an inner belt panel' },
  // shirt|REQCL is the shirt COLLAR dictionary (our field is confusingly named
  // `lapel`). Stand collar 5cm, One-Piece 8/8.5/9cm with Tab and DR Point 5.8cm
  // all join on their exact dimensions.
  'lapel': { part: 'shirt', supplierField: 'REQCL', evidence: 'shirt REQCL is the collar dictionary; 5 of 6 options join on exact dimensions' },
  // REKPL/C is simply "None" against our "No Bar Tacks"; the other option in the
  // field already has its drawing.
  // "No Bar Tacks" -> "None" is unambiguous in meaning but not in words: the
  // residual scorer actually rates "I-bartack" HIGHER (it shares `bar` and
  // `tack`), which is exactly backwards. Stated explicitly instead.
  'bar-tack': {
    part: 'trousers', supplierField: 'REKPL',
    evidence: 'REKPL is the trouser bartack family (I / C / X / D-bartack and None)',
    aliases: { 'bartack-none': 'C' },
  },
  // KPOQZ/B draws a trouser front with no pleats and no darts - waistband, belt
  // loops, fly, nothing else. That is our "Flat Front (No Dart)". Its siblings
  // already hold drawings from other sources; this fills the only empty one.
  // PROCE already backs this field (fused -> A, half -> B, light half -> D), so
  // the field identity is settled by the catalog itself. "Ultra-thin Half
  // Canvas" matches PROCE/L exactly. "Full Canvas (Floating)" -> C follows the
  // pattern the siblings establish: the supplier's "Regular X" is our
  // unqualified X, and its "Light X" is our "Light X".
  'canvas': {
    part: 'jacket', supplierField: 'PROCE',
    evidence: 'PROCE already supplies this field in the catalog (A/B/D); L is an exact label match for Ultra-thin Half Canvas',
    aliases: { 'ultra-thin-half': 'L', 'full-canvas': 'C' },
  },
  'pleat-style': {
    part: 'trousers', supplierField: 'KPOQZ',
    evidence: 'KPOQZ/B shows a flat trouser front with no pleats and no darts',
    aliases: { 'flat-front': 'B' },
  },
  // KPOKS/B draws a trouser front with the pocket BAG outlined deeper than the
  // standard one. The correspondence is ARITHMETIC, not textual: our catalog
  // states Standard = 23 cm, and the supplier expresses depth as a delta from
  // standard. 20 cm is therefore "Reduce 3cm" and 26 cm is "Add 3cm" - one
  // consistent assignment, no choice left. The matcher cannot do arithmetic, so
  // these three are stated explicitly rather than guessed at.
  'pocket-depth': {
    part: 'trousers',
    supplierField: 'KPOKS',
    evidence: 'KPOKS/B shows the trouser pocket bag outlined deeper than standard; depth expressed as a delta from Standard',
    aliases: { 'pocket-shallow': 'F', 'pocket-standard': 'A', 'pocket-deep': 'C' },
  },
};

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** Compact form: strip spaces entirely. "Flap 4.5 cm" -> "flap45cm". */
const tight = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
/** The numbers a label carries, in order. A measurement family lives or dies on these. */
const nums = (s) => (String(s ?? '').match(/\d+(?:\.\d+)?/g) ?? []).map((n) => String(Number(n)));
/**
 * Word tokens, with the unit split off a measurement. The supplier writes
 * "Regular Slanted Flap in 4cm" and we write "Slanted Flap 4.0 cm"; without the
 * split, `cm` is a token on our side and `4cm` on theirs, so containment failed
 * on every measured option in the family.
 */
const wordTokens = (s) => new Set(
  norm(s).replace(/(\d)\s*(cm|mm)(?![a-z])/g, '$1 $2').split(' ').filter((w) => w.length >= 2 && !/^\d+$/.test(w))
);

/**
 * Join ONE catalog option label to ONE supplier value, on evidence.
 * Returns null rather than a best guess — an unmatched option keeps its empty
 * slot and is reported, which is recoverable; a wrong drawing is not.
 */
function joinOption(ourLabel, values) {
  const o = norm(ourLabel), ot = tight(ourLabel), on = nums(ourLabel);
  // 1. exact, normalised
  let hit = values.find((v) => norm(v.label) === o);
  if (hit) return { value: hit, how: 'exact-label' };
  // 2. exact once spaces and punctuation are removed (supplier labels arrive
  //    with the spaces stripped: "Flap4.5CM,amedesignwithlowerpocket")
  hit = values.find((v) => tight(v.label) === ot);
  if (hit) return { value: hit, how: 'exact-compact' };
  // 3. our label is a prefix of theirs AND every number agrees. Their labels
  //    carry a manufacturing note our catalog does not ("(seam excluded)").
  const pref = values.filter((v) => {
    const vt = tight(v.label);
    // ONE DIRECTION ONLY: their label may EXTEND ours with a manufacturing note
    // ("British Turn-up" -> "British turn-up cuff"). Ours extending theirs is a
    // different thing: "Side Vents + Inner Belt" prefix-matched plain "Side
    // Vents" and silently dropped the inner belt - the one feature that option
    // exists for - while REQAP publishes "Side vents with inner belt" separately.
    if (!vt.startsWith(ot)) return false;
    const vn = nums(v.label);
    return on.length === 0 ? vn.length === 0 : on.every((n, i) => vn[i] === n);
  });
  if (pref.length === 1) return { value: pref[0], how: 'prefix+numbers' };
  // 4. every number agrees and the leading word does — for "Italian Card Slot"
  //    vs "Ltalian suit card slot (1cm narrower than pocket)" the numbers differ,
  //    so this deliberately will NOT fire. Kept narrow on purpose.
  const strong = values.filter((v) => {
    const vn = nums(v.label);
    if (!on.length || on.length !== vn.length) return false;
    if (!on.every((n, i) => vn[i] === n)) return false;
    const a = o.split(' ')[0], b = norm(v.label).split(' ')[0];
    if (!a || a !== b) return false;
    // The head word and the numbers agreeing is NOT enough when our label
    // carries a further distinguishing token. "Peak 102°" and "Peak 102° RL"
    // share head `peak` and number `102`, so both matched "Peak Lapel 102°" and
    // the duplicate guard dropped BOTH, leaving them on a generic plate. Every
    // word we carry must appear in the value.
    const vt = new Set(norm(v.label).split(' '));
    return o.split(' ').every((w) => w.length < 2 || vt.has(w));
  });
  if (strong.length === 1) return { value: strong[0], how: 'numbers+head' };

  // 5. TOKEN CONTAINMENT with minimal excess.
  //
  // The head+numbers rule cannot separate "Peak 102°" from "Peak 102° RL":
  // both share head `peak` and number `102`, and the supplier's own
  // "102°RL Peak Lapel" begins with the number so it never becomes a candidate.
  // Result: both crafts resolved to the same plate and the duplicate guard
  // (correctly) dropped both, leaving them on a generic drawing.
  //
  // A value must contain EVERY distinctive token of our label; among those, the
  // one carrying the fewest extra tokens wins, and it must win outright.
  //   "Peak 102°"     -> {peak,102}     : "Peak Lapel 102°" excess {lapel}      WINS
  //                                       "102°RL Peak Lapel" excess {rl,lapel}
  //   "Peak 102° RL"  -> {peak,102,rl}  : "Peak Lapel 102°" lacks `rl`, excluded
  //                                       "102°RL Peak Lapel" contains all      WINS
  const ourToks = wordTokens(ourLabel);
  if (ourToks.size) {
    const contained = values
      .map((v) => {
        // Every number we carry must be present, and every word we carry must
        // be present. Only then is the value a candidate at all.
        if (on.length) { const vn = nums(v.label); if (!on.every((n) => vn.includes(n))) return null; }
        const vt = wordTokens(v.label);
        // A token counts as present if the value carries it, or carries an
        // inflection of it: "stitch" -> "stitching", "curve" -> "curved".
        // Held to tokens of 4+ characters with at most 3 extra, so short words
        // cannot drift ("in" must never satisfy itself via "inner").
        const has = (t) => vt.has(t)
          || (t.length >= 4 && [...vt].some((w) => w.startsWith(t) && w.length - t.length <= 3));
        for (const t of ourToks) if (!has(t)) return null;
        let excess = 0;
        for (const t of vt) if (!ourToks.has(t)) excess += 1;
        return { v, excess };
      })
      .filter(Boolean)
      .sort((a, b) => a.excess - b.excess);
    if (contained.length === 1) return { value: contained[0].v, how: 'token-containment' };
    if (contained.length > 1 && contained[0].excess < contained[1].excess) {
      return { value: contained[0].v, how: 'token-containment' };
    }
  }
  return null;
}

/**
 * RESIDUAL COMPLETION — the last, and strongest, step.
 *
 * After the confident joins, if the options still unmatched and the supplier
 * values still unclaimed are the SAME SIZE, and each remaining pair agrees on
 * either its numbers or its distinctive head word, the assignment is forced: a
 * bijection with no free choice left. That is an inference, not a guess.
 *
 * It is what settles the supplier's typos without loosening the matcher:
 *   "Italian Card Slot"  <- "Ltalian suit card slot (1cm narrower than pocket)"
 *   "Formal Card Holder" <- "Formal card holder (1cm narrower than pocket)"
 *   "RL Card Pocket"     <- "RL Card Pocket (1cm narrower)"
 *   "Flap 5.0 cm"        <- "Flap5CM,amedesignwithlowerpocket(seamexcluded)"
 * The "(1cm narrower…)" suffix is a manufacturing note, not a different craft,
 * and it is exactly what defeated the number rule.
 *
 * If the two residual sets differ in size, or any pair shares no evidence at
 * all, NOTHING is completed — the options keep their empty slots and are
 * reported. A forced bijection is only trustworthy when it is actually forced.
 */
function completeResidual(optionsLeft, valuesLeft) {
  // Originally this demanded equal-sized residuals — a literal forced bijection.
  // That was too tight: the supplier routinely offers values we do not sell
  // (a "Square sleeve cuff" we have no option for), which left `cuff-style` with
  // 1 option against 2 values and refused an obvious join. The guarantee that
  // actually matters is the STRICT WINNER below, not the equal count, so the
  // requirement is now "no more options than values" and every option must still
  // win its value outright. Leftover supplier values are expected and fine.
  if (!optionsLeft.length || optionsLeft.length > valuesLeft.length) return new Map();

  // "Contains a shared word" is far too weak here: every remaining ticket-pocket
  // value contains "card", so three options each matched three values and the
  // bijection could not be seen. Score instead, and demand a STRICT winner.
  const score = (o, v) => {
    const on = nums(o.label), vn = nums(v.label), vt = tight(v.label);
    let s = 0;
    if (on.length && on.every((n) => vn.includes(n))) s += 3;
    for (const w of norm(o.label).split(' ')) {
      if (w.length < 2) continue;
      if (vt.includes(w)) s += 1;
      // one-character OCR slip at the head of the word: the supplier ships
      // "Ltalian" for "Italian".
      else if (w.length > 4 && vt.includes(w.slice(1))) s += 1;
    }
    return s;
  };

  const pairs = new Map();
  const taken = new Set();
  for (const o of optionsLeft) {
    const ranked = valuesLeft
      .filter((v) => !taken.has(v.code))
      .map((v) => ({ v, s: score(o, v) }))
      .sort((a, b) => b.s - a.s);
    // A strict, non-zero maximum, or nothing at all.
    if (ranked.length === 0 || ranked[0].s === 0) return new Map();
    if (ranked.length > 1 && ranked[0].s === ranked[1].s) return new Map();
    pairs.set(o.id, ranked[0].v);
    taken.add(ranked[0].v.code);
  }
  return pairs.size === optionsLeft.length ? pairs : new Map();
}

/**
 * Plates a previous VISION audit judged wrong. Checked before anything is
 * assigned, because a filename is not evidence: `0621__4_flat.jpg` was assigned
 * to `cuff-button-number/cb-4` on the strength of its name and its siblings'
 * numbering, and `subject-audit-consolidated.json` already held the verdict -
 * "the COUNT is wrong ... EIGHT evenly spaced marks, not four". Count is the
 * entire discriminator for that field. The assignment had to be reverted.
 */
const auditMismatch = new Set();
const auditAmbiguous = new Set();
{
  const f = path.join(REPO, 'public/images/reports/subject-audit-consolidated.json');
  if (fs.existsSync(f)) {
    for (const r of (JSON.parse(fs.readFileSync(f, 'utf8')).results ?? [])) {
      if (r.v === 'MISMATCH' && r.bp) auditMismatch.add(r.bp);
      // AMBIGUOUS means a vision audit LOOKED at the plate and could not confirm
      // it shows this craft. That is documented doubt, not a drawing. A plate
      // the supplier publishes under the option's own field is strictly better
      // evidence, so an AMBIGUOUS plate may be replaced - unlike a plain
      // unaudited one, which is never overwritten.
      if (r.v === 'AMBIGUOUS' && r.bp) auditAmbiguous.add(r.bp);
    }
  }
}

const v2 = JSON.parse(fs.readFileSync(V2, 'utf8'));
const byField = new Map();
for (const e of v2.images) {
  const k = `${e.part}|${e.field}`;
  if (!byField.has(k)) byField.set(k, []);
  byField.get(k).push(e);
}

const changes = [];
const unmatched = [];
const skipped = [];
const resolved = new Map();
const publishedFiles = new Set();

/**
 * Which garment does a catalog row belong to? A suit hosts its trouser and vest
 * sections under a `Trousers-*` / `Vest-*` prefix, and the SAME field id serves
 * more than one garment: `lapel-width` carries 17 jacket widths AND 3 vest
 * options (Narrow 6 cm / Standard 7.5 cm / Wide 9 cm). Collecting them together
 * put 20 options against 17 jacket-only drawings, which both blocked the
 * residual and — far worse — made a vest option eligible for a jacket plate.
 */
function partForSection(productId, sectionId) {
  if (/^Trousers-/i.test(sectionId) || productId === 'trousers') return 'trousers';
  if (/^Vest-/i.test(sectionId) || productId === 'vest') return 'vest';
  if (productId === 'shirt') return 'shirt';
  return 'jacket';
}

/**
 * part|field -> the set of supplier VALUE CODES whose plate is already the
 * illustration of some option in that field. Derived from the live catalog.
 */
const alreadyUsedValues = new Map();
/**
 * part|field -> option ids that ALREADY have a drawing.
 *
 * The solver used to run every option of a field, including ones already
 * illustrated. Measured on `back-vent-style`: "Side Vents" (already holding
 * REQAP/C) re-joined to the free REQAP/D "Side vents with inner belt" - it
 * contains both its tokens - and claimed it, leaving the option that plate
 * actually belongs to, "Side Vents + Inner Belt", with nothing. An option that
 * is already answered must not compete for a plate it will never use.
 */
const optionsWithDrawing = new Map();
{
  for (const file of fs.readdirSync(OPT_DIR)) {
    if (!file.endsWith('.json')) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(OPT_DIR, file), 'utf8'));
    const productId = doc.productId ?? path.basename(file, '.json');
    for (const section of doc.sections ?? []) {
      const part = partForSection(productId, section.id ?? '');
      for (const field of section.fields ?? []) {
        const key = `${part}|${field.id}`;
        for (const opt of field.options ?? []) {
          const ill = opt.illustration ?? opt.techpackIllustration;
          if (typeof ill !== 'string') continue;
          // Not on disk = not a drawing. It must neither claim a plate nor mark
          // the option answered, or a dangling reference silently blocks the
          // craft from ever being filled.
          if (!fs.existsSync(path.join(REPO, 'public', ill.replace(/^\//, '')))) continue;
          // A plate a vision audit judged AMBIGUOUS is documented doubt, not an
          // answer. Counting it as answered locks the option out of its own
          // alias table, so the supplier's exact per-option plate can never
          // reach it - measured on 13 shirt crafts whose aliases were written,
          // matched, and then silently skipped.
          if (auditAmbiguous.has(ill)) continue;
          const m = ill.match(/\/([^/]+)\.[a-z0-9]+$/i);
          if (!m) continue;
          if (!alreadyUsedValues.has(key)) alreadyUsedValues.set(key, new Set());
          alreadyUsedValues.get(key).add(m[1]);
          if (!optionsWithDrawing.has(key)) optionsWithDrawing.set(key, new Set());
          optionsWithDrawing.get(key).add(opt.id);
        }
      }
    }
  }
}

/** illustration path -> the DISTINCT craft identities currently using it. */
const illustrationUsers = new Map();
{
  for (const file of fs.readdirSync(OPT_DIR)) {
    if (!file.endsWith('.json')) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(OPT_DIR, file), 'utf8'));
    const productId = doc.productId ?? path.basename(file, '.json');
    for (const section of doc.sections ?? []) {
      const part = partForSection(productId, section.id ?? '');
      for (const field of section.fields ?? []) {
        for (const opt of field.options ?? []) {
          const ill = opt.illustration ?? opt.techpackIllustration;
          if (!ill) continue;
          if (!illustrationUsers.has(ill)) illustrationUsers.set(ill, new Set());
          illustrationUsers.get(ill).add(`${part}|${field.id}|${opt.id}`);
        }
      }
    }
  }
}

/** part|field -> Map(optionId -> label). Scoped, so garments never mix. */
const optionsOfField = new Map();
{
  for (const file of fs.readdirSync(OPT_DIR)) {
    if (!file.endsWith('.json')) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(OPT_DIR, file), 'utf8'));
    const productId = doc.productId ?? path.basename(file, '.json');
    for (const section of doc.sections ?? []) {
      const part = partForSection(productId, section.id ?? '');
      for (const field of section.fields ?? []) {
        const key = `${part}|${field.id}`;
        if (!optionsOfField.has(key)) optionsOfField.set(key, new Map());
        for (const opt of field.options ?? []) {
          if (opt.id && opt.label) optionsOfField.get(key).set(opt.id, opt.label);
        }
      }
    }
  }
}

/** Solve one catalog field against its supplier field: confident joins, then residual. */
function solveField(fieldId, spec, values) {
  const table = new Map();
  const opts = [...(optionsOfField.get(`${spec.part}|${fieldId}`) ?? new Map())].map(([id, label]) => ({ id, label }));
  // A plate ALREADY serving another option of this field cannot serve this one
  // too - that is the shared-image rule. Pre-claiming those is not just hygiene,
  // it disambiguates: "Slanted Flap 4.0 cm" scored an exact tie between
  // "Regular Slanted Flap in 4cm" and "Large Slanted Flap in 4cm" (our label
  // carries no token separating them), but the Large family already owns its
  // plates, so once those are taken only the Regular one remains and the join
  // becomes forced rather than a coin flip.
  const claimed = new Set(alreadyUsedValues.get(`${spec.part}|${fieldId}`) ?? []);
  const answered = optionsWithDrawing.get(`${spec.part}|${fieldId}`) ?? new Set();
  /**
   * Options this mapping must NEVER fill, even though the field as a whole is
   * verified. The case that forced this: KINBL publishes TWO values both
   * labelled "Small cut-away lining" (B and E) whose drawings show visibly
   * DIFFERENT lining depths. Our catalog has one "Small Cut-away". Any join is
   * a coin flip between two different garments, so the option is held for the
   * owner rather than filled. A held option stays in state A - which is honest -
   * instead of silently acquiring a 50/50 plate.
   */
  const held = new Set(spec.holdOptions ?? []);
  // Explicit, documented per-option aliases. The escape hatch for a
  // correspondence that is provable but NOT textual - see `pocket-depth`, where
  // the supplier states depth as a delta from a standard our catalog defines in
  // absolute centimetres. Applied before matching, and it claims its plate so
  // nothing else can take it.
  for (const [optId, code] of Object.entries(spec.aliases ?? {})) {
    if (answered.has(optId) || held.has(optId)) continue;
    const v = values.find((x) => x.code === code);
    if (!v) continue;
    table.set(optId, { value: v, how: 'explicit-alias' });
    claimed.add(code);
  }
  // Two passes. The first joins only what is unambiguous among the still-free
  // plates; each join removes that plate from the pool, which can turn a later
  // ambiguity into a forced choice. Re-running until nothing new joins is what
  // lets "Slanted Flap 4.0 cm" resolve: it ties with the Large variant until the
  // Large family's plates are taken, and then only one candidate is left.
  for (let pass = 0; pass < 4; pass += 1) {
    let joinedThisPass = 0;
    for (const o of opts) {
      if (table.has(o.id) || answered.has(o.id) || held.has(o.id)) continue;
      const available = values.filter((v) => !claimed.has(v.code));
      const j = joinOption(o.label, available);
      if (j) { table.set(o.id, j); claimed.add(j.value.code); joinedThisPass += 1; }
    }
    if (!joinedThisPass) break;
  }
  const optionsLeft = opts.filter((o) => !table.has(o.id) && !answered.has(o.id));
  const valuesLeft = values.filter((v) => !claimed.has(v.code));
  for (const [id, v] of completeResidual(optionsLeft, valuesLeft)) {
    table.set(id, { value: v, how: 'residual-bijection' });
  }

  // NO PLATE MAY SERVE TWO CRAFTS. Caught live: "Peak 102°" and "Peak 102° RL"
  // both resolved to REQCL/22, because the head-word rule sees `peak` + `102` in
  // each and REQCL's own "102°RL Peak Lapel" (BJ) starts with the number, so it
  // never became a candidate. Writing that would have MANUFACTURED the very
  // shared-image defect this run exists to retire.
  //
  // Both sides of a duplicate are dropped, not arbitrated: choosing between them
  // is exactly the guess the project forbids. They are reported instead.
  const claimants = new Map();
  for (const [id, j] of table) {
    if (!claimants.has(j.value.code)) claimants.set(j.value.code, []);
    claimants.get(j.value.code).push(id);
  }
  for (const [code, ids] of claimants) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      table.delete(id);
      duplicateRefusals.push({ field: fieldId, part: spec.part, option: id, supplierValue: code,
        why: `${ids.length} options resolved to the same plate (${ids.join(', ')}) — a drawing cannot be the authority for two crafts` });
    }
  }
  return table;
}

for (const file of fs.readdirSync(OPT_DIR)) {
  if (!file.endsWith('.json')) continue;
  const abs = path.join(OPT_DIR, file);
  const doc = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const productId = doc.productId ?? path.basename(file, '.json');
  let dirty = false;

  for (const section of doc.sections ?? []) {
    const part = partForSection(productId, section.id ?? '');
    for (const field of section.fields ?? []) {
      /**
       * A field id may carry MORE THAN ONE mapping when the same id is used on
       * two garments. `lapel-width` is the case: the jacket takes KFABL/BB and
       * the vest takes KFABL/BM - same supplier field code, different category,
       * different drawings. Accept either a single spec or an array and pick the
       * one for this section's garment.
       */
      const specs = VERIFIED[field.id];
      if (!specs) continue;
      const spec = Array.isArray(specs) ? specs.find((x) => x.part === part) : specs;
      if (!spec) continue;
      if (ONLY && ONLY !== field.id) continue;
      // A verified mapping belongs to ONE garment. `lapel-width` exists on both
      // the jacket and the vest; the jacket plates must never reach the vest.
      if (spec.part !== part) { skipped.push({ field: field.id, option: `(${part})`, why: `mapping is for ${spec.part}, this section is ${part}` }); continue; }

      const values = (byField.get(`${spec.part}|${spec.supplierField}`) ?? [])
        .map((e) => ({
          label: e.label,
          code: e.value,
          srcPath: e.publicPath,
          // PART-SCOPED, and it must stay that way. The supplier reuses a field
          // CODE across garments with different artwork behind it: KFABL is
          // "Lapel width" on both the jacket (BB) and the vest (BM), and GLKMO
          // is "Front buttonhole" on the jacket but "Buttonhole" on trousers.
          // An unscoped destination collapses both onto one file, so whichever
          // garment is copied first wins and the other silently renders the
          // wrong garment's drawing. Measured: 4 such collisions, the worst of
          // them serving the trousers' HAND-WORKED buttonhole option a picture
          // of a jacket MACHINE buttonhole - because BB and BD also invert the
          // A/H value codes.
          publicPath: `/${DEST_REL}/${spec.part}/${spec.supplierField}/${e.value}${path.extname(e.publicPath)}`,
        }));

      const cacheKey = `${spec.part}|${field.id}|${spec.supplierField}`;
      if (!resolved.has(cacheKey)) resolved.set(cacheKey, solveField(field.id, spec, values));
      const table = resolved.get(cacheKey);

      for (const node of field.options ?? []) {
        if (!node.id || !node.label) continue;
        const has = (k) => typeof node[k] === 'string' && node[k].length > 0;
        const current = node.illustration ?? node.techpackIllustration ?? null;
        if (current) {
          // The ONE case where an existing drawing may be replaced: it is a
          // proven shared-image defect. If this plate also backs a DIFFERENT
          // craft identity, it cannot be the authority for either — that is V4
          // §3 (no generic category illustration) and the §20 "zero shared-image
          // defects" invariant. One `0002__Peak.jpg` stood in for ten peak
          // lapels from 99° to 120°, which is why 22 crafts had to be withheld
          // from wave-02. Replacing it with the supplier's own per-angle
          // dimensioned plate is the documented fix, and the precedent is
          // already in this repo (RUN-2026-08-12, lapel-peak-101).
          //
          // Gated behind --replace-shared, never silent, and the previous value
          // is written to illustration-history.json before it is overwritten.
          // A reference to a file that is NOT ON DISK is not a drawing. Found on
          // suit-2pc/canvas/ultra-thin-half, which pointed at
          // /images/ultra/ultra-thin-half-OIP.jpg - a file that does not exist
          // and is explicitly allowlisted in catalog_invariants. It blocked the
          // craft from ever being filled, and made the option look answered.
          const currentAbs = path.join(REPO, 'public', String(current).replace(/^\//, ''));
          const missingOnDisk = !fs.existsSync(currentAbs);
          const sharedBy = illustrationUsers.get(current);
          // NOTE: options already holding an unscoped baoxiniao path are NOT
          // migrated here. solveField deliberately excludes answered options and
          // pre-claims their plates, so forcing them back through the join table
          // finds nothing and reports 654 false "no evidence join" rows. The
          // migration is a separate, deterministic one-shot:
          // tools/migrate_blueprint_scoping.mjs.
          if (missingOnDisk) {
            replacedFrom.set(`${field.id}|${node.id}`, { previous: current, sharedWith: [], why: 'previous illustration file does not exist on disk' });
          } else if (auditAmbiguous.has(current)) {
            replacedFrom.set(`${field.id}|${node.id}`, { previous: current, sharedWith: [], why: 'a vision audit judged the previous plate AMBIGUOUS - it could not be confirmed to show this craft' });
          } else if (!REPLACE_SHARED || !sharedBy || sharedBy.size < 2) {
            skipped.push({ field: field.id, option: node.id, why: 'already has a drawing - never overwritten' });
            continue;
          } else {
          replacedFrom.set(`${field.id}|${node.id}`, { previous: current, sharedWith: [...sharedBy].filter((x) => x !== `${part}|${field.id}|${node.id}`) });
          }
        }
        const j = table.get(node.id);
        if (!j) { unmatched.push({ field: field.id, option: node.id, label: node.label, why: 'no value joined on evidence' }); continue; }
        if (auditMismatch.has(j.value.srcPath) || auditMismatch.has(j.value.publicPath)) {
          unmatched.push({ field: field.id, option: node.id, label: node.label, why: `a previous vision audit judged this plate a MISMATCH: ${j.value.srcPath}` });
          continue;
        }
        const prior = replacedFrom.get(`${field.id}|${node.id}`);
        changes.push({ file, field: field.id, option: node.id, label: node.label,
          supplierField: spec.supplierField, supplierValue: j.value.code, supplierLabel: j.value.label,
          path: j.value.publicPath, how: j.how, evidence: spec.evidence,
          ...(prior ? { previous: prior.previous, sharedWith: prior.sharedWith } : {}) });
        if (APPLY) {
          const srcAbs = path.join(REPO, 'public', j.value.srcPath.replace(/^\//, ''));
          const dstAbs = path.join(REPO, 'public', j.value.publicPath.replace(/^\//, ''));
          if (!fs.existsSync(dstAbs)) {
            if (!fs.existsSync(srcAbs)) { unmatched.push({ field: field.id, option: node.id, label: node.label, why: `source drawing missing: ${j.value.srcPath}` }); continue; }
            fs.mkdirSync(path.dirname(dstAbs), { recursive: true });
            fs.copyFileSync(srcAbs, dstAbs);
            publishedFiles.add(j.value.publicPath);
          }
          const priorIllustration = current;
          node.illustration = j.value.publicPath;
          node.techpackIllustration = j.value.publicPath;
          node.illustrationStatus = 'drawing';
          dirty = true;

          /**
           * Repointing a craft SILENTLY INVALIDATES its spec. The spec records
           * what was read off the OLD drawing — view, measurements, forbidden
           * features — and stage 2 builds the prompt from the spec, not from the
           * image. So a craft whose drawing changed but whose spec did not will
           * be generated from the previous drawing's reading and score well
           * against it, because QC also grades against the spec.
           *
           * Measured on this run: 22 crafts already had a spec, and most of the
           * stale ones pointed into the BANNED `/images/jacket/` fallback tree —
           * including cb-4, whose old plate the subject audit had recorded as
           * showing EIGHT marks for a four-button option.
           *
           * Dropping the marker is what makes that visible;
           * reinterpret_changed_illustrations.mjs clears it by re-deriving. The
           * marker carries the ORIENTATION because a single global flag cannot
           * be right for a batch mixing interior lining plates, jacket fronts
           * and magnified cuff details.
           */
          const specPath = path.join(REPO, '.craft-pipeline', productId, node.id, 'spec.json');
          if (fs.existsSync(specPath)) {
            fs.writeFileSync(path.join(path.dirname(specPath), 'illustration-changed.json'), JSON.stringify({
              product: productId, optionId: node.id,
              sectionId: section.id ?? '', fieldId: field.id,
              craftId: `${productId}|${section.id ?? ''}|${field.id}|${node.id}`,
              specWasBuiltFrom: priorIllustration, illustrationNow: j.value.publicPath,
              orientation: spec.orientation ?? null,
              detectedAt: new Date().toISOString(),
              by: 'apply_field_mapping.mjs — the drawing changed, so the spec must be re-derived before this craft is generated',
            }, null, 2) + String.fromCharCode(10), 'utf8');
          }
        }
      }
    }
  }

  if (APPLY && dirty) fs.writeFileSync(abs, JSON.stringify(doc, null, 2) + String.fromCharCode(10), 'utf8');
}

if (APPLY && changes.length) {
  const hist = fs.existsSync(HISTORY) ? JSON.parse(fs.readFileSync(HISTORY, 'utf8')) : [];
  const arr = Array.isArray(hist) ? hist : (hist.events ?? []);
  for (const c of changes) {
    arr.push({ at: new Date().toISOString(), by: 'apply_field_mapping.mjs', action: 'set-illustration',
      field: c.field, option: c.option, previous: c.previous ?? null, next: c.path, sharedWith: c.sharedWith ?? null,
      supplier: { field: c.supplierField, value: c.supplierValue, label: c.supplierLabel }, join: c.how, evidence: c.evidence });
  }
  fs.writeFileSync(HISTORY, JSON.stringify(Array.isArray(hist) ? arr : { ...hist, events: arr }, null, 2) + '\n', 'utf8');
  fs.writeFileSync(LOG, JSON.stringify({ ranAt: new Date().toISOString(), changes, unmatched, skipped }, null, 2) + '\n', 'utf8');
}

const byHow = {};
for (const c of changes) byHow[c.how] = (byHow[c.how] ?? 0) + 1;
console.log(`drawing files copied into ${DEST_REL} : ${publishedFiles.size}`);
console.log(`rows that would gain a drawing : ${changes.length}   ${JSON.stringify(byHow)}`);
console.log(`options with no evidence join  : ${unmatched.length}`);
console.log(`skipped, already has a drawing : ${skipped.length}`);
console.log(`refused - plate claimed twice   : ${new Set(duplicateRefusals.map((d) => d.field + '|' + d.option)).size}`);
console.log(`shared-plate REPLACEMENTS      : ${changes.filter((c) => c.previous).length}${REPLACE_SHARED ? '' : '   (--replace-shared not set)'}`);
for (const c of changes.slice(0, 14)) console.log(`   + ${c.field}/${c.option.padEnd(22)} "${c.label}" -> ${c.supplierField}/${c.supplierValue} (${c.how})`);
for (const u of unmatched.slice(0, Number(process.env.SHOW_UNMATCHED || 10))) console.log(`   ? ${u.field}/${u.option} "${u.label}" — ${u.why}`);
console.log(APPLY ? `\napplied; history -> data-store/illustration-history.json` : '\ndry run — re-run with --apply.');
