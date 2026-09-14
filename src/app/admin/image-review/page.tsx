"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

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
  const [garment, setGarment] = useState("all");
  const [filter, setFilter] = useState<"needs-review" | "done" | "flagged" | "all">("needs-review");
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Record<string, "approved" | "rejected" | "unreviewed">>({});
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [drawingWrong, setDrawingWrong] = useState(false);
  const [applyJackets, setApplyJackets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/admin/image-review");
        const d = await r.json();
        const list: Craft[] = (d.crafts ?? []).slice().sort(sortCrafts);
        setCrafts(list);
      } catch {
        setError("Could not load the craft map.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = useMemo(() => {
    return crafts.filter((c) => {
      if (garment !== "all" && c.product !== garment) return false;
      if (q) {
        const hay = `${c.label} ${c.craftId} ${c.fieldLabel ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      const hasUnreviewed = c.photos.some((p) => p.verdict === "unreviewed");
      const done = c.photos.length > 0 && c.photos.every((p) => p.verdict === "approved" || p.verdict === "rejected") && !hasUnreviewed;
      if (filter === "needs-review" && !hasUnreviewed && c.photos.some((p) => p.preTicked)) return false;
      if (filter === "needs-review" && done) return false;
      if (filter === "done" && !done) return false;
      if (filter === "flagged" && !(c.flags ?? []).length) return false;
      return true;
    });
  }, [crafts, garment, filter, q]);

  const current = visible[Math.min(idx, Math.max(0, visible.length - 1))];

  useEffect(() => {
    if (!current) return;
    const next: Record<string, "approved" | "rejected" | "unreviewed"> = {};
    for (const p of current.photos) next[p.sha1] = p.preTicked || p.verdict === "approved" ? "approved" : "unreviewed";
    setPicked(next);
    setTags([]);
    setNotes("");
    setDrawingWrong(false);
    setZoom(current.photos[0]?.path ?? null);
    setApplyJackets(false);
  }, [current?.craftId]);

  const save = useCallback(async (noneRight: boolean) => {
    if (!current || saving) return;
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
      setIdx((i) => i + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [current, picked, tags, notes, drawingWrong, applyJackets, saving]);

  if (loading) return <div style={pageWrap}>Loading craft map…</div>;

  const garments = [...new Set(crafts.map((c) => c.product))];
  const doneCount = crafts.filter((c) => c.photos.some((p) => p.verdict === "approved")).length;

  return (
    <div style={pageWrap}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Craft photo review</h1>
        <span style={{ color: "#57534e", fontSize: 13 }}>{doneCount} / {crafts.length} in-scope have an approved photo</span>
        <select value={garment} onChange={(e) => { setGarment(e.target.value); setIdx(0); }} style={sel}>
          <option value="all">All garments</option>
          {garments.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filter} onChange={(e) => { setFilter(e.target.value as typeof filter); setIdx(0); }} style={sel}>
          <option value="needs-review">Needs review</option>
          <option value="done">Done</option>
          <option value="flagged">Flagged</option>
          <option value="all">All</option>
        </select>
        <input value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }} placeholder="Search…" style={{ ...sel, width: 180 }} />
      </header>
      {error && <p style={{ color: "#b3261e" }}>{error}</p>}
      {!current ? (
        <p>Nothing in this filter. Switch to All or another garment.</p>
      ) : (
        <div>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#57534e" }}>
            {Math.min(idx, visible.length - 1) + 1} / {visible.length} · {current.product} · {current.sectionLabel || current.sectionId} · {current.fieldLabel || current.fieldId}
          </p>
          <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>{current.label}</h2>
          {!!current.flags.length && <p style={{ color: "#b45309", fontSize: 12 }}>Flags: {current.flags.join(", ")}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) 2fr", gap: 16 }}>
            <div>
              <p style={cap}>Tech-pack drawing</p>
              {current.drawing.path
                ? <img src={current.drawing.path} alt="drawing" style={{ width: "100%", background: "#fff", borderRadius: 8 }} />
                : <div style={{ padding: 40, background: "#e7e5e4", borderRadius: 8 }}>NO DRAWING</div>}
              <label style={{ display: "flex", gap: 8, marginTop: 10, fontSize: 13 }}>
                <input type="checkbox" checked={drawingWrong} onChange={(e) => setDrawingWrong(e.target.checked)} />
                Drawing is wrong
              </label>
            </div>
            <div>
              <p style={cap}>Photos for this craft — tick to approve</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                {current.photos.map((p) => {
                  const v = picked[p.sha1] ?? "unreviewed";
                  return (
                    <button
                      key={p.sha1}
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
                      <span style={{ fontSize: 11 }}>{v === "approved" ? "Approved" : "Waiting"}</span>
                    </button>
                  );
                })}
                {current.photos.length === 0 && <p style={{ color: "#78716c" }}>No local photos on file. Use “None are right”.</p>}
              </div>
              {zoom && (
                <div style={{ marginTop: 12, background: "#fff", borderRadius: 8, padding: 8 }}>
                  <p style={cap}>Enlarged</p>
                  <img src={zoom} alt="" style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }} />
                </div>
              )}
              {!!current.references.length && (
                <div style={{ marginTop: 12 }}>
                  <p style={cap}>Your reference uploads (not published unless you tick a matching photo)</p>
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
            <button type="button" disabled={saving} onClick={() => setIdx((i) => Math.max(0, i - 1))} style={btn}>Back</button>
            <button type="button" disabled={saving} onClick={() => void save(false)} style={{ ...btn, background: "#1c1917", color: "#fff" }}>
              {saving ? "Saving…" : "Save & next"}
            </button>
            <button type="button" disabled={saving} onClick={() => setIdx((i) => i + 1)} style={btn}>Skip</button>
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
