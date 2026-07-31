import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { orders, type Order } from "@/data/orders";

async function getAllOrders(): Promise<Order[]> {
  return loadDataAsync("orders", orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const list = await getAllOrders();
  const maxId = list.reduce(
    (m, o) => Math.max(m, parseInt(o.id.replace("ORD-", ""), 10)),
    0
  );
  const newOrder: Order = {
    ...body,
    id: `ORD-${String(maxId + 1).padStart(4, "0")}`,
    date: new Date().toISOString().slice(0, 10),
    status: "Pending",
  };
  try {
    // Was saveData (sync fs). On Vercel the Lambda filesystem is read-only, so
    // every order POST threw EROFS and the order was lost.
    await saveDataAsync("orders", [newOrder, ...list]);
  } catch (err) {
    console.error("Failed to persist order:", err);
    return NextResponse.json(
      { error: "Could not save the order. Please try again." },
      { status: 500 }
    );
  }
  return NextResponse.json({ orderId: newOrder.id }, { status: 201 });
}
