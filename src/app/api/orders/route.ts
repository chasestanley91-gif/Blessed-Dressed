import { NextRequest, NextResponse } from "next/server";
import { loadData, saveData } from "@/lib/admin-data";
import { orders, type Order } from "@/data/orders";

function getAllOrders(): Order[] {
  return loadData("orders", orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const list = getAllOrders();
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
  saveData("orders", [newOrder, ...list]);
  return NextResponse.json({ orderId: newOrder.id }, { status: 201 });
}
