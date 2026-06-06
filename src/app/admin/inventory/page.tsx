"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/data/products";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="font-sans inline-flex items-center justify-center rounded-lg border border-[#EF4444]/30 bg-[#5A1A1A]/25 px-2.5 py-1.5 text-xs font-semibold text-[#EF4444]">
        Out
      </span>
    );
  if (stock <= 2)
    return (
      <span className="font-sans inline-flex items-center justify-center rounded-lg border border-[#F59E0B]/30 bg-[#5C3D0A]/25 px-2.5 py-1.5 text-xs font-semibold text-[#F59E0B]">
        {stock}
      </span>
    );
  return (
    <span className="font-sans inline-flex items-center justify-center rounded-lg border border-[#22C55E]/20 bg-[#0F3D2A]/20 px-2.5 py-1.5 text-xs font-semibold text-[#22C55E]">
      {stock}
    </span>
  );
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCell, setEditCell] = useState<{ productId: string; size: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/inventory")
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function getStock(product: Product, size: string): number {
    return product.stockBySize.find((s) => s.size === size)?.stock ?? 0;
  }

  function startEdit(productId: string, size: string, currentStock: number) {
    setEditCell({ productId, size });
    setEditValue(String(currentStock));
  }

  async function commitEdit() {
    if (!editCell) return;
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) { setEditCell(null); return; }

    setProducts((prev) =>
      prev.map((p) =>
        p.id !== editCell.productId
          ? p
          : {
              ...p,
              stockBySize: p.stockBySize.map((s) =>
                s.size === editCell.size ? { ...s, stock: val } : s
              ),
            }
      )
    );
    setEditCell(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: editCell.productId, size: editCell.size, stock: val }),
      });
      if (res.ok) showToast("Stock saved", true);
      else showToast("Save failed", false);
    } catch {
      showToast("Save failed", false);
    }
  }

  const alerts = products.flatMap((p) =>
    p.stockBySize.filter((s) => s.stock <= 2).map((s) => ({ product: p, size: s.size, stock: s.stock }))
  );

  return (
    <main className="min-h-screen bg-background pt-20 text-foreground">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 font-sans text-sm shadow-lg transition-all ${
            toast.ok
              ? "border-[#22C55E]/30 bg-[#0F3D2A] text-[#22C55E]"
              : "border-[#EF4444]/30 bg-[#5A1A1A] text-[#EF4444]"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">Admin · Inventory</p>
            <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-0.03em] text-foreground">
              Stock management.
            </h1>
          </div>
          <Link
            href="/admin"
            className="font-sans inline-flex items-center gap-2 rounded-full border border-border-accent px-4 py-2 text-xs text-muted-dark transition-colors hover:border-gold/40 hover:text-gold"
          >
            ← Dashboard
          </Link>
        </div>

        {loading && (
          <p className="font-sans text-sm text-muted-dark">Loading inventory…</p>
        )}

        {/* Alert strip */}
        {!loading && alerts.length > 0 && (
          <div className="rounded-[1.25rem] border border-[#F59E0B]/25 bg-[#5C3D0A]/15 px-6 py-4">
            <div className="flex items-start gap-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-[#F59E0B]" aria-hidden="true">
                <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 6v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#F59E0B]">
                  {alerts.length} low stock {alerts.length === 1 ? "variant" : "variants"}
                </p>
                <p className="font-sans mt-1 text-xs text-[#B1A893]">
                  {alerts.map((a) => `${a.product.name} / ${a.size}`).join(" · ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inventory tables */}
        <div className="space-y-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-[1.5rem] border border-border-accent bg-surface-strong overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center gap-4 border-b border-border-accent px-7 py-5">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-12 w-16 rounded-xl object-cover border border-border-accent"
                />
                <div>
                  <p className="font-display text-base font-semibold text-foreground">{product.name}</p>
                  <p className="font-sans text-xs text-muted-dark mt-0.5">${product.price} · {product.tag}</p>
                </div>
              </div>

              <div className="px-7 py-5">
                <div className="flex flex-wrap gap-3">
                  {product.stockBySize.map((s) => {
                    const isEditing = editCell?.productId === product.id && editCell.size === s.size;
                    return (
                      <div key={s.size} className="flex flex-col items-center gap-2">
                        <span className="font-sans text-xs text-muted-dark">{s.size}</span>
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            aria-label={`Stock for size ${s.size}`}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit();
                              if (e.key === "Escape") setEditCell(null);
                            }}
                            autoFocus
                            className="w-14 rounded-lg border border-gold/50 bg-background px-2 py-1.5 text-center text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(product.id, s.size, s.stock)}
                            className="cursor-pointer rounded-lg transition-[transform,opacity] hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                            title="Click to edit"
                          >
                            <StockBadge stock={s.stock} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="font-sans mt-4 text-xs text-muted-dark">
                  Click a stock number to edit. Press Enter or click away to save.
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        {!loading && (
          <div className="flex flex-wrap gap-4">
            {[
              { color: "border-[#EF4444]/30 bg-[#5A1A1A]/25 text-[#EF4444]", label: "Out of stock (0)" },
              { color: "border-[#F59E0B]/30 bg-[#5C3D0A]/25 text-[#F59E0B]", label: "Low stock (1–2)" },
              { color: "border-[#22C55E]/20 bg-[#0F3D2A]/20 text-[#22C55E]", label: "In stock (3+)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`font-sans inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${item.color}`}>–</span>
                <span className="font-sans text-xs text-muted-dark">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
