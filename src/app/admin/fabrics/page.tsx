"use client";

import { useEffect, useRef, useState } from "react";

type Fabric = {
  id: string;
  label: string;
  detail: string;
  premium: boolean;
  collection?: string;
  photoImage?: string;
  codeImage?: string;
  image?: string;
};

const EMPTY: Omit<Fabric, "id"> = { label: "", detail: "", premium: false, collection: "", photoImage: "", codeImage: "" };
const inp = "w-full rounded-lg border border-border-accent bg-surface-deep px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-gold transition-colors";
const lbl = "block font-sans text-[11px] uppercase tracking-[0.2em] text-muted-dark mb-1";

async function uploadFile(file: File, subfolder: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("imagePath", `fabrics/${subfolder}/${file.name}`);
  const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  return `/images/fabrics/${subfolder}/${file.name}`;
}

function ImageSlot({
  label: slotLabel,
  url,
  onUpload,
  subfolder,
}: {
  label: string;
  url?: string;
  onUpload: (url: string) => void;
  subfolder: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file, subfolder);
      onUpload(path);
    } catch {}
    setUploading(false);
    if (ref.current) ref.current.value = "";
  }

  return (
    <div className="flex flex-col gap-1">
      <p className={lbl}>{slotLabel}</p>
      <div
        className="relative flex h-28 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border-accent bg-surface-deep hover:border-gold/40 transition-colors"
        onClick={() => ref.current?.click()}
      >
        {url ? (
          <img src={url} alt={slotLabel} className="h-full w-full object-contain" />
        ) : (
          <span className="font-sans text-xs text-dim">{uploading ? "Uploading…" : "+ Upload"}</span>
        )}
        {url && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
            <span className="font-sans text-xs text-white">Replace</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="font-sans text-xs text-gold">Uploading…</span>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" title={`Upload ${slotLabel}`} className="hidden" onChange={handle} />
    </div>
  );
}

function FabricForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Fabric, "id"> & { id?: string };
  onSave: (d: typeof initial) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={lbl}>Fabric Name</label>
          <input className={inp} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required placeholder="e.g. Navy Herringbone" />
        </div>
        <div>
          <label className={lbl}>Collection</label>
          <input className={inp} value={form.collection ?? ""} onChange={(e) => setForm((f) => ({ ...f, collection: e.target.value }))} placeholder="e.g. Autumn-Winter 2025" />
        </div>
      </div>

      <div>
        <label className={lbl}>Detail Description</label>
        <input className={inp} value={form.detail} onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))} placeholder="100% Wool 280g — deep navy herringbone weave." />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="premium-chk" checked={form.premium} onChange={(e) => setForm((f) => ({ ...f, premium: e.target.checked }))} className="accent-gold w-4 h-4" />
        <label htmlFor="premium-chk" className="font-sans text-sm text-foreground cursor-pointer">Premium (+$150)</label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageSlot
          label="Lifestyle Photo"
          url={form.photoImage}
          subfolder="photos"
          onUpload={(url) => setForm((f) => ({ ...f, photoImage: url }))}
        />
        <ImageSlot
          label="Fabric Code / Swatch"
          url={form.codeImage}
          subfolder="codes"
          onUpload={(url) => setForm((f) => ({ ...f, codeImage: url }))}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" className="rounded-lg bg-gold px-5 py-2 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity">Save</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-border-accent px-5 py-2 font-sans text-sm text-muted-dark hover:text-foreground transition-colors">Cancel</button>
      </div>
    </form>
  );
}

// ─── Bulk Import ──────────────────────────────────────────────────────────────

type StagedFile = { file: File; url: string; label: string; type: "photo" | "code" };

function BulkImportPanel({ collections, onDone }: { collections: string[]; onDone: () => void }) {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [collection, setCollection] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const dropRef = useRef<HTMLDivElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const news: StagedFile[] = [];
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      const nameLower = file.name.toLowerCase();
      const type: "photo" | "code" = nameLower.includes("code") || nameLower.includes("swatch") ? "code" : "photo";
      const label = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
      news.push({ file, url, label, type });
    }
    setStaged((prev) => [...prev, ...news]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  async function runImport() {
    if (staged.length === 0) return;
    setImporting(true);
    setProgress(0);

    const photos = staged.filter((s) => s.type === "photo");
    const codes = staged.filter((s) => s.type === "code");

    const total = staged.length;
    let done = 0;

    const uploadedPhotos: Array<{ label: string; url: string }> = [];
    const uploadedCodes: Array<{ label: string; url: string }> = [];

    for (const s of photos) {
      try {
        const url = await uploadFile(s.file, "photos");
        uploadedPhotos.push({ label: s.label, url });
      } catch {}
      done++;
      setProgress(Math.round((done / total) * 80));
    }

    for (const s of codes) {
      try {
        const url = await uploadFile(s.file, "codes");
        uploadedCodes.push({ label: s.label, url });
      } catch {}
      done++;
      setProgress(Math.round((done / total) * 80));
    }

    // Create fabric records — pair by index if counts match, otherwise create individual records
    const maxLen = Math.max(uploadedPhotos.length, uploadedCodes.length);
    for (let i = 0; i < maxLen; i++) {
      const photo = uploadedPhotos[i];
      const code = uploadedCodes[i];
      const label = photo?.label ?? code?.label ?? `Fabric ${i + 1}`;
      await fetch("/api/admin/fabrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          detail: "",
          premium: false,
          collection: collection || undefined,
          photoImage: photo?.url,
          codeImage: code?.url,
        }),
      });
      setProgress(80 + Math.round(((i + 1) / maxLen) * 20));
    }

    setImporting(false);
    setStaged([]);
    onDone();
  }

  return (
    <div className="space-y-6">
      <p className="font-sans text-sm text-muted-dark">
        Drop all fabric images at once. Mark each as a <strong className="text-foreground">Lifestyle Photo</strong> or <strong className="text-foreground">Fabric Code</strong>. Photos and codes are paired by position (first photo + first code = one fabric).
      </p>

      <div>
        <label className={lbl}>Collection Name (applied to all imports)</label>
        <input
          className={inp}
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          placeholder="e.g. Autumn-Winter 2025"
          list="col-list"
        />
        <datalist id="col-list">
          {collections.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-accent hover:border-gold/40 transition-colors p-8 text-center"
        onClick={() => {
          const inp = document.createElement("input");
          inp.type = "file";
          inp.multiple = true;
          inp.accept = "image/*";
          inp.onchange = (e) => handleFiles((e.target as HTMLInputElement).files);
          inp.click();
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mb-3 text-dim" aria-hidden="true">
          <path d="M12 16V8M12 8l-3 3M12 8l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <p className="font-sans text-sm text-muted-dark">Drop images here or click to browse</p>
        <p className="font-sans text-xs text-dim mt-1">JPG, PNG, WebP supported</p>
      </div>

      {/* Staged files */}
      {staged.length > 0 && (
        <div className="rounded-xl border border-border-accent bg-surface-strong divide-y divide-border-accent">
          {staged.map((s, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <img src={s.url} alt="" className="h-12 w-16 rounded object-contain bg-white shrink-0" />
              <input
                className="flex-1 rounded-md border border-border-accent bg-surface-deep px-2 py-1.5 font-sans text-xs text-foreground outline-none focus:border-gold"
                value={s.label}
                onChange={(e) => setStaged((prev) => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                placeholder="Fabric name"
              />
              <div className="flex rounded-lg border border-border-accent overflow-hidden shrink-0">
                {(["photo", "code"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setStaged((prev) => prev.map((x, j) => j === i ? { ...x, type: t } : x))}
                    className={`px-3 py-1.5 font-sans text-xs transition-colors ${s.type === t ? "bg-gold text-background font-semibold" : "text-muted-dark hover:text-foreground"}`}
                  >
                    {t === "photo" ? "Photo" : "Code"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStaged((prev) => prev.filter((_, j) => j !== i))}
                className="font-sans text-xs text-dim hover:text-[#EF4444] transition-colors px-1 shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {importing && (
        <div className="rounded-xl border border-border-accent bg-surface-strong px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-sans text-xs text-muted-dark">Importing…</p>
            <p className="font-sans text-xs text-gold">{progress}%</p>
          </div>
          <div className="h-1.5 rounded-full bg-border-accent overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all progress-bar-inner"
              style={{ '--progress-width': `${progress}%` } as React.CSSProperties}
            />
          </div>
        </div>
      )}

      {staged.length > 0 && !importing && (
        <button
          type="button"
          onClick={runImport}
          className="w-full rounded-xl bg-gold py-3 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity"
        >
          Import {staged.length} image{staged.length !== 1 ? "s" : ""} as fabrics
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminFabrics() {
  const [items, setItems] = useState<Fabric[]>([]);
  const [editing, setEditing] = useState<Fabric | null>(null);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<"list" | "bulk">("list");
  const [filterCollection, setFilterCollection] = useState("all");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { fetch("/api/admin/fabrics").then((r) => r.json()).then(setItems); }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const collections = Array.from(new Set(items.map((f) => f.collection).filter(Boolean))) as string[];
  const filtered = filterCollection === "all" ? items : items.filter((f) => f.collection === filterCollection);

  async function save(data: Omit<Fabric, "id"> & { id?: string }) {
    try {
      if (data.id) {
        await fetch(`/api/admin/fabrics/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setItems((xs) => xs.map((x) => (x.id === data.id ? { ...x, ...data } as Fabric : x)));
      } else {
        const res = await fetch("/api/admin/fabrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const newItem = await res.json();
        setItems((xs) => [...xs, newItem]);
      }
      setEditing(null);
      setAdding(false);
      showToast("Fabric saved", true);
    } catch {
      showToast("Save failed", false);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this fabric?")) return;
    await fetch(`/api/admin/fabrics/${id}`, { method: "DELETE" });
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  async function refreshAfterBulk() {
    const data = await fetch("/api/admin/fabrics").then((r) => r.json());
    setItems(data);
    setTab("list");
    showToast("Fabrics imported", true);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 lg:px-10">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 font-sans text-sm shadow-lg ${toast.ok ? "border-[#22C55E]/30 bg-[#0F3D2A] text-[#22C55E]" : "border-[#EF4444]/30 bg-[#5A1A1A] text-[#EF4444]"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Admin</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">Fabrics</h1>
          </div>
          <div className="flex gap-3">
            {tab === "list" && !adding && !editing && (
              <button type="button" onClick={() => setAdding(true)} className="rounded-xl bg-gold px-4 py-2 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity">
                + Add Fabric
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-border-accent bg-surface-strong p-1 w-fit">
          {(["list", "bulk"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setEditing(null); setAdding(false); }}
              className={`rounded-lg px-5 py-2 font-sans text-xs font-semibold transition-colors ${tab === t ? "bg-gold text-background" : "text-muted-dark hover:text-foreground"}`}
            >
              {t === "list" ? "Fabric Library" : "Bulk Import"}
            </button>
          ))}
        </div>

        {tab === "bulk" && (
          <div className="rounded-2xl border border-border-accent bg-surface-strong p-6">
            <h2 className="font-display mb-1 text-lg font-semibold text-foreground">Bulk Import Fabric Collection</h2>
            <BulkImportPanel collections={collections} onDone={refreshAfterBulk} />
          </div>
        )}

        {tab === "list" && (
          <>
            {/* Add / Edit Form */}
            {(adding || editing) && (
              <div className="rounded-2xl border border-border-accent bg-surface-strong p-6">
                <h2 className="font-display mb-5 text-lg font-semibold text-foreground">{editing ? "Edit Fabric" : "New Fabric"}</h2>
                <FabricForm
                  initial={editing ?? EMPTY}
                  onSave={save}
                  onCancel={() => { setEditing(null); setAdding(false); }}
                />
              </div>
            )}

            {/* Collection filter */}
            {collections.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {["all", ...collections].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFilterCollection(c)}
                    className={`rounded-full px-4 py-1.5 font-sans text-xs font-semibold border transition-colors ${filterCollection === c ? "border-gold bg-gold/10 text-gold" : "border-border-accent text-muted-dark hover:text-foreground"}`}
                  >
                    {c === "all" ? "All Collections" : c}
                  </button>
                ))}
              </div>
            )}

            {/* Fabric list */}
            <div className="rounded-2xl border border-border-accent bg-surface-strong overflow-hidden divide-y divide-border-accent">
              {filtered.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="font-sans text-sm text-muted-dark">No fabrics yet. Add one or use bulk import.</p>
                </div>
              )}
              {filtered.map((f) => (
                <div key={f.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#0B2035] transition-colors">
                  {/* Dual image thumbnails */}
                  <div className="flex gap-1.5 shrink-0">
                    <div className="h-12 w-16 rounded overflow-hidden bg-white border border-border-accent">
                      {f.photoImage || f.image ? (
                        <img src={f.photoImage ?? f.image} alt="Photo" className="h-full w-full object-contain" />
                      ) : (
                        <div className="h-full w-full bg-border-accent flex items-center justify-center">
                          <span className="font-sans text-[8px] text-dim">Photo</span>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-16 rounded overflow-hidden bg-white border border-border-accent">
                      {f.codeImage ? (
                        <img src={f.codeImage} alt="Code" className="h-full w-full object-contain" />
                      ) : (
                        <div className="h-full w-full bg-border-accent flex items-center justify-center">
                          <span className="font-sans text-[8px] text-dim">Code</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-semibold text-foreground">{f.label}</p>
                    <p className="font-sans text-xs text-muted-dark truncate">{f.detail}</p>
                    {f.collection && (
                      <p className="font-sans text-[10px] text-slate mt-0.5">{f.collection}</p>
                    )}
                  </div>

                  {f.premium && (
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-sans text-[10px] text-gold shrink-0">Premium</span>
                  )}

                  <div className="flex gap-3 shrink-0">
                    <button type="button" onClick={() => { setEditing(f); setAdding(false); }} className="font-sans text-xs text-muted-dark hover:text-gold transition-colors">Edit</button>
                    <button type="button" onClick={() => del(f.id)} className="font-sans text-xs text-muted-dark hover:text-[#EF4444] transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
