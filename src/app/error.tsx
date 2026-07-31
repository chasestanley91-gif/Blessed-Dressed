"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * The app had no error boundary, so any thrown render error produced Next's
 * default stack-trace screen — which leaks file paths and component names to a
 * customer in production.
 *
 * This boundary shows the customer something useful and keeps the digest, which
 * is the only handle that ties a report ("it said DG-3f2a") back to a server
 * log line. The raw message is deliberately not rendered.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[render error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
        Something went wrong
      </p>
      <h1 className="mt-6 font-serif text-4xl font-light text-foreground sm:text-5xl">
        This page didn&rsquo;t load
      </h1>
      <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-muted">
        The fault is on our side, not yours. Nothing you were working on has been
        charged or submitted.
      </p>
      {error.digest && (
        <p className="mt-3 font-sans text-xs tracking-wide text-muted-dark">
          Reference <span className="text-gold">{error.digest}</span> — quote this if you
          contact us.
        </p>
      )}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-gold px-6 py-3 font-sans text-sm font-semibold uppercase tracking-widest text-background transition-[background,transform] duration-150 hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-[0.98]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gold/40 px-6 py-3 font-sans text-sm font-semibold uppercase tracking-widest text-foreground transition-[border-color,color] duration-150 hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
