import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { loadDataAsync } from "@/lib/admin-data";
import { readyToWear, type Product } from "@/data/products";
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
  return {
    title: product ? `${product.name} | Blessed & Dressed` : "Product | Blessed & Dressed",
    description: product?.subtitle ?? "Luxury product details for Blessed & Dressed.",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  noStore();
  const { id } = await params;
  const products = await loadDataAsync<Product[]>("products", readyToWear);
  const product = products.find((item) => item.id === id);
  const settings = await loadDataAsync<SiteSettings>("site-settings", SITE_DEFAULTS);
  const detailPage = settings.pages?.productDetail ?? {
    careInstructions: "Dry clean only. Store hanging in a breathable garment bag. Avoid direct sunlight.",
    guaranteeText: "Every garment is backed by our craftsmanship guarantee. If something isn't right, we'll make it right.",
  };

  // A missing product is a 404, not a 200 that happens to say "not found".
  // The soft version told the customer the truth but told Google the page was
  // real, so dead product URLs stayed indexed and kept accruing crawl budget.
  // notFound() renders src/app/not-found.tsx with a genuine 404 status.
  if (!product) notFound();

  const totalStock = product.stockBySize.reduce((s, x) => s + x.stock, 0);
  const allImages = product.images?.length ? product.images : [product.image];

  return (
    <main className="min-h-screen bg-background pt-20 text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-12">

        {/* Breadcrumb */}
        <nav className="font-sans mb-8 flex items-center gap-2 text-xs text-muted-dark">
          <Link href="/" className="hover:text-gold transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gold transition-colors">Ready-to-Wear</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Image gallery */}
          <ProductGallery images={allImages} alt={product.name} />

          {/* Details */}
          <div className="space-y-6 rounded-[2rem] border border-border-accent bg-surface-strong p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">{product.tag}</p>
              <h1 className="font-display mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-4xl">
                {product.name}
              </h1>
              <p className="font-sans mt-4 text-sm leading-[1.7] text-muted-dark">{product.subtitle}</p>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border-accent pt-6">
              <span className="font-display text-3xl font-semibold text-foreground">
                ${product.price.toLocaleString()}
              </span>
              <AddToCartButton
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image}
                type="rtw"
              />
            </div>

            {/* Stock status */}
            <SizeAccordion stockBySize={product.stockBySize} totalStock={totalStock} />

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
