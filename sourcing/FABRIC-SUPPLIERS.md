# Fabric Suppliers — Master Ledger

**Blessed & Dressed · cloth sourcing · last pass 2026-08-24**

Every fabric supplier found across all research to date, in one accounted, mapped and
scored list. Source of truth is [`fabric-suppliers.json`](./fabric-suppliers.json);
the tables below and [`outreach-tracker.csv`](./outreach-tracker.csv) are generated
from it by `node sourcing/build-ledger.mjs`. Edit the JSON, never the tables.

- **57 suppliers · 9 countries.**
- **Wave 1 (39)** — carried forward from the Japan/Italy sourcing report of 2026-08-18,
  which had gone no further than an artifact. It is now in the repo.
- **Wave 2 (18)** — new, from the 2026-08-24 pass against the wholesale brief:
  tropical and Super 110s–180s suiting under $30/yd, 100% cotton shirting,
  and cotton/elastane stretch shirting, bought free and clear.
- **Nobody has been contacted.** Every row is `not_contacted`. All email drafts in
  [`OUTREACH-PLAN.md`](./OUTREACH-PLAN.md) are drafts.

## Evidence standard

`VERIFIED` = text seen in fetched page content. `LIKELY` = search-result description or
secondary source. `UNVERIFIED` = directory listing only — a lead, not a fact.

One caveat specific to this pass: the session's network policy blocked direct page
fetches to most mill domains, so Wave 2 contact details came through search-index page
content rather than a browser hitting the mill's own contact page. **Re-verify every
Wave 2 email and phone number against the supplier's live site before you send.** That
is a five-minute job and it is the first item in the outreach plan.

---

## Three findings that change the brief

### 1. "92% cotton / 8% spandex" is a knit ratio, not a woven shirting ratio

This matters more than anything else in the shirting half of the brief. Woven dress
shirting with elastane runs **98/2, 97/3, 96/4, or at the stretchiest 95/5**. The
sources are consistent: typical cotton-elastane woven ratios are 95/5, 97/3 and 98/2,
and stretch cotton wovens sit at 2–5% elastane. The 92/8 figure belongs to **knit**
cotton-spandex jersey — the ratio you find on t-shirts, leggings and knit polos.

Two consequences:

- If you write "92% cotton 8% spandex shirting" in an RFQ, mills will either quote you
  a **knit jersey** (wrong fabric for a dress shirt with a fused collar and placket) or
  come back confused. It will cost you a round trip on every conversation.
- Ask instead for: **96/4 or 97/3 cotton/elastane woven poplin or twill, 110–140 gsm,
  40s–100s/2 yarn, weft stretch.** Verified live examples already exist —
  Jiexiang publishes a 96/4 cotton-spandex shirting poplin at 40×40+40D, 133×72,
  130 gsm; MH Textile publishes a 97/3 cotton-spandex stretch twill.

If you genuinely want the 8% figure, you are asking for a **knit dress shirt** — the
"performance shirt" category. That is a different mill set and worth a separate brief.
Say the word and I'll run it.

### 2. Super 110s–180s and $15/yd cannot both be true in the same cloth

The Super number is fibre fineness, and fineness is the cost. Held against evidence:

| What you want | Realistic price | Route |
| --- | --- | --- |
| Wool-blend / wool-poly suiting, 250–320 gsm | **$8.70–12.40/yd** — beats the $15 target | China mill-direct (Surui publishes $9.50–13.50/m at 3 m MOQ; a 70% worsted wool 275 gsm at $10.80–11.80/m; another worsted wool-poly stretch at $11.32–11.51/m) |
| All-wool worsted Super 100s–140s | **Unpublished — the single biggest gap** | India mill-direct (OCM covers Super 100s–140s; Digjam), China (Nanshan lists Super 120s tropical), Turkey (Yünsa). Quote-only. This is what outreach exists to price. |
| All-wool Super 110s–130s from Biella | ~$64/yd (VBC ~$70/m) | European merchants — 4× your ceiling |
| **Super 150s–180s, new cloth** | **$60–150+/yd** | Holland & Sherry, Cerruti, Dormeuil, Zegna. **No new-cloth route under $30/yd exists.** |
| Super 150s–180s, *closeout* | **$15–35/yd** | The only under-$30 door: Metro Textiles ($29.50–75.50/yd with the frequent 50% codes), Fabric Mart ($2–8 on sale), B. Black remnant lots, John Foster Mill Archive one-offs, Cerruti remnants |

### 2a. What the price model actually allows

**Corrected 2026-08-25.** An earlier version of this section computed cloth as a share of
retail and concluded Fresco could only ever be a premium tier. That rested on two wrong
assumptions, both since corrected by the owner.

**The business model is cost-plus on cloth.** Cloth is passed through to the customer close
to transparently — it sits on the customer's invoice as its own line rather than being
absorbed into the garment price. So cloth cost does **not** come out of the making price,
and "cloth as a percentage of retail" is the wrong frame entirely.

**The real price band** is $600–700 for the bulk of the work, roughly $500 at the floor for
a client worth winning, and up to $1,500 at the top — not the ~$900 catalogue median used
before. The business is **operating**, producing through other manufacturers, not pre-launch.

What this changes:

- **Premium cloth is viable.** Fresco, VBC and the Italian merchants are not locked out by
  the price band, because the customer selects the cloth and carries its cost. The constraint
  is what a customer will choose, not what the margin will bear.
- **The $15–30/yd target still matters, for a different reason.** It is not margin protection.
  It is what makes an attractive **house and entry cloth offer** at the $600–700 core price —
  the cloth a customer takes when they are not reaching for a named English or Italian bunch.
  That is still the largest gap in the ledger and still worth closing.
- **Tropical and lightweight wool is the existing business,** not a category to enter. The
  brief's central ask is where most of the owner's work already sits.

So the two tiers are real but their roles have swapped: the cheap tier is the volume offer,
the premium tier is genuinely sellable, and cloth price competes on the customer's invoice.

**The practical read.** Your $15/yd number is achievable today, in volume, for
wool-blend and entry all-wool suiting from Asia. Your Super 150s–180s number is
achievable only opportunistically, through jobbers and mill archives, in lots you
cannot reorder. Those are two different buying behaviours and they want two different
budgets — a **standing programme** for the bread-and-butter cloth, and a
**hunting budget** for the top of the range. Trying to make one channel do both is
what will waste your money.

Note the unit trap when you read quotes: **$15/yd = $16.40/m.** Metre prices flatter
themselves by about 9% against yard prices. Always convert before comparing.

### 3. "Free and clear" — the real risk is a garment arm, not a contract

Nothing in this ledger ties cloth to a CMT house. Every one of these vendors sells
piece goods outright; buy it and it is yours to sew anywhere. No vendor surveyed
publishes a deposit, an exclusivity clause, or any obligation on you. Merchant-side
"exclusive" cloths are exclusive to *the merchant*, not binding on *you*.

The actual exposure is different and worth naming: **most of the largest mills also
make finished garments**, so you would be buying from a company that competes with you
downstream. Flagged **YES** in the tables below: Raymond (runs its own retail *and*
made-to-measure tailoring — the most direct competitor here), Jiangsu Sunshine
(3.5M suits/yr), Nanshan, Lianfa (10M garments/yr), Luthai, Vardhman (1.8M shirts/yr),
OCM, Altınyıldız, Wooltex, Zegna, Loro Piana, Siyaram/Donear.

That is not a reason to avoid them — several are the best mills on the list. It is a
reason to **buy cloth and share nothing else**. No tech packs, no patterns, no
construction specs, no customer data.

The cleanest free-and-clear mills found — fabric-only, no garment arm:
**Yünsa** (Turkey), **Digjam** (India), **Yun Ai** and **Surui** and **Jianlu** (China),
**Jiexiang** (China, shirting), **Acorn** and **Canclini** and **Getzner** (shirting),
plus every UK and Italian merchant on the list.

---

## The map

**By where the cloth is made**

- **China (17)** — the price floor. Wool-poly and TR suiting at $9–17/yd equivalent,
  published minimums as low as 1 metre, free A4 swatch cards for the cost of courier.
  Best for the everyday programme. *Surui, Yun Ai, Nanshan, Sunshine, Jianlu, Lianfa,
  Luthai, Six Dragon, Jiexiang, MH, Yutai, Huzhou Shichang, K&M, Jinfeng, Xingye, GFW.*
- **India (7)** — the value all-wool worsted tier, and the least-explored opportunity
  in this ledger. OCM covers Super 100s–140s at Indian cost; Digjam is a fully
  integrated fabric-first mill. *OCM, Digjam, Raymond, Vardhman, Mafatlal, Siyaram/Donear, Bhilwara cluster.*
- **Turkey (3)** — the quality-per-dollar bridge between Biella and Asia, and Yünsa is
  the strongest fabric-only premium mill on the list. *Yünsa, Altınyıldız, Söktaş (shirting).*
- **UK (9)** — the easiest trade accounts anywhere (Standeven, Bateman Ogden, Dugdale)
  and the home of Fresco high-twist tropical (Hardy Minnis / HFW). Above your band on
  price; unbeatable on terms and on being taken seriously.
- **Italy (11)** — the quality benchmark and the top of the Super range. Mostly 3–6×
  your ceiling. Buy here for the story, not the margin.
- **USA (7)** — jobbers and closeouts. No trade gate, cut yardage, next-day dispatch,
  and the only realistic sub-$30 route to high-Super cloth. *Metro, B. Black, M.J. Cahn,
  Fabric Mart, Fashion Fabrics Club, Yardblox, Zelouf.*
- **Austria (1)**, **France (1)**, **Belgium (1)** — premium merchants.

**By what it does for you**

- **Everyday suiting programme, hits $15/yd** — Surui, Yun Ai, Yardblox, Fashion Fabrics Club, K&M, Bhilwara
- **All-wool worsted Super 110s–140s, price unknown, highest upside** — OCM, Digjam, Nanshan, Yünsa, Raymond
- **Tropical / high-twist specifically** — Hardy Minnis (Fresco), VBC, Reda, Nanshan (Super 120s tropical)
- **Top-of-range Super 150s–180s** — Holland & Sherry, Cerruti, Dormeuil, LBD group — plus the closeout hunt at Metro, Fabric Mart, B. Black, John Foster archive
- **100% cotton shirting** — Acorn, Canclini, Getzner, Söktaş, Albini/Thomas Mason, Yutai, Luthai
- **Cotton/elastane stretch shirting (96/4, 97/3)** — Jiexiang, MH Textile, Vardhman, Lianfa, Huzhou Shichang
- **Fastest accounts to open, this week** — Standeven (free, 48 h, no minimums),
  Bateman Ogden (instant activation), Acorn (free cards, no minimum), B. Black (no gate
  at all), M.J. Cahn, Zelouf, Yardblox

---

<!-- BEGIN GENERATED: node sourcing/build-ledger.mjs -->

### Tier A — open now (18)

| Supplier | Country | Type | Segment | Own garment arm | Price band | Super range | Swatch terms | Cut lengths | Contact | Evid. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Acorn Fabrics** | UK | shirting mill / merchant | shirting | no | GBP 9.99-18.99/m | — | Free trade range cards on request; no minimum; sells trade + retail | 2-3 m shirt cuts | sales@acornfabrics.co.uk<br>01282 698662 | VERIFIED |
| **Tessitura Monti / Canclini 1925** | Italy | shirting mill | shirting | no | ~$20-40/yd via resellers | — | Not published; US MTM shops hold libraries | via canclini.store | info@canclini.it<br>+39 031 3527511 | LIKELY |
| **Metro Textiles** | USA (NYC) | jobber | suiting | no | $29.50-75.50/yd wool (50% discount codes common) | mixed, incl. high Supers | Not published | yes | (212) 209-0004 | VERIFIED |
| **B. Black & Sons** | USA (LA) | woolens jobber since 1922 | suiting | no | ~$32.50/yd wool reference | mixed | Ad hoc by phone (not published) | yes | info@bblackandsons.com<br>800-433-1546 | VERIFIED |
| **M.J. Cahn** | USA (NYC) | wholesaler since 1933 | suiting | no | Not published | mixed | Documented 'Request Samples' program | 24-h dispatch | Steven Cahn<br>Woolens@gmail.com<br>212-563-7292 | VERIFIED |
| **Dugdale Bros & Co** | UK | merchant | suiting | no | ~GBP 40-70/m retail references | Super 100s-150s ranges | Open 'Request a Bunch' form (tailors/designers) + full online cut-length portal | yes | Zach Jobe (US, Brooklyn)<br>zach.jobe@dugdalebros.com | VERIFIED |
| **Standeven** | UK | mill / merchant | suiting | no | Wholesale, login-gated | Super 100s-150s ranges | Free trade account, ~48 h approval, NO minimums, swatches + bunches to trade on request - small tailors explicitly welcome | yes | sales@standevenfabrics.co.uk | VERIFIED |
| **Bateman Ogden** | UK | merchant | suiting | no | Login-gated | mixed | Trade signup incl. 'Individual - instant activation' and 'CMT House' account types | likely | batemanogden.co.uk/CreateAccount | VERIFIED |
| **Vitale Barberis Canonico** | Italy | mill acting as merchant | suiting | no | ~$70/m retail references | Super 110s-150s core, incl. tropical | Trade 'Professional Space' platform (registration-gated) | own e-shop | Jessica Bolanos, Ufficio commerciale (Drapers s.r.l.)<br>jessica@drapersitaly.it / jessica@vitalebarberiscanonico.shop<br>+39 051 6310278 int.1 (also WhatsApp)<br>vitalebarberiscanonico.shop<br>Drapers s.r.l., Via di Corticella 184/9, Bologna 40128, Italy | VERIFIED |
| **Huddersfield Fine Worsteds / Hardy Minnis (Fresco)** | UK | merchant | suiting | no | Trade-only | Super 100s-170s | Public may request pattern swatches; 'Bunch Status' tracker | yes - 3.2 m suit lengths "within the normal scope of our business" | Guy Milinazzo, Executive Vice President, Gladson Ltd (US agent for HFW)<br>guym@gladsonltd.com<br>hfwltd.com / gladsonltd.com | VERIFIED |
| **OCM Private Limited** | India (Amritsar) | integrated worsted mill (est. 1922, worsted since 1972) | suiting | **YES** | Not published - quote required | Super 100s - Super 140s (all-wool and wool blends) | Not published - ask | unknown | harjot.singh@ocm.in<br>+91 183 282 0600<br>ocm.in<br>OCM Estate, G.T. Road, Chheharta, Amritsar, Punjab | LIKELY |
| **Digjam Limited** | India (Jamnagar) | composite worsted mill (est. 1948) | suiting | no | Not published - quote required | Premium worsted; exact Super range not published - confirm | Not published - ask | unknown | digjam.co.in | LIKELY |
| **Vardhman Textiles** | India (Ludhiana) | vertically integrated mill | shirting | **YES** | Not published - quote required | — | Not published - ask | unlikely | fabric.vardhman.com | LIKELY |
| **Shandong Nanshan Fashion Sci-Tech** | China (Longkou, Yantai) | worsted mill - largest in north China | suiting | **YES** | Not published - quote required | Wool 20-150 count; blends 40-180 count; Super 120s tropical stated | Not published - ask | unlikely | Offices in New York, Los Angeles, Milan, Tokyo, Seoul, Hong Kong, Shanghai<br>en.nanshan.com.cn<br>Qiansong Village, Dongjiang Town, Longkou, Shandong 265706 | LIKELY |
| **Shaoxing Yun Ai Textile Co., Ltd** | China (Shaoxing) | suiting fabric supplier/manufacturer | suiting | no | Quote-based; in-stock suiting programs | Publishes Super 100s, 120s and Super 130 wool fabric ranges | Not published - ask | likely | admin@yunaitextile.com<br>0086-13656855796<br>iyunaitextile.com / yunai-textile.com | VERIFIED |
| **Shaoxing Surui Textile Co., Ltd** | China (Shaoxing) | worsted suiting supplier | suiting | no | $9.50-13.50/m at 3 m MOQ; $13.00-16.50/m at 1 m MOQ (published) | Worsted wool / wool-poly blends | Not published - ask | yes | suruitex.en.alibaba.com | VERIFIED |
| **Jiexiang Textile** | China | shirting fabric manufacturer | shirting | no | Quote-based | — | Not published - ask | unknown | jiexiangtextile.com | VERIFIED |
| **Yunsa Yunlu Sanayi ve Ticaret A.S.** | Turkey (Istanbul / Cerkezkoy) | integrated worsted mill | suiting | no | Not published - quote required | Upper-segment worsted - confirm Super range | Not published - ask sales directly | unknown | pazarlama@yunsa.com<br>+90 (212) 365 65 00<br>yunsa.com/en | VERIFIED |

### Tier B — worth a letter (26)

| Supplier | Country | Type | Segment | Own garment arm | Price band | Super range | Swatch terms | Cut lengths | Contact | Evid. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Hangzhou K&M Textile** | China | manufacturer | suiting | unknown | Quote-based (TR 199 gsm) | — | Free A4 samples | partial | Jenny<br>jenny@kmtextile.net | VERIFIED |
| **Hangzhou Six Dragon Textile** | China | mill (16 yrs, weave/dye/print in-house) | shirting | no | Quote-based; cotton twill / poly-cotton wholesale | — | Not published | no | Jack Wang<br>gm@sixdragontextile.com<br>+86-15988150362 (WhatsApp)<br>https://www.sixdragontextile.com | VERIFIED |
| **Luthai Textile** | China | yarn-dyed shirting mill (world's largest) | shirting | **YES** | ~$6.80/m dealer reference | — | Not published | no | luthai.com | LIKELY |
| **Fashion Fabrics Club / Fabric Depot** | USA | closeout retailer | both | no | $8-15/yd suiting | — | Paid 1/4-yd swatches, max 5 per order | yes | fashionfabricsclub.com | VERIFIED |
| **Fabric Mart** | USA | jobber / closeout | both | no | $2-8 sale; $18-40 regular | — | Paid 'Julie's Picks' club (capped 500 members) | yes | fabricmartfabrics.com | VERIFIED |
| **Yardblox** | USA (ships US) | wholesaler | both | no | ~$12-26+/yd | — | Free-ish colour cards for most in-stock fabrics; 1-yd samples; no minimums | yes | hello@yardblox.com | VERIFIED |
| **Zelouf Fabrics** | USA (NY) | converter | both | no | Not published; $20 minimum order | — | Free swatches with wholesale-account registration | yes | zelouffabrics.com/pages/wholesale | VERIFIED |
| **Getzner Textil** | Austria | shirting mill | shirting | no | Mid band, not published | — | Seasonal collections to accounts | 1.5 m via MTM program | +43 5552 601-0<br>getzner.at inquiry | VERIFIED |
| **Soktas** | Turkey | shirting mill | shirting | no | ~$15-35/yd historical | — | Not published | unknown | soktas.com.tr | LIKELY |
| **John Foster** | UK | mill | suiting | no | Not published | mixed incl. high Supers | Trade bunches; Mill Archive one-offs | via Pepper Lee | john-foster.co.uk | LIKELY |
| **Reda 1865** | Italy | mill | suiting | no | Not published (mid-premium) | Super 110s-170s | None published | Reda Shop | reda1865.com | LIKELY |
| **Tollegno 1900** | Italy | mill | suiting | no | Not published | Super 110s-150s | None published | unknown | info@tollegno1900.it<br>39 W 38th St, NYC | VERIFIED |
| **Ariston Napoli** | Italy | mill | suiting | no | ~$40-90/m forum references | mixed | Bunch catalogs online; via US agent | cut-length house | US agent: Kemp & Hewitt<br>orders@kempandhewitt.com<br>203-838-3000 | VERIFIED |
| **Fox Brothers** | UK | flannel mill | suiting | no | Trade pricing released only after the account opens. Public refs ~GBP 82-92/m (2017), i.e. well above the $30/yd ceiling. | Fox Air: 100% wool, 285/315 g (10/11 oz), 2-ply high-twist worsted, 1930s archive reproduction - listed in Permanent Style's high-twist bunch guide. Golden Fox: lighter weight, specs not yet confirmed. | Soft cover sets FREE. Hardback bunches GBP 30/book, credited back against an order placed within 3 months. Hardbacks available: Classic Flannel, Vintage Fox, Fox Air, Golden Fox. | yes - no MOQ on stock service | Patrick Osborne-Fox<br>Patrick.Osborne-Fox@foxflannel.com<br>01823 662271<br>foxflannel.com / themerchantfox.co.uk | VERIFIED |
| **Lanificio Cerruti** | Italy | mill | suiting | no | $50-100/yd remnant references | Super 150s-200s | Dedicated bunch email; e-shop with Piacenza | fabrics.piacenza1733.com | bunch@lanificiocerruti.com<br>US bespoke: Antoniades +1 212 935 0111 | VERIFIED |
| **Caccioppoli** | Italy (Naples) | merchant | suiting | no | ~$100/m secondary references | high | Bunches are core business; via US distributor | 24-48 h dispatch | David Douek, Jodek International Ltd<br>info@jodekinternational.com<br>+1 310-275-9128 (prior ledger number 800-325-4668 also on file)<br>222 N. Canon Drive, Suite 204, Beverly Hills, CA 90210, USA | VERIFIED |
| **Harrisons / Lesser / Smith / W.Bill / P&H (LBD group)** | UK | merchant group | suiting | no | ~GBP 60-120/m retail references | Super 100s-180s across the stable | Bunch system; stock checker; account number required | yes | US: Kemp & Hewitt 203-838-3000 | VERIFIED |
| **Holland & Sherry** | UK | merchant | suiting | no | ~$60-150+/yd | Super 100s-180s+ | All bunch books browsable free online; account via NY rep | yes | 212-758-1911<br>145 E 57th St, NYC | VERIFIED |
| **Albini Group (Thomas Mason / David & John Anderson)** | Italy | shirting mill group | shirting | no | Thomas Mason mid-premium; DJA >$100/yd | n/a (shirting counts to 330s) | Trade platform bespoke.albinigroup.com + Fabric Butler app | cut lengths for MTM makers | Albini USA, 260 W 39th St, NYC | LIKELY |
| **Marzotto / Guabello** | Italy | industrial group | suiting | no | Not published (entry-premium) | Super 110s-150s | None published | via distributors | Marzotto USA 212-944-0196 | LIKELY |
| **Raymond (fabric division)** | India | worsted suiting and jacketing mill | suiting | **YES** | Not published - quote required | Super 100s-180s+ across ranges | Not published - ask | unknown | Sonam Gupta<br>sonam.gupta@raymond.in<br>+91-9820444904<br>raymond.in | LIKELY |
| **Jiangsu Sunshine Group** | China (Jiangyin) | worsted mill - China's largest | suiting | **YES** | Not published - quote required | High-count superfine worsted - confirm exact Super ceiling | Not published - ask | unlikely | china-sunshine.com | LIKELY |
| **Jiangsu Jianlu Worsted Co., Ltd** | China (Jiangsu) | worsted fabric mill | suiting | no | Not published - quote required | Worsted - confirm Super range | Not published - ask | unknown | jianlufabric.en.made-in-china.com | LIKELY |
| **Jiangsu Lianfa Textile (DOUBLECOIN)** | China (Hai'an, Nantong) | yarn-dyed shirting mill - 2nd largest globally | shirting | **YES** | Not published - quote required | — | Not published - ask | unlikely | +86 513 8886 9069<br>lianfa.cn/en<br>No. 88 Henglian Road, Chengdong Town, Haian, Nantong 226600 | VERIFIED |
| **MH Textile (mh-chine)** | China | fabric supplier | shirting | no | Quote-based | — | Not published - ask | unknown | mh-chine.com | VERIFIED |
| **Altinyildiz Tekstil ve Konfeksiyon A.S.** | Turkey (Cerkezkoy, Tekirdag) | worsted mill | suiting | **YES** | Not published - quote required | Not published - confirm | Not published - ask | unknown | mail@altinyildiz.com.tr / info@altinyildiz.com.tr<br>altinyildiz.com.tr<br>Yildirim Beyazit Mah., Sanayi Bulvari, Cerkezkoy/Tekirdag | VERIFIED |

### Tier C — reference / backup (10)

| Supplier | Country | Type | Segment | Own garment arm | Price band | Super range | Swatch terms | Cut lengths | Contact | Evid. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Bhilwara cluster (Mascot, Oxford Intl, Siddhartha, Ekta, Dheer Dada)** | India | mills/exporters | suiting | unknown | INR 70-210/m (~$0.85-2.50/m) PV suiting, 100-450 gsm | — | Free swatch sets on inquiry (convention) | no | via ExportersIndia listings | UNVERIFIED |
| **Hebei Xingye** | China | trader (claims mill) | suiting | unknown | TR band $0.60-3.00/m | — | Free samples; you pay courier (~$25-40), refunded on first order - stated verbatim | no | +86 155 1161 6069 (WhatsApp) | VERIFIED |
| **Hangzhou Jinfeng** | China | integrated mill (18,000 m2) | suiting | unknown | Quote-based TR | — | Not published | no | +86-571-8299-5618 | VERIFIED |
| **Siyaram's / Donear** | India | major mills | both | **YES** | Not published (PV suiting/shirting) | — | Via channel-partner / dealer program | no | info@donear.com<br>siyaram.com | VERIFIED |
| **Scabal** | Belgium | merchant | suiting | no | Tiered ('Smart' to 'Bentley') | Super 100s-180s+ | ~80 live bunches; Business Solutions enquiry | 24-h claim | Scabal USA NYC 212-764-8580 | VERIFIED |
| **Dormeuil** | France | merchant | suiting | no | Mid-premium to Vanquish | Super 110s-180s+ | Books allocated selectively to accounts | yes | 800-416-4144<br>Dormeuil USA, 232 Madison Ave | LIKELY |
| **Mafatlal Industries** | India | shirting and suiting mill | both | unknown | Not published | — | Not published - ask | unknown | mafatlals.com | UNVERIFIED |
| **Wooltex (China)** | China | wool suiting fabric manufacturer | suiting | **YES** | Not published | Not published | Not published | unknown | wooltex.com | LIKELY |
| **Huzhou Shichang Textile Co., Ltd** | China (Huzhou) | fabric manufacturer | shirting | no | Quote-based | — | Not published - ask | unknown | sctextile.goldsupplier.com | LIKELY |
| **Yutai Textiles** | China | poplin fabric manufacturer (est. 1999) | shirting | no | Quote-based | — | Not published - ask | unknown | yutaitextiles.com | LIKELY |

### Tier D — deprioritised (3)

| Supplier | Country | Type | Segment | Own garment arm | Price band | Super range | Swatch terms | Cut lengths | Contact | Evid. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Global Fabric Wholesale** | China | trading company | suiting | unknown | Quote-based; wool blends 180-350 gsm | — | 'Free Samples!' advertised | no | +86 134 1118 9544 | VERIFIED |
| **Ermenegildo Zegna (cloth division)** | Italy | mill | suiting | **YES** | >$100/yd (Trofeo) | Super 130s-180s+ | Via US rep only | via Kemp & Hewitt | orders@kempandhewitt.com | VERIFIED |
| **Loro Piana** | Italy | mill (LVMH) | suiting | **YES** | Mostly >$150/yd - above band | Super 150s-250s | B2B textile portal request form | via merchants | loropiana.com/textile | LIKELY |

### Per-supplier notes

- **Bhilwara cluster (Mascot, Oxford Intl, Siddhartha, Ekta, Dheer Dada)** — Polyester-viscose, not wool. Cheapest entry in the ledger but MOQ blocks single-length buying.
- **Hebei Xingye** — Office-tower 'manufacturer' - verify factory status before any volume commitment.
- **Hangzhou K&M Textile** — Free A4 cards make this a cheap budget-book builder.
- **Hangzhou Jinfeng** — Quote-only; no published swatch program.
- **Hangzhou Six Dragon Textile** — REFRESHED 2026-08-24: direct WhatsApp number and site now confirmed on their own product pages. States weaving, dyeing and printing done in-house - upgrades them from 'claims mill' to likely genuine.
- **Global Fabric Wholesale** — No factory evidence; kg-based tiers suit converters, not a bespoke house.
- **Luthai Textile** — GARMENT ARM: Luthai also makes finished shirts. Sells fabric, but you are buying from a downstream competitor. Routed via distributors.
- **Siyaram's / Donear** — Territory/volume terms undisclosed. Both own downstream apparel brands.
- **Fashion Fabrics Club / Fabric Depot** — IN PRICE BAND. Same firm behind two storefronts. No continuity stock - closeout means you cannot reorder a cloth.
- **Acorn Fabrics** — Best documented no-friction shirting account found. No minimums, free cards, cuts shirt lengths.
- **Fabric Mart** — IN PRICE BAND. One of the few realistic routes to high-Super cloth under $30/yd - but closeout, so no reorders.
- **Yardblox** — REPLIED 2026-08-25 05:43, cc Yvonne Tyan. Not yet read or actioned. | IN PRICE BAND. Opaque location/fulfilment - ask where it ships from and who mills it.
- **Zelouf Fabrics** — Account approval requirements unpublished.
- **Tessitura Monti / Canclini 1925** — CONTACTED 2026-08-25 (recovered from the call sheet). | Premium 100% cotton shirting, fabric-only house, sells cut lengths through its own store.
- **Getzner Textil** — The 1.5 m MTM cut-length program is the only way in at your scale - ask for it by name.
- **Soktas** — CONTACTED 2026-08-25 (recovered from the call sheet). | IN PRICE BAND for premium cotton shirting. US route unclear - ask Gladson.
- **Metro Textiles** — KEY CHANNEL for high-Super cloth under $30/yd. Jobber closeouts of Italian/English mill cloth - with the 50% codes this lands in band. Phone-only, small shop.
- **B. Black & Sons** — No trade gate at all - anyone can buy. Just above band; ask about mill-archive and remnant lots which fall under $30.
- **M.J. Cahn** — Named principal, documented sample program, fast dispatch. Cheap call to make.
- **Dugdale Bros & Co** — IN CONVERSATION since 2026-08-19 - predates this session. Four-message thread with Zach Jobe; he replied again 2026-08-25 18:17. This relationship is further along than the rest of the ledger. | Above your price band but a named US rep and an open bunch form make this the easiest premium English account to open.
- **Standeven** — REPLIED 2026-08-25 08:05 by M Townsend - and the reply was still UNREAD as of 22:5x. This is the fastest real win available: free trade account, ~48h approval, no minimums, small tailors explicitly welcome. Open it. | Clearest published trade terms found anywhere. Free account, 48 h, no minimums. Open this first.
- **Bateman Ogden** — CONTACTED 2026-08-25 (recovered from the call sheet). | 'Individual - instant activation' is the lowest-friction trade signup in the whole ledger.
- **John Foster** — Mill Archive one-offs are a genuine under-band route to high-Super English cloth.
- **Vitale Barberis Canonico** — REPLIED 2026-08-25: US B2B is routed to their distributor, JODEK INTERNATIONAL LTD (see the caccioppoli entry - same house). VBC's own commercial arm is Drapers s.r.l. in Bologna, under VBC direction, which also runs vitalebarberiscanonico.shop - so there are two possible routes: a Jodek trade account, or cut lengths through the VBC shop. Worth testing both. | CONTACTED 2026-08-25 (recovered from the call sheet). | The reference point for tropical Super 110s/120s. Above band, but the quality benchmark you price everything else against.
- **Reda 1865** — Contact via CTDA DFNY booth. Strong tropical/high-twist ranges.
- **Tollegno 1900** — Has a New York office - domestic contact removes duty and freight friction.
- **Ariston Napoli** — Cut-length house - suits one-garment-at-a-time buying.
- **Fox Brothers** — Reply SENT 2026-08-25 22:24. Account details provided; street address and ZIP promised as a same-day follow-up and still outstanding. Three soft-cover questions and the conditional Fox Air hardback are with Patrick. | REPLIED 2026-08-25 - the first supplier to answer. Terms are far better than assumed: NO MOQ on the stock service collection, same-day dispatch, free soft cover bunches, and everything but Fox Drop is continuity. Upgraded C->B on those terms. Price is still the catch - trade pricing is withheld until the account opens, and public references put it far above the $30/yd ceiling, so treat Fox as a premium story cloth bought one length at a time against a paid commission, never as programme cloth. FOX AIR IS DIRECTLY ON BRIEF: Patrick names it as their high-twist collection, which is the tropical/warm-weather cloth the brief asked for. Import duty is buyer-side, confirmed in writing.
- **Lanificio Cerruti** — Covers the top of your Super range (150s-200s). Remnant lots are the affordable door.
- **Caccioppoli** — JODEK CARRIES BOTH CACCIOPPOLI AND VBC. Confirmed 2026-08-25 when Vitale Barberis Canonico routed a US B2B request to Jodek as their distributor; Jodek was already on file here as Caccioppoli's US distributor. One account therefore reaches two major Italian houses - the same consolidation Kemp & Hewitt offers for Ariston, Harrisons and Zegna. Named contact and a direct Beverly Hills number now on file, which is better than the general line previously held. Upgraded C->B on that basis. | Expect real-business vetting. Well above band.
- **Harrisons / Lesser / Smith / W.Bill / P&H (LBD group)** — One call to Kemp & Hewitt opens roughly five brands at once.
- **Huddersfield Fine Worsteds / Hardy Minnis (Fresco)** — Routed by HFW (Jesica Oldham) to Gladson, its US agent - Guy Milinazzo, EVP, guym@gladsonltd.com. He confirmed individual cut lengths (3.2m within normal scope), HFW collections held in the US, and no minimum annual purchase for a relationship - but gates sample presentations on five qualifying questions. Reply drafted, pending call windows. | REPLIED 2026-08-25 via Gladson, their US agent - Guy Milinazzo, EVP. Structurally the best fit found so far: individual 3.2 m cut lengths are normal business, HFW collections are held in the US so there is no direct import and no buyer-side duty, and there is no minimum annual purchase for the relationship itself. HOME OF FRESCO, the high-twist tropical named in the brief. The gate is credibility, not money: Gladson vets before releasing collections because sample presentations cost them real money, and a pre-launch brand is exactly the profile that normally gets screened out. He offered a phone call twice - take it; at pre-revenue the founder's voice outperforms any number on a form. Price reality CORRECTED 2026-08-25: cloth is a cost-plus pass-through to the customer, so Fresco is not locked out by the price band - the customer selects it and carries the cost. Stronger still, the owner ALREADY HOLDS Fresco, Voyager and several Huddersfield books coded to an old factory system, which turns the ask from "send me samples" into "help me make my existing books current" - costing Gladson nothing and proving existing activity.
- **Holland & Sherry** — Covers your full Super range. No self-serve signup - NY rep only.
- **Scabal** — HIDDEN CONDITION: volume-tiered pricing - the same cloth costs you more because you buy little.
- **Dormeuil** — Selective allocation - unlikely to book a brand-new account early.
- **Albini Group (Thomas Mason / David & John Anderson)** — HIDDEN CONDITION: books reimbursed only if you hit a first-year minimum turnover. Resale cert + trade references required.
- **Ermenegildo Zegna (cloth division)** — GARMENT ARM: Zegna is a major suit brand. Brand-controlled cloth allocation. Far above band.
- **Loro Piana** — CONTACTED 2026-08-25 (recovered from the call sheet). | GARMENT ARM + LVMH vetting and volume expectations. Out of band.
- **Marzotto / Guabello** — The most affordable of the Biella names. Small buyers routed to distributors.
- **OCM Private Limited** — India's first integrated worsted unit. 8 million m/yr, 37-acre plant, NABL-accredited lab (first worsted suiting maker in India to get it), ISO 9001. Covers Super 100s-140s - the sweet spot of your range at Indian cost. GARMENT ARM: also makes RTW suits and jackets, so treat tech packs as confidential.
- **Digjam Limited** — CONTACTED 2026-08-25 (recovered from the call sheet). | FABRIC-FIRST, no significant garment arm - strongest 'free and clear' fit in the Indian worsted tier. Fully vertically integrated wool-top to finished cloth on French/German/Swiss/Italian machinery. 3M+ m/yr, 35-40% exported to Europe/USA/Canada/Middle East. ISO 9001:2015 + Oeko-Tex. Note: had a liquidity-driven shutdown in its past - check current trading status before committing.
- **Raymond (fabric division)** — One of the largest worsted producers in the world and reaches the top of your Super range. GARMENT ARM IS LARGE: Raymond runs its own retail, made-to-measure and tailoring network - the most direct downstream competitor in this ledger. Buy cloth, share nothing.
- **Vardhman Textiles** — DIRECT HIT ON THE STRETCH SHIRTING ASK: publishes 100% cotton, cotton stretch (weft stretch AND bi-stretch), cotton-nylon stretch, cotton-linen and cotton-cellulosic shirting. 220M+ m/yr woven, 114M m/yr processed, exports to 75+ countries incl. USA. A LYCRA Company sourcing-network member. GARMENT ARM: 1.8M shirts/yr.
- **Mafatlal Industries** — Long-established Indian shirting name, reported record H1 FY26 revenue. Lead only - no contact or product detail confirmed yet.
- **Jiangsu Sunshine Group** — China's largest worsted wool fabric producer: 22-35M m/yr superfine worsted, 115,000 worsted spindles, 600 looms, 15,000+ staff. GARMENT ARM IS LARGE: 3.5M suits/yr capacity plus its own suit lines. Enormous capability but you are a rounding error to them - expect distributor routing.
- **Shandong Nanshan Fashion Sci-Tech** — EXPLICITLY LISTS SUPER 120s TROPICAL plus lycra-elastic, OPTIM and cashmere-blend worsteds - the closest published match to your tropical-wool ask at Chinese cost. US offices in NY and LA mean you can open this in English, in your timezone, without freight risk on samples. GARMENT ARM exists - buy cloth only.
- **Shaoxing Yun Ai Textile Co., Ltd** — CONTACTED 2026-08-25 (recovered from the call sheet). | FABRIC-ONLY, no garment arm found - clean 'free and clear' fit. Maintains dedicated Super 100s / 120s / 130 product lines and carries in-stock suiting, which usually means low minimums. Much of the visible stock is wool-blend (e.g. 10% wool / 61% poly / 29% rayon), so pin down all-wool vs blend on every quote.
- **Shaoxing Surui Textile Co., Ltd** — HITS THE $15/YD TARGET WITH PUBLISHED PRICING AND A 1-METRE MINIMUM - the single best price-to-minimum ratio in the ledger. Wool/poly blend (50% wool class), not all-wool, so it is a value-tier cloth, not a Super 130s substitute. Verify the mill is real before scaling.
- **Jiangsu Jianlu Worsted Co., Ltd** — Presents as a dedicated worsted fabric mill with no garment arm found - good 'free and clear' candidate. Unverified beyond its trade storefront.
- **Wooltex (China)** — GARMENT ARM: describes itself as making wool suiting fabrics AND wool suits. Lower priority on your free-and-clear rule.
- **Jiangsu Lianfa Textile (DOUBLECOIN)** — Second-largest yarn-dyed fabric capacity in the world: 180M m/yr yarn-dyed, 60M m/yr solid-dyed, 25,000 t/yr yarn. Exports to 36 countries incl. USA. Also produces spandex covering yarn and cotton-spandex stretch fabrics. GARMENT ARM: 10M finished garments/yr including shirts - a direct downstream competitor.
- **Jiexiang Textile** — DIRECT MATCH ON STRETCH SHIRTING: publishes a 96% cotton / 4% spandex poplin for shirts, 40x40+40D construction, 133x72 density, 130 gsm. That is the correct woven spec for a stretch dress shirt (see the 92/8 note in the ledger). Fabric-only, no garment arm found.
- **MH Textile (mh-chine)** — Publishes 97% cotton / 3% spandex stretch twill and documents the standard cotton-spandex woven ratios (92/8 through 98/2). Useful technical counterpart as well as a supplier.
- **Huzhou Shichang Textile Co., Ltd** — Cotton/spandex twill producer. Thin evidence - lead only.
- **Yutai Textiles** — Specialist poplin supplier since 1999 - relevant to the 100% cotton shirting ask.
- **Yunsa Yunlu Sanayi ve Ticaret A.S.** — REINSTATED. The prior pass deprioritised Yunsa as 'brand-scale access only', but a direct sales address is published on its own site. Produces its own yarn: 10M m/yr fabric capacity, 4,500 t/yr worsted yarn, top-five upper-segment wool fabric exporter worldwide, exports to 50+ countries. FABRIC-ONLY, no garment arm - the strongest free-and-clear fit at premium quality. Turkey also sits between Italian quality and Asian cost.
- **Altinyildiz Tekstil ve Konfeksiyon A.S.** — Exporting Turkish suiting since 1956. GARMENT ARM: the group also runs the Altinyildiz Classics menswear retail brand.

<!-- END GENERATED -->

---

## Known hidden conditions

- **Albini / Thomas Mason** — books are effectively loaned: the cost is reimbursed only
  if you hit a first-year minimum turnover. The clearest documented catch found.
- **Scabal** — volume-tiered pricing. The same cloth costs more because you buy little.
  Assume this mechanic exists informally almost everywhere.
- **Chinese mills** — "free sample" means free cloth; you pay ~$25–40 courier, refunded
  against your first order. Hebei Xingye states this verbatim.
- **Zelouf** — free swatches gated behind wholesale-account registration; the proof
  requirements are unpublished.
- **Premium merchants (H&S, Caccioppoli, Dormeuil, HFW)** — business licence or resale
  certificate plus trade references expected before bunches ship. HFW is trade-only by policy.
- **Import duty** on UK/EU direct shipments is yours. Fox Brothers says so explicitly.
  This is the quiet advantage of the NY/NJ-warehoused distributors (Gladson, H&S NY,
  Tollegno's 38th St office, Nanshan's NY and LA offices).

## What is still unknown

1. **No all-wool worsted price from any Asian mill.** OCM, Digjam, Nanshan, Yünsa and
   Raymond are all quote-only. This is the highest-value unknown in the ledger and the
   entire reason Wave 2 outreach exists.
2. **Digjam's current trading status.** It has a liquidity-driven shutdown in its
   history. Confirm it is actively trading before investing effort.
3. **Whether the Asian mills will cut single suit lengths (3.2 m) at all**, or only
   piece goods. This decides whether they can serve one-garment-at-a-time work or only
   a stocked programme.
4. **Real MOQ tiers behind the advertised ones.** "1 metre" on a trade storefront is
   usually a sample tier, not a production tier.
5. **Whether Surui, Yun Ai, Jianlu and Jiexiang are mills or traders.** All four look
   clean on the free-and-clear test, which makes verifying them worth the effort.

## Provenance

- Wave 1: *Blessed & Dressed — Production Partner & Fabric Sourcing Report*, 2026-08-18
  (Phase 2), plus the Japan supplier vetting and sourcing brief artifacts.
- Wave 2: research pass of 2026-08-24 — web and trade-index search across Indian,
  Chinese, Turkish and US channels, with evidence tiers recorded per row.
