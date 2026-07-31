# Stage 2–3: Blueprint Reading, Geometry Spec, and Prompt Building

## Stage 2 — Read the blueprint like an engineer

Open the option's illustration (`shirt-assets/illustrations/<category>/<slug>.jpg`) with
vision and extract, in this order:

1. **Identity**: what garment part is this, viewed from which angle (front, back, 3/4, flat)?
2. **Silhouette geometry**: point/edge shapes, corner treatment (sharp, rounded — estimate
   radius relative to the part), curves and where they start/end.
3. **Counts**: buttons, buttonholes, stitch rows, pleats, splice pieces. Counts are the
   cheapest thing to verify and the most embarrassing to get wrong.
4. **Positions**: where each button sits relative to edges, buttonhole orientation
   (horizontal/vertical), stitch row offsets from edges, pocket placement.
5. **Stated measurements**: the option label often carries the number — "Fashion point in
   5.8cm" means the collar point length is 5.8 cm; "Placket width 3.5cm" is literal. Also read
   any dimension annotations drawn inside the illustration.
6. **Construction signals**: fused vs soft (drawn stiffness), top stitching vs clean edge,
   visible interlining lines, seam types.

If the illustration is ambiguous on a feature (e.g., you cannot tell if there are 1 or 2
stitch rows), zoom by cropping and re-reading before you guess. If still ambiguous, note it
in the spec as `"uncertain"` — do NOT silently pick one.

## Stage 3 — Build the engineering spec

Write `spec.json` in the option's photo folder before generating. Template:

```json
{
  "product_code": "lapel-02",
  "category_key": "lapel",
  "option_label": "Fashion point in 5.8cm",
  "view": "front, collar closed, top button fastened",
  "stated_measurements_cm": {"collar_point_length": 5.8},
  "geometry": {
    "point_shape": "straight-edged point, sharp tip, no rounding",
    "spread": "narrow-medium; points angle downward-inward",
    "stand": "standard height, one horizontal buttonhole on band",
    "stitching": "single edge stitch row ~3mm from collar edge, both leaves",
    "buttons": {"collar_band": 1, "collar_points": 0}
  },
  "ratios": [
    "collar point length (5.8cm) is slightly more than half the collar band height stacked twice — a shorter, modern point",
    "edge stitch offset is about 1/20 of point length",
    "tie space (gap between points at top) is roughly one button diameter"
  ],
  "locked_features": [
    "point length ratio", "spread angle", "stitch row count = 1",
    "band button count = 1", "buttonhole horizontal", "sharp uncurved point tips"
  ],
  "uncertain": []
}
```

Why ratios matter: the model cannot measure 5.8 cm, but it CAN render "point noticeably
shorter than a classic point collar, tip reaching about a third of the way down the placket's
first-button gap." Give it 2–4 ratios that pin the feature to visible neighbors (buttons,
band height, placket width). State the cm value too — it costs nothing and anchors the
annotated variant later.

**Comparative anchoring across a category**: when a category has graduated sizes (point in
5.8 / 7 / 8.5 / 9.5 cm), say so in the prompt: "this is the 7cm version — visibly longer than
a 5.8cm point, visibly shorter than an 8.5cm point." Relative statements are the strongest
proportion signal the model gets. Check the catalog for sibling options before writing the
spec.

## Stage 4 input — The prompt template

The prompt is a specification document, not a vibe. Assemble from these blocks, in order.
Replace bracketed parts from the spec. Keep the final prompt roughly 250–450 words — long
enough to eliminate ambiguity, short enough that every line carries weight.

```
BLUEPRINT CONTRACT
The attached illustration is a manufacturing tech pack for one construction detail of a
bespoke dress shirt. It is an engineering blueprint, not inspiration. Reproduce its exact
geometry as a real, sewn garment: every line, angle, corner radius, stitch row, seam,
button position and count. Do not redesign, improve, stylize, or reinterpret. A tailor
comparing your photograph to this drawing must find no geometric differences.

SUBJECT
[Category + option label, e.g. "Shirt collar: fashion point collar, point length 5.8 cm."]
[Geometry lines from spec — one sentence per locked feature.]
[Ratio lines from spec — the proportion anchors.]
[Comparative anchor line if the category has graduated sizes.]

GARMENT & MATERIAL
Premium bespoke dress shirt in [white cotton poplin unless the option dictates otherwise]:
smooth, fine, crisp weave with soft sheen; natural fabric behavior; clean press. Interlining
stiffness as the blueprint implies. No wrinkles or folds that hide or distort the detail.

PHOTOGRAPHY
Luxury ecommerce product photograph. The [collar/cuff/placket/...] is the hero, centered,
filling most of the frame, shown on an invisible-mannequin form (no body, no visible support).
Camera perfectly square to the detail, no perspective distortion, 100mm macro look, medium
format sharpness, edge-to-edge focus on the detail. Soft diffused studio lighting, neutral
white balance, seamless light-gray background, gentle contact shadow. Magazine quality.

FORBIDDEN
No extra buttons, buttonholes, stitch rows, seams, pockets, or trim not present in the
blueprint. No logos or text. No hands, hangers, props. No fabric pattern unless specified.
No artistic angles.
```

Model-specific note: with Nano Banana Pro (and most editors), an instruction phrased as
"turn this technical drawing into a photograph of the real sewn garment, preserving all
geometry" outperforms "generate a shirt that looks like this." Frame it as a faithful
*materialization* of the drawing.

## Fabric physics (when an option or the user specifies a fabric)

Swap into GARMENT & MATERIAL — geometry never changes, only surface behavior:

- **Poplin/broadcloth** — smooth tight plain weave, crisp, slight sheen, sharp press lines
- **Oxford** — visible basket weave texture, matte, slightly heavier drape
- **Royal oxford** — fine diamond micro-texture, dressy sheen
- **Twill** — fine diagonal rib lines, soft luster, fluid drape
- **Herringbone** — alternating chevron columns
- **End-on-end** — subtle heathered cross-color effect
- **Linen** — visible slubs, dry matte surface, relaxed micro-wrinkles (allowed ONLY away
  from the detail being showcased)
- **Chambray** — denim-like heather, matte
- **Flannel** — soft brushed nap, no sheen, rounded press edges

## Detail-type notes (apply the matching line to SUBJECT)

- **Collar ("lapel" category)**: state point length, spread, stand height, band button and
  buttonhole orientation, stitch offset. Shoot closed unless blueprint shows open.
- **Collar stand / stand height**: profile or 3/4 view so band height is legible; compare to
  button diameter ("band stands about 3.5 button-diameters tall" style anchors).
- **Placket / placket width / stitching**: straight-on front crop from collar band to third
  button; placket width anchored to button diameter (a 3.5cm placket ≈ 3 button widths).
- **Buttons / button position / first button distance / sewing style**: macro crop; thread
  pattern (cross / parallel / bird-foot) is the locked feature for sewing style.
- **Cuff / pleats / vent / tab**: show cuff closed around an invisible wrist form, vent and
  pleats visible; pleat COUNT and fold direction are locked.
- **Pocket / hem / yoke / back / epaulet / splicing / contrast**: straight-on view of the
  region; for contrast/splicing options the SECOND fabric's placement boundary is the locked
  feature — trace exactly where the blueprint places the contrast.
- **Stitch-color / thread-color variants of a structural option**: reuse the approved base
  photo's geometry description and change only the thread color line. Generate only if the
  user asks — these are usually `swatch` kind.
