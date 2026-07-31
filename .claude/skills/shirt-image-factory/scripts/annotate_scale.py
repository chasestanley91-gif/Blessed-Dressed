#!/usr/bin/env python3
"""Draw exact measurement callouts on an approved product photo (deterministic — no AI).

Usage:
    python annotate_scale.py <photo> --out <output.png> \
        --label "5.8 cm@412,318:512,590" [--label "3.5 cm@100,50:240,50"] [--style luxury]

Each --label is  TEXT@x1,y1:x2,y2  — a dimension line from (x1,y1) to (x2,y2) with TEXT
in a pill at the midpoint. Claude picks the pixel coordinates by viewing the photo first.
End ticks are drawn perpendicular to the line, engineering-drawing style.

Requires: Pillow  (pip install pillow)
"""
import argparse
import math
import re
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow is required: pip install pillow --break-system-packages")

LINE = (28, 28, 28, 235)      # near-black
HALO = (255, 255, 255, 235)   # white halo behind line for dark fabrics
PILL_BG = (28, 28, 28, 225)
PILL_TEXT = (255, 255, 255, 255)


def get_font(size):
    for name in ("arial.ttf", "Arial.ttf", "DejaVuSans.ttf",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def perp(dx, dy, length):
    n = math.hypot(dx, dy) or 1.0
    return (-dy / n * length, dx / n * length)


def draw_dimension(draw, x1, y1, x2, y2, text, font, scale):
    w = max(2, int(2 * scale))
    tick = max(6, int(9 * scale))
    px, py = perp(x2 - x1, y2 - y1, tick)
    # halo then line (visible on any fabric)
    for width, color in ((w + max(2, int(2 * scale)), HALO), (w, LINE)):
        draw.line([(x1, y1), (x2, y2)], fill=color, width=width)
        draw.line([(x1 - px, y1 - py), (x1 + px, y1 + py)], fill=color, width=width)
        draw.line([(x2 - px, y2 - py), (x2 + px, y2 + py)], fill=color, width=width)
    # label pill at midpoint, offset perpendicular
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    ox, oy = perp(x2 - x1, y2 - y1, tick * 2.6)
    tb = draw.textbbox((0, 0), text, font=font)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    pad = max(4, int(6 * scale))
    cx, cy = mx + ox, my + oy
    box = [cx - tw / 2 - pad, cy - th / 2 - pad, cx + tw / 2 + pad, cy + th / 2 + pad]
    draw.rounded_rectangle(box, radius=pad + 2, fill=PILL_BG)
    draw.text((cx - tw / 2 - tb[0], cy - th / 2 - tb[1]), text, font=font, fill=PILL_TEXT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("photo")
    ap.add_argument("--out", required=True)
    ap.add_argument("--label", action="append", required=True,
                    help='TEXT@x1,y1:x2,y2 (repeatable)')
    ap.add_argument("--style", default="luxury")  # reserved for future styles
    args = ap.parse_args()

    img = Image.open(args.photo).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    scale = max(img.size) / 1400.0
    font = get_font(max(14, int(26 * scale)))

    pat = re.compile(r"^(.+)@(\d+),(\d+):(\d+),(\d+)$")
    for spec in args.label:
        m = pat.match(spec.strip())
        if not m:
            sys.exit(f"bad --label format: {spec!r} (want TEXT@x1,y1:x2,y2)")
        text, x1, y1, x2, y2 = m.group(1), *map(int, m.groups()[1:])
        draw_dimension(draw, x1, y1, x2, y2, text, font, scale)

    Image.alpha_composite(img, overlay).convert("RGB").save(args.out, quality=95)
    print(f"annotated -> {args.out}")


if __name__ == "__main__":
    main()
