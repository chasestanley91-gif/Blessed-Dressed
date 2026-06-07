"use client";

import { useBuilderStore } from "@/store/builderStore";

type DiscoveryOption = {
  value: string;
  label: string;
  description: string;
  icon: string;
};

type DiscoveryQuestion = {
  key: string;
  question: string;
  options: DiscoveryOption[];
};

const DISCOVERY_QUESTIONS: DiscoveryQuestion[] = [
  {
    key: "occasion",
    question: "What will you primarily wear this for?",
    options: [
      { value: "formal",   label: "Formal & Black Tie",  description: "Galas, weddings, evenings — luxury construction.", icon: "✦" },
      { value: "wedding",  label: "Wedding",              description: "Your day, your statement — timeless and elevated.", icon: "◈" },
      { value: "business", label: "Work & Business",      description: "Office, meetings, everyday professional.", icon: "◉" },
      { value: "casual",   label: "Smart Casual",         description: "Dinners, weekends, relaxed occasions.", icon: "◇" },
      { value: "travel",   label: "Travel",               description: "Packs well, recovers fast, looks sharp.", icon: "◎" },
      { value: "any",      label: "Various Occasions",    description: "Show me fabrics that work anywhere.", icon: "⊞" },
    ],
  },
  {
    key: "color",
    question: "What color speaks to you?",
    options: [
      { value: "navy",     label: "Navy",     description: "Deep, confident, endlessly versatile.", icon: "◼" },
      { value: "grey",     label: "Grey",     description: "Refined and understated — the boardroom standard.", icon: "◻" },
      { value: "charcoal", label: "Charcoal", description: "Dark authority — between black and grey.", icon: "▪" },
      { value: "black",    label: "Black",    description: "Uncompromising formality.", icon: "◆" },
      { value: "brown",    label: "Brown / Earth", description: "Warm tones — casual richness.", icon: "◈" },
      { value: "cream",    label: "Cream / Ivory", description: "Light, warm, summer-ready.", icon: "○" },
      { value: "any",      label: "Open to anything", description: "Show me the full range.", icon: "⊞" },
    ],
  },
  {
    key: "weight",
    question: "How should it feel to wear?",
    options: [
      { value: "light",  label: "Light & Breathable", description: "Under 200gm — summer suiting and travel.", icon: "〜" },
      { value: "medium", label: "Year-Round",          description: "200–260gm — the versatile everyday weight.", icon: "◒" },
      { value: "heavy",  label: "Warm & Structured",  description: "260gm+ — autumn and winter tailoring.", icon: "⊓" },
      { value: "any",    label: "No preference",       description: "Show me all weights.", icon: "⊞" },
    ],
  },
  {
    key: "priority",
    question: "What matters most to you?",
    options: [
      { value: "luxury",       label: "Maximum Luxury",      description: "Premium mill wool — superior drape and softness.", icon: "✦" },
      { value: "breathability",label: "Breathability",        description: "Natural fibers that move air — linen and light weaves.", icon: "◌" },
      { value: "durability",   label: "Durability",           description: "Hard-wearing weaves that hold their shape.", icon: "◈" },
      { value: "any",          label: "Classic all-rounder",  description: "Show me everything — I'll decide from the cards.", icon: "⊞" },
    ],
  },
];

export default function FabricDiscovery({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { discoveryQuiz, setDiscoveryQuiz, clearDiscoveryQuiz } = useBuilderStore();

  function handleSelect(key: string, value: string) {
    setDiscoveryQuiz(key, value);
    // Auto-advance after last question
    const allKeys = DISCOVERY_QUESTIONS.map((q) => q.key);
    const newAnswers = { ...discoveryQuiz, [key]: value };
    if (allKeys.every((k) => newAnswers[k])) {
      onComplete();
    }
  }

  function handleSkip() {
    clearDiscoveryQuiz();
    onComplete();
  }

  const answeredCount = DISCOVERY_QUESTIONS.filter((q) => discoveryQuiz[q.key]).length;

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div>
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Fabric Consultation</p>
        <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Let's find your fabric
        </h2>
        <p className="font-sans mt-1 text-sm leading-[1.7] text-muted-dark">
          Four quick questions — we'll narrow the selection to fabrics that match your style, occasion, and preference.
        </p>
      </div>

      {/* Questions */}
      {DISCOVERY_QUESTIONS.map((q, qi) => {
        const selected = discoveryQuiz[q.key];
        const isActive = qi === 0 || DISCOVERY_QUESTIONS.slice(0, qi).every((prev) => discoveryQuiz[prev.key]);

        return (
          <div
            key={q.key}
            className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-30 pointer-events-none"}`}
          >
            <p className="font-display mb-4 text-lg font-medium text-foreground">
              <span className="mr-2 font-sans text-[10px] uppercase tracking-[0.2em] text-slate">
                {qi + 1} of {DISCOVERY_QUESTIONS.length}
              </span>
              {q.question}
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    <span className={`mb-3 block font-sans text-2xl ${isSelected ? "text-gold" : "text-dim"}`}>
                      {opt.icon}
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

      {answeredCount > 0 && answeredCount < DISCOVERY_QUESTIONS.length && (
        <p className="font-sans text-xs text-dim">
          {answeredCount} of {DISCOVERY_QUESTIONS.length} answered — we'll filter as you go
        </p>
      )}
    </div>
  );
}
