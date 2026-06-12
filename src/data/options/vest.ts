import type { ProductDesignConfig } from "./types";

const CDN = (ecode: string) =>
  `https://aws-static-webp.kutetailor.com/comm/process/craft/${ecode}.jpeg`;

export const vestDesign: ProductDesignConfig = {
  productId: "vest",
  basePrice: 395,
  sections: [
    // ─── FRONT STYLE ──────────────────────────────────────────────────────────
    {
      id: "front-style",
      label: "Front Style",
      fields: [
        {
          id: "button-stance",
          label: "Button Stance",
          defaultValue: "sb-5",
          options: [
            { id: "sb-3",          label: "SB 3 Buttons",              description: "Short single-breasted — modern minimal.",          image: "/images/options/vest/sb-3.jpg" },
            { id: "sb-4",          label: "SB 4 Buttons",              description: "Single-breasted four-button — modern classic.",    image: "/images/options/vest/sb-4.jpg" },
            { id: "sb-5",          label: "SB 5 Buttons",              description: "Standard formal waistcoat.",                       image: "/images/options/vest/sb-5.jpg" },
            { id: "sb-6",          label: "SB 6 Buttons",              description: "Longer vest line — six single-breasted buttons.",  image: "/images/options/vest/sb-6.jpg" },
            { id: "db-4x2",        label: "DB 4 × 2",                  description: "Double-breasted, two to fasten.",                  image: "/images/options/vest/db-4x2.jpg" },
            { id: "db-6x2",        label: "DB 6 × 2",                  description: "Double-breasted six-button, two fasten.",          image: "/images/options/vest/db-6x2.png" },
            { id: "db-6x3",        label: "DB 6 × 3",                  description: "Six-button DB — bold formal statement.",           image: "/images/options/vest/db-6x3.jpg" },
            { id: "db-8x4",        label: "DB 8 × 4",                  description: "Eight-button DB — commanding dress vest.",         image: "/images/options/vest/db-8x4.jpg" },
          ],
        },
        {
          id: "bottom-shape-vest",
          label: "Bottom Shape",
          defaultValue: "vest-bottom-round",
          options: [
            { id: "vest-bottom-regular",  label: "Regular",       description: "Classic pointed bottom hem.",                     image: "/images/options/vest/vest-bottom-regular.jpg" },
            { id: "vest-bottom-small",    label: "Small Point",   description: "Smaller pointed bottom — subtle.",                image: "/images/options/vest/vest-bottom-small.jpg" },
            { id: "vest-bottom-straight", label: "Square / Flat", description: "Modern flat bottom — clean contemporary.",        image: "/images/options/vest/vest-bottom-straight.jpg" },
            { id: "vest-bottom-round",    label: "Round",         description: "Classic soft rounded hem — timeless.",            image: "/images/options/vest/vest-bottom-round.jpg" },
            { id: "vest-bottom-point",    label: "Slant / Point", description: "Dramatic angled hem — Victorian character.",      image: "/images/options/vest/vest-bottom-point.jpg" },
          ],
        },
        {
          id: "buttonhole-type-vest",
          label: "Front Buttonhole Type",
          defaultValue: "vest-bh-machine",
          advanced: true,
          options: [
            { id: "vest-bh-machine", label: "Machine Stitched",              description: "Precise machine buttonholes." },
            { id: "vest-bh-hand",    label: "Handmade Buttonholes",          description: "Hand-stitched buttonholes and buttoning — bespoke standard.", priceAdj: 40, image: "/images/options/vest/vest-bh-hand.jpg" },
            { id: "vest-bh-round",   label: "Handmade Round Buttonholes",    description: "Handmade round front buttonholes." },
          ],
        },
        {
          id: "placket-direction",
          label: "Placket Direction",
          defaultValue: "vest-left-over-right",
          advanced: true,
          options: [
            { id: "vest-left-over-right",  label: "Left over Right",  description: "Standard Western fastening.", image: "/images/options/vest/vest-left-over-right.jpg" },
            { id: "vest-right-over-left",  label: "Right over Left",  description: "Reverse fastening.",          image: "/images/options/vest/vest-right-over-left.jpg" },
          ],
        },
        {
          id: "canvas-vest",
          label: "Canvas / Chest Construction",
          defaultValue: "vest-canvas-half",
          advanced: true,
          options: [
            { id: "vest-canvas-full",    label: "Full Canvas",              description: "Full floating canvas — superior drape and structure.",          image: "/images/options/vest/vest-canvas-full.jpg" },
            { id: "vest-canvas-half",    label: "Half Canvas",              description: "Half canvas chest — balance of structure and economy.",          image: "/images/options/vest/vest-canvas-half.jpg" },
            { id: "vest-canvas-uncon",   label: "Unconstructed Chest",      description: "Soft, unstructured chest — casual feel.",                       image: "/images/options/vest/vest-canvas-uncon.jpg" },
            { id: "vest-canvas-single",  label: "Single Layer Chest Fusing", description: "Single fused layer — crisp without bulk.",                     image: "/images/options/vest/vest-canvas-single.jpg" },
            { id: "vest-canvas-fused",   label: "Fused Canvas",             description: "Fully fused interlining — firm, economical.",                   image: "/images/options/vest/vest-canvas-fused.jpg" },
          ],
        },
      ],
    },

    // ─── LAPEL & NECKLINE ─────────────────────────────────────────────────────
    {
      id: "lapel-neckline",
      label: "Lapel & Neckline",
      fields: [
        {
          id: "neckline-style",
          label: "Neckline / Lapel Style",
          defaultValue: "v-neckline",
          options: [
            { id: "v-neckline",            label: "V-Neckline",                description: "Classic open V — works with all tie styles.",           image: "/images/options/vest/v-neckline.jpg" },
            { id: "u-neckline",            label: "U-Neckline",                description: "Rounded opening — softer silhouette.",                  image: "/images/options/vest/u-neckline.jpg" },
            { id: "notch-lapel-vest",      label: "Notch without Collar Band", description: "Lapel detail without collar stand.",                    image: "/images/options/vest/notch-lapel-vest.jpg" },
            { id: "peak-lapel-vest",       label: "Peak without Collar Band",  description: "Bold peak lapel — three-piece statement.",              image: "/images/options/vest/peak-lapel-vest.jpg" },
            { id: "shawl-lapel-vest",      label: "Shawl without Collar Band", description: "Rounded dinner-vest lapel — black tie.",                image: "/images/options/vest/shawl-lapel-vest.jpg" },
            { id: "lapel-collar-stand",    label: "Notch with Collar Band",    description: "Notch lapel rising with stand — guard's vest.",          image: "/images/options/vest/lapel-collar-stand.jpg" },
            { id: "peak-collar-stand",     label: "Peak with Collar Band",     description: "Peak lapel with collar band — maximum formality.",       image: "/images/options/vest/peak-collar-stand.jpg" },
            { id: "shawl-collar-stand",    label: "Shawl with Collar Band",    description: "Shawl lapel with band — dinner jacket character.",       image: "/images/options/vest/shawl-collar-stand.jpg" },
          ],
        },
        {
          id: "lapel-width",
          label: "Lapel Width (if applicable)",
          defaultValue: "vest-lapel-standard",
          advanced: true,
          options: [
            { id: "vest-lapel-narrow",   label: "Narrow 6 cm",    description: "Slim lapel." },
            { id: "vest-lapel-standard", label: "Standard 7.5 cm", description: "Medium width lapel." },
            { id: "vest-lapel-wide",     label: "Wide 9 cm",       description: "Wide lapel — bold statement." },
          ],
        },
        {
          id: "lapel-buttonhole-vest",
          label: "Lapel Buttonhole Position",
          defaultValue: "vest-lapel-bh-none",
          advanced: true,
          options: [
            { id: "vest-lapel-bh-none",     label: "No Buttonhole",    description: "Clean lapel.",                     image: CDN("4544") },
            { id: "vest-lapel-bh-left",     label: "Left",             description: "Left lapel buttonhole for flower.", image: "/images/options/vest/vest-lapel-bh-left.jpg" },
            { id: "vest-lapel-bh-left-two", label: "Left Two",         description: "Two buttonholes on left lapel.",    image: "/images/options/vest/vest-lapel-bh-left-two.jpg" },
            { id: "vest-lapel-bh-both",     label: "Right & Left",     description: "Buttonholes both lapels.",          image: "/images/options/vest/vest-lapel-bh-both.jpg" },
          ],
        },
        {
          id: "lapel-hole-style",
          label: "Lapel Buttonhole Style",
          defaultValue: "vest-hole-regular-straight",
          advanced: true,
          options: [
            { id: "vest-hole-regular-straight", label: "Regular Straight",         description: "Standard machine straight buttonhole.",  image: "/images/options/vest/vest-hole-regular-straight.jpg" },
            { id: "vest-hole-regular-round",    label: "Regular Round",            description: "Machine round-end buttonhole.",           image: "/images/options/vest/vest-hole-regular-round.jpg" },
            { id: "vest-hole-real-straight",    label: "Real Straight",            description: "Handworked straight buttonhole.",         image: "/images/options/vest/vest-hole-real-straight.jpg" },
            { id: "vest-hole-real-straight-05", label: "Real Straight 0.5 cm",    description: "Handworked straight with 0.5 cm lip.",    image: "/images/options/vest/vest-hole-real-straight-05.jpg" },
          ],
        },
        {
          id: "collar-felt",
          label: "Collar Felt",
          defaultValue: "vest-collar-felt-match",
          advanced: true,
          options: [
            { id: "vest-collar-felt-match",  label: "Matched Collar Felt",  description: "Felt matched to collar fabric.", image: "/images/options/vest/vest-collar-felt-match.jpg" },
            { id: "vest-collar-felt-body",   label: "Match Body Fabric",    description: "Collar felt matching main body.", image: "/images/options/vest/vest-collar-felt-body.jpg" },
          ],
        },
      ],
    },

    // ─── POCKETS ──────────────────────────────────────────────────────────────
    {
      id: "pockets",
      label: "Pockets",
      fields: [
        {
          id: "chest-pocket-vest",
          label: "Chest / Breast Pocket",
          defaultValue: "vest-chest-left-welt",
          options: [
            { id: "vest-chest-none",             label: "No Chest Pocket",        description: "Clean chest — minimal look.",                  image: "/images/options/vest/vest-chest-none.jpg" },
            { id: "vest-chest-left-welt",         label: "Left Welt",             description: "Standard left breast welt pocket.",            image: "/images/options/vest/vest-chest-left-welt.jpg" },
            { id: "vest-chest-left-besom",        label: "Left Besom",            description: "Left besom pocket — clean jetted style.",      image: "/images/options/vest/vest-chest-left-besom.jpg" },
            { id: "vest-chest-besom-flap",        label: "Left Besom with Flap",  description: "Besom pocket with decorative flap.",           image: "/images/options/vest/vest-chest-besom-flap.jpg" },
            { id: "vest-chest-left-patch",        label: "Left Patch",            description: "Open patch — casual character.",               image: "/images/options/vest/vest-chest-left-patch.jpg" },
            { id: "vest-chest-both-welt",         label: "Right & Left Welt",     description: "Welt pockets both sides.",                     image: "/images/options/vest/vest-chest-both-welt.jpg" },
            { id: "vest-chest-both-besom",        label: "Right & Left Besom",    description: "Besom pockets both sides.",                    image: "/images/options/vest/vest-chest-both-besom.jpg" },
            { id: "vest-chest-both-besom-flap",   label: "R&L Besom with Flap",   description: "Besom with flap both sides.",                  image: "/images/options/vest/vest-chest-both-besom-flap.jpg" },
            { id: "vest-chest-both-patch",        label: "Right & Left Patch",    description: "Open patch pockets both sides.",               image: "/images/options/vest/vest-chest-both-patch.jpg" },
          ],
        },
        {
          id: "lower-pockets-vest",
          label: "Lower Pockets",
          defaultValue: "vest-lower-welt",
          options: [
            { id: "vest-lower-none",          label: "No Lower Pockets",      description: "Pocketless for a clean silhouette.",       image: "/images/options/vest/vest-lower-none.jpg" },
            { id: "vest-lower-welt",          label: "Regular Welt",          description: "Classic welt lower pockets — traditional.", image: "/images/options/vest/vest-lower-welt.jpg" },
            { id: "vest-lower-welt-1cm",      label: "1.0 cm Width Welt",     description: "Narrow 1 cm welt — refined detail.",        image: "/images/options/vest/vest-lower-welt-1cm.jpg" },
            { id: "vest-lower-jetted",        label: "Besom",                 description: "Clean besom pockets — contemporary.",      image: "/images/options/vest/vest-lower-jetted.jpg" },
            { id: "vest-lower-besom-flap",    label: "Besom with Flap",       description: "Besom pocket with flap — traditional.",    image: "/images/options/vest/vest-lower-besom-flap.jpg" },
            { id: "vest-lower-patch",         label: "Patch",                 description: "Open patch — casual.",                     image: "/images/options/vest/vest-lower-patch.jpg" },
            { id: "vest-lower-slanted",       label: "Slant Welt",            description: "Angled welt — Italian casual.",            image: "/images/options/vest/vest-lower-slanted.jpg" },
            { id: "vest-lower-slant-besom",   label: "Slant Besom",           description: "Angled besom pocket.",                     image: "/images/options/vest/vest-lower-slant-besom.jpg" },
            { id: "vest-lower-slant-flap",    label: "Slant Besom with Flap", description: "Angled besom with flap.",                  image: "/images/options/vest/vest-lower-slant-flap.jpg" },
          ],
        },
        {
          id: "ticket-pocket-vest",
          label: "Ticket Pocket",
          defaultValue: "vest-ticket-none",
          options: [
            { id: "vest-ticket-none",          label: "None",                       description: "No ticket pocket.",                   image: "/images/options/vest/vest-ticket-none.jpg" },
            { id: "vest-ticket-besom",         label: "Besom",                      description: "Besom ticket pocket.",                image: "/images/options/vest/vest-ticket-besom.jpg" },
            { id: "vest-ticket-right",         label: "Right Welt",                 description: "Right-side welt ticket pocket.",      image: "/images/options/vest/vest-ticket-right.jpg" },
            { id: "vest-ticket-left",          label: "Left Welt",                  description: "Left-side welt ticket pocket.",       image: "/images/options/vest/vest-ticket-left.jpg" },
            { id: "vest-ticket-besom-flap",    label: "Besom with Flap",            description: "Besom ticket pocket with flap.",      image: "/images/options/vest/vest-ticket-besom-flap.jpg" },
            { id: "vest-ticket-diamond-flap",  label: "Besom with Diamond Flap",    description: "Besom with decorative diamond flap.", image: "/images/options/vest/vest-ticket-diamond-flap.jpg" },
            { id: "vest-ticket-slant-besom",   label: "Slant Besom",               description: "Angled besom ticket pocket.",          image: "/images/options/vest/vest-ticket-slant-besom.jpg" },
            { id: "vest-ticket-lr-slant-welt", label: "Left & Right Slant Welt",   description: "Slant welt both sides.",               image: "/images/options/vest/vest-ticket-lr-slant-welt.jpg" },
          ],
        },
      ],
    },

    // ─── BACK & FIT ───────────────────────────────────────────────────────────
    {
      id: "back-fit",
      label: "Back & Fit",
      fields: [
        {
          id: "back-style-vest",
          label: "Back Style",
          defaultValue: "back-fabric-vest",
          options: [
            { id: "back-fabric-vest",   label: "Standard with Strap",   description: "Traditional back strap and buckle.",   image: "/images/options/vest/back-fabric-vest.png" },
            { id: "back-stretch-vest",  label: "Without Belt",           description: "Clean back — no cinch strap.",         image: "/images/options/vest/back-stretch-vest.jpg" },
          ],
        },
        {
          id: "back-fabric-code",
          label: "Back Fabric",
          defaultValue: "vest-back-match",
          advanced: true,
          options: [
            { id: "vest-back-match",    label: "Matched Lining",       description: "Back in lining fabric — lightweight.",    image: "/images/options/vest/vest-back-match.jpg" },
            { id: "vest-back-fabric",   label: "Fabric",               description: "Full fabric back matching front.",        image: "/images/options/vest/vest-back-fabric.jpg" },
            { id: "vest-back-specify",  label: "Specify Fabric",       description: "Different specified fabric for back.",    image: "/images/options/vest/vest-back-specify.jpg" },
            { id: "vest-back-lining",   label: "Specify Lining",       description: "Specified lining fabric for back.",       image: "/images/options/vest/vest-back-lining.png" },
            { id: "vest-back-diy",      label: "DIY Printing",         description: "Custom print on back panel.",            image: "/images/options/vest/vest-back-diy.jpg" },
          ],
        },
        {
          id: "back-waist-belt-fabric",
          label: "Waist Belt Fabric",
          defaultValue: "vest-waist-belt-fabric",
          advanced: true,
          options: [
            { id: "vest-waist-belt-fabric",  label: "Fabric",           description: "Back belt in main body fabric.",    image: "/images/options/vest/vest-waist-belt-fabric.png" },
            { id: "vest-waist-belt-lining",  label: "Appointed Lining", description: "Back belt in lining fabric.",       image: "/images/options/vest/vest-waist-belt-lining.png" },
          ],
        },
        {
          id: "back-detail-design",
          label: "Back Detail Design",
          defaultValue: "vest-back-strap-buckle",
          advanced: true,
          options: [
            { id: "vest-back-strap-buckle",  label: "With Strap & Buckle",          description: "Traditional cinching back strap with buckle.",     image: "/images/options/vest/vest-back-strap-buckle.jpg" },
            { id: "vest-back-belt-3cm",      label: "Back Belt 3 cm Width + Buckle", description: "Wide 3 cm back belt with buckle.",                image: "/images/options/vest/vest-back-belt-3cm.jpg" },
          ],
        },
      ],
    },

    // ─── CONTRAST ─────────────────────────────────────────────────────────────
    {
      id: "contrast-vest",
      label: "Contrast Details",
      fields: [
        {
          id: "contrast-lapel-collar",
          label: "Contrast Lapel & Collar",
          defaultValue: "vest-contrast-lapel-none",
          options: [
            { id: "vest-contrast-lapel-none",         label: "None",                         description: "No contrast on lapel or collar." },
            { id: "vest-contrast-lapel-diy",          label: "DIY Contrast Lapel & Collar",  description: "Full custom contrast on lapel and collar.",  image: "/images/options/vest/vest-contrast-lapel-diy.jpg" },
            { id: "vest-contrast-lapel-diy-1cm",      label: "DIY 1.0 cm Edging",            description: "1 cm contrast edging on lapel and collar.",  image: "/images/options/vest/vest-contrast-lapel-diy-1cm.jpg" },
            { id: "vest-contrast-lapel-specify",      label: "Specify Lapel",                description: "Specified contrast fabric on lapel.",         image: "/images/options/vest/vest-contrast-lapel-specify.jpg" },
            { id: "vest-contrast-lapel-1cm-specify",  label: "Specify 1.0 cm Edging Lapel",  description: "Specified 1 cm edging on lapel.",             image: "/images/options/vest/vest-contrast-lapel-1cm-specify.jpg" },
            { id: "vest-contrast-collar-specify",     label: "Specify Collar",               description: "Specified contrast fabric on collar.",        image: "/images/options/vest/vest-contrast-collar-specify.jpg" },
            { id: "vest-contrast-collar-1cm-specify", label: "Specify 1.0 cm Edging Collar", description: "Specified 1 cm edging on collar.",            image: "/images/options/vest/vest-contrast-collar-1cm-specify.jpg" },
          ],
        },
        {
          id: "contrast-pocket-vest",
          label: "Contrast Pocket",
          defaultValue: "vest-contrast-pocket-none",
          options: [
            { id: "vest-contrast-pocket-none",          label: "None",                           description: "No pocket contrast." },
            { id: "vest-contrast-diy-flap",             label: "DIY Flap Surface",               description: "Custom contrast on pocket flap surface.",         image: "/images/options/vest/vest-contrast-diy-flap.jpg" },
            { id: "vest-contrast-diy-seam",             label: "DIY Seam",                       description: "Custom contrast on pocket seam.",                  image: "/images/options/vest/vest-contrast-diy-seam.jpg" },
            { id: "vest-contrast-diy-1cm",              label: "DIY 1.0 cm Contrast",            description: "Custom 1 cm contrast on pockets.",                 image: "/images/options/vest/vest-contrast-diy-1cm.jpg" },
            { id: "vest-contrast-diy-seam-bottom",      label: "DIY Seam and Bottom",            description: "Custom contrast on pocket seam and bottom.",       image: "/images/options/vest/vest-contrast-diy-seam-bottom.jpg" },
            { id: "vest-contrast-specify-seam-bottom",  label: "Specify Seam and Bottom",        description: "Specified contrast on pocket seam and bottom.",    image: "/images/options/vest/vest-contrast-specify-seam-bottom.jpg" },
            { id: "vest-contrast-specify-patch",        label: "Specify Patch",                  description: "Specified contrast on patch pocket.",              image: "/images/options/vest/vest-contrast-specify-patch.jpg" },
            { id: "vest-contrast-specify-patch-surface", label: "Specify Patch Surface",         description: "Specified contrast on patch pocket surface.",      image: "/images/options/vest/vest-contrast-specify-patch-surface.jpg" },
            { id: "vest-contrast-specify-seam",         label: "Specify Seam",                   description: "Specified contrast pocket seam only.",             image: "/images/options/vest/vest-contrast-specify-seam.jpg" },
          ],
        },
        {
          id: "covered-button-vest",
          label: "Covered Button",
          defaultValue: "vest-button-match",
          advanced: true,
          options: [
            { id: "vest-button-match",  label: "Match Fabric",            description: "Button covered in matching fabric.", image: "/images/options/vest/vest-button-match.jpg" },
            { id: "vest-button-diy",    label: "DIY Fabric Covered Button", description: "Custom fabric covered button.",    image: "/images/options/vest/vest-button-diy.jpg" },
          ],
        },
      ],
    },

    // ─── LINING ───────────────────────────────────────────────────────────────
    {
      id: "lining-vest",
      label: "Lining",
      fields: [
        {
          id: "vest-lining-color",
          label: "Body Lining",
          defaultValue: "vest-bl-match",
          options: [
            { id: "vest-bl-match",       label: "Match Fabric",              description: "Lining matched to main fabric — cohesive.", image: "/images/options/vest/vest-bl-match.jpg" },
            { id: "vest-bl-navy",        label: "Navy Solid",                description: "Classic navy lining.", image: "/images/options/vest/vest-bl-navy.jpg" },
            { id: "vest-bl-black",       label: "Black Solid",               description: "Formal black lining.", image: "/images/options/vest/vest-bl-black.jpg" },
            { id: "vest-bl-cream",       label: "Cream / Ivory",             description: "Warm ivory lining.", image: "/images/options/vest/vest-bl-cream.jpg" },
            { id: "vest-bl-gold-paisley", label: "Gold Paisley",             description: "Gold paisley — signature luxury detail.", image: "/images/options/vest/vest-bl-gold-paisley.jpg" },
            { id: "vest-bl-custom",      label: "Custom Lining (Provide Code)", description: "Custom color or pattern — specify at checkout.", image: "/images/options/vest/vest-bl-custom.jpg" },
          ],
        },
        {
          id: "vest-lining-type",
          label: "Lining Style",
          defaultValue: "vest-lining-regular",
          advanced: true,
          options: [
            { id: "vest-lining-regular",     label: "Regular Lining",           description: "Standard lining construction." },
            { id: "vest-lining-artistic",    label: "Artistic Lining (Placement)", description: "Printed placement lining — distinctive interior.", image: "/images/options/vest/vest-lining-artistic.jpg" },
            { id: "vest-lining-diy-print",   label: "DIY Printing",             description: "Fully custom printed lining.",                     image: "/images/options/vest/vest-lining-diy-print.jpg" },
          ],
        },
        {
          id: "vest-piping",
          label: "Piping",
          defaultValue: "vest-piping-none",
          advanced: true,
          options: [
            { id: "vest-piping-none",  label: "No Piping",  description: "No decorative piping." },
            { id: "vest-piping-diy",   label: "DIY Piping", description: "Custom piping trim around edges.", image: "/images/options/vest/vest-piping-diy.jpg" },
          ],
        },
        {
          id: "vest-label-placement",
          label: "Label Placement",
          defaultValue: "vest-label-inner",
          advanced: true,
          options: [
            { id: "vest-label-inner", label: "Inner Breast Pocket Area", description: "Label inside the breast pocket area." },
            { id: "vest-label-seam",  label: "Side Seam",                description: "Label in the inner side seam." },
          ],
        },
      ],
    },

    // ─── BUTTONS & THREAD ─────────────────────────────────────────────────────
    {
      id: "buttons-thread-vest",
      label: "Buttons & Thread",
      fields: [
        {
          id: "button-choice-vest",
          label: "Button Choice",
          defaultValue: "vest-btn-match",
          options: [
            { id: "vest-btn-match",    label: "Match Fabric",   description: "Buttons matched to fabric — harmonious.", image: "/images/options/vest/vest-btn-match.jpg" },
            { id: "vest-btn-appoint",  label: "Appoint Button", description: "Specify your own button — provide code at checkout." },
          ],
        },
        {
          id: "button-sewing-style-vest",
          label: "Button Sewing Style",
          defaultValue: "vest-btn-cross",
          advanced: true,
          options: [
            { id: "vest-btn-cross",    label: "Cross",    description: "Traditional cross-thread button sewing.",     image: "/images/options/vest/vest-btn-cross.jpg" },
            { id: "vest-btn-parallel", label: "Parallel", description: "Parallel thread button sewing.",             image: "/images/options/vest/vest-btn-parallel.jpg" },
            { id: "vest-btn-claw",     label: "Claw",     description: "Claw-style thread pattern.",                 image: "/images/options/vest/vest-btn-claw.jpg" },
            { id: "vest-btn-square",   label: "Square",   description: "Square thread pattern — decorative detail.", image: "/images/options/vest/vest-btn-square.jpg" },
          ],
        },
        {
          id: "button-thread-color-vest",
          label: "Button Thread Color",
          defaultValue: "vest-thread-match-bh",
          advanced: true,
          options: [
            { id: "vest-thread-match-bh",   label: "Match Buttonhole",       description: "Thread color matches buttonhole.", image: "/images/options/vest/vest-thread-match-bh.jpg" },
            { id: "vest-thread-diy",        label: "DIY Button Thread",      description: "Custom thread color — specify at checkout.", image: "/images/options/vest/vest-thread-diy.jpg" },
            { id: "vest-thread-diy-last",   label: "DIY Placket Last Button", description: "Custom thread on placket last button.", image: "/images/options/vest/vest-thread-diy-last.jpg" },
          ],
        },
        {
          id: "buttonhole-thread-vest",
          label: "Buttonhole Thread",
          defaultValue: "vest-bh-thread-standard",
          advanced: true,
          options: [
            { id: "vest-bh-thread-standard", label: "Standard",                   description: "Standard buttonhole thread." },
            { id: "vest-bh-thread-diy-last", label: "DIY Last Buttonhole Thread", description: "Custom thread on last buttonhole.", image: "/images/options/vest/vest-bh-thread-diy-last.jpg" },
            { id: "vest-bh-thread-diy-lapel", label: "DIY Lapel Buttonhole",      description: "Custom thread on lapel buttonhole.", image: "/images/options/vest/vest-bh-thread-diy-lapel.jpg" },
          ],
        },
        {
          id: "stitch-style-vest",
          label: "Stitch Style",
          defaultValue: "vest-stitch-none",
          options: [
            { id: "vest-stitch-none",      label: "No Pick Stitching",   description: "Clean machine-stitched edges.",                image: "/images/options/vest/vest-stitch-none.jpg" },
            { id: "vest-stitch-pic-06",    label: "0.6 cm Pick Stitch",  description: "Hand pick stitch 0.6 cm from edge.",           image: "/images/options/vest/vest-stitch-pic-06.jpg" },
            { id: "vest-stitch-top-06",    label: "0.6 cm Top Stitch",   description: "Machine top stitch 0.6 cm — clean detail.",    image: "/images/options/vest/vest-stitch-top-06.jpg" },
          ],
        },
      ],
    },

    // ─── FITTING (ADVANCED) ───────────────────────────────────────────────────
    {
      id: "fitting-vest",
      label: "Fitting Adjustments",
      fields: [
        {
          id: "fitting-adjustment-vest",
          label: "Fitting Adjustment",
          defaultValue: "vest-fit-standard",
          advanced: true,
          options: [
            { id: "vest-fit-standard",      label: "Standard",              description: "Standard factory fit." },
            { id: "vest-fit-arm-hole-1cm",  label: "-1.0 cm Arm Hole",      description: "Reduce arm hole circumference by 1 cm." },
            { id: "vest-fit-stomach-dart",  label: "Deep Stomach Dart",     description: "Deep dart for prominent stomach — better front drape." },
          ],
        },
        {
          id: "vest-extras",
          label: "Additional Options",
          defaultValue: "vest-extra-none",
          advanced: true,
          options: [
            { id: "vest-extra-none",             label: "None",                        description: "No additional options." },
            { id: "vest-extra-satin-wrap",       label: "Satin Button Wrapping",       description: "Satin-wrapped buttons — luxury detail.", image: "/images/options/vest/vest-extra-satin-wrap.jpg" },
            { id: "vest-extra-no-seal-stitch",   label: "No Seal Stitch on Pocket",   description: "Remove tack stitch on outer pocket.", image: "/images/options/vest/vest-extra-no-seal-stitch.jpg" },
            { id: "vest-extra-pad-buttons",      label: "Placket with Pad Buttons",   description: "Padded button placket — reinforced." },
          ],
        },
      ],
    },
  ],
};
