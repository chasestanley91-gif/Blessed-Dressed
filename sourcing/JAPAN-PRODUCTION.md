# Japan Production — Yamamoto EXCY

**Active negotiation · last updated 2026-08-25**

The production-partner track, separate from cloth sourcing. Contact came out of the
2026-08-18 sourcing report, which identified EXCY as the one candidate publishing —
in writing — contract sewing with **no minimum quantity**, routed into certified
partner factories. That has now been substantiated in correspondence.

## Who

| | |
| --- | --- |
| Company | Yamamoto EXCY (株式会社ヤマモト EXCY) |
| Contact | Nobuyuki Fukuda — `n.fukuda@excy.co.jp`, coordinates the sewing factories |
| Also on thread | `h.heima@excy.co.jp`, `yu.yamamoto@excy.co.jp` |
| First contact | 2026-08-20 |

## How their MTM system actually works

Established in correspondence 2026-08-25, and it is the crux of the whole relationship:

- **We supply the pattern data.** The factory registers our master patterns and builds
  a system performing size selection plus figure and posture correction from them.
- **The factory cannot originate or modify design patterns.** Any design option
  requiring different pattern construction needs its own pattern supplied and registered.
  Fukuda-san's own example: 1×1, 2×1 and 3×1 jacket fronts are three patterns, not one.
- **Sizing runs from roughly 5–6 body types × ~15 base sizes** — approximately 75–90 base
  combinations. The factory picks the closest base, then applies permitted adjustments.
  This is genuine MTM, not per-customer pattern drafting, and it is appropriate at our volume.
- **Shirts are a different factory**, with more flexibility on individual measurements once
  a master pattern is registered.
- **No coat production.** Out of scope, confirmed.

## Costs (preliminary, quoted 2026-08-25)

| Item | Indication |
| --- | --- |
| Suit MTM system setup | ~JPY 200,000 |
| Shirt MTM system setup | ~JPY 400,000 |
| Additional pattern registration | **Unknown — asked 2026-08-25** |

One-time setup against a long-term relationship. The per-additional-pattern figure matters
more than the headline, because it governs how Phase 2 is staged — hence the question.

Open question raised with Fukuda-san: **why is the shirt system roughly twice the suit
system**, when the shirt is the simpler garment? Proposed sequencing suits first, adding
shirts once the suit system runs, to spread cost and learn the process on the cheaper half.

## The catalog problem, and the answer to it

Fukuda-san reviewed the Craft Options Catalog and warned it "may be difficult to reproduce
the entire range exactly within our current production system." That caution is reasonable
against a ~2,800-option document — but the number is misleading, because the catalog is a
**customer-facing configurator** organised around what a customer may select, built on a
previous supplier's option tree. It is not a list of patterns.

Reclassified by pattern impact — the axis a pattern-supplied factory actually cares about.
Regenerate with `node sourcing/classify-options.mjs`:

| Product | Selectable groups | Master body block | Component piece | Finishing / spec |
| --- | --- | --- | --- | --- |
| Suit | 47 | 5 | 16 | 26 |
| Shirt | 51 | 2 | 14 | 35 |
| Trousers | 39 | 3 | 13 | 23 |
| Vest | 33 | 5 | 5 | 23 |
| **Total** | **170** | **15** | **48** | **107 (63%)** |

The five suit options that genuinely change the master body block are **lapel style, front
style, button configuration, back vent, and lining coverage**. Everything in the finishing
column — canvas type, shoulder padding, buttonhole style and position, pick stitching,
button sewing, lining colour — is an order specification requiring no pattern at all.

**The classification is a judgement call by garment construction and must be reviewed by a
patternmaker before any list goes to a factory.** The suit figures were verified against
real group IDs; an earlier pass mis-bucketed the other three products by guessing at their
naming conventions and produced a wrong headline. The current numbers use actual IDs.

## Proposed approach

Send a defined **Phase 1 pattern set** — a short list of master patterns covering the
configurations that account for most orders, with pattern data for each. Everything else in
the catalog carried as construction specification on the order sheet, not as a registered
pattern. Expand to Phase 2 once the system is running and has proven itself.

Rationale: start narrow and correct, expand from a working foundation, rather than asking a
factory to build for a range that has not yet sold.

## Status

- **Reply SENT 2026-08-25** confirming understanding of the system, reframing the catalog
  with the numbers above, proposing Phase 1, and asking the two cost questions.
- **Now owed: the Phase 1 pattern list and actual pattern data**, offered in that reply.
  Likely scope is the five suit master patterns — front style, button configuration, lapel
  style, back vent, lining coverage. This is real patternmaking work, not a document that
  can be assembled from the configurator, and the classification behind it needs a
  patternmaker's confirmation before the list is sent.
- Awaiting: per-additional-pattern registration cost, the explanation for the shirt system
  costing roughly twice the suit system, and a view on suits-first sequencing.
- **CMT inquiry drafted 2026-08-25, not sent.** Asks indicative sewing costs (we supply
  cloth) for shirt, trousers, vest, sport coat, two-piece and three-piece suit, plus
  per-component prices so any combination can be built. The setup cost cannot be judged
  without it: JPY 200,000 is trivial against a workable per-garment cost and impossible
  against a bad one, so the two numbers only mean anything together.
- The four qualifiers that decide whether a CMT quote is comparable at all, all asked:
  **what the price includes** (do the factories supply lining, canvas, interlining,
  shoulder pads, buttons and thread, or do we — easily 20–30% of the number);
  **construction level quoted separately** (full canvas vs half vs fused moves price more
  than everything else combined, so an average would be useless);
  **whether option complexity surcharges** (Fukuda-san noted elsewhere that cost varies
  with sewing operations — a base-plus-surcharge structure is what a configurator needs);
  and **volume tiering** against the real ~150 garments/year.
- Also asked: lead time per garment type, currency, payment terms, incoterm, and whether
  the shirt factory prices separately from the suit factory.

### Outstanding from their side

The price list for the existing suit pattern-order system was promised as an attachment
but did not arrive — that message is 24 KB against 30–65 KB for his others. Resend
requested, along with the sharper question of whether the existing pattern-order pricing
is even a fair guide to a supplied-pattern program, or whether the two price differently.

### A drafting note worth keeping

The draft of this reply contained `Blessed &amp; Dressed` — HTML entities written into a
plain-text mail field, which would have reached Fukuda-san as the literal characters
`&amp;` in the company name, in both the subject and the signature. Caught before sending.
Mail bodies composed here are plain text: write `&`, not `&amp;`, and never markdown
`**bold**`, which renders as visible asterisks.

## Incidental finding

`src/data/options/shirt.ts` declares the group id `placket` **twice**. Harmless in the
configurator if the loader tolerates it, but it will corrupt any option export keyed by id —
including a pattern list sent to a factory. Worth fixing before anything is exported.
