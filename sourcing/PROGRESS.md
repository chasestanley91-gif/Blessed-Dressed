# Sourcing — Progress

_Hand-maintained. The craft-photography dashboards (`PROJECT_DASHBOARD.md`, `STATE.md`)
are tool-generated and cover a different workstream; this file tracks cloth sourcing._

**Last updated: 2026-08-24**

## Headline

<!-- BEGIN GENERATED: node sourcing/build-ledger.mjs -->

**57 fabric suppliers identified across 9 countries. 0 contacted.**

Research is no longer the bottleneck. Outreach is. The ledger has more qualified
suppliers than a company at this stage can work at once, and every single row still
reads `not_contacted`. The next unit of progress is an email, not another search.

## Where the workstream stands

| Stage | Count | Notes |
| --- | --- | --- |
| Identified | 57 | Across 9 countries, tiered A–D |
| Direct email or phone on file | 33 | 24 have only a website or postal address |
| Re-verified against live site | 0 | **Blocks Wave 2 sending** — see below |
| Contacted | 0 | — |
| Replied | 0 | — |
| Trade account open | 0 | — |
| Swatches in hand | 0 | — |
| Cloth purchased | 0 | — |

**By tier:** A 18 · B 24 · C 12 · D 3 — A = open now, B = worth a letter, C = reference, D = deprioritised

**By evidence:** VERIFIED 36 · LIKELY 19 · UNVERIFIED 2

**Mills with their own garment arm:** 12 — buy cloth from these, share nothing else

<!-- END GENERATED -->

## Done this pass (2026-08-24)

- **Recovered and committed Wave 1.** The 39 fabric vendors from the 2026-08-18
  sourcing report existed only inside a Claude artifact and were not in the repo. They
  are now in version control and will survive.
- **Ran Wave 2** against the wholesale brief — tropical and Super 110s–180s suiting
  under $30/yd, 100% cotton shirting, cotton/elastane stretch shirting, bought free and
  clear. **18 new suppliers** across India, China, Turkey and the US.
- **Mapped all 57** by geography, by price band, by segment and by what each one
  actually does for the business.
- **Established the price physics** — the first evidence-backed answer to "what does
  this actually cost", including the finding that the $15/yd target and the Super 150s+
  ask cannot be satisfied by the same channel.
- **Caught a spec error in the brief** — 92% cotton / 8% spandex is a knit ratio;
  woven stretch shirting is 96/4 or 97/3. This would have cost a round trip on every
  shirting conversation.
- **Built the outreach machine** — five waves, six templates, eight standard questions,
  five scoring gates, a 30-day cadence, and a tracker CSV generated from the dataset.

## Blocking the next step

1. **Wave 2 contacts are unverified against live sites.** The session's network policy
   blocked direct fetches to most mill domains, so those emails and phone numbers came
   from search-index page content. ~30 minutes of clicking will clear this, and it must
   happen before Wave B sends or a batch of bounces will read as rejection.
2. **The business identity pack does not exist yet** — domain email, EIN, resale
   certificate, live website. Merchants gate on this, and Wave A cannot really land
   without it. This is Step 0 of the outreach plan and it is the true critical path.

## The biggest open question

**Nobody publishes a price for all-wool worsted from an Asian mill.** OCM, Digjam,
Nanshan, Yünsa and Raymond are all quote-only. Wool-*blend* pricing is well
established ($8.70–12.40/yd, verified), and European all-wool is well established
(~$64/yd and up). The entire middle of the market — all-wool Super 100s–140s at Indian
or Chinese cost — is dark. That gap is worth more to this business than any other
number in the ledger, and Wave B exists to close it.

## Next

- [ ] Assemble the business identity pack (Step 0)
- [ ] Re-verify the 18 Wave 2 contacts against their live sites
- [ ] Send Wave A — 8 free/instant accounts
- [ ] Send Wave B — 8 price-discovery RFQs, same day, for comparable quotes
- [ ] Log every send in `outreach-tracker.csv`
- [ ] Day 4: first bump on non-responders

## Deferred, deliberately

- **Knit dress-shirt fabric.** If the 8% elastane figure was the real intent, that is
  the performance/knit shirt category and a different mill set entirely. Not researched.
- **US/Canada tailor sourcing.** Out of scope in the 2026-08-18 brief; never run.
- **Trims, linings, canvas, interlining, buttons, thread.** Not started. Every garment
  needs them and nothing in this ledger covers them.
- **CTDA Designer Forum New York dates.** One trade show would collapse most of Wave E
  into a single afternoon. Worth checking against the calendar.

## Log

| Date | Event |
| --- | --- |
| 2026-08-18 | Sourcing report: 39 fabric vendors profiled (Phase 2). Artifact only. |
| 2026-08-20 | Japan supplier vetting pass (production partners, not cloth). |
| 2026-08-24 | Wave 1 recovered into the repo; Wave 2 adds 18; ledger, map, outreach plan and tracker built. |
