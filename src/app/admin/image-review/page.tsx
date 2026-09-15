"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Photo = {
  path: string;
  sha1: string;
  verdict: "approved" | "rejected" | "unreviewed";
  preTicked?: boolean;
  sources?: string[];
};
type Craft = {
  craftId: string;
  product: string;
  sectionId: string;
  sectionLabel?: string;
  fieldId: string;
  fieldLabel?: string;
  optionId: string;
  label: string;
  drawing: { path: string | null; status: string; exists: boolean };
  photos: Photo[];
  references: { path: string; bytes: number }[];
  flags: string[];
  inScope: boolean;
};

const PROBLEM_TAGS = [
  "Wrong feature entirely",
  "Generic version, not this option",
  "Wrong shape / outline",
  "Wrong count",
  "Wrong side or orientation",
  "Wrong size or proportion",
  "Feature not visible / too small in frame",
  "Looks identical to a sibling option",
  "Annotation or colour bled in from the drawing",
  "Wrong garment or wrong part",
  "Unrealistic / AI look",
  "Reference drawing itself is wrong",
];

const ORDER = ["lapel", "collar", "pocket", "cuff", "vent", "pleat", "waist"];
const CURSOR_KEY = "bd-review-cursor";

function sortCrafts(a: Craft, b: Craft) {
  if (a.product !== b.product) return a.product.localeCompare(b.product);
  const ai = ORDER.findIndex((k) => `${a.fieldId} ${a.sectionId}`.toLowerCase().includes(k));
  const bi = ORDER.findIndex((k) => `${b.fieldId} ${b.sectionId}`.toLowerCase().includes(k));
  const ao = ai === -1 ? 99 : ai;
  const bo = bi === -1 ? 99 : bi;
  if (ao !== bo) return ao - bo;
  return a.craftId.localeCompare(b.craftId);
}

const pageWrap: CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  padding: "16px 20px 40px",
  background: "#f4f1ea",
  color: "#1c1917",
  minHeight: "100%",
};

export default function ImageReviewPage() {
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [garment, setGarment] = useState("shirt");
  const savingRef = useRef(false);
  const [filter, setFilter] = useState<"needs-review" | "done" | "flagged" | "all">("needs-review");
  const [q, setQ] = useState("");
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [picked, setPicked] = useState<Record<string, "approved" | "rejected" | "unreviewed">>({});
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [drawingWrong, setDrawingWrong] = useState(false);
  const [applyJackets, setApplyJackets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const formResetFor = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const qs = garment && garment !== "all" ? `?product=${encodeURIComponent(garment)}` : "";
        const r = await fetch(`/api/admin/image-review${qs}`);
        const d = await r.json();
        if (cancelled) return;
        const list: Craft[] = (d.crafts ?? []).slice().sort(sortCrafts);
        setCrafts(list);
        const saved = sessionStorage.getItem(CURSOR_KEY);
        const start = saved && list.some((c) => c.craftId === saved) ? saved : list[0]?.craftId ?? null;
        setCursorId(start);
        formResetFor.current = null;
      } catch {
        if (!cancelled) setError("Could not load the craft map.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [garment]);

  useEffect(() => {
    if (cursorId) sessionStorage.setItem(CURSOR_KEY, cursorId);
  }, [cursorId]);

  const visible = useMemo(() => {
    return crafts.filter((c) => {
      if (garment !== "all" && c.product !== garment) return false;
      if (q) {
        const hay = `${c.label} ${c.craftId} ${c.fieldLabel ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      const hasUnreviewed = c.photos.some((p) => p.verdict === "unreviewed");
      const done = c.photos.length > 0 && !hasUnreviewed && c.photos.every((p) => p.verdict === "approved" || p.verdict === "rejected");
      if (filter === "needs-review") {
        if (c.craftId === cursorId) return true;
        if (done) return false;
        if (!hasUnreviewed && c.photos.some((p) => p.preTicked) && c.photos.length > 0) return false;
      }
      if (filter === "done" && !done) return false;
      if (filter === "flagged" && !(c.flags ?? []).length) return false;
      return true;
    });
  }, [crafts, garment, filter, q, cursorId]);

  const current =
    visible.find((c) => c.craftId === cursorId)
    ?? crafts.find((c) => c.craftId === cursorId)
    ?? null;
  const pos = current ? visible.findIndex((c) => c.craftId === current.craftId) : -1;

  useEffect(() => {
    if (!current) return;
    if (formResetFor.current === current.craftId) return;
    formResetFor.current = current.craftId;
    const next: Record<string, "approved" | "rejected" | "unreviewed"> = {};
    for (const p of current.photos) next[p.sha1] = p.preTicked || p.verdict === "approved" ? "approved" : "unreviewed";
    setPicked(next);
    setTags([]);
    setNotes("");
    setDrawingWrong(false);
    setZoom(current.photos[0]?.path ?? current.drawing.path);
    setApplyJackets(false);
  }, [current]);

  const goTo = useCallback((id: string | null) => {
    if (!id) return;
    formResetFor.current = null;
    setCursorId(id);
  }, []);

  const save = useCallback(async (noneRight: boolean) => {
    if (!current || saving || savingRef.current) return;
    savingRef.current = true;
    const i = visible.findIndex((c) => c.craftId === current.craftId);
    const nextId = visible[i + 1]?.craftId ?? null;
    setSaving(true);
    setError(null);
    try {
      const photos = current.photos.map((p) => ({
        path: p.path,
        sha1: p.sha1,
        verdict: noneRight ? "rejected" : (picked[p.sha1] ?? "unreviewed"),
      })).filter((p) => p.verdict === "approved" || p.verdict === "rejected");
      const r = await fetch("/api/admin/image-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          craftId: current.craftId,
          photos,
          noneRight,
          drawingWrong,
          tags,
          notes,
          applyToJackets: applyJackets,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Save failed");
      }
      setHistory((h) => [...h, current.craftId]);
      setCrafts((prev) => prev.map((c) => {
        if (c.craftId !== current.craftId) return c;
        return {
          ...c,
          photos: c.photos.map((p) => ({
            ...p,
            verdict: noneRight ? "rejected" : (picked[p.sha1] ?? p.verdict),
            preTicked: !noneRight && picked[p.sha1] === "approved",
          })),
        };
      }));
      goTo(nextId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [current, picked, tags, notes, drawingWrong, applyJackets, visible, goTo]);

  async function upload(kind: "drawing" | "reference" | "photo", file: File) {
    if (!current) return;
    setUploading(kind);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("craftId", current.craftId);
      fd.set("kind", kind);
      const r = await fetch("/api/admin/image-review/asset", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Upload failed");
      const path = d.path as string;
      const sha1 = (d.sha1 as string) || path;
      setCrafts((prev) => prev.map((c) => {
        if (c.craftId !== current.craftId) return c;
        if (kind === "drawing") {
          return { ...c, drawing: { path, status: "owner-uploaded", exists: true }, flags: c.flags.filter((f) => !f.startsWith("DRAWING") && f !== "NO_DRAWING") };
        }
        if (kind === "reference") {
          return { ...c, references: [...c.references, { path, bytes: file.size }] };
        }
        return {
          ...c,
          photos: [...c.photos, { path, sha1, verdict: "approved", preTicked: true, sources: ["owner-upload"] }],
        };
      }));
      if (kind === "photo") {
        setPicked((p) => ({ ...p, [sha1]: "approved" }));
        setZoom(path);
      }
      if (kind === "drawing") setDrawingWrong(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  if (loading) return <div style={pageWrap}>Loading craft map…</div>;

  const doneCount = crafts.filter((c) => c.photos.some((p) => p.verdict === "approved")).length;

  return (
    <div style={pageWrap}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Craft photo review</h1>
        <span style={{ color: "#57534e", fontSize: 13 }}>{doneCount} / {crafts.length} in-scope have an approved photo</span>
        <select value={garment} onChange={(e) => { setGarment(e.target.value); setCursorId(null); }} style={sel}>
          {["shirt", "sport-coat", "suit-2pc", "suit-3pc", "trousers", "vest"].map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={filter} onChange={(e) => { setFilter(e.target.value as typeof filter); }} style={sel}>
          <option value="needs-review">Needs review</option>
          <option value="done">Done</option>
          <option value="flagged">Flagged</option>
          <option value="all">All</option>
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" style={{ ...sel, width: 180 }} />
      </header>
      {error && <p style={{ color: "#b3261e" }}>{error}</p>}
      {!current ? (
        <p>Nothing in this filter. Switch to All or another garment.</p>
      ) : (
        <div>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#57534e" }}>
            {pos + 1} / {visible.length} · {current.product} · {current.sectionLabel || current.sectionId} · {current.fieldLabel || current.fieldId}
          </p>
          <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>{current.label}</h2>
          {!!current.flags.length && <p style={{ color: "#b45309", fontSize: 12 }}>Flags: {current.flags.join(", ")}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) 2fr", gap: 16 }}>
            <div>
              <p style={cap}>Tech-pack drawing</p>
              {current.drawing.path
                ? <img src={current.drawing.path} alt="drawing" style={{ width: "100%", background: "#fff", borderRadius: 8 }} />
                : <div style={{ padding: 40, background: "#e7e5e4", borderRadius: 8 }}>NO DRAWING</div>}
              <label style={fileBtn}>
                {uploading === "drawing" ? "Uploading drawing…" : "Replace drawing"}
                <input type="file" accept="image/*" hidden disabled={!!uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload("drawing", f); }} />
              </label>
              <label style={{ display: "flex", gap: 8, marginTop: 10, fontSize: 13 }}>
                <input type="checkbox" checked={drawingWrong} onChange={(e) => setDrawingWrong(e.target.checked)} />
                Drawing is wrong (and I do not have a replacement yet)
              </label>
            </div>
            <div>
              <p style={cap}>Photos for this craft — click to approve</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                {current.photos.map((p) => {
                  const v = picked[p.sha1] ?? "unreviewed";
                  return (
                    <button
                      key={p.sha1 || p.path}
                      type="button"
                      onClick={() => {
                        setZoom(p.path);
                        setPicked((prev) => ({
                          ...prev,
                          [p.sha1]: v === "approved" ? "unreviewed" : "approved",
                        }));
                      }}
                      style={{
                        border: v === "approved" ? "3px solid #b45309" : "1px solid #d6d3d1",
                        borderRadius: 8,
                        padding: 4,
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <img src={p.path} alt="" style={{ width: "100%", height: 110, objectFit: "contain" }} />
                      <span style={{ fontSize: 11 }}>{v === "approved" ? "Use this" : "Waiting"}</span>
                    </button>
                  );
                })}
                {current.photos.length === 0 && <p style={{ color: "#78716c" }}>No local photos yet. Upload one below or mark “None are right”.</p>}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <label style={fileBtn}>
                  {uploading === "photo" ? "Uploading…" : "Add photo to use"}
                  <input type="file" accept="image/*" hidden disabled={!!uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload("photo", f); }} />
                </label>
                <label style={fileBtn}>
                  {uploading === "reference" ? "Uploading…" : "Add reference"}
                  <input type="file" accept="image/*" hidden disabled={!!uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload("reference", f); }} />
                </label>
              </div>
              {zoom && (
                <div style={{ marginTop: 12, background: "#fff", borderRadius: 8, padding: 8 }}>
                  <p style={cap}>Enlarged</p>
                  <img src={zoom} alt="" style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }} />
                </div>
              )}
              {!!current.references.length && (
                <div style={{ marginTop: 12 }}>
                  <p style={cap}>Reference uploads</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {current.references.map((r) => (
                      <img key={r.path} src={r.path} alt="" style={{ height: 72, background: "#fff", borderRadius: 4 }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PROBLEM_TAGS.map((t) => (
              <button key={t} type="button" onClick={() => setTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])}
                style={{ fontSize: 12, padding: "4px 8px", borderRadius: 999, border: "1px solid #d6d3d1", background: tags.includes(t) ? "#1c1917" : "#fff", color: tags.includes(t) ? "#fff" : "#1c1917" }}>
                {t}
              </button>
            ))}
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Notes for a retry…"
            style={{ width: "100%", marginTop: 10, padding: 8, fontFamily: "inherit" }} />
          {["suit-2pc", "suit-3pc", "sport-coat"].includes(current.product) && (
            <label style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 13 }}>
              <input type="checkbox" checked={applyJackets} onChange={(e) => setApplyJackets(e.target.checked)} />
              Also apply to this same option on the other jackets
            </label>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button type="button" disabled={saving || history.length === 0} onClick={() => {
              const prev = history[history.length - 1];
              setHistory((h) => h.slice(0, -1));
              goTo(prev);
            }} style={btn}>Back</button>
            <button type="button" disabled={saving} onClick={() => void save(false)} style={{ ...btn, background: "#1c1917", color: "#fff" }}>
              {saving ? "Saving…" : "Save & next"}
            </button>
            <button type="button" disabled={saving} onClick={() => {
              const i = visible.findIndex((c) => c.craftId === current.craftId);
              setHistory((h) => [...h, current.craftId]);
              goTo(visible[i + 1]?.craftId ?? current.craftId);
            }} style={btn}>Skip</button>
            <button type="button" disabled={saving} onClick={() => void save(true)} style={{ ...btn, color: "#b3261e" }}>
              None are right — needs a new photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const sel: CSSProperties = { padding: "6px 8px", fontSize: 13 };
const cap: CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#78716c", margin: "0 0 6px" };
const btn: CSSProperties = { padding: "8px 14px", fontSize: 13, borderRadius: 8, border: "1px solid #d6d3d1", background: "#fff", cursor: "pointer" };
const fileBtn: CSSProperties = { ...btn, display: "inline-block", marginTop: 10 };
