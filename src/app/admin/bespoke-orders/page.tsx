"use client";

import { useEffect, useState, useCallback } from "react";
import type { BespokeOrder, BespokeOrderItem } from "@/app/api/admin/bespoke-orders/route";
import { allProductDesigns } from "@/data/options";
import {
  builderProducts,
  wearingHabitOptions,
  jacketWearingHabitOptions,
  monogramFonts,
  monogramThreadColors,
} from "@/data/builder";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRODUCT_ID_MAP: Record<string, string> = Object.fromEntries(
  builderProducts.map((p) => [p.label, p.id])
);

type BespokeStatus = BespokeOrder["status"];

const STATUSES: BespokeStatus[] = [
  "Pending Payment",
  "Paid",
  "In Production",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const STATUS_COLORS: Record<BespokeStatus, string> = {
  "Pending Payment": "badge-pending",
  Paid:              "badge-paid",
  "In Production":   "badge-production",
  Shipped:           "badge-shipped",
  Delivered:         "badge-delivered",
  Cancelled:         "badge-cancelled",
};

function idToLabel(id: string): string {
  return id
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getWearingHabitLabel(id: string): string {
  const all = [...wearingHabitOptions, ...jacketWearingHabitOptions];
  return all.find((w) => w.id === id)?.label ?? idToLabel(id);
}

function getFontLabel(id: string): string {
  return monogramFonts.find((f) => f.id === id)?.label ?? idToLabel(id);
}

function getThreadLabel(id: string): string {
  return monogramThreadColors.find((t) => t.id === id)?.label ?? id;
}

type SectionGroup = { label: string; rows: { field: string; value: string }[] };

function resolveDesignSections(
  productId: string,
  selections: Record<string, string>
): SectionGroup[] {
  const config = allProductDesigns[productId];
  if (!config || !selections || Object.keys(selections).length === 0) return [];

  return config.sections
    .map((section) => {
      const rows = section.fields
        .filter((f) => selections[f.id])
        .map((f) => {
          const opt = f.options.find((o) => o.id === selections[f.id]);
          return {
            field: f.label,
            value: opt ? opt.label : idToLabel(selections[f.id]),
          };
        });
      return { label: section.label, rows };
    })
    .filter((s) => s.rows.length > 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WorksheetSection({ title }: { title: string }) {
  return (
    <p className="mt-5 mb-2 font-sans text-[9px] uppercase tracking-[0.3em] text-gold border-b border-border-accent pb-1 print:text-black print:border-gray-300">
      {title}
    </p>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-0.5">
      <span className="shrink-0 w-44 font-sans text-[11px] text-slate print:text-gray-500">{label}</span>
      <span className="font-sans text-[11px] text-foreground print:text-black">{value}</span>
    </div>
  );
}

function ItemWorksheet({ item, idx }: { item: BespokeOrderItem; idx: number }) {
  const { config } = item;
  const productId = PRODUCT_ID_MAP[item.name] ?? "";
  const designSections = resolveDesignSections(productId, config.designSelections ?? {});
  const hasMeasurements =
    config.measureMode === "standard"
      ? !!config.standardSize
      : Object.keys(config.customMeasurements ?? {}).length > 0;
  const hasPosture = Object.keys(config.postureAdjustments ?? {}).length > 0;
  const hasMonograms = (config.monograms ?? []).some((m) => m.text);

  return (
    <div className={`${idx > 0 ? "mt-8 pt-8 border-t border-border-accent print:border-gray-200" : ""}`}>
      {/* Item header */}
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="font-display text-base font-semibold text-foreground print:text-black">
          {item.name}
        </h4>
        <span className="font-sans text-sm font-semibold text-gold shrink-0 print:text-black">
          ${item.price.toLocaleString()}
        </span>
      </div>

      {/* Fabric */}
      <WorksheetSection title="Fabric" />
      <Row label="Selected Fabric" value={config.fabricLabel || config.fabric} />

      {/* Design Selections */}
      {designSections.length > 0 && (
        <>
          <WorksheetSection title="Design Specifications" />
          {designSections.map((section) => (
            <div key={section.label} className="mb-3">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-dark mb-1 print:text-gray-400">
                {section.label}
              </p>
              {section.rows.map((row) => (
                <Row key={row.field} label={row.field} value={row.value} />
              ))}
            </div>
          ))}
        </>
      )}

      {/* Measurements */}
      {hasMeasurements && (
        <>
          <WorksheetSection title="Measurements" />
          {config.measureMode === "standard" ? (
            <Row label="Standard Size" value={config.standardSize ?? ""} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-0.5">
              {Object.entries(config.customMeasurements ?? {}).map(([k, v]) => (
                <Row key={k} label={idToLabel(k)} value={v} />
              ))}
            </div>
          )}
          {config.chestAllowance && (
            <Row label="Chest Allowance" value={`${config.chestAllowance} cm`} />
          )}
          {config.wearingHabit && (
            <Row
              label="Wearing Habit"
              value={getWearingHabitLabel(config.wearingHabit)}
            />
          )}
        </>
      )}

      {/* Posture Adjustments */}
      {hasPosture && (
        <>
          <WorksheetSection title="Posture Adjustments" />
          {Object.entries(config.postureAdjustments ?? {}).map(([fieldId, optionId]) => (
            <Row
              key={fieldId}
              label={idToLabel(fieldId)}
              value={idToLabel(optionId)}
            />
          ))}
        </>
      )}

      {/* Monograms */}
      {hasMonograms && (
        <>
          <WorksheetSection title="Monograms" />
          {(config.monograms ?? [])
            .filter((m) => m.text)
            .map((m, i) => (
              <div key={i} className="mb-2 pl-2 border-l-2 border-gold/30 print:border-amber-400">
                <p className="font-sans text-[10px] text-muted-dark mb-0.5 print:text-gray-500">
                  Monogram {i + 1}
                </p>
                <Row label="Text" value={m.text} />
                <Row label="Font" value={getFontLabel(m.font)} />
                <Row label="Thread Color" value={getThreadLabel(m.threadColor)} />
                <Row label="Placement" value={m.placement} />
                <Row label="Size" value={m.size} />
              </div>
            ))}
        </>
      )}
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  onToggle,
  onStatusChange,
  onNoteSave,
  onDelete,
}: {
  order: BespokeOrder;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: BespokeStatus) => void;
  onNoteSave: (note: string) => void;
  onDelete: () => void;
}) {
  const [noteText, setNoteText] = useState(order.notes ?? "");
  const [editingNote, setEditingNote] = useState(false);

  function saveNote() {
    setEditingNote(false);
    onNoteSave(noteText);
  }

  const createdDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border border-border-accent rounded-xl overflow-hidden bg-surface-strong print:border-gray-300 print:rounded-none print:mb-8">
      {/* ── Row header (always visible) ─────────────────────────────── */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#0B2035] transition-colors print:hover:bg-transparent"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <p className="font-sans text-sm font-semibold text-foreground truncate print:text-black">
            {order.customerName}
          </p>
          <p className="font-sans text-[11px] text-slate">
            {order.id} · {createdDate}
            {order.stripeSessionId && (
              <span className="ml-2 text-[#3EBD82]">· Stripe ✓</span>
            )}
          </p>
        </div>

        <select
          value={order.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(e.target.value as BespokeStatus)}
          title="Order status"
          className={`rounded-full px-3 py-1 font-sans text-[11px] font-medium cursor-pointer outline-none shrink-0 ${STATUS_COLORS[order.status]}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-surface-strong text-foreground">
              {s}
            </option>
          ))}
        </select>

        <span className="font-sans text-sm font-semibold text-foreground shrink-0 print:text-black">
          ${order.totalAmount.toLocaleString()}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="font-sans text-[11px] text-slate hover:text-[#EF4444] transition-colors shrink-0 print:hidden"
        >
          Delete
        </button>

        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={`shrink-0 transition-transform print:hidden ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            d="M2 5l5 4 5-4"
            stroke="#6A7A8C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ── Worksheet (expanded) ─────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-border-accent bg-surface-deep px-6 pt-5 pb-7 print:border-gray-200 print:bg-white print:px-0">
          {/* Customer Info */}
          <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-gold mb-2 print:text-black">
            Customer Information
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 mb-4">
            <Row label="Name" value={order.customerName} />
            <Row label="Email" value={order.customerEmail} />
            {order.customerPhone && (
              <Row label="Phone" value={order.customerPhone} />
            )}
            {order.deliveryAddress && (
              <Row label="Delivery Address" value={order.deliveryAddress} />
            )}
            {order.stripeSessionId && (
              <Row label="Stripe Session" value={order.stripeSessionId} />
            )}
          </div>

          {/* Items */}
          {order.items.map((item, i) => (
            <ItemWorksheet key={item.cartId} item={item} idx={i} />
          ))}

          {/* Internal Notes */}
          <div className="mt-6 pt-5 border-t border-border-accent print:border-gray-200">
            <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-muted-dark mb-2">
              Internal Notes
            </p>
            {editingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border-accent bg-surface-strong px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-gold transition-colors resize-none"
                  placeholder="Add tailoring notes, fitting remarks, special instructions…"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveNote}
                    className="rounded-lg bg-gold px-4 py-1.5 font-sans text-xs font-semibold text-background hover:opacity-90 transition-opacity"
                  >
                    Save Note
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNoteText(order.notes ?? "");
                      setEditingNote(false);
                    }}
                    className="rounded-lg border border-border-accent px-4 py-1.5 font-sans text-xs text-muted-dark hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-text min-h-[40px] rounded-lg border border-dashed border-border-accent px-3 py-2 hover:border-gold/40 transition-colors print:border-gray-200 print:cursor-default"
                onClick={() => setEditingNote(true)}
              >
                {noteText ? (
                  <p className="font-sans text-sm text-foreground whitespace-pre-wrap print:text-black">
                    {noteText}
                  </p>
                ) : (
                  <p className="font-sans text-xs text-dim italic print:hidden">
                    Click to add notes…
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Print button */}
          <div className="mt-4 flex justify-end print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg border border-border-accent px-4 py-2 font-sans text-xs text-muted-dark hover:text-foreground hover:border-dim transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
              </svg>
              Print Worksheet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBespokeOrders() {
  const [orders, setOrders] = useState<BespokeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BespokeStatus | "All">("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/bespoke-orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = useCallback(async (id: string, status: BespokeStatus) => {
    await fetch(`/api/admin/bespoke-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const saveNote = useCallback(async (id: string, notes: string) => {
    await fetch(`/api/admin/bespoke-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, notes } : o)));
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    if (!confirm(`Delete bespoke order ${id}? This cannot be undone.`)) return;
    await fetch(`/api/admin/bespoke-orders/${id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (expanded === id) setExpanded(null);
  }, [expanded]);

  const visible = orders
    .filter((o) => filter === "All" || o.status === filter)
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    });

  // Summary counts
  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #bespoke-print-root { display: block !important; }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:text-black { color: black !important; }
          .print\\:text-gray-400 { color: #9ca3af !important; }
          .print\\:text-gray-500 { color: #6b7280 !important; }
          .print\\:border-gray-200 { border-color: #e5e7eb !important; }
          .print\\:border-gray-300 { border-color: #d1d5db !important; }
          .print\\:border-amber-400 { border-color: #fbbf24 !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:mb-8 { margin-bottom: 2rem !important; }
          .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
          .print\\:hover\\:bg-transparent:hover { background: transparent !important; }
          .print\\:cursor-default { cursor: default !important; }
        }
      `}</style>

      <div id="bespoke-print-root" className="min-h-screen bg-background px-4 py-10 lg:px-10 print:bg-white print:py-4 print:px-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold print:hidden">Admin</p>
              <h1 className="font-display mt-1 text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-foreground print:text-black whitespace-nowrap">
                Bespoke Orders
              </h1>
              <p className="font-sans text-xs text-slate mt-1 print:hidden">
                {orders.length} total · {orders.filter((o) => o.status === "Pending Payment").length} awaiting payment · {orders.filter((o) => o.status === "In Production").length} in production
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative print:hidden">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or order ID…"
              className="w-full rounded-xl border border-border-accent bg-surface-strong pl-9 pr-4 py-2.5 font-sans text-sm text-foreground placeholder:text-dim outline-none focus:border-gold transition-colors"
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 print:hidden">
            {(["All", ...STATUSES] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-4 py-1.5 font-sans text-xs font-semibold border transition-colors ${
                  filter === s
                    ? "bg-gold border-gold text-background"
                    : "border-border-accent text-muted-dark hover:text-foreground"
                }`}
              >
                {s}
                {s !== "All" && counts[s] > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] ${filter === s ? "bg-background/20" : "bg-border-accent"}`}>
                    {counts[s]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Orders list */}
          {loading ? (
            <div className="py-16 text-center">
              <p className="font-sans text-sm text-slate">Loading orders…</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-border-accent bg-surface-strong py-16 text-center">
              <p className="font-sans text-sm text-slate">
                {orders.length === 0
                  ? "No bespoke orders yet. Orders created through the builder will appear here."
                  : "No orders match the current filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expanded === order.id}
                  onToggle={() =>
                    setExpanded((prev) => (prev === order.id ? null : order.id))
                  }
                  onStatusChange={(status) => updateStatus(order.id, status)}
                  onNoteSave={(note) => saveNote(order.id, note)}
                  onDelete={() => deleteOrder(order.id)}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
