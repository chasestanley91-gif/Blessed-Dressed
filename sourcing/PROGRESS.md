# Sourcing — Progress

_Hand-maintained. The craft-photography dashboards (`PROJECT_DASHBOARD.md`, `STATE.md`)
are tool-generated and cover a different workstream; this file tracks cloth sourcing._

**Last updated: 2026-08-25**

## Headline

<!-- BEGIN GENERATED: node sourcing/build-ledger.mjs -->

**57 fabric suppliers identified across 9 countries. 1 contacted.**

Research is no longer the bottleneck. Outreach is. The ledger has more qualified
suppliers than a company at this stage can work at once, and every single row still
reads `not_contacted`. The next unit of progress is an email, not another search.

## Where the workstream stands

| Stage | Count | Notes |
| --- | --- | --- |
| Identified | 57 | Across 9 countries, tiered A–D |
| Direct email or phone on file | 33 | 24 have only a website or postal address |
| Re-verified against live site | 0 | **Blocks Wave 2 sending** — see below |
| Contacted | 1 | — |
| Replied | 0 | — |
| Trade account open | 0 | — |
| Swatches in hand | 0 | — |
| Cloth purchased | 0 | — |

**By tier:** A 18 · B 25 · C 11 · D 3 — A = open now, B = worth a letter, C = reference, D = deprioritised

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

## Outreach status (2026-08-25)

**20 personalised email drafts are written and sitting in Gmail, unsent.** They cover 23
of the 57 suppliers — Ariston, Zegna and the Harrisons stable are folded into one email
to their shared US agent, Kemp & Hewitt. Each draft is written to that specific supplier,
citing what we actually know about them (Standeven's no-minimum trade account, Fresco at
Hardy Minnis, Nanshan's Super 120s tropical, Jiexiang's 96/4 poplin) rather than a
template blast. None state our target price. None ask for anything but cloth.

The rest of the ledger has no usable email: **11 are phone-only** and **24 take web forms
or trade-account signups**. Those cannot be automated from here — the session's network
policy blocks the domains — so they are itemised as tasks with the exact fields to paste.

The checkable call sheet lives at the artifact published 2026-08-25 and saves ticks
between visits; `sourcing/call-sheet.html` is its source.

**SMS is not a usable channel for the phone-only group.** Inkbox reports
`sms_available: false` (no phone number is assigned to the identity, so there is no
sending number) and its consent preflight returns `recipient_not_opted_in` with
`consent_required: true` — it gates first-contact SMS on recipient opt-in. Separately,
nine of the eleven numbers cannot receive a text at all: four are office landlines
(Metro, Holland & Sherry, Scabal, Marzotto), two are toll-free (Jodek, Dormeuil), one is
an Austrian PBX root (Getzner), and two are Chinese landline area codes (Lianfa +86 513,
Jinfeng +86 571). Only Hebei Xingye (+86 155) and Global Fabric Wholesale (+86 134) are
mobile, both are tier C/D, and both want WhatsApp rather than SMS. Each call row now
states its real channel.

Rows stay `not_contacted` in the dataset until a draft is actually **sent**. A written
draft is not a contact.

## First reply in (2026-08-25)

**Fox Brothers answered — Patrick Osborne-Fox, within about 13 hours of send.** The
eight-question format worked: he answered point by point, in order.

What it changed. Fox went into this ledger as tier C with almost every field marked
"not published". The reply upgrades it to B and replaces most of those fields with fact:

- **No MOQ at all on the stock service collection** — single suit lengths are fine.
- **Free soft cover bunches.** Hardbacks GBP 30, credited back against an order placed
  within 3 months. Hardbacks exist for Classic Flannel, Vintage Fox, Fox Air, Golden Fox.
- **Same-day dispatch** once payment clears. **Duty is buyer-side**, confirmed in writing.
- **Everything except the Fox Drop collection is continuity** — reorderable.
- Accounts open on **ProForma**, reviewed for credit terms after 6 months of trading.
- **Trade pricing is withheld until the account is open** — the one thing still unknown.

The strategic read is unchanged by the good terms: public references put Fox well above
the $30/yd ceiling, so this is a **premium story cloth bought one length at a time
against a paid commission**, not programme cloth. The account is worth holding precisely
because it costs nothing to hold — no minimum, free bunches, same-day dispatch.

**Fox Air is directly on brief.** Patrick names it as their high-twist collection, which
is the tropical warm-weather cloth the original brief asked for. Golden Fox is the newer
lighter-weight option.

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
- [ ] Review and send the 20 Gmail drafts (Wave A and Wave B are both covered)
- [ ] Work the 11 phone calls and 24 web forms from the call sheet
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
| 2026-08-25 | 20 personalised email drafts written into Gmail (unsent). Call sheet published with 55 checkable tasks covering all 57 suppliers. |
| 2026-08-25 | Fox Brothers replied — first response of the campaign. Terms captured; tier C→B. Reply drafted. |
| 2026-08-25 | SMS outreach ruled out: no Inkbox sending number, platform requires opt-in, and 9 of 11 numbers are landline or toll-free. Call rows annotated with real channel. |
