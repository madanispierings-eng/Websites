import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { container, site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Over ons",
  description: "Waarom Medivo bestaat en hoe het platform werkt.",
  alternates: { canonical: "/over-ons" },
};

const principles = [
  {
    title: "Structuur boven volume",
    body: "Elk vak heeft dezelfde vier onderdelen. Je weet altijd waar je iets vindt, zodat je tijd naar leren gaat en niet naar zoeken.",
  },
  {
    title: "Juistheid eerst",
    body: "Medische inhoud wordt pas gepubliceerd nadat die is gecontroleerd. Liever een onderwerp later online dan een fout in de stof.",
  },
  {
    title: "Begrijpen, niet alleen onthouden",
    body: "Bij elke oefenvraag lees je waarom het juiste antwoord klopt en, waar beschikbaar, waarom de andere opties dat niet doen.",
  },
  {
    title: "Respect voor rechten en privacy",
    body: "We gebruiken alleen materiaal waarvoor we toestemming hebben, en we verzamelen niet meer gegevens dan nodig is.",
  },
];

export default function AboutPage() {
  return (
    <main id="inhoud" className="flex-1">
      <section className="bg-gradient-to-b from-[#eef4fb] to-canvas">
        <div className={cn(container, "grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20")}>
          <div>
            <h1 className="text-4xl font-bold tracking-[-0.03em] text-navy sm:text-5xl">Studeren met overzicht</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-ink">
              Geneeskunde studeren betekent veel stof in korte tijd. Medivo brengt per vak samen wat je nodig hebt: een volledige
              samenvatting, de leerdoelen, oude tentamens en oefenvragen met uitleg.
            </p>
            <p className="mt-4 leading-relaxed text-muted-ink">
              We beginnen bij de bachelor Geneeskunde aan de Universiteit Leiden en willen het platform later uitbreiden naar andere
              medische faculteiten in Nederland.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[var(--shadow-lift)]">
            <Image src="/images/leiden-universiteit.webp" alt="Universiteitsgebouw aan het water in Leiden" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className={cn(container, "py-14 lg:py-20")} aria-labelledby="principes-titel">
        <h2 id="principes-titel" className="text-3xl font-bold tracking-[-0.02em] text-navy">Waar we voor staan</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {principles.map((p) => (
            <div key={p.title} className="rounded-xl border border-line bg-white p-6 shadow-[var(--shadow-card)]">
              <h3 className="text-lg font-semibold text-navy">{p.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-ink">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-white">
        <div className={cn(container, "grid gap-8 py-14 lg:grid-cols-[1fr_auto] lg:items-center")}>
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-navy">Onafhankelijk</h2>
            <p className="mt-3 leading-relaxed text-muted-ink">{site.disclaimer} Officiële informatie over vakken, toetsing en regelingen vind je altijd in de studiegids en via je opleiding.</p>
          </div>
          <Button asChild size="lg" className="h-12 px-6 font-semibold">
            <Link href="/vakken">Bekijk alle vakken <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
