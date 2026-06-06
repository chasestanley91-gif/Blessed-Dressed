import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { orders, type Order } from "@/data/orders";

export async function getAllOrders(): Promise<Order[]> {
  return loadDataAsync("orders", orders);
}

export async function GET() {
  return NextResponse.json(await getAllOrders());
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Omit<Order, "id">;
  const list = await getAllOrders();
  const maxId = list.reduce((m, o) => Math.max(m, parseInt(o.id.replace("ORD-", ""), 10)), 0);
  const newOrder: Order = { ...body, id: `ORD-${String(maxId + 1).padStart(4, "0")}` };
  await saveDataAsync("orders", [newOrder, ...list]);
  return NextResponse.json(newOrder, { status: 201 });
}
