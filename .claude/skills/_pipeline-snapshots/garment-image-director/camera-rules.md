# Camera rules — how each garment part is presented and framed

`resolveStyling()` + the `STYLE` table in `scripts/lib/camera.mjs` are the
source of truth. This documents the rules so they can be reviewed and tuned.
The goal: the photo frames the *one craft detail* the option is about, styled
the way a shirtmaker or tailor would present it, so the customer instantly
recognises it.

This is deliberately separate from tech-pack-interpreter's `part`
classification (`garment-taxonomy.md` there) — a part's construction facts
never change when its photography style is tuned, and this table can be
retuned without touching the interpreter at all.

## Resolution order

1. Canonical **part** from the persisted spec (`spec.part`, set by
   tech-pack-interpreter) — looked up in the `STYLE` table.
2. **Shape/flag overrides** refine the styling:
   - collar **tab** → silk necktie, tab fastened beneath the knot, **no jacket**.
   - collar **wing** → black-tie, **black bow tie**.
   - collar **button-down** → open collar, top button fastened, **no tie**.
   - collar (other point/spread/square) → silk necktie, neat four-in-hand knot.
   - shirt **French/double cuff** → closed with **cufflinks**.
   - shirt **barrel/button cuff** → closed with its **button(s)**.
   - jacket **lapel** → worn over white shirt + tie, jacket open enough to read
     the gorge and roll; **lapel dominates the frame**.

## Part → presentation / focus

| Part | Presented as | Focus on |
|---|---|---|
| shirt-collar | on a model, tight on collar+neckline | point geometry, stand, roll, stitch, tie knot |
| shirt-collar-stand | profile, macro on the band | stand height, band seam, interlining edge, topstitch |
| shirt-placket | vertical macro down the placket | placket width, button spacing, edge stitch, buttonholes |
| shirt-cuff | forearm raised, tight on cuff | cuff edge, closure, corner shape, topstitch |
| shirt-pocket | tight on left chest | pocket shape, pattern match, edge stitch |
| shirt-hem | untucked, on the shirttail | hem curve/shape, side gusset, rolled edge |
| jacket-lapel | model in jacket+shirt+tie, chest-up | width at widest point, peak/notch/shawl geometry, gorge, roll, edge stitch |
| jacket-lapel-buttonhole | macro on the buttonhole | Milanese/AMF stitch, thread, keyhole |
| jacket-chest-pocket | left breast | barchetta/welt shape, curve, pattern match |
| jacket-ticket-pocket | right hip | ticket pocket above the flap, welt alignment |
| jacket-pocket | on the hip pocket | jetted/flap/patch, welt, flap shape, pattern match |
| jacket-front / jacket-front-detail | jacket buttoned, on the front | button stance, front quarters, dart/quarter line, drape |
| jacket-sleeve / jacket-sleeve-vent | cuff presented | button count/spacing, kissing buttons, working buttonholes, vent |
| jacket-vent | rear three-quarter | none/single/double vent, length, back drape |
| jacket-canvas | cut-through / cross-section macro | fused/half/full floating canvas, chest+lapel roll |
| jacket-shoulder | on the shoulder/sleeve head | shoulder line, roping or shirt-sleeve pucker, padding |
| jacket-stitch | macro on the edge | pick/AMF stitch, pitch, thread |
| jacket-interior | jacket opened | lining coverage, facing, interior pockets, piping |
| trouser-front-pocket | hip framing | slant/on-seam/welt/jeans opening, angle, edge stitch |
| trouser-small-pocket | waist framing | watch/coin pocket placement, welt, size |
| trouser-pleat | waist-to-thigh | pleat/dart count & direction, depth, fall to the knee |
| trouser-fly | front waist close-up | zip/button fly, fly topstitch curve, closure |
| trouser-waistband | waist close-up | style/width, hook & button closure, side adjusters/belt loops/extended tab |
| trouser-back-pocket | rear framing | welt/button/flap style, count & placement, bartack |
| trouser-hem | ankle framing | plain vs turn-up, cuff depth, break, heel guard |
| trouser-leg | full-length | leg line (tapered/straight/wide), knee-to-hem taper |
| trouser-canvas | inner waistband macro | waistband canvas (fused/half/full), curtain |
| vest-front | waistcoat front, shirt+tie, no jacket | button stance (SB/DB, count), front drape, placket |
| vest-bottom | front hem | bottom shape (pointed/square/flat), hem points, lowest button |
| vest-lapel | neckline/lapel | neckline (V/U/notch), lapel width, gorge, edge |
| vest-chest-pocket / vest-pocket | on the pocket | welt/besom shape, angle, width, edge stitch |
| vest-back | rear view | back fabric/strap, adjuster buckle, belt width |
| vest-canvas | chest macro | full/half/unconstructed chest, chest roll |
| *-buttonhole / *-stitch / *-detail / generic-detail | macro on the named detail | the named construction detail |

### The waistband engineering families — luxury-watch macro framing

`trouser-waistband-width`, `trouser-extension-length`, `trouser-extension`,
`trouser-adjuster` and `trouser-belt-loops` get a materially different
treatment: the differentiating component (not the trousers) is the hero
subject, filling 40–60% of the frame — no knees, legs, model pose, jacket or
styling anywhere in shot. This is enforced in the prompt by `craftLock()` in
`lib/prompt.mjs` (the PRIMARY CRAFT / HARDWARE LOCK / SINGLE STATE / FLATNESS
blocks) — see `prompt-builder.md`.

### Finishing details (`fin-*`) — shared across every garment

Every finishing option gets its own camera profile
(`fin-thread-color`, `fin-stitch`, `fin-buttonhole`, `fin-button`,
`fin-contrast`, `fin-cutout`, `fin-lining`, `fin-label`, `fin-piping`,
`fin-dart`, `fin-interlining`, `fin-splice`, `fin-patch`, `fin-epaulet`,
`fin-gusset`, `fin-canvas`, `fin-yoke`, `fin-pleat-detail`, `fin-bias`,
`fin-tab`, `fin-adjust`) — product-agnostic, since the garment noun in the
spec supplies the context.

A part that matches nothing falls through to a **construction macro**
(`generic-detail`): the correct garment, the spec restated, the blueprint
lock, a clean studio macro of the named detail — a safe default that never
contradicts the drawing.

## Tuning

Edit the `STYLE` entries or the override branches in `resolveStyling()` and
re-run `build_prompt.mjs` on an affected option to see the new wording. Keep
focus lists short and concrete (what the lens should resolve), not
adjectives. If tech-pack-interpreter adds a new `part`, add its row here too —
an unhandled part silently falls back to `generic-detail`'s framing, which
usually under-serves it.
