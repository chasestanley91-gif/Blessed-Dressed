"use client";

import { useState } from "react";
import Link from "next/link";

type TimeSlot = string;

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timesAvailable: Set<TimeSlot>;
  product: string;
  colors: string;
  patterns: string;
  budget: string;
  notes: string;
};

const EMPTY: Omit<FormState, "timesAvailable"> & { timesAvailable: Set<TimeSlot> } = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  timesAvailable: new Set(),
  product: "",
  colors: "",
  patterns: "",
  budget: "",
  notes: "",
};

const TIME_SLOTS = [
  { id: "weekday-morning",   label: "Weekday Mornings",   sub: "Mon–Fri, 9am–12pm" },
  { id: "weekday-afternoon", label: "Weekday Afternoons",  sub: "Mon–Fri, 12pm–5pm" },
  { id: "weekday-evening",   label: "Weekday Evenings",    sub: "Mon–Fri, 5pm–7pm"  },
  { id: "saturday-morning",  label: "Saturday Morning",    sub: "9am–12pm"          },
  { id: "saturday-afternoon",label: "Saturday Afternoon",  sub: "12pm–4pm"          },
];

const PRODUCTS = [
  "2-Piece Suit",
  "3-Piece Suit (with Vest)",
  "Sport Coat",
  "Dress Shirt",
  "Trousers",
  "Vest",
  "Multiple Items",
  "Not sure yet",
];

const PATTERNS = [
  "Solid",
  "Pinstripe",
  "Herringbone",
  "Plaid / Check",
  "Windowpane",
  "Houndstooth",
  "Prince of Wales",
  "Not sure yet",
];

const BUDGETS = [
  "Under $1,000",
  "$1,000 – $2,000",
  "$2,000 – $3,500",
  "$3,500 – $5,000",
  "$5,000+",
];

const inputCls =
  "font-sans w-full rounded-xl border border-[#31425B] bg-background px-4 py-3 text-sm text-foreground placeholder-[#4A5A6C] transition-[border-color] focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30";

const labelCls =
  "font-sans block text-[0.65rem] uppercase tracking-[0.2em] text-muted-dark mb-2";

const selectCls =
  inputCls +
  " appearance-none cursor-pointer";

export default function ConsultationPage() {
  const [form, setForm] = useState<FormState>({ ...EMPTY, timesAvailable: new Set() });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [consultationId, setConsultationId] = useState("");
  const [error, setError] = useState("");

  function set<K extends keyof Omit<FormState, "timesAvailable">>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleTime(id: string) {
    setForm((prev) => {
      const next = new Set(prev.timesAvailable);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, timesAvailable: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.product) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.timesAvailable.size === 0) {
      setError("Please select at least one available time.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          timesAvailable: Array.from(form.timesAvailable),
          product: form.product,
          colors: form.colors,
          patterns: form.patterns,
          budget: form.budget,
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json() as { consultationId: string };
      setConsultationId(data.consultationId);
      setSubmitted(true);
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
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
            </svg>
          </div>
          <p className="font-sans text-[0.6rem] uppercase tracking-[0.3em] text-gold">Request Received</p>
          <h1 className="font-display text-4xl font-light leading-[1.1] text-foreground">
            We&rsquo;ll be in touch <em className="italic">shortly.</em>
          </h1>
          <p className="font-sans text-sm leading-[1.9] text-muted-dark">
            Your consultation request <span className="text-gold">{consultationId}</span> has been received.
            One of our tailors will reach out within one business day to confirm your appointment.
          </p>
          <p className="font-display text-[0.9rem] italic leading-[1.7] text-gold/60">
            &ldquo;The LORD shall make thee the head, and not the tail.&rdquo;
            <span className="mt-1 block font-sans text-[0.55rem] not-italic uppercase tracking-[0.12em] text-foreground/20">
              — Deuteronomy 28:13
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
          Book a <em className="italic text-gold">Consultation</em>
        </h1>
        <p className="font-sans text-sm leading-[1.9] text-muted-dark max-w-lg mx-auto">
          Tell us about yourself and what you have in mind. Our tailors will review your preferences
          and reach out within one business day to confirm your appointment.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-2xl px-6 lg:px-0 space-y-10">

        {/* ── Contact Details ── */}
        <section className="rounded-2xl border border-border-accent bg-background p-7 space-y-5">
          <p className="font-sans text-[0.6rem] uppercase tracking-[0.25em] text-gold">Contact Details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className={labelCls}>
                First Name <span className="text-gold">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="James"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className={labelCls}>
                Last Name <span className="text-gold">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Anderson"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className={labelCls}>
                Email <span className="text-gold">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="james@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelCls}>
                Phone Number <span className="text-gold">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>
        </section>

        {/* ── Availability ── */}
        <section className="rounded-2xl border border-border-accent bg-background p-7 space-y-5">
          <div>
            <p className="font-sans text-[0.6rem] uppercase tracking-[0.25em] text-gold">
              When Are You Available? <span className="text-gold">*</span>
            </p>
            <p className="font-sans mt-1 text-xs text-slate">Select all that apply.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TIME_SLOTS.map((slot) => {
              const checked = form.timesAvailable.has(slot.id);
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => toggleTime(slot.id)}
                  className={`rounded-xl border px-4 py-4 text-left transition-[border-color,background] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                    checked
                      ? "border-gold bg-[#122742]"
                      : "border-border-accent bg-surface-deep hover:border-gold/30"
                  }`}
                  aria-pressed={checked}
                >
                  <span className={`font-sans block text-sm font-semibold ${checked ? "text-gold" : "text-foreground"}`}>
                    {slot.label}
                  </span>
                  <span className="font-sans mt-0.5 block text-xs text-slate">{slot.sub}</span>
                  {checked && (
                    <span className="mt-2 block font-sans text-[9px] uppercase tracking-[0.2em] text-gold">Selected ✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── What You Have in Mind ── */}
        <section className="rounded-2xl border border-border-accent bg-background p-7 space-y-5">
          <p className="font-sans text-[0.6rem] uppercase tracking-[0.25em] text-gold">What You Have in Mind</p>

          {/* Product */}
          <div>
            <label htmlFor="product" className={labelCls}>
              What Are You Looking to Have Made? <span className="text-gold">*</span>
            </label>
            <div className="relative">
              <select
                id="product"
                value={form.product}
                onChange={(e) => set("product", e.target.value)}
                className={selectCls}
                required
                aria-label="Product interest"
              >
                <option value="">Select a product…</option>
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-dark">▾</span>
            </div>
          </div>

          {/* Color */}
          <div>
            <label htmlFor="colors" className={labelCls}>Color Preferences</label>
            <input
              id="colors"
              type="text"
              placeholder="e.g. Navy, Charcoal, Olive, Burgundy…"
              value={form.colors}
              onChange={(e) => set("colors", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Pattern */}
          <div>
            <label htmlFor="patterns" className={labelCls}>Pattern Preferences</label>
            <div className="relative">
              <select
                id="patterns"
                value={form.patterns}
                onChange={(e) => set("patterns", e.target.value)}
                className={selectCls}
                aria-label="Pattern preference"
              >
                <option value="">Select a pattern…</option>
                {PATTERNS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-dark">▾</span>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget" className={labelCls}>Budget Range</label>
            <div className="relative">
              <select
                id="budget"
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
                className={selectCls}
                aria-label="Budget range"
              >
                <option value="">Select a budget range…</option>
                {BUDGETS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-dark">▾</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className={labelCls}>Anything Else We Should Know?</label>
            <textarea
              id="notes"
              rows={4}
              placeholder="Occasion, fit preferences, inspiration, timeline, measurements if you have them…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className={inputCls + " resize-none leading-relaxed"}
            />
          </div>
        </section>

        {/* Error */}
        {error && (
          <p className="font-sans text-sm text-red-400 text-center">{error}</p>
        )}

        {/* Submit */}
        <div className="text-center space-y-4">
          <button
            type="submit"
            disabled={submitting}
            className="font-sans w-full rounded-full bg-gold py-4 text-base font-semibold text-background transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-deep disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending…" : "Request Consultation"}
          </button>
          <p className="font-sans text-xs text-slate">
            Prefer to build first?{" "}
            <Link href="/builder" className="text-gold underline underline-offset-2 hover:no-underline">
              Try the bespoke builder →
            </Link>
          </p>
        </div>

      </form>
    </main>
  );
}
