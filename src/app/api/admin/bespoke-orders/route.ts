import { NextResponse } from "next/server";
import {
  createBespokeOrder,
  getBespokeOrders,
  type BespokeOrder,
} from "@/lib/bespoke-orders";

// Thin HTTP wrapper over src/lib/bespoke-orders.ts. The checkout route calls the
// library directly — this endpoint is auth-gated by src/proxy.ts, so a
// server-to-server fetch from checkout always 401'd and silently lost the order.
export type { BespokeOrder, BespokeOrderItem } from "@/lib/bespoke-orders";

export async function GET() {
  return NextResponse.json(await getBespokeOrders());
}

export async function POST(req: Request) {
  let body: Omit<BespokeOrder, "id" | "createdAt">;
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  try {
    const order = await createBespokeOrder(body);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("Failed to create bespoke order:", err);
    return NextResponse.json({ error: "Could not save the order." }, { status: 500 });
  }
}
