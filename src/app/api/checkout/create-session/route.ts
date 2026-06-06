import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type { BespokeConfig } from "@/context/CartContext";

// Full cart item shape sent from the checkout page
type CartItem = {
  cartId?: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  type?: string;
  config?: BespokeConfig;
};

type CustomerInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  country?: string;
};

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Please add STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  const { items, customerInfo } = (await req.json()) as {
    items: CartItem[];
    customerInfo: CustomerInfo;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items in cart." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const customerName = `${customerInfo.firstName} ${customerInfo.lastName}`;
  const deliveryAddress = `${customerInfo.address}, ${customerInfo.city}${customerInfo.country ? `, ${customerInfo.country}` : ""}`;
  const totalAmount = items.reduce((s, i) => s + i.price * i.qty, 0);

  // ── Save bespoke order record BEFORE redirecting to Stripe ──────────────────
  // This ensures we never lose the configuration data even if the webhook
  // is delayed or the customer abandons on Stripe.
  const bespokeItems = items.filter((i) => i.type === "bespoke" && i.config);
  let bespokeOrderId: string | null = null;

  if (bespokeItems.length > 0) {
    try {
      const origin = siteUrl;
      const res = await fetch(`${origin}/api/admin/bespoke-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Pending Payment",
          customerName,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone || "",
          deliveryAddress,
          totalAmount,
          items: bespokeItems.map((item) => ({
            cartId: item.cartId ?? `cart-${Date.now()}`,
            name: item.name,
            price: item.price,
            image: item.image,
            config: item.config,
          })),
        }),
      });
      if (res.ok) {
        const saved = await res.json() as { id: string };
        bespokeOrderId = saved.id;
      }
    } catch (err) {
      // Don't block the checkout if saving fails — log and continue
      console.error("Failed to save bespoke order record:", err);
    }
  }

  // ── Create Stripe Checkout Session ──────────────────────────────────────────
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: items.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: Math.round(item.price * 100),
        product_data: {
          name: item.name,
          ...(item.image ? { images: [item.image] } : {}),
        },
      },
      quantity: item.qty,
    })),
    customer_email: customerInfo.email,
    success_url: `${siteUrl}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout`,
    metadata: {
      customerName,
      customerPhone: customerInfo.phone || "",
      deliveryAddress,
      // Pass bespoke order ID so the webhook can mark it as paid
      ...(bespokeOrderId ? { bespokeOrderId } : {}),
    },
  });

  return NextResponse.json({ url: session.url });
}
