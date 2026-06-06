import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { readyToWear, type Product } from "@/data/products";
import { revalidatePath } from "next/cache";

async function getAll(): Promise<Product[]> {
  return loadDataAsync("products", readyToWear);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as Product;
  const list = (await getAll()).map((p) => (p.id === id ? { ...p, ...body, id } : p));
  await saveDataAsync("products", list);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/[id]", "page");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await saveDataAsync("products", (await getAll()).filter((p) => p.id !== id));
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/[id]", "page");
  return NextResponse.json({ ok: true });
}
