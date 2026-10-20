import type { Metadata } from "next";
import Image from "next/image";
import { BookingButton } from "@/components/booking";
import { CtaBand, FaqList, PageIntro, PriceList, Steps } from "@/components/sections";
import { faqs } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Verkopen in Dubai",
  description:
    "Je woning in Dubai verkopen met een eerlijke vraagprijs op basis van echte transacties. Astrum regelt de papieren, de kopers en de overdracht, in het Nederlands.",
  alternates: { canonical: "/verkopen/" },
};

export default function VerkopenPage() {
  return (
    <>
      <PageIntro
        title="Verkopen in Dubai"
        intro="Een eerlijke vraagprijs op basis van wat er echt betaald is. En een koper die past. Zo staat je woning niet maandenlang online."
        image={{ src: "/img/marina.jpg", alt: "Dubai Marina bij nacht", width: 1600, height: 1066, position: "35% 50%" }}
      >
        <BookingButton topic="Verkopen">Bespreek je verkoop</BookingButton>
      </PageIntro>

      <section className="bg-tone" aria-label="Wat je van ons krijgt" data-reveal>
        <div className="container-page grid gap-12 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32">
          <div className="grid content-start gap-6 lg:col-span-5">
            <h2 className="text-head" data-r>Een prijs die klopt</h2>
            <p className="measure" data-r>
              Kopers in Dubai vergelijken. Wie te hoog begint, ziet zijn advertentie verouderen en eindigt vaak lager dan nodig. Wij
              beginnen bij de transacties in jouw gebouw en wijk, en bepalen samen met jou een prijs die klopt.
            </p>
            <p className="measure text-stone" data-r>
              Woon je zelf in Nederland? Dan regelen we de bezichtigingen, de sleutels en de papieren ter plekke, en houden we je per
              bericht op de hoogte.
            </p>
          </div>
          <PriceList
            className="lg:col-span-6 lg:col-start-7"
            title="Wat we regelen"
            groups={[
              {
                name: "Voor de verkoop",
                rows: [
                  { name: "Waardebepaling op transacties", value: "onderbouwd" },
                  { name: "Verkoopopdracht (Form\u00a0A)", value: "RERA" },
                  { name: "Foto’s en presentatie", value: "verzorgd" },
                ],
              },
              {
                name: "Tijdens de verkoop",
                rows: [
                  { name: "Kopers selecteren en bezichtigen", value: "ook zonder jou" },
                  { name: "Onderhandelen en koopovereenkomst (Form\u00a0F)", value: "samen" },
                ],
              },
              {
                name: "De overdracht",
                rows: [
                  { name: "NOC van de ontwikkelaar", value: "aangevraagd" },
                  { name: "Hypotheek aflossen, als die er is", value: "afgestemd" },
                  { name: "Overdracht bij de trustee", value: "wij zijn erbij" },
                ],
              },
            ]}
          />
        </div>
      </section>

      <Steps
        title="Zo gaat verkopen"
        intro="Vier stappen. Je hoeft er niet voor in Dubai te zijn."
        image={{ src: "/img/old-city.jpg", alt: "Een windtoren in de oude wijk Al Fahidi", position: "30% 50%" }}
        steps={[
          { name: "Waardebepaling", text: "We leggen jouw woning naast de recente verkopen in hetzelfde gebouw en de wijk, per vierkante voet." },
          { name: "Vraagprijs en presentatie", text: "Samen kiezen we een prijs. Daarna tekenen we de opdracht en zetten we de woning goed neer." },
          { name: "Kopers en bezichtigingen", text: "We selecteren serieuze kopers en doen de bezichtigingen, ook als jij in Nederland bent." },
          { name: "Overdracht", text: "Koopovereenkomst, NOC van de ontwikkelaar, eventuele hypotheek, en de overdracht bij de trustee." },
        ]}
      />

      <section className="bg-paper" aria-labelledby="vragen-verkopen" data-reveal>
        <div className="container-page grid gap-10 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32">
          <div className="lg:col-span-4">
            <h2 id="vragen-verkopen" className="text-head" data-r>Vragen over verkopen</h2>
            <div className="relative mt-10 aspect-square max-w-xs overflow-hidden" data-r>
              <Image src="/img/skyline.jpg" alt="De skyline van Dubai in de avondzon" fill sizes="20rem" className="object-cover object-[86%_50%]" />
            </div>
          </div>
          <div className="lg:col-span-7 lg:col-start-6" data-r>
            <FaqList items={faqs.filter((f) => f.topic === "Verkopen")} />
          </div>
        </div>
      </section>

      <CtaBand line="Wat is jouw woning echt waard?" topic="Verkopen" />
    </>
  );
}
