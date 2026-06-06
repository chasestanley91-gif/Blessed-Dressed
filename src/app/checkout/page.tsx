"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
};

const inputCls =
  "font-sans w-full rounded-xl border border-[#31425B] bg-background px-4 py-3 text-sm text-foreground placeholder-[#6A7A8C] transition-[border-color] focus:border-gold focus:outline-none";

const labelCls = "font-sans block text-xs uppercase tracking-[0.2em] text-muted-dark mb-1.5";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background pt-20 text-foreground px-6 py-16 lg:px-16">
        <div className="mx-auto max-w-xl text-center space-y-6">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Checkout</p>
          <h1 className="font-display text-4xl font-semibold">Nothing to checkout.</h1>
          <Link
            href="/"
            className="font-sans inline-block rounded-full border border-gold/60 px-7 py-3 text-sm font-semibold text-foreground hover:border-gold transition-colors"
          >
            Return to shop
          </Link>
        </div>
      </main>
    );
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.address || !form.city) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      // Create a Stripe Checkout Session and redirect the customer to Stripe.
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            name: item.name,
            price: item.price,
            qty: item.qty,
            image: item.image,
            type: item.type,
          })),
          customerInfo: form,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Order failed");
      }

      const { url } = await res.json() as { url: string };
      if (url) {
        // Redirect to Stripe-hosted checkout page
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned from server.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg.includes("not configured")
        ? "Payments are not yet configured. Please contact us to complete your order."
        : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background pt-20 text-foreground px-6 py-12 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Checkout</p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">Complete your order.</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left — contact + delivery */}
            <div className="space-y-6">
              {/* Contact */}
              <section className="rounded-[1.5rem] border border-border-accent bg-surface-strong p-6 space-y-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Contact</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>First name *</label>
                    <input className={inputCls} placeholder="Marcus" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>Last name *</label>
                    <input className={inputCls} placeholder="Whitfield" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email address *</label>
                  <input className={inputCls} type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
              </section>

              {/* Delivery */}
              <section className="rounded-[1.5rem] border border-border-accent bg-surface-strong p-6 space-y-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Delivery Address</p>
                <div>
                  <label className={labelCls}>Street address *</label>
                  <input className={inputCls} placeholder="123 Savile Row" value={form.address} onChange={(e) => set("address", e.target.value)} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>City *</label>
                    <input className={inputCls} placeholder="London" value={form.city} onChange={(e) => set("city", e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <input className={inputCls} placeholder="United Kingdom" value={form.country} onChange={(e) => set("country", e.target.value)} />
                  </div>
                </div>
              </section>

              {/* Payment note */}
              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-5">
                <p className="font-sans text-xs uppercase tracking-[0.25em] text-gold">Secure Payment</p>
                <p className="font-sans mt-2 text-sm leading-[1.7] text-muted-dark">
                  You&rsquo;ll be redirected to our secure Stripe checkout to complete payment. All major cards accepted.
                </p>
              </div>
            </div>

            {/* Right — order summary */}
            <aside className="h-fit rounded-[1.5rem] border border-border-accent bg-surface-strong p-6 space-y-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Order Summary</p>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.cartId} className="flex items-start gap-3">
                    {item.image ? (
                      <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-background">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-14 w-12 shrink-0 items-center justify-center rounded-lg bg-background">
                        <span className="font-sans text-[9px] text-muted-dark">B</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-medium text-foreground truncate">{item.name}</p>
                      {item.config && (
                        <p className="font-sans text-xs text-muted-dark">{item.config.fabricLabel}</p>
                      )}
                      {item.qty > 1 && (
                        <p className="font-sans text-xs text-muted-dark">×{item.qty}</p>
                      )}
                    </div>
                    <span className="font-sans text-sm shrink-0 text-foreground">
                      ${(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-accent pt-4 flex justify-between">
                <span className="font-display text-base font-semibold">Total</span>
                <span className="font-display text-xl font-semibold text-gold">${subtotal.toLocaleString()}</span>
              </div>

              {error && (
                <p className="font-sans text-sm text-[#EF4444] bg-[#5A1A1A]/20 border border-[#EF4444]/30 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="font-sans w-full rounded-full bg-gold py-3.5 text-sm font-semibold text-background shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Redirecting to payment…" : "Proceed to Payment"}
              </button>

              <Link
                href="/cart"
                className="font-sans block text-center text-sm text-muted-dark underline-offset-2 hover:text-gold hover:underline transition-colors"
              >
                ← Back to cart
              </Link>
            </aside>
          </div>
        </form>
      </div>
    </main>
  );
}
