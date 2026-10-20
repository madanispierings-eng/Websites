import type { Metadata } from "next";
import Image from "next/image";
import { CostCalculator } from "@/components/cost-calculator";
import { CtaBand, FaqList } from "@/components/sections";
import { faqs } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Kosten koper in Dubai berekenen",
  description:
    "Bereken wat een woning in Dubai echt kost: 4% overdrachtsbelasting DLD, trustee, makelaar en hypotheekkosten. Voor bestaande woningen, off-plan en met hypotheek.",
  alternates: { canonical: "/kosten/" },
};

export default function KostenPage() {
  return (
    <>
      <section className="dark bg-creek text-foreground" data-reveal>
        <div className="container-page grid gap-12 pt-16 pb-24 lg:grid-cols-12 lg:gap-5 lg:pt-24 lg:pb-32">
          <div className="grid content-start gap-8 lg:col-span-5">
            <h1 className="text-head max-w-[12ch]" data-r>Wat kopen echt kost</h1>
            <p className="measure text-lead" data-r>
              De koopprijs is niet het hele bedrag. Kies wat je wilt kopen en zie per post wat er bovenop komt.
            </p>
            <p className="mt-4 text-display leading-none text-gold tabular-nums" data-r aria-hidden="true">4%</p>
            <p className="measure text-muted-foreground" data-r>
              De overdrachtsbelasting van het Dubai Land Department is bij elke aankoop de grootste post. De rest zijn vaste bedragen
              en, bij een bestaande woning, de makelaar.
            </p>
          </div>
          <div className="light bg-paper p-6 text-ink sm:p-10 lg:col-span-7 lg:col-start-6" data-r>
            <CostCalculator explain />
          </div>
        </div>
      </section>

      <div className="container-page pt-5" data-reveal>
        <div className="relative aspect-[21/9] overflow-hidden" data-r>
          <Image src="/img/skyline.jpg" alt="De skyline van Dubai in de avondzon, van ver gezien" fill sizes="100vw" className="object-cover object-[80%_60%]" data-drift />
        </div>
      </div>

      <section className="container-page grid gap-10 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32" aria-labelledby="ook" data-reveal>
        <div className="lg:col-span-4">
          <h2 id="ook" className="text-head" data-r>Wat er later bijkomt</h2>
          <div className="relative mt-10 aspect-[4/5] max-w-xs overflow-hidden" data-r>
            <Image src="/img/marina.jpg" alt="Dubai Marina bij nacht" fill sizes="20rem" className="object-cover object-[35%_50%]" />
          </div>
        </div>
        <div className="grid gap-8 lg:col-span-7 lg:col-start-6">
          {[
            ["Servicekosten", "Jaarlijks, per vierkante voet. Ze verschillen sterk per gebouw en drukken direct op je rendement. Vraag ze altijd vooraf op."],
            ["Verhuur", "Bij jaarverhuur registreer je het contract via Ejari. Korte verhuur aan toeristen vraagt een vergunning en een beheerder."],
            ["Nutsvoorzieningen", "Bij de overdracht zet je water en stroom (DEWA) op je naam, met een borg. Bij verhuur gaat dit meestal naar de huurder."],
            ["Belasting in Nederland", "Vastgoed in het buitenland valt voor de meeste Nederlanders in box 3. Bespreek je situatie met een belastingadviseur."],
          ].map(([t, d]) => (
            <div key={t} className="grid gap-2" data-r>
              <h3 className="text-lead font-medium">{t}</h3>
              <p className="measure text-stone">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-paper" aria-labelledby="vragen-kosten" data-reveal>
        <div className="container-page grid gap-10 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32">
          <div className="lg:col-span-4">
            <h2 id="vragen-kosten" className="text-head" data-r>Vragen over kosten</h2>
            <div className="relative mt-10 aspect-square max-w-xs overflow-hidden" data-r>
              <Image src="/img/palm.jpg" alt="Palm Jumeirah, gezien vanuit het vliegtuig" fill sizes="20rem" className="object-cover" />
            </div>
          </div>
          <div className="lg:col-span-7 lg:col-start-6" data-r>
            <FaqList items={faqs.filter((f) => f.topic === "Kosten" || f.topic === "Visum en wonen")} />
          </div>
        </div>
      </section>

      <CtaBand line="Samen je cijfers nalopen?" topic="Kopen" />
    </>
  );
}
