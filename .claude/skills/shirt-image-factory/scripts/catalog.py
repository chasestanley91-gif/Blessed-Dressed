#!/usr/bin/env python3
"""Catalog dashboard and updater for the shirt image factory.

Usage:
    python catalog.py status <catalog.json>
    python catalog.py next   <catalog.json> [--limit 20] [--category lapel]
    python catalog.py set    <catalog.json> <product_code> [--status generated]
                             [--photo path] [--photo-annotated path] [--spec path]
                             [--qa path] [--kind structural|swatch] [--attempts N]
"""
import argparse
import json
import sys
from datetime import date
from pathlib import Path

STATUSES = ["pending", "generated", "approved", "needs-human",
            "skipped-swatch", "missing-illustration"]


def load(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def save(p, cat):
    Path(p).write_text(json.dumps(cat, indent=2, ensure_ascii=False), encoding="utf-8")


def cmd_status(cat):
    opts = cat["options"]
    print(f"Source: {cat.get('source')} | generated: {cat.get('generated')}")
    print(f"Total options: {len(opts)}\n")
    by_status = {}
    for o in opts:
        by_status[o["status"]] = by_status.get(o["status"], 0) + 1
    for s in STATUSES:
        if s in by_status:
            print(f"  {s:<22}{by_status[s]:>5}")
    for s, n in by_status.items():
        if s not in STATUSES:
            print(f"  {s:<22}{n:>5}")
    pending_structural = [o for o in opts
                          if o["kind"] == "structural" and o["status"] == "pending"]
    print(f"\nStructural photos still to generate: {len(pending_structural)}")
    cats = {}
    for o in pending_structural:
        cats[o["category_key"]] = cats.get(o["category_key"], 0) + 1
    for k in sorted(cats, key=cats.get, reverse=True):
        print(f"  {k:<42}{cats[k]:>4}")


def cmd_next(cat, limit, category):
    opts = [o for o in cat["options"]
            if o["kind"] == "structural" and o["status"] == "pending"
            and o.get("illustration")
            and (not category or o["category_key"] == category)]
    for o in opts[:limit]:
        print(f"{o['product_code']:<26} {o['option_label'][:60]:<62} {o['illustration']}")
    print(f"\n({min(limit, len(opts))} of {len(opts)} shown)")


def cmd_set(cat, path, args):
    for o in cat["options"]:
        if o["product_code"] == args.product_code:
            for field in ("status", "photo", "photo_annotated", "spec", "qa", "kind"):
                v = getattr(args, field.replace("-", "_"), None)
                if v is not None:
                    o[field] = v
            if args.attempts is not None:
                o["attempts"] = args.attempts
            o["updated"] = str(date.today())
            save(path, cat)
            print(f"updated {o['product_code']}: status={o['status']} "
                  f"photo={o['photo']} attempts={o['attempts']}")
            return
    sys.exit(f"product_code not found: {args.product_code}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s1 = sub.add_parser("status"); s1.add_argument("catalog")
    s2 = sub.add_parser("next"); s2.add_argument("catalog")
    s2.add_argument("--limit", type=int, default=20)
    s2.add_argument("--category", default=None)
    s3 = sub.add_parser("set"); s3.add_argument("catalog"); s3.add_argument("product_code")
    s3.add_argument("--status", choices=STATUSES, default=None)
    s3.add_argument("--photo", default=None)
    s3.add_argument("--photo-annotated", dest="photo_annotated", default=None)
    s3.add_argument("--spec", default=None)
    s3.add_argument("--qa", default=None)
    s3.add_argument("--kind", choices=["structural", "swatch"], default=None)
    s3.add_argument("--attempts", type=int, default=None)
    args = ap.parse_args()
    cat = load(args.catalog)
    if args.cmd == "status":
        cmd_status(cat)
    elif args.cmd == "next":
        cmd_next(cat, args.limit, args.category)
    else:
        cmd_set(cat, args.catalog, args)


if __name__ == "__main__":
    main()
