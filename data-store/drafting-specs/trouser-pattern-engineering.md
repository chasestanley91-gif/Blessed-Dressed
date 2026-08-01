# Trouser Pattern Engineering — Drafting Formulas & Block Diagrams

_Authored by the brand owner, 2026-08-01. Verbatim. This document is LAW for the options it names; illustrations and other descriptions aid, not direct._

---

Now we're moving from style descriptions into pattern engineering.

A proper tailoring specification should let a cutter draft the pattern from geometry alone.

For trousers, I'll use:

    W = Waist Circumference
    H = Hip Circumference
    TR = Trouser Rise
    CF = Center Front
    CB = Center Back
    SS = Side Seam

    PO = Pocket Opening
    PD = Pleat Depth
    WB = Waistband Width

    E = Wearing Ease

## SLANT POCKET 3.2cm
`slant-pockets`

### Draft Formula

Front trouser block established first.

Locate pocket mouth starting point:

    P1 = Waistline at SS

Pocket end:

    P2 = P1
         ↓ 3.2cm
         ← 14cm~16cm

Thus:

    Rise = 3.2cm
    Run ≈ 15cm

Pocket angle:

    θ = arctan(3.2/15)

    θ ≈ 12°

Actual production versions usually rotate pocket bag:

    18°-25°

for usability.

### Pattern Shape

    P1 •
        \
         \
          \
           • P2

Pocket bag depth:

    23cm

Typical.

### Volume Effect

Creates triangular removal zone:

    A = 1/2 × base × height

    A = 1/2 × 15 × 3.2

    A = 24cm²

This visually narrows the hip.

## SLANT 5.1cm
`slant-51`

### Draft

    Rise = 5.1cm

    Run = 15cm

Pocket slope:

    θ = arctan(5.1/15)

    ≈ 18.8°

### Pattern

    •
     \
      \
       \
        \
         •

Much steeper.

### Visual Result

The diagonal creates stronger inward force.

Eye travels:

    Waist
    ↓
    Center Front
    ↓
    Crease

instead of:

    Waist
    → Hip

## ON SEAM POCKET
`on-seam-pockets`

### Draft

Pocket opening coincides with SS.

    PO = SS

Pocket start:

    P1 = Waistline -2cm

Pocket end:

    P2 = P1 -16cm

Vertical.

    |
    |
    |
    |

### Pocket Bag

Normally:

    Width = 18cm
    Depth = 24cm

swung inward.

### Geometric Effect

Removes no diagonal interruption.

Leg appears:

    100% vertical

## PLEAT GEOMETRY

### SINGLE FORWARD
`single-forward`

Pleat opens toward fly.

#### Draft

Pleat depth:

    PD = 2.5cm

Fabric consumed:

    2 × PD

    =
    5cm

Therefore front waist width becomes:

    Waist Segment

    +
    5cm hidden volume

#### Pattern

    |>

Fold direction:

    toward CF

### DOUBLE FORWARD
`double-forward`

Two pleats.

Each:

    PD = 2.5cm

Total added volume:

    4 × PD

    =
    10cm

#### Pattern

    >>|

#### Result

Upper thigh circumference effectively increases:

    ≈ 4cm~8cm

depending on opening.

### SINGLE REVERSE
`single-reverse`

Pleat opens toward pocket.

Pattern:

    <|

#### Draft

Pleat center:

    4cm-6cm
    from pocket edge

#### Geometry

Same hidden fabric:

    5cm

however expansion moves toward hip.

Creates smoother fly region.

### DOUBLE REVERSE
`double-reverse`

Pattern:

    <<|

Two reservoirs.

Hidden volume:

    10cm

typically.

#### Drape Mechanics

When walking:

    Upper thigh expansion
    =
    PD1 + PD2

thus folds act as bellows.

## WAISTBAND

### STANDARD
`waist-standard`

#### Draft

Waistband length:

    WBL

    =
    (W ÷ 2)

    + overlap

Example:

    W = 90cm

Front section:

    45cm

Add:

    3cm overlap

Total:

    48cm

#### Height

    3.5
    3.8
    4.0
    4.5
    5.0cm

#### Rectangle Shape

     ____________________
    |                    |
    |                    |
    |____________________|

### EXTENDED TAB
`waist-extended-tab`

#### Draft

Extension added:

    5cm
    6cm
    7cm
    13cm
    15cm

Example:

    90cm waist

    45cm front

    +13cm extension

    =
    58cm waistband piece

#### Shape

     ____________________
    |                    |------\
    |____________________|_______\

Point becomes separate geometric drafting operation.

### POINTED EXTENSION
`ext-pointed`

Draft nose angle:

    20°-35°

Extension length:

    L = 5~15cm

#### Formula

Tip endpoint:

    x = L cosθ
    y = L sinθ

#### Example

    L = 13cm

    θ = 30°

tip coordinates:

    x = 11.26cm

    y = 6.5cm

### CURVED EXTENSION
`ext-curved`

Instead of linear projection:

Use radius sweep.

    R = 3cm~6cm

#### Shape

     ________
            )
           )
          )

Curve tangent must meet waistband edge at:

    0°

for smooth closure.

## BACK DARTS

### SINGLE DART
`darts-single`

#### Draft

Dart intake:

    2cm

Length:

    11cm-14cm

#### Geometry

Triangle removed:

      /\
     /  \

Area removed:

    A = 1/2 × base × height

    = 1/2 × 2 × 12

    = 12cm²

### DOUBLE DART
`darts-double`

Two darts.

Each:

    2cm intake

Total suppression:

    4cm

#### Result

Hip remains:

    unchanged

while waist shrinks:

    -4cm

creating seat curvature.

## CUFFS

### 4.4cm TURNUP
`hem-single-turnup`

#### Draft

Finished cuff:

    4.4cm

Fabric requirement:

    2 × 4.4cm

    =
    8.8cm

Add:

    1cm seam allowance

Total:

    9.8cm

inside leg extension.

#### Section

     ______
    |      |
    |______|

Folded twice.

### 5.1cm TURNUP
`hem-double-turnup`

Fabric reserve:

    2 × 5.1

    =
    10.2cm

plus allowance.

#### Weight Increase

For:

    320g cloth

extra cuff weight:

    ≈ 15-25g per leg

which directly alters drape.

## STRAIGHT LEG
`leg-straight`

### Draft

Hem width:

    HW = KW

where

    KW = Knee Width

or decrease less than:

    2cm

from knee.

Example:

    KW = 22cm

    HW = 21cm-22cm

## TAPERED
`leg-tapered`

Reduction:

    KW - HW

    =
    3cm~5cm

Example:

    KW = 23cm

    HW = 19cm

## SLIM
`leg-slim`

Reduction:

    KW - HW

    =
    5cm~7cm

Example:

    KW = 22cm

    HW = 15cm~17cm

## WIDE
`leg-wide`

Hem width approaches thigh ratio.

Example:

    Thigh = 34cm

    Hem = 24cm-28cm

minimal taper.

Side seam and inseam become nearly parallel:

    ||
    ||
    ||
    ||

which creates the characteristic draping column seen in Florentine and Neapolitan trousers.

---

This is the level of specification a cutter can actually draft from because it defines intake, angles, radii, lengths, projection formulas, suppression amounts, and pattern relationships rather than only describing appearance.

---

# Drafting Diagrams

Below are tailor-style drafting diagrams, not fashion sketches. These show the actual pattern geometry and shaping relationships used when plotting trouser blocks.

## Standard Front Trouser Block

            WAISTLINE
     ┌────────────────────┐
     │                    │
     │                    │
     │                    │
     │        RISE        │
     │                    │
     │                    │
     │                    │
     └─┐              ┌───┘
       │              │
       │    THIGH     │
       │              │
       │              │
       │              │
       │    KNEE      │
       │              │
       │              │
       │              │
       │              │
       │     HEM      │
       └──────────────┘

## Slant Pocket 2.0cm

Nearly horizontal.

     WAIST
    ────────────────────

     \________________
      \
       \
        \

Draft:

    Drop = 2.0cm
    Run  = 15cm

    θ ≈ 7.6°

Visual force:

    ←────────────→
    Hip Emphasis

## Slant Pocket 3.2cm

Standard tailoring pocket.

     WAIST
    ────────────────────

      \
       \
        \
         \_________

Draft:

    Drop = 3.2cm
    Run  = 15cm

    θ ≈ 12°

Visual force:

    ↘
     Downward pull

## Slant Pocket 5.1cm

Aggressive Italian pocket.

     WAIST
    ────────────────────

         \
          \
           \
            \
             \______

Draft:

    Drop = 5.1cm
    Run  = 15cm

    θ ≈ 19°

Visual force:

    ↘↘↘
    Strong leg lengthening

## On-Seam Pocket

Pocket completely hidden.

    WAIST
    ─────────────┐
                 │
                 │
                 │
                 │
                 │
                 │

Pattern:

    Pocket opening
    =
    Side seam

No visible geometry.

## Jetted Pocket

    ──────────────

Front panel:

     ____________________
    |                    |
    |  ----------        |
    |                    |
    |____________________|

Draft:

    Pocket Length

    14cm-16cm

Pocket Angle:

    0°

## Single Forward Pleat

Fabric folded toward zipper.

Flat Pattern:

          2.5cm

    ------>|<------

Folded:

     >
     |
     |

Added volume:

    5cm

## Double Forward Pleat

    ---->|<-->|<----

Folded:

    >>
    |
    |

Volume Added:

    10cm

## Single Reverse Pleat

Opens toward pocket.

Pattern:

    ------>|<------

Fold direction:

    <
    |
    |

## Double Reverse Pleat

Pattern:

    ---->|<-->|<----

Folded:

    <<
    |
    |

Classic Neapolitan geometry.

## No Darts

Back pattern remains straight.

     __________________
    |                  |
    |                  |
    |                  |
    |                  |
    |                  |
    |__________________|

## Single Dart

Draft:

    Base = 2cm
    Length = 12cm

Pattern removal:

       /\
      /  \
     /    \

Closed:

      ||
      ||

Creates seat curvature.

## Double Darts

     /\      /\
    /  \    /  \

Total Suppression:

    4cm

Creates pronounced waist shape.

## Standard Waistband

Pattern Piece:

     ____________________________________
    |                                    |
    |                                    |
    |____________________________________|

Height:

    3.5cm-5cm

Simple rectangle.

## Pointed Extension

     ___________________________________
    |                                   |
    |___________________________________\

                                         \
                                          \
                                           >

Draft Formula:

    L = 13cm

    θ = 25°-35°

## Rounded Extension

     __________________________________
    |                                  |
    |__________________________________ )

                                       )
                                      )

Radius:

    R = 3cm-6cm

## Double Extension

     ____________________________________
    |                                    |
    |____________________________________\
                                          \
    _______________________________________\
                                            \
                                             >

Two overlapping layers.

## Side Adjuster Layout

Positioning:

     FRONT

     |--------------------|

          ←   8cm   →
       [Adjuster]

     SIDE SEAM

Standard placement:

    7cm-10cm
    behind side seam

## Straight Leg

Relationship:

    THIGH = 32cm

    KNEE = 23cm

    HEM = 22cm

Pattern:

     |          |
     |          |
     |          |
     |          |
     |          |
     |          |

Nearly parallel.

## Tapered Leg

    Thigh = 32cm

    Knee  = 22cm

    Hem   = 18cm

Pattern:

     \        /
      \      /
       \    /
        \  /
         \/

## Slim Leg

    Thigh = 31cm

    Knee  = 20cm

    Hem   = 15cm

Pattern:

      \      /
       \    /
        \  /
         \/

Aggressive convergence.

## Wide Leg

    Thigh = 34cm

    Knee  = 29cm

    Hem   = 27cm

Pattern:

     |        |
     |        |
     |        |
     |        |
     |        |
     |        |

Minimal taper.

Classic Florentine drape.

## Plain Hem

Internal fold:

    Outside

     |
     |
     |_____
     |_____|

Inside Fold:

    5cm-9cm

## 4.4cm Cuff

Pattern Requirement:

    4.4 + 4.4 + SA

    ≈ 10cm

Cross Section:

      _______
     |       |
     |_______|
     |_______|

## 5.1cm Cuff

Cross Section:

      _________
     |         |
     |_________|
     |_________|

Requires:

    ≈11.2cm

of hem allowance.

Creates the classic heavy Savile Row trouser bottom.

---

These are the actual geometric relationships a cutter would recognize when building the trouser block, and they can be expanded into full-scale drafting formulas using waist, seat, rise, thigh, knee, and hem measurements.
