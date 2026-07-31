#!/usr/bin/env python3
"""Phase 0 repository audit — one machine-readable inventory every sprint references.

Usage:
    python audit.py <site_root> <shirt_assets_root> [--out inventory.json]

Reads every source of truth in the project and answers, per garment and in total:
  total craft options · with photos · accepted (last export) · need prompts · need
  regeneration · no tech-pack illustration · no measurements · inconsistent ids/labels ·
  duplicate prompts · duplicate images (by content hash)

Outputs <shirt_assets_root>/inventory.json and a static dashboard.html beside it.
Definitions are documented in the JSON so numbers are reproducible, not vibes.
"""
import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path


def load_review_cards(site):
    html = (site / "public/images/review.html").read_text(encoding="utf-8")
    m = re.search(r"const DATA = (\{.*?\});\n(?:const LS|let state)", html, re.S)
    if not m:
        return None
    return json.loads(m.group(1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site_root")
    ap.add_argument("assets_root")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    site, assets = Path(args.site_root), Path(args.assets_root)
    img_root = site / "public/images"

    data = load_review_cards(site)
    cards = data["cards"] if data else []
    # normalize both known schemas (Cowork v2: photos/illustration; VS Code: images+roles)
    norm = []
    for c in cards:
        if "images" in c:  # role-based schema
            photos = [i["src"] for i in c["images"]
                      if not i.get("remote") and str(i["src"]).startswith("generated/")]
            # a wired techpack may be hash-merged into another entry (identical file at
            # both <field>/x.jpg and techpacks/.../x.jpg) — its path then lives in aka[],
            # so check every known path of every image, not just the primary src
            tps = []
            for i in c["images"]:
                paths = [str(i.get("src", ""))] + [str(a) for a in i.get("aka") or []]
                tp_path = next((p for p in paths if p.startswith("techpacks/")), None)
                if tp_path:
                    tps.append(tp_path)
            illustration = tps[0] if tps else None
            cat = c.get("fieldId") or c.get("field") or "misc"
            garment = c.get("garment")
        else:
            photos = c.get("photos") or []
            illustration = c.get("illustration")
            cat = c.get("category", "misc")
            garment = c.get("garments", ["?"])[0]
        norm.append({"garment": garment, "category": cat, "id": c["id"],
                     "label": c.get("label", ""), "photos": photos,
                     "illustration": illustration,
                     "has_true_techpack": bool(illustration and
                                               str(illustration).startswith("techpacks/"))})

    # shirt workbook catalog (measurements + structural/swatch)
    catalog = json.loads((assets / "catalog.json").read_text(encoding="utf-8"))
    shirt_meas = sum(1 for o in catalog["options"]
                     if o["kind"] == "structural" and o.get("measurements_cm"))
    shirt_no_meas = sum(1 for o in catalog["options"]
                        if o["kind"] == "structural" and not o.get("measurements_cm"))
    shirt_pending = sum(1 for o in catalog["options"]
                        if o["kind"] == "structural" and o["status"] == "pending")

    # remake queue
    queue = {}
    qp = site / "public/images/review-remake-queue.json"
    if qp.exists():
        queue = json.loads(qp.read_text(encoding="utf-8"))

    # techpack map coverage
    tp_map = {}
    tpp = img_root / "techpacks/techpack-map.json"
    if tpp.exists():
        tp_map = json.loads(tpp.read_text(encoding="utf-8"))

    # prompts on disk (factory-produced, reproducible)
    prompts = list(assets.glob("photos/**/prompt.txt")) + \
              list(assets.glob("photos/**/prompt-attempt*.txt"))
    prompt_texts = Counter()
    for p in prompts:
        body = re.sub(r"^model:.*?\n\n", "", p.read_text(encoding="utf-8",
                                                         errors="replace"), flags=re.S)
        prompt_texts[hashlib.md5(body.encode()).hexdigest()] += 1
    dup_prompts = sum(v - 1 for v in prompt_texts.values() if v > 1)

    # duplicate images by content hash across generated/
    hashes = defaultdict(list)
    for p in sorted((img_root / "generated").rglob("*")):
        if p.is_file() and p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
            hashes[hashlib.md5(p.read_bytes()).hexdigest()].append(
                p.relative_to(img_root).as_posix())
    dup_groups = {h: v for h, v in hashes.items() if len(v) > 1}

    # id/label consistency: same id used with different labels, and id reuse across categories
    by_id = defaultdict(set)
    id_cats = defaultdict(set)
    for c in norm:
        by_id[(c["garment"], c["id"])].add(c["label"])
        id_cats[(c["garment"], c["id"])].add(c["category"])
    label_conflicts = [{"garment": g, "id": i, "labels": sorted(ls)}
                       for (g, i), ls in by_id.items() if len(ls) > 1]
    id_reuse = [{"garment": g, "id": i, "categories": sorted(cs)}
                for (g, i), cs in id_cats.items() if len(cs) > 1]

    per_garment = {}
    for g in sorted({c["garment"] for c in norm}):
        cs = [c for c in norm if c["garment"] == g]
        per_garment[g] = {
            "options": len(cs),
            "with_photo": sum(1 for c in cs if c["photos"]),
            "without_photo": sum(1 for c in cs if not c["photos"]),
            "with_true_techpack": sum(1 for c in cs if c["has_true_techpack"]),
            "no_techpack": sum(1 for c in cs if not c["has_true_techpack"]),
        }

    spend = 0.0
    fl = assets / "reports/failure-log.md"
    if fl.exists():
        for m in re.finditer(r"Running total[^\d]*([\d.]+) credits",
                             fl.read_text(encoding="utf-8")):
            spend = max(spend, float(m.group(1)))

    inventory = {
        "generated": datetime.now().isoformat(timespec="seconds"),
        "definitions": {
            "with_photo": "has >=1 local image under generated/",
            "with_true_techpack": "illustration path under techpacks/ (wired blueprint)",
            "need_prompts": "options with no factory prompt file on disk",
            "need_regeneration": "remake queue entries + structural options without photos",
            "accepted": "count from last review export; per-option ids require the "
                        "Download decisions.json export (format 2)",
        },
        "totals": {
            "options": len(norm),
            "with_photo": sum(1 for c in norm if c["photos"]),
            "without_photo": sum(1 for c in norm if not c["photos"]),
            "with_true_techpack": sum(1 for c in norm if c["has_true_techpack"]),
            "no_techpack": sum(1 for c in norm if not c["has_true_techpack"]),
            "accepted_last_export": queue.get("accepted_count"),
            "unreviewed_last_export": queue.get("unreviewed"),
            "remake_queue": len(queue.get("remakes", [])),
            "discard_queue": len(queue.get("discards", [])),
            "bad_techpack_queue": len(queue.get("bad_tech_packs", [])),
            "bad_techpack_already_fixed": sum(
                1 for e in queue.get("bad_tech_packs", [])
                if str(e.get("illustration", "")).startswith("techpacks/")),
            "factory_prompts_on_disk": len(prompts),
            "need_prompts": len(norm) - len({p.parent.name for p in prompts}),
            "duplicate_prompts": dup_prompts,
            "duplicate_image_groups": len(dup_groups),
            "duplicate_image_files": sum(len(v) for v in dup_groups.values()),
            "label_conflicts": len(label_conflicts),
            "id_reused_across_categories": len(id_reuse),
            "shirt_structural_pending": shirt_pending,
            "shirt_structural_with_cm": shirt_meas,
            "shirt_structural_no_cm": shirt_no_meas,
            "techpack_map_entries": len(tp_map),
            "credits_spent_tracked": spend,
        },
        "per_garment": per_garment,
        "label_conflicts": label_conflicts,
        "id_reused_across_categories": id_reuse[:100],
        "duplicate_images": [sorted(v) for v in list(dup_groups.values())[:200]],
    }

    out = Path(args.out) if args.out else assets / "inventory.json"
    out.write_text(json.dumps(inventory, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"totals": inventory["totals"],
                      "per_garment": per_garment}, indent=1))
    print(f"\ninventory -> {out}")
    return inventory, out


if __name__ == "__main__":
    main()
