import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { collections, type Collection } from "@/data/collections";
import { revalidatePath } from "next/cache";

async function getAll(): Promise<Collection[]> {
  return loadDataAsync("collections", collections);
}

export async function GET() {
  return NextResponse.json(await getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Collection;
  await saveDataAsync("collections", [...(await getAll()), body]);
  revalidatePath("/");
  revalidatePath("/collections");
  revalidatePath("/collections/[slug]", "page");
  return NextResponse.json(body, { status: 201 });
}
