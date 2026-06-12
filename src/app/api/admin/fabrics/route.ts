import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { fabrics } from "@/data/builder";
import { revalidatePath } from "next/cache";

type Fabric = { id: string; label: string; detail: string; premium: boolean; collection?: string; photoImage?: string; codeImage?: string; image?: string; color?: string[]; pattern?: string; weight?: "light" | "medium" | "heavy"; finish?: "crisp" | "soft" | "luxurious" | "textured"; season?: string[]; occasion?: string[] };

async function getAll(): Promise<Fabric[]> {
  return loadDataAsync("fabrics", fabrics);
}

export async function GET() {
  return NextResponse.json(await getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Omit<Fabric, "id">;
  const newItem: Fabric = { ...body, id: body.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + `-${Date.now()}` };
  await saveDataAsync("fabrics", [...(await getAll()), newItem]);
  revalidatePath("/builder");
  return NextResponse.json(newItem, { status: 201 });
}
