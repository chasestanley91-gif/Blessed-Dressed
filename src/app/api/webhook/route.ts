import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import type { BespokeOrder } from "@/app/api/admin/bespoke-orders/route";

// Tell Next.js NOT to parse the body — Stripe needs the raw bytes to verify
// the webhook signature.
export const runtime = "nodejs";

type StoredOrder = {
  id: string;
  date: string;
  status: string;
  stripeSessionId?: string;
  customerEmail?: string | null;
  customerName?: string;
  deliveryAddress?: string;
  phone?: string;
  amount?: number;
  bespokeOrderId?: string;
};

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 503 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bespokeOrderId = session.metadata?.bespokeOrderId;

    // 1. Save a general order record (for the main orders admin panel)
    const orders = await loadDataAsync<StoredOrder[]>("orders", []);
    const maxId = orders.reduce(
      (m, o) => Math.max(m, parseInt(o.id.replace("ORD-", "") || "0", 10)),
      0
    );
    const newOrder: StoredOrder = {
      id: `ORD-${String(maxId + 1).padStart(4, "0")}`,
      date: new Date().toISOString().slice(0, 10),
      status: "Pending",
      stripeSessionId: session.id,
      customerEmail: session.customer_email,
      customerName: session.metadata?.customerName || "",
      deliveryAddress: session.metadata?.deliveryAddress || "",
      phone: session.metadata?.customerPhone || "",
      amount: session.amount_total ? session.amount_total / 100 : 0,
      ...(bespokeOrderId ? { bespokeOrderId } : {}),
    };
    orders.unshift(newOrder);
    await saveDataAsync("orders", orders);
    console.log(`General order saved: ${newOrder.id}`);

    // 2. Mark the bespoke order record as Paid so the admin worksheet is complete
    if (bespokeOrderId) {
      try {
        const bespokeOrders = await loadDataAsync<BespokeOrder[]>("bespoke-orders", []);
        const updated = bespokeOrders.map((bo) =>
          bo.id === bespokeOrderId
            ? {
                ...bo,
                status: "Paid" as BespokeOrder["status"],
                stripeSessionId: session.id,
              }
            : bo
        );
        await saveDataAsync("bespoke-orders", updated);
        console.log(`Bespoke order ${bespokeOrderId} marked as Paid`);
      } catch (err) {
        console.error("Failed to update bespoke order status:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
