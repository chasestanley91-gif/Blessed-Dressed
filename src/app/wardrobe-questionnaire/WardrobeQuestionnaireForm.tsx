"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  WARDROBE_SECTIONS,
  missingRequiredWardrobeAnswers,
  type WardrobeAnswers,
  type WardrobeQuestion,
} from "@/data/wardrobe-questionnaire";

type Contact = { firstName: string; lastName: string; email: string; phone: string };

const EMPTY_CONTACT: Contact = { firstName: "", lastName: "", email: "", phone: "" };

const inputCls =
  "font-sans w-full rounded-xl border border-[#31425B] bg-background px-4 py-3 text-sm text-foreground placeholder-[#4A5A6C] transition-[border-color] focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30";

const labelCls =
  "font-sans block text-[0.65rem] uppercase tracking-[0.2em] text-muted-dark mb-2";

const cardCls =
  "rounded-2xl border border-border-accent bg-background p-7 space-y-6";

const optionCls = (selected: boolean) =>
  `relative rounded-xl border px-4 py-3.5 text-left transition-[border-color,background] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
    selected ? "border-gold bg-[#122742]" : "border-border-accent bg-surface-deep hover:border-gold/30"
  }`;

function Required() {
  return <span className="text-gold"> *</span>;
}

function QuestionField({
  q,
  value,
  onChange,
  invalid,
}: {
  q: WardrobeQuestion;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  invalid: boolean;
}) {
  const heading = (
    <div>
      <p className={`font-sans text-sm font-semibold ${invalid ? "text-red-300" : "text-foreground"}`}>
        {q.label}
        {q.required && <Required />}
      </p>
      {q.help && <p className="font-sans mt-1 text-xs text-slate">{q.help}</p>}
    </div>
  );

  if (q.type === "text" || q.type === "textarea") {
    const str = typeof value === "string" ? value : "";
    return (
      <div className="space-y-3">
        <label htmlFor={`q-${q.key}`} className="block">
          {heading}
        </label>
        {q.type === "text" ? (
          <input
            id={`q-${q.key}`}
            type="text"
            value={str}
            placeholder={q.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
            maxLength={300}
          />
        ) : (
          <textarea
            id={`q-${q.key}`}
            rows={4}
            value={str}
            placeholder={q.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls + " resize-none leading-relaxed"}
            maxLength={4000}
          />
        )}
      </div>
    );
  }

  if (q.type === "scale") {
    const str = typeof value === "string" ? value : "";
    return (
      <fieldset className="space-y-3">
        <legend className="mb-3">{heading}</legend>
        <div className="flex items-center gap-2" role="radiogroup" aria-label={q.label}>
          {["1", "2", "3", "4", "5"].map((n) => {
            const selected = str === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(n)}
                className={`font-display h-11 w-11 rounded-full border text-base transition-[border-color,background,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  selected
                    ? "border-gold bg-gold text-background"
                    : "border-border-accent bg-surface-deep text-foreground hover:border-gold/40"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between font-sans text-[10px] uppercase tracking-[0.15em] text-slate">
          <span>{q.low}</span>
          <span>{q.high}</span>
        </div>
      </fieldset>
    );
  }

  // single / multi. Narrowed explicitly: control-flow narrowing on `q` does
  // not survive into the JSX callbacks below.
  const choice = q as Extract<WardrobeQuestion, { type: "single" | "multi" }>;
  const isMulti = choice.type === "multi";
  const picked = new Set(Array.isArray(value) ? value : value ? [value] : []);

  function toggle(id: string) {
    if (!isMulti) {
      onChange(id);
      return;
    }
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  }

  return (
    <fieldset className="space-y-3">
      <legend className="mb-3">{heading}</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role={isMulti ? "group" : "radiogroup"} aria-label={q.label}>
        {choice.options.map((opt) => {
          const selected = picked.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              role={isMulti ? "checkbox" : "radio"}
              aria-checked={selected}
              onClick={() => toggle(opt.id)}
              className={optionCls(selected)}
            >
              <span className={`font-sans block text-sm font-semibold ${selected ? "text-gold" : "text-foreground"}`}>
                {opt.label}
              </span>
              {opt.sub && <span className="font-sans mt-0.5 block text-xs text-slate">{opt.sub}</span>}
              {selected && (
                <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-gold font-sans text-[9px] font-bold text-background" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function WardrobeQuestionnaireForm() {
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [answers, setAnswers] = useState<WardrobeAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [error, setError] = useState("");
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set());

  const totalQuestions = useMemo(
    () => WARDROBE_SECTIONS.reduce((n, s) => n + s.questions.length, 0),
    []
  );
  const answeredCount = Object.values(answers).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v.trim() !== ""
  ).length;

  function setContactField<K extends keyof Contact>(field: K, value: string) {
    setContact((prev) => ({ ...prev, [field]: value }));
  }

  function setAnswer(key: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (invalidKeys.has(key)) {
      setInvalidKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const contactMissing: string[] = [];
    if (!contact.firstName.trim()) contactMissing.push("firstName");
    if (!contact.lastName.trim()) contactMissing.push("lastName");
    if (!contact.email.trim()) contactMissing.push("email");
    if (!contact.phone.trim()) contactMissing.push("phone");

    const missing = missingRequiredWardrobeAnswers(answers);
    const allMissing = new Set([...contactMissing, ...missing]);
    if (allMissing.size > 0) {
      setInvalidKeys(allMissing);
      setError("Please answer the required questions marked with a star.");
      const first = document.getElementById(`field-${[...allMissing][0]}`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/wardrobe-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contact, answers }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const data = (await res.json()) as { id: string };
      setSubmissionId(data.id);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please try again or contact us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-surface-deep pt-24 pb-24 px-6 lg:px-16">
        <div className="mx-auto max-w-lg text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <p className="font-sans text-[0.6rem] uppercase tracking-[0.3em] text-gold">Questionnaire Received</p>
          <h1 className="font-display text-4xl font-light leading-[1.1] text-foreground">
            Your wardrobe plan <em className="italic">begins here.</em>
          </h1>
          <p className="font-sans text-sm leading-[1.9] text-muted-dark">
            Reference <span className="text-gold">{submissionId}</span>. One of our tailors will review your
            answers and reach out within one business day with a first proposal and a time to meet.
          </p>
          <p className="font-display text-[0.9rem] italic leading-[1.7] text-gold/60">
            &ldquo;Let all things be done decently and in order.&rdquo;
            <span className="mt-1 block font-sans text-[0.55rem] not-italic uppercase tracking-[0.12em] text-foreground/20">
              — 1 Corinthians 14:40
            </span>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/builder"
              className="font-sans inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Explore the Builder
            </Link>
            <Link
              href="/"
              className="font-sans inline-flex items-center justify-center rounded-full border border-[#31425B] px-7 py-3 text-sm text-muted-dark hover:border-gold/40 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-deep pt-24 pb-24">
      {/* Header */}
      <div className="px-6 lg:px-16 mb-14 max-w-2xl mx-auto text-center">
        <p className="font-sans text-[0.58rem] uppercase tracking-[0.3em] text-gold mb-4">
          ✝ Blessed &amp; Dressed
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-[1.08] text-foreground mb-5">
          The Gentleman&rsquo;s <em className="italic text-gold">Wardrobe</em> Questionnaire
        </h1>
        <p className="font-sans text-sm leading-[1.9] text-muted-dark max-w-lg mx-auto">
          A bespoke wardrobe is planned, not bought. Ten minutes here tells our tailors how you live,
          what you own, and how you like to look, so the first commission is the right one.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-2xl px-6 lg:px-0 space-y-10">

        {/* ── Contact ── */}
        <section className={cardCls}>
          <div>
            <p className="font-sans text-[0.6rem] uppercase tracking-[0.25em] text-gold">About You</p>
            <p className="font-sans mt-1 text-xs text-slate">So we know who we are building for.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { key: "firstName", label: "First Name", placeholder: "James", autoComplete: "given-name", type: "text" },
                { key: "lastName", label: "Last Name", placeholder: "Anderson", autoComplete: "family-name", type: "text" },
                { key: "email", label: "Email", placeholder: "james@example.com", autoComplete: "email", type: "email" },
                { key: "phone", label: "Phone Number", placeholder: "+1 (555) 000-0000", autoComplete: "tel", type: "tel" },
              ] as const
            ).map((f) => (
              <div key={f.key} id={`field-${f.key}`}>
                <label htmlFor={f.key} className={`${labelCls} ${invalidKeys.has(f.key) ? "text-red-300" : ""}`}>
                  {f.label}
                  <Required />
                </label>
                <input
                  id={f.key}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  value={contact[f.key]}
                  onChange={(e) => {
                    setContactField(f.key, e.target.value);
                    if (invalidKeys.has(f.key)) {
                      setInvalidKeys((prev) => {
                        const next = new Set(prev);
                        next.delete(f.key);
                        return next;
                      });
                    }
                  }}
                  className={inputCls}
                  required
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Sections ── */}
        {WARDROBE_SECTIONS.map((section, si) => (
          <section key={section.id} className={cardCls}>
            <div>
              <p className="font-sans text-[0.6rem] uppercase tracking-[0.25em] text-gold">
                <span className="mr-2 text-slate">{String(si + 1).padStart(2, "0")}</span>
                {section.title}
              </p>
              <p className="font-sans mt-1 text-xs leading-relaxed text-slate">{section.intro}</p>
            </div>
            <div className="space-y-8">
              {section.questions.map((q) => (
                <div key={q.key} id={`field-${q.key}`}>
                  <QuestionField
                    q={q}
                    value={answers[q.key]}
                    onChange={(v) => setAnswer(q.key, v)}
                    invalid={invalidKeys.has(q.key)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Error */}
        {error && (
          <p role="alert" className="font-sans text-sm text-red-400 text-center">{error}</p>
        )}

        {/* Submit */}
        <div className="text-center space-y-4">
          <button
            type="submit"
            disabled={submitting}
            className="font-sans w-full rounded-full bg-gold py-4 text-base font-semibold text-background transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-deep disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending…" : "Send My Questionnaire"}
          </button>
          <p className="font-sans text-xs text-dim">
            {answeredCount} of {totalQuestions} questions answered. Starred questions are required; the rest help us help you.
          </p>
          <p className="font-sans text-xs text-slate">
            Just want to book a fitting?{" "}
            <Link href="/consultation" className="text-gold underline underline-offset-2 hover:no-underline">
              Request a consultation →
            </Link>
          </p>
        </div>

      </form>
    </main>
  );
}
