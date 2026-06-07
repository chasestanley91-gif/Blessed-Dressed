"use client";

import { useBuilderStore } from "@/store/builderStore";
import { getDNAEntries } from "@/lib/styleDNA";

// ─── Question definitions ────────────────────────────────────────────────────

type QuizOption = {
  value: string;
  label: string;
  description: string;
  icon: string; // emoji for quick visual cue
};

type Question = {
  key: string;
  question: string;
  options: QuizOption[];
};

// ── Shared style consultation questions (appended to product-specific ones) ──

const JACKET_STYLE_QUESTIONS: Question[] = [
  {
    key: "shoulderStyle",
    question: "How should your jacket sit on your shoulders?",
    options: [
      { value: "natural",     label: "Soft & Natural",       description: "Follows your shoulder's curve — Italian softness.", icon: "〜" },
      { value: "continental", label: "Continental Roll",      description: "Slight roll at the sleeve head — refined Italian style.", icon: "◒" },
      { value: "structured",  label: "Structured & Defined",  description: "Sharp British shoulder — authority and presence.", icon: "⊓" },
      { value: "neapolitan",  label: "Neapolitan",            description: "Hand-sewn shirred sleeve — the pinnacle of craft.", icon: "✦" },
    ],
  },
  {
    key: "ventStyle",
    question: "How do you move throughout your day?",
    options: [
      { value: "active",   label: "Active & Moving",    description: "Double vents — freedom of movement, easy sitting.", icon: "↔" },
      { value: "standing", label: "Mostly Standing",    description: "No vent — clean drape, classic silhouette.", icon: "▕" },
      { value: "seated",   label: "Frequent Sitting",   description: "Side vents — comfort without compromising the line.", icon: "⌐" },
    ],
  },
  {
    key: "pocketStyle",
    question: "How polished should the jacket appear?",
    options: [
      { value: "relaxed", label: "Relaxed",  description: "Flap pockets — natural and approachable.", icon: "◻" },
      { value: "formal",  label: "Formal",   description: "Jetted pockets — clean, minimal, ceremonial.", icon: "—" },
    ],
  },
  {
    key: "liningStyle",
    question: "How personal should this garment feel inside?",
    options: [
      { value: "classic",   label: "Classic",    description: "Half lining — traditional craftsmanship.", icon: "○" },
      { value: "statement", label: "Statement",  description: "Full lining — a signature interior that only you see.", icon: "◉" },
      { value: "minimal",   label: "Minimal",    description: "Quarter lining — lightweight and modern.", icon: "◌" },
    ],
  },
];

const SUIT_QUESTIONS: Question[] = [
  {
    key: "lapelFamily",
    question: "What lapel style are you drawn to?",
    options: [
      { value: "notch", label: "Notch", description: "Classic V-shaped notch — the timeless business choice.", icon: "◁" },
      { value: "peak", label: "Peak", description: "Sharp upward-pointing lapels — authority and formality.", icon: "△" },
      { value: "shawl", label: "Shawl", description: "Smooth rounded lapel — dinner jacket and black tie.", icon: "◡" },
      { value: "all", label: "Show all", description: "I'll explore every option myself.", icon: "⊞" },
    ],
  },
  {
    key: "breasting",
    question: "Single or double breasted?",
    options: [
      { value: "single", label: "Single Breasted", description: "One row of buttons — versatile and modern.", icon: "▏" },
      { value: "double", label: "Double Breasted", description: "Two overlapping button rows — bold and classic.", icon: "▎" },
      { value: "all", label: "Either", description: "Show me all buttoning options.", icon: "⊞" },
    ],
  },
  {
    key: "formality",
    question: "What is the primary occasion?",
    options: [
      { value: "formal", label: "Formal / Black Tie", description: "Events, weddings, galas — full bespoke construction.", icon: "✦" },
      { value: "business", label: "Business", description: "Office, meetings, everyday professional.", icon: "◈" },
      { value: "casual", label: "Smart Casual", description: "Weekends, dinners, relaxed occasions.", icon: "◇" },
    ],
  },
  ...JACKET_STYLE_QUESTIONS,
];

const SHIRT_QUESTIONS: Question[] = [
  {
    key: "collarFamily",
    question: "What collar style suits you?",
    options: [
      { value: "point", label: "Classic Point", description: "Traditional long or medium points — the dress shirt staple.", icon: "▽" },
      { value: "cutaway", label: "Spread & Cutaway", description: "Wide spread — modern, confident, works with a tie knot.", icon: "◁▷" },
      { value: "casual", label: "Casual", description: "Button-down, Cuban, mandarin — relaxed and expressive.", icon: "◌" },
      { value: "all", label: "Show all", description: "Show me the full collar library.", icon: "⊞" },
    ],
  },
  {
    key: "cuffFamily",
    question: "Preferred cuff style?",
    options: [
      { value: "button", label: "Button Cuff", description: "Classic barrel cuff — everyday elegance.", icon: "○" },
      { value: "french", label: "French / Double Cuff", description: "Folded back, worn with cufflinks — formal and refined.", icon: "◎" },
      { value: "all", label: "Either", description: "Show me all cuff options.", icon: "⊞" },
    ],
  },
];

const TROUSERS_QUESTIONS: Question[] = [
  {
    key: "pleatFamily",
    question: "Front pleat preference?",
    options: [
      { value: "flat", label: "Flat Front", description: "Clean and contemporary — slim silhouette.", icon: "—" },
      { value: "single", label: "Single Pleat", description: "One forward pleat — comfort with elegance.", icon: "⌇" },
      { value: "double", label: "Double Pleat", description: "Two pleats — classic tailored fullness.", icon: "⌇⌇" },
      { value: "all", label: "Show all", description: "Show every pleat and waistband option.", icon: "⊞" },
    ],
  },
];

const SPORT_COAT_QUESTIONS: Question[] = [
  {
    key: "lapelFamily",
    question: "What lapel style?",
    options: [
      { value: "notch", label: "Notch", description: "Relaxed and versatile — the sport coat standard.", icon: "◁" },
      { value: "peak", label: "Peak", description: "Elevated sport coat — a statement piece.", icon: "△" },
      { value: "all", label: "Either", description: "Show all lapel options.", icon: "⊞" },
    ],
  },
  {
    key: "formality",
    question: "How do you plan to wear it?",
    options: [
      { value: "business", label: "Smart / Dressed", description: "With dress trousers or odd trousers for work.", icon: "◈" },
      { value: "casual", label: "Casual", description: "Jeans, chinos — weekend and leisure wear.", icon: "◇" },
    ],
  },
  ...JACKET_STYLE_QUESTIONS,
];

const QUESTIONS_BY_PRODUCT: Record<string, Question[]> = {
  "suit-2pc": SUIT_QUESTIONS,
  "suit-3pc": SUIT_QUESTIONS,
  vest: SUIT_QUESTIONS.slice(2), // only formality for vest
  "sport-coat": SPORT_COAT_QUESTIONS,
  shirt: SHIRT_QUESTIONS,
  trousers: TROUSERS_QUESTIONS,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function StyleQuizStep({
  productSlug,
  onComplete,
}: {
  productSlug: string;
  onComplete: () => void;
}) {
  const { styleQuiz, setStyleQuiz, clearStyleQuiz } = useBuilderStore();
  const questions = QUESTIONS_BY_PRODUCT[productSlug] ?? SUIT_QUESTIONS;

  function handleSelect(key: string, value: string) {
    setStyleQuiz(key, value);
  }

  function handleSkipAll() {
    clearStyleQuiz();
    onComplete();
  }

  const answeredCount = questions.filter((q) => styleQuiz[q.key]).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div>
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Style Preferences</p>
        <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Let's narrow it down
        </h2>
        <p className="font-sans mt-1 text-sm text-muted-dark">
          Answer a few questions and we'll show only the options that match your style. You can always change these later.
        </p>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => {
        const selected = styleQuiz[q.key];
        const isActive = qi === 0 || questions.slice(0, qi).every((prev) => styleQuiz[prev.key]);

        return (
          <div
            key={q.key}
            className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-30 pointer-events-none"}`}
          >
            <p className="font-display mb-4 text-lg font-medium text-foreground">
              <span className="mr-2 font-sans text-[10px] uppercase tracking-[0.2em] text-slate">
                {qi + 1} of {questions.length}
              </span>
              {q.question}
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {q.options.map((opt) => {
                const isSelected = selected === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(q.key, opt.value)}
                    className={`group relative rounded-2xl border p-5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-[0.98] ${
                      isSelected
                        ? "border-gold bg-[#122742] shadow-[0_0_0_1px_#D4AF37]"
                        : "border-border-accent bg-surface-strong hover:border-gold/40 hover:bg-[#0B2035]"
                    }`}
                  >
                    {/* Icon */}
                    <span className={`mb-3 block font-sans text-2xl ${isSelected ? "text-gold" : "text-dim"}`}>
                      {opt.icon}
                    </span>

                    {/* Label */}
                    <p className={`font-sans text-sm font-semibold ${isSelected ? "text-gold" : "text-foreground"}`}>
                      {opt.label}
                    </p>

                    {/* Description */}
                    <p className="font-sans mt-1 text-xs leading-relaxed text-slate">
                      {opt.description}
                    </p>

                    {/* Check */}
                    {isSelected && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gold font-sans text-[10px] font-bold text-background">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Style DNA summary card — shown when all questions answered */}
      {allAnswered && (() => {
        const entries = getDNAEntries(styleQuiz);
        return entries.length > 0 ? (
          <div className="rounded-2xl border border-gold/30 bg-gold/5 px-6 py-5 space-y-4">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold">Your Style DNA</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {entries.map(({ section, value }) => (
                <div key={section}>
                  <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-slate">{section}</p>
                  <p className="font-sans text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onComplete}
              className="w-full rounded-full bg-gold px-8 py-3 font-sans text-sm font-semibold text-background transition-opacity hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Build My Garment →
            </button>
          </div>
        ) : null;
      })()}

      {/* Action buttons — shown while not all answered */}
      {!allAnswered && (
        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={onComplete}
            disabled
            className="cursor-not-allowed rounded-full bg-gold/30 px-8 py-3 font-sans text-sm font-semibold text-background/50"
          >
            Continue to Design
          </button>

          <button
            type="button"
            onClick={handleSkipAll}
            className="font-sans text-sm text-slate transition-colors hover:text-muted-dark focus-visible:outline-none"
          >
            Show all options →
          </button>
        </div>
      )}

      {/* Progress indicator */}
      {answeredCount > 0 && !allAnswered && (
        <p className="font-sans text-xs text-dim">
          {answeredCount} of {questions.length} answered — answer all questions to unlock your Style DNA
        </p>
      )}
    </div>
  );
}
