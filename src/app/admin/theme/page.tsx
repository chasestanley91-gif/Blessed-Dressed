"use client";

import { useEffect, useState } from "react";

type Theme = Record<string, string>;

const FIELDS: { key: string; label: string; group: string }[] = [
  { key: "gold",        label: "Primary Gold",    group: "Accent" },
  { key: "goldLight",   label: "Gold Light",       group: "Accent" },
  { key: "goldLighter", label: "Gold Lighter",     group: "Accent" },
  { key: "background",    label: "Page Background", group: "Dark Surfaces" },
  { key: "surface",       label: "Surface",         group: "Dark Surfaces" },
  { key: "surfaceStrong", label: "Surface Strong",  group: "Dark Surfaces" },
  { key: "foreground",    label: "Foreground Text", group: "Dark Surfaces" },
  { key: "muted",         label: "Muted Text",      group: "Dark Surfaces" },
  { key: "ivory",       label: "Ivory",           group: "Light Surfaces" },
  { key: "cream",       label: "Cream",           group: "Light Surfaces" },
  { key: "charcoal",    label: "Charcoal",        group: "Light Surfaces" },
  { key: "warmBlack",   label: "Warm Black",      group: "Light Surfaces" },
  { key: "gray",        label: "Gray",            group: "Light Surfaces" },
  { key: "borderLight", label: "Border Light",    group: "Light Surfaces" },
  { key: "navy",        label: "Navy Accent",     group: "Light Surfaces" },
];

const GROUPS = ["Accent", "Dark Surfaces", "Light Surfaces"];

const DEFAULTS: Theme = {
  gold: "#d4af37", goldLight: "#B5975A", goldLighter: "#D4B478",
  background: "#071a2d", surface: "#09141e", surfaceStrong: "#0b1b2e",
  foreground: "#f5f1e6", muted: "#b1a893",
  ivory: "#FAF8F3", cream: "#F5F0E8", charcoal: "#1C1C1C",
  warmBlack: "#111010", gray: "#6B6560", borderLight: "#E2DBD0", navy: "#1A2744",
};

function hex(t: Theme, key: string) {
  return t[key] ?? DEFAULTS[key] ?? "#000000";
}

function LivePreview({ t }: { t: Theme }) {
  return (
    <div className="sticky top-6 space-y-3">
      <p className="font-sans text-[10px] uppercase tracking-[0.3em]" style={{ color: hex(t, "gold") }}>Live Preview</p>

      {/* Nav */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: hex(t, "background"), borderColor: `${hex(t, "navy")}80` }}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: hex(t, "gold") }} />
            <span className="font-sans text-[11px] font-semibold tracking-[0.2em]" style={{ color: hex(t, "foreground") }}>
              BLESSED &amp; DRESSED
            </span>
          </div>
          <div className="flex items-center gap-3">
            {["Collections", "Builder", "RTW"].map((l) => (
              <span key={l} className="font-sans text-[10px]" style={{ color: hex(t, "muted") }}>{l}</span>
            ))}
            <span
              className="rounded-full px-3 py-1 font-sans text-[10px] font-semibold"
              style={{ background: hex(t, "gold"), color: hex(t, "background") }}
            >
              Start Order
            </span>
          </div>
        </div>
      </div>

      {/* Hero strip */}
      <div
        className="rounded-xl overflow-hidden px-6 py-8"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${hex(t, "navy")} 0%, transparent 70%), ${hex(t, "background")}`,
        }}
      >
        <p className="font-sans text-[9px] uppercase tracking-[0.35em] mb-2" style={{ color: hex(t, "gold") }}>
          Bespoke Tailoring
        </p>
        <h2 className="font-display text-2xl font-semibold leading-tight mb-1" style={{ color: hex(t, "foreground") }}>
          Dressed for the<br />
          <em style={{ color: hex(t, "gold") }}>occasion.</em>
        </h2>
        <p className="font-sans text-[11px] leading-relaxed mb-5" style={{ color: hex(t, "muted") }}>
          From fabric selection to final fitting,<br />every detail is yours.
        </p>
        <div className="flex gap-3">
          <span
            className="rounded-full px-4 py-1.5 font-sans text-xs font-semibold"
            style={{ background: hex(t, "gold"), color: hex(t, "background") }}
          >
            Build Your Suit
          </span>
          <span
            className="rounded-full border px-4 py-1.5 font-sans text-xs"
            style={{ borderColor: `${hex(t, "borderLight")}60`, color: hex(t, "foreground") }}
          >
            View Collections
          </span>
        </div>
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Product card */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: hex(t, "surfaceStrong"), borderColor: `${hex(t, "navy")}80` }}
        >
          <div className="h-24" style={{ background: `linear-gradient(135deg, ${hex(t, "surface")} 0%, ${hex(t, "navy")}60 100%)` }}>
            <div className="h-full flex items-center justify-center">
              <span className="font-sans text-[9px]" style={{ color: hex(t, "muted") }}>fabric swatch</span>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-start justify-between gap-1 mb-1">
              <p className="font-sans text-xs font-semibold leading-tight" style={{ color: hex(t, "foreground") }}>
                Navy Birdseye
              </p>
              <span
                className="shrink-0 rounded-full border px-1.5 py-0.5 font-sans text-[9px]"
                style={{ borderColor: `${hex(t, "gold")}40`, color: hex(t, "gold") }}
              >
                Premium
              </span>
            </div>
            <p className="font-sans text-[10px] mb-2" style={{ color: hex(t, "muted") }}>Super 150s Wool</p>
            <p className="font-sans text-xs font-semibold" style={{ color: hex(t, "gold") }}>$699</p>
          </div>
        </div>

        {/* Builder option card */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: hex(t, "surfaceStrong"), borderColor: `${hex(t, "gold")}50` }}
        >
          <div className="h-24 flex items-center justify-center" style={{ background: hex(t, "surface") }}>
            <div className="h-8 w-12 rounded border-2" style={{ borderColor: hex(t, "gold"), background: `${hex(t, "gold")}15` }} />
          </div>
          <div className="p-3">
            <p className="font-sans text-[9px] uppercase tracking-[0.2em] mb-0.5" style={{ color: hex(t, "gold") }}>Selected</p>
            <p className="font-sans text-xs font-semibold" style={{ color: hex(t, "foreground") }}>Peak Lapel</p>
            <p className="font-sans text-[10px]" style={{ color: hex(t, "muted") }}>+$75</p>
          </div>
        </div>
      </div>

      {/* Light section */}
      <div
        className="rounded-xl p-4"
        style={{ background: hex(t, "ivory"), border: `1px solid ${hex(t, "borderLight")}` }}
      >
        <p className="font-sans text-[9px] uppercase tracking-[0.25em] mb-2" style={{ color: hex(t, "gold") }}>
          Craft &amp; Quality
        </p>
        <p className="font-sans text-sm font-semibold mb-1" style={{ color: hex(t, "charcoal") }}>
          Built to last a lifetime.
        </p>
        <p className="font-sans text-[11px] leading-relaxed" style={{ color: hex(t, "gray") }}>
          Full canvas construction. Hand-stitched lapels.<br />Sourced from Italy&apos;s finest mills.
        </p>
        <div className="mt-3 flex gap-2">
          {["Full Canvas", "Hand Stitched", "Italian Wool"].map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2.5 py-0.5 font-sans text-[9px] font-medium"
              style={{ background: hex(t, "cream"), color: hex(t, "charcoal"), border: `1px solid ${hex(t, "borderLight")}` }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Input + form example */}
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{ background: hex(t, "surface"), borderColor: `${hex(t, "navy")}80` }}
      >
        <p className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: hex(t, "muted") }}>
          Checkout
        </p>
        <div
          className="rounded-lg border px-3 py-2 font-sans text-xs"
          style={{ background: hex(t, "background"), borderColor: `${hex(t, "navy")}80`, color: hex(t, "muted") }}
        >
          Full Name
        </div>
        <div
          className="rounded-lg border-2 px-3 py-2 font-sans text-xs"
          style={{ background: hex(t, "background"), borderColor: hex(t, "gold"), color: hex(t, "foreground") }}
        >
          chasestanley91@gmail.com
        </div>
        <div
          className="w-full rounded-lg py-2 text-center font-sans text-xs font-semibold"
          style={{ background: hex(t, "gold"), color: hex(t, "background") }}
        >
          Place Order
        </div>
      </div>
    </div>
  );
}

export default function AdminTheme() {
  const [theme, setTheme] = useState<Theme>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/theme")
      .then((r) => r.json())
      .then((data: Theme) => { setTheme(data); setLoading(false); });
  }, []);

  function set(key: string, val: string) {
    setTheme((t) => ({ ...t, [key]: val }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(theme),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-sans text-sm text-slate">Loading theme…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 lg:px-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Admin</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">
              Theme Editor
            </h1>
            <p className="font-sans mt-1 text-sm text-muted-dark">
              Edit brand colors — preview updates live. Save to apply site-wide.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTheme(DEFAULTS)}
            className="shrink-0 rounded-xl border border-border-accent px-4 py-2 font-sans text-xs text-muted-dark hover:text-foreground hover:border-gold/40 transition-colors"
          >
            Reset to defaults
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">

          {/* Left — color form */}
          <form onSubmit={save} className="space-y-5">
            {GROUPS.map((group) => (
              <div key={group} className="rounded-2xl border border-border-accent bg-surface-strong p-6">
                <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-gold mb-5">{group}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {FIELDS.filter((f) => f.group === group).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div
                          className="h-10 w-10 rounded-lg border-2 border-border-accent cursor-pointer shadow-lg"
                          style={{ background: hex(theme, key) }}
                        />
                        <input
                          type="color"
                          value={hex(theme, key)}
                          onChange={(e) => set(key, e.target.value)}
                          title={label}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted-dark truncate">{label}</p>
                        <input
                          value={hex(theme, key)}
                          onChange={(e) => set(key, e.target.value)}
                          className="w-full rounded border border-border-accent bg-surface-deep px-2 py-1 font-mono text-xs text-foreground outline-none focus:border-gold transition-colors"
                          placeholder="#000000"
                          title={`Hex for ${label}`}
                          maxLength={7}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-4 pb-4">
              <button
                type="submit"
                className="rounded-xl bg-gold px-6 py-2.5 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity"
              >
                Save Theme
              </button>
              {saved && (
                <span className="font-sans text-xs text-emerald-400">
                  ✓ Saved — changes are live site-wide.
                </span>
              )}
            </div>
          </form>

          {/* Right — live preview */}
          <div className="hidden lg:block">
            <LivePreview t={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}
