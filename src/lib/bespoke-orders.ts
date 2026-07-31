import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import type { BespokeConfig } from "@/context/CartContext";

// Bespoke order persistence.
//
// This used to live only inside the POST handler of /api/admin/bespoke-orders,
// and the checkout route reached it with a server-to-server `fetch`. That path
// is matched by src/proxy.ts ("/api/admin/:path*") and carries no session
// cookie, so it returned 401 on every real order. The caller checked
// `if (res.ok)` with no `else` and no throw, so the failure was invisible: the
// customer was charged and the atelier received an order with no fabric, no
// design selections, no measurements and no monograms.
//
// Persistence therefore lives here, callable in-process. The HTTP route is now
// a thin wrapper over the same function.

export type BespokeOrderItem = {
  cartId: string;
  name: string;
  price: number;
  image?: string;
  config: BespokeConfig;
};

export type BespokeOrderStatus =
  | "Pending Payment"
  | "Paid"
  | "In Production"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type BespokeOrder = {
  id: string; // BES-0001, BES-0002 …
  createdAt: string; // ISO datetime
  status: BespokeOrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress?: string;
  stripeSessionId?: string;
  totalAmount: number;
  items: BespokeOrderItem[];
  notes?: string;
};

export async function getBespokeOrders(): Promise<BespokeOrder[]> {
  return loadDataAsync<BespokeOrder[]>("bespoke-orders", []);
}

/**
 * Create and persist a bespoke order.
 * Throws on write failure — the caller decides what that means. It must never
 * be swallowed: a lost configuration is an unmanufacturable order.
 */
export async function createBespokeOrder(
  input: Omit<BespokeOrder, "id" | "createdAt"> & { status?: BespokeOrderStatus }
): Promise<BespokeOrder> {
  const all = await getBespokeOrders();

  // isNaN guard: one malformed id would otherwise make Math.max return NaN and
  // poison every subsequent id as BES-NaN.
  const maxNum = all.reduce((m, o) => {
    const n = parseInt(String(o.id).replace("BES-", ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);

  const order: BespokeOrder = {
    ...input,
    id: `BES-${String(maxNum + 1).padStart(4, "0")}`,
    createdAt: new Date().toISOString(),
    status: input.status ?? "Pending Payment",
  };

  await saveDataAsync("bespoke-orders", [order, ...all]);
  return order;
}
