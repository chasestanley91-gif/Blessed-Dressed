import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { accessories, type Accessory } from "@/data/accessories";
import { revalidatePath } from "next/cache";

async function getAll(): Promise<Accessory[]> {
  return loadDataAsync("accessories", accessories);
}

export async function GET() {
  return NextResponse.json(await getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Omit<Accessory, "id">;
  const newItem: Accessory = { ...body, id: `a${Date.now()}` };
  await saveDataAsync("accessories", [...(await getAll()), newItem]);
  revalidatePath("/");
  revalidatePath("/products");
  return NextResponse.json(newItem, { status: 201 });
}
