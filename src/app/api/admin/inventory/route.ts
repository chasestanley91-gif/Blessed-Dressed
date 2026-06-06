import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { readyToWear, type Product } from "@/data/products";
import { revalidatePath } from "next/cache";

async function getProducts(): Promise<Product[]> {
  return loadDataAsync("products", readyToWear);
}

export async function GET() {
  return NextResponse.json(await getProducts());
}

export async function PUT(req: NextRequest) {
  const { productId, size, stock } = await req.json() as {
    productId: string;
    size: string;
    stock: number;
  };

  const products = await getProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const sizeEntry = product.stockBySize.find((s) => s.size === size);
  if (sizeEntry) {
    sizeEntry.stock = stock;
  } else {
    product.stockBySize.push({ size, stock });
  }

  await saveDataAsync("products", products);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/[id]", "page");

  return NextResponse.json({ ok: true });
}
