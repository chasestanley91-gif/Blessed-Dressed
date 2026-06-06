"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import type { SiteSettings } from "@/data/site-settings";

type NavSettings = SiteSettings["nav"];

export default function Nav({ nav }: { nav: NavSettings }) {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gold/20 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80 active:opacity-60">
          <Image src="/logo.png" alt={nav.logoText} width={44} height={44} className="rounded-full" priority />
          <span className="font-sans hidden text-sm font-semibold uppercase tracking-[0.25em] text-foreground sm:block">
            {nav.logoText}
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 md:flex">
          {nav.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-sans relative text-sm font-medium tracking-wide text-[#C9C1B3] transition-colors duration-200 hover:text-gold focus-visible:outline-none focus-visible:text-gold after:absolute after:bottom-[-3px] after:left-0 after:h-px after:w-0 after:bg-gold after:transition-[width] after:duration-300 hover:after:w-full"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link
            href={nav.ctaLink}
            className="font-sans hidden rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-background shadow-[0_2px_16px_rgba(212,175,55,0.25)] transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(212,175,55,0.4)] active:translate-y-0 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
          >
            {nav.ctaText}
          </Link>

          {/* Cart icon */}
          <Link
            href="/cart"
            aria-label={`Cart (${totalItems} items)`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#31425B] transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9C1B3]" aria-hidden="true">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-background">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>

          {/* Hamburger */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-[#31425B] transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:opacity-70 md:hidden"
          >
            <span className={`h-px w-5 bg-foreground transition-transform duration-200 ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-px w-5 bg-foreground transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`h-px w-5 bg-foreground transition-transform duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="border-t border-[#31425B] bg-background/95 px-6 pb-6 pt-4 md:hidden">
          <ul className="space-y-4">
            {nav.links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-sans block text-base font-medium text-[#C9C1B3] transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={nav.ctaLink}
                onClick={() => setOpen(false)}
                className="font-sans mt-2 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-background active:opacity-80"
              >
                {nav.ctaText}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
