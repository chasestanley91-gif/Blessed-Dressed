import json, os, textwrap
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.dirname(HERE)
ROOT = os.path.dirname(os.path.dirname(OUTDIR))

PRODUCTS = [("shirt", "Shirt"), ("suit-2pc", "Suit (2-Piece)"),
            ("sport-coat", "Sport Coat"), ("trousers", "Trousers"), ("vest", "Vest")]

# Sections to sample from, in order of interest to a maker.
WANT = [
    ("shirt", "Collar"), ("shirt", "Cuff"), ("shirt", "Placket"),
    ("shirt", "Pocket"), ("shirt", "Back"),
    ("suit-2pc", "Lapel"), ("suit-2pc", "Pockets"), ("suit-2pc", "Back & Vents"),
    ("suit-2pc", "Sleeves & Cuffs"), ("suit-2pc", "Shoulder & Structure"),
    ("trousers", None), ("vest", None), ("sport-coat", None),
]

by_prod = {}
for f, name in PRODUCTS:
    d = json.load(open(os.path.join(ROOT, "data-store/options", f + ".json")))
    rows = []
    for sec in d["sections"]:
        for fl in sec["fields"]:
            for o in fl.get("options", []):
                p = o.get("illustration") or o.get("techpackIllustration")
                if not p:
                    continue
                fp = os.path.join(ROOT, "public" + p)
                if os.path.exists(fp):
                    rows.append({"section": sec["label"], "field": fl["label"],
                                 "name": o["label"], "code": o["id"], "path": fp})
    by_prod[f] = rows

SKIP_NAMES = {"none", "no", "matching to fabric", "matching", "standard", "default"}


def interesting(r):
    """Keep structural construction drawings; drop null-options and colour swatches."""
    n = r["name"].strip().lower()
    if n in SKIP_NAMES:
        return False
    if r["code"].endswith("-none") or r["code"].startswith("yz-"):
        return False
    if "color" in r["field"].lower() or "thread" in r["field"].lower():
        return False
    return True


# Take a few per WANT entry, spreading across distinct option categories.
PER_WANT = 4
picked, seen = [], set()
for prod, section in WANT:
    pool = [r for r in by_prod[prod]
            if (section is None or r["section"].lower().startswith(section.lower()))
            and interesting(r)]
    groups = {}
    for r in pool:
        groups.setdefault(r["field"], []).append(r)
    taken = 0
    # round-robin across categories so one category cannot fill the slot
    idx = 0
    while taken < PER_WANT and groups:
        progressed = False
        for field in list(groups.keys()):
            if idx < len(groups[field]) and taken < PER_WANT:
                r = groups[field][idx]
                if r["path"] not in seen:
                    seen.add(r["path"])
                    picked.append((prod, r))
                    taken += 1
                progressed = True
        if not progressed:
            break
        idx += 1
picked = picked[:48]

PROD_LABEL = dict(PRODUCTS)

# Headline coverage figures, over the whole catalogue (all six garment types,
# not just the five sampled above). Read from extract.mjs output so the cover
# line cannot drift as the option set grows.
_cat = json.load(open(os.path.join(HERE, ".data", "craft-options.json")))
N_OPTIONS = sum(len(p["rows"]) for p in _cat)
N_ILLUSTRATED = sum(1 for p in _cat for r in p["rows"] if r["illustration"] == "Yes")

# ── page layout (A4 @ 150 dpi) ────────────────────────────────────────────
W, H = 1240, 1754
MARGIN = 70
COLS, ROWS = 3, 4
GUT = 26
CELL_W = (W - 2 * MARGIN - (COLS - 1) * GUT) // COLS
CAP_H = 74
IMG_H = 268
CELL_H = IMG_H + CAP_H
TOP = 190


def load_font(size, bold=False):
    cands = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf" % ("-Bold" if bold else ""),
        "/usr/share/fonts/truetype/liberation/LiberationSans-%s.ttf" % ("Bold" if bold else "Regular"),
    ]
    for c in cands:
        if os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


F_TITLE = load_font(30, True)
F_SUB = load_font(15)
F_CAP = load_font(14, True)
F_CODE = load_font(12)
F_FOOT = load_font(12)

NAVY = (31, 51, 82)
GREY = (110, 118, 130)
LINE = (198, 206, 216)

pages = []
n_pages = (len(picked) + COLS * ROWS - 1) // (COLS * ROWS)

for pi in range(n_pages):
    page = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(page)

    d.rectangle([0, 0, W, 96], fill=NAVY)
    d.text((MARGIN, 26), "BLESSED & DRESSED", font=F_TITLE, fill="white")
    d.text((MARGIN, 64), "Craft Option Technical Illustrations — representative sample",
           font=F_SUB, fill=(190, 202, 220))

    d.text((MARGIN, 126),
           "Every option below has a dimensioned construction drawing on file. "
           "%s of our %s catalogued options are illustrated." % (
               format(N_ILLUSTRATED, ","), format(N_OPTIONS, ",")),
           font=F_SUB, fill=GREY)
    d.line([MARGIN, 162, W - MARGIN, 162], fill=LINE, width=1)

    chunk = picked[pi * COLS * ROWS:(pi + 1) * COLS * ROWS]
    for i, (prod, r) in enumerate(chunk):
        cx = MARGIN + (i % COLS) * (CELL_W + GUT)
        cy = TOP + (i // COLS) * (CELL_H + 22)

        d.rectangle([cx, cy, cx + CELL_W, cy + IMG_H], outline=LINE, width=1)
        try:
            im = Image.open(r["path"]).convert("RGB")
            im.thumbnail((CELL_W - 20, IMG_H - 20), Image.LANCZOS)
            page.paste(im, (cx + (CELL_W - im.width) // 2, cy + (IMG_H - im.height) // 2))
        except Exception:
            d.text((cx + 12, cy + 12), "(image unavailable)", font=F_CODE, fill=GREY)

        ty = cy + IMG_H + 8
        for ln in textwrap.wrap("%s — %s" % (PROD_LABEL[prod], r["name"]), width=34)[:2]:
            d.text((cx + 2, ty), ln, font=F_CAP, fill=(20, 20, 20))
            ty += 17
        d.text((cx + 2, ty + 2), r["code"], font=F_CODE, fill=NAVY)
        d.text((cx + 2, ty + 18), r["field"], font=F_CODE, fill=GREY)

    d.line([MARGIN, H - 66, W - MARGIN, H - 66], fill=LINE, width=1)
    d.text((MARGIN, H - 54),
           "Blessed & Dressed  ·  Louisiana, United States  ·  chasestanley91@gmail.com",
           font=F_FOOT, fill=GREY)
    d.text((W - MARGIN - 90, H - 54), "Page %d of %d" % (pi + 1, n_pages),
           font=F_FOOT, fill=GREY)
    pages.append(page)

out = os.path.join(OUTDIR, "Blessed-and-Dressed_Craft-Illustrations-Sample.pdf")
pages[0].save(out, save_all=True, append_images=pages[1:], resolution=150.0)
print("wrote", out, "pages:", len(pages), "illustrations:", len(picked))
for prod, r in picked[:6]:
    print(" ", prod, "|", r["field"], "|", r["name"], "|", r["code"])

