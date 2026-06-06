"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      window.location.href = "/admin";
    } else {
      setError("Incorrect password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-deep flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gold">Blessed & Dressed</p>
          <h1 className="font-display mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">Admin Portal</h1>
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-border-accent bg-background p-7 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <label className="block font-sans text-xs uppercase tracking-[0.25em] text-muted-dark mb-2">
            Password
          </label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-border-accent bg-surface-strong px-4 py-3 font-sans text-sm text-foreground outline-none focus:border-gold transition-colors placeholder:text-dim"
            placeholder="Enter admin password"
          />
          {error && (
            <p className="mt-2 font-sans text-xs text-[#EF4444]">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !pw}
            className="mt-5 w-full rounded-xl bg-gold px-4 py-3 font-sans text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Signing in…" : "Enter Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
