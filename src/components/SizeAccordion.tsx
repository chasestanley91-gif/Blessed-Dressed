"use client";

import { useState } from "react";

type SizeStock = { size: string; stock: number };

type Props = {
  stockBySize: SizeStock[];
  totalStock: number;
};

type Group = { label: string; key: string; items: SizeStock[] };

function groupSizes(stockBySize: SizeStock[]): Group[] {
  // Detect suit sizing (ends in S/R/L) vs standard (S/M/L/XL/MTM/numbers)
  const isSuitSize = stockBySize.some((s) => /\d+[SRL]$/.test(s.size));

  if (isSuitSize) {
    const short = stockBySize.filter((s) => s.size.endsWith("S"));
    const regular = stockBySize.filter((s) => s.size.endsWith("R"));
    const long = stockBySize.filter((s) => s.size.endsWith("L"));
    const other = stockBySize.filter(
      (s) => !s.size.endsWith("S") && !s.size.endsWith("R") && !s.size.endsWith("L")
    );

    return [
      short.length  ? { label: "Short",   key: "S", items: short }   : null,
      regular.length? { label: "Regular", key: "R", items: regular } : null,
      long.length   ? { label: "Long",    key: "L", items: long }    : null,
      other.length  ? { label: "Other",   key: "O", items: other }   : null,
    ].filter(Boolean) as Group[];
  }

  // For non-suit sizes, return a single group
  return [{ label: "Sizes", key: "all", items: stockBySize }];
}

function stockBadge(total: number) {
  if (total === 0) return "bg-[#5A1A1A]/25 text-[#EF4444] border border-[#EF4444]/30";
  if (total <= 5) return "bg-[#5C3D0A]/25 text-[#F59E0B] border border-[#F59E0B]/30";
  return "bg-[#0F3D2A]/20 text-[#22C55E] border border-[#22C55E]/30";
}

function stockLabel(total: number) {
  if (total === 0) return "Out of stock";
  return `${total} in stock`;
}

function stockRowColor(stock: number) {
  if (stock === 0) return "text-[#EF4444]";
  if (stock <= 2) return "text-[#F59E0B]";
  return "text-[#22C55E]";
}

function stockRowLabel(stock: number) {
  if (stock === 0) return "Out of stock";
  if (stock <= 2) return `${stock} remaining`;
  return `${stock} in stock`;
}

function GroupAccordion({ group }: { group: Group }) {
  const groupTotal = group.items.reduce((s, i) => s + i.stock, 0);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border-accent overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-strong hover:bg-[#0B2035] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-sans text-sm font-medium text-foreground">{group.label}</span>
          <span className={`font-sans rounded-full px-2 py-0.5 text-[10px] font-medium ${stockBadge(groupTotal)}`}>
            {stockLabel(groupTotal)}
          </span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={`shrink-0 text-slate transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M2 5l5 4 5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Size rows */}
      {open && (
        <div className="divide-y divide-border-accent border-t border-border-accent">
          {group.items.map((s) => (
            <div
              key={s.size}
              className="flex items-center justify-between px-4 py-2.5 bg-background"
            >
              <span className="font-sans text-sm text-foreground">{s.size}</span>
              <span className={`font-sans text-xs font-medium ${stockRowColor(s.stock)}`}>
                {stockRowLabel(s.stock)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SizeAccordion({ stockBySize, totalStock }: Props) {
  const groups = groupSizes(stockBySize);
  const isSingleGroup = groups.length === 1;

  return (
    <div className="rounded-2xl border border-border-accent bg-background p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-muted-dark">
          Size availability
        </h2>
        <span className={`font-sans rounded-full px-2.5 py-1 text-xs font-medium ${stockBadge(totalStock)}`}>
          {stockLabel(totalStock)}
        </span>
      </div>

      {/* Single group: show flat list (no accordion needed) */}
      {isSingleGroup ? (
        <div className="grid gap-2">
          {groups[0].items.map((s) => (
            <div
              key={s.size}
              className="flex items-center justify-between rounded-xl border border-border-accent bg-surface-strong px-4 py-3"
            >
              <span className="font-sans text-sm text-foreground">{s.size}</span>
              <span className={`font-sans text-xs font-medium ${stockRowColor(s.stock)}`}>
                {stockRowLabel(s.stock)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Multiple groups (suit sizing): collapsible accordions */
        <div className="space-y-2">
          {groups.map((group) => (
            <GroupAccordion key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
