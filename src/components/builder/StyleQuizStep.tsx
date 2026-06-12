"use client";

import { useBuilderStore } from "@/store/builderStore";
import { getQuestionsForConfig, getDNAEntries } from "@/lib/quizEngine";
import type { ProductDesignConfig } from "@/data/options/types";

// ─── Component ───────────────────────────────────────────────────────────────
// Questions are generated dynamically from the live product config: any craft
// category (field) with >= 5 options and a quiz block becomes a discovery
// question. No hardcoded questions, categories, or options.

export default function StyleQuizStep({
  config,
  onComplete,
}: {
  config: ProductDesignConfig | null;
  onComplete: () => void;
}) {
  const { styleQuiz, setStyleQuiz, clearStyleQuiz } = useBuilderStore();
  const questions = getQuestionsForConfig(config);

  function handleSelect(key: string, value: string) {
    setStyleQuiz(key, value);
  }

  function handleSkipAll() {
    clearStyleQuiz();
    onComplete();
  }

  const answeredCount = questions.filter((q) => styleQuiz[q.key]).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  // No quizzable categories for this product — go straight to the full builder.
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Style Preferences</p>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
            Ready when you are
          </h2>
          <p className="font-sans mt-1 text-sm text-muted-dark">
            This garment doesn&apos;t need a style consultation — explore every option directly in the next step.
          </p>
        </div>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-full bg-gold px-8 py-3 font-sans text-sm font-semibold text-background transition-opacity hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Continue to Design →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div>
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Style Preferences</p>
        <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Let&apos;s narrow it down
        </h2>
        <p className="font-sans mt-1 text-sm text-muted-dark">
          Answer a few questions and we&apos;ll surface the options that match your style first. Nothing is hidden — you can always browse everything.
        </p>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => {
        const selected = styleQuiz[q.key];
        const isActive = qi === 0 || questions.slice(0, qi).every((prev) => styleQuiz[prev.key]);
        const hasImages = q.quiz.answers.some((a) => a.image);

        return (
          <div
            key={q.key}
            className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-30 pointer-events-none"}`}
          >
            <p className="font-display mb-4 text-lg font-medium text-foreground">
              <span className="mr-2 font-sans text-[10px] uppercase tracking-[0.2em] text-slate">
                {qi + 1} of {questions.length}
              </span>
              {q.quiz.question}
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {q.quiz.answers.map((opt) => {
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(q.key, opt.id)}
                    className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-[0.98] ${
                      isSelected
                        ? "border-gold bg-[#122742] shadow-[0_0_0_1px_#D4AF37]"
                        : "border-border-accent bg-surface-strong hover:border-gold/40 hover:bg-[#0B2035]"
                    }`}
                  >
                    {/* Visual: image card when an image exists, else a monogram chip */}
                    {hasImages ? (
                      opt.image ? (
                        <img
                          src={opt.image}
                          alt={opt.label}
                          className="mb-3 h-24 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <span className="mb-3 flex h-24 w-full items-center justify-center rounded-xl bg-[#0B2035] font-display text-2xl text-dim">
                          {opt.label.charAt(0)}
                        </span>
                      )
                    ) : (
                      <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full font-display text-base ${isSelected ? "bg-gold text-background" : "bg-[#0B2035] text-dim"}`}>
                        {opt.label.charAt(0)}
                      </span>
                    )}

                    {/* Label */}
                    <p className={`font-sans text-sm font-semibold ${isSelected ? "text-gold" : "text-foreground"}`}>
                      {opt.label}
                    </p>

                    {/* Description */}
                    {opt.description && (
                      <p className="font-sans mt-1 text-xs leading-relaxed text-slate">
                        {opt.description}
                      </p>
                    )}

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
        const entries = getDNAEntries(config, styleQuiz);
        return entries.length > 0 ? (
          <div className="rounded-2xl border border-gold/30 bg-gold/5 px-6 py-5 space-y-4">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold">Your Style DNA</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {entries.map(({ key, section, value }) => (
                <div key={key}>
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
