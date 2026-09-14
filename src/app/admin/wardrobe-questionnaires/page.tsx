"use client";

import { useEffect, useState } from "react";
import {
  WARDROBE_STATUSES,
  formatWardrobeAnswer,
  summarizeWardrobeAnswers,
  type WardrobeQuestionnaireStatus,
  type WardrobeQuestionnaireSubmission,
} from "@/data/wardrobe-questionnaire";

type Status = WardrobeQuestionnaireStatus;

const STATUS_COLORS: Record<Status, string> = {
  New:       "badge-new",
  Contacted: "badge-contacted",
  Scheduled: "badge-scheduled",
  Completed: "badge-completed",
  Cancelled: "badge-cancelled",
};

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="font-sans w-44 shrink-0 text-[11px] text-muted-dark">{label}</span>
      <span className="font-sans text-[11px] text-foreground whitespace-pre-wrap">{value}</span>
    </div>
  );
}

export default function WardrobeQuestionnairesPage() {
  const [items, setItems] = useState<WardrobeQuestionnaireSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "All">("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/wardrobe-questionnaires")
      .then((r) => {
        if (!r.ok) throw new Error(`wardrobe questionnaires request failed (${r.status})`);
        return r.json();
      })
      .then((data: WardrobeQuestionnaireSubmission[]) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setLoadError("Could not load questionnaires. Reload to try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: Status) {
    const previous = items;
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    const res = await fetch(`/api/admin/wardrobe-questionnaires/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setItems(previous);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const filtered = items.filter((c) => {
    const matchesFilter = filter === "All" || c.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const newCount = items.filter((c) => c.status === "New").length;

  return (
    <main className="min-h-screen bg-background pt-20 text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-12 space-y-8">

        {/* Header */}
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">Admin</p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-0.03em] text-foreground">
            Wardrobe Questionnaires
          </h1>
          <p className="font-sans mt-2 text-sm text-muted-dark">
            {items.length} total
            {newCount > 0 && <> · <span className="text-gold">{newCount} new</span></>}
          </p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search by name, email, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border-accent bg-surface-deep px-4 py-2.5 font-sans text-sm text-foreground placeholder:text-dim outline-none focus:border-gold transition-colors sm:max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            {(["All", ...WARDROBE_STATUSES] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1 font-sans text-xs font-medium transition-colors ${
                  filter === s
                    ? "bg-gold text-background"
                    : "border border-border-accent text-muted-dark hover:border-gold/50 hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="font-sans text-sm text-muted-dark">Loading…</p>
        ) : loadError ? (
          <div role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-center">
            <p className="font-sans text-sm text-red-300">{loadError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border-accent bg-surface-strong p-12 text-center">
            <p className="font-sans text-sm text-muted-dark">No questionnaires found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const isOpen = expanded.has(c.id);
              const date = new Date(c.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              });
              const priorities = formatWardrobeAnswer("priorities", c.answers.priorities);
              const budget = formatWardrobeAnswer("budget", c.answers.budget);
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-border-accent bg-surface-strong overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
                >
                  {/* Collapsed row */}
                  <div
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#0D2040] transition-colors"
                    onClick={() => toggleExpand(c.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-semibold text-foreground truncate">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="font-sans text-xs text-muted-dark mt-0.5 truncate">
                        {c.id} · {date}
                        {priorities && <> · {priorities}</>}
                        {budget && <> · {budget}</>}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <select
                        value={c.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateStatus(c.id, e.target.value as Status)}
                        className={`rounded-full px-3 py-1 font-sans text-xs font-medium outline-none cursor-pointer appearance-none ${STATUS_COLORS[c.status]}`}
                        aria-label={`Status for ${c.id}`}
                      >
                        {WARDROBE_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-background text-foreground">{s}</option>
                        ))}
                      </select>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                        className={`text-muted-dark transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t border-border-accent bg-surface-deep px-6 py-5 space-y-6">
                      <div className="space-y-2">
                        <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-gold">Contact</p>
                        <Row label="Name"  value={`${c.firstName} ${c.lastName}`} />
                        <Row label="Email" value={c.email} />
                        <Row label="Phone" value={c.phone} />
                      </div>

                      {summarizeWardrobeAnswers(c.answers).map(({ section, rows }) => (
                        <div key={section.id} className="space-y-2">
                          <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-gold">{section.title}</p>
                          {rows.map((r) => (
                            <Row key={r.key} label={r.label} value={r.value} />
                          ))}
                        </div>
                      ))}

                      <div className="flex gap-3 pt-2">
                        <a
                          href={`mailto:${c.email}?subject=Your Wardrobe Questionnaire (${c.id})`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-4 py-1.5 font-sans text-xs text-gold hover:bg-gold/10 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                          </svg>
                          Email customer
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
