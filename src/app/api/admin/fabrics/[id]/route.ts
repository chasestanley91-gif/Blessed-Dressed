import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { fabrics } from "@/data/builder";
import { revalidatePath } from "next/cache";

type Fabric = { id: string; label: string; detail: string; premium: boolean; collection?: string; photoImage?: string; codeImage?: string; image?: string; color?: string[]; pattern?: string; weight?: "light" | "medium" | "heavy"; finish?: "crisp" | "soft" | "luxurious" | "textured"; season?: string[]; occasion?: string[] };

async function getAll(): Promise<Fabric[]> {
  return loadDataAsync("fabrics", fabrics);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as Fabric;
  await saveDataAsync("fabrics", (await getAll()).map((f) => (f.id === id ? { ...f, ...body, id } : f)));
  revalidatePath("/builder");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await saveDataAsync("fabrics", (await getAll()).filter((f) => f.id !== id));
  revalidatePath("/builder");
  return NextResponse.json({ ok: true });
}
