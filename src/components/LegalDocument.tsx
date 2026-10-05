import Link from "next/link";
import { LEGAL_DOCS, type LegalDoc } from "@/data/legal";

export default function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <main className="min-h-dvh bg-surface-deep px-6 pb-24 pt-24 lg:px-16">
      <article className="mx-auto max-w-2xl">
        <p className="mb-4 font-sans text-[0.58rem] uppercase tracking-[0.3em] text-gold">
          Blessed &amp; Dressed
        </p>
        <h1 className="text-balance font-display text-4xl font-light leading-[1.08] text-foreground md:text-5xl">
          {doc.title}
        </h1>
        <p className="mt-3 font-sans text-xs uppercase tracking-[0.16em] text-muted-dark">
          Last updated {doc.updated}
        </p>
        <p className="mt-8 text-pretty font-sans text-sm leading-[1.9] text-muted-dark">{doc.intro}</p>

        <nav aria-label="Other policies" className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-y border-border-accent py-4">
          {LEGAL_DOCS.map((other) => (
            <Link
              key={other.slug}
              href={`/${other.slug}`}
              className={`font-sans text-xs uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                other.slug === doc.slug ? "text-gold" : "text-muted-dark hover:text-foreground"
              }`}
              aria-current={other.slug === doc.slug ? "page" : undefined}
            >
              {other.title}
            </Link>
          ))}
        </nav>

        <div className="mt-10 space-y-10">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-balance font-display text-2xl font-light text-foreground">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p key={`${section.heading}-${i}`} className="mt-3 text-pretty font-sans text-sm leading-[1.9] text-muted-dark">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-14 font-sans text-sm text-muted-dark">
          Questions?{" "}
          <Link href="/consultation" className="text-gold underline-offset-4 hover:underline">
            Book a consultation
          </Link>
          {" "}or email{" "}
          <a href="mailto:chasestanley91@gmail.com" className="text-gold underline-offset-4 hover:underline">
            chasestanley91@gmail.com
          </a>
          .
        </p>
      </article>
    </main>
  );
}
