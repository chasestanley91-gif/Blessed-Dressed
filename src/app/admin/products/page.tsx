"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CropModal from "@/components/admin/CropModal";

const MAX_IMAGES = 10;
const TILE_SHAPES = [
  { label: "Square",    value: "1/1"  },
  { label: "Portrait",  value: "3/4"  },
  { label: "Landscape", value: "4/3"  },
  { label: "Wide",      value: "16/9" },
] as const;
type TileAspect = "1/1" | "3/4" | "4/3" | "16/9";

type SizeStock = { size: string; stock: number };
type Product = {
  id: string; name: string; subtitle: string; price: number;
  tag: string; image: string; images: string[]; sizes: string[]; stockBySize: SizeStock[];
  tileAspect?: TileAspect;
};

const EMPTY: Omit<Product, "id"> = {
  name: "", subtitle: "", price: 0, tag: "",
  image: "", images: [], sizes: [], stockBySize: [], tileAspect: "3/4",
};

const inp = "w-full rounded-lg border border-border-accent bg-surface-deep px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-gold transition-colors placeholder:text-dim";
const lbl = "block font-sans text-[11px] uppercase tracking-[0.2em] text-muted-dark mb-1";

/* ── aspect-ratio → CSS fraction string ─────────────────────────── */
function tileStyle(aspect: TileAspect | undefined): React.CSSProperties {
  const map: Record<string, string> = { "1/1": "1/1", "3/4": "3/4", "4/3": "4/3", "16/9": "16/9" };
  return { aspectRatio: map[aspect ?? "3/4"] ?? "3/4" };
}

/* ── Multi-image manager ─────────────────────────────────────────── */
function ImageManager({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [cropTarget, setCropTarget] = useState<{ url: string; idx: number } | null>(null);

  async function upload(file: File, idx: number) {
    const fd = new FormData();
    fd.append("file", file);
    const dest = `products/${file.name}`;
    fd.append("imagePath", dest);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    if (res.ok) {
      const next = [...images];
      next[idx] = `/images/${dest}`;
      onChange(next);
    }
    if (fileRefs.current[idx]) fileRefs.current[idx]!.value = "";
  }

  function setUrl(idx: number, val: string) {
    const next = [...images];
    next[idx] = val;
    onChange(next);
  }

  function remove(idx: number) { onChange(images.filter((_, i) => i !== idx)); }
  function add() { if (images.length < MAX_IMAGES) onChange([...images, ""]); }

  return (
    <>
      {cropTarget && createPortal(
        <CropModal
          src={cropTarget.url}
          originalPath={cropTarget.url}
          onSave={(newUrl) => { setUrl(cropTarget.idx, newUrl); setCropTarget(null); }}
          onClose={() => setCropTarget(null)}
        />,
        document.body
      )}

      <div className="space-y-2">
        {images.map((url, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border-accent bg-surface-deep">
              {url ? (
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-sans text-[10px] text-slate">{idx + 1}</span>
                </div>
              )}
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-gold py-[2px] text-center font-sans text-[9px] text-background">Primary</span>
              )}
            </div>
            <input
              className={inp + " flex-1"}
              value={url}
              onChange={(e) => setUrl(idx, e.target.value)}
              placeholder={idx === 0 ? "Primary image URL" : `Image ${idx + 1} URL`}
              title={`Image ${idx + 1}`}
            />
            {url && (
              <button type="button" onClick={() => setCropTarget({ url, idx })}
                className="shrink-0 rounded-lg border border-border-accent px-3 py-2 font-sans text-xs text-muted-dark hover:text-gold hover:border-gold/40 transition-colors"
                title="Crop this image">
                Crop
              </button>
            )}
            <button type="button" onClick={() => fileRefs.current[idx]?.click()}
              className="shrink-0 rounded-lg border border-border-accent px-3 py-2 font-sans text-xs text-muted-dark hover:text-foreground hover:border-gold/40 transition-colors">
              Upload
            </button>
            <input
              ref={(el) => { fileRefs.current[idx] = el; }}
              type="file" accept="image/*" title={`Upload image ${idx + 1}`}
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, idx); }}
            />
            <button type="button" onClick={() => remove(idx)} aria-label="Remove image"
              className="shrink-0 rounded-lg border border-border-accent px-2.5 py-2 font-sans text-xs text-muted-dark hover:text-[#EF4444] hover:border-[#EF4444]/40 transition-colors">
              ✕
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button type="button" onClick={add}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-accent px-4 py-2.5 font-sans text-xs text-muted-dark hover:border-gold/50 hover:text-gold transition-colors">
            + Add image
            <span className="text-slate">({images.length}/{MAX_IMAGES})</span>
          </button>
        )}
      </div>
    </>
  );
}

/* ── Product form ─────────────────────────────────────────────────── */
function ProductForm({
  initial, onSave, onCancel,
}: {
  initial: Omit<Product, "id"> & { id?: string };
  onSave: (data: typeof initial) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    ...initial,
    images: initial.images?.length ? initial.images : (initial.image ? [initial.image] : [""]),
  });
  const [sizesStr, setSizesStr] = useState(initial.sizes.join(", "));

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSizes(val: string) {
    setSizesStr(val);
    const sizes = val.split(",").map((s) => s.trim()).filter(Boolean);
    const stockBySize = sizes.map((s) => ({
      size: s,
      stock: form.stockBySize.find((x) => x.size === s)?.stock ?? 10,
    }));
    setForm((f) => ({ ...f, sizes, stockBySize }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const images = form.images.filter(Boolean);
    onSave({ ...form, images, image: images[0] ?? "" });
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-name" className={lbl}>Name</label>
          <input id="p-name" className={inp} value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Garment name" />
        </div>
        <div>
          <label className={lbl}>Tag</label>
          <input className={inp} value={form.tag} onChange={(e) => set("tag", e.target.value)} placeholder="Classic, Essential…" />
        </div>
      </div>

      <div>
        <label htmlFor="p-subtitle" className={lbl}>Subtitle</label>
        <input id="p-subtitle" className={inp} value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Brief description" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-price" className={lbl}>Price ($)</label>
          <input id="p-price" type="number" min="0" step="0.01" className={inp} value={form.price}
            onChange={(e) => set("price", parseFloat(e.target.value) || 0)} required />
        </div>
        <div>
          <label className={lbl}>Sizes <span className="normal-case text-slate">(comma-separated)</span></label>
          <input className={inp} value={sizesStr} onChange={(e) => handleSizes(e.target.value)} placeholder="36R, 38R, 40R" />
        </div>
      </div>

      {form.stockBySize.length > 0 && (
        <div>
          <label className={lbl}>Stock per size</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {form.stockBySize.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="font-sans text-xs text-muted-dark w-10 shrink-0">{s.size}</span>
                <input type="number" min="0" title={`Stock for ${s.size}`}
                  className={inp + " !py-1.5"}
                  value={s.stock}
                  onChange={(e) => {
                    const updated = [...form.stockBySize];
                    updated[i] = { ...s, stock: parseInt(e.target.value, 10) || 0 };
                    setForm((f) => ({ ...f, stockBySize: updated }));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className={lbl}>
          Images <span className="normal-case text-slate">Up to {MAX_IMAGES} · first is primary</span>
        </label>
        <ImageManager
          images={form.images}
          onChange={(imgs) => setForm((f) => ({ ...f, images: imgs }))}
        />
      </div>

      <div>
        <label className={lbl}>Tile Shape <span className="normal-case text-slate">(card aspect ratio in grid)</span></label>
        <div className="flex gap-2 flex-wrap">
          {TILE_SHAPES.map((s) => (
            <button key={s.value} type="button"
              onClick={() => setForm((f) => ({ ...f, tileAspect: s.value as TileAspect }))}
              className={`rounded-lg px-4 py-2 font-sans text-xs font-semibold border transition-colors ${
                (form.tileAspect ?? "3/4") === s.value
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border-accent text-muted-dark hover:text-foreground"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
        {/* Live preview */}
        {form.images[0] && (
          <div className="mt-3 flex items-start gap-3">
            <div
              className="overflow-hidden rounded-lg border border-border-accent bg-surface-deep w-28 shrink-0"
              style={tileStyle(form.tileAspect)}
            >
              <img src={form.images[0]} alt="tile preview" className="h-full w-full object-cover" />
            </div>
            <p className="font-sans text-[10px] text-slate pt-1">Live tile preview at selected shape</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2 border-t border-border-accent sticky bottom-0 bg-surface-strong py-4 -mx-6 px-6">
        <button type="submit" className="rounded-lg bg-gold px-6 py-2.5 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity">
          Save Product
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-border-accent px-6 py-2.5 font-sans text-sm text-muted-dark hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Stock badge ─────────────────────────────────────────────────── */
function StockBadge({ stockBySize }: { stockBySize: SizeStock[] }) {
  const total = stockBySize.reduce((s, x) => s + x.stock, 0);
  const low = stockBySize.some((x) => x.stock > 0 && x.stock <= 3);
  const out = total === 0;
  if (out) return <span className="rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 px-2 py-0.5 font-sans text-[9px] text-[#EF4444]">Out of stock</span>;
  if (low) return <span className="rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-2 py-0.5 font-sans text-[9px] text-[#F59E0B]">Low stock</span>;
  return <span className="rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 px-2 py-0.5 font-sans text-[9px] text-[#22C55E]">{total} units</span>;
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [drawerTarget, setDrawerTarget] = useState<(Product & { isNew?: boolean }) | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data: Product[]) =>
        setProducts(data.map((p) => ({
          ...p,
          images: p.images?.length ? p.images : (p.image ? [p.image] : []),
        })))
      );
  }, []);

  function openAdd() {
    setDrawerTarget({ ...EMPTY, id: "", isNew: true });
  }

  function openEdit(p: Product) {
    setDrawerTarget({ ...p, images: p.images?.length ? p.images : (p.image ? [p.image] : []) });
  }

  function closeDrawer() { setDrawerTarget(null); }

  async function save(data: Omit<Product, "id"> & { id?: string; isNew?: boolean }) {
    const { isNew: _ignored, ...payload } = data as typeof data & { isNew?: boolean };
    if (payload.id) {
      await fetch(`/api/admin/products/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setProducts((ps) => ps.map((p) => p.id === payload.id ? { ...p, ...payload } as Product : p));
    } else {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const newP = await res.json() as Product;
      setProducts((ps) => [...ps, { ...newP, images: newP.images ?? (newP.image ? [newP.image] : []) }]);
    }
    closeDrawer();
  }

  async function del(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((ps) => ps.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Admin</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">Products</h1>
            <p className="font-sans text-xs text-slate mt-1">{products.length} garment{products.length !== 1 ? "s" : ""} in catalog</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-xl border border-border-accent bg-surface-strong p-1">
              {(["grid", "list"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)}
                  className={`rounded-lg px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${view === v ? "bg-gold text-background" : "text-muted-dark hover:text-foreground"}`}>
                  {v === "grid" ? (
                    <span className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                      </svg>
                      Grid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                      </svg>
                      List
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button type="button" onClick={openAdd}
              className="rounded-xl bg-gold px-4 py-2 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity">
              + Add Product
            </button>
          </div>
        </div>

        {/* ── GRID VIEW ──────────────────────────────────────────── */}
        {view === "grid" && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => (
              <div key={p.id} className="group relative rounded-2xl border border-border-accent bg-surface-strong overflow-hidden flex flex-col">
                {/* Image at tile aspect ratio */}
                <div className="overflow-hidden bg-surface-deep" style={tileStyle(p.tileAspect)}>
                  {p.images?.[0] || p.image ? (
                    <img
                      src={p.images?.[0] || p.image}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1D3C62" strokeWidth="1.5" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button type="button" onClick={() => openEdit(p)}
                      className="rounded-lg bg-gold px-4 py-2 font-sans text-xs font-semibold text-background hover:opacity-90 transition-opacity">
                      Edit
                    </button>
                    <button type="button" onClick={() => del(p.id)}
                      className="rounded-lg border border-[#EF4444]/50 bg-[#EF4444]/10 px-4 py-2 font-sans text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
                {/* Card info */}
                <div className="p-3 flex-1 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-sans text-sm font-semibold text-foreground leading-tight">{p.name}</p>
                    <p className="font-sans text-sm font-semibold text-gold shrink-0">${p.price.toLocaleString()}</p>
                  </div>
                  {p.subtitle && <p className="font-sans text-[10px] text-slate leading-snug">{p.subtitle}</p>}
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    {p.tag && (
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-sans text-[9px] text-gold">{p.tag}</span>
                    )}
                    <StockBadge stockBySize={p.stockBySize} />
                  </div>
                  {/* Thumbnail strip if multiple images */}
                  {(p.images?.length ?? 0) > 1 && (
                    <div className="flex gap-1 pt-1">
                      {p.images.slice(0, 5).map((img, i) => (
                        <div key={i} className="h-7 w-7 overflow-hidden rounded border border-border-accent bg-surface-deep shrink-0">
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                      {p.images.length > 5 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded border border-border-accent font-sans text-[8px] text-slate">
                          +{p.images.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Empty add card */}
            <button type="button" onClick={openAdd}
              className="rounded-2xl border-2 border-dashed border-border-accent hover:border-gold/40 transition-colors flex flex-col items-center justify-center gap-2 min-h-[200px] text-dim hover:text-gold">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="font-sans text-xs">Add Product</span>
            </button>
          </div>
        )}

        {/* ── LIST VIEW ──────────────────────────────────────────── */}
        {view === "list" && (
          <div className="rounded-2xl border border-border-accent bg-surface-strong overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-accent">
                  {["Images", "Name", "Price", "Tag", "Stock", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-sans text-[10px] uppercase tracking-[0.2em] text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-accent">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#0B2035] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        {(p.images?.length ? p.images : [p.image]).slice(0, 4).map((img, i) => (
                          <div key={i} className="relative h-10 w-10 overflow-hidden rounded-lg border border-border-accent bg-surface-deep shrink-0">
                            {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
                            {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-gold/80 text-center font-sans text-[7px] text-background leading-[10px]">★</span>}
                          </div>
                        ))}
                        {(p.images?.length ?? 1) > 4 && (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-accent bg-surface-deep font-sans text-[10px] text-muted-dark">
                            +{(p.images?.length ?? 1) - 4}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-sans text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="font-sans text-xs text-slate">{p.subtitle}</p>
                    </td>
                    <td className="px-5 py-3 font-sans text-sm text-foreground">${p.price.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 font-sans text-xs text-gold">{p.tag}</span>
                    </td>
                    <td className="px-5 py-3">
                      <StockBadge stockBySize={p.stockBySize} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => openEdit(p)} className="font-sans text-xs text-muted-dark hover:text-gold transition-colors">Edit</button>
                        <button type="button" onClick={() => del(p.id)} className="font-sans text-xs text-muted-dark hover:text-[#EF4444] transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Slide-in Drawer ─────────────────────────────────────── */}
      {drawerTarget && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/60" onClick={closeDrawer} aria-hidden="true" />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[600px] flex-col border-l border-border-accent bg-surface-strong shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-border-accent px-6 py-5 shrink-0">
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold">
                  {drawerTarget.isNew ? "New Product" : "Edit Product"}
                </p>
                {!drawerTarget.isNew && (
                  <p className="font-sans text-xs text-muted-dark mt-0.5 truncate max-w-[320px]">{drawerTarget.name}</p>
                )}
              </div>
              <button type="button" onClick={closeDrawer}
                className="rounded-lg p-2 text-muted-dark hover:text-foreground hover:bg-background transition-colors"
                aria-label="Close drawer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto px-6 pt-6">
              <ProductForm
                initial={drawerTarget}
                onSave={save}
                onCancel={closeDrawer}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
