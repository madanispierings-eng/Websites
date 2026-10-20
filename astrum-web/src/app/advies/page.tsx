import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookingButton } from "@/components/booking";
import { CtaBand, PageIntro } from "@/components/sections";

export const metadata: Metadata = {
  title: "Advies en portfolio",
  description:
    "Past vastgoed in Dubai bij jouw plan? Vrijblijvend advies, een portfolio opbouwen voor nu en later, en hulp bij verhuur na de sleutel.",
  alternates: { canonical: "/advies/" },
};

const blocks = [
  {
    title: "Eerst advies",
    text: "Twijfel je nog? Dan kijken we eerst samen of Dubai bij jouw plan past. We bespreken je doel, je horizon en wat je wilt riskeren, en zetten de kosten en het verwachte rendement eerlijk naast elkaar. Ook als het antwoord nee is.",
    points: ["Doel: wonen, rendement of spreiding", "Hoe lang je je geld kunt missen", "Wat het kost, vóór en na de aankoop"],
    image: { src: "/img/duo.jpg", alt: "Pim Verberg en Denise Birjmohun van Astrum", position: "50% 25%" },
  },
  {
    title: "Een portfolio opbouwen",
    text: "Sommige klanten kopen één woning, anderen bouwen in de loop van de jaren een portfolio op. We helpen je spreiden over wijken, type woning en moment van oplevering, zodat niet alles tegelijk van één markt afhangt.",
    points: ["Bestaand en off-plan in balans", "Spreiden over wijken en opleverjaren", "Jaarlijks bekijken wat er beter kan"],
    image: { src: "/img/skyline.jpg", alt: "De skyline van Dubai, van ver gezien", position: "86% 50%" },
  },
  {
    title: "Na de sleutel",
    text: "Ook na de overdracht blijven we bereikbaar. We helpen met de keuze tussen een jaarcontract via Ejari of korte verhuur met een vergunning, en houden je op de hoogte van wat er in de markt gebeurt.",
    points: ["Jaarverhuur of korte verhuur", "Contact met beheerders en huurders", "Marktupdates via de Private List"],
    image: { src: "/img/marina.jpg", alt: "Dubai Marina bij nacht", position: "35% 50%" },
  },
];

export default function AdviesPage() {
  return (
    <>
      <PageIntro
        title="Advies en portfolio"
        intro="Verder kijken dan één aankoop. We begeleiden investeerders persoonlijk en met geduld, als vaste partner in de Emiraten."
        image={{ src: "/img/old-city.jpg", alt: "Een windtoren in de oude wijk Al Fahidi in Dubai", width: 1600, height: 1066, position: "30% 50%" }}
      >
        <BookingButton topic="Eerst advies">Vraag eerst advies</BookingButton>
      </PageIntro>

      {blocks.map((b, i) => (
        <section key={b.title} className={i % 2 === 0 ? "bg-paper" : ""} aria-labelledby={`b${i}`} data-reveal>
          <div className="container-page grid gap-8 py-24 lg:grid-cols-12 lg:gap-5 lg:py-28">
            <div className="lg:col-span-4">
              <h2 id={`b${i}`} className="text-head" data-r>{b.title}</h2>
              <div className="relative mt-8 aspect-[4/3] max-w-sm overflow-hidden" data-r>
                <Image src={b.image.src} alt={b.image.alt} fill sizes="24rem" className="object-cover" style={{ objectPosition: b.image.position }} />
              </div>
            </div>
            <div className="grid gap-6 lg:col-span-7 lg:col-start-6">
              <p className="measure text-lead" data-r>{b.text}</p>
              <ul className="grid list-disc gap-1 pl-5 text-stone marker:text-gold" data-r>
                {b.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          </div>
        </section>
      ))}

      <section className="container-page grid items-center gap-10 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32" aria-labelledby="tool" data-reveal>
        <div className="relative aspect-square overflow-hidden lg:col-span-5" data-r>
          <Image src="/img/palm.jpg" alt="Palm Jumeirah, gezien vanuit het vliegtuig" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" data-drift />
        </div>
        <div className="grid gap-6 lg:col-span-6 lg:col-start-7">
          <h2 id="tool" className="text-head" data-r>Begin bij de cijfers</h2>
          <p className="measure" data-r>
            Wat kost een aankoop van AED 1,5 of 3 miljoen echt, met of zonder hypotheek? Reken het zelf uit voordat we praten.
          </p>
          <Link href="/kosten/" className="link justify-self-start" data-r>Naar de kostencalculator</Link>
        </div>
      </section>

      <CtaBand line="Past Dubai bij jouw plan?" topic="Eerst advies" />
    </>
  );
}
