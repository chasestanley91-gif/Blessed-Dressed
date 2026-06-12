/* ─── Product list ──────────────────────────────────────────────── */
export const builderProducts = [
  {
    id: "shirt",
    label: "Bespoke Shirt",
    description: "Collar, cuff, placket, pocket — every element crafted to your specification.",
    image: "/images/builder-heroes/shirt.jpg",
  },
  {
    id: "trousers",
    label: "Bespoke Trousers",
    description: "Pleat, rise, waistband, and cuff — precision tailored for your proportions.",
    image: "/images/builder-heroes/trousers.jpg",
  },
  {
    id: "suit-2pc",
    label: "2-Piece Suit",
    description: "Jacket and trousers — lapel, canvas, lining, and vent engineered around you.",
    image: "/images/builder-heroes/suit-2pc.jpg",
  },
  {
    id: "suit-3pc",
    label: "3-Piece Suit",
    description: "Jacket, trousers, and vest — the complete bespoke three-piece commission.",
    image: "/images/builder-heroes/suit-3pc.jpg",
  },
  {
    id: "vest",
    label: "Bespoke Vest",
    description: "Button stance, neckline, pocket, and back — the complete waistcoat, your way.",
    image: "/images/builder-heroes/vest.jpg",
  },
  {
    id: "sport-coat",
    label: "Sport Coat",
    description: "Casual-refined jacket — patch pockets, elbow patches, and personal character.",
    image: "/images/builder-heroes/sport-coat.jpg",
  },
];

/* ─── Fabrics ──────────────────────────────────────────────────── */
export type Fabric = {
  id: string;
  label: string;
  detail: string;
  premium: boolean;
  image?: string;
  color?: string[];
  pattern?: string;
  weight?: "light" | "medium" | "heavy";
  finish?: "crisp" | "soft" | "luxurious" | "textured";
  season?: string[];
  occasion?: string[];
};

export const fabrics: Fabric[] = [
  { id: "navy-herringbone", label: "Navy Herringbone", detail: "150s Super Wool — deep navy with herringbone weave.", premium: true, color: ["navy"], pattern: "herringbone", weight: "heavy", finish: "textured", season: ["fall", "winter"], occasion: ["business", "formal"] },
  { id: "charcoal-wool", label: "Charcoal Flannel", detail: "Heavyweight 14oz flannel — structured and warm.", premium: true, color: ["charcoal"], pattern: "solid", weight: "heavy", finish: "soft", season: ["fall", "winter"], occasion: ["business", "formal"] },
  { id: "black-barathea", label: "Black Barathea", detail: "Classic barathea weave — formal and refined.", premium: true, color: ["black"], pattern: "solid", weight: "medium", finish: "crisp", season: ["fall", "winter"], occasion: ["formal", "wedding"] },
  { id: "royal-blue-twill", label: "Royal Blue Twill", detail: "Diagonal twill weave — rich depth of color.", premium: true, color: ["blue"], pattern: "solid", weight: "medium", finish: "crisp", season: ["fall", "winter"], occasion: ["business", "casual"] },
  { id: "winter-tweed", label: "Winter Tweed", detail: "Harris or Donegal tweed — country house heritage.", premium: true, color: ["brown"], pattern: "tweed", weight: "heavy", finish: "textured", season: ["fall", "winter"], occasion: ["casual", "business"] },
  { id: "ivory-silk", label: "Ivory Silk Blend", detail: "Silk-wool blend — supreme drape for formal occasions.", premium: true, color: ["cream"], pattern: "solid", weight: "light", finish: "luxurious", season: ["spring", "summer"], occasion: ["wedding", "formal"] },
  { id: "cream-linen", label: "Cream Irish Linen", detail: "Breathable natural linen — warm weather tailoring.", premium: false, color: ["cream", "beige"], pattern: "linen-texture", weight: "light", finish: "textured", season: ["spring", "summer"], occasion: ["casual", "business"] },
  { id: "mid-grey-flannel", label: "Mid Grey Flannel", detail: "Classic mid-grey flannel — the office standard.", premium: false, color: ["grey"], pattern: "solid", weight: "heavy", finish: "soft", season: ["fall", "winter"], occasion: ["business"] },
  { id: "slate-serge", label: "Slate Serge", detail: "Durable serge twill — crisp silhouette.", premium: false, color: ["grey"], pattern: "solid", weight: "medium", finish: "crisp", season: ["fall", "winter"], occasion: ["business"] },
  { id: "white-oxford", label: "White Royal Oxford", detail: "Classic Oxford weave — the dress shirt benchmark.", premium: false, color: ["white"], pattern: "solid", weight: "medium", finish: "crisp", season: ["spring", "summer"], occasion: ["business", "casual"] },
  { id: "sky-poplin", label: "Sky Blue Poplin", detail: "Fine Egyptian cotton poplin — crisp and cool.", premium: false, color: ["blue"], pattern: "solid", weight: "light", finish: "crisp", season: ["spring", "summer"], occasion: ["business", "casual"] },
  { id: "pinstripe-navy", label: "Navy Pinstripe", detail: "Classic chalk pinstripe on deep navy ground.", premium: true, color: ["navy"], pattern: "pinstripe", weight: "medium", finish: "luxurious", season: ["fall", "winter"], occasion: ["business", "formal"] },
];

/* ─── Fabric discovery quiz (data-driven, 5-step funnel) ──────────
   Color → Pattern → Weight → Finish → best matches. Each answer `id`
   maps to a fabric tag value; "any" applies no filter. Soft-ranked by
   rankFabrics() so nothing is hidden — best matches simply surface first. */
export type FabricQuizStep = {
  key: "color" | "pattern" | "weight" | "finish";
  question: string;
  answers: { id: string; label: string; description: string }[];
};

export const fabricQuiz: FabricQuizStep[] = [
  {
    key: "color",
    question: "What color fabric are you looking for?",
    answers: [
      { id: "navy", label: "Navy", description: "Deep, confident, endlessly versatile." },
      { id: "grey", label: "Grey", description: "Refined and understated — the boardroom standard." },
      { id: "charcoal", label: "Charcoal", description: "Dark authority — between black and grey." },
      { id: "black", label: "Black", description: "Uncompromising formality." },
      { id: "blue", label: "Blue", description: "Rich, expressive, modern." },
      { id: "brown", label: "Brown / Earth", description: "Warm tones — casual richness." },
      { id: "cream", label: "Cream / Ivory", description: "Light, warm, summer-ready." },
      { id: "white", label: "White", description: "Crisp and clean — the dress-shirt benchmark." },
      { id: "any", label: "Open to anything", description: "Show me the full range." },
    ],
  },
  {
    key: "pattern",
    question: "What pattern do you prefer?",
    answers: [
      { id: "solid", label: "Solid", description: "Clean and versatile — works with everything." },
      { id: "pinstripe", label: "Striped", description: "Pinstripe and chalk stripe — sharp and formal." },
      { id: "herringbone", label: "Herringbone", description: "A subtle V-weave with depth and texture." },
      { id: "tweed", label: "Tweed", description: "Rugged country heritage — rich and tactile." },
      { id: "linen-texture", label: "Textured", description: "Natural slub and weave — relaxed character." },
      { id: "any", label: "No preference", description: "Show me every pattern." },
    ],
  },
  {
    key: "weight",
    question: "When will you wear it most?",
    answers: [
      { id: "light", label: "Warm Weather", description: "Light & breathable — summer and travel." },
      { id: "medium", label: "Year-Round", description: "The versatile everyday weight." },
      { id: "heavy", label: "Cold Weather", description: "Warm & structured — autumn and winter." },
      { id: "any", label: "No preference", description: "Show me all weights." },
    ],
  },
  {
    key: "finish",
    question: "What feel do you prefer?",
    answers: [
      { id: "crisp", label: "Crisp", description: "Smooth and sharp — holds a clean line." },
      { id: "soft", label: "Soft", description: "Brushed and cosy — flannel-like comfort." },
      { id: "luxurious", label: "Luxurious", description: "Fluid drape with a refined hand." },
      { id: "textured", label: "Textured", description: "Tactile surface with visible character." },
      { id: "any", label: "No preference", description: "I'll decide from the cards." },
    ],
  },
];

/* ─── Monogram fonts ──────────────────────────────────────────── */
export const monogramFonts = [
  { id: "script-classic", label: "Classic Script" },
  { id: "block-caps", label: "Block Capitals" },
  { id: "serif-engraved", label: "Engraved Serif" },
  { id: "roman-italic", label: "Roman Italic" },
  { id: "gothic-old", label: "Old English Gothic" },
  { id: "sans-modern", label: "Modern Sans" },
  { id: "monogram-interlock", label: "Interlocking Monogram" },
];

/* ─── Monogram thread colors ──────────────────────────────────── */
export const monogramThreadColors = [
  { id: "thread-matching", label: "Matching to Fabric", image: "/images/buttoning_thread_color/matching-to-fabric.jpg" },
  { id: "thread-13",   label: "13",   image: "/images/buttoning_thread_color/13.jpg" },
  { id: "thread-23",   label: "23",   image: "/images/buttoning_thread_color/23.jpg" },
  { id: "thread-32",   label: "32",   image: "/images/buttoning_thread_color/32.jpg" },
  { id: "thread-40",   label: "40",   image: "/images/buttoning_thread_color/40.jpg" },
  { id: "thread-46",   label: "46",   image: "/images/buttoning_thread_color/46.jpg" },
  { id: "thread-64",   label: "64",   image: "/images/buttoning_thread_color/64.jpg" },
  { id: "thread-95",   label: "95",   image: "/images/buttoning_thread_color/95.jpg" },
  { id: "thread-112",  label: "112",  image: "/images/buttoning_thread_color/112.jpg" },
  { id: "thread-130",  label: "130",  image: "/images/buttoning_thread_color/130.jpg" },
  { id: "thread-143",  label: "143",  image: "/images/buttoning_thread_color/143.jpg" },
  { id: "thread-180",  label: "180",  image: "/images/buttoning_thread_color/180.jpg" },
  { id: "thread-197",  label: "197",  image: "/images/buttoning_thread_color/197.jpg" },
  { id: "thread-214",  label: "214",  image: "/images/buttoning_thread_color/214.jpg" },
  { id: "thread-247",  label: "247",  image: "/images/buttoning_thread_color/247.jpg" },
  { id: "thread-309",  label: "309",  image: "/images/buttoning_thread_color/309.jpg" },
  { id: "thread-311",  label: "311",  image: "/images/buttoning_thread_color/311.jpg" },
  { id: "thread-315",  label: "315",  image: "/images/buttoning_thread_color/315.jpg" },
  { id: "thread-324",  label: "324",  image: "/images/buttoning_thread_color/324.jpg" },
  { id: "thread-339",  label: "339",  image: "/images/buttoning_thread_color/339.jpg" },
  { id: "thread-350",  label: "350",  image: "/images/buttoning_thread_color/350.jpg" },
  { id: "thread-369",  label: "369",  image: "/images/buttoning_thread_color/369.jpg" },
  { id: "thread-403",  label: "403",  image: "/images/buttoning_thread_color/403.jpg" },
  { id: "thread-446",  label: "446",  image: "/images/buttoning_thread_color/446.jpg" },
  { id: "thread-467",  label: "467",  image: "/images/buttoning_thread_color/467.jpg" },
  { id: "thread-487",  label: "487",  image: "/images/buttoning_thread_color/487.jpg" },
  { id: "thread-495",  label: "495",  image: "/images/buttoning_thread_color/495.jpg" },
  { id: "thread-512",  label: "512",  image: "/images/buttoning_thread_color/512.jpg" },
  { id: "thread-537",  label: "537",  image: "/images/buttoning_thread_color/537.jpg" },
  { id: "thread-542",  label: "542",  image: "/images/buttoning_thread_color/542.jpg" },
  { id: "thread-571",  label: "571",  image: "/images/buttoning_thread_color/571.jpg" },
  { id: "thread-665",  label: "665",  image: "/images/buttoning_thread_color/665.jpg" },
  { id: "thread-689",  label: "689",  image: "/images/buttoning_thread_color/689.jpg" },
  { id: "thread-701",  label: "701",  image: "/images/buttoning_thread_color/701.jpg" },
  { id: "thread-762",  label: "762",  image: "/images/buttoning_thread_color/762.jpg" },
  { id: "thread-764",  label: "764",  image: "/images/buttoning_thread_color/764.jpg" },
  { id: "thread-769",  label: "769",  image: "/images/buttoning_thread_color/769.jpg" },
  { id: "thread-800",  label: "800",  image: "/images/buttoning_thread_color/800.jpg" },
  { id: "thread-816",  label: "816",  image: "/images/buttoning_thread_color/816.jpg" },
  { id: "thread-870",  label: "870",  image: "/images/buttoning_thread_color/870.jpg" },
  { id: "thread-904",  label: "904",  image: "/images/buttoning_thread_color/904.jpg" },
  { id: "thread-968",  label: "968",  image: "/images/buttoning_thread_color/968.jpg" },
  { id: "thread-999",  label: "999",  image: "/images/buttoning_thread_color/999.jpg" },
  { id: "thread-1823", label: "1823", image: "/images/buttoning_thread_color/1823.jpg" },
  { id: "thread-3894", label: "3894", image: "/images/buttoning_thread_color/3894.jpg" },
  { id: "thread-6415", label: "6415", image: "/images/buttoning_thread_color/6415.jpg" },
  { id: "thread-8617", label: "8617", image: "/images/buttoning_thread_color/8617.jpg" },
  { id: "thread-yz008", label: "YZ008", image: "/images/buttoning_thread_color/yz008.jpg" },
  { id: "thread-yz010", label: "YZ010", image: "/images/buttoning_thread_color/yz010.jpg" },
  { id: "thread-yz011", label: "YZ011", image: "/images/buttoning_thread_color/yz011.jpg" },
  { id: "thread-yz012", label: "YZ012", image: "/images/buttoning_thread_color/yz012.jpg" },
  { id: "thread-yz014", label: "YZ014", image: "/images/buttoning_thread_color/yz014.jpg" },
  { id: "thread-yz015", label: "YZ015", image: "/images/buttoning_thread_color/yz015.jpg" },
  { id: "thread-yz016", label: "YZ016", image: "/images/buttoning_thread_color/yz016.jpg" },
  { id: "thread-yz017", label: "YZ017", image: "/images/buttoning_thread_color/yz017.jpg" },
  { id: "thread-yz018", label: "YZ018", image: "/images/buttoning_thread_color/yz018.jpg" },
  { id: "thread-yz019", label: "YZ019", image: "/images/buttoning_thread_color/yz019.jpg" },
  { id: "thread-yz021", label: "YZ021", image: "/images/buttoning_thread_color/yz021.jpg" },
  { id: "thread-yz022", label: "YZ022", image: "/images/buttoning_thread_color/yz022.jpg" },
  { id: "thread-yz024", label: "YZ024", image: "/images/buttoning_thread_color/yz024.jpg" },
  { id: "thread-yz025", label: "YZ025", image: "/images/buttoning_thread_color/yz025.jpg" },
  { id: "thread-yz026", label: "YZ026", image: "/images/buttoning_thread_color/yz026.jpg" },
  { id: "thread-yz027", label: "YZ027", image: "/images/buttoning_thread_color/yz027.jpg" },
  { id: "thread-yz028", label: "YZ028", image: "/images/buttoning_thread_color/yz028.jpg" },
  { id: "thread-yz029", label: "YZ029", image: "/images/buttoning_thread_color/yz029.jpg" },
  { id: "thread-yz030", label: "YZ030", image: "/images/buttoning_thread_color/yz030.jpg" },
  { id: "thread-yz031", label: "YZ031", image: "/images/buttoning_thread_color/yz031.jpg" },
  { id: "thread-yz032", label: "YZ032", image: "/images/buttoning_thread_color/yz032.jpg" },
  { id: "thread-yz034", label: "YZ034", image: "/images/buttoning_thread_color/yz034.jpg" },
  { id: "thread-yz035", label: "YZ035", image: "/images/buttoning_thread_color/yz035.jpg" },
  { id: "thread-yz037", label: "YZ037", image: "/images/buttoning_thread_color/yz037.jpg" },
  { id: "thread-yz040", label: "YZ040", image: "/images/buttoning_thread_color/yz040.jpg" },
  { id: "thread-yz041", label: "YZ041", image: "/images/buttoning_thread_color/yz041.jpg" },
  { id: "thread-yz042", label: "YZ042", image: "/images/buttoning_thread_color/yz042.jpg" },
  { id: "thread-yz045", label: "YZ045", image: "/images/buttoning_thread_color/yz045.jpg" },
  { id: "thread-yz049", label: "YZ049", image: "/images/buttoning_thread_color/yz049.jpg" },
  { id: "thread-yz050", label: "YZ050", image: "/images/buttoning_thread_color/yz050.jpg" },
  { id: "thread-yz053", label: "YZ053", image: "/images/buttoning_thread_color/yz053.jpg" },
  { id: "thread-yz054", label: "YZ054", image: "/images/buttoning_thread_color/yz054.jpg" },
];

/* ─── Monogram placements per product ────────────────────────── */
export const monogramPlacements: Record<string, string[]> = {
  shirt: ["Cuff (Right)", "Cuff (Left)", "Collar Stand", "Front Placket (Lower)", "Chest Pocket", "Back Collar"],
  trousers: ["Waistband (Inner)", "Pocket Lining", "Below Waistband (Front)"],
  "suit-2pc": ["Breast Pocket", "Cuff Lining", "Inner Breast Pocket", "Collar Stand", "Lower Jacket"],
  "suit-3pc": ["Breast Pocket", "Cuff Lining", "Inner Breast Pocket", "Collar Stand", "Vest Breast Pocket"],
  vest: ["Breast Pocket", "Inner Lining", "Lower Pocket Welt", "Back Panel"],
  "sport-coat": ["Breast Pocket", "Cuff Lining", "Inner Breast Pocket", "Elbow Patch Area"],
};

/* ─── Jacket finished measurement spec ───────────────────────── */
export type JacketMeasField = {
  key: string;
  label: string;
  required: boolean;
  unit: "CM/INCH" | "CM" | "none";
};

export const jacketMeasurementFields: JacketMeasField[] = [
  { key: "height",                 label: "Height",                    required: false, unit: "CM/INCH" },
  { key: "weight",                 label: "Weight",                    required: false, unit: "CM/INCH" },
  { key: "age",                    label: "Age",                       required: false, unit: "none"    },
  { key: "full_chest_finished",    label: "Full Chest (Finished)",     required: true,  unit: "CM/INCH" },
  { key: "full_stomach_finished",  label: "Full Stomach (Finished)",   required: true,  unit: "CM/INCH" },
  { key: "full_belly_finished",    label: "Full Belly (Finished)",     required: false, unit: "CM/INCH" },
  { key: "full_seat_finished",     label: "Full Seat (Finished)",      required: true,  unit: "CM/INCH" },
  { key: "full_bicep_finished",    label: "Full Bicep (Finished)",     required: false, unit: "CM/INCH" },
  { key: "full_cuff_finished",     label: "Full Cuff (Finished)",      required: false, unit: "CM/INCH" },
  { key: "shoulder_width_finished",label: "Shoulder Width (Finished)", required: true,  unit: "CM/INCH" },
  { key: "back_width_finished",    label: "Back Width (Finished)",     required: false, unit: "CM/INCH" },
  { key: "left_sleeve_finished",   label: "Left Sleeve (Finished)",    required: true,  unit: "CM/INCH" },
  { key: "right_sleeve_finished",  label: "Right Sleeve (Finished)",   required: true,  unit: "CM/INCH" },
  { key: "back_length_finished",   label: "Back Length (Finished)",    required: true,  unit: "CM/INCH" },
  { key: "front_length_finished",  label: "Front Length (Finished)",   required: false, unit: "CM/INCH" },
  { key: "neckline_body",          label: "Neckline (Body)",           required: false, unit: "CM/INCH" },
  { key: "first_button_stance",    label: "First Button Stance",       required: false, unit: "CM/INCH" },
];

export const jacketChestAllowanceOptions = ["8", "9", "10", "12", "14", "16"];

export const jacketWearingHabitOptions = [
  { id: "only-shirt",        label: "Only Shirt" },
  { id: "shirt-and-vest",    label: "Shirt and Vest" },
  { id: "shirt-and-sweater", label: "Shirt and Sweater" },
];

/* ─── Shirt measurement spec (factory spec) ──────────────────── */
export type ShirtMeasField = {
  key: string;
  label: string;
  required: boolean;
  hasFinishedPair: boolean;
  ease: number; // cm ease added to body value → finished size
};

export const shirtMeasurementFields: ShirtMeasField[] = [
  { key: "height",             label: "Height",                      required: true,  hasFinishedPair: true,  ease: 0 },
  { key: "weight",             label: "Weight",                      required: false, hasFinishedPair: false, ease: 0 },
  { key: "neck_body",          label: "Neck (Body)",                 required: true,  hasFinishedPair: true,  ease: 1.5 },
  { key: "chest_body",         label: "Chest (Body)",                required: true,  hasFinishedPair: true,  ease: 0 }, // uses chestAllowance
  { key: "stomach_body",       label: "Stomach (Body)",              required: true,  hasFinishedPair: true,  ease: 4 },
  { key: "belly_body",         label: "Belly (Body)",                required: false, hasFinishedPair: true,  ease: 3 },
  { key: "seat_body",          label: "Seat (Body)",                 required: true,  hasFinishedPair: true,  ease: 3 },
  { key: "back_shoulder",      label: "Back Shoulder",               required: true,  hasFinishedPair: true,  ease: 1 },
  { key: "bicep_body",         label: "Bicep (Body)",                required: true,  hasFinishedPair: true,  ease: 5 },
  { key: "left_wrist_body",    label: "Left Wrist (Body)",           required: true,  hasFinishedPair: true,  ease: 3 },
  { key: "right_wrist_body",   label: "Right Wrist (Body)",          required: true,  hasFinishedPair: true,  ease: 3 },
  { key: "left_sleeve",        label: "Left Sleeve",                 required: true,  hasFinishedPair: true,  ease: 1.5 },
  { key: "right_sleeve",       label: "Right Sleeve",                required: true,  hasFinishedPair: true,  ease: 1.5 },
  { key: "nape_to_waist_body", label: "Nape to Waist Length (Body)", required: true,  hasFinishedPair: true,  ease: 0 },
  { key: "front_to_waist_body",label: "Front to Waist Length (Body)",required: true,  hasFinishedPair: true,  ease: 0 },
  { key: "back_length",        label: "Back Length",                 required: true,  hasFinishedPair: true,  ease: 0 },
];

export const chestAllowanceOptions = ["6","7","8","9","10","11","12","13","14","15","16"];

export const wearingHabitOptions = [
  { id: "tucked",   label: "Tucked In" },
  { id: "untucked", label: "Untucked / Casual" },
  { id: "both",     label: "Both Ways" },
];

/* ─── Measurement fields per product ─────────────────────────── */
export const productMeasurements: Record<string, { key: string; label: string; placeholder: string; group: string }[]> = {
  shirt: [
    { key: "neck", label: "Neck", placeholder: "e.g. 15.5 in", group: "body" },
    { key: "chest", label: "Chest", placeholder: "e.g. 40 in", group: "body" },
    { key: "waist", label: "Waist", placeholder: "e.g. 34 in", group: "body" },
    { key: "hips", label: "Hips / Seat", placeholder: "e.g. 40 in", group: "body" },
    { key: "shoulder", label: "Shoulder Width", placeholder: "e.g. 18 in", group: "body" },
    { key: "sleeve", label: "Sleeve Length", placeholder: "e.g. 33 in", group: "body" },
    { key: "backLength", label: "Back Length", placeholder: "e.g. 31 in", group: "body" },
    { key: "bicep", label: "Bicep", placeholder: "e.g. 14 in", group: "finished" },
    { key: "wrist", label: "Wrist", placeholder: "e.g. 7 in", group: "finished" },
    { key: "frontLength", label: "Front Length", placeholder: "e.g. 29 in", group: "finished" },
  ],
  trousers: [
    { key: "waist", label: "Waist", placeholder: "e.g. 34 in", group: "body" },
    { key: "seat", label: "Seat / Hip", placeholder: "e.g. 42 in", group: "body" },
    { key: "thigh", label: "Thigh", placeholder: "e.g. 24 in", group: "body" },
    { key: "rise", label: "Rise (Crotch)", placeholder: "e.g. 12 in", group: "body" },
    { key: "inseam", label: "Inseam", placeholder: "e.g. 31 in", group: "body" },
    { key: "outseam", label: "Outseam", placeholder: "e.g. 43 in", group: "finished" },
    { key: "knee", label: "Knee Width", placeholder: "e.g. 18 in", group: "finished" },
    { key: "legOpening", label: "Leg Opening", placeholder: "e.g. 17 in", group: "finished" },
    { key: "calf", label: "Calf", placeholder: "e.g. 16 in", group: "body" },
  ],
  "suit-2pc": [
    { key: "chest", label: "Chest", placeholder: "e.g. 40 in", group: "body" },
    { key: "waist", label: "Waist", placeholder: "e.g. 34 in", group: "body" },
    { key: "seat", label: "Seat", placeholder: "e.g. 42 in", group: "body" },
    { key: "shoulder", label: "Shoulder Width", placeholder: "e.g. 18 in", group: "body" },
    { key: "sleeve", label: "Sleeve Length", placeholder: "e.g. 33 in", group: "body" },
    { key: "backLength", label: "Jacket Back Length", placeholder: "e.g. 31 in", group: "body" },
    { key: "bicep", label: "Bicep", placeholder: "e.g. 14 in", group: "body" },
    { key: "trouserWaist", label: "Trouser Waist", placeholder: "e.g. 34 in", group: "body" },
    { key: "inseam", label: "Inseam", placeholder: "e.g. 31 in", group: "body" },
    { key: "thigh", label: "Thigh", placeholder: "e.g. 24 in", group: "body" },
    { key: "legOpening", label: "Leg Opening", placeholder: "e.g. 17 in", group: "finished" },
  ],
  "suit-3pc": [
    { key: "chest", label: "Chest", placeholder: "e.g. 40 in", group: "body" },
    { key: "waist", label: "Waist", placeholder: "e.g. 34 in", group: "body" },
    { key: "seat", label: "Seat", placeholder: "e.g. 42 in", group: "body" },
    { key: "shoulder", label: "Shoulder Width", placeholder: "e.g. 18 in", group: "body" },
    { key: "sleeve", label: "Sleeve Length", placeholder: "e.g. 33 in", group: "body" },
    { key: "backLength", label: "Jacket Back Length", placeholder: "e.g. 31 in", group: "body" },
    { key: "bicep", label: "Bicep", placeholder: "e.g. 14 in", group: "body" },
    { key: "trouserWaist", label: "Trouser Waist", placeholder: "e.g. 34 in", group: "body" },
    { key: "inseam", label: "Inseam", placeholder: "e.g. 31 in", group: "body" },
    { key: "thigh", label: "Thigh", placeholder: "e.g. 24 in", group: "body" },
    { key: "vestChest", label: "Vest Chest", placeholder: "e.g. 40 in", group: "body" },
    { key: "vestLength", label: "Vest Length", placeholder: "e.g. 17 in", group: "finished" },
  ],
  vest: [
    { key: "chest", label: "Chest", placeholder: "e.g. 40 in", group: "body" },
    { key: "waist", label: "Waist", placeholder: "e.g. 34 in", group: "body" },
    { key: "hips", label: "Hips", placeholder: "e.g. 40 in", group: "body" },
    { key: "frontLength", label: "Front Length", placeholder: "e.g. 17 in", group: "finished" },
    { key: "backLength", label: "Back Length", placeholder: "e.g. 20 in", group: "finished" },
    { key: "shoulder", label: "Shoulder Width", placeholder: "e.g. 18 in", group: "body" },
  ],
  "sport-coat": [
    { key: "chest", label: "Chest", placeholder: "e.g. 40 in", group: "body" },
    { key: "waist", label: "Waist", placeholder: "e.g. 34 in", group: "body" },
    { key: "seat", label: "Seat", placeholder: "e.g. 42 in", group: "body" },
    { key: "shoulder", label: "Shoulder Width", placeholder: "e.g. 18 in", group: "body" },
    { key: "sleeve", label: "Sleeve Length", placeholder: "e.g. 33 in", group: "body" },
    { key: "backLength", label: "Back Length", placeholder: "e.g. 31 in", group: "body" },
    { key: "bicep", label: "Bicep", placeholder: "e.g. 14 in", group: "body" },
  ],
};

/* ─── Standard sizes per product ─────────────────────────────── */
export const standardSizes: Record<string, string[]> = {
  shirt: ["14 / 32–33", "14.5 / 32–33", "15 / 32–33", "15 / 33–34", "15.5 / 32–33", "15.5 / 33–34", "15.5 / 34–35", "16 / 33–34", "16 / 34–35", "16.5 / 33–34", "16.5 / 34–35", "17 / 34–35", "17 / 35–36", "17.5 / 34–35", "18 / 35–36"],
  trousers: ["28×30", "28×32", "30×30", "30×32", "32×30", "32×32", "32×34", "34×30", "34×32", "34×34", "36×30", "36×32", "36×34", "38×30", "38×32", "40×32"],
  "suit-2pc": ["36S", "36R", "36L", "38S", "38R", "38L", "40S", "40R", "40L", "42S", "42R", "42L", "44R", "44L", "46R", "48R"],
  "suit-3pc": ["36S", "36R", "36L", "38S", "38R", "38L", "40S", "40R", "40L", "42S", "42R", "42L", "44R", "44L", "46R", "48R"],
  vest: ["36", "38", "40", "42", "44", "46", "48"],
  "sport-coat": ["36S", "36R", "38S", "38R", "40S", "40R", "40L", "42S", "42R", "42L", "44R", "46R"],
};

/* ─── Posture adjustment fields ──────────────────────────────── */
export const postureFields = [
  {
    id: "general-posture",
    label: "General Posture",
    options: [
      { id: "posture-neutral", label: "Neutral / Balanced", description: "Standard posture — balanced alignment." },
      { id: "posture-forward", label: "Forward Lean", description: "Slight forward tilt — active or rounded back." },
      { id: "posture-upright", label: "Upright / Military", description: "Very erect posture — formal bearing." },
      { id: "posture-hollow-back", label: "Hollow Back (Lordosis)", description: "Pronounced lower back curve." },
      { id: "posture-humpback", label: "Humpback (Kyphosis)", description: "Upper back curvature at shoulder blade." },
    ],
  },
  {
    id: "shoulder-left",
    label: "Left Shoulder Slope",
    options: [
      { id: "shl-left-normal", label: "Normal", description: "Standard slope." },
      { id: "shl-left-slight", label: "Slightly Sloped", description: "Slight drop, minimal adjustment needed." },
      { id: "shl-left-moderate", label: "Moderately Sloped", description: "Notable slope — requires padding/adjustment." },
      { id: "shl-left-heavy", label: "Heavily Sloped", description: "Significant drop — major block adjustment." },
    ],
  },
  {
    id: "shoulder-right",
    label: "Right Shoulder Slope",
    options: [
      { id: "shl-right-normal", label: "Normal", description: "Standard slope." },
      { id: "shl-right-slight", label: "Slightly Sloped", description: "Slight drop." },
      { id: "shl-right-moderate", label: "Moderately Sloped", description: "Notable slope." },
      { id: "shl-right-heavy", label: "Heavily Sloped", description: "Significant drop." },
    ],
  },
  {
    id: "chest-shape",
    label: "Chest Shape",
    options: [
      { id: "chest-normal", label: "Normal", description: "Standard chest depth." },
      { id: "chest-prominent", label: "Prominent / Full Chest", description: "Fuller chest — front length adjustment." },
      { id: "chest-concave", label: "Concave / Hollow Chest", description: "Recessed chest — front suppressed." },
      { id: "chest-pigeon", label: "Pigeon Chest", description: "Protruding sternum — forward-break adjustment." },
    ],
  },
  {
    id: "back-blade",
    label: "Shoulder Blade / Bladebone",
    options: [
      { id: "blade-normal", label: "Normal", description: "Standard bladebone prominence." },
      { id: "blade-prominent", label: "Prominent Bladebones", description: "Protruding shoulder blades — back adjustment." },
      { id: "blade-flat", label: "Flat Back", description: "Very flat back — minimal back ease needed." },
    ],
  },
  {
    id: "belly",
    label: "Belly / Abdomen",
    options: [
      { id: "belly-flat", label: "Flat / Athletic", description: "Minimal abdominal prominence." },
      { id: "belly-normal", label: "Normal", description: "Standard abdomen." },
      { id: "belly-slight", label: "Slight Prominence", description: "Slight front roundness — minor adjustment." },
      { id: "belly-prominent", label: "Prominent Belly", description: "Notable belly — front length and side seam adjustment." },
    ],
  },
  {
    id: "arms",
    label: "Arm Alignment",
    options: [
      { id: "arm-normal", label: "Normal", description: "Arms hang straight." },
      { id: "arm-forward", label: "Arms Forward (Hunched)", description: "Arms angle forward — sleeve pitch adjustment." },
      { id: "arm-diverge", label: "Arms Diverge Outward", description: "Arms angle outward — sleeve pitch outward." },
    ],
  },
  {
    id: "neck-thickness",
    label: "Neck Thickness",
    options: [
      { id: "neck-normal", label: "Normal Neck", description: "Standard neck circumference." },
      { id: "neck-thick", label: "Thick Neck", description: "Fuller neck — collar stand height / opening adjustment." },
      { id: "neck-thin", label: "Thin Neck", description: "Narrower neck — collar stand adjustment." },
    ],
  },
  {
    id: "hip-shape",
    label: "Hip Shape",
    options: [
      { id: "hip-normal", label: "Normal", description: "Standard hip proportion." },
      { id: "hip-flat", label: "Flat Hips", description: "Minimal hip curve — trouser seat adjustment." },
      { id: "hip-full", label: "Full Hips", description: "Generous hip — seat ease adjustment." },
    ],
  },
];
