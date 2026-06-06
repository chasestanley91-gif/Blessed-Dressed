import { NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import type { BespokeConfig } from "@/context/CartContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BespokeOrderItem = {
  cartId: string;
  name: string;
  price: number;
  image?: string;
  config: BespokeConfig;
};

export type BespokeOrder = {
  id: string;               // BES-0001, BES-0002 …
  createdAt: string;        // ISO datetime
  status: "Pending Payment" | "Paid" | "In Production" | "Shipped" | "Delivered" | "Cancelled";
  // Customer
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress?: string;
  // Payment
  stripeSessionId?: string;
  totalAmount: number;
  // Items
  items: BespokeOrderItem[];
  // Internal notes
  notes?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAll(): Promise<BespokeOrder[]> {
  return loadDataAsync<BespokeOrder[]>("bespoke-orders", []);
}

// ─── GET — list all bespoke orders ───────────────────────────────────────────

export async function GET() {
  const orders = await getAll();
  return NextResponse.json(orders);
}

// ─── POST — create a new bespoke order record ────────────────────────────────
// Called from /api/checkout/create-session before redirecting to Stripe.

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<BespokeOrder, "id" | "createdAt">;
  const all = await getAll();

  const maxNum = all.reduce((m, o) => {
    const n = parseInt(o.id.replace("BES-", ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);

  const newOrder: BespokeOrder = {
    ...body,
    id: `BES-${String(maxNum + 1).padStart(4, "0")}`,
    createdAt: new Date().toISOString(),
    status: body.status ?? "Pending Payment",
  };

  await saveDataAsync("bespoke-orders", [newOrder, ...all]);
  return NextResponse.json(newOrder, { status: 201 });
}
