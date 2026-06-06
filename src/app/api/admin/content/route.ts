import { NextRequest, NextResponse } from "next/server";
import { loadData, saveData } from "@/lib/admin-data";

export type SiteContent = {
  heroHeadline: string;
  heroSubline: string;
  heroCtaLabel: string;
  aboutHeading: string;
  aboutBody: string;
  footerTagline: string;
};

const DEFAULTS: SiteContent = {
  heroHeadline: "Dressed with intention.",
  heroSubline: "Bespoke tailoring and curated ready-to-wear for the modern gentleman.",
  heroCtaLabel: "Explore the Collection",
  aboutHeading: "Crafted to your measure.",
  aboutBody: "Every garment is built from first principles — your measurements, your choices, your character.",
  footerTagline: "Blessed & Dressed — luxury tailoring, your way.",
};

export async function GET() {
  return NextResponse.json(loadData<SiteContent>("content", DEFAULTS));
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as SiteContent;
  saveData("content", { ...DEFAULTS, ...body });
  return NextResponse.json({ ok: true });
}
