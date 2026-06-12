import type { ProductDesignConfig } from "./types";

export const suitJacketSections: ProductDesignConfig["sections"] = [
  /* ─────────────────────────────────────────────────────────────
     1. SHOULDER & STRUCTURE
  ───────────────────────────────────────────────────────────── */
  {
    id: "shoulder-structure",
    label: "Shoulder & Structure",
    fields: [
      {
        id: "sleeve-head",
        label: "Sleeve Head",
        defaultValue: "sleeve-natural",
        options: [
          { id: "sleeve-natural", label: "Natural", description: "Soft unpadded Italian shoulder — full drape.", image: "/images/jacket/shoulder-head/natural.jpg" },
          { id: "sleeve-regular", label: "Regular", description: "Standard structured sleeve head — balanced shape.", image: "/images/jacket/shoulder-head/regular.jpg" },
          { id: "sleeve-con-rollino", label: "Con Rollino", description: "Italian rolled sleeve head — soft roll with character.", image: "/images/jacket/shoulder-head/con-rollino.jpg" },
          { id: "sleeve-neapolitan", label: "Neapolitan (Spalla Camicia)", description: "Shirt-shoulder insertion — minimal structure, Neapolitan tradition.", image: "/images/jacket/shoulder-head/neapolitan.jpg" },
          { id: "sleeve-shirt-head", label: "Shirt Head", description: "Ultra-minimal shirt-style sleeve — lightest construction.", image: "/images/jacket/shoulder-head/shirt-head.jpg" },
        ],
      },
      {
        id: "canvas",
        label: "Jacket Structure",
        defaultValue: "half-canvas",
        options: [
          { id: "fused", label: "Regular Fused", description: "Bonded interlining — precise and stable.", image: "/images/jacket/canvas/regular-fused.jpg" },
          { id: "ultra-thin-half", label: "Ultra-thin Half Canvas", description: "Featherweight half canvas — summer weight constructions.", priceAdj: 50 },
          { id: "light-half-canvas", label: "Light Half Canvas", description: "Lighter float — refined structure without weight.", priceAdj: 100, image: "/images/jacket/canvas/light-half.jpg" },
          { id: "half-canvas", label: "Regular Half Canvas", description: "Canvas from shoulder to chest — elevated structure.", priceAdj: 100, image: "/images/jacket/canvas/half-canvas.jpg" },
          { id: "full-canvas", label: "Full Canvas (Floating)", description: "Hand-stitched floating canvas — the bespoke gold standard.", priceAdj: 150, image: "/images/jacket/canvas/full-canvas.jpg" },
          { id: "quarter-canvas", label: "Quarter Canvas", description: "Canvas at chest only — between fused and half.", priceAdj: 50, image: "/images/factory/kute/jacket/Style_Canvas/00C3__Single_layer.jpeg" },
        ],
      },
      {
        id: "shoulder-pad",
        label: "Shoulder Padding",
        defaultValue: "pad-03",
        options: [
          { id: "pad-none", label: "No Padding", description: "Fully natural — softened Italian shoulder.", image: "/images/factory/kute/jacket/Style_Shoulder_Shoulder_pad/060J__No_pad.jpeg" },
          { id: "pad-01", label: "+0.1 cm (Both Sides)", description: "Barely-there padding — barely perceptible structure.", image: "/images/factory/kute/jacket/Style_Shoulder_Shoulder_pad/060K__Regular.jpeg" },
          { id: "pad-03", label: "+0.3 cm (Both Sides)", description: "Light pad — subtle shape without projection.", image: "/images/factory/kute/jacket/Style_Shoulder_Shoulder_pad/060K__Regular.jpeg" },
          { id: "pad-05-soft", label: "+0.5 cm Soft (Both Sides)", description: "Balanced soft pad — standard bespoke.", image: "/images/factory/kute/jacket/Style_Shoulder_Shoulder_pad/060K__Regular.jpeg" },
          { id: "pad-05-structured", label: "+0.5 cm Structured (Both Sides)", description: "Full structure — traditional British/American power.", image: "/images/factory/kute/jacket/Style_Shoulder_Shoulder_pad/060K__Regular.jpeg" },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     2. LAPEL
  ───────────────────────────────────────────────────────────── */
  {
    id: "lapel",
    label: "Lapel",
    fields: [
      {
        id: "lapel-style",
        label: "Lapel Style",
        defaultValue: "lapel-notch-55",
        options: [
          /* Notch lapels */
          { id: "lapel-notch-45", label: "Notch 45° (Semi-notch)", description: "Low-angle notch — relaxed modern silhouette.", image: "/images/jacket/lapel/semi-notch.svg" },
          { id: "lapel-notch-50", label: "Notch 50° (BC)", description: "BC-cut notch — slim and precise.", image: "/images/jacket/lapel/notch-lapel.svg" },
          { id: "lapel-notch-55", label: "Notch 55°", description: "Classic notch — clean and endlessly versatile.", image: "/images/jacket/lapel/notch-lapel.svg" },
          { id: "lapel-notch-65", label: "Notch 65°", description: "Standard notch — traditional business workhorse.", image: "/images/jacket/lapel/notch-lapel.svg" },
          { id: "lapel-notch-68", label: "Notch 68° (Curved Gorge)", description: "Curved gorge line — Italian softness.", image: "/images/factory/kute/jacket/Lapel_Lapel_Style/0689__Notch_with_high_gorge.jpeg" },
          { id: "lapel-notch-73", label: "Straight Notch 73°", description: "Straight-cut notch — clean geometric line.", image: "/images/jacket/lapel/notch-lapel.svg" },
          { id: "lapel-notch-tab", label: "Notch + Pointed Tab", description: "Notch lapel with decorative pointed tab.", image: "/images/jacket/lapel/notch-tab.svg" },
          { id: "lapel-notch-tab-basic", label: "Notch + Basic Tab", description: "Notch lapel with basic straight tab.", image: "/images/jacket/lapel/notch-lapel.svg" },
          /* Peak lapels */
          { id: "lapel-peak-99", label: "Peak 99°", description: "Subtle peak — refined entry-level formal.", image: "/images/jacket/lapel/semi-peak.svg" },
          { id: "lapel-peak-101", label: "Peak 101°", description: "Restrained peak — understated authority.", image: "/images/jacket/lapel/peak-lapel.svg" },
          { id: "lapel-peak-102", label: "Peak 102°", description: "Classic peak — sharp and authoritative.", priceAdj: 50, image: "/images/jacket/lapel/peak-lapel.svg" },
          { id: "lapel-peak-102-rl", label: "Peak 102° RL", description: "RL-cut peak 102°.", priceAdj: 50, image: "/images/jacket/lapel/peak-lapel.svg" },
          { id: "lapel-peak-103-curved", label: "Curved Peak 103°", description: "Curved peak 103° — Italian softness.", priceAdj: 50, image: "/images/jacket/lapel/peak-lapel.svg" },
          { id: "lapel-peak-105", label: "Peak 105°", description: "Bold peak — commanding presence.", priceAdj: 50, image: "/images/jacket/lapel/peak-lapel.svg" },
          { id: "lapel-peak-107", label: "Peak 107° (Normal Curve)", description: "Normal curved gorge peak — Italian elegance.", priceAdj: 50, image: "/images/jacket/lapel/peak-lapel.svg" },
          { id: "lapel-peak-108", label: "Straight Peak 108°", description: "Geometric straight-cut peak — strong line.", priceAdj: 55, image: "/images/jacket/lapel/peak-lapel.svg" },
          { id: "lapel-peak-110", label: "Peak 110°", description: "Wide peak — bold formal presence.", priceAdj: 55, image: "/images/jacket/lapel/peak-lapel.svg" },
          { id: "lapel-peak-110-low", label: "Low Peak 110°", description: "Low-set wide peak — dramatic sweep.", priceAdj: 55, image: "/images/jacket/lapel/peak-lapel.svg" },
          { id: "lapel-peak-114", label: "Peak 114° (Semi-peak)", description: "Semi-peak — between notch and full peak.", priceAdj: 55, image: "/images/jacket/lapel/semi-peak.svg" },
          { id: "lapel-peak-115", label: "Peak 115°", description: "Extreme peak — statement formal.", priceAdj: 60, image: "/images/jacket/lapel/peak-lapel.svg" },
          { id: "lapel-peak-120-curved", label: "Curved Peak 120°", description: "Wide curved peak — dramatic Italian flair.", priceAdj: 65, image: "/images/jacket/lapel/peak-lapel.svg" },
          /* Shawl lapels */
          { id: "lapel-shawl", label: "Shawl Lapel", description: "Classic rounded shawl — black tie and dinner jacket.", priceAdj: 55, image: "/images/jacket/lapel/shawl-lapel.svg" },
          { id: "lapel-shawl-d", label: "D-Shawl Lapel", description: "D-shaped shawl variant — distinctive silhouette.", priceAdj: 55, image: "/images/jacket/lapel/shawl-lapel.svg" },
          { id: "lapel-shawl-0a", label: "Shawl 0A", description: "Shawl variant 0A — tailored specification.", priceAdj: 55, image: "/images/jacket/lapel/shawl-lapel.svg" },
          { id: "lapel-shawl-0e", label: "Shawl 0E", description: "Shawl variant 0E.", priceAdj: 55, image: "/images/jacket/lapel/shawl-lapel.svg" },
          { id: "lapel-shawl-0005", label: "Shawl 0005", description: "Shawl variant 0005.", priceAdj: 55, image: "/images/jacket/lapel/shawl-lapel.svg" },
          { id: "lapel-shawl-asymmetric", label: "Asymmetric Shawl Collar", description: "Asymmetric shawl — avant-garde statement.", priceAdj: 70, image: "/images/jacket/lapel/shawl-lapel.svg" },
          /* Removable / convertible */
          { id: "lapel-peak-removable-shawl", label: "Peak + Removable Shawl", description: "Peak lapel with detachable shawl conversion.", priceAdj: 90 },
          { id: "lapel-notch-removable-shawl", label: "Notch + Removable Shawl", description: "Notch lapel with detachable shawl conversion.", priceAdj: 90 },
          /* Special */
          { id: "lapel-fishtail", label: "Italian Fishtail Lapel", description: "Historic fishtail — heritage collector's choice.", priceAdj: 75, image: "/images/jacket/lapel/italian-fishtail.svg" },
        ],
      },
      {
        id: "lapel-width",
        label: "Lapel Width",
        defaultValue: "lw-85",
        options: [
          { id: "lw-45", label: "4.5 cm", description: "Very narrow — fashion-forward slim cut.", image: "/images/jacket/lapel-width/4-5cm.svg" },
          { id: "lw-50", label: "5.0 cm", description: "Narrow — modern slim contemporary.", image: "/images/jacket/lapel-width/5cm.svg" },
          { id: "lw-55", label: "5.5 cm", description: "Slim — sleek classic.", image: "/images/jacket/lapel-width/5-5cm.svg" },
          { id: "lw-60", label: "6.0 cm", description: "Medium-narrow — versatile modern.", image: "/images/jacket/lapel-width/6cm.svg" },
          { id: "lw-65", label: "6.5 cm", description: "Medium — balanced proportions.", image: "/images/jacket/lapel-width/6-5cm.svg" },
          { id: "lw-70", label: "7.0 cm", description: "Medium — traditional standard.", image: "/images/jacket/lapel-width/7cm.svg" },
          { id: "lw-75", label: "7.5 cm", description: "Medium-wide — classic business.", image: "/images/jacket/lapel-width/7-5cm.svg" },
          { id: "lw-80", label: "8.0 cm", description: "Wide — power look.", image: "/images/jacket/lapel-width/8cm.svg" },
          { id: "lw-85", label: "8.5 cm", description: "Wide — bold classic presence.", image: "/images/jacket/lapel-width/8-5cm.svg" },
          { id: "lw-90", label: "9.0 cm", description: "Very wide — heritage British.", image: "/images/jacket/lapel-width/9cm.svg" },
          { id: "lw-95", label: "9.5 cm", description: "Extra wide — statement formal.", image: "/images/jacket/lapel-width/9-5cm.svg" },
          { id: "lw-100", label: "10.0 cm", description: "Broad — vintage inspiration.", image: "/images/jacket/lapel-width/10cm.svg" },
          { id: "lw-105", label: "10.5 cm", description: "Extra broad — 1970s revival.", image: "/images/jacket/lapel-width/10-5cm.svg" },
          { id: "lw-110", label: "11.0 cm", description: "Very broad — bold heritage.", image: "/images/jacket/lapel-width/11cm.svg" },
          { id: "lw-115", label: "11.5 cm", description: "Maximum broad — collector's width.", image: "/images/jacket/lapel-width/11-5cm.svg" },
          { id: "lw-120", label: "12.0 cm", description: "Broadest standard — vintage statement.", image: "/images/jacket/lapel-width/12cm.svg" },
          { id: "lw-125", label: "12.5 cm", description: "Extreme width — period costume drama.", image: "/images/jacket/lapel-width/12-5cm.svg" },
        ],
      },
      {
        id: "lapel-bh-style",
        label: "Lapel Buttonhole Style",
        defaultValue: "lbh-left",
        options: [
          // ── Machine / standard ───────────────────────────────────────────────
          { id: "lbh-none",          label: "None",                        description: "Clean lapel — no buttonhole.",                    image: "/images/jacket/lapel-bh-style/none.svg" },
          { id: "lbh-real",          label: "Real Functional (Machine)",   description: "Genuine functional buttonhole by machine.",        image: "/images/jacket/lapel-bh-style/real-m.svg" },
          { id: "lbh-fake-round",    label: "Fake Round",                  description: "Decorative rounded buttonhole.",                  image: "/images/jacket/lapel-bh-style/fake-round.svg" },
          { id: "lbh-fake-square",   label: "Fake Square-End",             description: "Square-end decorative buttonhole.",               image: "/images/jacket/lapel-bh-style/fake-round.svg" },
          // ── Classic handmade ─────────────────────────────────────────────────
          { id: "lbh-005-hand",      label: "Handmade Lapel Buttonhole",   description: "Standard handcrafted lapel buttonhole.",           priceAdj: 25, image: "/images/jacket/lapel-bh-style/real-m.svg" },
          { id: "lbh-006-hand",      label: "Handmade Knot, No Seal",      description: "Handmade buttonhole with knot, no seal.",          priceAdj: 25, image: "/images/jacket/lapel-bh-style/real-m.svg" },
          { id: "lbh-pinpoint",      label: "Handmade Straight",           description: "Clean handmade straight lapel buttonhole.",        priceAdj: 25, image: "/images/jacket/lapel-bh-style/real-m.svg" },
          { id: "lbh-017-hand",      label: "Round Head, Small Hole",      description: "Round head, small size handmade hole.",            priceAdj: 25, image: "/images/jacket/lapel-bh-style/eyelet.svg" },
          { id: "lbh-smoking-pipe",  label: "Barge Head Keyhole",          description: "Round head barge eye without sealing — water drop.", priceAdj: 30, image: "/images/jacket/lapel-bh-style/smoking-pipe.svg" },
          // ── Arc styles ───────────────────────────────────────────────────────
          { id: "lbh-lumi",          label: "Arc Upwards",                 description: "Milanese arc upwards — handmade only.",            priceAdj: 35, image: "/images/jacket/lapel-bh-style/lumi.svg" },
          { id: "lbh-milanese-curved", label: "Arc Slight Downwards",      description: "Milanese arc downwards — handmade only.",          priceAdj: 35, image: "/images/jacket/lapel-bh-style/milanese-2cm.svg" },
          { id: "lbh-milanese-20",   label: "Arc Triple-Color",            description: "Triple color arc — handmade, appoint 3 colors.",    priceAdj: 40, image: "/images/jacket/lapel-bh-style/milanese-2cm.svg" },
          { id: "lbh-milanese-23",   label: "Arc Triple-Color Upwards",    description: "Triple color arc upwards — appoint 3 colors.",     priceAdj: 40, image: "/images/jacket/lapel-bh-style/milanese-2cm.svg" },
          { id: "lbh-milanese-25",   label: "Arc Triple-Color Downwards",  description: "Triple color arc downwards — appoint 3 colors.",   priceAdj: 40, image: "/images/jacket/lapel-bh-style/milanese-2cm.svg" },
          { id: "lbh-arc-double",    label: "Arc Double-Color",            description: "Double color arc — handmade, appoint 2 colors.",   priceAdj: 35, image: "/images/jacket/lapel-bh-style/milanese-2cm.svg" },
          // ── Straight styles ──────────────────────────────────────────────────
          { id: "lbh-rome-18",       label: "Triple-Color Straight",       description: "Triple color straight — handmade, appoint 3 colors.", priceAdj: 40, image: "/images/jacket/lapel-bh-style/rome-2-3cm.svg" },
          { id: "lbh-rome-18m",      label: "Double-Color Straight A",     description: "Double color straight (055T) — appoint 2 colors.", priceAdj: 35, image: "/images/jacket/lapel-bh-style/rome-2-3cm.svg" },
          { id: "lbh-rome-23m",      label: "Double-Color Straight B",     description: "Double color straight (055S) — appoint 2 colors.", priceAdj: 35, image: "/images/jacket/lapel-bh-style/rome-2-3cm.svg" },
          { id: "lbh-008-hand",      label: "½ Double-Color Straight",     description: "Half double color straight — appoint 2 colors.",   priceAdj: 30, image: "/images/jacket/lapel-bh-style/rome-2-3cm.svg" },
          { id: "lbh-no1-dc-straight", label: "No.1 Double-Color Straight", description: "No.1 double color handmade straight — appoint 2 colors.", priceAdj: 35, image: "/images/jacket/lapel-bh-style/rome-2-3cm.svg" },
          { id: "lbh-no1-dc-half",   label: "No.1 ½ Double-Color Straight", description: "Half double color lapel buttonhole — appoint 2 colors.", priceAdj: 35, image: "/images/jacket/lapel-bh-style/rome-2-3cm.svg" },
          { id: "lbh-no1-tc-arc",    label: "No.1 Triple-Color Arc",       description: "No.1 triple color arc — appoint 3 colors.",        priceAdj: 40, image: "/images/jacket/lapel-bh-style/milanese-2cm.svg" },
          // ── Roman pie styles ─────────────────────────────────────────────────
          { id: "lbh-rome-round-h",  label: "Roman Pie Round Head (Hand)", description: "Roman pie round head — hand only, casual use.",    priceAdj: 35, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343656456196.jpg" },
          { id: "lbh-rome-point-m",  label: "Roman Pie Pointed (Manual)",  description: "Roman pie pointed — manual only, casual use.",     priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343656451544.jpg" },
          // ── Named decorative ─────────────────────────────────────────────────
          { id: "lbh-undivided",     label: "Undivided Attention",         description: "Poetic decorative buttonhole — handmade only.",    priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343668889258.jpg" },
          { id: "lbh-glory-rays",    label: "Future Star",                 description: "Future Star — handmade signature.",                priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343668886623.jpg" },
          { id: "lbh-cloud",         label: "Journey of Life",             description: "Journey of Life — artisanal handwork.",            priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343668880055.jpg" },
          { id: "lbh-victory",       label: "The Light of Victory",        description: "Light of Victory buttonhole — handmade.",          priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343668894457.jpg" },
          { id: "lbh-wings",         label: "Spread Your Wings",           description: "Spread Your Wings — handmade only.",               priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343653133967.jpg" },
          { id: "lbh-rose-round",    label: "Rose Round Shape",            description: "Buttonhole with rose round shape on the end.",     priceAdj: 35, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343669707150.jpg" },
          { id: "lbh-rose-shaped",   label: "Rose Shaped Round",           description: "Rose-shaped round buttonhole — red thread default.", priceAdj: 35, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343667388607.jpg" },
          { id: "lbh-vertical-flower", label: "Vertical Flower",          description: "Vertical flower buttonhole — handmade only.",      priceAdj: 35, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343666089199.jpg" },
          { id: "lbh-antler",        label: "Antler Shape",                description: "Antler shape lapel buttonhole — handmade.",        priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343656461112.jpg" },
          { id: "lbh-brilliance-2",  label: "Add Brilliance (2-Color)",    description: "Add Brilliance to Present Splendor — 2 colors.",   priceAdj: 35, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343667399028.jpg" },
          { id: "lbh-bright-future", label: "Bright Future",               description: "Bright Future — handmade, appoint 2 colors.",      priceAdj: 35, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343668892081.jpg" },
          { id: "lbh-rising-sun",    label: "Rising Sun",                  description: "Rising Sun — handmade, appoint 2 colors.",         priceAdj: 35, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343668883730.jpg" },
          { id: "lbh-musical-note",  label: "Musical Note",                description: "Musical note shape lapel buttonhole.",             priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176474515675704.jpg" },
          { id: "lbh-brilliance-4",  label: "Add Brilliance (4-Color)",    description: "Add Brilliance — appoint 4 colors.",               priceAdj: 40, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343653141900.jpg" },
          { id: "lbh-grateful-heart", label: "Grateful Heart",             description: "Grateful heart buttonhole — handwork only.",       priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343669704240.jpg" },
          { id: "lbh-dragon-horn",   label: "Dragon Horn",                 description: "Dragon Horn — dramatic handmade detail.",          priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343661938854.jpg" },
          { id: "lbh-brave-winds",   label: "Brave Winds, Break Waves",    description: "Brave Winds, Break Waves — bold handwork.",        priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343661951216.jpg" },
          { id: "lbh-happiness",     label: "Happiness & Prosperity",      description: "Happiness and Prosperity buttonhole.",             priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343650968601.jpg" },
          { id: "lbh-work-as-one",   label: "Work as One",                 description: "Work as One — symbolic handmade buttonhole.",      priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343650974514.jpg" },
          { id: "lbh-christmas-antler", label: "Christmas Antler",         description: "Christmas Antler Shape — seasonal detail.",        priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343667396427.jpg" },
          { id: "lbh-angel",         label: "Angel of Happiness",          description: "Angel of Happiness — each keyhole unique.",        priceAdj: 35, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176344755957323.jpg" },
          { id: "lbh-open-minded",   label: "Open-Minded & Inclusive",     description: "6-color handmade — each keyhole different.",       priceAdj: 40, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176344755936037.jpg" },
          { id: "lbh-heart-to-heart", label: "Heart to Heart",             description: "Heart to Heart butt eye — manual only.",           priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343659515277.jpg" },
          // ── Specialty / multi-color barge eyes ───────────────────────────────
          { id: "lbh-2c-curved-barge", label: "2-Color Curved Barge Eye",  description: "No.2 two-color curved barge eye — manual.",        priceAdj: 35, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343650977368.jpg" },
          { id: "lbh-3c-curved-barge", label: "3-Color Curved Barge Eye",  description: "No.2 tri-color curved barge head eye — manual.",   priceAdj: 40, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343650979935.jpg" },
          { id: "lbh-head-eye",      label: "Handmade Head & Eye",         description: "Hand-made head and eye buttonhole.",               priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343650982652.jpg" },
          { id: "lbh-dark-fragrance", label: "Dark Fragrance & Shadow",    description: "Mottled eye with branch and thread color.",        priceAdj: 35, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343653144810.jpg" },
          { id: "lbh-drop-shape",    label: "Drop Shape",                  description: "Drop-shape lapel buttonhole — thread-colored.",    priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343656463556.jpg" },
          { id: "lbh-qingyun",       label: "Qingyun Straight Up",         description: "Manual lighter eye — slight variation per piece.", priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343656466195.jpg" },
          { id: "lbh-butt-eye",      label: "Handmade Butt Eye",           description: "Each keyhole unique — handmade butt eye.",         priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343659481498.jpg" },
          { id: "lbh-cow-air",       label: "Cow Air to the Sky",          description: "Cow Air to the Sky manual barge eye.",             priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343661931675.jpg" },
          { id: "lbh-water-drop",    label: "Water Drop Butt Eye",         description: "Water drop shape butt eye — manual only.",         priceAdj: 30, image: "https://aws-static-webp.kutetailor.com/comm/process/craft/176343656458701.jpg" },
        ],
      },
      {
        id: "lapel-bh-position",
        label: "Lapel Buttonhole Position",
        defaultValue: "lbp-left",
        options: [
          { id: "lbp-left", label: "Left Lapel", description: "Single buttonhole on left lapel — standard.", image: "/images/jacket/lapel-bh-pos/left.svg" },
          { id: "lbp-right", label: "Right Lapel", description: "Single buttonhole on right lapel.", image: "/images/jacket/lapel-bh-pos/right.svg" },
          { id: "lbp-left-double", label: "Left Double", description: "Two buttonholes on left lapel.", image: "/images/jacket/lapel-bh-pos/left-double.svg" },
          { id: "lbp-both", label: "Both Sides", description: "One buttonhole on each lapel.", image: "/images/jacket/lapel-bh-pos/both-sides.svg" },
          { id: "lbp-both-double", label: "Each Side Double", description: "Two buttonholes on each lapel.", image: "/images/jacket/lapel-bh-pos/both-sides.svg" },
          { id: "lbp-3l-2r", label: "Three Left / Two Right", description: "Three on left, two on right.", image: "/images/jacket/lapel-bh-pos/both-sides.svg" },
          { id: "lbp-3l-1r", label: "Three Left / One Right", description: "Three on left, one on right.", image: "/images/jacket/lapel-bh-pos/both-sides.svg" },
        ],
      },
      {
        id: "collar-felt",
        label: "Collar Felt",
        defaultValue: "felt-matching",
        advanced: true,
        options: [
          { id: "felt-matching", label: "Matching to Fabric", description: "Felt matched to outer fabric color.", image: "/images/factory/kute/jacket/Collar_felt_Felt/0671__Matched_fabric_color.jpeg" },
          { id: "felt-self", label: "Same as Self-fabric", description: "Self-fabric used as collar felt.", image: "/images/factory/kute/jacket/Collar_felt_Fabric/0673__Same_fabric.jpeg" },
          { id: "felt-custom", label: "Specify Code at Order", description: "Custom felt code — specify at checkout.", image: "/images/factory/kute/jacket/Collar_felt_Felt/0671__Matched_fabric_color.jpeg" },
        ],
      },
      {
        id: "collar-interlining",
        label: "Collar Interlining",
        defaultValue: "ci-regular",
        advanced: true,
        options: [
          { id: "ci-regular", label: "Regular (with Linen)", description: "Standard interlining with linen component." },
          { id: "ci-no-linen", label: "No Linen", description: "Interlining without linen — softer hand." },
        ],
      },
      {
        id: "folded-collar-craft",
        label: "Collar Fold Craftsmanship",
        defaultValue: "fcc-normal",
        advanced: true,
        options: [
          { id: "fcc-normal", label: "Normal", description: "Standard collar folding construction." },
          { id: "fcc-turnback", label: "Turn Back at the End", description: "Turn-back finish at collar point ends." },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     3. POCKETS
  ───────────────────────────────────────────────────────────── */
  {
    id: "suit-pockets",
    label: "Pockets",
    fields: [
      {
        id: "chest-pocket",
        label: "Chest Pocket",
        defaultValue: "cp-welt-25",
        options: [
          { id: "cp-none", label: "None", description: "No breast pocket — clean, no accessories.", image: "/images/jacket/chest-pocket/no-pocket.svg" },
          { id: "cp-welt-23", label: "Straight Welt 2.3 cm", description: "Narrow welt — sleek formal.", image: "/images/jacket/chest-pocket/straight-welt-2-3cm.svg" },
          { id: "cp-welt-25", label: "Straight Welt 2.5 cm", description: "Classic welt — standard formal chest pocket.", image: "/images/jacket/chest-pocket/straight-welt-2-5cm.svg" },
          { id: "cp-welt-27", label: "Straight Welt 2.7 cm", description: "Wide welt — bold formal statement.", image: "/images/jacket/chest-pocket/straight-welt-2-5cm.svg" },
          { id: "cp-welt-curved-23", label: "Curved Welt 2.3 cm", description: "Curved welt — Italian softness.", image: "/images/jacket/chest-pocket/curved-welt-2-5cm.svg" },
          { id: "cp-welt-curved-25", label: "Curved Welt 2.5 cm", description: "Curved welt 2.5cm — elegant.", image: "/images/jacket/chest-pocket/curved-welt-2-5cm.svg" },
          { id: "cp-welt-curved-27", label: "Curved Welt 2.7 cm", description: "Curved welt 2.7cm.", image: "/images/jacket/chest-pocket/curved-welt-2-5cm.svg" },
          { id: "cp-welt-curved-29", label: "Curved Welt 2.9 cm", description: "Wide curved welt.", image: "/images/jacket/chest-pocket/curved-welt-2-5cm.svg" },
          { id: "cp-jetted", label: "Jetted Chest Pocket", description: "Double-welt jetted — clean besom.", image: "/images/jacket/chest-pocket/straight-welt-2-5cm.svg" },
          { id: "cp-patch", label: "Patch Pocket", description: "Open patch — casual sport coat.", image: "/images/jacket/chest-pocket/patch-pocket.svg" },
          { id: "cp-patch-round", label: "Round Patch", description: "Rounded-corner patch pocket.", image: "/images/jacket/chest-pocket/round-patch.svg" },
          { id: "cp-patch-tulip", label: "Tulip Shape Patch", description: "Tulip-shaped decorative patch.", image: "/images/jacket/chest-pocket/tulip-patch.svg" },
          { id: "cp-patch-angled", label: "Angled Box Pleat Patch", description: "Box pleat patch — structured casual.", image: "/images/jacket/chest-pocket/patch-pocket.svg" },
          { id: "cp-patch-multi", label: "Multi-Pleated Patch", description: "Multi-pleated patch — volume.", image: "/images/jacket/chest-pocket/patch-pocket.svg" },
          { id: "cp-boat-28", label: "Boat-shaped 2.8 cm", description: "Rounded-corner boat pocket 2.8cm.", image: "/images/jacket/chest-pocket/boat-pocket.svg" },
          { id: "cp-boat-30", label: "Boat-shaped 3.0 cm", description: "Rounded-corner boat pocket 3.0cm.", image: "/images/jacket/chest-pocket/boat-pocket.svg" },
          { id: "cp-trapezoid", label: "Trapezoid Pocket", description: "Trapezoidal welt — geometric accent.", image: "/images/jacket/chest-pocket/straight-welt-2-5cm.svg" },
          { id: "cp-inverted-pleat-2flap", label: "Two Inverted Pleated + Flaps", description: "Double inverted pleat with basic flaps.", image: "/images/jacket/chest-pocket/patch-pocket.svg" },
          { id: "cp-inverted-pleat-flap", label: "Inverted Pleated + Flap", description: "Single inverted pleat with basic flap.", image: "/images/jacket/chest-pocket/patch-pocket.svg" },
        ],
      },
      {
        id: "lower-pocket",
        label: "Lower Pockets",
        defaultValue: "lp-slanted-flap-60",
        options: [
          { id: "lp-slanted-flap-40", label: "Slanted Flap 4.0 cm", description: "Small slanted flap.", image: "/images/jacket/lower-pocket/slanted-flap.svg" },
          { id: "lp-slanted-flap-45", label: "Slanted Flap 4.5 cm", description: "Medium-small slanted flap.", image: "/images/jacket/lower-pocket/slanted-flap.svg" },
          { id: "lp-slanted-flap-50", label: "Slanted Flap 5.0 cm", description: "Standard slanted flap 5.0cm.", image: "/images/jacket/lower-pocket/slanted-flap.svg" },
          { id: "lp-slanted-flap-55", label: "Slanted Flap 5.5 cm", description: "Classic slanted flap.", image: "/images/jacket/lower-pocket/jetted-flap-5-5cm.svg" },
          { id: "lp-slanted-flap-60", label: "Slanted Flap 6.0 cm", description: "Regular slanted flap — most versatile.", image: "/images/jacket/lower-pocket/slanted-flap.svg" },
          { id: "lp-slanted-flap-65", label: "Slanted Flap 6.5 cm", description: "Large slanted flap — generous.", image: "/images/jacket/lower-pocket/jetted-flap-6-5cm.svg" },
          { id: "lp-large-slanted-40", label: "Large Slanted Flap 4.0 cm", description: "Large-format slanted flap 4.0cm.", image: "/images/jacket/lower-pocket/slanted-flap.svg" },
          { id: "lp-large-slanted-45", label: "Large Slanted Flap 4.5 cm", description: "Large slanted flap 4.5cm.", image: "/images/jacket/lower-pocket/slanted-flap.svg" },
          { id: "lp-large-slanted-50", label: "Large Slanted Flap 5.0 cm", description: "Large slanted flap 5.0cm.", image: "/images/jacket/lower-pocket/slanted-flap.svg" },
          { id: "lp-large-slanted-55", label: "Large Slanted Flap 5.5 cm", description: "Large slanted 5.5cm — bold frame.", image: "/images/jacket/lower-pocket/jetted-flap-5-5cm.svg" },
          { id: "lp-large-slanted-60", label: "Large Slanted Flap 6.0 cm", description: "Large slanted 6.0cm.", image: "/images/jacket/lower-pocket/slanted-flap.svg" },
          { id: "lp-large-slanted-65", label: "Large Slanted Flap 6.5 cm", description: "Large slanted 6.5cm — maximum.", image: "/images/jacket/lower-pocket/jetted-flap-6-5cm.svg" },
          { id: "lp-straight-jetted-40", label: "Straight Jetted Flap 4.0 cm", description: "Straight jetted flap 4.0cm.", image: "/images/jacket/lower-pocket/jetted-flap-5-5cm.svg" },
          { id: "lp-straight-jetted-45", label: "Straight Jetted Flap 4.5 cm", description: "Straight jetted flap 4.5cm.", image: "/images/jacket/lower-pocket/jetted-flap-5-5cm.svg" },
          { id: "lp-straight-jetted-50", label: "Straight Jetted Flap 5.0 cm", description: "Straight jetted flap 5.0cm.", image: "/images/jacket/lower-pocket/jetted-flap-5-5cm.svg" },
          { id: "lp-straight-jetted-55", label: "Straight Jetted Flap 5.5 cm", description: "Straight jetted flap 5.5cm.", image: "/images/jacket/lower-pocket/jetted-flap-5-5cm.svg" },
          { id: "lp-straight-jetted-60", label: "Straight Jetted Flap 6.0 cm", description: "Straight jetted flap 6.0cm.", image: "/images/jacket/lower-pocket/jetted-flap-6-5cm.svg" },
          { id: "lp-straight-jetted-65", label: "Straight Jetted Flap 6.5 cm", description: "Straight jetted flap 6.5cm.", image: "/images/jacket/lower-pocket/jetted-flap-6-5cm.svg" },
          { id: "lp-jetted-4", label: "Straight Jetted Pocket 4 cm", description: "Clean besom 4.0cm — no flap, dressiest.", image: "/images/jacket/lower-pocket/jetted-no-flap.svg" },
          { id: "lp-straight-jetted", label: "Straight Jetted Pocket", description: "Clean besom — standard dressiest option.", image: "/images/jacket/lower-pocket/jetted-no-flap.svg" },
          { id: "lp-slanted-jetted", label: "Slanted Jetted Pocket", description: "Angled besom — diagonal clean line.", image: "/images/jacket/lower-pocket/slanted-flap.svg" },
          { id: "lp-large-slanted-jetted", label: "Large Slanted Jetted Pocket", description: "Large angled besom.", image: "/images/jacket/lower-pocket/slanted-flap.svg" },
          { id: "lp-welt-10", label: "Welt Pocket 1.0 cm", description: "Slim single welt — refined.", image: "/images/jacket/lower-pocket/jetted-no-flap.svg" },
          { id: "lp-welt-12", label: "Welt Pocket 1.2 cm", description: "Standard single welt.", image: "/images/jacket/lower-pocket/jetted-no-flap.svg" },
          { id: "lp-welt-15", label: "Welt Pocket 1.5 cm", description: "Wide single welt.", image: "/images/jacket/lower-pocket/jetted-no-flap.svg" },
          { id: "lp-rl-flat-55", label: "RL Flat Dress Pocket 5.5 cm", description: "RL-style flat dress pocket.", image: "/images/jacket/lower-pocket/jetted-flap-5-5cm.svg" },
          { id: "lp-patch", label: "Patch Pocket", description: "Open patch — casual sport coat.", image: "/images/jacket/lower-pocket/patch-pocket.svg" },
          { id: "lp-patch-rounded", label: "Rounded Patch", description: "Round-cornered patch.", image: "/images/jacket/lower-pocket/patch-pocket.svg" },
          { id: "lp-patch-flap", label: "Patch with Basic Flap", description: "Patch + flap cover.", image: "/images/jacket/lower-pocket/patch-pocket.svg" },
          { id: "lp-patch-flap-btn", label: "Patch with Flap & Button", description: "Patch + flap + button closure.", image: "/images/jacket/lower-pocket/patch-pocket.svg" },
          { id: "lp-patch-btn-tab-round", label: "Patch + Rounded Button Tab", description: "Patch with rounded button tab.", image: "/images/jacket/lower-pocket/patch-pocket.svg" },
          { id: "lp-patch-btn-tab-straight", label: "Patch + Straight Button Tab", description: "Patch with straight button tab.", image: "/images/jacket/lower-pocket/patch-pocket.svg" },
          { id: "lp-patch-btn-tab-angled", label: "Patch + Angled Button Tab", description: "Patch with angled button tab.", image: "/images/jacket/lower-pocket/patch-pocket.svg" },
          { id: "lp-inverted-flap", label: "Inverted Pleated + Basic Flap", description: "Pleated patch with basic flap.", image: "/images/jacket/lower-pocket/bellows-pocket.svg" },
          { id: "lp-inverted-flap-btn", label: "Inverted Pleated + Flap & Button", description: "Pleated + flap + button.", image: "/images/jacket/lower-pocket/bellows-pocket.svg" },
          { id: "lp-inverted-angled-flap-btn", label: "Inverted Pleated + Angled Flap & Button", description: "Pleated + angled flap + button.", image: "/images/jacket/lower-pocket/bellows-pocket.svg" },
          { id: "lp-jetted-btn-tab", label: "Jetted + Button Tab", description: "Jetted pocket with button tab.", image: "/images/jacket/lower-pocket/jetted-no-flap.svg" },
          { id: "lp-box-pleat-flap", label: "Box Patch Pocket + Flap", description: "Box pleat patch with flap.", image: "/images/jacket/lower-pocket/bellows-pocket.svg" },
          { id: "lp-angled-box-pleat", label: "Angled Box Pleat Patch", description: "Angled box pleat patch pocket.", image: "/images/jacket/lower-pocket/bellows-pocket.svg" },
          { id: "lp-multi-pleat", label: "Multi-Pleat Patch", description: "Multi-pleat patch — generous capacity.", image: "/images/jacket/lower-pocket/bellows-pocket.svg" },
          { id: "lp-water-drop", label: "Water-drop Shape Patch", description: "Teardrop-shaped patch — artistic.", image: "/images/jacket/lower-pocket/patch-pocket.svg" },
        ],
      },
      {
        id: "lower-pocket-bartack",
        label: "Pocket Bartack",
        defaultValue: "bartack-d",
        options: [
          { id: "bartack-none", label: "None", description: "No bartack reinforcement.", image: "/images/jacket/pocket-bartack/none.jpg" },
          { id: "bartack-d", label: "D-Bartack", description: "D-shaped bartack — curved reinforcement.", image: "/images/jacket/pocket-bartack/d-bartack.jpg" },
          { id: "bartack-i", label: "I-Bartack", description: "Linear I-bartack — straight reinforcement.", image: "/images/jacket/pocket-bartack/i-bartack.jpg" },
          { id: "bartack-x", label: "X-Bartack", description: "X-shaped bartack — cross reinforcement.", image: "/images/jacket/pocket-bartack/x-bartack.jpg" },
          { id: "bartack-1", label: "1-Bartack", description: "Single bartack — minimal.", image: "/images/jacket/pocket-bartack/i-bartack.jpg" },
        ],
      },
      {
        id: "ticket-pocket",
        label: "Ticket Pocket",
        defaultValue: "tp-none",
        options: [
          { id: "tp-none", label: "None", description: "No ticket pocket.", image: "/images/jacket/ticket-pocket/none.jpg" },
          { id: "tp-jetted", label: "Jetted Ticket Pocket", description: "Clean besom ticket pocket.", image: "/images/jacket/ticket-pocket/jetted.jpg" },
          { id: "tp-welt", label: "Welt Ticket Pocket", description: "Single welt ticket pocket.", image: "/images/jacket/ticket-pocket/welt.jpg" },
          { id: "tp-card-italian", label: "Italian Card Slot", description: "Card slot — 1cm narrower than lower pocket.", image: "/images/jacket/ticket-pocket/jetted.jpg" },
          { id: "tp-card-formal", label: "Formal Card Holder", description: "Formal card holder — 1cm narrower.", image: "/images/jacket/ticket-pocket/jetted.jpg" },
          { id: "tp-rl-card", label: "RL Card Pocket", description: "RL-style card pocket, 1cm narrower.", image: "/images/jacket/ticket-pocket/jetted.jpg" },
          { id: "tp-flap-40", label: "Flap 4.0 cm", description: "Flap ticket matching lower pocket design.", image: "/images/jacket/ticket-pocket/flap-40.jpg" },
          { id: "tp-flap-45", label: "Flap 4.5 cm", description: "Flap ticket 4.5cm.", image: "/images/jacket/ticket-pocket/flap.jpg" },
          { id: "tp-flap-50", label: "Flap 5.0 cm", description: "Flap ticket 5.0cm.", image: "/images/jacket/ticket-pocket/flap-50.jpg" },
          { id: "tp-flap-55", label: "Flap 5.5 cm", description: "Flap ticket 5.5cm.", image: "/images/jacket/ticket-pocket/flap-55.jpg" },
          { id: "tp-flap-60", label: "Flap 6.0 cm", description: "Flap ticket 6.0cm — wide.", image: "/images/jacket/ticket-pocket/flap-60.jpg" },
        ],
      },
      {
        id: "coin-pocket",
        label: "Lower Coin Pocket",
        defaultValue: "coin-none",
        options: [
          { id: "coin-none", label: "None", description: "No coin pocket.", image: "/images/jacket/coin-pocket/none.jpg" },
          { id: "coin-left", label: "Left Side", description: "Coin pocket on left lower.", image: "/images/jacket/coin-pocket/left.jpg" },
          { id: "coin-right", label: "Right Side", description: "Coin pocket on right lower.", image: "/images/jacket/coin-pocket/right.jpg" },
          { id: "coin-both", label: "Both Sides", description: "Coin pockets on both sides.", image: "/images/jacket/coin-pocket/both.jpg" },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     4. FRONT STYLE
  ───────────────────────────────────────────────────────────── */
  {
    id: "front-style",
    label: "Front Style",
    fields: [
      {
        id: "button-config",
        label: "Button Configuration",
        defaultValue: "sb-2",
        options: [
          { id: "sb-1", label: "SB 1 Button", description: "Single button — sleek and modern.", image: "/images/jacket/front-style/sb-1.jpg" },
          { id: "sb-2", label: "SB 2 Buttons", description: "Classic two-button — the standard.", image: "/images/jacket/front-style/sb-2.jpg" },
          { id: "sb-3", label: "SB 3 Buttons", description: "Three button — traditional formal.", image: "/images/jacket/front-style/sb-3.jpg" },
          { id: "sb-4", label: "SB 4 Buttons", description: "Four button — vintage heritage.", image: "/images/jacket/front-style/sb-4.jpg" },
          { id: "sb-3-roll-2", label: "SB 3 Roll 2", description: "Three-button rolling to two — classic American.", image: "/images/jacket/front-style/sb-3-roll-2.jpg" },
          { id: "sb-4-roll-3", label: "SB 4 Roll 3", description: "Four-button rolling to three.", image: "/images/jacket/front-style/sb-4-roll-3.jpg" },
          { id: "sb-5-hidden", label: "SB 5 Hidden Button", description: "Five concealed buttons — clean modern.", image: "/images/jacket/front-style/sb-5-hidden.jpg" },
          { id: "sb-5", label: "SB 5 Buttons", description: "Five buttons — fashion-forward statement.", image: "/images/jacket/front-style/sb-5.jpg" },
          { id: "db-2x1", label: "DB 2 × 1", description: "Double-breasted — 2 shown, 1 fastening.", priceAdj: 65, image: "/images/jacket/front-style/db-2x1.jpg" },
          { id: "db-4x1", label: "DB 4 × 1", description: "Double-breasted — 4 shown, 1 fastening.", priceAdj: 65, image: "/images/jacket/front-style/db-4x1.jpg" },
          { id: "db-4x2", label: "DB 4 × 2", description: "Double-breasted — 4 shown, 2 fastening.", priceAdj: 65, image: "/images/jacket/front-style/db-4x2.jpg" },
          { id: "db-6x1", label: "DB 6 × 1", description: "Double-breasted — 6 shown, 1 fastening.", priceAdj: 65, image: "/images/jacket/front-style/db-6x1.jpg" },
          { id: "db-6x2", label: "DB 6 × 2", description: "DB 6×2 — classic double-breasted.", priceAdj: 65, image: "/images/jacket/front-style/db-6x2.jpg" },
          { id: "db-6x3", label: "DB 6 × 3", description: "DB 6×3 — bold heritage style.", priceAdj: 65, image: "/images/jacket/front-style/db-6x3.jpg" },
        ],
      },
      {
        id: "front-buttonhole",
        label: "Front Buttonholes",
        defaultValue: "fbh-machine",
        options: [
          { id: "fbh-machine", label: "By Machine", description: "Machine-stitched buttonholes — precise.", image: "/images/jacket/front-buttonhole/by-machine.jpg" },
          { id: "fbh-hands", label: "By Hand", description: "Hand-stitched buttonholes — bespoke hallmark.", priceAdj: 60, image: "/images/jacket/front-buttonhole/by-hands.jpg" },
        ],
      },
      {
        id: "chest-dart",
        label: "Chest Dart Distance",
        defaultValue: "cd-standard",
        advanced: true,
        options: [
          { id: "cd-minus-2", label: "-2 cm", description: "Narrow dart — slim through chest.", image: "/images/jacket/chest-dart/minus-2.jpg" },
          { id: "cd-minus-3", label: "-3 cm", description: "Very narrow dart — fashion-slim.", image: "/images/jacket/chest-dart/minus-3.jpg" },
          { id: "cd-standard", label: "Standard", description: "Standard chest dart position.", image: "/images/jacket/chest-dart/standard.jpg" },
          { id: "cd-plus-2", label: "+2 cm", description: "Wider dart — fuller chest accommodation.", image: "/images/jacket/chest-dart/plus-2.jpg" },
          { id: "cd-plus-3", label: "+3 cm", description: "Widest dart — broad chest.", image: "/images/jacket/chest-dart/plus-3.jpg" },
        ],
      },
      {
        id: "hem-gusset",
        label: "Hem & Gusset",
        defaultValue: "hem-round",
        advanced: true,
        options: [
          { id: "hem-round", label: "Round Hem", description: "Standard round hem finish.", image: "/images/jacket/hem/round.jpg" },
          { id: "hem-round-06", label: "Round Hem +0.6 cm", description: "Slightly extended round hem.", image: "/images/jacket/hem/round-06.jpg" },
          { id: "hem-squared", label: "Squared Bottom", description: "Square-cut hem — clean geometric.", image: "/images/jacket/hem/squared.jpg" },
          { id: "hem-small-curve", label: "Small Curved Bottom", description: "Subtle curve hem.", image: "/images/jacket/hem/small-curve.jpg" },
          { id: "hem-big-curve", label: "Large Curved Bottom", description: "Generous curve hem.", image: "/images/jacket/hem/big-curve.jpg" },
          { id: "hem-dr-round", label: "DR Round Hem", description: "DR-specification round hem.", image: "/images/jacket/hem/dr-round.jpg" },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     5. SLEEVES & CUFFS
  ───────────────────────────────────────────────────────────── */
  {
    id: "sleeves-cuffs",
    label: "Sleeves & Cuffs",
    fields: [
      {
        id: "sleeve-vent",
        label: "Sleeve Vent",
        defaultValue: "sv-functional",
        options: [
          { id: "sv-none", label: "None", description: "No sleeve vent — clean sleeve.", image: "/images/jacket/sleeve-vent/none.jpg" },
          { id: "sv-mock", label: "Mock / Show Vent", description: "Decorative non-functional show vent.", image: "/images/jacket/sleeve-vent/mock.jpg" },
          { id: "sv-functional", label: "Functional (Working)", description: "Surgeon's cuffs — fully functional.", priceAdj: 60, image: "/images/jacket/sleeve-vent/functional.jpg" },
          { id: "sv-functional-mock", label: "Functional + Mock Vent", description: "Functional buttonholes with mock vent overlay.", priceAdj: 65, image: "/images/jacket/sleeve-vent/functional-mock.jpg" },
          { id: "sv-functional-no-bh", label: "Functional (No Buttonhole)", description: "Functional vent without buttonholes.", priceAdj: 45, image: "/images/jacket/sleeve-vent/functional-no-bh.jpg" },
        ],
      },
      {
        id: "cuff-style",
        label: "Sleeve Cuff Style",
        defaultValue: "cuff-round",
        options: [
          { id: "cuff-angled", label: "Angled Vent Cuff", description: "Angled vent cuff — dynamic silhouette.", image: "/images/jacket/sleeve-cuff/square-cuff.svg" },
          { id: "cuff-square", label: "Square Cuff", description: "Square-cut cuff — sharp geometric presence.", image: "/images/jacket/sleeve-cuff/square-cuff.svg" },
          { id: "cuff-round", label: "Round Cuff", description: "Rounded cuff — softened classic elegance.", image: "/images/jacket/sleeve-cuff/round-cuff.svg" },
          { id: "cuff-british", label: "British Turn-up", description: "British turn-up — heritage country detail.", priceAdj: 20, image: "/images/jacket/sleeve-cuff/turnback-cuff.svg" },
          { id: "cuff-turnback-35", label: "Turn-back 3.5 cm", description: "Fold-back cuff 3.5cm — formal bespoke.", priceAdj: 20, image: "/images/jacket/sleeve-cuff/turnback-cuff.svg" },
          { id: "cuff-turnback-40", label: "Turn-back 4.0 cm", description: "Fold-back cuff 4.0cm — generous fold.", priceAdj: 25, image: "/images/jacket/sleeve-cuff/turnback-cuff.svg" },
        ],
      },
      {
        id: "cuff-button-number",
        label: "Sleeve Button Count",
        defaultValue: "cb-3",
        options: [
          { id: "cb-none", label: "None", description: "No sleeve buttons.", image: "/images/jacket/cuff-btn-num/two-buttons.svg" },
          { id: "cb-1", label: "1 Button", description: "Single sleeve button — minimal.", image: "/images/jacket/cuff-btn-num/two-buttons.svg" },
          { id: "cb-2", label: "2 Buttons", description: "Two buttons — understated.", image: "/images/jacket/cuff-btn-num/two-buttons.svg" },
          { id: "cb-3", label: "3 Buttons", description: "Three buttons — casual standard.", image: "/images/jacket/cuff-btn-num/three-buttons.svg" },
          { id: "cb-4", label: "4 Buttons", description: "Four buttons — traditional formal.", image: "/images/jacket/cuff-btn-num/four-buttons.svg" },
          { id: "cb-5", label: "5 Buttons", description: "Five buttons — statement piece.", image: "/images/jacket/cuff-btn-num/five-buttons.svg" },
          { id: "cb-6", label: "6 Buttons", description: "Six buttons — maximum formal.", image: "/images/jacket/cuff-btn-num/five-buttons.svg" },
        ],
      },
      {
        id: "cuff-button-spacing",
        label: "Button Spacing",
        defaultValue: "bs-no-kiss",
        options: [
          { id: "bs-no-kiss", label: "No Kissing (Standard)", description: "Standard gap between buttons — classic." },
          { id: "bs-kissing", label: "Kissing Buttons", description: "Buttons touching — Italian bespoke hallmark.", image: "/images/factory/kute/jacket/Sleeve_Sleeve_bttn/0630__2_kissing.jpeg" },
        ],
      },
      {
        id: "sleeve-buttonhole-dir",
        label: "Sleeve Buttonhole Direction",
        defaultValue: "sbh-straight",
        options: [
          { id: "sbh-straight", label: "Straight", description: "Horizontal buttonholes — traditional standard.", image: "/images/factory/kute/jacket/Sleeve_Sleeve_Bttnhole/AAAM__Normal.jpeg" },
          { id: "sbh-slant", label: "Slanted", description: "Diagonal buttonholes — Italian style.", image: "/images/factory/kute/jacket/Sleeve_Sleeve_Bttnhole/AAAN__Normal_slanted.jpeg" },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     6. BACK & VENTS
  ───────────────────────────────────────────────────────────── */
  {
    id: "back-vents",
    label: "Back & Vents",
    fields: [
      {
        id: "back-vent-style",
        label: "Back Vent",
        defaultValue: "bv-side",
        options: [
          { id: "bv-none", label: "No Vent", description: "Clean European back — no vent.", image: "/images/jacket/back-vent/no-vent.jpg" },
          { id: "bv-center", label: "Center Vent", description: "Classic American center vent.", image: "/images/jacket/back-vent/center-vent.jpg" },
          { id: "bv-side", label: "Side Vents", description: "Dual side vents — British-Italian.", priceAdj: 30, image: "/images/jacket/back-vent/side-vents.jpg" },
          { id: "bv-side-belt", label: "Side Vents + Inner Belt", description: "Side vents with inner belt detail.", priceAdj: 40, image: "/images/jacket/back-vent/side-belt.jpg" },
          { id: "bv-side-fixed-belt", label: "Side Vents + Fixed Belt", description: "Side vents with decorative fixed belt.", priceAdj: 45, image: "/images/jacket/back-vent/side-fixed-belt.jpg" },
        ],
      },
      {
        id: "elbow-patch",
        label: "Elbow Patches",
        defaultValue: "ep-none",
        options: [
          { id: "ep-none", label: "None", description: "No elbow patches." },
          { id: "ep-round", label: "Round Elbow Patch", description: "Traditional round elbow patches — country/academic.", priceAdj: 45, image: "/images/factory/kute/jacket/Sleeve_Elbow/0609__Round.png" },
          { id: "ep-round-sleeve", label: "Round Sleeve Patch", description: "Full round sleeve patch — heritage.", priceAdj: 35, image: "/images/factory/kute/jacket/Sleeve_Elbow/0610__Oval.png" },
        ],
      },
      {
        id: "external-decoration",
        label: "External Decoration",
        defaultValue: "ext-none",
        advanced: true,
        options: [
          { id: "ext-none", label: "None", description: "No external decorative detail.", image: "/images/jacket/external-decoration/none.jpg" },
          { id: "ext-loop-flat", label: "Front Chest Horizontal Button Loop", description: "Flat button loop on front chest.", image: "/images/jacket/external-decoration/front-chest-horizontal-button-loop.jpg" },
          { id: "ext-loop-slanted", label: "Front Chest Slanted Button Loop", description: "Slanted button loop on front chest.", image: "/images/jacket/external-decoration/front-chest-slanted-button-loop.jpg" },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     7. HANDMADE & CRAFTSMANSHIP
  ───────────────────────────────────────────────────────────── */
  {
    id: "handmade",
    label: "Handmade & Craftsmanship",
    fields: [
      {
        id: "handmade-type",
        label: "Handmade Construction",
        defaultValue: "hm-none",
        options: [
          { id: "hm-none", label: "Standard Machine", description: "Precision machine construction throughout.", image: "/images/factory/kute/jacket/Bttn_Thread_PIC_TOP_STITCH_Outer_pic_stitch/0570__No.png" },
          { id: "hm-individual", label: "Individual Handmade Parts", description: "Key areas hand-finished — hybrid craftsmanship.", priceAdj: 150, image: "/images/factory/kute/jacket/Other_Handmade_option/08C0__Manually_sewing_lapel.png" },
          { id: "hm-full", label: "Full Hand-made", description: "Complete bespoke hand construction — the pinnacle.", priceAdj: 400, image: "/images/factory/kute/jacket/Other_Handmade_option/08C0__Manually_sewing_lapel.png" },
        ],
      },
      {
        id: "handmade-decorative",
        label: "Handmade Decorative Lines",
        defaultValue: "hmd-none",
        options: [
          { id: "hmd-none", label: "None", description: "No decorative hand stitching lines.", image: "/images/jacket/handmade-decorative/none.jpg" },
          { id: "hmd-shoulder", label: "Shoulder Seam Only", description: "Hand stitch on shoulder seam.", image: "/images/jacket/handmade-decorative/shoulder-seam.jpg" },
          { id: "hmd-shoulder-vent", label: "Shoulder + Sleeve/Back Vent", description: "Hand stitch on shoulder, sleeve vent, and back vent.", priceAdj: 30, image: "/images/jacket/handmade-decorative/shoulder-vent.jpg" },
          { id: "hmd-full", label: "Full — Shoulder, Vents, Chest Pocket, Buttonholes", description: "Complete handmade decorative line coverage.", priceAdj: 80, image: "/images/jacket/handmade-decorative/full.jpg" },
        ],
      },
      {
        id: "sewing-button-style",
        label: "Button Sewing Style",
        defaultValue: "sbs-machine",
        options: [
          { id: "sbs-machine", label: "Regular Machine Sewing", description: "Precision machine-sewn — standard.", image: "/images/jacket/sewing-style/regular-machine.jpg" },
          { id: "sbs-cross-hand", label: "Crossing Stitch by Hand (X)", description: "Hand-sewn X cross stitch — Italian craft.", priceAdj: 20, image: "/images/jacket/sewing-style/cross-stitch.jpg" },
          { id: "sbs-down-hand", label: "\"↓\" Stitch by Hand", description: "Down-stitch hand-sewn — Neapolitan tradition.", priceAdj: 20, image: "/images/jacket/sewing-style/down-stitch.jpg" },
          { id: "sbs-eq-hand", label: "\"=\" Stitch by Hand", description: "Parallel stitch hand-sewn.", priceAdj: 20, image: "/images/jacket/sewing-style/eq-stitch.jpg" },
          { id: "sbs-sq-hand", label: "\"□\" Stitch by Hand", description: "Square stitch hand-sewn — heritage detail.", priceAdj: 20, image: "/images/jacket/sewing-style/sq-stitch.jpg" },
          { id: "sbs-under-hand", label: "Button Under Layer by Hand", description: "Reinforced with hand-sewn under-layer.", priceAdj: 25, image: "/images/jacket/sewing-style/under-layer.jpg" },
        ],
      },
      {
        id: "sleeve-buttonhole-type",
        label: "Sleeve Buttonholes",
        defaultValue: "slbh-machine",
        options: [
          { id: "slbh-machine", label: "By Machine", description: "Machine-stitched sleeve buttonholes — precise.", image: "/images/jacket/sleeve-buttonhole/by-machine.jpg" },
          { id: "slbh-hands", label: "By Hand", description: "Hand-stitched sleeve buttonholes — bespoke mark.", priceAdj: 80, image: "/images/jacket/sleeve-buttonhole/by-hands.jpg" },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     8. DETAILS & STITCHING
  ───────────────────────────────────────────────────────────── */
  {
    id: "suit-details",
    label: "Details & Stitching",
    fields: [
      {
        id: "pick-stitching",
        label: "Pick Stitching",
        defaultValue: "ps-none",
        options: [
          { id: "ps-none", label: "None", description: "Clean machine edge — no pick stitching.", image: "/images/jacket/pick-stitch/none.svg" },
          { id: "ps-015-machine", label: "0.15 cm Machine", description: "Fine machine pick stitch — clean precision.", image: "/images/jacket/pick-stitch/0-15cm-machine.svg" },
          { id: "ps-06-machine", label: "0.6 cm Machine", description: "Standard machine pick stitch.", image: "/images/jacket/pick-stitch/0-6cm-machine.svg" },
          { id: "ps-top-06", label: "Top Stitch 0.6 cm", description: "Machine top stitch 0.6cm to edge.", image: "/images/jacket/pick-stitch/0-6cm-top-stitch.svg" },
          { id: "ps-top-4cm", label: "Top Stitch 4 cm from Edge", description: "Wide machine top stitch — bold graphic.", image: "/images/jacket/pick-stitch/4cm-top-stitch.svg" },
          { id: "ps-015-hand", label: "0.15 cm by Hand", description: "Fine hand pick stitch — bespoke quality.", priceAdj: 60, image: "/images/jacket/pick-stitch/0-15cm-hand.svg" },
          { id: "ps-06-hand", label: "0.6 cm by Hand", description: "Standard hand pick stitch.", priceAdj: 80, image: "/images/jacket/pick-stitch/0-6cm-hand.svg" },
          { id: "ps-double", label: "Double (0.15 + 0.6 cm)", description: "Double pick stitch — layered texture.", priceAdj: 100, image: "/images/jacket/pick-stitch/double-pick.svg" },
        ],
      },
      {
        id: "pick-stitching-position",
        label: "Pick Stitching Coverage",
        defaultValue: "psp-lapel-front",
        options: [
          { id: "psp-lapel-front", label: "Lapel, Collar, Front, Pocket, Sleeve Vent", description: "Standard coverage — all key visible edges.", image: "/images/jacket/pick-stitch-pos/lapel-collar-front-pocket.svg" },
          { id: "psp-plus-back", label: "+ Back Vent", description: "Standard coverage plus back vent.", priceAdj: 20, image: "/images/jacket/pick-stitch-pos/back.svg" },
          { id: "psp-all-seams", label: "All Seams", description: "Complete pick stitching on every seam.", priceAdj: 60, image: "/images/jacket/pick-stitch-pos/all-seams.svg" },
        ],
      },
      {
        id: "contrast-position",
        label: "Contrast Fabric Position",
        defaultValue: "contrast-none",
        options: [
          { id: "contrast-none", label: "No Contrast", description: "Single fabric throughout.", image: "/images/jacket/contrast-pos/none.svg" },
          { id: "contrast-collar", label: "Top Collar", description: "Contrast on top collar.", image: "/images/jacket/contrast-pos/top-collar.jpg" },
          { id: "contrast-lapel", label: "Lapel", description: "Contrast fabric on lapel.", image: "/images/jacket/contrast-pos/lapel.jpg" },
          { id: "contrast-chest-pocket", label: "Chest Pocket Trim", description: "Contrast on chest pocket edges.", image: "/images/jacket/contrast-pos/chest-pocket.jpg" },
          { id: "contrast-lower-besom", label: "Lower Pocket Besom", description: "Contrast on lower pocket welts.", image: "/images/jacket/contrast-pos/lower-pocket-besom.jpg" },
          { id: "contrast-lower-flap", label: "Lower Pocket Flap", description: "Contrast fabric on lower flap.", image: "/images/jacket/contrast-pos/lower-pocket-flap.jpg" },
          { id: "contrast-ticket-flap", label: "Ticket Pocket Flap", description: "Contrast on ticket pocket flap.", image: "/images/jacket/contrast-pos/ticket-pocket-flap.jpg" },
          { id: "contrast-ticket-besom", label: "Ticket Pocket Besom", description: "Contrast on ticket pocket besom.", image: "/images/jacket/contrast-pos/ticket-pocket-besom.jpg" },
          { id: "contrast-satin-lapel", label: "Satin Piping on Lapel", description: "1cm satin splicing on lapel edge.", image: "/images/jacket/contrast-pos/satin-lapel.jpg" },
        ],
      },
      {
        id: "columbia-piping",
        label: "Interior Columbia Stitching / Piping",
        defaultValue: "cp-none",
        advanced: true,
        options: [
          { id: "cp-none", label: "None", description: "No interior stitching or piping.", image: "/images/jacket/columbia-piping/none.jpg" },
          { id: "cp-columbia", label: "Columbia Stitching", description: "Interior Columbia stitching detail.", image: "/images/jacket/columbia-piping/columbia.jpg" },
          { id: "cp-piping", label: "Piping", description: "Interior piping trim.", priceAdj: 25, image: "/images/jacket/columbia-piping/piping.jpg" },
          { id: "cp-both", label: "Columbia + Piping", description: "Both Columbia stitching and piping.", priceAdj: 35, image: "/images/jacket/columbia-piping/columbia-and-piping.jpg" },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     9. FACING & INTERIOR POCKETS
  ───────────────────────────────────────────────────────────── */
  {
    id: "interior",
    label: "Interior & Facing",
    fields: [
      {
        id: "facing-style",
        label: "Facing Style",
        defaultValue: "facing-5",
        options: [
          { id: "facing-1", label: "Facing 1", description: "Minimal facing — lightest interior.", image: "/images/jacket/facing/facing-1.jpg" },
          { id: "facing-2", label: "Facing 2", description: "Standard facing variant 2.", image: "/images/jacket/facing/facing-2.jpg" },
          { id: "facing-4", label: "Facing 4", description: "Classic facing — balanced.", image: "/images/jacket/facing/facing-4.jpg" },
          { id: "facing-5", label: "Facing 5", description: "Full facing — traditional standard.", image: "/images/jacket/facing/facing-5.jpg" },
          { id: "facing-7", label: "Facing 7", description: "Extended facing — generous interior support.", image: "/images/jacket/facing/facing-7.jpg" },
          { id: "facing-9", label: "Facing 9", description: "Maximum facing — full interior panel.", image: "/images/jacket/facing/facing-9.jpg" },
          { id: "facing-half", label: "For Half Lining", description: "Facing configured for half lining construction.", image: "/images/jacket/facing/facing-half.jpg" },
          { id: "facing-none", label: "For No Lining", description: "Facing for unlined jacket.", image: "/images/jacket/facing/facing-none.jpg" },
        ],
      },
      {
        id: "pen-pocket",
        label: "Pen Pocket",
        defaultValue: "pen-none",
        options: [
          { id: "pen-none", label: "None", description: "No pen pocket.", image: "/images/jacket/pen-pocket/none.jpg" },
          { id: "pen-left-jetted", label: "Left Jetted", description: "Left interior jetted pen pocket.", image: "/images/jacket/pen-pocket/left-jetted.jpg" },
          { id: "pen-left-drop", label: "Left Drop-shape", description: "Left teardrop-shaped pen pocket.", image: "/images/jacket/pen-pocket/left-drop.jpg" },
          { id: "pen-left-diamond", label: "Left Diamond", description: "Left diamond-shaped pen pocket.", image: "/images/jacket/pen-pocket/left-diamond.jpg" },
          { id: "pen-right-jetted", label: "Right Jetted", description: "Right interior jetted pen pocket.", image: "/images/jacket/pen-pocket/right-jetted.jpg" },
          { id: "pen-right-drop", label: "Right Drop-shape", description: "Right teardrop-shaped pen pocket.", image: "/images/jacket/pen-pocket/right-drop.jpg" },
          { id: "pen-right-diamond", label: "Right Diamond", description: "Right diamond-shaped pen pocket.", image: "/images/jacket/pen-pocket/right-diamond.jpg" },
        ],
      },
      {
        id: "namecard-pocket",
        label: "Namecard Pocket",
        defaultValue: "nc-none",
        options: [
          { id: "nc-none", label: "None", description: "No namecard pocket.", image: "/images/jacket/namecard-pocket/none.jpg" },
          { id: "nc-left", label: "Left Inner", description: "Left interior namecard pocket.", image: "/images/jacket/namecard-pocket/left.jpg" },
          { id: "nc-right", label: "Right Inner", description: "Right interior namecard pocket.", image: "/images/jacket/namecard-pocket/right.jpg" },
          { id: "nc-both", label: "Both Sides", description: "Left and right namecard pockets.", image: "/images/jacket/namecard-pocket/both.jpg" },
        ],
      },
      {
        id: "inner-ticket-pocket",
        label: "Inner Ticket Pocket",
        defaultValue: "itp-none",
        options: [
          { id: "itp-none", label: "None", description: "No inner ticket pocket.", image: "/images/jacket/inner-ticket-pocket/none.jpg" },
          { id: "itp-left", label: "Left", description: "Left interior ticket pocket.", image: "/images/jacket/inner-ticket-pocket/left.jpg" },
          { id: "itp-right", label: "Right", description: "Right interior ticket pocket.", image: "/images/jacket/inner-ticket-pocket/right.jpg" },
          { id: "itp-both", label: "Left & Right", description: "Both sides interior ticket pockets.", image: "/images/jacket/inner-ticket-pocket/left-and-right.jpg" },
        ],
      },
      {
        id: "mp3-pocket",
        label: "Phone / MP3 Pocket",
        defaultValue: "mp3-none",
        advanced: true,
        options: [
          { id: "mp3-none", label: "None", description: "No phone pocket.", image: "/images/jacket/mp3-pocket/none.jpg" },
          { id: "mp3-left", label: "Left Inner", description: "Left interior phone/MP3 pocket.", image: "/images/jacket/mp3-pocket/left.jpg" },
          { id: "mp3-right", label: "Right Inner", description: "Right interior phone/MP3 pocket.", image: "/images/jacket/mp3-pocket/right.jpg" },
        ],
      },
      {
        id: "inner-pocket-closure",
        label: "Inner Pocket Closure",
        defaultValue: "ipc-d",
        options: [
          { id: "ipc-none", label: "None (Open)", description: "Open inner pockets — no closure.", image: "/images/jacket/inner-pocket-closure/none.jpg" },
          { id: "ipc-d", label: "D-Bartack", description: "D-shaped bartack closure.", image: "/images/jacket/inner-pocket-closure/d-bartack.jpg" },
          { id: "ipc-i", label: "I-Bartack", description: "Linear bartack closure.", image: "/images/jacket/inner-pocket-closure/i-bartack.jpg" },
          { id: "ipc-x", label: "X-Bartack", description: "X-shaped bartack closure.", image: "/images/jacket/inner-pocket-closure/x-bartack.jpg" },
        ],
      },
      {
        id: "perfume-pad",
        label: "Underarm Shield",
        defaultValue: "pp-none",
        advanced: true,
        options: [
          { id: "pp-none", label: "None", description: "No underarm shield.", image: "/images/jacket/underarm-shield/none.jpg" },
          { id: "pp-triangle", label: "Triangle Underarm Shield", description: "Classic triangular shield.", image: "/images/jacket/underarm-shield/triangle.jpg" },
          { id: "pp-round-1", label: "Round Shield 1", description: "Round underarm shield, style 1.", image: "/images/jacket/underarm-shield/round-1.jpg" },
          { id: "pp-round-2", label: "Round Shield 2", description: "Round underarm shield, style 2.", image: "/images/jacket/underarm-shield/round-2.jpg" },
          { id: "pp-round-3", label: "Round Shield 3", description: "Round underarm shield, style 3.", image: "/images/jacket/underarm-shield/round-3.jpg" },
          { id: "pp-u-1", label: "U-Shield 1", description: "U-shaped underarm shield, style 1.", image: "/images/jacket/underarm-shield/u-1.jpg" },
          { id: "pp-u-2", label: "U-Shield 2", description: "U-shaped underarm shield, style 2.", image: "/images/jacket/underarm-shield/u-2.jpg" },
          { id: "pp-u-3", label: "U-Shield 3", description: "U-shaped underarm shield, style 3.", image: "/images/jacket/underarm-shield/u-3.jpg" },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     10. LINING
  ───────────────────────────────────────────────────────────── */
  {
    id: "suit-lining",
    label: "Lining",
    fields: [
      {
        id: "lining-coverage",
        label: "Lining Coverage",
        defaultValue: "lc-half",
        options: [
          { id: "lc-full", label: "Full Lining", description: "Completely lined — formal and refined.", priceAdj: 40, image: "/images/jacket/lining/full-lining.jpg" },
          { id: "lc-half", label: "Half Lining", description: "Lined front, open back — Italian casual comfort.", image: "/images/jacket/lining/half-lining.jpg" },
          { id: "lc-quarter", label: "Quarter Lining", description: "Minimal lining — summer weight.", priceAdj: -20, image: "/images/jacket/lining/half-lining.jpg" },
          { id: "lc-none", label: "Unlined", description: "Completely unlined — lightest summer option.", priceAdj: -40, image: "/images/jacket/lining/no-lining.svg" },
        ],
      },
      {
        id: "half-lining-shape",
        label: "Half Lining Shape",
        defaultValue: "hls-standard",
        hint: "Applies when Half Lining is selected",
        options: [
          { id: "hls-standard", label: "Standard Half Lining", description: "Traditional half lining shape.", image: "/images/jacket/lining/half-lining.jpg" },
          { id: "hls-small-cutaway", label: "Small Cut-away", description: "Small cut-away — lighter feel.", image: "/images/jacket/lining/half-lining.jpg" },
          { id: "hls-half", label: "1/2 Lining", description: "Pure half — front panel only lined.", image: "/images/jacket/lining/half-lining.jpg" },
          { id: "hls-third-cutaway", label: "1/3 Cut-away", description: "One-third cut-away shape.", image: "/images/jacket/lining/half-lining.jpg" },
          { id: "hls-third", label: "1/3 Lining", description: "One-third lining — ultra-light.", image: "/images/jacket/lining/half-lining.jpg" },
          { id: "hls-quarter-cutaway", label: "1/4 Cut-away", description: "One-quarter cut-away — minimum lining.", image: "/images/jacket/lining/half-lining.jpg" },
        ],
      },
      {
        id: "half-lining-craft",
        label: "Half Lining Craftsmanship",
        defaultValue: "hlc-french",
        hint: "Applies when Half Lining is selected",
        options: [
          { id: "hlc-binding", label: "Binding Seam", description: "Bound open edge — clean finish.", image: "/images/jacket/lining/half-lining.jpg" },
          { id: "hlc-french", label: "French Seam", description: "French seam — fully enclosed, Italian.", priceAdj: 15, image: "/images/jacket/lining/half-lining.jpg" },
          { id: "hlc-joining", label: "Joining Seam", description: "Joining seam — traditional flat finish.", image: "/images/jacket/lining/half-lining.jpg" },
        ],
      },
      {
        id: "lining-color",
        label: "Body Lining Color",
        defaultValue: "bl-navy",
        options: [
          { id: "bl-matching", label: "Matching to Fabric", description: "Lining matched to outer fabric.", image: "/images/factory/kute/jacket/Lining_Body_lining_Regular_Lining/0711__Match_fabric.webp" },
          { id: "bl-navy", label: "Navy Solid", description: "Classic navy lining.", image: "/images/factory/kute/jacket/Lining_Body_lining_Regular_Lining/0711__Match_fabric.webp" },
          { id: "bl-black", label: "Black", description: "Formal black lining.", image: "/images/factory/kute/jacket/Lining_Body_lining_Regular_Lining/0711__Match_fabric.webp" },
          { id: "bl-cream", label: "Cream / Ivory", description: "Warm ivory lining.", image: "/images/factory/kute/jacket/Lining_Body_lining_Regular_Lining/0711__Match_fabric.webp" },
          { id: "bl-charcoal", label: "Dark Charcoal", description: "Dark charcoal lining.", image: "/images/factory/kute/jacket/Lining_Body_lining_Regular_Lining/0711__Match_fabric.webp" },
          { id: "bl-burgundy", label: "Burgundy", description: "Rich burgundy lining.", image: "/images/factory/kute/jacket/Lining_Body_lining_Regular_Lining/0711__Match_fabric.webp" },
          { id: "bl-gold-paisley", label: "Gold Paisley Pattern", description: "Gold paisley — luxury character.", priceAdj: 20, image: "/images/factory/kute/jacket/Lining_Body_lining_Regular_Lining/0711__Match_fabric.webp" },
          { id: "bl-pattern", label: "Patterned (Designer)", description: "Designer pattern lining — specify at order.", priceAdj: 20, image: "/images/factory/kute/jacket/Lining_Body_lining/072D__Appointed_DIY_Printing-.png" },
          { id: "bl-custom", label: "Custom (Specify Code)", description: "Custom lining code or bring your own.", priceAdj: 30, image: "/images/factory/kute/jacket/Lining_Body_lining/072D__Appointed_DIY_Printing-.png" },
        ],
      },
      {
        id: "sleeve-lining-color",
        label: "Sleeve Lining",
        defaultValue: "sl-matching",
        options: [
          { id: "sl-matching", label: "Match Body Lining", description: "Sleeve lining matches body lining.", image: "/images/factory/kute/jacket/Lining_Sleeve_lining_Regular_Lining/0721__Match_body_lining_color.jpeg" },
          { id: "sl-stripe", label: "White + Red/Black Stripe", description: "Classic striped sleeve lining.", image: "/images/factory/kute/jacket/Lining_Sleeve_lining_Regular_Lining/0723__White_stripe_sleeve_lining.jpeg" },
          { id: "sl-navy", label: "Navy", description: "Navy sleeve lining.", image: "/images/factory/kute/jacket/Lining_Sleeve_lining_Regular_Lining/0721__Match_body_lining_color.jpeg" },
          { id: "sl-black", label: "Black", description: "Black sleeve lining.", image: "/images/factory/kute/jacket/Lining_Sleeve_lining_Regular_Lining/0721__Match_body_lining_color.jpeg" },
          { id: "sl-custom", label: "Custom (Specify Code)", description: "Custom sleeve lining code.", priceAdj: 15, image: "/images/factory/kute/jacket/Lining_Body_lining/072D__Appointed_DIY_Printing-.png" },
        ],
      },
    ],
  },
];

export const suit2pcDesign: ProductDesignConfig = {
  productId: "suit-2pc",
  basePrice: 599.99,
  sections: suitJacketSections,
};

export const suit3pcDesign: ProductDesignConfig = {
  productId: "suit-3pc",
  basePrice: 799.99,
  sections: suitJacketSections,
};
