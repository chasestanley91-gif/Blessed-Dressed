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
            { id: "sb-3",          label: "SB 3 Buttons",              description: "Short single-breasted — modern minimal.",          image: CDN("401C") },
            { id: "sb-4",          label: "SB 4 Buttons",              description: "Single-breasted four-button — modern classic.",    image: CDN("401D") },
            { id: "sb-5",          label: "SB 5 Buttons",              description: "Standard formal waistcoat.",                       image: CDN("401G") },
            { id: "sb-6",          label: "SB 6 Buttons",              description: "Longer vest line — six single-breasted buttons.",  image: CDN("401P") },
            { id: "db-4x2",        label: "DB 4 × 2",                  description: "Double-breasted, two to fasten.",                  image: CDN("401M") },
            { id: "db-6x2",        label: "DB 6 × 2",                  description: "Double-breasted six-button, two fasten.",          image: "https://aws-static-webp.kutetailor.com/comm/process/craft/172085209007201.png" },
            { id: "db-6x3",        label: "DB 6 × 3",                  description: "Six-button DB — bold formal statement.",           image: CDN("401K") },
            { id: "db-8x4",        label: "DB 8 × 4",                  description: "Eight-button DB — commanding dress vest.",         image: CDN("401L") },
          ],
        },
        {
          id: "bottom-shape-vest",
          label: "Bottom Shape",
          defaultValue: "vest-bottom-round",
          options: [
            { id: "vest-bottom-regular",  label: "Regular",       description: "Classic pointed bottom hem.",                     image: CDN("401J") },
            { id: "vest-bottom-small",    label: "Small Point",   description: "Smaller pointed bottom — subtle.",                image: "https://aws-static-webp.kutetailor.com/comm/process/craft/165396757799484.jpeg" },
            { id: "vest-bottom-straight", label: "Square / Flat", description: "Modern flat bottom — clean contemporary.",        image: CDN("401Z") },
            { id: "vest-bottom-round",    label: "Round",         description: "Classic soft rounded hem — timeless.",            image: CDN("401Y") },
            { id: "vest-bottom-point",    label: "Slant / Point", description: "Dramatic angled hem — Victorian character.",      image: CDN("401H") },
          ],
        },
        {
          id: "buttonhole-type-vest",
          label: "Front Buttonhole Type",
          defaultValue: "vest-bh-machine",
          advanced: true,
          options: [
            { id: "vest-bh-machine", label: "Machine Stitched",              description: "Precise machine buttonholes." },
            { id: "vest-bh-hand",    label: "Handmade Buttonholes",          description: "Hand-stitched buttonholes and buttoning — bespoke standard.", priceAdj: 40, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/173736048639039.jpg" },
            { id: "vest-bh-round",   label: "Handmade Round Buttonholes",    description: "Handmade round front buttonholes." },
          ],
        },
        {
          id: "placket-direction",
          label: "Placket Direction",
          defaultValue: "vest-left-over-right",
          advanced: true,
          options: [
            { id: "vest-left-over-right",  label: "Left over Right",  description: "Standard Western fastening.", image: "https://aws-static-webp.kutetailor.com/comm/banner/165594295677503.jpeg" },
            { id: "vest-right-over-left",  label: "Right over Left",  description: "Reverse fastening.",          image: CDN("4901") },
          ],
        },
        {
          id: "canvas-vest",
          label: "Canvas / Chest Construction",
          defaultValue: "vest-canvas-half",
          advanced: true,
          options: [
            { id: "vest-canvas-full",    label: "Full Canvas",              description: "Full floating canvas — superior drape and structure.",          image: CDN("000A") },
            { id: "vest-canvas-half",    label: "Half Canvas",              description: "Half canvas chest — balance of structure and economy.",          image: CDN("000B") },
            { id: "vest-canvas-uncon",   label: "Unconstructed Chest",      description: "Soft, unstructured chest — casual feel.",                       image: CDN("00D1") },
            { id: "vest-canvas-single",  label: "Single Layer Chest Fusing", description: "Single fused layer — crisp without bulk.",                     image: CDN("00C3") },
            { id: "vest-canvas-fused",   label: "Fused Canvas",             description: "Fully fused interlining — firm, economical.",                   image: CDN("00C1") },
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
            { id: "v-neckline",            label: "V-Neckline",                description: "Classic open V — works with all tie styles.",           image: CDN("4000") },
            { id: "u-neckline",            label: "U-Neckline",                description: "Rounded opening — softer silhouette.",                  image: CDN("4001") },
            { id: "notch-lapel-vest",      label: "Notch without Collar Band", description: "Lapel detail without collar stand.",                    image: CDN("4004") },
            { id: "peak-lapel-vest",       label: "Peak without Collar Band",  description: "Bold peak lapel — three-piece statement.",              image: CDN("4006") },
            { id: "shawl-lapel-vest",      label: "Shawl without Collar Band", description: "Rounded dinner-vest lapel — black tie.",                image: CDN("4003") },
            { id: "lapel-collar-stand",    label: "Notch with Collar Band",    description: "Notch lapel rising with stand — guard's vest.",          image: CDN("4005") },
            { id: "peak-collar-stand",     label: "Peak with Collar Band",     description: "Peak lapel with collar band — maximum formality.",       image: CDN("4007") },
            { id: "shawl-collar-stand",    label: "Shawl with Collar Band",    description: "Shawl lapel with band — dinner jacket character.",       image: CDN("4002") },
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
            { id: "vest-lapel-bh-left",     label: "Left",             description: "Left lapel buttonhole for flower.", image: "https://aws-static-webp.kutetailor.com/comm/process/craft/168120452869544.jpg" },
            { id: "vest-lapel-bh-left-two", label: "Left Two",         description: "Two buttonholes on left lapel.",    image: CDN("4545") },
            { id: "vest-lapel-bh-both",     label: "Right & Left",     description: "Buttonholes both lapels.",          image: "https://aws-static-webp.kutetailor.com/comm/process/craft/168120454355885.jpg" },
          ],
        },
        {
          id: "lapel-hole-style",
          label: "Lapel Buttonhole Style",
          defaultValue: "vest-hole-regular-straight",
          advanced: true,
          options: [
            { id: "vest-hole-regular-straight", label: "Regular Straight",         description: "Standard machine straight buttonhole.",  image: CDN("4551") },
            { id: "vest-hole-regular-round",    label: "Regular Round",            description: "Machine round-end buttonhole.",           image: CDN("4552") },
            { id: "vest-hole-real-straight",    label: "Real Straight",            description: "Handworked straight buttonhole.",         image: CDN("4553") },
            { id: "vest-hole-real-straight-05", label: "Real Straight 0.5 cm",    description: "Handworked straight with 0.5 cm lip.",    image: CDN("455K") },
          ],
        },
        {
          id: "collar-felt",
          label: "Collar Felt",
          defaultValue: "vest-collar-felt-match",
          advanced: true,
          options: [
            { id: "vest-collar-felt-match",  label: "Matched Collar Felt",  description: "Felt matched to collar fabric.", image: CDN("465A") },
            { id: "vest-collar-felt-body",   label: "Match Body Fabric",    description: "Collar felt matching main body.", image: CDN("465Y") },
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
            { id: "vest-chest-none",             label: "No Chest Pocket",        description: "Clean chest — minimal look.",                  image: CDN("4X06") },
            { id: "vest-chest-left-welt",         label: "Left Welt",             description: "Standard left breast welt pocket.",            image: CDN("4111") },
            { id: "vest-chest-left-besom",        label: "Left Besom",            description: "Left besom pocket — clean jetted style.",      image: CDN("4112") },
            { id: "vest-chest-besom-flap",        label: "Left Besom with Flap",  description: "Besom pocket with decorative flap.",           image: CDN("4113") },
            { id: "vest-chest-left-patch",        label: "Left Patch",            description: "Open patch — casual character.",               image: CDN("4125") },
            { id: "vest-chest-both-welt",         label: "Right & Left Welt",     description: "Welt pockets both sides.",                     image: CDN("4142") },
            { id: "vest-chest-both-besom",        label: "Right & Left Besom",    description: "Besom pockets both sides.",                    image: CDN("4143") },
            { id: "vest-chest-both-besom-flap",   label: "R&L Besom with Flap",   description: "Besom with flap both sides.",                  image: CDN("4144") },
            { id: "vest-chest-both-patch",        label: "Right & Left Patch",    description: "Open patch pockets both sides.",               image: CDN("4185") },
          ],
        },
        {
          id: "lower-pockets-vest",
          label: "Lower Pockets",
          defaultValue: "vest-lower-welt",
          options: [
            { id: "vest-lower-none",          label: "No Lower Pockets",      description: "Pocketless for a clean silhouette.",       image: CDN("4151") },
            { id: "vest-lower-welt",          label: "Regular Welt",          description: "Classic welt lower pockets — traditional.", image: CDN("4300") },
            { id: "vest-lower-welt-1cm",      label: "1.0 cm Width Welt",     description: "Narrow 1 cm welt — refined detail.",        image: CDN("430B") },
            { id: "vest-lower-jetted",        label: "Besom",                 description: "Clean besom pockets — contemporary.",      image: CDN("4301") },
            { id: "vest-lower-besom-flap",    label: "Besom with Flap",       description: "Besom pocket with flap — traditional.",    image: CDN("4302") },
            { id: "vest-lower-patch",         label: "Patch",                 description: "Open patch — casual.",                     image: CDN("4162") },
            { id: "vest-lower-slanted",       label: "Slant Welt",            description: "Angled welt — Italian casual.",            image: CDN("4169") },
            { id: "vest-lower-slant-besom",   label: "Slant Besom",           description: "Angled besom pocket.",                     image: CDN("4170") },
            { id: "vest-lower-slant-flap",    label: "Slant Besom with Flap", description: "Angled besom with flap.",                  image: CDN("4171") },
          ],
        },
        {
          id: "ticket-pocket-vest",
          label: "Ticket Pocket",
          defaultValue: "vest-ticket-none",
          options: [
            { id: "vest-ticket-none",          label: "None",                       description: "No ticket pocket.",                   image: "https://aws-static-webp.kutetailor.com/comm/banner/165594297986947.jpeg" },
            { id: "vest-ticket-besom",         label: "Besom",                      description: "Besom ticket pocket.",                image: CDN("4203") },
            { id: "vest-ticket-right",         label: "Right Welt",                 description: "Right-side welt ticket pocket.",      image: CDN("4201") },
            { id: "vest-ticket-left",          label: "Left Welt",                  description: "Left-side welt ticket pocket.",       image: CDN("4204") },
            { id: "vest-ticket-besom-flap",    label: "Besom with Flap",            description: "Besom ticket pocket with flap.",      image: CDN("4209") },
            { id: "vest-ticket-diamond-flap",  label: "Besom with Diamond Flap",    description: "Besom with decorative diamond flap.", image: CDN("4208") },
            { id: "vest-ticket-slant-besom",   label: "Slant Besom",               description: "Angled besom ticket pocket.",          image: CDN("42R4") },
            { id: "vest-ticket-lr-slant-welt", label: "Left & Right Slant Welt",   description: "Slant welt both sides.",               image: CDN("427C") },
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
            { id: "back-fabric-vest",   label: "Standard with Strap",   description: "Traditional back strap and buckle.",   image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176291291456086.png" },
            { id: "back-stretch-vest",  label: "Without Belt",           description: "Clean back — no cinch strap.",         image: CDN("4202") },
          ],
        },
        {
          id: "back-fabric-code",
          label: "Back Fabric",
          defaultValue: "vest-back-match",
          advanced: true,
          options: [
            { id: "vest-back-match",    label: "Matched Lining",       description: "Back in lining fabric — lightweight.",    image: CDN("4210") },
            { id: "vest-back-fabric",   label: "Fabric",               description: "Full fabric back matching front.",        image: CDN("4211") },
            { id: "vest-back-specify",  label: "Specify Fabric",       description: "Different specified fabric for back.",    image: CDN("4213") },
            { id: "vest-back-lining",   label: "Specify Lining",       description: "Specified lining fabric for back.",       image: "https://aws-static-webp.kutetailor.com/comm/process/craft/175732522422184.png" },
            { id: "vest-back-diy",      label: "DIY Printing",         description: "Custom print on back panel.",            image: CDN("423K") },
          ],
        },
        {
          id: "back-waist-belt-fabric",
          label: "Waist Belt Fabric",
          defaultValue: "vest-waist-belt-fabric",
          advanced: true,
          options: [
            { id: "vest-waist-belt-fabric",  label: "Fabric",           description: "Back belt in main body fabric.",    image: "https://aws-static-webp.kutetailor.com/comm/process/craft/173736092428715.PNG" },
            { id: "vest-waist-belt-lining",  label: "Appointed Lining", description: "Back belt in lining fabric.",       image: "https://aws-static-webp.kutetailor.com/comm/process/craft/169484743256939.PNG" },
          ],
        },
        {
          id: "back-detail-design",
          label: "Back Detail Design",
          defaultValue: "vest-back-strap-buckle",
          advanced: true,
          options: [
            { id: "vest-back-strap-buckle",  label: "With Strap & Buckle",          description: "Traditional cinching back strap with buckle.",     image: CDN("42C1") },
            { id: "vest-back-belt-3cm",      label: "Back Belt 3 cm Width + Buckle", description: "Wide 3 cm back belt with buckle.",                image: "https://aws-static-webp.kutetailor.com/comm/process/craft/168120355653557.jpg" },
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
            { id: "vest-contrast-lapel-diy",          label: "DIY Contrast Lapel & Collar",  description: "Full custom contrast on lapel and collar.",  image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166451942845219.jpeg" },
            { id: "vest-contrast-lapel-diy-1cm",      label: "DIY 1.0 cm Edging",            description: "1 cm contrast edging on lapel and collar.",  image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166451954173133.jpg" },
            { id: "vest-contrast-lapel-specify",      label: "Specify Lapel",                description: "Specified contrast fabric on lapel.",         image: "https://aws-static-webp.kutetailor.com/comm/process/craft/168506642927516.jpeg" },
            { id: "vest-contrast-lapel-1cm-specify",  label: "Specify 1.0 cm Edging Lapel",  description: "Specified 1 cm edging on lapel.",             image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176421035080732.jpeg" },
            { id: "vest-contrast-collar-specify",     label: "Specify Collar",               description: "Specified contrast fabric on collar.",        image: "https://aws-static-webp.kutetailor.com/comm/process/craft/168506644892340.jpeg" },
            { id: "vest-contrast-collar-1cm-specify", label: "Specify 1.0 cm Edging Collar", description: "Specified 1 cm edging on collar.",            image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176421037284061.jpeg" },
          ],
        },
        {
          id: "contrast-pocket-vest",
          label: "Contrast Pocket",
          defaultValue: "vest-contrast-pocket-none",
          options: [
            { id: "vest-contrast-pocket-none",          label: "None",                           description: "No pocket contrast." },
            { id: "vest-contrast-diy-flap",             label: "DIY Flap Surface",               description: "Custom contrast on pocket flap surface.",         image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166433235763824.jpeg" },
            { id: "vest-contrast-diy-seam",             label: "DIY Seam",                       description: "Custom contrast on pocket seam.",                  image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166433250996774.jpeg" },
            { id: "vest-contrast-diy-1cm",              label: "DIY 1.0 cm Contrast",            description: "Custom 1 cm contrast on pockets.",                 image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166433255045636.jpeg" },
            { id: "vest-contrast-diy-seam-bottom",      label: "DIY Seam and Bottom",            description: "Custom contrast on pocket seam and bottom.",       image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166433264482533.jpeg" },
            { id: "vest-contrast-specify-seam-bottom",  label: "Specify Seam and Bottom",        description: "Specified contrast on pocket seam and bottom.",    image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166433277734953.jpeg" },
            { id: "vest-contrast-specify-patch",        label: "Specify Patch",                  description: "Specified contrast on patch pocket.",              image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166433287550402.jpeg" },
            { id: "vest-contrast-specify-patch-surface", label: "Specify Patch Surface",         description: "Specified contrast on patch pocket surface.",      image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166433295060201.jpeg" },
            { id: "vest-contrast-specify-seam",         label: "Specify Seam",                   description: "Specified contrast pocket seam only.",             image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166433300204544.jpeg" },
          ],
        },
        {
          id: "covered-button-vest",
          label: "Covered Button",
          defaultValue: "vest-button-match",
          advanced: true,
          options: [
            { id: "vest-button-match",  label: "Match Fabric",            description: "Button covered in matching fabric.", image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166148965561353.jpg" },
            { id: "vest-button-diy",    label: "DIY Fabric Covered Button", description: "Custom fabric covered button.",    image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166148972688286.jpg" },
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
            { id: "vest-bl-match",       label: "Match Fabric",              description: "Lining matched to main fabric — cohesive.", image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166184685773081.jpeg" },
            { id: "vest-bl-navy",        label: "Navy Solid",                description: "Classic navy lining.", image: CDN("4711") },
            { id: "vest-bl-black",       label: "Black Solid",               description: "Formal black lining.", image: CDN("4711") },
            { id: "vest-bl-cream",       label: "Cream / Ivory",             description: "Warm ivory lining.", image: CDN("4711") },
            { id: "vest-bl-gold-paisley", label: "Gold Paisley",             description: "Gold paisley — signature luxury detail.", image: CDN("4711") },
            { id: "vest-bl-custom",      label: "Custom Lining (Provide Code)", description: "Custom color or pattern — specify at checkout.", image: CDN("4711") },
          ],
        },
        {
          id: "vest-lining-type",
          label: "Lining Style",
          defaultValue: "vest-lining-regular",
          advanced: true,
          options: [
            { id: "vest-lining-regular",     label: "Regular Lining",           description: "Standard lining construction." },
            { id: "vest-lining-artistic",    label: "Artistic Lining (Placement)", description: "Printed placement lining — distinctive interior.", image: CDN("4711") },
            { id: "vest-lining-diy-print",   label: "DIY Printing",             description: "Fully custom printed lining.",                     image: CDN("423M") },
          ],
        },
        {
          id: "vest-piping",
          label: "Piping",
          defaultValue: "vest-piping-none",
          advanced: true,
          options: [
            { id: "vest-piping-none",  label: "No Piping",  description: "No decorative piping." },
            { id: "vest-piping-diy",   label: "DIY Piping", description: "Custom piping trim around edges.", image: CDN("4853") },
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
            { id: "vest-btn-match",    label: "Match Fabric",   description: "Buttons matched to fabric — harmonious.", image: "https://aws-static-webp.kutetailor.com/comm/process/craft/166184578269189.jpeg" },
            { id: "vest-btn-appoint",  label: "Appoint Button", description: "Specify your own button — provide code at checkout." },
          ],
        },
        {
          id: "button-sewing-style-vest",
          label: "Button Sewing Style",
          defaultValue: "vest-btn-cross",
          advanced: true,
          options: [
            { id: "vest-btn-cross",    label: "Cross",    description: "Traditional cross-thread button sewing.",     image: CDN("4644") },
            { id: "vest-btn-parallel", label: "Parallel", description: "Parallel thread button sewing.",             image: CDN("4643") },
            { id: "vest-btn-claw",     label: "Claw",     description: "Claw-style thread pattern.",                 image: CDN("4645") },
            { id: "vest-btn-square",   label: "Square",   description: "Square thread pattern — decorative detail.", image: CDN("4646") },
          ],
        },
        {
          id: "button-thread-color-vest",
          label: "Button Thread Color",
          defaultValue: "vest-thread-match-bh",
          advanced: true,
          options: [
            { id: "vest-thread-match-bh",   label: "Match Buttonhole",       description: "Thread color matches buttonhole.", image: "https://aws-static-webp.kutetailor.com/comm/banner/165594322942466.jpeg" },
            { id: "vest-thread-diy",        label: "DIY Button Thread",      description: "Custom thread color — specify at checkout.", image: "https://aws-static-webp.kutetailor.com/comm/banner/165594324981247.jpeg" },
            { id: "vest-thread-diy-last",   label: "DIY Placket Last Button", description: "Custom thread on placket last button.", image: CDN("4641") },
          ],
        },
        {
          id: "buttonhole-thread-vest",
          label: "Buttonhole Thread",
          defaultValue: "vest-bh-thread-standard",
          advanced: true,
          options: [
            { id: "vest-bh-thread-standard", label: "Standard",                   description: "Standard buttonhole thread." },
            { id: "vest-bh-thread-diy-last", label: "DIY Last Buttonhole Thread", description: "Custom thread on last buttonhole.", image: CDN("46A4") },
            { id: "vest-bh-thread-diy-lapel", label: "DIY Lapel Buttonhole",      description: "Custom thread on lapel buttonhole.", image: CDN("4558") },
          ],
        },
        {
          id: "stitch-style-vest",
          label: "Stitch Style",
          defaultValue: "vest-stitch-none",
          options: [
            { id: "vest-stitch-none",      label: "No Pick Stitching",   description: "Clean machine-stitched edges.",                image: CDN("4587") },
            { id: "vest-stitch-pic-06",    label: "0.6 cm Pick Stitch",  description: "Hand pick stitch 0.6 cm from edge.",           image: CDN("4576") },
            { id: "vest-stitch-top-06",    label: "0.6 cm Top Stitch",   description: "Machine top stitch 0.6 cm — clean detail.",    image: CDN("4580") },
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
            { id: "vest-extra-satin-wrap",       label: "Satin Button Wrapping",       description: "Satin-wrapped buttons — luxury detail.", image: "https://aws-static-webp.kutetailor.com/comm/process/craft/168120449510095.jpg" },
            { id: "vest-extra-no-seal-stitch",   label: "No Seal Stitch on Pocket",   description: "Remove tack stitch on outer pocket.", image: "https://aws-static-webp.kutetailor.com/comm/process/craft/168120353541704.jpg" },
            { id: "vest-extra-pad-buttons",      label: "Placket with Pad Buttons",   description: "Padded button placket — reinforced." },
          ],
        },
      ],
    },
  ],
};
