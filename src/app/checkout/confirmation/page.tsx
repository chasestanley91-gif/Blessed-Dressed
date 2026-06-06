import Link from "next/link";

interface Props {
  searchParams: Promise<{ order?: string; session_id?: string }>;
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const { order, session_id } = await searchParams;
  // session_id comes from Stripe; order comes from legacy direct-order flow
  const ref = order ?? session_id;

  return (
    <main className="min-h-screen bg-background pt-20 text-foreground flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Success icon */}
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
          {ref && (
            <p className="font-sans text-base text-muted-dark">
              Reference:{" "}
              <span className="font-semibold text-foreground">
                {ref.startsWith("cs_") ? ref.slice(0, 24) + "…" : ref}
              </span>
            </p>
          )}
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
