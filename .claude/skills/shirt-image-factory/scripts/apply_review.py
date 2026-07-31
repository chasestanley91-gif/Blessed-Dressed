#!/usr/bin/env python3
"""Turn exported review decisions into a remake queue the generation pipeline can run. (v3)

Usage:
    python apply_review.py <site_root> <decisions.json> [--out <path>]

Reads the embedded card map inside public/images/review.html (role-based schema built by
build_review.mjs: cards keyed garment|fieldId|id, images[] carrying roles) and the user's
exported decisions. Accepts three export formats:

  format 3 (current)  rows carry garment+fieldId+id -> exact card; also image_keeps /
                      image_rejects per-image verdicts, which are resolved and stored.
  format 2 (legacy)   rows carry garment+category+id; category matched against fieldId,
                      otherwise the decision fans out to every card sharing garment+id.
  format 1 / legacy   no category: fans out to every card sharing garment+id (notes
                      merged), since shared option sets reuse ids across fields.

Queue entries keep the fields the generation pipeline already consumes (garment,
category, id, label, note, illustration, photos, fanned_out, status) — category now
equals the card's fieldId, illustration is the wired techpack (found via role/aka even
when hash-merged), photos are the generated-role images.

Writes <site_root>/public/images/review-remake-queue.json (or --out) with remakes /
discards / bad_tech_packs / image_keeps / image_rejects. Nothing else in the site is
modified — discards and photo swaps still require the user's explicit approval.
"""
import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path


def load_review_data(site: Path):
    html = (site / "public" / "images" / "review.html").read_text(encoding="utf-8")
    m = re.search(r"const DATA = (\{.*?\});\n(?:const LS|let state)", html, re.S)
    if not m:
        sys.exit("could not find embedded DATA in review.html — rebuild with build_review.mjs")
    return json.loads(m.group(1))


def techpack_of(card):
    """Wired blueprint path — checks aka[] too (identical files get hash-merged)."""
    for i in card.get("images", []):
        paths = [str(i.get("src", ""))] + [str(a) for a in i.get("aka") or []]
        for p in paths:
            if p.startswith("techpacks/"):
                return p
    for i in card.get("images", []):
        if "techpack" in (i.get("roles") or []):
            return str(i.get("src"))
    return None


def photos_of(card):
    return [str(i["src"]) for i in card.get("images", [])
            if not i.get("remote") and "generated" in (i.get("roles") or [])]


def normalize_cards(data):
    """Support both the role-based schema and the old photos[]/illustration one."""
    out = []
    for c in data["cards"]:
        if "images" in c:
            out.append({
                "key": c.get("key") or f'{c["garment"]}|{c["fieldId"]}|{c["id"]}',
                "garment": c["garment"], "fieldId": c.get("fieldId", "misc"),
                "id": c["id"], "label": c.get("label", ""),
                "illustration": techpack_of(c), "photos": photos_of(c),
            })
        else:  # old schema — keep working if pointed at an old page
            g = c.get("garments", ["?"])[0]
            out.append({
                "key": f'{g}|{c.get("category", "misc")}|{c["id"]}',
                "garment": g, "fieldId": c.get("category", "misc"),
                "id": c["id"], "label": c.get("label", ""),
                "illustration": c.get("illustration"), "photos": c.get("photos") or [],
            })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site_root")
    ap.add_argument("decisions")
    ap.add_argument("--out", default=None,
                    help="write queue here instead of review-remake-queue.json")
    args = ap.parse_args()
    site = Path(args.site_root)
    cards = normalize_cards(load_review_data(site))
    decisions = json.loads(Path(args.decisions).read_text(encoding="utf-8"))

    by_gfi, by_gi, by_id = {}, {}, {}
    for c in cards:
        by_gfi[(c["garment"], c["fieldId"], c["id"])] = c
        by_gi.setdefault((c["garment"], c["id"]), []).append(c)
        by_id.setdefault(c["id"], []).append(c)

    missing = []

    def targets_for(r):
        fid = r.get("fieldId") or r.get("category")
        if fid and (r.get("garment"), fid, r["id"]) in by_gfi:
            return [by_gfi[(r["garment"], fid, r["id"])]]
        if (r.get("garment"), r["id"]) in by_gi:
            return by_gi[(r["garment"], r["id"])]
        return by_id.get(r["id"], [])

    def resolve(rows):
        hits = {}  # card key -> entry (notes merged)
        for r in rows:
            targets = targets_for(r)
            if not targets:
                missing.append(r["id"])
                continue
            for c in targets:
                if c["key"] not in hits:
                    hits[c["key"]] = {
                        "garment": c["garment"], "category": c["fieldId"],
                        "id": c["id"], "label": c["label"],
                        "note": r.get("note", ""),
                        "illustration": c["illustration"],
                        "photos": c["photos"],
                        "fanned_out": len(targets) > 1,
                        "status": "queued",
                    }
                else:
                    n = r.get("note", "")
                    if n and n not in hits[c["key"]]["note"]:
                        hits[c["key"]]["note"] = \
                            (hits[c["key"]]["note"] + " | " + n).strip(" |")
        return list(hits.values())

    def resolve_image_rows(rows):
        out = []
        for r in rows:
            targets = targets_for(r)
            out.append({
                "card": targets[0]["key"] if targets else None,
                "garment": r.get("garment"), "fieldId": r.get("fieldId"),
                "id": r["id"], "src": r.get("src"), "roles": r.get("roles", []),
            })
            if not targets:
                missing.append(r["id"])
        return out

    queue = resolve(decisions.get("remakes", []))
    discards = resolve(decisions.get("discards", []))
    bad_tps = resolve(decisions.get("bad_tech_packs", []))
    keeps = resolve_image_rows(decisions.get("image_keeps", []))
    rejects = resolve_image_rows(decisions.get("image_rejects", []))

    out = {
        "created": datetime.now().isoformat(timespec="seconds"),
        "source_export": decisions.get("exported"),
        "format": decisions.get("format", 1),
        "accepted_count": decisions.get("accepted_count", 0),
        "accepted_keys": decisions.get("accepted_keys",
                                       decisions.get("accepted_ids", [])),
        "unreviewed": decisions.get("unreviewed"),
        "remakes": queue,
        "discards": discards,          # needs user's OK before touching site data
        "bad_tech_packs": bad_tps,     # needs a true blueprint sourced/wired
        "image_keeps": keeps,          # per-image verdicts (format 3)
        "image_rejects": rejects,
    }
    out_path = Path(args.out) if args.out \
        else site / "public" / "images" / "review-remake-queue.json"
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"accepted: {out['accepted_count']}  |  remakes: {len(queue)}  |  "
          f"discards: {len(discards)}  |  bad tech packs: {len(bad_tps)}  |  "
          f"image verdicts: {len(keeps)} keep / {len(rejects)} reject  |  "
          f"unreviewed: {out.get('unreviewed')}")
    by_cat = {}
    for q in queue:
        k = f"{q['garment']}/{q['category']}"
        by_cat[k] = by_cat.get(k, 0) + 1
    for k in sorted(by_cat, key=by_cat.get, reverse=True):
        print(f"  remake {k:<40}{by_cat[k]:>4}")
    if missing:
        print(f"! {len(missing)} decision ids not found: {sorted(set(missing))[:10]}")
    print(f"queue -> {out_path}")


if __name__ == "__main__":
    main()
