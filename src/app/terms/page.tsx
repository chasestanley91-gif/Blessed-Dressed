import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";
import { legalDoc } from "@/data/legal";

const doc = legalDoc("terms");

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
};

export default function TermsPage() {
  return <LegalDocument doc={doc} />;
}
