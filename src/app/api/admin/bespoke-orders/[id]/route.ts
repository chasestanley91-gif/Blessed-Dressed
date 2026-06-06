import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import type { BespokeOrder } from "../route";

async function getAll(): Promise<BespokeOrder[]> {
  return loadDataAsync<BespokeOrder[]>("bespoke-orders", []);
}

// GET — fetch a single bespoke order
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const all = await getAll();
  const order = all.find((o) => o.id === id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

// PUT — update status, notes, or mark as paid
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<BespokeOrder>;
  const all = await getAll();
  const updated = all.map((o) => (o.id === id ? { ...o, ...body, id } : o));
  await saveDataAsync("bespoke-orders", updated);
  return NextResponse.json({ ok: true });
}

// DELETE — remove a bespoke order
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await saveDataAsync("bespoke-orders", (await getAll()).filter((o) => o.id !== id));
  return NextResponse.json({ ok: true });
}
