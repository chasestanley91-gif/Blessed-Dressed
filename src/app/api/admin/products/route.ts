import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { readyToWear, type Product } from "@/data/products";
import { revalidatePath } from "next/cache";

async function getAll(): Promise<Product[]> {
  return loadDataAsync("products", readyToWear);
}

export async function GET() {
  return NextResponse.json(await getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Product;
  const list = await getAll();
  const newItem: Product = { ...body, id: `r${Date.now()}` };
  await saveDataAsync("products", [...list, newItem]);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/[id]", "page");
  return NextResponse.json(newItem, { status: 201 });
}
