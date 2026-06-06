"use client";

import { useBuilderStore } from "@/store/builderStore";

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

      {/* Action buttons */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={onComplete}
          disabled={!allAnswered}
          className={`rounded-full px-8 py-3 font-sans text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
            allAnswered
              ? "bg-gold text-background hover:opacity-90 active:scale-[0.98]"
              : "cursor-not-allowed bg-gold/30 text-background/50"
          }`}
        >
          Continue to Design
          <svg className="ml-2 inline-block" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleSkipAll}
          className="font-sans text-sm text-slate transition-colors hover:text-muted-dark focus-visible:outline-none"
        >
          Show all options →
        </button>
      </div>

      {/* Progress indicator */}
      {answeredCount > 0 && !allAnswered && (
        <p className="font-sans text-xs text-dim">
          {answeredCount} of {questions.length} answered — answer all questions to continue
        </p>
      )}
    </div>
  );
}
