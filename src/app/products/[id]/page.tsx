import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { loadDataAsync } from "@/lib/admin-data";
import { readyToWear, type Product } from "@/data/products";
import { accessories, type Accessory } from "@/data/accessories";
import { SITE_DEFAULTS, type SiteSettings } from "@/data/site-settings";
import AddToCartButton from "@/components/AddToCartButton";
import ProductGallery from "@/components/ProductGallery";
import SizeAccordion from "@/components/SizeAccordion";

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const products = await loadDataAsync<Product[]>("products", readyToWear);
  const product = products.find((item) => item.id === id);
  if (product) {
    return { title: `${product.name} | Blessed & Dressed`, description: product.subtitle ?? "Luxury product details for Blessed & Dressed." };
  }
  const accessoryItems = await loadDataAsync<Accessory[]>("accessories", accessories);
  const accessory = accessoryItems.find((item) => item.id === id);
  return {
    title: accessory ? `${accessory.name} | Blessed & Dressed` : "Product | Blessed & Dressed",
    description: accessory ? `${accessory.name} — a finishing piece for the well-dressed gentleman.` : "Luxury product details for Blessed & Dressed.",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  noStore();
  const { id } = await params;
  const products = await loadDataAsync<Product[]>("products", readyToWear);
  const product = products.find((item) => item.id === id);
  // Accessories share this same detail route (linked from /accessories) but
  // are a much simpler catalog — no sizes/stock, no multi-image gallery.
  // Previously this route only ever checked `products`, so every accessory
  // link 404'd and there was no way to add one to cart at all.
  const accessoryItems = product ? [] : await loadDataAsync<Accessory[]>("accessories", accessories);
  const accessory = product ? undefined : accessoryItems.find((item) => item.id === id);
  const settings = await loadDataAsync<SiteSettings>("site-settings", SITE_DEFAULTS);
  const detailPage = settings.pages?.productDetail ?? {
    careInstructions: "Dry clean only. Store hanging in a breathable garment bag. Avoid direct sunlight.",
    guaranteeText: "Every garment is backed by our craftsmanship guarantee. If something isn't right, we'll make it right.",
  };

  // A missing product/accessory is a 404, not a 200 that happens to say "not
  // found". The soft version told the customer the truth but told Google the
  // page was real, so dead URLs stayed indexed and kept accruing crawl budget.
  // notFound() renders src/app/not-found.tsx with a genuine 404 status.
  if (!product && !accessory) notFound();

  if (accessory) {
    return (
      <main className="min-h-screen bg-background pt-20 text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-12">
          <nav className="font-sans mb-8 flex items-center gap-2 text-xs text-muted-dark">
            <Link href="/" className="hover:text-gold transition-colors">Home</Link>
            <span>/</span>
            <Link href="/accessories" className="hover:text-gold transition-colors">Accessories</Link>
            <span>/</span>
            <span className="text-foreground">{accessory.name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <ProductGallery images={[accessory.image]} alt={accessory.name} />

            <div className="space-y-6 rounded-[2rem] border border-border-accent bg-surface-strong p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Accessory</p>
                <h1 className="font-display mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-4xl">
                  {accessory.name}
                </h1>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border-accent pt-6">
                <span className="font-display text-3xl font-semibold text-foreground">
                  ${accessory.price.toLocaleString()}
                </span>
                <AddToCartButton
                  id={accessory.id}
                  name={accessory.name}
                  price={accessory.price}
                  image={accessory.image}
                  type="accessory"
                />
              </div>

              <div className="rounded-2xl border border-border-accent bg-background p-5">
                <p className="font-sans text-xs uppercase tracking-[0.25em] text-muted-dark mb-2">Care Instructions</p>
                <p className="font-sans text-sm leading-[1.7] text-muted-dark">{detailPage.careInstructions}</p>
              </div>

              <div className="rounded-2xl border border-border-accent bg-background p-5">
                <p className="font-sans text-xs uppercase tracking-[0.25em] text-muted-dark mb-2">Our Guarantee</p>
                <p className="font-sans text-sm leading-[1.7] text-muted-dark">{detailPage.guaranteeText}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // `notFound()` above (typed `never`) rules out the `!product && !accessory`
  // case, and the `accessory` branch just returned — so `product` is defined.
  const p = product!;
  const totalStock = p.stockBySize.reduce((s, x) => s + x.stock, 0);
  const allImages = p.images?.length ? p.images : [p.image];

  return (
    <main className="min-h-screen bg-background pt-20 text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-12">

        {/* Breadcrumb */}
        <nav className="font-sans mb-8 flex items-center gap-2 text-xs text-muted-dark">
          <Link href="/" className="hover:text-gold transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gold transition-colors">Ready-to-Wear</Link>
          <span>/</span>
          <span className="text-foreground">{p.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Image gallery */}
          <ProductGallery images={allImages} alt={p.name} />

          {/* Details */}
          <div className="space-y-6 rounded-[2rem] border border-border-accent bg-surface-strong p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">{p.tag}</p>
              <h1 className="font-display mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-4xl">
                {p.name}
              </h1>
              <p className="font-sans mt-4 text-sm leading-[1.7] text-muted-dark">{p.subtitle}</p>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border-accent pt-6">
              <span className="font-display text-3xl font-semibold text-foreground">
                ${p.price.toLocaleString()}
              </span>
              <AddToCartButton
                id={p.id}
                name={p.name}
                price={p.price}
                image={p.image}
                type="rtw"
              />
            </div>

            {/* Stock status */}
            <SizeAccordion stockBySize={p.stockBySize} totalStock={totalStock} />

            {/* Bespoke upsell */}
            <div className="rounded-2xl border border-gold/25 bg-gold/5 p-5">
              <p className="font-sans text-xs uppercase tracking-[0.25em] text-gold">Want it bespoke?</p>
              <p className="font-sans mt-2 text-sm leading-[1.7] text-muted-dark">
                This style is available in our builder — tailored to your exact measurements.
              </p>
              <Link
                href="/builder/shirt"
                className="font-sans mt-4 inline-flex items-center gap-1.5 text-xs text-gold hover:opacity-80 transition-opacity"
              >
                Design your own →
              </Link>
            </div>

            {/* Care Instructions */}
            <div className="rounded-2xl border border-border-accent bg-background p-5">
              <p className="font-sans text-xs uppercase tracking-[0.25em] text-muted-dark mb-2">Care Instructions</p>
              <p className="font-sans text-sm leading-[1.7] text-muted-dark">{detailPage.careInstructions}</p>
            </div>

            {/* Guarantee */}
            <div className="rounded-2xl border border-border-accent bg-background p-5">
              <p className="font-sans text-xs uppercase tracking-[0.25em] text-muted-dark mb-2">Our Guarantee</p>
              <p className="font-sans text-sm leading-[1.7] text-muted-dark">{detailPage.guaranteeText}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
