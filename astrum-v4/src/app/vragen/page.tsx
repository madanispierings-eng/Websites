import type { Metadata } from "next";
import { Faq } from "@/components/home/faq";
import { CtaBand } from "@/components/page/cta-band";

export const metadata: Metadata = {
  title: "Vragen",
  description: "Antwoorden op wat Nederlanders vragen over kopen, kosten, visum, verhuur en verkopen in Dubai.",
};

export default function VragenPage() {
  return (
    <div className="page-top">
      <Faq heading="h1" />
      <CtaBand />
    </div>
  );
}
