import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { orders, type Order } from "@/data/orders";

async function getAll(): Promise<Order[]> {
  return loadDataAsync("orders", orders);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as Partial<Order>;
  await saveDataAsync("orders", (await getAll()).map((o) => (o.id === id ? { ...o, ...body, id } : o)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await saveDataAsync("orders", (await getAll()).filter((o) => o.id !== id));
  return NextResponse.json({ ok: true });
}
