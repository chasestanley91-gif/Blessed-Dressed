import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { repriceCart } from "@/lib/pricing";
import { createBespokeOrder } from "@/lib/bespoke-orders";
import type { CartItem } from "@/context/CartContext";

type CustomerInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  country?: string;
};

const REQUIRED_CUSTOMER_FIELDS = ["firstName", "lastName", "email", "address", "city"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCustomer(info: unknown): { ok: true; info: CustomerInfo } | { ok: false; error: string } {
  if (!info || typeof info !== "object") return { ok: false, error: "Customer details are missing." };
  const c = info as Record<string, unknown>;
  const missing = REQUIRED_CUSTOMER_FIELDS.filter(
    (f) => typeof c[f] !== "string" || (c[f] as string).trim() === ""
  );
  if (missing.length) return { ok: false, error: `Missing customer details: ${missing.join(", ")}.` };
  if (!EMAIL_RE.test((c.email as string).trim())) return { ok: false, error: "That email address is not valid." };
  return { ok: true, info: info as CustomerInfo };
}

export async function POST(req: Request) {
  // NOTE ON ORDERING: input validation and repricing run BEFORE the Stripe
  // availability check. Returning 503 first would make every guard below
  // unreachable whenever Stripe is unconfigured — including on a staging or
  // preview deployment, which is exactly where a tampered request gets tried.
  // Validation must not depend on a third party being reachable.

  // Unguarded before — a malformed body threw an HTML 500 that the client's
  // `res.json().catch(() => ({}))` turned into a generic "Something went wrong".
  let body: { items?: CartItem[]; customerInfo?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items in cart." }, { status: 400 });
  }

  const customer = validateCustomer(body.customerInfo);
  if (!customer.ok) {
    return NextResponse.json({ error: customer.error }, { status: 400 });
  }
  const customerInfo = customer.info;

  // ── Reprice server-side ─────────────────────────────────────────────────────
  // Nothing below trusts `item.price`. Previously it went straight into Stripe's
  // unit_amount, so a crafted POST could buy a bespoke suit for $0.50.
  const priced = await repriceCart(items);
  if (!priced.ok) {
    console.warn("Checkout rejected — cart failed server repricing:", priced.errors);
    return NextResponse.json(
      {
        error:
          "Your cart could not be verified — prices may have changed. Please reload the cart and try again.",
        details: priced.errors,
      },
      { status: 409 }
    );
  }

  // Only now, with a validated and correctly-priced cart, do we need Stripe.
  // Checked before any persistence so an unconfigured deployment cannot leave
  // orphaned "Pending Payment" records behind.
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Please add STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const customerName = `${customerInfo.firstName} ${customerInfo.lastName}`;
  const deliveryAddress = `${customerInfo.address}, ${customerInfo.city}${
    customerInfo.country ? `, ${customerInfo.country}` : ""
  }`;

  // ── Persist the bespoke configuration BEFORE redirecting to Stripe ──────────
  // Called in-process. The previous HTTP round-trip hit an auth-gated route,
  // always 401'd, and dropped every configuration on the floor in silence.
  const bespokeLines = priced.lines.filter((l) => l.item.type === "bespoke" && l.item.config);
  let bespokeOrderId: string | null = null;

  if (bespokeLines.length > 0) {
    const bespokeTotal = bespokeLines.reduce((s, l) => s + l.lineTotal, 0);
    try {
      const saved = await createBespokeOrder({
        status: "Pending Payment",
        customerName,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone || "",
        deliveryAddress,
        totalAmount: Math.round(bespokeTotal * 100) / 100,
        items: bespokeLines.map((l) => ({
          cartId: l.item.cartId ?? `cart-${Date.now()}`,
          name: l.item.name,
          price: l.unitPrice,
          image: l.item.image,
          config: l.item.config!,
        })),
      });
      bespokeOrderId = saved.id;
    } catch (err) {
      // A bespoke order whose specification was not stored is unmanufacturable.
      // Fail the checkout rather than take money for it.
      console.error("Failed to persist bespoke order — refusing checkout:", err);
      return NextResponse.json(
        { error: "We could not save your garment specification. Nothing has been charged. Please try again." },
        { status: 500 }
      );
    }
  }

  // ── Create the Stripe Checkout Session ──────────────────────────────────────
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: priced.lines.map((l) => ({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(l.unitPrice * 100),
          product_data: {
            name: l.item.name,
            ...(l.item.image && /^https?:\/\//.test(l.item.image) ? { images: [l.item.image] } : {}),
          },
        },
        quantity: l.qty,
      })),
      customer_email: customerInfo.email,
      success_url: `${siteUrl}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout`,
      metadata: {
        customerName,
        customerPhone: customerInfo.phone || "",
        deliveryAddress,
        ...(bespokeOrderId ? { bespokeOrderId } : {}),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Previously unguarded: a Stripe failure threw AFTER the bespoke record was
    // written, leaving a phantom "Pending Payment" order in the worksheet.
    console.error("Stripe session creation failed:", err, { bespokeOrderId });
    return NextResponse.json(
      { error: "We could not start the payment session. Nothing has been charged. Please try again." },
      { status: 502 }
    );
  }
}
