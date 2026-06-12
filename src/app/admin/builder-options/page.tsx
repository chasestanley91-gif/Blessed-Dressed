"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductDesignConfig, DesignField, DesignOption, FieldQuiz, QuizAnswer } from "@/data/options/types";

const PRODUCTS = [
  { id: "suit-2pc", label: "Suit (2pc)" },
  { id: "suit-3pc", label: "Suit (3pc)" },
  { id: "sport-coat", label: "Sport Coat" },
  { id: "vest", label: "Vest" },
  { id: "trousers", label: "Trousers" },
  { id: "shirt", label: "Shirt" },
];

function OptionRow({
  opt, sectionIdx, fieldIdx, optIdx, onChange, onDelete, onImageUpload,
}: {
  opt: DesignOption;
  sectionIdx: number; fieldIdx: number; optIdx: number;
  onChange: (si: number, fi: number, oi: number, patch: Partial<DesignOption>) => void;
  onDelete: (si: number, fi: number, oi: number) => void;
  onImageUpload: (si: number, fi: number, oi: number, file: File, field: "image" | "aiImage" | "realImage") => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingField = useRef<"image" | "aiImage" | "realImage">("image");
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onImageUpload(sectionIdx, fieldIdx, optIdx, file, pendingField.current);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }
  function pick(field: "image" | "aiImage" | "realImage") {
    pendingField.current = field;
    fileRef.current?.click();
  }

  const inp = "rounded-md border border-border-accent bg-surface-deep px-2 py-1 font-sans text-xs text-foreground outline-none focus:border-gold transition-colors";

  return (
    <div className="py-2 border-b border-surface-strong last:border-0">
      <div className="grid grid-cols-[210px_1fr_2fr_70px_auto_auto] gap-2 items-center">
        {/* Images: Illustration / AI render / Real photo */}
        <div className="flex items-start gap-1.5">
          <input ref={fileRef} type="file" accept="image/*" title="Upload option image" className="hidden" onChange={handleFile} />
          {([["image", "Illus.", opt.image], ["aiImage", "AI", opt.aiImage], ["realImage", "Real", opt.realImage]] as const).map(([field, lbl, src]) => (
            <div key={field} className="flex flex-col items-center gap-0.5">
              <div className="h-[44px] w-[58px] rounded bg-white overflow-hidden border border-border-accent">
                {src ? <img src={src} alt={lbl} className="h-full w-full object-contain" /> : <div className="h-full w-full bg-border-accent" />}
              </div>
              <button type="button" onClick={() => pick(field)} disabled={uploading}
                className="font-sans text-[8px] text-slate hover:text-gold transition-colors disabled:opacity-40">
                {uploading ? "…" : lbl}
              </button>
            </div>
          ))}
        </div>
        {/* Label */}
        <input className={inp + " w-full"} value={opt.label} title="Option label"
          onChange={(e) => onChange(sectionIdx, fieldIdx, optIdx, { label: e.target.value })} />
        {/* Description */}
        <input className={inp + " w-full"} value={opt.description} title="Option description"
          onChange={(e) => onChange(sectionIdx, fieldIdx, optIdx, { description: e.target.value })} />
        {/* Price adj */}
        <input type="number" className={inp + " w-full"} title="Price adjustment"
          value={opt.priceAdj ?? ""} placeholder="±$"
          onChange={(e) => {
            const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
            onChange(sectionIdx, fieldIdx, optIdx, { priceAdj: v });
          }} />
        {/* ID (read-only) */}
        <span className="font-mono text-[9px] text-dim truncate max-w-[80px]" title={opt.id}>{opt.id}</span>
        {/* Delete */}
        <button type="button" onClick={() => onDelete(sectionIdx, fieldIdx, optIdx)}
          className="font-sans text-xs text-dim hover:text-[#EF4444] transition-colors px-1">×</button>
      </div>
      {/* Quiz clustering metadata */}
      <div className="mt-1.5 flex items-center gap-2 pl-[88px]">
        <span className="font-sans text-[9px] uppercase tracking-[0.15em] text-dim shrink-0">Group</span>
        <input className={inp + " w-28"} value={opt.group ?? ""} title="Cluster group" placeholder="e.g. notch"
          onChange={(e) => onChange(sectionIdx, fieldIdx, optIdx, { group: e.target.value.trim() || undefined })} />
        <span className="font-sans text-[9px] uppercase tracking-[0.15em] text-dim shrink-0">Tags</span>
        <input className={inp + " flex-1"} value={(opt.tags ?? []).join(", ")} title="Tags (comma-separated)" placeholder="formal, italian"
          onChange={(e) => {
            const tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
            onChange(sectionIdx, fieldIdx, optIdx, { tags: tags.length ? tags : undefined });
          }} />
      </div>
    </div>
  );
}

function FieldCard({
  field, sectionIdx, fieldIdx,
  onFieldChange, onOptionChange, onOptionDelete, onAddOption, onImageUpload, onDeleteField,
}: {
  field: DesignField;
  sectionIdx: number; fieldIdx: number;
  onFieldChange: (si: number, fi: number, patch: Partial<DesignField>) => void;
  onOptionChange: (si: number, fi: number, oi: number, patch: Partial<DesignOption>) => void;
  onOptionDelete: (si: number, fi: number, oi: number) => void;
  onAddOption: (si: number, fi: number) => void;
  onImageUpload: (si: number, fi: number, oi: number, file: File, field: "image" | "aiImage" | "realImage") => Promise<void>;
  onDeleteField: (si: number, fi: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const inp = "rounded-md border border-border-accent bg-surface-deep px-2 py-1 font-sans text-xs text-foreground outline-none focus:border-gold transition-colors";

  // ── Discovery-question editor helpers ──
  const quiz = field.quiz;
  const groups = Array.from(new Set(field.options.map((o) => o.group).filter(Boolean))) as string[];
  const setQuiz = (next: FieldQuiz | undefined) => onFieldChange(sectionIdx, fieldIdx, { quiz: next });
  const updateAnswer = (ai: number, patch: Partial<QuizAnswer>) => {
    if (!quiz) return;
    setQuiz({ ...quiz, answers: quiz.answers.map((a, i) => (i === ai ? { ...a, ...patch } : a)) });
  };
  const addAnswer = () => {
    const base = quiz ?? { question: "Which option do you prefer?", answers: [] };
    setQuiz({ ...base, answers: [...base.answers, { id: `ans-${Date.now()}`, label: "New answer", matchGroups: [] }] });
  };
  const removeAnswer = (ai: number) => quiz && setQuiz({ ...quiz, answers: quiz.answers.filter((_, i) => i !== ai) });
  const csv = (v?: string[]) => (v ?? []).join(", ");
  const toArr = (s: string) => { const a = s.split(",").map((x) => x.trim()).filter(Boolean); return a.length ? a : undefined; };

  return (
    <div className="rounded-xl border border-border-accent bg-background mb-3">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 transition-transform text-slate ${open ? "rotate-90" : ""}`} aria-hidden="true">
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-sans text-sm font-semibold text-foreground flex-1">{field.label}</span>
        <span className="font-sans text-[10px] text-slate">{field.options.length} options</span>
        {field.advanced && <span className="font-sans text-[9px] text-muted-dark border border-border-accent rounded px-1.5 py-0.5">Advanced</span>}
        <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteField(sectionIdx, fieldIdx); }}
          className="font-sans text-xs text-dim hover:text-[#EF4444] transition-colors ml-2" title="Delete field">×</button>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-border-accent">
          {/* Field metadata */}
          <div className="grid grid-cols-2 gap-2 mt-3 mb-4">
            <div>
              <p className="font-sans text-[10px] text-slate mb-1">Field label</p>
              <input className={inp + " w-full"} value={field.label} title="Field label"
                onChange={(e) => onFieldChange(sectionIdx, fieldIdx, { label: e.target.value })} />
            </div>
            <div>
              <p className="font-sans text-[10px] text-slate mb-1">Hint (optional)</p>
              <input className={inp + " w-full"} value={field.hint ?? ""} title="Field hint" placeholder="helper text…"
                onChange={(e) => onFieldChange(sectionIdx, fieldIdx, { hint: e.target.value || undefined })} />
            </div>
            <div>
              <p className="font-sans text-[10px] text-slate mb-1">Default option ID</p>
              <input className={inp + " w-full"} value={field.defaultValue} title="Default value"
                onChange={(e) => onFieldChange(sectionIdx, fieldIdx, { defaultValue: e.target.value })} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!field.advanced} onChange={(e) => onFieldChange(sectionIdx, fieldIdx, { advanced: e.target.checked || undefined })} className="accent-gold" />
                <span className="font-sans text-xs text-muted-dark">Advanced field</span>
              </label>
            </div>
          </div>

          {/* Discovery question editor */}
          <div className="mb-4 rounded-lg border border-gold/20 bg-gold/5 p-3">
            <div className="flex items-center justify-between">
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-gold">Discovery Question</p>
              {quiz ? (
                <button type="button" onClick={() => setQuiz(undefined)} className="font-sans text-[10px] text-dim hover:text-[#EF4444] transition-colors">Remove question</button>
              ) : (
                <button type="button" onClick={() => setQuiz({ question: "Which option do you prefer?", answers: [] })} className="font-sans text-[10px] text-gold hover:underline">+ Add question</button>
              )}
            </div>

            {!quiz && (
              <p className="font-sans text-[10px] text-slate mt-1">
                {field.options.length >= 5
                  ? "This category has 5+ options — add a question so customers can filter by family."
                  : "Optional. Discovery questions auto-show only when a category has 5+ options."}
              </p>
            )}

            {quiz && (
              <div className="mt-2 space-y-3">
                <div>
                  <p className="font-sans text-[10px] text-slate mb-1">Question text</p>
                  <input className={inp + " w-full"} value={quiz.question} title="Question text"
                    placeholder="e.g. Which lapel shape appeals to you most?"
                    onChange={(e) => setQuiz({ ...quiz, question: e.target.value })} />
                </div>

                {groups.length > 0 && (
                  <p className="font-sans text-[10px] text-slate">
                    Groups in this category:{" "}
                    {groups.map((g) => (
                      <span key={g} className="font-mono text-[9px] text-gold bg-gold/10 rounded px-1 py-0.5 mr-1">{g}</span>
                    ))}
                  </p>
                )}

                {quiz.answers.map((a, ai) => (
                  <div key={a.id} className="rounded-md border border-border-accent bg-surface-deep p-2 space-y-1.5">
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                      <input className={inp} value={a.label} title="Answer label" placeholder="Label"
                        onChange={(e) => updateAnswer(ai, { label: e.target.value })} />
                      <input className={inp} value={csv(a.matchGroups)} title="Match groups (score 100)" placeholder="match groups"
                        onChange={(e) => updateAnswer(ai, { matchGroups: toArr(e.target.value) })} />
                      <input className={inp} value={csv(a.matchTags)} title="Match tags (score 60)" placeholder="match tags"
                        onChange={(e) => updateAnswer(ai, { matchTags: toArr(e.target.value) })} />
                      <button type="button" onClick={() => removeAnswer(ai)} title="Remove answer"
                        className="font-sans text-xs text-dim hover:text-[#EF4444] transition-colors px-1">×</button>
                    </div>
                    <div className="grid grid-cols-[2fr_1fr] gap-2">
                      <input className={inp} value={a.description ?? ""} title="Answer description" placeholder="Short consultant copy (optional)"
                        onChange={(e) => updateAnswer(ai, { description: e.target.value || undefined })} />
                      <input className={inp} value={a.image ?? ""} title="Answer image URL" placeholder="/images/… (optional, shows a visual card)"
                        onChange={(e) => updateAnswer(ai, { image: e.target.value || undefined })} />
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addAnswer}
                  className="w-full rounded-lg border border-dashed border-border-accent hover:border-gold/40 px-3 py-1.5 font-sans text-[11px] text-muted-dark hover:text-gold transition-colors">
                  + Add answer
                </button>
              </div>
            )}
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[80px_1fr_2fr_70px_auto_auto] gap-2 mb-1">
            {["Image", "Label", "Description", "±Price", "ID", ""].map((h) => (
              <span key={h} className="font-sans text-[9px] uppercase tracking-[0.2em] text-dim">{h}</span>
            ))}
          </div>

          {field.options.map((opt, oi) => (
            <OptionRow key={opt.id} opt={opt}
              sectionIdx={sectionIdx} fieldIdx={fieldIdx} optIdx={oi}
              onChange={onOptionChange} onDelete={onOptionDelete} onImageUpload={onImageUpload} />
          ))}

          <button type="button" onClick={() => onAddOption(sectionIdx, fieldIdx)}
            className="mt-3 font-sans text-xs text-muted-dark hover:text-gold transition-colors border border-dashed border-border-accent hover:border-gold/40 rounded-lg px-4 py-2 w-full">
            + Add option
          </button>
        </div>
      )}
    </div>
  );
}

export default function BuilderOptionsAdmin() {
  const [productId, setProductId] = useState("suit-2pc");
  const [config, setConfig] = useState<ProductDesignConfig | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [savedIdx, setSavedIdx] = useState<number | null>(null);
  const [addSectionForm, setAddSectionForm] = useState<{ id: string; label: string } | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/builder-options/${productId}`).then((r) => r.json()).then(setConfig);
  }, [productId]);

  function updateOption(si: number, fi: number, oi: number, patch: Partial<DesignOption>) {
    setConfig((c) => {
      if (!c) return c;
      const sections = c.sections.map((s, si2) =>
        si2 !== si ? s : {
          ...s, fields: s.fields.map((f, fi2) =>
            fi2 !== fi ? f : {
              ...f, options: f.options.map((o, oi2) =>
                oi2 !== oi ? o : { ...o, ...patch }
              ),
            }
          ),
        }
      );
      return { ...c, sections };
    });
  }

  function updateField(si: number, fi: number, patch: Partial<DesignField>) {
    setConfig((c) => {
      if (!c) return c;
      const sections = c.sections.map((s, si2) =>
        si2 !== si ? s : {
          ...s, fields: s.fields.map((f, fi2) => fi2 !== fi ? f : { ...f, ...patch }),
        }
      );
      return { ...c, sections };
    });
  }

  function deleteOption(si: number, fi: number, oi: number) {
    setConfig((c) => {
      if (!c) return c;
      const sections = c.sections.map((s, si2) =>
        si2 !== si ? s : {
          ...s, fields: s.fields.map((f, fi2) =>
            fi2 !== fi ? f : { ...f, options: f.options.filter((_, idx) => idx !== oi) }
          ),
        }
      );
      return { ...c, sections };
    });
  }

  function deleteField(si: number, fi: number) {
    if (!confirm("Delete this field and all its options?")) return;
    setConfig((c) => {
      if (!c) return c;
      const sections = c.sections.map((s, si2) =>
        si2 !== si ? s : { ...s, fields: s.fields.filter((_, idx) => idx !== fi) }
      );
      return { ...c, sections };
    });
  }

  function addOption(si: number, fi: number) {
    const id = `opt-${Date.now()}`;
    const newOpt: DesignOption = { id, label: "New Option", description: "" };
    setConfig((c) => {
      if (!c) return c;
      const sections = c.sections.map((s, si2) =>
        si2 !== si ? s : {
          ...s, fields: s.fields.map((f, fi2) =>
            fi2 !== fi ? f : { ...f, options: [...f.options, newOpt] }
          ),
        }
      );
      return { ...c, sections };
    });
  }

  function addField(si: number) {
    const id = `field-${Date.now()}`;
    const newField: DesignField = { id, label: "New Field", options: [], defaultValue: "" };
    setConfig((c) => {
      if (!c) return c;
      const sections = c.sections.map((s, si2) =>
        si2 !== si ? s : { ...s, fields: [...s.fields, newField] }
      );
      return { ...c, sections };
    });
  }

  async function uploadImage(si: number, fi: number, oi: number, file: File, field: "image" | "aiImage" | "realImage" = "image") {
    const opt = config!.sections[si].fields[fi].options[oi];
    // image (illustration) keeps its category folder; AI/real go to /images/ai|real.
    const folder = field === "aiImage" ? "ai" : field === "realImage" ? "real" : opt.id.split("-")[0];
    const fname = `${opt.id}-${file.name}`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("imagePath", `${folder}/${fname}`);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    if (res.ok) updateOption(si, fi, oi, { [field]: `/images/${folder}/${fname}` });
  }

  async function saveSection(si: number) {
    if (!config) return;
    setSaving(si);
    await fetch(`/api/admin/builder-options/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(null);
    setSavedIdx(si);
    setTimeout(() => setSavedIdx(null), 3000);
  }

  async function saveFullConfig(cfg: ProductDesignConfig) {
    setSavingAll(true);
    await fetch(`/api/admin/builder-options/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    setSavingAll(false);
  }

  function deleteSection(si: number) {
    if (!config) return;
    const section = config.sections[si];
    if (!confirm(`Delete section "${section.label}"? This removes all its fields and options.`)) return;
    const next = { ...config, sections: config.sections.filter((_, idx) => idx !== si) };
    setConfig(next);
    saveFullConfig(next);
  }

  function addSection() {
    if (!addSectionForm || !config) return;
    const id = addSectionForm.id.trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").toLowerCase() || `section-${Date.now()}`;
    const label = addSectionForm.label.trim() || "New Section";
    const newSection = { id, label, fields: [] };
    const next = { ...config, sections: [...config.sections, newSection] };
    setConfig(next);
    saveFullConfig(next);
    setAddSectionForm(null);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Admin</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">Builder Options</h1>
        </div>

        {/* Product tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {PRODUCTS.map((p) => (
            <button key={p.id} type="button" onClick={() => setProductId(p.id)}
              className={`font-sans rounded-full px-4 py-2 text-xs font-semibold border transition-colors ${productId === p.id ? "border-gold bg-gold text-background" : "border-border-accent text-muted-dark hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>

        {!config && <p className="font-sans text-sm text-slate">Loading…</p>}

        {config && config.sections.map((section, si) => (
          <div key={section.id} className="mb-8 rounded-2xl border border-border-accent bg-surface-strong overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-accent">
              <div>
                <p className="font-display text-lg font-semibold text-foreground">{section.label}</p>
                <p className="font-sans text-xs text-slate mt-0.5">{section.fields.length} fields · {section.fields.reduce((s, f) => s + f.options.length, 0)} options</p>
              </div>
              <div className="flex items-center gap-3">
                {savedIdx === si && <span className="font-sans text-xs text-emerald-400">Saved ✓</span>}
                <button type="button" onClick={() => deleteSection(si)}
                  className="rounded-lg border border-[#EF4444]/30 px-3 py-1.5 font-sans text-xs text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">
                  Delete
                </button>
                <button type="button" onClick={() => saveSection(si)} disabled={saving === si}
                  className="rounded-lg bg-gold px-4 py-1.5 font-sans text-xs font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40">
                  {saving === si ? "Saving…" : "Save Section"}
                </button>
              </div>
            </div>

            <div className="p-4">
              {section.fields.map((field, fi) => (
                <FieldCard key={field.id} field={field}
                  sectionIdx={si} fieldIdx={fi}
                  onFieldChange={updateField}
                  onOptionChange={updateOption}
                  onOptionDelete={deleteOption}
                  onAddOption={addOption}
                  onImageUpload={uploadImage}
                  onDeleteField={deleteField}
                />
              ))}
              <button type="button" onClick={() => addField(si)}
                className="mt-2 w-full rounded-xl border border-dashed border-border-accent hover:border-gold/40 px-4 py-3 font-sans text-xs text-muted-dark hover:text-gold transition-colors">
                + Add field to this section
              </button>
            </div>
          </div>
        ))}
        {/* Add Section */}
        {config && (
          <div className="mb-8">
            {addSectionForm ? (
              <div className="rounded-2xl border border-gold/30 bg-surface-strong p-6">
                <p className="font-sans text-sm font-semibold text-foreground mb-4">New Section</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="font-sans text-[10px] text-slate mb-1">Section ID (slug)</p>
                    <input
                      className="w-full rounded-md border border-border-accent bg-surface-deep px-2 py-1.5 font-sans text-xs text-foreground outline-none focus:border-gold transition-colors"
                      placeholder="e.g. construction"
                      value={addSectionForm.id}
                      onChange={(e) => setAddSectionForm((f) => f ? { ...f, id: e.target.value } : f)}
                    />
                  </div>
                  <div>
                    <p className="font-sans text-[10px] text-slate mb-1">Section Label</p>
                    <input
                      className="w-full rounded-md border border-border-accent bg-surface-deep px-2 py-1.5 font-sans text-xs text-foreground outline-none focus:border-gold transition-colors"
                      placeholder="e.g. Construction"
                      value={addSectionForm.label}
                      onChange={(e) => setAddSectionForm((f) => f ? { ...f, label: e.target.value } : f)}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={addSection} disabled={savingAll}
                    className="rounded-lg bg-gold px-5 py-2 font-sans text-xs font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40">
                    {savingAll ? "Saving…" : "Add Section"}
                  </button>
                  <button type="button" onClick={() => setAddSectionForm(null)}
                    className="rounded-lg border border-border-accent px-5 py-2 font-sans text-xs text-muted-dark hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setAddSectionForm({ id: "", label: "" })}
                className="w-full rounded-2xl border border-dashed border-border-accent hover:border-gold/40 px-6 py-5 font-sans text-sm text-muted-dark hover:text-gold transition-colors">
                + Add Section
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
