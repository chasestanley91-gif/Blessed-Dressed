"use client";

import { useBuilderStore } from "@/store/builderStore";
import { fabricQuiz } from "@/data/builder";

// Fabric discovery funnel — Color → Pattern → Weight → Finish → best matches.
// Questions come from the data-driven `fabricQuiz` config, not hardcoded here.

export default function FabricDiscovery({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { discoveryQuiz, setDiscoveryQuiz, clearDiscoveryQuiz } = useBuilderStore();

  function handleSelect(key: string, value: string) {
    setDiscoveryQuiz(key, value);
    const next = { ...discoveryQuiz, [key]: value };
    if (fabricQuiz.every((q) => next[q.key])) onComplete();
  }

  function handleSkip() {
    clearDiscoveryQuiz();
    onComplete();
  }

  const answeredCount = fabricQuiz.filter((q) => discoveryQuiz[q.key]).length;

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div>
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Fabric Consultation</p>
        <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Let&apos;s find your fabric
        </h2>
        <p className="font-sans mt-1 text-sm leading-[1.7] text-muted-dark">
          A few quick questions — we&apos;ll surface the fabrics that match your color, pattern, weight, and feel first. You can always browse the full library.
        </p>
      </div>

      {/* Questions */}
      {fabricQuiz.map((q, qi) => {
        const selected = discoveryQuiz[q.key];
        const isActive = qi === 0 || fabricQuiz.slice(0, qi).every((prev) => discoveryQuiz[prev.key]);

        return (
          <div
            key={q.key}
            className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-30 pointer-events-none"}`}
          >
            <p className="font-display mb-4 text-lg font-medium text-foreground">
              <span className="mr-2 font-sans text-[10px] uppercase tracking-[0.2em] text-slate">
                {qi + 1} of {fabricQuiz.length}
              </span>
              {q.question}
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {q.answers.map((opt) => {
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(q.key, opt.id)}
                    className={`group relative rounded-2xl border p-5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-[0.98] ${
                      isSelected
                        ? "border-gold bg-[#122742] shadow-[0_0_0_1px_#D4AF37]"
                        : "border-border-accent bg-surface-strong hover:border-gold/40 hover:bg-[#0B2035]"
                    }`}
                  >
                    <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full font-display text-base ${isSelected ? "bg-gold text-background" : "bg-[#0B2035] text-dim"}`}>
                      {opt.label.charAt(0)}
                    </span>
                    <p className={`font-sans text-sm font-semibold ${isSelected ? "text-gold" : "text-foreground"}`}>
                      {opt.label}
                    </p>
                    <p className="font-sans mt-1 text-xs leading-relaxed text-slate">
                      {opt.description}
                    </p>
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

      {/* Skip */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleSkip}
          className="font-sans text-sm text-slate transition-colors hover:text-muted-dark focus-visible:outline-none"
        >
          Show all fabrics →
        </button>
      </div>

      {answeredCount > 0 && answeredCount < fabricQuiz.length && (
        <p className="font-sans text-xs text-dim">
          {answeredCount} of {fabricQuiz.length} answered — we&apos;ll rank as you go
        </p>
      )}
    </div>
  );
}
