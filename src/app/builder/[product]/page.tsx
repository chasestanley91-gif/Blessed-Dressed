"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  builderProducts,
  fabrics,
  productMeasurements,
  standardSizes,
  monogramFonts,
  monogramThreadColors,
  monogramPlacements,
  postureFields,
  shirtMeasurementFields,
  jacketMeasurementFields,
  chestAllowanceOptions,
  jacketChestAllowanceOptions,
  wearingHabitOptions,
  jacketWearingHabitOptions,
} from "@/data/builder";
import { allProductDesigns } from "@/data/options";
import type { ProductDesignConfig } from "@/data/options/types";
import { useBuilderStore } from "@/store/builderStore";
import { useCart } from "@/context/CartContext";
import StyleQuizStep from "@/components/builder/StyleQuizStep";
import FabricDiscovery from "@/components/builder/FabricDiscovery";
import MeasuringGuide from "@/components/MeasuringGuide";
import { rankFabrics } from "@/lib/styleDNA";
import { rankOptions, getDNAEntries, applyDesignDNA } from "@/lib/quizEngine";

interface BuilderPageProps {
  params: Promise<{ product: string }>;
}

const STEPS = ["Product", "Fabric", "Style", "Design", "Monogram", "Measurements", "Posture", "Review"] as const;

// ─── Share encode / decode ────────────────────────────────────────────────────

type ShareState = {
  fabric: string;
  fabricPremium: boolean;
  designSelections: Record<string, string>;
  measureMode: "standard" | "body" | "finished";
  standardSize: string;
  customMeasurements: Record<string, string>;
  chestAllowance: string;
  wearingHabit: string;
  postureAdjustments: Record<string, string>;
  styleQuiz: Record<string, string>;
  discoveryQuiz: Record<string, string>;
  monograms: Array<{ text: string; font: string; threadColor: string; placement: string; size: string }>;
  activeStep: number;
};

function encodeShare(s: ShareState): string {
  const d: Record<string, unknown> = {
    f: s.fabric,
    fp: s.fabricPremium ? 1 : undefined,
    d: Object.keys(s.designSelections).length ? s.designSelections : undefined,
    mm: s.measureMode !== "standard" ? s.measureMode : undefined,
    ss: s.standardSize || undefined,
    cm: Object.keys(s.customMeasurements).length ? s.customMeasurements : undefined,
    ca: s.chestAllowance !== "8" ? s.chestAllowance : undefined,
    wh: s.wearingHabit || undefined,
    pa: Object.keys(s.postureAdjustments).length ? s.postureAdjustments : undefined,
    sq: Object.keys(s.styleQuiz).length ? s.styleQuiz : undefined,
    dq: Object.keys(s.discoveryQuiz).length ? s.discoveryQuiz : undefined,
    mo: s.monograms.filter(m => m.text).map(m => [m.text, m.font, m.threadColor, m.placement, m.size]),
    s: s.activeStep > 2 ? s.activeStep : undefined,
  };
  // Strip undefined
  const clean = JSON.stringify(d, (_, v) => v === undefined ? undefined : v);
  try { return btoa(encodeURIComponent(clean)); } catch { return ""; }
}

function decodeShare(encoded: string): Partial<ShareState> | null {
  try {
    const clean = decodeURIComponent(atob(encoded));
    const d = JSON.parse(clean) as Record<string, unknown>;
    const mo = (d.mo as string[][] | undefined) ?? [];
    return {
      fabric: d.f as string,
      fabricPremium: !!(d.fp),
      designSelections: (d.d as Record<string, string>) ?? {},
      measureMode: (d.mm as "standard" | "body" | "finished") ?? "standard",
      standardSize: (d.ss as string) ?? "",
      customMeasurements: (d.cm as Record<string, string>) ?? {},
      chestAllowance: (d.ca as string) ?? "8",
      wearingHabit: (d.wh as string) ?? "",
      postureAdjustments: (d.pa as Record<string, string>) ?? {},
      styleQuiz: (d.sq as Record<string, string>) ?? {},
      discoveryQuiz: (d.dq as Record<string, string>) ?? {},
      monograms: mo.length
        ? mo.map(([text, font, threadColor, placement, size]) => ({ text, font, threadColor, placement, size }))
        : [],
      activeStep: (d.s as number) ?? 2,
    };
  } catch { return null; }
}

/* ─── Shared micro-components ────────────────────────────────── */

function StepBadge({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${active ? "bg-gold text-background" : done ? "border border-gold/40 text-gold" : "border border-[#31425B] text-slate"}`}>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${active ? "bg-background/20" : done ? "border border-gold/60" : "border border-[#31425B]"}`}>
        {done ? "✓" : n}
      </span>
      <span className="font-sans hidden md:block">{label}</span>
    </div>
  );
}

function OptionCard({ id, label, description, priceAdj, image, images, aiImage, realImage, selected, onClick, onExpand }: {
  id?: string; label: string; description: string; priceAdj?: number;
  image?: string; images?: string[]; aiImage?: string; realImage?: string; selected: boolean; onClick: () => void; onExpand?: () => void;
}) {
  // Thumbnail preference: real photo > AI render > extra photos > illustration drawing.
  const photo = realImage ?? aiImage ?? images?.[0];
  const hasPhoto = !!photo;
  const thumb = photo ?? image;
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`group rounded-[1rem] border text-left transition-[border-color,background] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-[0.98] ${selected ? "border-gold bg-[#122742]" : "border-border-accent bg-surface-strong hover:border-gold/40"}`}
    >
      {thumb && (
        <div
          className="relative w-full overflow-hidden rounded-t-[calc(1rem-1px)] bg-white"
          onDoubleClick={(e) => { e.stopPropagation(); onExpand?.(); }}
        >
          <img
            src={thumb}
            alt={label}
            className={`h-20 w-full ${hasPhoto ? "object-cover" : "object-contain"} bg-white transition-[height] duration-300 ease-out group-hover:h-40`}
            onError={(e) => {
              const el = e.currentTarget;
              // Real photo failed → fall back to the tech-pack drawing; if that also fails, hide.
              if (image && el.src !== image && !el.src.endsWith(image)) {
                el.classList.remove("object-cover");
                el.classList.add("object-contain");
                el.src = image;
              } else {
                el.style.display = "none";
              }
            }}
          />
          {onExpand && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onExpand(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onExpand(); } }}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              aria-label={`Expand ${label}`}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M1 9l8-8M6 1h3v3M4 9H1V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      )}
      <div className={image ? "p-3" : "p-4"}>
        <div className="flex items-start justify-between gap-2">
          <p className="font-sans text-sm font-semibold leading-snug text-foreground">{label}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {priceAdj !== undefined && priceAdj !== 0 && (
              <span className="font-sans text-xs text-gold">{priceAdj > 0 ? `+$${priceAdj}` : `-$${Math.abs(priceAdj)}`}</span>
            )}
            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${selected ? "bg-gold text-background font-bold" : "border border-[#31425B]"}`}>
              {selected ? "✓" : ""}
            </span>
          </div>
        </div>
        <p className="font-sans mt-1 text-xs leading-[1.6] text-muted-dark">{description}</p>
      </div>
    </button>
  );
}

function ImageLightbox({ items, label, description, onClose }: { items: { url: string; role?: string }[]; label: string; description: string; onClose: () => void }) {
  const [active, setActive] = useState(0);
  const count = items.length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && count > 1) setActive((a) => (a + 1) % count);
      else if (e.key === "ArrowLeft" && count > 1) setActive((a) => (a - 1 + count) % count);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, count]);

  const safe = Math.min(active, Math.max(count - 1, 0));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-white">
          <img
            src={items[safe]?.url}
            alt={items[safe]?.role ? `${label} — ${items[safe].role}` : label}
            className="block max-h-[68vh] w-full object-contain"
            onError={(e) => { e.currentTarget.style.opacity = "0.15"; }}
          />
          {items[safe]?.role && (
            <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.15em] text-white backdrop-blur-sm">
              {items[safe].role}
            </div>
          )}
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => setActive((a) => (a - 1 + count) % count)}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => setActive((a) => (a + 1) % count)}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 font-sans text-[10px] text-white backdrop-blur-sm">
                {safe + 1} / {count}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-black/10 bg-white px-4 py-3">
          <p className="font-display text-sm font-semibold text-background">{label}</p>
          {description && <p className="font-sans mt-1 text-xs leading-[1.6] text-black/60">{description}</p>}
          {count > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {items.map((it, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={it.role ? `View ${it.role}` : `View photo ${i + 1}`}
                  onClick={() => setActive(i)}
                  className="shrink-0 text-center"
                >
                  <div className={`h-14 w-14 overflow-hidden rounded-lg border transition-colors ${safe === i ? "border-gold shadow-[0_0_0_1px_#D4AF37]" : "border-black/15 opacity-60 hover:opacity-100 hover:border-gold/50"}`}>
                    <img src={it.url} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.parentElement!.parentElement!.style.display = "none"; }} />
                  </div>
                  {it.role && <span className="font-sans mt-0.5 block text-[8px] uppercase tracking-wide text-black/50">{it.role}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3: Design section tab UI ─────────────────────────── */

function DesignStep({ productSlug, selections, onSelect, config: liveConfig, quiz, onEditQuiz, optionsError }: {
  productSlug: string;
  selections: Record<string, string>;
  onSelect: (fieldId: string, optionId: string) => void;
  config?: ProductDesignConfig | null;
  quiz: Record<string, string>;
  onEditQuiz: () => void;
  optionsError?: boolean;
}) {
  const { clearStyleQuizKey } = useBuilderStore();
  const config = liveConfig ?? allProductDesigns[productSlug];
  const [sectionIdx, setSectionIdx] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [collapsedFields, setCollapsedFields] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<{ items: { url: string; role?: string }[]; label: string; description: string } | null>(null);

  const toggleExpanded = (fieldId: string) =>
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });

  const toggleCollapsed = (fieldId: string) =>
    setCollapsedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSectionIdx(0); setShowAdvanced(false); }, [productSlug, config]);

  if (!config || !Array.isArray(config.sections) || config.sections.length === 0) {
    return <p className="font-sans text-sm text-muted-dark">No design options available for this product.</p>;
  }

  const safeIdx = Math.min(sectionIdx, config.sections.length - 1);
  const section = config.sections[safeIdx];
  if (!section) return null;
  const visibleFields = section.fields.filter(f => !f.advanced || showAdvanced);
  const advancedCount = section.fields.filter(f => f.advanced).length;

  // Active style-quiz answers as human-readable chips (engine-derived).
  const activeFilters = getDNAEntries(config, quiz);

  return (
    <div className="space-y-5">
      {optionsError && (
        <div className="mb-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
          <p className="font-sans text-xs text-gold">
            Design options loaded from defaults — custom options unavailable right now.
          </p>
        </div>
      )}
      {/* Active style-quiz chips — these prioritise (never hide) matching options */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-slate">Prioritising:</span>
          {activeFilters.map(({ key, value }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-sans text-[11px] text-gold"
            >
              {value}
              <button
                type="button"
                onClick={() => clearStyleQuizKey(key)}
                className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold/20 text-gold hover:bg-gold/40 transition-colors focus-visible:outline-none"
                aria-label={`Remove ${value} preference`}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onEditQuiz}
            className="font-sans text-[11px] text-slate underline underline-offset-2 hover:text-muted-dark transition-colors focus-visible:outline-none"
          >
            Edit preferences
          </button>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {config.sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => { setSectionIdx(i); setShowAdvanced(false); }}
            className={`font-sans rounded-full px-4 py-2 text-xs font-semibold transition-[background,color,border-color] duration-150 border ${i === safeIdx ? "border-gold bg-gold text-background" : "border-border-accent bg-transparent text-muted-dark hover:border-gold/40 hover:text-foreground"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Field cards */}
      <div className="space-y-6">
        {visibleFields.length === 0 && (
          <div className="rounded-2xl border border-border-accent bg-background px-6 py-8 text-center">
            <p className="font-sans text-sm text-muted-dark">No options found for this section.</p>
            <p className="font-sans mt-1 text-xs text-slate">This may be a content gap — check back soon or contact us for a consultation.</p>
          </div>
        )}
        {visibleFields.map((field) => {
          const current = selections[field.id] ?? field.defaultValue;
          // Soft relevance ranking: best matches first, nothing removed.
          const { ranked, bestCount, filtered } = rankOptions(field, quiz[field.id]);
          const expanded = expandedFields.has(field.id);
          const collapsible = filtered && bestCount < ranked.length;
          const shown = collapsible && !expanded ? ranked.slice(0, bestCount) : ranked;
          const hiddenCount = ranked.length - shown.length;
          const isCollapsed = collapsedFields.has(field.id);
          return (
            <div key={field.id}>
              <button
                type="button"
                onClick={() => toggleCollapsed(field.id)}
                className="mb-3 flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none"
              >
                <div className="flex items-center gap-2">
                  <p className="font-display text-base font-semibold text-foreground">{field.label}</p>
                  {collapsible && !expanded && !isCollapsed && (
                    <span className="font-sans rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-gold">
                      Top {bestCount} {bestCount === 1 ? "match" : "matches"}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {field.hint && <p className="font-sans text-xs text-muted-dark">{field.hint}</p>}
                  <svg
                    width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
                    className={`text-slate transition-transform duration-200 ${isCollapsed ? "-rotate-90" : "rotate-0"}`}
                  >
                    <path d="M2.5 5l4.5 4.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
              {!isCollapsed && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        id={opt.id}
                        label={opt.label}
                        description={opt.description}
                        priceAdj={opt.priceAdj}
                        image={opt.image}
                        images={opt.images}
                        aiImage={opt.aiImage}
                        realImage={opt.realImage}
                        selected={current === opt.id}
                        onClick={() => onSelect(field.id, opt.id)}
                        onExpand={(opt.image || opt.aiImage || opt.realImage || opt.images?.length) ? () => setLightbox({
                          items: [
                            ...(opt.image ? [{ url: opt.image, role: "Illustration" }] : []),
                            ...(opt.aiImage ? [{ url: opt.aiImage, role: "AI render" }] : []),
                            ...(opt.realImage ? [{ url: opt.realImage, role: "Real photo" }] : []),
                            ...(opt.images ?? []).map((u) => ({ url: u, role: "Photo" })),
                          ],
                          label: opt.label,
                          description: opt.description,
                        }) : undefined}
                      />
                    ))}
                  </div>
                  {collapsible && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(field.id)}
                      className="font-sans mt-3 text-xs text-slate underline underline-offset-2 transition-colors hover:text-gold focus-visible:outline-none"
                    >
                      {expanded
                        ? "Show best matches only"
                        : `Show all ${ranked.length} options${hiddenCount ? ` (+${hiddenCount})` : ""}`}
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Advanced options toggle */}
      {advancedCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="font-sans inline-flex items-center gap-2 rounded-full border border-border-accent px-5 py-2 text-xs text-muted-dark transition-[border-color,color] hover:border-gold/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`transition-transform duration-150 ${showAdvanced ? "rotate-180" : ""}`}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {showAdvanced ? "Hide" : "Show"} advanced options ({advancedCount})
        </button>
      )}

      {lightbox && (
        <ImageLightbox items={lightbox.items} label={lightbox.label} description={lightbox.description} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

/* ─── Step 4: Monogram / Embroidery ─────────────────────────── */

function MonogramStep({ productSlug }: { productSlug: string }) {
  const { monograms, setMonogram, addMonogram, removeMonogram } = useBuilderStore();
  const placements = monogramPlacements[productSlug] ?? [];

  return (
    <div className="space-y-6">
      <p className="font-sans text-sm leading-[1.7] text-muted-dark">
        The first monogram is <span className="text-gold">complimentary</span>. Additional monograms are <strong className="text-foreground">+$10 each</strong> (max 3 total).
      </p>

      {monograms.map((mono, idx) => (
        <div key={idx} className="rounded-[1.5rem] border border-border-accent bg-background p-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="font-display text-base font-semibold text-foreground">
              Monogram {idx + 1}
              {idx === 0 && <span className="font-sans ml-2 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs text-gold">Complimentary</span>}
              {idx > 0 && <span className="font-sans ml-2 text-xs text-gold">+$10</span>}
            </p>
            {idx > 0 && (
              <button
                type="button"
                onClick={() => removeMonogram(idx)}
                className="font-sans text-xs text-muted-dark hover:text-[#EF4444] transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          {/* Text */}
          <label className="block space-y-2">
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted-dark">Text (max 32 characters)</span>
            <input
              type="text"
              maxLength={32}
              value={mono.text}
              onChange={(e) => setMonogram(idx, { text: e.target.value })}
              placeholder="e.g. C.A.S. or Chase A. Stanley"
              className="font-sans w-full rounded-[1rem] border border-border-accent bg-surface-strong px-4 py-3 text-sm text-foreground outline-none placeholder:text-[#4A5568] transition-[border-color,box-shadow] focus:border-gold focus:shadow-[0_0_0_2px_rgba(212,175,55,0.15)]"
            />
            <span className="font-sans text-xs text-muted-dark">{mono.text.length}/32 characters</span>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Font */}
            <div className="space-y-2">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-muted-dark">Font</p>
              <div className="grid gap-2">
                {monogramFonts.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setMonogram(idx, { font: f.id })}
                    className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-[border-color,background] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${mono.font === f.id ? "border-gold bg-[#122742] font-semibold text-foreground" : "border-border-accent bg-surface-strong text-muted-dark hover:border-gold/40"}`}
                  >
                    <span className="font-sans">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Thread color */}
            <div className="space-y-2">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-muted-dark">Thread Color</p>
              <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-12 gap-1.5 max-h-56 overflow-y-auto pr-1 rounded-xl">
                {monogramThreadColors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setMonogram(idx, { threadColor: c.id })}
                    title={c.label}
                    className={`relative overflow-hidden rounded-lg border-2 aspect-square transition-[border-color,transform] hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${mono.threadColor === c.id ? "border-gold scale-105" : "border-border-accent hover:border-gold/50"}`}
                  >
                    <img src={c.image} alt={c.label} className="h-full w-full object-cover" />
                    {mono.threadColor === c.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                        <span className="text-gold text-[10px] font-bold drop-shadow">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="font-sans text-xs text-gold">
                {monogramThreadColors.find(c => c.id === mono.threadColor)?.label ?? "Select color"}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Placement */}
            {placements.length > 0 && (
              <div className="space-y-2">
                <p className="font-sans text-xs uppercase tracking-[0.2em] text-muted-dark">Placement</p>
                <div className="grid gap-2">
                  {placements.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMonogram(idx, { placement: p })}
                      className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-[border-color,background] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${mono.placement === p ? "border-gold bg-[#122742] font-semibold text-foreground" : "border-border-accent bg-surface-strong text-muted-dark hover:border-gold/40"}`}
                    >
                      <span className="font-sans">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            <div className="space-y-2">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-muted-dark">Size</p>
              {(["small", "medium", "large"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMonogram(idx, { size: s })}
                  className={`mr-2 rounded-xl border px-5 py-2.5 text-sm capitalize transition-[border-color,background] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${mono.size === s ? "border-gold bg-[#122742] font-semibold text-foreground" : "border-border-accent bg-surface-strong text-muted-dark hover:border-gold/40"}`}
                >
                  <span className="font-sans">{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {monograms.length < 3 && (
        <button
          type="button"
          onClick={addMonogram}
          className="font-sans inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-sm font-semibold text-gold transition-[border-color,background] hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          + Add another monogram <span className="font-sans text-xs opacity-70">(+$10)</span>
        </button>
      )}
    </div>
  );
}

/* ─── Step 5: Measurements ───────────────────────────────────── */

type MeasureTab = "tryon" | "body" | "finished";

function MeasurementsStep({ productSlug }: { productSlug: string }) {
  const {
    measureMode, standardSize, customMeasurements,
    chestAllowance, wearingHabit,
    setMeasureMode, setStandardSize, setCustomMeasurement,
    setChestAllowance, setWearingHabit,
  } = useBuilderStore();
  const [unit, setUnit] = useState<"cm" | "inch">("cm");
  const [tab, setTab] = useState<MeasureTab>("body");

  const isShirt = productSlug === "shirt";
  const isJacket = ["suit-2pc", "suit-3pc", "vest", "sport-coat"].includes(productSlug);
  const fields = productMeasurements[productSlug] ?? productMeasurements.shirt;
  const sizes = standardSizes[productSlug] ?? [];
  const bodyFields = fields.filter(f => f.group === "body");
  const finishedFields = fields.filter(f => f.group === "finished");

  function computeFinished(key: string, bodyVal: string): string {
    const n = parseFloat(bodyVal);
    if (!n || isNaN(n)) return "—";
    const field = shirtMeasurementFields.find(f => f.key === key);
    if (!field || !field.hasFinishedPair) return "—";
    const ease = key === "chest_body" ? parseFloat(chestAllowance) || 8 : field.ease;
    const finished = n + (unit === "inch" ? ease / 2.54 : ease);
    return finished.toFixed(1) + " " + unit;
  }

  const inputCls = "font-sans w-full rounded-[0.875rem] border border-border-accent bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-[#4A5568] transition-[border-color,box-shadow] focus:border-gold focus:shadow-[0_0_0_2px_rgba(212,175,55,0.15)]";
  const selectCls = "font-sans rounded-[0.875rem] border border-border-accent bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-[border-color] focus:border-gold appearance-none pr-8";

  return (
    <div className="space-y-5">
      {/* Mode selector — three options */}
      <div className="grid gap-3 sm:grid-cols-3">
        {([
          {
            id: "standard" as const,
            title: "Standard Size",
            desc: "Pick a US size — our tailors fine-tune the pattern.",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/>
              </svg>
            ),
          },
          {
            id: "body" as const,
            title: "Body Measurements",
            desc: "Measure yourself directly — tailors add ease for a comfortable fit. Opens the body measurement guide.",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
              </svg>
            ),
          },
          {
            id: "finished" as const,
            title: "Garment Dimensions",
            desc: "Measure a garment you own — enter its flat dimensions. Opens the finished garment guide.",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
              </svg>
            ),
          },
        ] as const).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMeasureMode(opt.id)}
            className={`group rounded-2xl border p-5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-[0.98] ${
              measureMode === opt.id
                ? "border-gold bg-[#122742] shadow-[0_0_0_1px_#D4AF37]"
                : "border-border-accent bg-surface-strong hover:border-gold/40"
            }`}
          >
            <div className={`mb-3 ${measureMode === opt.id ? "text-gold" : "text-dim"} transition-colors`}>
              {opt.icon}
            </div>
            <p className={`font-sans text-sm font-semibold ${measureMode === opt.id ? "text-gold" : "text-foreground"}`}>
              {opt.title}
            </p>
            <p className="font-sans mt-1 text-xs leading-relaxed text-slate">{opt.desc}</p>
            {measureMode === opt.id && (
              <span className="mt-2 inline-block font-sans text-[9px] uppercase tracking-[0.2em] text-gold">Selected ✓</span>
            )}
          </button>
        ))}
      </div>

      {measureMode === "standard" ? (
        <div className="space-y-4">
          <p className="font-sans text-sm leading-[1.7] text-muted-dark">
            Select the size that most closely matches your build. Our tailors fine-tune the pattern.
          </p>
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
            {sizes.map((size) => (
              <button key={size} type="button" onClick={() => setStandardSize(size)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-[border-color,background] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-[0.98] ${standardSize === size ? "border-gold bg-[#122742] text-gold" : "border-border-accent bg-surface-strong text-foreground hover:border-gold/40"}`}
              >
                <span className="font-sans">{size}</span>
              </button>
            ))}
          </div>
          {standardSize && (
            <div className="rounded-2xl border border-gold/25 bg-gold/5 px-5 py-4">
              <p className="font-sans text-xs uppercase tracking-[0.25em] text-gold">Selected size</p>
              <p className="font-display mt-1 text-2xl font-semibold text-foreground">{standardSize}</p>
            </div>
          )}
        </div>
      ) : isShirt ? (
        /* ── Shirt custom measurement UI ─── */
        <div className="space-y-5">
          {/* Top controls row */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Chest allowance */}
            <div className="space-y-1.5">
              <label className="font-sans block text-xs font-semibold uppercase tracking-[0.15em] text-[#C9C1B3]">
                Extra Room for Movement <span className="text-gold">*</span>
              </label>
              <div className="relative">
                <select aria-label="Extra Room for Movement" value={chestAllowance} onChange={e => setChestAllowance(e.target.value)} className={selectCls}>
                  {chestAllowanceOptions.map(v => (
                    <option key={v} value={v}>{v} CM</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark">▾</span>
              </div>
            </div>

            {/* Wearing habit */}
            <div className="space-y-1.5">
              <label className="font-sans block text-xs font-semibold uppercase tracking-[0.15em] text-[#C9C1B3]">
                How You Plan to Wear It <span className="text-gold">*</span>
              </label>
              <div className="relative">
                <select aria-label="How You Plan to Wear It" value={wearingHabit} onChange={e => setWearingHabit(e.target.value)} className={selectCls}>
                  <option value="">Select…</option>
                  {wearingHabitOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark">▾</span>
              </div>
            </div>

            {/* Unit toggle — pushed to the right */}
            <div className="ml-auto flex gap-0.5 rounded-xl border border-border-accent bg-surface-strong p-1">
              {(["cm", "inch"] as const).map(u => (
                <button key={u} type="button" onClick={() => setUnit(u)}
                  className={`font-sans rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition-[background,color] duration-150 ${unit === u ? "bg-gold text-background" : "text-muted-dark hover:text-foreground"}`}
                >
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Measurement tabs */}
          <div className="flex gap-0 rounded-2xl border border-border-accent bg-surface-strong p-1 w-fit">
            {([
              ["tryon",    "Try-on"],
              ["body",     "Body Measurement"],
              ["finished", "Finished Measurement"],
            ] as [MeasureTab, string][]).map(([t, label]) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`font-sans rounded-xl px-4 py-2 text-xs font-semibold transition-[background,color] duration-150 ${tab === t ? "bg-[#122742] text-gold" : "text-muted-dark hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Body measurement tab */}
          {tab === "body" && (
            <div className="overflow-x-auto rounded-[1.5rem] border border-border-accent">
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="border-b border-border-accent bg-background">
                    <th className="font-sans px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-dark">Field</th>
                    <th className="font-sans px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-dark">Body ({unit.toUpperCase()})</th>
                    <th className="font-sans px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-dark">Finished Size</th>
                  </tr>
                </thead>
                <tbody>
                  {shirtMeasurementFields.map((field, i) => (
                    <tr key={field.key} className={`border-b border-border-accent/50 ${i % 2 === 0 ? "bg-surface-strong" : "bg-background"}`}>
                      <td className="px-5 py-3">
                        <span className="font-sans text-sm text-[#C9C1B3]">
                          {field.label}
                          {field.required && <span className="ml-1 text-gold">*</span>}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={customMeasurements[field.key] ?? ""}
                          onChange={e => setCustomMeasurement(field.key, e.target.value)}
                          placeholder={unit === "cm" ? "0.0" : "0.0"}
                          className={inputCls + " max-w-[120px]"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-sans text-sm text-muted-dark">
                          {field.hasFinishedPair
                            ? computeFinished(field.key, customMeasurements[field.key] ?? "")
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Try-on measurement tab */}
          {tab === "tryon" && (
            <div className="overflow-x-auto rounded-[1.5rem] border border-border-accent">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border-accent bg-background">
                    <th className="font-sans px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-dark">Field</th>
                    <th className="font-sans px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-dark">Try-on ({unit.toUpperCase()})</th>
                  </tr>
                </thead>
                <tbody>
                  {shirtMeasurementFields.map((field, i) => (
                    <tr key={field.key} className={`border-b border-border-accent/50 ${i % 2 === 0 ? "bg-surface-strong" : "bg-background"}`}>
                      <td className="px-5 py-3">
                        <span className="font-sans text-sm text-[#C9C1B3]">
                          {field.label}
                          {field.required && <span className="ml-1 text-gold">*</span>}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={customMeasurements[`tryon_${field.key}`] ?? ""}
                          onChange={e => setCustomMeasurement(`tryon_${field.key}`, e.target.value)}
                          placeholder="0.0"
                          className={inputCls + " max-w-[120px]"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Finished measurement tab */}
          {tab === "finished" && (
            <div className="overflow-x-auto rounded-[1.5rem] border border-border-accent">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border-accent bg-background">
                    <th className="font-sans px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-dark">Field</th>
                    <th className="font-sans px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-dark">Finished Size ({unit.toUpperCase()})</th>
                  </tr>
                </thead>
                <tbody>
                  {shirtMeasurementFields.filter(f => f.hasFinishedPair).map((field, i) => (
                    <tr key={field.key} className={`border-b border-border-accent/50 ${i % 2 === 0 ? "bg-surface-strong" : "bg-background"}`}>
                      <td className="px-5 py-3">
                        <span className="font-sans text-sm text-[#C9C1B3]">{field.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-sans text-sm text-muted-dark">
                          {computeFinished(field.key, customMeasurements[field.key] ?? "")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="font-sans px-5 py-3 text-xs text-muted-dark">
                Finished sizes are computed from your body measurements using standard shirt ease allowances. Your tailor may adjust these values.
              </p>
            </div>
          )}

          <p className="font-sans text-xs text-muted-dark">
            Fields marked <span className="text-gold">*</span> are required. All measurements in {unit === "cm" ? "centimetres" : "inches"}.
          </p>
        </div>
      ) : isJacket ? (
        /* ── Jacket finished-measurement UI ─── */
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-4">
            {/* Chest allowance */}
            <div className="space-y-1.5">
              <label className="font-sans block text-xs font-semibold uppercase tracking-[0.15em] text-[#C9C1B3]">
                Body–Finished Allowance on Chest <span className="text-gold">*</span>
              </label>
              <div className="relative">
                <select aria-label="Body–Finished Allowance on Chest" value={chestAllowance} onChange={e => setChestAllowance(e.target.value)} className={selectCls}>
                  {jacketChestAllowanceOptions.map(v => (
                    <option key={v} value={v}>{v} CM</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark">▾</span>
              </div>
            </div>
            {/* Wearing habit */}
            <div className="space-y-1.5">
              <label className="font-sans block text-xs font-semibold uppercase tracking-[0.15em] text-[#C9C1B3]">
                How You Plan to Wear It <span className="text-gold">*</span>
              </label>
              <div className="relative">
                <select aria-label="How You Plan to Wear It" value={wearingHabit} onChange={e => setWearingHabit(e.target.value)} className={selectCls}>
                  <option value="">Select…</option>
                  {jacketWearingHabitOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark">▾</span>
              </div>
            </div>
            {/* Unit toggle */}
            <div className="ml-auto flex gap-0.5 rounded-xl border border-border-accent bg-surface-strong p-1">
              {(["cm", "inch"] as const).map(u => (
                <button key={u} type="button" onClick={() => setUnit(u)}
                  className={`font-sans rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition-[background,color] duration-150 ${unit === u ? "bg-gold text-background" : "text-muted-dark hover:text-foreground"}`}
                >
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-[1.5rem] border border-border-accent">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-border-accent bg-background">
                  <th className="font-sans px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-dark">Field</th>
                  <th className="font-sans px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-dark">Measurement ({unit.toUpperCase()})</th>
                </tr>
              </thead>
              <tbody>
                {jacketMeasurementFields.map((field, i) => (
                  <tr key={field.key} className={`border-b border-border-accent/50 ${i % 2 === 0 ? "bg-surface-strong" : "bg-background"}`}>
                    <td className="px-5 py-3">
                      <span className="font-sans text-sm text-[#C9C1B3]">
                        {field.label}
                        {field.required && <span className="ml-1 text-gold">*</span>}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {field.unit === "none" ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={customMeasurements[field.key] ?? ""}
                          onChange={e => setCustomMeasurement(field.key, e.target.value)}
                          placeholder="0"
                          className={inputCls + " max-w-[100px]"}
                        />
                      ) : (
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={customMeasurements[field.key] ?? ""}
                          onChange={e => setCustomMeasurement(field.key, e.target.value)}
                          placeholder="0.0"
                          className={inputCls + " max-w-[120px]"}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-sans text-xs text-muted-dark">
            Fields marked <span className="text-gold">*</span> are required. Enter finished garment dimensions in {unit === "cm" ? "centimetres" : "inches"}.
          </p>
        </div>
      ) : (
        /* ── Generic custom measurement UI (trousers etc.) ─── */
        <div className="space-y-6">
          <p className="font-sans text-sm leading-[1.7] text-muted-dark">
            Enter all measurements in inches or centimetres. Our pattern-makers review every entry before cutting.
          </p>
          {bodyFields.length > 0 && (
            <div>
              <p className="font-sans mb-4 text-xs uppercase tracking-[0.3em] text-gold">Body Measurements</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bodyFields.map((field) => (
                  <label key={field.key} className="block space-y-2">
                    <span className="font-sans block text-xs font-semibold uppercase tracking-[0.2em] text-[#C9C1B3]">{field.label}</span>
                    <input
                      type="text"
                      value={customMeasurements[field.key] ?? ""}
                      onChange={(e) => setCustomMeasurement(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="font-sans w-full rounded-[1rem] border border-border-accent bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-[#4A5568] transition-[border-color,box-shadow] focus:border-gold focus:shadow-[0_0_0_2px_rgba(212,175,55,0.15)]"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
          {finishedFields.length > 0 && (
            <div>
              <p className="font-sans mb-4 text-xs uppercase tracking-[0.3em] text-gold">Garment Dimensions (optional)</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {finishedFields.map((field) => (
                  <label key={field.key} className="block space-y-2">
                    <span className="font-sans block text-xs font-semibold uppercase tracking-[0.2em] text-[#C9C1B3]">{field.label}</span>
                    <input
                      type="text"
                      value={customMeasurements[field.key] ?? ""}
                      onChange={(e) => setCustomMeasurement(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="font-sans w-full rounded-[1rem] border border-border-accent bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-[#4A5568] transition-[border-color,box-shadow] focus:border-gold focus:shadow-[0_0_0_2px_rgba(212,175,55,0.15)]"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Step 6: Posture Adjustments ────────────────────────────── */

function PostureStep() {
  const { postureAdjustments, setPostureAdjustment } = useBuilderStore();

  return (
    <div className="space-y-6">
      <p className="font-sans text-sm leading-[1.7] text-muted-dark">
        Select any posture or body traits that apply. Our tailors will adjust the block for a perfect fit and drape. All adjustments are optional. For example: rounded shoulders, forward posture, or a high hip.
      </p>
      {postureFields.map((field) => {
        const current = postureAdjustments[field.id];
        return (
          <div key={field.id}>
            <p className="font-display mb-3 text-base font-semibold text-foreground">{field.label}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {field.options.map((opt) => (
                <OptionCard
                  key={opt.id}
                  id={opt.id}
                  label={opt.label}
                  description={opt.description}
                  selected={current === opt.id}
                  onClick={() => setPostureAdjustment(field.id, opt.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */

type AdminFabric = { id: string; label: string; detail: string; premium: boolean; collection?: string; photoImage?: string; codeImage?: string; image?: string; color?: string[]; pattern?: string; weight?: "light" | "medium" | "heavy"; finish?: "crisp" | "soft" | "luxurious" | "textured"; season?: string[]; occasion?: string[] };

export default function BuilderProductPage({ params }: BuilderPageProps) {
  const { product: productSlug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(2);
  const [shareCopied, setShareCopied] = useState(false);
  const [liveConfig, setLiveConfig] = useState<ProductDesignConfig | null>(null);
  const [activeFabrics, setActiveFabrics] = useState(fabrics);
  const [fabricsLoading, setFabricsLoading] = useState(true);
  const [fabricsError, setFabricsError] = useState(false);
  const [optionsError, setOptionsError] = useState(false);
  const [discoveryDone, setDiscoveryDone] = useState(false);
  const [fabricsExpanded, setFabricsExpanded] = useState(false);

  const fetchFabrics = useCallback(() => {
    setFabricsLoading(true);
    setFabricsError(false);
    fetch("/api/admin/fabrics")
      .then((r) => r.json())
      .then((adminFabrics: AdminFabric[]) => {
        setFabricsLoading(false);
        if (!adminFabrics?.length) return;
        setActiveFabrics(adminFabrics.map((f) => ({
          id: f.id,
          label: f.label,
          detail: f.detail,
          premium: f.premium,
          image: f.photoImage ?? f.codeImage ?? f.image ?? undefined,
          color: f.color,
          pattern: f.pattern,
          weight: f.weight,
          finish: f.finish,
          season: f.season,
          occasion: f.occasion,
        })));
      })
      .catch(() => { setFabricsLoading(false); setFabricsError(true); });
  }, []);

  useEffect(() => {
    fetchFabrics();
  }, [fetchFabrics]);

  useEffect(() => {
    setOptionsError(false);
    // Public, ungated options endpoint — serves the live config (with quiz
    // metadata) to customers. The admin endpoint is auth-gated (401 for guests).
    fetch(`/api/options/${productSlug}`)
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then((data: ProductDesignConfig) => {
        if (data && Array.isArray(data.sections)) setLiveConfig(data);
        else setLiveConfig(allProductDesigns[productSlug] ?? null);
      })
      .catch(() => {
        setOptionsError(true);
        setLiveConfig(allProductDesigns[productSlug] ?? null);
      });
  }, [productSlug]);

  const product = useMemo(
    () => builderProducts.find((p) => p.id === productSlug) ?? builderProducts[0],
    [productSlug]
  );

  const {
    product: selectedProduct,
    fabric,
    fabricPremium,
    designSelections,
    monograms,
    measureMode,
    standardSize,
    customMeasurements,
    chestAllowance,
    wearingHabit,
    postureAdjustments,
    styleQuiz,
    discoveryQuiz,
    price,
    setProduct,
    setFabric,
    setDesignSelection,
    clearDiscoveryQuiz,
    hydrateState,
  } = useBuilderStore();

  const [showMeasuringGuide, setShowMeasuringGuide] = useState(false);

  // Hydrate from share URL (?c=...)
  useEffect(() => {
    const encoded = searchParams.get("c");
    if (!encoded) return;
    const decoded = decodeShare(encoded);
    if (!decoded) return;
    hydrateState({
      fabric: decoded.fabric,
      fabricPremium: decoded.fabricPremium,
      designSelections: decoded.designSelections,
      measureMode: decoded.measureMode,
      standardSize: decoded.standardSize,
      customMeasurements: decoded.customMeasurements,
      chestAllowance: decoded.chestAllowance,
      wearingHabit: decoded.wearingHabit,
      postureAdjustments: decoded.postureAdjustments,
      styleQuiz: decoded.styleQuiz,
      discoveryQuiz: decoded.discoveryQuiz,
      monograms: decoded.monograms,
    });
    if (decoded.activeStep && decoded.activeStep > 2) {
      setActiveStep(decoded.activeStep);
    }
    // Remove ?c= from URL without navigating away
    const url = new URL(window.location.href);
    url.searchParams.delete("c");
    window.history.replaceState({}, "", url.toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Copy share URL to clipboard
  const handleShare = useCallback(() => {
    const encoded = encodeShare({
      fabric,
      fabricPremium,
      designSelections,
      measureMode,
      standardSize,
      customMeasurements: customMeasurements ?? {},
      chestAllowance,
      wearingHabit,
      postureAdjustments: postureAdjustments ?? {},
      styleQuiz: styleQuiz ?? {},
      discoveryQuiz: discoveryQuiz ?? {},
      monograms,
      activeStep,
    });
    const url = `${window.location.origin}/builder/${productSlug}?c=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  }, [fabric, fabricPremium, designSelections, measureMode, standardSize,
      customMeasurements, chestAllowance, wearingHabit, postureAdjustments,
      styleQuiz, discoveryQuiz, monograms, activeStep, productSlug]);

  useEffect(() => {
    if (productSlug && productSlug !== selectedProduct) {
      setProduct(productSlug);
    }
  }, [productSlug, selectedProduct, setProduct]);

  // Pre-select fabric arriving from the fabric book
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("builder-pending-fabric");
    if (!raw) return;
    try {
      const f = JSON.parse(raw) as { id: string; label: string; detail: string; premium: boolean; image?: string };
      sessionStorage.removeItem("builder-pending-fabric");
      setActiveFabrics((prev) => {
        if (prev.some((p) => p.id === f.id)) return prev;
        return [{ id: f.id, label: f.label, detail: f.detail, premium: f.premium, image: f.image }, ...prev];
      });
      setFabric(f.id, f.premium);
      setActiveStep(2);
    } catch {
      sessionStorage.removeItem("builder-pending-fabric");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered fabrics based on discovery quiz answers
  const discoveryComplete = discoveryDone;
  const fabricRanking = useMemo(
    () => rankFabrics(activeFabrics, discoveryQuiz),
    [activeFabrics, discoveryQuiz]
  );

  const { addItem } = useCart();
  const [cartAdded, setCartAdded] = useState(false);

  function handleAddToCart() {
    addItem({
      id: `bespoke-${productSlug}-${Date.now()}`,
      name: `Bespoke ${product.label}`,
      price,
      image: product.image,
      type: "bespoke",
      config: {
        fabric,
        fabricLabel: activeFabrics.find((f) => f.id === fabric)?.label ?? fabric,
        designSelections,
        measureMode,
        standardSize: measureMode === "standard" ? standardSize : undefined,
        customMeasurements: (measureMode === "body" || measureMode === "finished") ? customMeasurements : undefined,
        chestAllowance,
        wearingHabit,
        postureAdjustments,
        monograms: monograms.filter((m) => m.text),
      },
    });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  }

  const goNext = () => setActiveStep((s) => Math.min(STEPS.length, s + 1));
  const goBack = () => {
    if (activeStep === 2) { router.push("/builder"); return; }
    setActiveStep((s) => Math.max(2, s - 1));
  };

  /* ── Step content ──────────────────────────────────────────── */

  const renderStep = () => {
    /* Step 1 — Product */
    if (activeStep === 1) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {builderProducts.map((p) => (
            <Link
              key={p.id}
              href={`/builder/${p.id}`}
              className={`group relative overflow-hidden rounded-[1.5rem] border p-5 transition-[border-color,background] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${selectedProduct === p.id ? "border-gold bg-[#122742]" : "border-border-accent bg-background hover:border-gold/40"}`}
            >
              <div className="relative aspect-[3/2] overflow-hidden rounded-[1rem] bg-surface-deep">
                <img src={p.image} alt={p.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {selectedProduct === p.id && <div className="absolute inset-0 bg-gold/10" />}
              </div>
              <div className="mt-4 flex items-start justify-between gap-2">
                <div>
                  <p className="font-sans text-xs uppercase tracking-[0.25em] text-gold">{p.label}</p>
                  <p className="font-display mt-1 text-base font-semibold text-foreground">{p.description}</p>
                </div>
                {selectedProduct === p.id && (
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-background">✓</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      );
    }

    /* Step 2 — Fabric */
    if (activeStep === 2) {
      // Show the discovery funnel until the customer answers it or skips.
      if (!discoveryComplete) {
        return (
          <FabricDiscovery
            onComplete={() => { setDiscoveryDone(true); setFabricsExpanded(false); }}
          />
        );
      }

      const { ranked, bestCount, filtered } = fabricRanking;
      const displayFabrics = filtered && !fabricsExpanded ? ranked.slice(0, bestCount) : ranked;

      return (
        <div className="space-y-4">
          {/* Discovery profile bar */}
          {filtered && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
              <p className="font-sans text-xs text-slate">
                <span className="font-semibold text-foreground">{bestCount}</span> of {activeFabrics.length} fabrics best match your profile
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => { clearDiscoveryQuiz(); setDiscoveryDone(false); setFabricsExpanded(false); }}
                  className="font-sans text-xs text-gold underline hover:no-underline focus-visible:outline-none"
                >
                  Edit preferences
                </button>
                <button
                  type="button"
                  onClick={() => setFabricsExpanded((v) => !v)}
                  className="font-sans text-xs text-slate hover:text-muted-dark focus-visible:outline-none"
                >
                  {fabricsExpanded ? "Show matches only" : "Show all →"}
                </button>
              </div>
            </div>
          )}
          {fabricsLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg bg-[#1a2744] h-48" />
              ))}
            </div>
          )}
          {fabricsError && (
            <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 flex items-center justify-between">
              <span className="text-red-300 text-sm">Failed to load fabrics. Please try again.</span>
              <button
                type="button"
                onClick={() => fetchFabrics()}
                className="text-sm text-gold underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
          {!fabricsLoading && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {displayFabrics.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFabric(f.id, f.premium)}
              className={`rounded-[1.5rem] border p-6 text-left transition-[border-color,background] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-[0.98] ${fabric === f.id ? "border-gold bg-[#122742]" : "border-border-accent bg-background hover:border-gold/40"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {(f as { image?: string }).image && (
                    <img
                      src={(f as { image?: string }).image}
                      alt={f.label}
                      className="h-9 w-9 shrink-0 rounded-md object-cover border border-border-accent"
                    />
                  )}
                  <div>
                    <p className="font-sans text-xs uppercase tracking-[0.25em] text-gold">{f.premium ? "Premium" : "Classic"}</p>
                    <h3 className="font-display mt-1 text-lg font-semibold text-foreground">{f.label}</h3>
                  </div>
                </div>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${fabric === f.id ? "border-gold bg-gold text-background" : "border-[#31425B]"}`}>
                  {fabric === f.id && "✓"}
                </span>
              </div>
              <p className="font-sans mt-3 text-sm leading-[1.7] text-muted-dark">{f.detail}</p>
              {f.premium && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="font-sans inline-flex items-center gap-1 rounded-full border border-gold/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-gold">+$150</span>
                  <span className="font-sans text-[11px] text-slate">Super 120–150s Italian mill wool</span>
                </div>
              )}
            </button>
          ))}
          </div>}
        </div>
      );
    }

    /* Step 3 — Style Quiz */
    if (activeStep === 3) {
      const quizConfig = liveConfig ?? allProductDesigns[productSlug] ?? null;
      return (
        <StyleQuizStep
          config={quizConfig}
          onComplete={() => {
            applyDesignDNA(quizConfig, styleQuiz, designSelections, setDesignSelection);
            setActiveStep(4);
          }}
        />
      );
    }

    /* Step 4 — Design */
    if (activeStep === 4) {
      return (
        <DesignStep
          productSlug={productSlug}
          selections={designSelections}
          onSelect={setDesignSelection}
          config={liveConfig}
          quiz={styleQuiz}
          onEditQuiz={() => setActiveStep(3)}
          optionsError={optionsError}
        />
      );
    }

    /* Step 5 — Monogram */
    if (activeStep === 5) {
      return <MonogramStep productSlug={productSlug} />;
    }

    /* Step 6 — Measurements */
    if (activeStep === 6) {
      return <MeasurementsStep productSlug={productSlug} />;
    }

    /* Step 7 — Posture */
    if (activeStep === 7) {
      return <PostureStep />;
    }

    /* Step 8 — Review */
    if (activeStep === 8) {
      const config = liveConfig ?? allProductDesigns[productSlug];
      const activeFields = config?.sections?.flatMap(s => s.fields.map(f => ({
        section: s.label,
        field: f.label,
        selected: f.options.find(o => o.id === (designSelections[f.id] ?? f.defaultValue)),
      }))) ?? [];

      const totalMonogramCost = Math.max(0, monograms.filter(m => m.text).length - 1) * 10;

      return (
        <div className="space-y-8">
          {/* Product + Fabric */}
          <div className="rounded-[1.5rem] border border-border-accent bg-background overflow-hidden">
            <div className="border-b border-border-accent px-6 py-4">
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Selected Configuration</p>
            </div>
            <div className="divide-y divide-border-accent">
              <div className="flex justify-between px-6 py-3">
                <span className="font-sans text-sm text-muted-dark">Product</span>
                <span className="font-sans text-sm font-semibold text-foreground">{product.label}</span>
              </div>
              <div className="flex justify-between px-6 py-3">
                <span className="font-sans text-sm text-muted-dark">Fabric</span>
                <span className="font-sans text-sm font-semibold text-foreground">
                  {activeFabrics.find(f => f.id === fabric)?.label ?? fabric}
                  {fabricPremium && <span className="ml-2 text-xs text-gold">+$150</span>}
                </span>
              </div>
              <div className="flex justify-between px-6 py-3">
                <span className="font-sans text-sm text-muted-dark">Measurements</span>
                <span className="font-sans text-sm font-semibold text-foreground">
                  {measureMode === "standard" ? `Standard ${standardSize || "(not selected)"}` : measureMode === "finished" ? "Garment measurements provided" : "Body measurements provided"}
                </span>
              </div>
              {Object.entries(postureAdjustments).filter(([, v]) => v && !v.includes("normal")).map(([k, v]) => {
                const pField = postureFields.find(f => f.id === k);
                const pOpt = pField?.options.find(o => o.id === v);
                return pOpt ? (
                  <div key={k} className="flex justify-between px-6 py-3">
                    <span className="font-sans text-sm text-muted-dark">{pField?.label}</span>
                    <span className="font-sans text-sm font-semibold text-foreground">{pOpt.label}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Design selections summary */}
          <div className="rounded-[1.5rem] border border-border-accent bg-background overflow-hidden">
            <div className="border-b border-border-accent px-6 py-4">
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Design Selections</p>
            </div>
            <div className="divide-y divide-border-accent max-h-80 overflow-y-auto">
              {activeFields.map(({ section, field, selected }, i) => selected ? (
                <div key={i} className="flex flex-col gap-0.5 px-6 py-3 sm:flex-row sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <span className="font-sans text-xs text-muted-dark">{section} — {field}</span>
                  </div>
                  <span className="font-sans text-sm font-semibold text-foreground shrink-0">{selected.label}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Monograms */}
          {monograms.filter(m => m.text).length > 0 && (
            <div className="rounded-[1.5rem] border border-border-accent bg-background overflow-hidden">
              <div className="border-b border-border-accent px-6 py-4">
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Monograms</p>
              </div>
              <div className="divide-y divide-border-accent">
                {monograms.filter(m => m.text).map((m, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="font-sans text-sm font-semibold text-foreground">&ldquo;{m.text}&rdquo;</p>
                      <p className="font-sans text-xs text-muted-dark">
                        {monogramFonts.find(f => f.id === m.font)?.label} · {monogramThreadColors.find(c => c.id === m.threadColor)?.label} · {m.placement || "Placement TBC"} · {m.size}
                      </p>
                    </div>
                    <span className="font-sans text-xs text-gold">{i === 0 ? "Complimentary" : "+$10"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price breakdown + scripture */}
          <div className="rounded-[1.5rem] border border-gold/25 bg-surface-strong p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-sans text-muted-dark">Base price ({product.label})</span>
                <span className="font-sans text-foreground">${(price - (fabricPremium ? 150 : 0) - totalMonogramCost).toLocaleString()}</span>
              </div>
              {fabricPremium && (
                <div className="flex justify-between text-sm">
                  <span className="font-sans text-muted-dark">Premium fabric</span>
                  <span className="font-sans text-foreground">+$150</span>
                </div>
              )}
              {totalMonogramCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-sans text-muted-dark">Additional monograms</span>
                  <span className="font-sans text-foreground">+${totalMonogramCost}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border-accent pt-3">
                <span className="font-display text-lg font-semibold text-foreground">Total</span>
                <span className="font-display text-2xl font-semibold text-gold">${price.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-border-accent pt-4 text-center">
              <p className="font-display text-sm italic text-muted-dark">
                &ldquo;The LORD shall make thee the head, and not the tail.&rdquo;
              </p>
              <p className="font-sans mt-1 text-xs text-muted-dark">— Deuteronomy 28:13</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`font-sans w-full rounded-full py-4 text-base font-semibold transition-[background,opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                cartAdded ? "bg-[#1a3a1a] text-[#4ade80]" : "bg-gold text-background"
              }`}
            >
              {cartAdded ? "Added to cart ✓" : `Add to Cart — $${price.toLocaleString()}`}
            </button>

            {/* Book a consultation */}
            <Link
              href={`/consultation?product=${encodeURIComponent(product?.label ?? "")}`}
              className="font-sans w-full rounded-full border border-gold/40 py-3 text-sm font-semibold text-gold transition-all hover:bg-gold/10 hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>
              Book a Consultation
            </Link>

            {/* Share this build */}
            <button
              type="button"
              onClick={handleShare}
              className="font-sans w-full rounded-full border border-border-accent py-3 text-sm font-semibold text-muted-dark transition-all hover:border-gold/50 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold flex items-center justify-center gap-2"
            >
              {shareCopied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 6l3 3 5-5"/></svg>
                  Link copied to clipboard!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                  Share this build
                </>
              )}
            </button>
          </div>
        </div>
      );
    }
  };

  const stepLabels = ["Product", "Fabric", "Style", "Design", "Monogram", "Measurements", "Posture", "Review"];

  return (
    <>
    <main className="min-h-screen bg-background pt-20 text-foreground">
      {/* Step pills */}
      <div className="border-b border-border-accent bg-background/95 backdrop-blur-md sticky top-20 z-30">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {stepLabels.map((label, i) => (
              <StepBadge key={label} n={i + 1} label={label} active={activeStep === i + 1} done={activeStep > i + 1} />
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

          {/* Left — main content */}
          <div className="space-y-6">
            {/* Step heading */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">Step {activeStep} of {STEPS.length}</p>
                <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em] text-foreground">
                  {activeStep === 1 && "Select your garment"}
                  {activeStep === 2 && "Choose your fabric"}
                  {activeStep === 3 && "Your style preferences"}
                  {activeStep === 4 && `${product.label} — Design studio`}
                  {activeStep === 5 && "Monogram & embroidery"}
                  {activeStep === 6 && "Measurements"}
                  {activeStep === 7 && "Posture adjustments"}
                  {activeStep === 8 && "Review your order"}
                </h1>
              </div>
              {activeStep === 6 && (
                <button
                  type="button"
                  onClick={() => setShowMeasuringGuide(true)}
                  className="mt-2 shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border-accent px-4 py-2 font-sans text-xs text-muted-dark transition-colors hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  How to Measure
                </button>
              )}
            </div>

            {/* Step content */}
            {renderStep()}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={goBack}
                disabled={activeStep === 1}
                className="font-sans inline-flex items-center gap-2 rounded-full border border-border-accent px-6 py-3 text-sm text-muted-dark transition-[border-color,color] hover:border-gold/40 hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>

              {activeStep < STEPS.length && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={activeStep === 2 && !fabric}
                  className="font-sans inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-background transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Right — Craft choices + order summary */}
          <div className="space-y-5 lg:sticky lg:top-36 lg:h-fit">
            {/* Live Configuration Panel */}
            {(() => {
              const config = liveConfig ?? allProductDesigns[productSlug];
              const chosenSections = config?.sections
                ?.map(section => ({
                  label: section.label,
                  rows: section.fields
                    .filter(f => designSelections[f.id])
                    .map(f => ({
                      field: f.label,
                      value: f.options.find(o => o.id === designSelections[f.id])?.label ?? designSelections[f.id],
                    })),
                }))
                .filter(s => s.rows.length > 0) ?? [];

              const chosenMonograms = monograms.filter(m => m.text);
              const measurementCount = Object.values(customMeasurements ?? {}).filter(Boolean).length;
              const hasMeasurements = (measureMode === "standard" && !!standardSize) || ((measureMode === "body" || measureMode === "finished") && measurementCount > 0);
              const hasPosture = Object.keys(postureAdjustments ?? {}).length > 0;
              const allWearingHabits = [...wearingHabitOptions, ...jacketWearingHabitOptions];
              const hasAnything = fabric || chosenSections.length > 0 || chosenMonograms.length > 0 || hasMeasurements || hasPosture;

              return (
                <div className="rounded-[1.5rem] border border-border-accent bg-surface-strong overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-accent">
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold">Your Configuration</p>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border-accent px-3 py-1 font-sans text-[10px] text-muted-dark transition-colors hover:border-gold/40 hover:text-gold focus-visible:outline-none"
                    >
                      {shareCopied ? (
                        <>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 6l3 3 5-5"/></svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                          Share
                        </>
                      )}
                    </button>
                  </div>

                  <div className="divide-y divide-border-accent max-h-[560px] overflow-y-auto">

                    {/* Empty state */}
                    {!hasAnything && (
                      <div className="px-5 py-10 text-center">
                        <svg className="mx-auto mb-3 text-border-accent" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="font-sans text-xs text-dim">Your selections will appear here as you build</p>
                      </div>
                    )}

                    {/* Fabric */}
                    {fabric && (() => {
                      const f = activeFabrics.find(af => af.id === fabric);
                      if (!f) return null;
                      return (
                        <div className="px-5 py-3.5">
                          <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-slate mb-2">Fabric</p>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-sans text-sm font-medium text-foreground">{f.label}</span>
                            {f.premium && (
                              <span title="Super 120–150s Italian mill wool — superior drape and softness" className="shrink-0 font-sans text-[9px] uppercase tracking-[0.15em] text-gold border border-gold/30 rounded-full px-2 py-0.5 cursor-help">Premium</span>
                            )}
                          </div>
                          <p className="font-sans text-[11px] text-slate mt-0.5 line-clamp-1">{f.detail}</p>
                          {f.premium && (
                            <p className="font-sans text-[10px] text-[#6A7A8C] mt-0.5">Super 120–150s Italian wool · +$150</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Design Selections — one block per section */}
                    {chosenSections.map(section => (
                      <div key={section.label} className="px-5 py-3.5">
                        <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-slate mb-2">{section.label}</p>
                        <div className="space-y-1.5">
                          {section.rows.map(row => (
                            <div key={row.field} className="flex items-start justify-between gap-3">
                              <span className="font-sans text-[11px] text-muted-dark shrink-0">{row.field}</span>
                              <span className="font-sans text-[11px] text-foreground text-right">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Monograms */}
                    {chosenMonograms.length > 0 && (
                      <div className="px-5 py-3.5">
                        <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-slate mb-2">Monogram{chosenMonograms.length > 1 ? "s" : ""}</p>
                        <div className="space-y-1.5">
                          {chosenMonograms.map((m, i) => (
                            <div key={i} className="flex items-start justify-between gap-3">
                              <span className="font-sans text-sm font-semibold text-foreground tracking-widest">{m.text}</span>
                              <span className="font-sans text-[11px] text-muted-dark text-right">{m.placement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Measurements */}
                    {hasMeasurements && (
                      <div className="px-5 py-3.5">
                        <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-slate mb-2">Measurements</p>
                        {measureMode === "standard" ? (
                          <div className="flex items-center justify-between">
                            <span className="font-sans text-[11px] text-muted-dark">Standard Size</span>
                            <span className="font-sans text-[11px] font-medium text-foreground">{standardSize}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="font-sans text-[11px] text-muted-dark">{measureMode === "finished" ? "Garment" : "Body"}</span>
                            <span className="font-sans text-[11px] font-medium text-foreground">{measurementCount} field{measurementCount !== 1 ? "s" : ""} entered</span>
                          </div>
                        )}
                        {chestAllowance && (
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="font-sans text-[11px] text-muted-dark">Extra Room for Movement</span>
                            <span className="font-sans text-[11px] text-foreground">{chestAllowance} cm</span>
                          </div>
                        )}
                        {wearingHabit && (
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="font-sans text-[11px] text-muted-dark">Wearing</span>
                            <span className="font-sans text-[11px] text-foreground">{allWearingHabits.find(w => w.id === wearingHabit)?.label ?? wearingHabit}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Posture Adjustments */}
                    {hasPosture && (
                      <div className="px-5 py-3.5">
                        <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-slate mb-2">Posture</p>
                        <div className="flex items-center justify-between">
                          <span className="font-sans text-[11px] text-muted-dark">Adjustments</span>
                          <span className="font-sans text-[11px] text-foreground">{Object.keys(postureAdjustments).length} applied</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })()}

            {/* Order summary */}
            <div className="rounded-[1.5rem] border border-border-accent bg-surface-strong p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-4">
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Order Summary</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-sans text-muted-dark">{product.label}</span>
                  <span className="font-sans text-foreground">from ${activeFabrics.find(f => f.id === fabric)?.premium ? price - 150 : price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-muted-dark">Fabric</span>
                  <span className="font-sans text-foreground">{activeFabrics.find(f => f.id === fabric)?.label ?? "—"}</span>
                </div>
                {monograms.filter(m => m.text).length > 0 && (
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-dark">Monograms</span>
                    <span className="font-sans text-foreground">{monograms.filter(m => m.text).length}×</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border-accent pt-3">
                  <span className="font-sans font-semibold text-foreground">Est. Total</span>
                  <span className="font-display text-xl font-semibold text-gold">${price.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>

    {/* Measuring guide modal */}
    {showMeasuringGuide && (
      <MeasuringGuide
        initialTab={
          productSlug === "shirt" ? "shirt" :
          productSlug === "trousers" ? "trousers" :
          "jacket"
        }
        initialGuideType={measureMode === "body" ? "body" : "finished"}
        onClose={() => setShowMeasuringGuide(false)}
      />
    )}
  </>
  );
}
