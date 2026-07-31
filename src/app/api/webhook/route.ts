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

    // Idempotency. Stripe retries on any non-2xx, and saveDataAsync now rethrows,
    // so without this a Blob hiccup after a partial write duplicates the order.
    const already = orders.find((o) => o.stripeSessionId === session.id);
    if (already) {
      console.log(`Webhook replay for ${session.id} — order ${already.id} already recorded`);
      return NextResponse.json({ received: true, deduped: true });
    }

    // isNaN guard: `Math.max(m, NaN)` is NaN, so ONE malformed id would poison
    // every subsequent order as ORD-NaN, permanently. bespoke-orders already
    // guards this; orders did not.
    const maxId = orders.reduce((m, o) => {
      const n = parseInt(String(o.id).replace("ORD-", ""), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
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
    try {
      await saveDataAsync("orders", orders);
    } catch (err) {
      // Return 5xx so Stripe retries — the payment happened; the record must exist.
      console.error("Failed to persist paid order — asking Stripe to retry:", err);
      return NextResponse.json({ error: "Could not record order." }, { status: 500 });
    }
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

  // A session that expires or fails otherwise leaves its bespoke record at
  // "Pending Payment" forever, cluttering the worksheet with orders that will
  // never be made.
  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object;
    const bespokeOrderId = session.metadata?.bespokeOrderId;
    if (bespokeOrderId) {
      try {
        const bespokeOrders = await loadDataAsync<BespokeOrder[]>("bespoke-orders", []);
        const updated = bespokeOrders.map((bo) =>
          bo.id === bespokeOrderId && bo.status === "Pending Payment"
            ? { ...bo, status: "Cancelled" as BespokeOrder["status"] }
            : bo
        );
        await saveDataAsync("bespoke-orders", updated);
        console.log(`Bespoke order ${bespokeOrderId} cancelled (${event.type})`);
      } catch (err) {
        console.error("Failed to cancel bespoke order:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
