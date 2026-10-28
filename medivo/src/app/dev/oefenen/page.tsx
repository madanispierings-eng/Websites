import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLaunched } from "@/lib/env";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";
import { PracticePreview } from "./preview";

export const metadata: Metadata = { title: "Voorbeeld oefenscherm", robots: { index: false, follow: false } };

export default function Page() {
  // For development and the pre-launch preview only; gone once Medivo is launched.
  if (isLaunched) notFound();
  return (
    <main id="inhoud" className={cn(container, "flex-1 py-10")}>
      <p className="mb-6 rounded-lg border border-[#e8c48a] bg-[#fdf6ec] px-4 py-3 text-sm text-navy">
        Ontwikkelweergave met opvultekst. Er wordt niets opgeslagen.
      </p>
      <h1 className="mb-6 text-3xl font-bold text-navy">Oefenen per onderwerp</h1>
      <PracticePreview />
    </main>
  );
}
