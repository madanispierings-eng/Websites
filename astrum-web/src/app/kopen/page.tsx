import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaBand, FaqList, PageIntro, Steps } from "@/components/sections";
import { BookingButton } from "@/components/booking";
import { faqs } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Kopen in Dubai",
  description:
    "Een woning kopen in Dubai met een Nederlandstalige makelaar: eerst jouw plan, dan wijken en projecten vergelijken op echte transactieprijzen, en begeleiding tot na de overdracht.",
  alternates: { canonical: "/kopen/" },
};

const compare = [
  { label: "Betalen", ready: "In één keer bij de overdracht", offplan: "In termijnen, vaak deels na oplevering" },
  { label: "Wanneer bewonen of verhuren", ready: "Direct na de overdracht", offplan: "Na oplevering, vaak twee tot vier jaar" },
  { label: "Bijkomende kosten", ready: "DLD 4%, trustee, makelaar", offplan: "DLD 4% en Oqood; makelaar meestal via ontwikkelaar" },
  { label: "Wat je kunt controleren", ready: "De woning zelf en de huur in het gebouw", offplan: "De ontwikkelaar, het escrow-account en het contract" },
  { label: "Grootste risico", ready: "Te veel betalen ten opzichte van transacties", offplan: "Vertraging en een andere markt bij oplevering" },
];

export default function KopenPage() {
  return (
    <>
      <PageIntro
        title="Kopen in Dubai"
        intro="We zoeken mee, toetsen elke prijs aan wat er echt betaald is en begeleiden je tot na de overdracht. In jouw tempo, in het Nederlands."
        image={{ src: "/img/skyline.jpg", alt: "De skyline van Dubai in de avondzon", width: 1920, height: 1097, position: "86% 50%" }}
      >
        <div className="flex flex-wrap items-center gap-6">
          <BookingButton topic="Kopen" />
          <Link href="/kosten/" className="link">Bereken de bijkomende kosten</Link>
        </div>
      </PageIntro>

      <div className="bg-paper">
        <Steps
          title="Zo gaat kopen"
          intro="Vier stappen, zonder druk om te tekenen. Je bepaalt zelf wanneer de volgende begint."
          image={{ src: "/img/marina.jpg", alt: "Dubai Marina bij nacht", position: "35% 50%" }}
          steps={[
            {
              name: "Kennismaken",
              text: "We beginnen met jouw plan, niet met een project. Wat wil je, hoe lang kun je wachten, wat mag het kosten?",
              detail: ["Wonen, verhuren of allebei", "Budget, inclusief bijkomende kosten", "Je horizon: drie jaar of vijftien"],
            },
            {
              name: "Uitzoeken",
              text: "We vergelijken wijken, ontwikkelaars en echte verkoopprijzen. Je ziet wat er speelt, ook wat minder mooi is.",
              detail: ["Vraagprijs naast transactieprijs per vierkante voet", "Track record van de ontwikkelaar", "Servicekosten en verwachte huur"],
            },
            {
              name: "Aankopen",
              text: "We lopen elk document met je door en zijn erbij tot de overdracht. Geen haast om te tekenen.",
              detail: ["Bod, koopovereenkomst en betalingsplan", "Registratie bij DLD of Oqood", "Overdracht bij het trustee-kantoor"],
            },
            {
              name: "Daarna",
              text: "Ook na de sleutel blijven we bereikbaar. Voor vragen over verhuur, de markt of je volgende stap.",
            },
          ]}
        />
      </div>

      <section className="container-page py-24 lg:py-32" aria-labelledby="vergelijk" data-reveal>
        <h2 id="vergelijk" className="text-head max-w-[16ch]" data-r>Bestaand of off-plan</h2>
        <p className="measure mt-6 text-stone" data-r>
          Twee manieren om te kopen, met elk een eigen ritme. Welke past, hangt af van je plan en hoe lang je kunt wachten.
        </p>
        <div className="mt-12 grid gap-10 md:hidden" data-r>
          {(["ready", "offplan"] as const).map((k) => (
            <div key={k} className="bg-paper p-6">
              <h3 className="text-lead font-medium">{k === "ready" ? "Bestaande woning" : "Off-plan"}</h3>
              <dl className="mt-4 grid gap-4">
                {compare.map((r) => (
                  <div key={r.label}>
                    <dt className="text-small text-stone">{r.label}</dt>
                    <dd>{r[k]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <div className="mt-12 hidden md:block" data-r>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-ink">
                <th scope="col" className="w-1/4 py-3 pr-6 font-normal text-stone"><span className="sr-only">Onderwerp</span></th>
                <th scope="col" className="py-3 pr-6 text-lead font-medium">Bestaande woning</th>
                <th scope="col" className="py-3 text-lead font-medium">Off-plan</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((r) => (
                <tr key={r.label} /* taste-skill-ignore: real table */ className="border-b border-tone align-top">
                  <th scope="row" className="py-4 pr-6 font-normal text-stone">{r.label}</th>
                  <td className="py-4 pr-6">{r.ready}</td>
                  <td className="py-4">{r.offplan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-small text-stone" data-r>
          Overweeg je off-plan? Lees eerst{" "}
          <Link href="/inzichten/off-plan-contract-checklist/" className="link">wat je checkt voordat je tekent</Link>.
        </p>
      </section>

      <section className="bg-paper" aria-labelledby="vragen-kopen" data-reveal>
        <div className="container-page grid gap-10 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32">
          <div className="lg:col-span-4">
            <h2 id="vragen-kopen" className="text-head" data-r>Vragen over kopen</h2>
            <Link href="/vragen/" className="link mt-6 inline-block" data-r>Alle vragen</Link>
            <div className="relative mt-10 aspect-square max-w-xs overflow-hidden" data-r>
              <Image src="/img/old-city.jpg" alt="Een windtoren in de oude wijk Al Fahidi" fill sizes="20rem" className="object-cover object-[30%_50%]" />
            </div>
          </div>
          <div className="lg:col-span-7 lg:col-start-6" data-r>
            <FaqList items={faqs.filter((f) => f.topic === "Kopen" || f.topic === "Op afstand")} />
          </div>
        </div>
      </section>

      <CtaBand line="Vertel ons eerst wat je wilt." topic="Kopen" />
    </>
  );
}
