"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background pt-20 text-foreground px-6 py-16 lg:px-16">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Shopping Cart</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Your cart is empty.</h1>
          <p className="font-sans text-muted-dark">Start with a bespoke order or browse ready-to-wear.</p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/builder"
              className="font-sans rounded-full bg-gold px-7 py-3 text-sm font-semibold text-background shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition-[opacity,transform] hover:opacity-90 active:scale-95"
            >
              Begin Your Design
            </Link>
            <Link
              href="/"
              className="font-sans rounded-full border border-gold/60 px-7 py-3 text-sm font-semibold text-foreground transition-[border-color,opacity] hover:border-gold active:opacity-70"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20 text-foreground px-6 py-12 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Shopping Cart</p>
            <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">Your atelier cart.</h1>
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="font-sans text-xs text-muted-dark underline-offset-2 hover:text-gold hover:underline transition-colors"
          >
            Clear cart
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.cartId}
                className="flex gap-5 rounded-[1.5rem] border border-border-accent bg-surface-strong p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
              >
                {/* Thumbnail */}
                {item.image ? (
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-background">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-xl bg-background">
                    <span className="font-sans text-xs text-muted-dark">Bespoke</span>
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold">
                        {item.type === "bespoke" ? "Bespoke" : item.type === "accessory" ? "Accessory" : "Ready-to-Wear"}
                      </p>
                      <h3 className="font-display mt-0.5 text-lg font-semibold text-foreground leading-tight">
                        {item.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.cartId)}
                      aria-label="Remove item"
                      className="shrink-0 text-muted-dark hover:text-[#EF4444] transition-colors focus-visible:outline-none"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {item.config && (
                    <p className="font-sans text-xs text-muted-dark">
                      {item.config.fabricLabel}
                      {item.config.measureMode === "standard" && item.config.standardSize
                        ? ` · Size ${item.config.standardSize}`
                        : " · Custom measurements"}
                    </p>
                  )}
                  {item.size && (
                    <p className="font-sans text-xs text-muted-dark">Size: {item.size}</p>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    {item.type === "bespoke" ? (
                      <span className="font-sans text-xs text-muted-dark">Qty: 1</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQty(item.cartId, item.qty - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#31425B] text-muted-dark hover:border-gold hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                        >
                          −
                        </button>
                        <span className="font-sans w-5 text-center text-sm text-foreground">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.cartId, item.qty + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#31425B] text-muted-dark hover:border-gold hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                        >
                          +
                        </button>
                      </div>
                    )}
                    <span className="font-display text-lg font-semibold text-foreground">
                      ${(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Summary */}
          <aside className="h-fit rounded-[1.5rem] border border-border-accent bg-surface-strong p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-5">
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Order Summary</p>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.cartId} className="flex justify-between text-sm">
                  <span className="font-sans text-muted-dark truncate max-w-[160px]">
                    {item.name} {item.qty > 1 ? `×${item.qty}` : ""}
                  </span>
                  <span className="font-sans text-foreground shrink-0">${(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border-accent pt-4 flex justify-between">
              <span className="font-display text-base font-semibold text-foreground">Subtotal</span>
              <span className="font-display text-xl font-semibold text-gold">${subtotal.toLocaleString()}</span>
            </div>

            <p className="font-sans text-xs text-muted-dark">Shipping and taxes calculated at checkout.</p>

            <Link
              href="/checkout"
              className="font-sans block w-full rounded-full bg-gold py-3.5 text-center text-sm font-semibold text-background shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/"
              className="font-sans block text-center text-sm text-muted-dark underline-offset-2 hover:text-gold hover:underline transition-colors"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
