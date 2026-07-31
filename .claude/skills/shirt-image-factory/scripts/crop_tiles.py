#!/usr/bin/env python3
"""Crop option tiles out of supplier ordering-platform screenshots.

Usage:
    python crop_tiles.py <screenshot_folder> <out_folder> [--sheets]

Each screenshot from the MTM platform is one category row: a header top-left
("Shoulder head *"), then a horizontal row of tile cards, each an illustration with an
English caption below it. This script:

  1. splits the image into horizontal ink bands (header / drawings / captions)
  2. segments the drawings band into tiles by white column gaps
  3. crops each tile from the top of the drawings band to the bottom of the captions
     band, extending sideways to the midpoint between neighbors (captions included)
  4. flags tiles wrapped in a selection border (their illustration may contain the
     platform's blue checkmark — needs attention before use as a blueprint)
  5. writes <out>/<screenshot-stem>/tile-NN.png, header.png, and a global manifest.json

--sheets additionally writes headers-sheet-N.png (all category headers, 20 per sheet,
labeled with the screenshot stem) so a human/Claude can map screenshots to categories in
a handful of views instead of hundreds.

Requires: Pillow, numpy
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

INK_THRESH = 200      # gray value below this counts as ink
ROW_GAP = 5           # >= this many clean rows separates horizontal bands
COL_GAP = 10          # >= this many clean columns separates tiles
MIN_TILE_W = 40       # ignore ink slivers narrower than this
PAD = 4


def ink_mask(im):
    g = np.asarray(im.convert("L"), dtype=np.uint8)
    return g < INK_THRESH


def bands(profile, min_gap, min_size=3):
    """Split a 1-D ink profile into [start, end) runs separated by >=min_gap zeros."""
    runs, start, gap = [], None, 0
    for i, v in enumerate(profile):
        if v > 0:
            if start is None:
                start = i
            gap = 0
        else:
            if start is not None:
                gap += 1
                if gap >= min_gap:
                    end = i - gap + 1
                    if end - start >= min_size:
                        runs.append((start, end))
                    start, gap = None, 0
    if start is not None:
        runs.append((start, len(profile)))
    return runs


def crop_screenshot(path, out_dir):
    im = Image.open(path)
    if im.mode != "RGB":
        im = im.convert("RGB")
    mask = ink_mask(im)
    H, W = mask.shape

    row_runs = bands(mask.sum(axis=1), ROW_GAP)
    if not row_runs:
        return []
    # header = first band if it hugs the top and is short; drawings = tallest band
    header = None
    candidates = row_runs[:]
    if candidates[0][0] < H * 0.2 and (candidates[0][1] - candidates[0][0]) < H * 0.25 \
            and len(candidates) > 1:
        header = candidates.pop(0)
    draw_band = max(candidates, key=lambda r: r[1] - r[0])
    bottom = max(r[1] for r in candidates)          # includes caption band
    top = draw_band[0]

    # tile segmentation on the drawings band only
    col_profile = mask[draw_band[0]:draw_band[1]].sum(axis=0)
    col_runs = [r for r in bands(col_profile, COL_GAP, MIN_TILE_W)]
    tiles = []
    stem_dir = out_dir / Path(path).stem
    stem_dir.mkdir(parents=True, exist_ok=True)

    if header:
        hy0, hy1 = header
        hmask = mask[hy0:hy1]
        xs = np.where(hmask.any(axis=0))[0]
        if len(xs):
            im.crop((max(0, xs[0] - PAD), max(0, hy0 - PAD),
                     min(W, xs[-1] + PAD), min(H, hy1 + PAD))) \
              .save(stem_dir / "header.png")

    for i, (x0, x1) in enumerate(col_runs):
        left = 0 if i == 0 else (col_runs[i - 1][1] + x0) // 2
        right = W if i == len(col_runs) - 1 else (x1 + col_runs[i + 1][0]) // 2
        box = (max(0, left), max(0, top - PAD), min(W, right), min(H, bottom + PAD))
        crop = im.crop(box)
        # selection border? sample a perimeter ring for dark/navy pixels
        cm = ink_mask(crop)
        ring = np.concatenate([cm[2, :], cm[-3, :], cm[:, 2], cm[:, -3]])
        selected = bool(ring.mean() > 0.25)
        name = f"tile-{i:02d}.png"
        crop.save(stem_dir / name)
        tiles.append({"source": Path(path).name, "tile": f"{Path(path).stem}/{name}",
                      "index": i, "bbox": list(box), "selected": selected})
    return tiles


def build_header_sheets(out_dir, per_sheet=20):
    headers = sorted(out_dir.glob("*/header.png"))
    if not headers:
        return 0
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
    except OSError:
        font = ImageFont.load_default()
    n_sheets = 0
    for s in range(0, len(headers), per_sheet):
        chunk = headers[s:s + per_sheet]
        row_h = 46
        wmax = 980
        sheet = Image.new("RGB", (wmax, row_h * len(chunk)), "white")
        d = ImageDraw.Draw(sheet)
        for j, h in enumerate(chunk):
            im = Image.open(h)
            im.thumbnail((620, row_h - 8))
            sheet.paste(im, (4, j * row_h + 4))
            d.text((640, j * row_h + 14), h.parent.name[:52], fill="black", font=font)
            d.line([(0, (j + 1) * row_h - 1), (wmax, (j + 1) * row_h - 1)], fill="#ddd")
        n_sheets += 1
        sheet.save(out_dir / f"headers-sheet-{n_sheets}.png")
    return n_sheets


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--sheets", action="store_true")
    args = ap.parse_args()
    src, out = Path(args.src), Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    manifest, per_file = [], []
    files = sorted([p for p in src.iterdir()
                    if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")])
    for p in files:
        tiles = crop_screenshot(p, out)
        manifest.extend(tiles)
        per_file.append((p.name, len(tiles), sum(t["selected"] for t in tiles)))

    (out / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    print(f"{'screenshot':<58}{'tiles':>6}{'sel':>5}")
    for name, n, sel in per_file:
        flag = "  <-- check" if n in (0, 1) else ""
        print(f"{name[:57]:<58}{n:>6}{sel:>5}{flag}")
    print(f"\n{len(files)} screenshots -> {len(manifest)} tiles "
          f"({sum(t['selected'] for t in manifest)} flagged selected)")
    if args.sheets:
        n = build_header_sheets(out)
        print(f"{n} header sheet(s) written")


if __name__ == "__main__":
    main()
