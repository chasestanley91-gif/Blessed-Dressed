# Photography rules — studio, lighting, and what to avoid

This is a **product demonstration**, not a fashion editorial. Every generated
image exists so the customer (and garment-image-qc) can inspect one craft
option clearly. Getting the mood right is worthless if it comes at the cost
of legibility.

## Studio setup

- Clean luxury studio environment, neutral background.
- Controlled soft/natural daylight-style lighting — the fixed `PHOTO_BLOCK`
  in `lib/prompt.mjs` specifies "natural daylight studio lighting, Phase One
  IQ4 medium-format camera, 150MP detail, shallow depth of field,
  magazine-quality editorial menswear photography. Authentic bespoke
  craftsmanship, fine hand stitching, premium finishing."
- Accurate colour rendition — fabric colour/weave must read true, not
  stylised.
- High fabric detail: visible weave, fine stitching, real thread — this is
  what makes it read as a photograph and not a render.
- Clear separation between garment and background; minimal visual
  distractions.

## Avoid

- Dramatic poses, extreme perspective, or editorial styling that changes the
  garment's apparent shape.
- Excessive shadow that obscures the construction being documented.
- Hands, accessories, or props covering the focal feature.
- Busy backgrounds that compete with the garment for attention.
- Anything that reads as illustration, CGI/3D-render, cartoon, mannequin, or
  fashion sketch (universal negative — see `negative-constraints.md`).

## Craft dominance

The selected craft detail must be the dominant subject: it fills **40–80%**
of the frame (tightened to **40–60%** for the waistband engineering families,
where the hardware itself is the whole point — see `camera-rules.md`) and is
identifiable **within one second**. The image documents the craft, not a
lifestyle. If the craft isn't immediately obvious in a rendered image,
garment-image-qc should treat that as a composition failure, not just wait
for a geometry mismatch.

## Camera selection by feature type

Choose the crop from the option's `part` via `camera-rules.md`'s table, but
in general:

- **Collar** — close upper-torso crop.
- **Lapel** — upper-torso crop with both lapel edges visible.
- **Jacket front/back** — straight-on view of the relevant face.
- **Waistband** — waist-to-upper-thigh crop, tightened to a hardware macro
  for the engineering-family parts.
- **Pocket** — close crop showing the entire pocket and surrounding seam
  context (not so tight the placement on the garment is lost).
- **Trouser leg/hem** — waist-to-hem or lower-leg close-up as appropriate.
- **Button/stitch/buttonhole** — close detail with adjacent construction
  still visible, so the viewer can tell where on the garment it sits.

Don't crop so tightly the feature's position on the garment becomes
unreadable, and don't zoom out so far the feature itself becomes illegible.
Both failure modes defeat the point of a documentation photograph.

## Orientation discipline carries through to photography

tech-pack-interpreter records which face of the garment the illustration
shows (`spec.orientation`, see its `orientation-rules.md`). The prompt's
`VIEW` line (`buildPrompt()` in `lib/prompt.mjs`) states this explicitly and
forbids substituting a different face. Do not "improve" the shot by rotating
to a more flattering angle if it means showing a different face than the one
the illustration actually documents.

## The SET sentence is mandatory (added 2026-07-28)

These rules called for a "clean luxury studio environment, neutral background"
from the start — but until 2026-07-28 none of it reached the **generated
prompt**. `PHOTO_BLOCK` in `lib/prompt.mjs` specified lighting ("natural
daylight studio lighting") and camera, and said nothing at all about the
background. The image model was therefore free to invent a set, and did: the
first live pipeline test (shirt `hem-straight`) came back shot on location
against outdoor stone architecture, with the garment competing against steps
and a wall, and failed QC on composition.

`PHOTO_BLOCK` now ends with an explicit SET sentence naming the seamless
neutral light-grey background and forbidding location, architecture,
furniture, scenery, props and environmental context. Every option generated
through this skill inherits it.

Lesson worth generalising: a rule that lives only in a reference file and
never reaches the prompt string is not a rule the model can follow. When you
add a standard here, check that `lib/prompt.mjs` actually emits it.

## Styling must never assert a closure state

Styling text is concrete and specific; the BLUEPRINT LOCK is general. When the
two disagree, the styling wins — so styling must not make claims the drawing
governs.

A collar rule that read "open-collar with the top button fastened" closed collars
that the tech packs draw open, hiding the collar band's interior and its
buttonhole. Three independent QC agents flagged it against three different
drawings in one wave.

The collar default is now: worn open at the throat, **no necktie**, top
collar-band button **unfastened**, deferring explicitly to the closure state
drawn in the blueprint.

A necktie is worn only where the tie is required to demonstrate the option — tab
collars (the tab fastens under the knot) and wing collars (defined by their
black-tie context). Never style an accessory over the feature being sold: a
four-in-hand knot sits exactly on the collar band and fills the gap between the
points, which is the geometry that distinguishes one collar option from another.
