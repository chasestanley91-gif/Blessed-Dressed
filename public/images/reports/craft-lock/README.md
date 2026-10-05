# Craft identity lock

Built 2026-09-16T06:33:58.777Z.

This folder is the permanent record of every builder craft option and its
illustration. Do not delete it. Matching by a short option id such as
`stitch-06-top` is forbidden — that id used to mean collar stitching AND cuff
stitching AND placket stitching.

## Identity

`product|section|field|optionId`

Example after the rename:

- `shirt|collar|decoration_stitching_on_collar|collar-stitch-06-top`
- `shirt|cuffs|decoration_stitching_on_cuff|cuff-stitch-06-top`

## Files

- `canonical-craft-lock.json` — every craft, former ids, BXN field/value, illustration path
- `graph.html` — searchable map
- `id-remap.json` — old id → location-tied id
- `collisions.json` — what was crossed up

## Commands

```
node tools/lock_craft_identities.mjs
node tools/inspect_craft_lock.mjs --craft=collar-stitch-06-top
```
