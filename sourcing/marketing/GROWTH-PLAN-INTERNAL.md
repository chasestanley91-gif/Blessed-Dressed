# Growth Plan — Internal Playbook

Owner: Chase Stanley. Written 2026-09-02. Scope: get Blessed & Dressed from a standing start to
**150 shirts + 75 suits sold by 2026-12-31**, then sustain that pace across all of 2027 for
**≈450 shirts + 225 suits**. Target spend: as close to **$0 in media** as the tactics allow.
Geography: Louisiana/regional guerrilla presence and a national online/SEO push, run in parallel.

This is the detailed operator's version. The short, narrative version for partners and
collaborators is `GROWTH-STORY-PARTNERS.md` in this same folder — send that one out, not this one.

---

## 1. Goals & the math

**Balance of 2026** — today to Dec 31 is ~17 weeks.

| | Total | Per week |
|---|---|---|
| Shirts | 150 | ~8.8 → **9/week** |
| Suits | 75 | ~4.4 → **4-5/week** |

**2027** — full 52 weeks, "triple" = 450 shirts / 225 suits.

| | Total | Per week |
|---|---|---|
| Shirts | 450 | ~8.7/week |
| Suits | 225 | ~4.3/week |

**The real insight:** the 2027 weekly pace is almost identical to the Q4 2026 sprint pace.
"Triple the business next year" doesn't mean escalating further from here — it means **holding
the Q4 sprint rate steady for 12 straight months instead of 4**. That reframes the whole plan:
the tactics below need to become routine and repeatable by January, not just achievable once
during a holiday push. Anything that only works as a one-time stunt doesn't belong in the 2027
column.

**Capacity flag.** `sourcing/tailorcloth/README.md` has Tailorcloth quoted at **100 shirts/75
suits** for the balance of 2026 and **300 shirts/250 suits** for 2027 — the suit numbers line up
with this plan, but the shirt targets here (150 / 450) run ahead of what's currently on record
with that supplier. Either Tailorcloth's shirt capacity needs to be pushed past what's already
quoted, or a second production line (the Japan/EXCY track in `JAPAN-PRODUCTION.md`, still
mid-negotiation) needs to absorb the gap. Resolve this before promising 150 shirts to anyone
outside the business — it's a production conversation, not a marketing one.

---

## 2. The real price list

The prices in `data-store/products.json` and `src/lib/pricing-constants.ts` are placeholders —
per your instruction, this plan does not use them. Below is what the sourcing research actually
supports, rebuilt from `DUTY-AND-BUDGET-2026.md` and `FABRIC-SUPPLIERS.md`.

**How the business prices a garment** (per `FABRIC-SUPPLIERS.md` §2): cloth is cost-plus,
billed to the customer as its own transparent line — it does not come out of the making price.
So every price is two numbers added together: **making price** (labor/construction, paid to the
production partner) **+ fabric price** (whatever cloth the customer picks).

### 2a. Fabric line — real, verified, tiered

At the documented cut yardages: **3.5 yd per suit, 2 yd per shirt.**

| Tier | Suiting $/yd (source) | Suit fabric cost | Shirting $/yd (source) | Shirt fabric cost |
|---|---|---|---|---|
| **House Cloth** | $15-20/yd — B. Black & Sons $18.71/yd (verified), Fabric Mart $8.75-10.50/yd (verified), Metro Textiles ~$14.75/yd w/code (verified) | **$53-70** | $8-15/yd — Metro Textiles w/COTTON60 code $7.80-10.60/yd, FabricSight blends | **$16-30** |
| **Signature Cloth** | ~$40-70/yd — Dugdale, Holland & Sherry, Vitale Barberis Canonico merchant band, Super 110s-150s | **$140-245** | ~$15-22/yd landed — FabricSight poplin €12.95-17.50/m incl. Pima stretch, ~15% EU duty | **$30-44** |
| **Bespoke Bunch** | $60-150+/yd — Dormeuil, Zegna, Loro Piana, Cerruti, Holland & Sherry top end, all verified | **$210-525+** | Premium — Albini Group / Thomas Mason (David & John Anderson quoted >$100/yd) | **$200+** |

CIMEXLANA and Novalan (Mexico, USMCA duty-free, Super 80s-150s at a *likely* $9-15/yd) could
undercut the Signature tier once their pricing is confirmed by outreach — worth revisiting this
table once those replies land.

### 2b. Making price — the honest gap

Only one number here is real: `FABRIC-SUPPLIERS.md` records **$600-700 as the target making
price for a House-cloth 2-piece suit**. That's a pricing-strategy target on file, not a vendor
quote. Tailorcloth's actual wholesale CMT price sheet is still an **open ask** —
`sourcing/tailorcloth/README.md` has had it as the #1 unanswered item since 2026-09-01. The
parallel Japan/EXCY track (`JAPAN-PRODUCTION.md`) is in the same position: a combined
pattern-scope-and-CMT inquiry is drafted but not sent.

Do not quote firm making prices for shirts, 3-piece suits, trousers, vests, or sport coats
until one of those two quotes comes back — there's no sourced number to build them from. As a
rule of thumb once the quote lands: shirt CMT typically runs a small fraction of a jacket's
(different construction entirely), trousers and vests fall between the shirt and the jacket, and
a 3-piece suit is the 2-piece price plus the vest. Rebuild this table with real numbers the day
Tailorcloth's price sheet arrives — that single email unblocks the entire pricing plan.

### 2c. What this means for the launch price

**2-piece suit, House cloth, all-in: ~$653-770.** That's the one number in this whole plan you
can quote a customer today with a straight face. Everything else — shirts, Signature/Bespoke
suits — needs the making-price gap closed first, or needs to be sold as "starting from the
fabric cost, making price to be confirmed" until then.

**Illustrative-only revenue scenario** (do not treat as a forecast): if 75 suits sell at a
65% House / 25% Signature / 10% Bespoke cloth mix, blended suit price lands near **$775**,
which is **~$58,000** in suit revenue alone. Shirt revenue is not modelable yet — 150 units is
a real target, but the dollar figure depends entirely on the making-price quote still pending.

---

## 3. Current-state audit

**Live and working:**
- 8-step MTM builder (`/builder`) with a real measurement schema (`MeasuringGuide.tsx`) covering
  body and finished measurements for jackets, shirts, and trousers.
- Product, collection (`/collections`), and fabric-book (`/fabric-book`) pages.
- `sitemap.ts` (dynamic, pulls live products/collections) and `robots.ts` — real SEO plumbing.
- Two named seasonal collections already built: **Summer Tropical Wools** and **Winter Atelier**.
- Brand voice is already written and distinctive: "Christian Bespoke Suiting — crafted with
  precision, worn with purpose," Faith · Integrity · Excellence, scripture references — this is
  a genuine differentiator, not a gap. Don't reinvent it; use it.

**Broken or missing — fix before spending any marketing effort:**
- `/about` is linked from the footer and **404s**. Fix this in week one; it's the first thing a
  guerrilla-tactic visitor or a journalist checks.
- **No blog.** All the SEO content strategy below depends on one existing.
- Homepage-only metadata — per-product and per-collection pages don't have distinct
  title/description tags. `layout.tsx`'s generic description ("Luxury bespoke tailoring...") is
  fine as a fallback, not as every page's tag.
- **Zero social presence, zero email list** — this is genuinely greenfield. Nothing below
  contradicts an existing channel because there isn't one yet.
- **Domain ambiguity**: `sourcing/call-sheet.html` lists the business web presence as
  `customsuits.net`, but `.env.example` points `NEXT_PUBLIC_SITE_URL` at
  `blessed-dressed.vercel.app`. Pick the canonical production domain and fix this **before**
  submitting the sitemap to Search Console — Google will otherwise index two properties and
  split whatever authority gets built.

---

## 4. Positioning & messaging pillars

1. **Faith-forward, not faith-adjacent.** The scripture references and "Faith · Integrity ·
   Excellence" values are already written into the site. Lean into this as the primary wedge —
   it's a real gap in the menswear category and it comes with a built-in distribution channel
   (see §7, church partnerships).
2. **Craftsmanship with provenance.** The fabric sourcing research is a genuine asset: real mill
   names (Dormeuil, Vitale Barberis Canonico, Holland & Sherry, Dugdale) that a customer can be
   told the actual story of, not marketing copy.
3. **Louisiana-rooted.** Alexandria, LA as a base is a differentiator nationally (nobody else in
   this category is telling a Louisiana story) and an asset locally (home-team pride, guerrilla
   tactics land better for a known local business).
4. **Accessible bespoke.** The House Cloth 2-piece suit (~$653-770 all-in, §2c) is the entry
   point — priced to be reachable, not aspirational-only.

---

## 5. Target personas

- **Church leadership / men's ministry** — pastors, deacons, ministry leaders who dress for the
  pulpit and set the tone for their congregation. Direct fit for the faith-forward positioning;
  highest-leverage guerrilla channel (see §7).
- **Regional professionals** — attorneys, realtors, financial advisors, business owners in
  Alexandria, Baton Rouge, Shreveport, Lafayette, New Orleans, and reachable Texas metros
  (Dallas). Need interview/court/client-facing suits and shirts on a recurring basis.
- **Wedding parties** — grooms and groomsmen; a single wedding is a multi-suit sale and a
  photography-driven content opportunity.
- **National faith-community audience** — reached online, not locally; the SEO and social
  content strategy (§6, §8) is what earns this segment, since there's no guerrilla presence to
  rely on outside Louisiana.

---

## 6. Zero/low-cost SEO plan

### Technical fixes (do these first — they're free and they unblock everything else)
- Build a real `/about` page — founder story, faith positioning, Louisiana roots, craft story.
- Add per-page `metadata` exports for every product, collection, and fabric-book page (title +
  description unique to that item, not the homepage fallback).
- Add `LocalBusiness` JSON-LD schema (Alexandria, LA address, phone, hours) and `FAQPage` schema
  on a new FAQ section.
- Resolve the domain ambiguity (§3), then submit the sitemap to Google Search Console and Bing
  Webmaster Tools — both free.

### Free local listings
- Google Business Profile — category "Tailor" or "Men's Clothing Store," photos, weekly posts,
  ask early customers for reviews.
- Yelp, Apple Maps, Bing Places — free local citations, 30 minutes each.

### Content/blog strategy
No blog exists yet — build one and target long-tail keywords the fabric research already gives
you the material for:
- "made to measure suits Louisiana" / "custom suits Alexandria LA"
- "Super 120 vs Super 150 wool explained" (real content sitting in `FABRIC-SUPPLIERS.md`)
- "how to measure yourself for a bespoke shirt" (real content sitting in `MeasuringGuide.tsx`)
- "Christian menswear brand" / "dress for church leadership"
- "half canvas vs full canvas suit"

Cadence: 1-2 posts/week. This is the single highest-leverage $0 channel available — the raw
material already exists in `/sourcing/`, it just needs to be rewritten for a customer audience
instead of an internal ledger.

### Free backlinks/PR
- Local press: "faith-based small business" and "Louisiana menswear maker" are both real local
  news angles — pitch The Town Talk (Alexandria) and regional outlets.
- Church bulletin partnerships (ties directly into §7).
- Event sponsorship citations — sponsoring a local event usually earns a backlink from the
  event's own page.

---

## 7. Guerrilla marketing tactics

All designed to cost time, not money.

- **Church partnership/referral program.** Offer pastors and ministry leaders a standing
  discount in exchange for being seen in the product and for word-of-mouth referral. Sponsor a
  men's ministry event with a free "dress with purpose" styling talk. This is the single
  highest-leverage tactic given the brand's positioning — treat it as the priority, not one
  tactic among many.
- **Trunk shows / pop-ups.** Partner with barbershops, salons, law firms (holiday parties are a
  natural fit), and country clubs — a folding rack and a measuring tape, nothing more.
- **Referral partnerships with photographers and wedding venues.** A photographer or venue
  refers a groom; give them a flat referral commission or a free garment. Self-funding — no cost
  until a sale converts.
- **Pop-up "measure me" booth.** A farmers market or local festival table offering free
  measurements and a style consult, with a QR code straight into the `/builder` flow. Drives
  immediate, trackable signups.
- **Customer referral credit.** Existing customers get a credit for a paying referral —
  self-funding by design.
- **University push.** Louisiana has several universities in reach — target graduating seniors
  for interview suits and fraternities for formal events.
- **Before/after transformation content.** Photograph real customers (with permission) —
  cheap to produce, and it's the single best-performing organic content format for MTM/bespoke
  brands generally.

---

## 8. Organic social engine

- **Content pillars:** behind-the-scenes construction (the craft story is real — use it),
  scripture-and-style pairings, customer transformation posts, founder story, fabric mill
  stories pulled straight from `FABRIC-SUPPLIERS.md`.
- **Cadence:** 3-5 feed posts/week, daily stories once there's enough raw material.
- **UGC hashtag** — pick one (e.g. `#DressedInPurpose`) and repost every tagged customer photo.
- Platforms: Instagram first (visual, faith-community-heavy), Facebook second (older
  professional/church demographic, event promotion), TikTok opportunistic (construction/process
  video does well there if the format fits).

---

## 9. Email/SMS

- Build the list two ways: a site popup (needs to exist — currently nothing captures an email)
  and an in-person QR code at every guerrilla event (§7).
- Welcome sequence: brand story, House Cloth suit price point, a clear call to book a
  measurement.
- Seasonal drops tied to both calendars that matter here — Easter/Christmas (faith) and
  wedding/graduation/interview season (commercial).
- Abandoned-builder flow: anyone who starts the 8-step configurator and doesn't finish gets a
  follow-up.

---

## 10. Optional paid layer

Not part of the $0 baseline plan — only turn this on once organic and guerrilla tactics have
proven which message converts. When there's budget: $5-10/day boosted posts geo-targeted to
Louisiana + faith-community interest audiences, plus retargeting ads to site visitors who didn't
complete the builder.

---

## 11. Partnership/channel sales

Layer on top of the existing wholesale motion (Tailorcloth), not a replacement for it:
- Consignment or pop-up racks with local menswear boutiques.
- Formalwear rental shops as a referral-out channel (rental customer who wants to buy instead).
- Church bookstores as a genuinely on-brand retail partner.

---

## 12. Month-by-month action calendar

**September 2026**
- Fix `/about`, resolve the domain ambiguity, submit sitemap (§3, §6).
- Set up Google Business Profile + free local listings.
- Publish first 2-3 blog posts.
- Launch Instagram; start the church-partnership outreach (§7) — this has the longest lead time
  of any tactic, start it first.
- Send the combined pattern-scope-and-CMT inquiry to EXCY (already drafted, per
  `JAPAN-PRODUCTION.md`) and re-push Tailorcloth for the wholesale price sheet — both block §2b.

**October 2026**
- First trunk show / pop-up booked off a church or barbershop relationship from September.
- Referral credit program live.
- Weekly blog cadence running.
- First before/after customer content, if any early sales have closed.

**November 2026**
- Wedding-season and holiday-party trunk shows (law firms, country clubs).
- Email welcome sequence + seasonal drop live.
- Push run-rate: this is the month the 9 shirts/week, 4-5 suits/week pace needs to actually be
  hit, not just planned.

**December 2026**
- Christmas/faith-calendar seasonal push.
- University graduating-senior outreach for spring semester.
- Close out the year against the 150/75 target; audit what actually worked before planning 2027
  channel mix.

**2027 — quarterly notes**
- What breaks at 3x: single-founder guerrilla bandwidth is the first constraint — the church
  partnership and referral programs need to be running on their own momentum by Q1, not still
  founder-driven.
- Add the paid layer (§10) once Q4 2026 data shows which message/audience converts.
- Consider a part-time content hire once revenue supports it — sustaining 3-5 posts/week plus a
  weekly blog post for 12 months is the actual bottleneck, not the ad budget.
- Revisit the Tailorcloth shirt-capacity gap from §1 well before Q3 2027 — 450 shirts/year needs
  a confirmed production line, not a hopeful one.

---

## 13. KPIs

| Metric | Why it matters |
|---|---|
| Site traffic (by source) | Confirms SEO/content is actually working, not just published |
| Builder start → complete rate | The real conversion metric — a visit means nothing if the configurator isn't finished |
| Average order value | Tracks cloth-tier mix (House/Signature/Bespoke) against the revenue scenario in §2c |
| Units/week vs. target pace | 9 shirts + 4-5 suits/week — check weekly, not monthly, so a slow month is caught early |
| Email list size | Leading indicator for future seasonal drops |
| Referral share of sales | Tests whether the referral credit (§7) and church program (§7) are actually converting, not just generating goodwill |

---

## 14. Weekly owner checklist

- [ ] Check unit pace against the week's target (§1) — 9 shirts, 4-5 suits.
- [ ] One guerrilla touchpoint scheduled or followed up (church contact, trunk show, referral
      partner check-in).
- [ ] One blog post published or drafted.
- [ ] 3-5 social posts published; UGC reposted.
- [ ] Any pending replies from Tailorcloth/EXCY on the CMT quote (§2b) chased — this is the
      single item blocking a locked price list.
