import Link from "next/link";
import Image from "next/image";
import { loadData } from "@/lib/admin-data";
import { SITE_DEFAULTS, type SiteSettings } from "@/data/site-settings";

export default function Footer() {
  const settings = loadData<SiteSettings>("site-settings", SITE_DEFAULTS);
  const f = settings.footer;

  return (
    <footer className="border-t border-gold/20 bg-surface-deep">
      {/* Scripture banner */}
      <div className="border-b border-gold/15 bg-background py-8 text-center">
        <p className="font-display mx-auto max-w-2xl px-6 text-base italic leading-relaxed text-[#C9C1B3]">
          &ldquo;{f.scripture}&rdquo;
        </p>
        <p className="font-sans mt-2 text-xs uppercase tracking-[0.3em] text-gold">
          {f.scriptureRef}
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-80">
              <Image src="/logo.png" alt="Blessed & Dressed" width={52} height={52} className="rounded-full" />
            </Link>
            <p className="font-sans max-w-xs text-sm leading-7 text-[#8A8070]">{f.tagline}</p>
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">{f.values}</p>
          </div>

          {/* Col 1 */}
          <div>
            <h4 className="font-sans mb-5 text-xs uppercase tracking-[0.3em] text-gold">{f.col1Title}</h4>
            <ul className="space-y-3">
              {f.col1Links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-sans text-sm text-[#8A8070] transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-sans mb-5 text-xs uppercase tracking-[0.3em] text-gold">{f.col2Title}</h4>
            <ul className="space-y-3">
              {f.col2Links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-sans text-sm text-[#8A8070] transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center gap-3 border-t border-[#1A2E48] pt-8 sm:flex-row sm:justify-between">
          <p className="font-sans text-xs text-[#4A5568]">
            &copy; {new Date().getFullYear()} {f.copyright}
          </p>
          <p className="font-sans text-xs text-[#4A5568]">Christian Bespoke Suiting · EST. 2024</p>
        </div>
      </div>
    </footer>
  );
}
