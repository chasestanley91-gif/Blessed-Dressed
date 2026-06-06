"use client";

import { useEffect, useRef, useState } from "react";

type Accessory = { id: string; name: string; price: number; image: string };
const EMPTY: Omit<Accessory, "id"> = { name: "", price: 0, image: "" };

function AccessoryForm({ initial, onSave, onCancel }: {
  initial: Omit<Accessory, "id"> & { id?: string };
  onSave: (d: typeof initial) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const fileRef = useRef<HTMLInputElement>(null);
  const inp = "w-full rounded-lg border border-border-accent bg-surface-deep px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-gold transition-colors";
  const lbl = "block font-sans text-[11px] uppercase tracking-[0.2em] text-muted-dark mb-1";

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("imagePath", `accessories/${file.name}`);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    if (res.ok) setForm((f) => ({ ...f, image: `/images/accessories/${file.name}` }));
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={lbl}>Name</label>
          <input className={inp} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required title="Accessory name" />
        </div>
        <div>
          <label className={lbl}>Price ($)</label>
          <input type="number" min="0" step="0.01" className={inp} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} title="Price" required />
        </div>
      </div>
      <div>
        <label className={lbl}>Image</label>
        <div className="flex gap-2 items-center">
          <input className={inp} value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="URL or upload" title="Image URL" />
          <button type="button" onClick={() => fileRef.current?.click()} className="shrink-0 rounded-lg border border-border-accent px-3 py-2 font-sans text-xs text-muted-dark hover:text-foreground transition-colors">Upload</button>
          <input ref={fileRef} type="file" accept="image/*" title="Upload accessory image" className="hidden" onChange={handleImage} />
        </div>
        {form.image && <img src={form.image} alt="" className="mt-2 h-14 w-20 rounded object-contain bg-white" />}
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="rounded-lg bg-gold px-5 py-2 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity">Save</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-border-accent px-5 py-2 font-sans text-sm text-muted-dark hover:text-foreground transition-colors">Cancel</button>
      </div>
    </form>
  );
}

export default function AdminAccessories() {
  const [items, setItems] = useState<Accessory[]>([]);
  const [editing, setEditing] = useState<Accessory | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetch("/api/admin/accessories").then((r) => r.json()).then(setItems); }, []);

  async function save(data: Omit<Accessory, "id"> & { id?: string }) {
    if (data.id) {
      await fetch(`/api/admin/accessories/${data.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setItems((xs) => xs.map((x) => (x.id === data.id ? { ...x, ...data } as Accessory : x)));
    } else {
      const res = await fetch("/api/admin/accessories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const newItem = await res.json();
      setItems((xs) => [...xs, newItem]);
    }
    setEditing(null); setAdding(false);
  }

  async function del(id: string) {
    if (!confirm("Delete this accessory?")) return;
    await fetch(`/api/admin/accessories/${id}`, { method: "DELETE" });
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 lg:px-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Admin</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">Accessories</h1>
          </div>
          {!adding && !editing && (
            <button type="button" onClick={() => setAdding(true)} className="rounded-xl bg-gold px-4 py-2 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity">+ Add Accessory</button>
          )}
        </div>

        {(adding || editing) && (
          <div className="rounded-2xl border border-border-accent bg-surface-strong p-6">
            <h2 className="font-display mb-5 text-lg font-semibold text-foreground">{editing ? "Edit Accessory" : "New Accessory"}</h2>
            <AccessoryForm initial={editing ?? EMPTY} onSave={save} onCancel={() => { setEditing(null); setAdding(false); }} />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border-accent bg-surface-strong p-4 flex flex-col gap-3">
              <div className="h-28 rounded-xl bg-white overflow-hidden">
                <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-foreground">{item.name}</p>
                <p className="font-sans text-xs text-gold">${item.price}</p>
              </div>
              <div className="flex gap-3 mt-auto">
                <button type="button" onClick={() => { setEditing(item); setAdding(false); }} className="font-sans text-xs text-muted-dark hover:text-gold transition-colors">Edit</button>
                <button type="button" onClick={() => del(item.id)} className="font-sans text-xs text-muted-dark hover:text-[#EF4444] transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
