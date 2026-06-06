import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { collections, type Collection } from "@/data/collections";
import { revalidatePath } from "next/cache";

async function getAll(): Promise<Collection[]> {
  return loadDataAsync("collections", collections);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // id = slug
  const body = await req.json() as Collection;
  await saveDataAsync("collections", (await getAll()).map((c) => (c.slug === id ? { ...c, ...body } : c)));
  revalidatePath("/");
  revalidatePath("/collections");
  revalidatePath("/collections/[slug]", "page");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await saveDataAsync("collections", (await getAll()).filter((c) => c.slug !== id));
  revalidatePath("/");
  revalidatePath("/collections");
  revalidatePath("/collections/[slug]", "page");
  return NextResponse.json({ ok: true });
}
