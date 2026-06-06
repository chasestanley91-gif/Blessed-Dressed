import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { loadData, loadDataAsync } from "@/lib/admin-data";
import { readyToWear, type Product } from "@/data/products";
import { accessories, type Accessory } from "@/data/accessories";
import { orders, type Order } from "@/data/orders";
import { builderProducts } from "@/data/builder";
import type { ConsultationRequest } from "@/app/api/consultation/route";

const STATUS_COLORS: Record<string, string> = {
  Pending:         "badge-pending",
  "In Production": "badge-production",
  Shipped:         "badge-shipped",
  Delivered:       "badge-delivered",
  Cancelled:       "badge-cancelled",
};

export default async function AdminPage() {
  const liveConsultations = await loadDataAsync<ConsultationRequest[]>("consultations", []);
  const newConsultations = liveConsultations.filter((c) => c.status === "New").length;

  const liveProducts = loadData<Product[]>("products", readyToWear);
  const liveAccessories = loadData<Accessory[]>("accessories", accessories);
  const liveOrders = loadData<Order[]>("orders", orders);

  const totalRevenue = liveOrders
    .filter((o) => o.status !== "Cancelled")
    .reduce((s, o) => s + o.total, 0);

  const lowStockProducts = liveProducts.filter((p) =>
    p.stockBySize.some((s) => s.stock <= 2)
  );

  const pendingOrders = liveOrders.filter(
    (o) => o.status === "Pending" || o.status === "In Production"
  ).length;

  const recentOrders = liveOrders.slice(0, 5);
  void liveAccessories;

  return (
    <main className="min-h-screen bg-background pt-20 text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">Atelier Admin</p>
            <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
              Operations dashboard.
            </h1>
          </div>
          <LogoutButton />
        </div>

        {/* KPI cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Total Products", value: liveProducts.length + liveAccessories.length + builderProducts.length, sub: `${builderProducts.length} bespoke · ${liveProducts.length} RTW · ${liveAccessories.length} accessories`, href: null },
            { label: "Active Orders", value: pendingOrders, sub: "Pending or in production", href: null },
            { label: "Revenue (all time)", value: `$${totalRevenue.toLocaleString()}`, sub: "Excl. cancelled orders", href: null },
            { label: "Low Stock Alerts", value: lowStockProducts.length, sub: "RTW items needing restock", href: null },
            { label: "New Consultations", value: newConsultations, sub: "Awaiting contact", href: "/admin/consultations" },
          ].map((kpi) => {
            const card = (
              <div
                key={kpi.label}
                className={`rounded-[1.5rem] border border-border-accent bg-surface-strong p-6 shadow-[0_4px_20px_rgba(0,0,0,0.35)] ${kpi.href ? "transition-[border-color] hover:border-gold/50" : ""}`}
              >
                <p className="font-sans text-xs uppercase tracking-[0.25em] text-muted-dark">{kpi.label}</p>
                <p className="font-display mt-2 text-4xl font-semibold text-foreground">{kpi.value}</p>
                <p className="font-sans mt-1 text-xs text-muted-dark">{kpi.sub}</p>
              </div>
            );
            return kpi.href ? <Link key={kpi.label} href={kpi.href}>{card}</Link> : card;
          })}
        </div>

        {/* Nav links */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Products", href: "/admin/products", desc: "Manage RTW catalog" },
            { label: "Accessories", href: "/admin/accessories", desc: "Add & edit accessories" },
            { label: "Inventory", href: "/admin/inventory", desc: "Track stock levels" },
            { label: "Orders", href: "/admin/orders", desc: "Fulfillment & status" },
            { label: "Collections", href: "/admin/collections", desc: "Seasonal curation" },
            { label: "Builder Options", href: "/admin/builder-options", desc: "Edit every design option" },
            { label: "Fabrics", href: "/admin/fabrics", desc: "Manage fabric catalog" },
            { label: "Content", href: "/admin/customize", desc: "Edit site copy & nav" },
            { label: "Theme", href: "/admin/theme", desc: "Colors & brand style" },
            { label: "Consultations", href: "/admin/consultations", desc: "Manage consultation requests" },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-[1.5rem] border border-border-accent bg-surface-strong p-6 transition-[border-color,background] duration-200 hover:border-gold/50 hover:bg-[#122742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">{card.label}</p>
              <p className="font-display mt-2 text-xl font-semibold text-foreground group-hover:text-gold transition-colors duration-200">{card.desc}</p>
              <span className="font-sans mt-4 inline-flex items-center gap-1.5 text-xs text-muted-dark group-hover:text-gold transition-colors duration-200">
                Manage
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        {/* Two-column lower section */}
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">

          {/* Recent orders table */}
          <div className="rounded-[1.5rem] border border-border-accent bg-surface-strong overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between px-8 py-6 border-b border-border-accent">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Recent Orders</p>
                <h2 className="font-display mt-1 text-lg font-semibold text-foreground">Last 5 orders</h2>
              </div>
              <Link
                href="/admin/orders"
                className="font-sans text-xs text-muted-dark hover:text-gold transition-colors duration-150"
              >
                View all →
              </Link>
            </div>
            <div className="divide-y divide-border-accent">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 px-8 py-4">
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-semibold text-foreground truncate">{order.customer}</p>
                    <p className="font-sans text-xs text-muted-dark mt-0.5">{order.id} · {order.date}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`font-sans rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                    <span className="font-sans text-sm font-semibold text-foreground">
                      ${order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          <div className="rounded-[1.5rem] border border-border-accent bg-surface-strong overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="px-7 py-6 border-b border-border-accent">
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Inventory Alerts</p>
              <h2 className="font-display mt-1 text-lg font-semibold text-foreground">Low stock</h2>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="px-7 py-8 text-center">
                <p className="font-sans text-sm text-muted-dark">All stock levels healthy.</p>
              </div>
            ) : (
              <div className="divide-y divide-border-accent">
                {lowStockProducts.map((product) => {
                  const seen = new Set<string>();
                  return product.stockBySize
                    .filter((s) => s.stock <= 2)
                    .filter((s) => { const k = s.size; if (seen.has(k)) return false; seen.add(k); return true; })
                    .map((s) => (
                      <div key={`${product.id}-${s.size}`} className="flex items-center justify-between gap-3 px-7 py-4">
                        <div className="min-w-0">
                          <p className="font-sans text-sm text-foreground truncate">{product.name}</p>
                          <p className="font-sans text-xs text-muted-dark">Size {s.size}</p>
                        </div>
                        <span
                          className={`font-sans shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            s.stock === 0
                              ? "bg-[#5A1A1A]/25 text-[#EF4444] border border-[#EF4444]/30"
                              : "bg-[#5C3D0A]/25 text-[#F59E0B] border border-[#F59E0B]/30"
                          }`}
                        >
                          {s.stock === 0 ? "Out of stock" : `${s.stock} left`}
                        </span>
                      </div>
                    ))
                })}

              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
