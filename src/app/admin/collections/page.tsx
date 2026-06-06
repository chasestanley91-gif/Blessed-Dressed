"use client";

import { useEffect, useRef, useState } from "react";

type Collection = { slug: string; title: string; banner: string; image: string };
const EMPTY: Collection = { slug: "", title: "", banner: "", image: "" };

function CollectionForm({ initial, onSave, onCancel }: {
  initial: Collection;
  onSave: (d: Collection) => void;
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
    fd.append("imagePath", `collections/${file.name}`);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    if (res.ok) setForm((f) => ({ ...f, image: `/images/collections/${file.name}` }));
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={lbl}>Title</label>
          <input className={inp} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required title="Collection title" />
        </div>
        <div>
          <label className={lbl}>Slug (URL)</label>
          <input className={inp} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} required title="URL slug" placeholder="winter-atelier" />
        </div>
      </div>
      <div>
        <label className={lbl}>Banner subtitle</label>
        <input className={inp} value={form.banner} onChange={(e) => setForm((f) => ({ ...f, banner: e.target.value }))} title="Banner text" placeholder="Seasonal tailoring in navy and cream." />
      </div>
      <div>
        <label className={lbl}>Image</label>
        <div className="flex gap-2 items-center">
          <input className={inp} value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="URL or upload" title="Image URL" />
          <button type="button" onClick={() => fileRef.current?.click()} className="shrink-0 rounded-lg border border-border-accent px-3 py-2 font-sans text-xs text-muted-dark hover:text-foreground transition-colors">Upload</button>
          <input ref={fileRef} type="file" accept="image/*" title="Upload collection image" className="hidden" onChange={handleImage} />
        </div>
        {form.image && <img src={form.image} alt="" className="mt-2 h-16 w-28 rounded object-cover" />}
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="rounded-lg bg-gold px-5 py-2 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity">Save</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-border-accent px-5 py-2 font-sans text-sm text-muted-dark hover:text-foreground transition-colors">Cancel</button>
      </div>
    </form>
  );
}

export default function AdminCollections() {
  const [items, setItems] = useState<Collection[]>([]);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetch("/api/admin/collections").then((r) => r.json()).then(setItems); }, []);

  async function save(data: Collection) {
    if (editing) {
      await fetch(`/api/admin/collections/${editing.slug}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setItems((xs) => xs.map((x) => (x.slug === editing.slug ? data : x)));
    } else {
      const res = await fetch("/api/admin/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const newItem = await res.json();
      setItems((xs) => [...xs, newItem]);
    }
    setEditing(null); setAdding(false);
  }

  async function del(slug: string) {
    if (!confirm("Delete this collection?")) return;
    await fetch(`/api/admin/collections/${slug}`, { method: "DELETE" });
    setItems((xs) => xs.filter((x) => x.slug !== slug));
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 lg:px-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Admin</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">Collections</h1>
          </div>
          {!adding && !editing && (
            <button type="button" onClick={() => setAdding(true)} className="rounded-xl bg-gold px-4 py-2 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity">+ New Collection</button>
          )}
        </div>

        {(adding || editing) && (
          <div className="rounded-2xl border border-border-accent bg-surface-strong p-6">
            <h2 className="font-display mb-5 text-lg font-semibold text-foreground">{editing ? "Edit Collection" : "New Collection"}</h2>
            <CollectionForm initial={editing ?? EMPTY} onSave={save} onCancel={() => { setEditing(null); setAdding(false); }} />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.slug} className="rounded-2xl border border-border-accent bg-surface-strong overflow-hidden">
              <div className="h-36 bg-surface-deep">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-base font-semibold text-foreground">{item.title}</p>
                  <p className="font-sans text-xs text-muted-dark mt-0.5">{item.banner}</p>
                  <p className="font-mono text-[10px] text-dim mt-1">/{item.slug}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button type="button" onClick={() => { setEditing(item); setAdding(false); }} className="font-sans text-xs text-muted-dark hover:text-gold transition-colors">Edit</button>
                  <button type="button" onClick={() => del(item.slug)} className="font-sans text-xs text-muted-dark hover:text-[#EF4444] transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
