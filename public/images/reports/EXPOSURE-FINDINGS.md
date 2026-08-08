# Exposure findings — 2026-08-08

Found while investigating how to make the craft blueprints URL-reachable for
image generation. Every item below was verified directly, not inferred.

**The premise of that investigation was wrong: the images are already public.**

---

## 1. The GitHub repository is public

```
gh api repos/chasestanley91-gif/Blessed-Dressed
  private: false   visibility: public   size: 2.96 GB   created: 2026-06-06
```

Public for two months. Anyone can read it without logging in:

```
curl .../raw/main/public/images/supplier-bb/GCOPA/A.jpg   -> 200 image/jpeg
```

Local commits are reaching it. `origin/main` sits at this session's commit
`00e34ab`, and there is **no git hook in `.git/hooks/`** doing it — so the push
came from outside this session.

## 2. An expired supplier token is readable in it

`factory-screenshots/kute/api-captures.json` — 60 KB, HTTP 200 unauthenticated.
Contains three KuteTailor JWTs.

Both decodable tokens **expired in May 2026**, so they cannot be used to log in.
What remains readable is account identity:

```
user_name: LABDP    owned_store: KUSAD083    user_id: 4160    scope: ["all"]
```

Not a live credential. Still an account name and store code that should not be
in a public repository.

## 3. The live storefront serves the supplier tech packs

Production is **customsuits.net** (`vercel project ls`). It serves them openly:

```
200 image/jpeg  /images/supplier-bb/GCOPA/A.jpg
200 image/jpeg  /images/jacket/canvas/full-canvas.jpg
200 image/jpeg  /images/blueprints/supplier/0135c80fdb4e__0201__Regular.jpg
```

## 4. Search engines are invited to index them

```
curl https://customsuits.net/robots.txt
  User-Agent: *
  Allow: /
  Disallow: /admin  /api/  /cart  /checkout
```

`/images/` is not excluded, and the custom domain sends no `X-Robots-Tag`
(the `*.vercel.app` aliases do). Google Images may index supplier tech packs.

Separate defect in the same file: `Host:` and `Sitemap:` point at a stale
deployment hostname, not `customsuits.net`.

## 5. Some of what is being served should not be

Verified by opening the files:

- `jacket/canvas/full-canvas.jpg` — Chinese text plus **"Plus 3 Working Days"**
  burned into the image. Supplier production lead time, on the storefront.
- `blueprints/factory/…072D__Appointed_DIY_Printing.png` — **photographs of
  identifiable people** printed on a lining sample. Live.
- `supplier-bb/PROCE/A.jpg` — **0 bytes**, and referenced by the catalog.
- `jacket/back-vent/center-vent.jpg` — shows a grid of **lapel widths**, not a
  back vent. Filename and content disagree.

204 catalog rows now reference `/images/supplier-bb/`, so these are
customer-facing.

---

## What this changes for the photography run

The upload bottleneck is **already solved and costs nothing**: blueprints can be
attached with `media_import_url` pointed at `customsuits.net`, with no new
hosting and no new exposure, because the exposure already exists.

That saves ~1,500 characters per image out of ~6,500. The prompt is the rest,
and it cannot be cut much further without weakening the locks that make the
images correct. **A Higgsfield API key remains the only change that removes the
constraint entirely.**

## Decisions for the owner

1. Should the repository be public? If not: make it private, and rotate the
   KuteTailor account regardless of the tokens being expired.
2. Should supplier tech packs be indexable? If not, exclude the blueprint
   directories in `robots.txt`.
3. The lead-time caption, the photographs of people, the 0-byte file and the
   mislabelled drawing should come off the storefront on their own merits.
