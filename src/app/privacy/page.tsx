import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";
import { legalDoc } from "@/data/legal";

const doc = legalDoc("privacy");

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
};

export default function PrivacyPage() {
  return <LegalDocument doc={doc} />;
}
