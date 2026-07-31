import Link from "next/link";

/**
 * The app had no not-found boundary at all, so an unknown URL fell through to a
 * soft 200 with an empty shell — indistinguishable from a real page to a
 * customer, and indexable by a crawler.
 *
 * There is deliberately no `noindex` markup here. A `metadata` export from
 * not-found.tsx is not applied when the 404 is raised by `notFound()`, and an
 * inline `<meta>` does not reach `<head>` either, because the root layout
 * renders an explicit `<head>` element which suppresses React 19 tag hoisting.
 * Both were tried and verified absent from the document.
 *
 * It is not needed: the 404 STATUS is the authoritative signal to a crawler, and
 * tests/e2e/seo-and-404.spec.ts asserts that status on every route family that
 * can miss.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">

      <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
        404
      </p>
      <h1 className="mt-6 font-serif text-4xl font-light text-foreground sm:text-5xl">
        We couldn&rsquo;t find that page
      </h1>
      <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-muted">
        The page may have moved, or the link may be out of date. Everything we make is
        still here.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-lg bg-gold px-6 py-3 font-sans text-sm font-semibold uppercase tracking-widest text-background transition-[background,transform] duration-150 hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-[0.98]"
        >
          Return home
        </Link>
        <Link
          href="/builder"
          className="rounded-lg border border-gold/40 px-6 py-3 font-sans text-sm font-semibold uppercase tracking-widest text-foreground transition-[border-color,color] duration-150 hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Design a garment
        </Link>
      </div>
    </div>
  );
}
