/* ─── The Gentleman's Wardrobe Questionnaire ────────────────────────────────
   A wardrobe-planning intake, distinct from the single-garment consultation
   form. The customer describes his life, his existing wardrobe, his fit
   frustrations and his taste; the atelier uses it to plan a set of
   commissions rather than one piece.

   The definition is data: the public form, the admin listing and the email
   notification all render from this file, so adding a question is a
   one-place change. Garment, colour, pattern, finish and occasion options are
   derived from the builder registries in ./builder.ts rather than retyped. */

import { builderProducts, fabricQuiz, fabrics } from "./builder";

export type WardrobeOption = { id: string; label: string; sub?: string };

export type WardrobeQuestion =
  | {
      key: string;
      type: "single" | "multi";
      label: string;
      help?: string;
      required?: boolean;
      options: WardrobeOption[];
    }
  | {
      key: string;
      type: "text" | "textarea";
      label: string;
      help?: string;
      required?: boolean;
      placeholder?: string;
    }
  | {
      key: string;
      type: "scale";
      label: string;
      help?: string;
      required?: boolean;
      /** Labels for the low and high ends of the 1–5 scale. */
      low: string;
      high: string;
    };

export type WardrobeSection = {
  id: string;
  title: string;
  intro: string;
  questions: WardrobeQuestion[];
};

export type WardrobeAnswer = string | string[];
export type WardrobeAnswers = Record<string, WardrobeAnswer>;

export type WardrobeQuestionnaireStatus =
  | "New"
  | "Contacted"
  | "Scheduled"
  | "Completed"
  | "Cancelled";

export const WARDROBE_STATUSES: WardrobeQuestionnaireStatus[] = [
  "New",
  "Contacted",
  "Scheduled",
  "Completed",
  "Cancelled",
];

export type WardrobeQuestionnaireSubmission = {
  id: string;
  createdAt: string;
  status: WardrobeQuestionnaireStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  answers: WardrobeAnswers;
};

/** Data-store key. Distinct from "consultations" so the two lead types never mix. */
export const WARDROBE_STORE_KEY = "wardrobe-questionnaires";
export const WARDROBE_ID_PREFIX = "WQ-";

/* ─── Derived option lists ───────────────────────────────────────────────── */

function quizAnswers(key: (typeof fabricQuiz)[number]["key"]): WardrobeOption[] {
  const step = fabricQuiz.find((s) => s.key === key);
  if (!step) return [];
  return step.answers
    .filter((a) => a.id !== "any")
    .map((a) => ({ id: a.id, label: a.label, sub: a.description }));
}

const GARMENT_OPTIONS: WardrobeOption[] = [
  ...builderProducts.map((p) => ({ id: p.id, label: p.label })),
  // Pieces the atelier plans around but the builder does not yet configure.
  { id: "tuxedo", label: "Tuxedo / Dinner Jacket" },
  { id: "overcoat", label: "Overcoat / Topcoat" },
];

const OCCASION_LABELS: Record<string, { label: string; sub: string }> = {
  business: { label: "Business", sub: "Office, meetings, client dinners." },
  formal:   { label: "Formal",   sub: "Black tie, galas, ceremonies." },
  wedding:  { label: "Weddings", sub: "Your own or as a guest or groomsman." },
  casual:   { label: "Smart Casual", sub: "Weekends, dinners, travel." },
};

/** Occasions come from the fabric registry's `occasion` tags, in first-seen order. */
const FABRIC_OCCASIONS: WardrobeOption[] = Array.from(
  new Set(fabrics.flatMap((f) => f.occasion ?? []))
).map((id) => ({
  id,
  label: OCCASION_LABELS[id]?.label ?? id,
  sub: OCCASION_LABELS[id]?.sub,
}));

const OCCASION_OPTIONS: WardrobeOption[] = [
  ...FABRIC_OCCASIONS,
  { id: "worship", label: "Church & Worship", sub: "Sunday service, ministry, speaking." },
  { id: "speaking", label: "Public Speaking", sub: "Stage, podium, camera." },
  { id: "travel", label: "Travel", sub: "Pieces that pack and recover well." },
];

const COLOR_OPTIONS = quizAnswers("color");
const PATTERN_OPTIONS = quizAnswers("pattern");
const FINISH_OPTIONS = quizAnswers("finish");

/* ─── The questionnaire ──────────────────────────────────────────────────── */

export const WARDROBE_SECTIONS: WardrobeSection[] = [
  {
    id: "life",
    title: "Your Life",
    intro: "A wardrobe is built around the days you actually live. Tell us what those look like.",
    questions: [
      {
        key: "profession",
        type: "text",
        label: "What do you do?",
        placeholder: "e.g. Attorney, Pastor, Founder, Physician…",
      },
      {
        key: "dressCode",
        type: "single",
        label: "How do you dress on a typical working day?",
        required: true,
        options: [
          { id: "suit-daily", label: "Suit & tie every day", sub: "Full tailoring is the uniform." },
          { id: "jacket-most-days", label: "Jacket most days", sub: "Sport coat or blazer, tie optional." },
          { id: "smart-casual", label: "Smart casual", sub: "Trousers and a good shirt; a jacket when it counts." },
          { id: "casual", label: "Mostly casual", sub: "Tailoring is for occasions, not weekdays." },
          { id: "varies", label: "It varies", sub: "Different days call for different levels." },
        ],
      },
      {
        key: "occasions",
        type: "multi",
        label: "Which occasions does your wardrobe need to serve?",
        help: "Select all that apply.",
        required: true,
        options: OCCASION_OPTIONS,
      },
      {
        key: "upcomingEvents",
        type: "textarea",
        label: "Any specific occasions in the next twelve months?",
        placeholder: "A wedding in June, a conference keynote in the fall, a new role starting in January…",
      },
      {
        key: "climate",
        type: "single",
        label: "What climate do you dress for?",
        options: [
          { id: "hot", label: "Warm most of the year", sub: "Breathable cloths, lighter construction." },
          { id: "four-seasons", label: "Four distinct seasons", sub: "Flannel in winter, linen in summer." },
          { id: "cold", label: "Cold most of the year", sub: "Weight and warmth take priority." },
          { id: "travel", label: "I move between climates", sub: "Versatile year-round cloths." },
        ],
      },
    ],
  },
  {
    id: "wardrobe",
    title: "Your Wardrobe Today",
    intro: "Before we add, we look at what you already own and how it serves you.",
    questions: [
      {
        key: "ownedGarments",
        type: "multi",
        label: "Which of these do you already own and wear?",
        help: "Select all that apply.",
        options: GARMENT_OPTIONS,
      },
      {
        key: "wardrobeSatisfaction",
        type: "scale",
        label: "How well does your current wardrobe serve you?",
        low: "Nothing works",
        high: "Nearly complete",
      },
      {
        key: "fitIssues",
        type: "multi",
        label: "Where does off-the-rack fit let you down?",
        help: "Select all that apply. This shapes how we cut for you.",
        options: [
          { id: "shoulders", label: "Shoulders", sub: "Too wide, too narrow, or divots." },
          { id: "sleeves", label: "Sleeve length", sub: "Too long or too short." },
          { id: "chest-waist", label: "Chest vs. waist", sub: "Fits one, not the other." },
          { id: "jacket-length", label: "Jacket length", sub: "Too long or too short." },
          { id: "seat-thigh", label: "Seat & thigh", sub: "Trousers pull or bag." },
          { id: "trouser-length", label: "Trouser length", sub: "Always needs altering." },
          { id: "collar", label: "Shirt collar", sub: "Gaps or chokes." },
          { id: "shirt-body", label: "Shirt body", sub: "Billows at the waist." },
          { id: "none", label: "No major issues", sub: "Fit is fine; I want better." },
        ],
      },
      {
        key: "wardrobeGaps",
        type: "textarea",
        label: "What is missing, or not working, in your wardrobe?",
        placeholder: "e.g. I have one navy suit that does everything. I own no proper trousers. My shirts never fit in the collar…",
      },
    ],
  },
  {
    id: "style",
    title: "Style & Fit",
    intro: "There is no wrong answer here. The point is to cut for the man you are, not a trend.",
    questions: [
      {
        key: "styleDirection",
        type: "single",
        label: "Which direction describes your taste?",
        required: true,
        options: [
          { id: "classic", label: "Classic & Timeless", sub: "Understated, proportioned, permanent." },
          { id: "modern", label: "Modern & Sharp", sub: "Clean lines, closer fit, considered detail." },
          { id: "soft", label: "Relaxed & Soft", sub: "Unstructured shoulders, easy drape." },
          { id: "bold", label: "Bold & Expressive", sub: "Pattern, colour, statement details." },
          { id: "guide-me", label: "Not sure. Guide me.", sub: "Let the tailor lead." },
        ],
      },
      {
        key: "fitPreference",
        type: "single",
        label: "How close do you like your clothes to fit?",
        required: true,
        options: [
          { id: "slim", label: "Slim", sub: "Close to the body, minimal excess." },
          { id: "tailored", label: "Tailored", sub: "Follows the body with room to breathe." },
          { id: "classic", label: "Classic", sub: "Generous, comfortable, traditional." },
          { id: "unsure", label: "Not sure", sub: "Show me the difference in person." },
        ],
      },
      {
        key: "colors",
        type: "multi",
        label: "Which colours do you reach for?",
        help: "Select all that apply.",
        options: COLOR_OPTIONS,
      },
      {
        key: "patterns",
        type: "multi",
        label: "Which patterns do you enjoy wearing?",
        help: "Select all that apply.",
        options: PATTERN_OPTIONS,
      },
      {
        key: "fabricFeel",
        type: "multi",
        label: "What do you like a cloth to feel like?",
        help: "Select all that apply.",
        options: FINISH_OPTIONS,
      },
      {
        key: "styleReferences",
        type: "text",
        label: "Anyone whose style you admire?",
        placeholder: "A public figure, a film, a grandfather, a brand…",
      },
    ],
  },
  {
    id: "plan",
    title: "Building the Wardrobe",
    intro: "A bespoke wardrobe is assembled over time. Tell us where to begin and how fast to move.",
    questions: [
      {
        key: "priorities",
        type: "multi",
        label: "Which pieces would you like to commission first?",
        help: "Select all that apply. We will sequence them with you.",
        required: true,
        options: GARMENT_OPTIONS,
      },
      {
        key: "timeline",
        type: "single",
        label: "When would you like the first piece?",
        required: true,
        options: [
          { id: "asap", label: "As soon as possible", sub: "There is a date on the calendar." },
          { id: "3-months", label: "Within three months" },
          { id: "6-months", label: "Three to six months" },
          { id: "year", label: "Over the next year", sub: "Steady, one piece at a time." },
          { id: "no-rush", label: "No rush", sub: "Planning ahead." },
        ],
      },
      {
        key: "budget",
        type: "single",
        label: "What investment are you planning over the next twelve months?",
        required: true,
        options: [
          { id: "under-2500", label: "Under $2,500" },
          { id: "2500-5000", label: "$2,500 – $5,000" },
          { id: "5000-10000", label: "$5,000 – $10,000" },
          { id: "10000-20000", label: "$10,000 – $20,000" },
          { id: "20000-plus", label: "$20,000+" },
        ],
      },
      {
        key: "personalTouches",
        type: "multi",
        label: "Which personal touches appeal to you?",
        help: "Select all that apply.",
        options: [
          { id: "monogram", label: "Monogram", sub: "Initials on cuff, chest, or lining." },
          { id: "scripture", label: "Scripture in the lining", sub: "A verse stitched where only you see it." },
          { id: "custom-lining", label: "Custom lining", sub: "Colour or print inside the jacket." },
          { id: "contrast-details", label: "Contrast details", sub: "Buttonholes, pick stitching, felt." },
          { id: "understated", label: "Keep it understated", sub: "The cut is the statement." },
        ],
      },
    ],
  },
  {
    id: "closing",
    title: "Anything Else",
    intro: "Whatever we have not asked that you think we should know.",
    questions: [
      {
        key: "notes",
        type: "textarea",
        label: "Notes for your tailor",
        placeholder: "Measurements you already have, health or mobility considerations, a story behind the commission…",
      },
      {
        key: "contactPreference",
        type: "single",
        label: "How should we follow up?",
        required: true,
        options: [
          { id: "email", label: "Email" },
          { id: "phone", label: "Phone call" },
          { id: "text", label: "Text message" },
        ],
      },
    ],
  },
];

export const WARDROBE_QUESTIONS: WardrobeQuestion[] = WARDROBE_SECTIONS.flatMap(
  (s) => s.questions
);

const QUESTION_BY_KEY = new Map(WARDROBE_QUESTIONS.map((q) => [q.key, q]));

export function getWardrobeQuestion(key: string): WardrobeQuestion | undefined {
  return QUESTION_BY_KEY.get(key);
}

/* ─── Validation & formatting (pure; safe on server and client) ───────────── */

const MAX_TEXT = 300;
const MAX_TEXTAREA = 4000;

/**
 * Keep only known questions with well-formed answers. Option ids are checked
 * against the definition, free text is trimmed and capped, scales must be
 * "1"–"5". Unknown keys are dropped so the stored record never carries
 * arbitrary client payloads.
 */
export function sanitizeWardrobeAnswers(input: unknown): WardrobeAnswers {
  const out: WardrobeAnswers = {};
  if (!input || typeof input !== "object") return out;
  const raw = input as Record<string, unknown>;

  for (const q of WARDROBE_QUESTIONS) {
    const v = raw[q.key];
    if (v === undefined || v === null) continue;

    switch (q.type) {
      case "single": {
        if (typeof v === "string" && q.options.some((o) => o.id === v)) out[q.key] = v;
        break;
      }
      case "multi": {
        if (!Array.isArray(v)) break;
        const ids = new Set(q.options.map((o) => o.id));
        const picked = Array.from(new Set(v.filter((x): x is string => typeof x === "string" && ids.has(x))));
        if (picked.length) out[q.key] = picked;
        break;
      }
      case "scale": {
        if (typeof v === "string" && /^[1-5]$/.test(v)) out[q.key] = v;
        break;
      }
      case "text":
      case "textarea": {
        if (typeof v !== "string") break;
        const s = v.trim().slice(0, q.type === "text" ? MAX_TEXT : MAX_TEXTAREA);
        if (s) out[q.key] = s;
        break;
      }
    }
  }
  return out;
}

/** Keys of required questions that have no answer. */
export function missingRequiredWardrobeAnswers(answers: WardrobeAnswers): string[] {
  return WARDROBE_QUESTIONS.filter((q) => {
    if (!q.required) return false;
    const v = answers[q.key];
    return v === undefined || (Array.isArray(v) ? v.length === 0 : v === "");
  }).map((q) => q.key);
}

/** Human-readable value for an answer: option ids become labels. */
export function formatWardrobeAnswer(key: string, value: WardrobeAnswer | undefined): string {
  if (value === undefined) return "";
  const q = QUESTION_BY_KEY.get(key);
  if (!q) return Array.isArray(value) ? value.join(", ") : value;

  if (q.type === "single" || q.type === "multi") {
    const label = (id: string) => q.options.find((o) => o.id === id)?.label ?? id;
    return Array.isArray(value) ? value.map(label).join(", ") : label(value);
  }
  if (q.type === "scale") {
    const s = Array.isArray(value) ? value[0] : value;
    return s ? `${s} / 5` : "";
  }
  return Array.isArray(value) ? value.join(", ") : value;
}

/** Sections with their answered questions, formatted for display. */
export function summarizeWardrobeAnswers(
  answers: WardrobeAnswers
): { section: WardrobeSection; rows: { key: string; label: string; value: string }[] }[] {
  return WARDROBE_SECTIONS.map((section) => ({
    section,
    rows: section.questions
      .map((q) => ({ key: q.key, label: q.label, value: formatWardrobeAnswer(q.key, answers[q.key]) }))
      .filter((r) => r.value !== ""),
  })).filter((s) => s.rows.length > 0);
}
