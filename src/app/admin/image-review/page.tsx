"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Owner image review.
//
// One generated candidate per craft option, shown beside its supplier drawing.
// Approve or reject; a rejection needs a reason, because the reason is what the
// retry prompt is built from. The owner can attach their own reference photos,
// which are stored against the option and handed to the retry alongside the
// drawing.

type Item = {
  key: string;
  product: string;
  option: string;
  attempt: number;
  addr: string;
  label: string;
  field: string;
  part: string;
  orientation: string;
  description: string;
  checklist: string[];
  jobId: string | null;
  qcVerdict: string | null;
  pipelineStatus: "ungraded" | "pipeline-rejected" | "shipped";
  candidateUrl: string;
  drawingUrl: string | null;
  drawingOriginalPath: string | null;
  promptText: string;
  rejectionHistory?: { attemptRejected: number; decidedAt: string; tags: string[]; notes: string; references: string[] }[];
  isReplacementForRejected?: boolean;
};

type Decision = {
  key: string;
  attempt: number;
  verdict: "approved" | "rejected";
  notes?: string;
  tags?: string[];
  references?: string[];
  decidedAt: string;
};

// The recurring failure modes from the wave logs. Ticking one is faster than
// writing prose, and it makes patterns countable across many rejects.
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

export default function ImageReviewPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Bumping this refetches. State is only touched after the await, so the
  // effect never sets state synchronously, and a stale response cannot land
  // on top of a newer one.
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/admin/image-review");
        const d = await r.json();
        if (cancelled) return;
        setItems(d.items ?? []);
        setDecisions(d.decisions ?? {});
        setLoadError(null);
      } catch {
        if (!cancelled) setLoadError("Could not load the review queue.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadNonce]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadNonce((n) => n + 1);
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => {
      const d = decisions[i.key];
      return !d || d.attempt < i.attempt;
    });
  }, [items, decisions, filter]);

  const current: Item | undefined = visible[Math.min(idx, Math.max(0, visible.length - 1))];

  const decided = Object.values(decisions);
  const approvedCount = decided.filter((d) => d.verdict === "approved").length;
  const rejectedCount = decided.filter((d) => d.verdict === "rejected").length;

  const onDecided = useCallback((d: Decision) => {
    setDecisions((prev) => ({ ...prev, [d.key]: d }));
    // In "pending" mode the item vanishes from the list, so staying at the same
    // index already lands on the next one. In "all" mode, advance explicitly.
    if (filter === "all") setIdx((i) => i + 1);
  }, [filter]);

  const undo = useCallback(async (key: string) => {
    await fetch(`/api/admin/image-review?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    setDecisions((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: "system-ui" }}>Loading review queue…</div>;
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px 24px", maxWidth: 1500, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0, letterSpacing: "-0.02em" }}>Craft option image review</h1>
        <span style={{ color: "#666", fontSize: 14 }}>
          {visible.length} {filter === "pending" ? "awaiting you" : "in queue"} · {approvedCount} approved · {rejectedCount} rejected
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => { setFilter(filter === "pending" ? "all" : "pending"); setIdx(0); }} style={btn(false)}>
            {filter === "pending" ? "Show all" : "Show pending only"}
          </button>
          <button onClick={reload} style={btn(false)}>Refresh</button>
        </div>
      </header>

      {loadError && <p style={{ color: "#b3261e" }}>{loadError}</p>}

      {!current ? (
        <div style={{ padding: 60, textAlign: "center", background: "#f6f6f6", borderRadius: 10 }}>
          <p style={{ fontSize: 17, margin: 0 }}>Nothing waiting for you.</p>
          <p style={{ color: "#666", marginTop: 8 }}>
            {items.length === 0
              ? "The queue is empty. Run: node tools/build_review_queue.mjs --write"
              : "Every candidate in the queue has a decision."}
          </p>
        </div>
      ) : (
        <ReviewCard
          // Remounting on item change resets the form without an effect.
          key={`${current.key}:${current.attempt}`}
          item={current}
          existing={decisions[current.key]}
          position={`${Math.min(idx, visible.length - 1) + 1} / ${visible.length}`}
          onDecided={onDecided}
          onUndo={undo}
          onPrev={() => setIdx((i) => Math.max(0, i - 1))}
          onNext={() => setIdx((i) => Math.min(visible.length - 1, i + 1))}
        />
      )}
    </div>
  );
}

function ReviewCard({
  item, existing, position, onDecided, onUndo, onPrev, onNext,
}: {
  item: Item;
  existing?: Decision;
  position: string;
  onDecided: (d: Decision) => void;
  onUndo: (key: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const settled = !!existing && existing.attempt >= item.attempt;
  const [notes, setNotes] = useState(settled ? (existing?.notes ?? "") : "");
  const [tags, setTags] = useState<string[]>(settled ? (existing?.tags ?? []) : []);
  const [refs, setRefs] = useState<string[]>(settled ? (existing?.references ?? []) : []);
  const [zoom, setZoom] = useState<"side" | "candidate" | "drawing">("side");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const decide = useCallback(async (verdict: "approved" | "rejected") => {
    if (saving) return;
    if (verdict === "rejected" && notes.trim().length < 4 && tags.length === 0) {
      setError("Tick at least one problem, or write a note — the retry is built from your reason.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/image-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: item.key, attempt: item.attempt, verdict,
          // The full craft address rides along because product/option alone is
          // ambiguous for 87 keys (the suit-2pc/coin-left lesson).
          addr: item.addr,
          notes: notes.trim(), tags, references: refs,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Could not save."); return; }
      onDecided(d.decision as Decision);
    } catch {
      setError("Could not save.");
    } finally {
      setSaving(false);
    }
  }, [saving, notes, tags, refs, item.key, item.attempt, onDecided]);

  const uploadRefs = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("product", item.product);
        fd.append("option", item.option);
        const res = await fetch("/api/admin/image-review/reference", { method: "POST", body: fd });
        const d = await res.json();
        if (!res.ok) { setError(d.error ?? "Upload failed."); continue; }
        setRefs((prev) => [...prev, d.path as string]);
      }
    } finally {
      setUploading(false);
    }
  }, [item.product, item.option]);

  // Keyboard: A approve, R reject, arrows to move. Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT")) return;
      if (e.key === "a" || e.key === "A") { e.preventDefault(); void decide("approved"); }
      if (e.key === "r" || e.key === "R") { e.preventDefault(); void decide("rejected"); }
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, onNext, onPrev]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 17 }}>{item.label}</strong>
        <code style={{ background: "#eee", padding: "2px 7px", borderRadius: 4, fontSize: 12 }}>{item.key}</code>
        {item.field && <span style={{ color: "#666", fontSize: 13 }}>{item.field}</span>}
        {item.attempt > 1 && (
          <span style={{ background: "#fde68a", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
            attempt {item.attempt}
          </span>
        )}
        {/* What the automated check concluded. Your verdict overrides it either way. */}
        <span style={{
          padding: "2px 8px", borderRadius: 4, fontSize: 12, color: "#333",
          background: item.pipelineStatus === "shipped" ? "#d7ecd9"
            : item.pipelineStatus === "pipeline-rejected" ? "#fadbd7" : "#e6e6e6",
        }}>
          {item.pipelineStatus === "shipped" ? "live on the site"
            : item.pipelineStatus === "pipeline-rejected" ? "auto-check rejected the last try"
            : "not auto-checked"}
        </span>
        <span style={{ marginLeft: "auto", color: "#888", fontSize: 13 }}>{position}</span>
      </div>

      {item.description && (
        <p style={{ margin: "0 0 12px", color: "#444", fontSize: 14, lineHeight: 1.6, maxWidth: 1100 }}>
          {item.description}
        </p>
      )}

      {/* If this is the retry of something you rejected, say so — and show
          your own reasons, so you can check the retry actually fixed them. */}
      {item.isReplacementForRejected && (item.rejectionHistory?.length ?? 0) > 0 && (
        <div style={{ margin: "0 0 12px", padding: "10px 14px", background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 8, maxWidth: 1100 }}>
          <strong style={{ fontSize: 13, color: "#9a3412" }}>
            Replacement for a version you rejected — your reasons were:
          </strong>
          {item.rejectionHistory!.map((h, i) => (
            <div key={i} style={{ fontSize: 13, color: "#7c2d12", marginTop: 4 }}>
              attempt {h.attemptRejected}: {[...h.tags, h.notes].filter(Boolean).join(" — ")}
              {h.references.length > 0 && ` (you attached ${h.references.length} reference photo${h.references.length > 1 ? "s" : ""})`}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {(["side", "candidate", "drawing"] as const).map((z) => (
          <button key={z} onClick={() => setZoom(z)} style={btn(zoom === z)}>
            {z === "side" ? "Side by side" : z === "candidate" ? "Photo only" : "Drawing only"}
          </button>
        ))}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: zoom === "side" ? "1fr 1fr" : "1fr",
        gap: 14, marginBottom: 18,
      }}>
        {zoom !== "candidate" && (
          <figure style={fig}>
            <figcaption style={cap}>Supplier drawing</figcaption>
            {item.drawingUrl
              ? <img src={item.drawingUrl} alt="supplier drawing" style={imgStyle} />
              : <div style={{ ...imgStyle, height: 320, display: "grid", placeItems: "center", color: "#999" }}>no drawing on file</div>}
          </figure>
        )}
        {zoom !== "drawing" && (
          <figure style={fig}>
            <figcaption style={cap}>Generated photo</figcaption>
            <img src={item.candidateUrl} alt="generated candidate" style={imgStyle} />
          </figure>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        <div>
          <h3 style={h3}>What is wrong with it?</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
            {PROBLEM_TAGS.map((t) => {
              const on = tags.includes(t);
              return (
                <button key={t} type="button"
                  onClick={() => setTags((p) => on ? p.filter((x) => x !== t) : [...p, t])}
                  style={{ ...btn(on), fontSize: 13, padding: "5px 11px" }}>
                  {t}
                </button>
              );
            })}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else I should know — what the option should actually look like, what to change, what to keep."
            rows={4}
            style={{
              width: "100%", padding: 11, fontSize: 14, fontFamily: "inherit",
              border: "1px solid #ccc", borderRadius: 8, resize: "vertical", lineHeight: 1.5,
            }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => void decide("approved")} disabled={saving}
              style={{ ...btn(false), background: "#137333", color: "#fff", borderColor: "#137333", fontSize: 15, padding: "10px 22px" }}>
              Approve <kbd style={kbd}>A</kbd>
            </button>
            <button onClick={() => void decide("rejected")} disabled={saving}
              style={{ ...btn(false), background: "#b3261e", color: "#fff", borderColor: "#b3261e", fontSize: 15, padding: "10px 22px" }}>
              Reject <kbd style={kbd}>R</kbd>
            </button>
            <button onClick={onPrev} style={btn(false)}>← Prev</button>
            <button onClick={onNext} style={btn(false)}>Skip →</button>
            {saving && <span style={{ color: "#666", fontSize: 13 }}>saving…</span>}
          </div>

          {error && <p style={{ color: "#b3261e", marginTop: 10, fontSize: 14 }}>{error}</p>}

          {settled && (
            <p style={{ marginTop: 10, fontSize: 13, color: "#555" }}>
              Already {existing?.verdict} ·{" "}
              <button onClick={() => onUndo(item.key)} style={{ ...btn(false), padding: "2px 8px", fontSize: 12 }}>undo</button>
            </p>
          )}
        </div>

        <aside>
          <h3 style={h3}>Your reference photos</h3>
          <p style={{ fontSize: 13, color: "#666", margin: "0 0 10px", lineHeight: 1.5 }}>
            Add your own pictures of what this option should look like. They are attached to the
            option and used alongside the drawing when it is re-shot.
          </p>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) void uploadRefs(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: "2px dashed #bbb", borderRadius: 10, padding: 18, textAlign: "center",
              cursor: "pointer", color: "#666", fontSize: 14, background: "#fafafa",
            }}
          >
            {uploading ? "Uploading…" : "Drop images here, or click to choose"}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden
            onChange={(e) => { if (e.target.files?.length) void uploadRefs(e.target.files); e.target.value = ""; }} />

          {refs.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
              {refs.map((r) => (
                <div key={r} style={{ position: "relative" }}>
                  <img src={r} alt="reference" style={{ width: "100%", borderRadius: 6, display: "block", border: "1px solid #ddd" }} />
                  <button onClick={() => setRefs((p) => p.filter((x) => x !== r))}
                    style={{
                      position: "absolute", top: 4, right: 4, border: "none", borderRadius: 4,
                      background: "rgba(0,0,0,.65)", color: "#fff", cursor: "pointer",
                      fontSize: 12, padding: "2px 7px",
                    }}>×</button>
                </div>
              ))}
            </div>
          )}

          {item.checklist?.length > 0 && (
            <>
              <h3 style={{ ...h3, marginTop: 22 }}>What it should show</h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#444", lineHeight: 1.65 }}>
                {item.checklist.slice(0, 10).map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}

          <details style={{ marginTop: 18 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, color: "#555" }}>Prompt used</summary>
            <pre style={{
              whiteSpace: "pre-wrap", fontSize: 11, lineHeight: 1.45, background: "#f6f6f6",
              padding: 10, borderRadius: 6, maxHeight: 320, overflow: "auto", marginTop: 8,
            }}>{item.promptText}</pre>
          </details>
        </aside>
      </div>
    </>
  );
}

const fig: React.CSSProperties = { margin: 0, background: "#f2f2f2", borderRadius: 10, overflow: "hidden", border: "1px solid #e2e2e2" };
const cap: React.CSSProperties = { fontSize: 12, color: "#666", padding: "7px 11px", background: "#fff", borderBottom: "1px solid #eee" };
const imgStyle: React.CSSProperties = { width: "100%", display: "block", background: "#fff", maxHeight: "62vh", objectFit: "contain" };
const h3: React.CSSProperties = { fontSize: 14, margin: "0 0 9px", letterSpacing: "-0.01em" };
const kbd: React.CSSProperties = { marginLeft: 7, fontSize: 11, opacity: 0.75, border: "1px solid rgba(255,255,255,.5)", borderRadius: 3, padding: "0 4px" };

function btn(active: boolean): React.CSSProperties {
  return {
    padding: "7px 13px",
    fontSize: 14,
    borderRadius: 7,
    border: `1px solid ${active ? "#111" : "#ccc"}`,
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#222",
    cursor: "pointer",
    fontFamily: "inherit",
  };
}
