import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { accessories, type Accessory } from "@/data/accessories";
import { revalidatePath } from "next/cache";

async function getAll(): Promise<Accessory[]> {
  return loadDataAsync("accessories", accessories);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as Accessory;
  await saveDataAsync("accessories", (await getAll()).map((a) => (a.id === id ? { ...a, ...body, id } : a)));
  revalidatePath("/");
  revalidatePath("/products");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await saveDataAsync("accessories", (await getAll()).filter((a) => a.id !== id));
  revalidatePath("/");
  revalidatePath("/products");
  return NextResponse.json({ ok: true });
}
