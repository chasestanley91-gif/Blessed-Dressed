import Link from "next/link";
import { stripe } from "@/lib/stripe";
import ClearCartOnMount from "@/components/ClearCartOnMount";

interface Props {
  searchParams: Promise<{ order?: string; session_id?: string }>;
}

type VerificationResult =
  | { status: "verified"; ref: string }
  | { status: "unverified"; ref: string | null; reason: string };

/**
 * Verify a real Stripe Checkout Session rather than trusting the query
 * string. Bug found during the BD-JOURNEY-001 audit: this page used to show
 * "Payment Confirmed" unconditionally, including a bare visit with no
 * session_id at all — a customer could bookmark or share this URL and see a
 * false success state, and returning to it after a real payment risked a
 * duplicate order since the cart was never cleared either.
 *
 * `order` is a legacy direct-order reference (pre-Stripe flow); nothing in
 * the current app generates it (confirmed: no redirect anywhere sets
 * `?order=`), so it can never be verified here and is treated the same as
 * "no reference" rather than trusted at face value.
 */
async function verify(sessionId: string | undefined, order: string | undefined): Promise<VerificationResult> {
  if (!sessionId) {
    return { status: "unverified", ref: order ?? null, reason: order ? "legacy reference, not verifiable" : "no order reference in the URL" };
  }
  if (!stripe) {
    return { status: "unverified", ref: sessionId, reason: "payment system is not configured in this environment" };
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      return { status: "verified", ref: sessionId };
    }
    return { status: "unverified", ref: sessionId, reason: `payment status is "${session.payment_status}", not paid` };
  } catch (err) {
    console.error("Confirmation page: could not retrieve Stripe session", sessionId, err);
    return { status: "unverified", ref: sessionId, reason: "could not find or verify that session" };
  }
}

function formatRef(ref: string) {
  return ref.startsWith("cs_") ? ref.slice(0, 24) + "…" : ref;
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const { order, session_id } = await searchParams;
  const result = await verify(session_id, order);

  if (result.status === "verified") {
    return (
      <main className="min-h-screen bg-background pt-20 text-foreground flex items-center justify-center px-6 py-16">
        <ClearCartOnMount />
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/40 bg-gold/10 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div className="space-y-3">
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">Payment Confirmed</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Thank you for your order.
            </h1>
            <p className="font-sans text-base text-muted-dark">
              Reference: <span className="font-semibold text-foreground">{formatRef(result.ref)}</span>
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-gold/25 bg-surface-strong p-8 space-y-4 text-left shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <p className="font-sans text-sm leading-[1.7] text-muted-dark">
              Your payment has been processed and your order is in production. Our team will reach out within{" "}
              <span className="text-foreground">24 hours</span> to confirm production details. Bespoke garments typically take{" "}
              <span className="text-foreground">4–6 weeks</span> from confirmation to delivery.
            </p>
            <div className="border-t border-border-accent pt-4 text-center">
              <p className="font-display text-sm italic text-muted-dark">
                &ldquo;The LORD shall make thee the head, and not the tail.&rdquo;
              </p>
              <p className="font-sans mt-1 text-xs text-muted-dark">— Deuteronomy 28:13</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/builder"
              className="font-sans rounded-full bg-gold px-7 py-3 text-sm font-semibold text-background shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition-[opacity,transform] hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Design another garment
            </Link>
            <Link
              href="/"
              className="font-sans rounded-full border border-gold/60 px-7 py-3 text-sm font-semibold text-foreground transition-[border-color,opacity] hover:border-gold active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Return to homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Unverified: never claim success. The cart is deliberately left alone —
  // if a payment did go through, the customer still needs it to check out
  // again or reach support with their reference.
  return (
    <main className="min-h-screen bg-background pt-20 text-foreground flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-border-accent bg-surface-strong">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted-dark" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
        </div>

        <div className="space-y-3">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-muted-dark">Order Not Confirmed</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
            We couldn&rsquo;t confirm a payment.
          </h1>
          {result.ref && (
            <p className="font-sans text-base text-muted-dark">
              Reference: <span className="font-semibold text-foreground">{formatRef(result.ref)}</span>
            </p>
          )}
        </div>

        <div className="rounded-[1.5rem] border border-border-accent bg-surface-strong p-8 space-y-4 text-left shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <p className="font-sans text-sm leading-[1.7] text-muted-dark">
            If you just completed a payment and reached this page by mistake, no charge has been lost —
            please contact us with the reference above and we&rsquo;ll confirm it on our end. If you
            haven&rsquo;t paid yet, your cart is still saved and nothing has been charged.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/cart"
            className="font-sans rounded-full bg-gold px-7 py-3 text-sm font-semibold text-background shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition-[opacity,transform] hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Return to cart
          </Link>
          <Link
            href="/"
            className="font-sans rounded-full border border-gold/60 px-7 py-3 text-sm font-semibold text-foreground transition-[border-color,opacity] hover:border-gold active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Return to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
