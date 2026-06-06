"use client";

import { useEffect, useState } from "react";

type OrderStatus = "Pending" | "In Production" | "Shipped" | "Delivered" | "Cancelled";
type OrderItem = { name: string; type: string; qty: number; price: number };
type Order = { id: string; customer: string; email: string; date: string; status: OrderStatus; items: OrderItem[]; total: number };

const STATUSES: OrderStatus[] = ["Pending", "In Production", "Shipped", "Delivered", "Cancelled"];
const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending:         "badge-pending",
  "In Production": "badge-production",
  Shipped:         "badge-shipped",
  Delivered:       "badge-delivered",
  Cancelled:       "badge-cancelled",
};

const FILTER_ALL = "All";

function NewOrderForm({ onSave, onCancel }: { onSave: (o: Omit<Order, "id">) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Omit<Order, "id">>({
    customer: "", email: "", date: new Date().toISOString().slice(0, 10),
    status: "Pending", items: [{ name: "", type: "Bespoke", qty: 1, price: 0 }], total: 0,
  });

  const inp = "w-full rounded-lg border border-border-accent bg-surface-deep px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-gold transition-colors";
  const lbl = "block font-sans text-[11px] uppercase tracking-[0.2em] text-muted-dark mb-1";

  function updateItem(i: number, key: keyof OrderItem, val: string | number) {
    const items = form.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it);
    const total = items.reduce((s, it) => s + it.qty * it.price, 0);
    setForm((f) => ({ ...f, items, total }));
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { name: "", type: "Bespoke", qty: 1, price: 0 }] }));
  }

  function removeItem(i: number) {
    const items = form.items.filter((_, idx) => idx !== i);
    setForm((f) => ({ ...f, items, total: items.reduce((s, it) => s + it.qty * it.price, 0) }));
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={lbl}>Customer name</label><input className={inp} value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))} required title="Customer name" /></div>
        <div><label className={lbl}>Email</label><input type="email" className={inp} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} title="Email" /></div>
        <div><label className={lbl}>Date</label><input type="date" className={inp} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} title="Order date" /></div>
        <div>
          <label className={lbl}>Status</label>
          <select className={inp} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as OrderStatus }))} title="Order status">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={lbl}>Items</label>
        <div className="space-y-2">
          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
              <input className={inp} value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} placeholder="Item name" title={`Item ${i + 1} name`} />
              <select className={inp + " w-28"} value={item.type} onChange={(e) => updateItem(i, "type", e.target.value)} title="Item type">
                {["Bespoke", "Ready-to-Wear", "Accessory"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <input type="number" min="1" className={inp + " w-16"} value={item.qty} onChange={(e) => updateItem(i, "qty", parseInt(e.target.value, 10) || 1)} title="Quantity" />
              <input type="number" min="0" className={inp + " w-24"} value={item.price} onChange={(e) => updateItem(i, "price", parseFloat(e.target.value) || 0)} title="Price" />
              {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="font-sans text-xs text-muted-dark hover:text-[#EF4444] transition-colors">×</button>}
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem} className="mt-2 font-sans text-xs text-muted-dark hover:text-gold transition-colors">+ Add item</button>
      </div>

      <p className="font-sans text-sm text-foreground">Total: <span className="font-semibold text-gold">${form.total.toLocaleString()}</span></p>

      <div className="flex gap-3 pt-1">
        <button type="submit" className="rounded-lg bg-gold px-5 py-2 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity">Save Order</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-border-accent px-5 py-2 font-sans text-sm text-muted-dark hover:text-foreground transition-colors">Cancel</button>
      </div>
    </form>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>(FILTER_ALL);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetch("/api/admin/orders").then((r) => r.json()).then(setOrders); }, []);

  async function updateStatus(id: string, status: OrderStatus) {
    await fetch(`/api/admin/orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  async function del(id: string) {
    if (!confirm("Delete this order?")) return;
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    setOrders((os) => os.filter((o) => o.id !== id));
  }

  async function addOrder(data: Omit<Order, "id">) {
    const res = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const newOrder = await res.json();
    setOrders((os) => [newOrder, ...os]);
    setAdding(false);
  }

  const visible = filter === FILTER_ALL ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="min-h-screen bg-background px-4 py-10 lg:px-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Admin</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">Orders</h1>
          </div>
          {!adding && (
            <button type="button" onClick={() => setAdding(true)} className="rounded-xl bg-gold px-4 py-2 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity">+ New Order</button>
          )}
        </div>

        {adding && (
          <div className="rounded-2xl border border-border-accent bg-surface-strong p-6">
            <h2 className="font-display mb-5 text-lg font-semibold text-foreground">New Order</h2>
            <NewOrderForm onSave={addOrder} onCancel={() => setAdding(false)} />
          </div>
        )}

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {[FILTER_ALL, ...STATUSES].map((s) => (
            <button type="button" key={s} onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-1.5 font-sans text-xs font-semibold border transition-colors ${filter === s ? "bg-gold border-gold text-background" : "border-border-accent text-muted-dark hover:text-foreground"}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border-accent bg-surface-strong overflow-hidden divide-y divide-border-accent">
          {visible.map((order) => (
            <div key={order.id}>
              <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#0B2035] transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-semibold text-foreground truncate">{order.customer}</p>
                  <p className="font-sans text-xs text-slate">{order.id} · {order.date}</p>
                </div>
                <select
                  value={order.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                  title="Order status"
                  className={`rounded-full px-3 py-1 font-sans text-xs font-medium border cursor-pointer outline-none ${STATUS_COLORS[order.status]} bg-transparent`}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="font-sans text-sm font-semibold text-foreground shrink-0">${order.total.toLocaleString()}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); del(order.id); }} className="font-sans text-xs text-slate hover:text-[#EF4444] transition-colors shrink-0">Delete</button>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`shrink-0 transition-transform ${expanded === order.id ? "rotate-180" : ""}`} aria-hidden="true">
                  <path d="M2 5l5 4 5-4" stroke="#6A7A8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {expanded === order.id && (
                <div className="px-6 pb-4 border-t border-border-accent bg-surface-deep">
                  <table className="w-full mt-3">
                    <thead>
                      <tr>
                        {["Item", "Type", "Qty", "Price"].map((h) => (
                          <th key={h} className="text-left font-sans text-[10px] uppercase tracking-[0.2em] text-slate pb-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-accent">
                      {order.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2 font-sans text-sm text-foreground">{item.name}</td>
                          <td className="py-2 font-sans text-xs text-muted-dark">{item.type}</td>
                          <td className="py-2 font-sans text-xs text-muted-dark">{item.qty}</td>
                          <td className="py-2 font-sans text-sm text-foreground">${item.price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="font-sans text-xs text-muted-dark mt-2">{order.email}</p>
                </div>
              )}
            </div>
          ))}
          {visible.length === 0 && (
            <p className="px-6 py-8 text-center font-sans text-sm text-slate">No orders.</p>
          )}
        </div>
      </div>
    </div>
  );
}
