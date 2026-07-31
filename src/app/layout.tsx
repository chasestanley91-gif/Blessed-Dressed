import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { loadDataAsync } from "@/lib/admin-data";
import { SITE_DEFAULTS, type SiteSettings } from "@/data/site-settings";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const THEME_DEFAULTS: Record<string, string> = {
  gold: "#d4af37", goldLight: "#B5975A", goldLighter: "#D4B478",
  background: "#071a2d", surface: "#09141e", surfaceStrong: "#0b1b2e",
  foreground: "#f5f1e6", muted: "#b1a893",
  ivory: "#FAF8F3", cream: "#F5F0E8", charcoal: "#1C1C1C",
  warmBlack: "#111010", gray: "#6B6560", borderLight: "#E2DBD0", navy: "#1A2744",
};

const KEY_TO_VAR: Record<string, string> = {
  gold: "--gold", goldLight: "--gold-light", goldLighter: "--gold-lighter",
  background: "--background", surface: "--surface", surfaceStrong: "--surface-strong",
  foreground: "--foreground", muted: "--muted",
  ivory: "--ivory", cream: "--cream", charcoal: "--charcoal",
  warmBlack: "--warm-black", gray: "--gray", borderLight: "--border-light", navy: "--navy",
};

const HEADING_FONTS: Record<string, string> = {
  "Cormorant Garamond": "Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400",
  "Playfair Display": "Playfair+Display:ital,wght@0,400;0,500;0,600;1,400",
  "EB Garamond": "EB+Garamond:ital,wght@0,400;0,500;1,400",
  "Lora": "Lora:ital,wght@0,400;0,500;0,600;1,400",
  "Libre Baskerville": "Libre+Baskerville:ital,wght@0,400;0,700;1,400",
};

const BODY_FONTS: Record<string, string> = {
  "Montserrat": "Montserrat:wght@400;500;600;700",
  "Raleway": "Raleway:wght@400;500;600;700",
  "Open Sans": "Open+Sans:wght@400;500;600;700",
  "Lato": "Lato:wght@400;700",
  "Inter": "Inter:wght@400;500;600;700",
  "Poppins": "Poppins:wght@400;500;600;700",
};

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const dynamic = 'force-dynamic';

const SITE_DESCRIPTION =
  "Luxury bespoke tailoring, ready-to-wear essentials, and premium ecommerce for modern gentlemen.";

export const metadata: Metadata = {
  // `%s` is filled by each route's own `title`; routes that set none get the
  // bare default rather than "undefined | Blessed & Dressed".
  title: { default: "Blessed & Dressed", template: "%s | Blessed & Dressed" },
  description: SITE_DESCRIPTION,
  // Was hardcoded to the Vercel preview domain, so every canonical and OG URL
  // pointed there even once a custom domain was live. Now one source of truth.
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Blessed & Dressed",
    description: SITE_DESCRIPTION,
    siteName: "Blessed & Dressed",
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Blessed & Dressed",
    description: SITE_DESCRIPTION,
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = await loadDataAsync<Record<string, string>>("theme", THEME_DEFAULTS);
  const settings = await loadDataAsync<SiteSettings>("site-settings", SITE_DEFAULTS);
  const cssVars = Object.entries(KEY_TO_VAR)
    .map(([key, cssVar]) => `${cssVar}:${theme[key] ?? THEME_DEFAULTS[key]}`)
    .join(";");

  // Build dynamic font link if fonts differ from built-in defaults
  const hFont = settings.typography.headingFont;
  const bFont = settings.typography.bodyFont;
  const fontFamilies: string[] = [];
  if (HEADING_FONTS[hFont]) fontFamilies.push(HEADING_FONTS[hFont]);
  if (BODY_FONTS[bFont] && bFont !== "Montserrat") fontFamilies.push(BODY_FONTS[bFont]);
  const fontHref =
    fontFamilies.length > 0
      ? `https://fonts.googleapis.com/css2?${fontFamilies.map((f) => `family=${f}`).join("&")}&display=swap`
      : null;

  // Override CSS font variables when custom fonts are selected
  const fontOverrides: string[] = [];
  if (hFont !== "Cormorant Garamond") {
    fontOverrides.push(`--font-playfair-display:'${hFont}',serif`);
  }
  if (bFont !== "Montserrat") {
    fontOverrides.push(`--font-montserrat:'${bFont}',sans-serif`);
  }

  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable} h-full antialiased`}>
      <head>
        <style>{`:root{${cssVars}${fontOverrides.length ? ";" + fontOverrides.join(";") : ""}}`}</style>
        {fontHref && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href={fontHref} rel="stylesheet" />
          </>
        )}
      </head>
      <body className="min-h-full bg-background text-foreground">
        <CartProvider>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-5 focus:py-2 focus:font-sans focus:text-sm focus:font-semibold focus:text-background"
          >
            Skip to content
          </a>
          <Nav nav={settings.nav} />
          {/* Deliberately a <div>, not a <main>. 21 page components open their
              own <main>, so wrapping here emitted <main><main>…</main></main> on
              every route — two landmarks, which is what
              tests/e2e/public-routes.spec.ts documents. The id is the skip-link
              target, which the app previously had no way to provide. */}
          <div id="content">{children}</div>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
