# Craft Specification Standard

This document defines the written-spec-first system for Blessed & Dressed tailoring.
It is the formal contract between the catalog, `tech-pack-interpreter`, and
`garment-image-director`.

The key principle is simple:

1. `spec.json` is the primary source of truth.
2. The catalog metadata and extracted specification are authoritative for
definition, measurement, count, angle, and construction detail.
3. The tech-pack illustration is a visual reference only: it identifies the
   option, confirms orientation, and anchors visible feature presence, but it
   does not override explicit written spec values.

This standard exists to prevent the failure mode where a plausible-looking
“generic” photograph or a drawing-based interpretation replaces an intentional
craft option.

## Hierarchy of truth

When the pipeline decides what the final garment should look like, the
following precedence applies:

1. `spec.json` — the written, persisted garment specification produced by
   `tech-pack-interpreter`.
2. Catalog metadata — the option label, description, hint text, field and
   section definitions, and any explicit counts or measurements in the
   source JSON.
3. Tech-pack illustration — the visual engineering reference for the exact
   option, orientation, and visible shape.
4. Tailoring conventions — standard menswear knowledge only fills gaps when
   the first three sources are silent.

If an explicit measurement, count, angle, shape, or construction detail appears
in `spec.json` or the catalog metadata, that value must be used, even if the
drawing appears slightly different.

The illustration remains critical, but its role is not to correct or replace a
defined spec. It is the gatekeeper for the option identity and orientation,
not the fallback authority for values already captured in the spec.

## What `spec.json` must capture

The garment spec is a structured engineering profile, not a prose description.
It must include:

- `addr` — the option address (`productId > sectionId > fieldId > optionId`).
- `garment.noun` — the correct garment noun for the part being rendered.
- `garment.fabric` — the cloth or material family, where available.
- `measured.dimensions` — every explicit length, width, height, spread, depth,
  and other geometry values named by the source text.
- `measured.angles` — lapel roll, collar spread, vent angle, pleat angle,
  intersection angles, and any other orientation measures.
- `measured.counts` — exact numbers of buttons, buttonholes, pleats, belt loops,
  hooks, studs, etc.
- `measured.shapes` — the extracted shape vocabulary for collars, lapels,
  cuffs, pockets, vents, pleats, and other part geometries.
- `measured.flags` — construction details such as stitch type, lining finish,
  edge treatment, canvas structure, and similar discrete craftsmanship
  indicators.
- `view.orientation` — the observed face of the garment (`front`, `back`,
  `side`, `detail`, `interior`).
- `forbidden[]` — option isolation, absence enforcement, orientation constraints,
  and any explicit disallowed substitutions.

`garment-image-director` and `garment-image-qc` must treat this file as the
single source of engineering truth for generation and approval.

## Part-specific systems

### Collar system

A collar spec should describe:

- `type` — e.g. `point`, `spread`, `cutaway`, `club`, `hidden button`,
  `button-down`, `mandarin`.
- `stand.height` — the vertical rise of the collar band.
- `spread` — the distance between collar points or edges.
- `point.length` — the length of the collar points when named explicitly.
- `shape` — `rounded`, `square`, `angled`, `rolled`, etc.
- `closure` — whether the collar is open, hidden-buttoned, or has a tab.
- `material` — if the collar is in contrast cloth or has a separate undercollar.

If an option label or description defines a feature such as “hidden button” or
“70° point”, the prompt must restate it exactly.

### Placket system

A placket spec should describe:

- `type` — `standard`, `covered`, `hidden`, `one-piece`, `French`, `cuban`.
- `width` — if the text provides a dimension.
- `edge.treatment` — if topstitching, piping, or folded construction is called out.
- `buttonhole.count` — exact count when named.
- `buttonhole.orientation` — horizontal, vertical, diagonal.

A placket is never allowed to be treated as a generic shirt closure if the
written option is more specific.

### Cuff system

A cuff spec should describe:

- `type` — `barrel`, `French`, `rounded`, `angled`, `mitered`, `convertible`.
- `button.count` — exact count, including the number of cuff buttons vs.
  gauntlet buttons.
- `closure` — `button`, `french-cuff`, `single-button`, `double-button`.
- `edge` — `straight`, `rounded`, `mitered`, `bavette`.

The visual illustration may confirm the cuff shape and position, but the
written spec is authoritative for the exact closure and button count.

### Lapel system

A lapel spec should describe:

- `type` — `notch`, `peak`, `shawl`, `flat`, `double forward`.
- `width` — if named; otherwise the model must not invent a generic width.
- `roll` — `high`, `medium`, `low`, or a specific angle if provided.
- `points` — exact counts and positions for buttonholes, browsing loops, or
  lapel tabs.
- `edge` — `piped`, `notched`, `clean`, `knife-edge`.

If the option is a lapel variation, the prompt must include the exact variant
(`45° notch`, `3L-1R`, `extreme point`, etc.) rather than a broad category.

### Trouser and waistband system

A trouser spec should describe:

- `waistband.type` — `standard`, `extended`, `side adjuster`, `belt-loops`.
- `waistband.width` — exact width when given.
- `closure` — `hook-and-bar`, `button`, `zipper`, `adjuster`, plus `hook` count.
- `front` — `flat`, `pleated`, `single-pleat`, `double-pleat`.
- `pocket` — `slanted`, `jetted`, `welt`, `coin pocket`.
- `rise` — if specified in the source text.

Count and closure detail are always more authoritative than a generic trouser
category.

### Interlining and construction effect

Interlining is one of the most misunderstood components in tailoring. It is
a hidden structural layer placed between the outer cloth and the interior
facing, and it directly affects fit, drape, shape retention, roll, comfort,
balance, and perceived body proportions.

For shirts:

Outer Fabric

↓

Interlining

↓

Inner Fabric

For jackets:

Outer Cloth

↓

Canvas / Interlining

↓

Body Lining

Think of interlining as the garment's skeleton; the fabric is the skin.

A collar with the same dimensions will behave differently depending on its
interlining. A 40 cm collar with soft interlining will feel and look softer
than a 40 cm collar with hard interlining, even though the actual measurement
remains 40 cm.

A spec must capture this influence when the option is about internal structure
or finish:

- `canvas` — `full`, `half`, `quarter`, `floating`, `no canvas`.
- `padding` — `structured`, `soft`, `suspended`, `natural shoulder`.
- `lapel.fusing` — `soft`, `medium`, `hard`.
- `interlining` — `soft`, `normal`, `hard`, `hard FC390057`.
- `interior.finish` — `half-lined`, `fully-lined`, `unlined`, `contrast lining`.

These are construction decisions, not decorative details. They must be carried
through as explicit spec flags and may affect the prompt emphasis and QC
checklist.

#### Interlining behavior categories

- **Soft interlining**
  - Collapses easier, conforms to the body, and follows movement.
  - Visual effect: natural roll, slightly drooping collar points, softer
    appearance.
  - Fit effect: may feel larger than measured because it molds around the neck.

- **Normal interlining**
  - Balanced support and controlled roll.
  - Visual effect: moderate structure, predictable shape retention.
  - Fit effect: true-to-measure comfort for most MTM and business shirt orders.

- **Hard interlining**
  - Maintains shape, resists bending, and provides strong support.
  - Visual effect: sharp edges, crisp points, rigid spread.
  - Fit effect: may feel smaller than measured because it fights body contours.

- **Hard FC390057**
  - Maximum rigidity and strong point memory.
  - Visual effect: architectural collar with minimal change through wear.
  - Fit effect: maintains drafted angles and height most closely.

#### Interlining and appearance

- Soft interlining tends to reduce visible collar spread by 3–8° under gravity.
- Hard interlining keeps spread closer to the drafted angle.
- Soft stands appear lower and more conforming; hard stands preserve visual
  height.
- Soft cuffs drape gently; hard cuffs maintain geometric shape and a more formal
  appearance.

#### Jacket interlining / canvas effects

- **Fused construction** provides surface stability, sharper initial shape,
  and a flatter appearance. It is less dynamic in movement.
- **Half canvas** shapes itself to the wearer over time, creating a more natural
  chest and waist transition with three-dimensional drape.
- **Full canvas** is the most adaptive and expensive option, allowing cloth to
  move independently of the body and producing the deepest, most natural drape.

#### Lapel roll and body shape compensation

- Interlining largely determines lapel behavior: soft canvas yields smooth roll
  and softer peak projection, while firm canvas preserves a straighter edge and
  stronger chest line.
- Tailors use interlining to compensate body shape. Harder chest canvas,
  structured shoulders, and strong collars can broaden a thin client. Softer
  structure helps a larger client achieve cleaner drape and reduced bulk.

#### Relative fit impact

If impact is rated from 1–10:

- Body Measurements = 10/10
- Pattern Drafting = 9/10
- Ease Distribution = 8/10
- Shoulder Structure = 8/10
- Interlining Choice = 7/10
- Fabric Weight = 6/10

Interlining does not change the actual drafted measurement, but it changes how
the garment occupies space, follows anatomy, maintains style angles, and how
"fitted" it appears.

## What the illustration is for

The drawing is the visual reference that answers:

- Which exact option is this?
- Which face or view is shown?
- What visible feature set should appear?
- What relative positioning and proportions the option uses?

It is not an invitation to substitute a different option, invent a generic
version, or correct an explicitly defined spec detail.

The illustration also defines the orientation lock: if `spec.json` says
`view.orientation: back`, the final image must show the back face regardless of
whether the drawing appears to show an alternate detail on the front.

## Pipeline contract

`tech-pack-interpreter` must:

- read the catalog metadata and extract a precise structured spec;
- inspect the illustration and confirm orientation;
- write `spec.json` into `.craft-pipeline/<productId>/<optionId>/`;
- compute the `forbidden[]` constraints needed to enforce option isolation,
  orientation lock, and absence states.

`garment-image-director` must:

- read `spec.json` rather than re-derive values from the catalog text or the
  illustration;
- restate every extracted token in the locked prompt;
- attach the illustration as a hard reference;
- preserve the spec-first rule in the prompt's BLUEPRINT LOCK block;
- never edit the prompt by hand to “save” a missing value.

`garment-image-qc` must:

- compare the generated candidate to the same illustration;
- use the same spec-first hierarchy when resolving conflicts in the final
  verdict;
- reject any image that obeys the drawing but violates the written spec.

## Example rule

If a collar option is labeled “point-70 hidden button” and the drawing appears
slightly shorter than 70°, the spec value wins: the generated photograph must
show the hidden button collar with a 70° point, not a generic point collar.

If a waistcoat option's label states “5-button” and the illustration is a loose
hand sketch showing 4 buttons, the image must still show exactly five buttons.
The drawing can confirm the button placement and orientation, but it does not
change the required count.

## Recommended workflow

1. Produce the `spec.json` first with `tech-pack-interpreter`.
2. Review the spec file and ensure all explicit values from the catalog are
   present.
3. Build the locked prompt with `garment-image-director`.
4. Validate the prompt and generate the candidate image.
5. Let `garment-image-qc` assess the candidate against the illustration and the
   spec.

This is the standard that keeps the tailoring pipeline deterministic,
verifiable, and aligned with the catalog's actual intent.
