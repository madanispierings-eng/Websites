import Image from "next/image";
import Link from "next/link";
import { BookingButton } from "@/components/booking";
import { LoopVideo } from "@/components/loop-video";
import { LazyCostCalculator as CostCalculator } from "@/components/lazy-cost-calculator";
import { CtaBand, PriceList } from "@/components/sections";
import { articles } from "@/lib/articles";
import { team, values } from "@/lib/site";

export default function Home() {
  return (
    <>
      {/* Hero: the promise in type, then the city opening up as you scroll */}
      <section className="relative" data-hero>
        <div className="container-page grid gap-10 pt-12 pb-10 lg:grid-cols-12 lg:items-end lg:gap-5 lg:pt-20 lg:pb-14">
          <h1 className="text-display lg:col-span-8" data-hero-title>
            Voor wie verder kijkt
          </h1>
          <div className="grid gap-6 lg:col-span-4 lg:pb-4" data-hero-copy>
            <p className="text-lead">Astrum is een boutique makelaar in Dubai, voor Nederlanders die kopen, verkopen of beleggen.</p>
            <p className="text-stone">Eerlijk advies, zonder haast. Ook als het beste antwoord ‘nog niet’ is.</p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <BookingButton />
              <Link href="/kosten/" className="link">Bereken de kosten</Link>
            </div>
          </div>
        </div>
        <div className="relative h-[64svh] lg:h-svh" data-hero-stage>
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: "inset(0 clamp(20px, 3vw, 40px) 0 clamp(20px, 3vw, 40px))" }}
            data-hero-frame
          >
            <Image
              src="/img/skyline-hero.jpg"
              alt="De skyline van Dubai in de avondzon, van ver gezien"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[78%_40%]"
              data-hero-img
            />
          </div>
        </div>
      </section>

      {/* What Astrum stands for, beside the creek where Dubai began */}
      <section className="container-page grid gap-12 py-24 lg:grid-cols-12 lg:items-center lg:gap-5 lg:py-40" data-reveal>
        <div className="grid content-start gap-6 lg:col-span-6">
          <h2 className="text-head" data-r>Eerst jouw plan</h2>
          <p className="measure text-lead" data-r>
            Het gaat niet om het hoogste gebouw of het snelste project. Het gaat om de keuze die past bij jouw plan.
          </p>
          <p className="measure text-stone" data-r>
            Daarom begint elk traject met een gesprek over wat jij wilt: hoe lang je kunt wachten, wat het mag kosten, of je er wilt
            wonen of verhuren. Pas daarna kijken we naar projecten, met de prijzen die in Dubai echt betaald zijn ernaast.
          </p>
          <ol className="mt-6 grid gap-5" aria-label="Waar Astrum voor staat">
            {values.map((v, i) => (
              <li key={v} className="grid grid-cols-[4.5rem_1fr] items-baseline gap-4" data-r>
                <span className="text-head leading-none text-gold-deep" aria-hidden="true">{["I", "II", "III"][i]}</span>
                <span className="text-lead">{v}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="lg:col-span-5 lg:col-start-8" data-r>
          <LoopVideo
            className="aspect-[4/5] w-full object-cover"
            src="/video/creek.mp4"
            poster="/img/creek-poster.jpg"
            label="Meeuwen boven de Dubai Creek"
          />
        </div>
      </section>

      {/* Services as a printed price list beside the marina at night */}
      <section className="bg-tone" aria-label="Diensten" data-reveal>
        <div className="container-page grid gap-10 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32">
          <div className="relative min-h-[420px] overflow-hidden lg:col-span-5" data-r>
            <Image
              src="/img/marina.jpg"
              alt="Dubai Marina bij nacht"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover object-[35%_50%]"
              data-drift
            />
          </div>
          <PriceList
            className="lg:col-span-6 lg:col-start-7"
            title="Hoe we helpen"
            intro="Eén aanspreekpunt, van het eerste gesprek tot na de overdracht."
            groups={[
              {
                name: "Kopen",
                href: "/kopen/",
                rows: [
                  { name: "Jouw plan en budget op papier", value: "eerste gesprek" },
                  { name: "Wijken en ontwikkelaars vergelijken", value: "echte transacties" },
                  { name: "Elk document doorlopen", value: "tot de overdracht" },
                ],
              },
              {
                name: "Verkopen",
                href: "/verkopen/",
                rows: [
                  { name: "Een eerlijke vraagprijs", value: "onderbouwd", note: "Op basis van wat er echt betaald is in jouw gebouw en wijk." },
                  { name: "Een koper die past", value: "geen haast" },
                ],
              },
              {
                name: "Advies en portfolio",
                href: "/advies/",
                rows: [
                  { name: "Past Dubai bij jouw plan?", value: "vrijblijvend", note: "Ook als het antwoord nee is." },
                  { name: "Verhuur en de markt na de sleutel", value: "blijft bereikbaar" },
                ],
              },
            ]}
          />
        </div>
      </section>

      {/* The one loud moment: the real number */}
      <section className="dark bg-creek text-foreground" aria-labelledby="kosten-titel" data-reveal>
        <div className="container-page grid gap-12 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32">
          <div className="grid content-start gap-6 lg:col-span-5">
            <p className="text-display leading-none text-gold tabular-nums" data-r data-count="4">
              4%
            </p>
            <h2 id="kosten-titel" className="text-head max-w-[12ch]" data-r>Wat kopen echt kost</h2>
            <p className="measure text-muted-foreground" data-r>
              Overdrachtsbelasting bij elke aankoop in Dubai, plus een handvol vaste bedragen. Kies een prijs en zie het totaal, voordat
              iemand je een brochure laat zien.
            </p>
            <Link href="/kosten/" className="link justify-self-start" data-r>Elke kostenpost uitgelegd</Link>
          </div>
          <div className="light bg-paper p-6 text-ink sm:p-10 lg:col-span-6 lg:col-start-7" data-r>
            <CostCalculator />
          </div>
        </div>
      </section>

      {/* The people */}
      <section className="container-page grid gap-12 py-24 lg:grid-cols-12 lg:gap-5 lg:py-40" aria-labelledby="team-titel" data-reveal>
        <div className="grid content-start gap-6 lg:col-span-5">
          <h2 id="team-titel" className="text-head" data-r>De mensen achter Astrum</h2>
          <blockquote className="measure text-lead" data-r>
            “Je hebt één vast aanspreekpunt, in het Nederlands, van het eerste gesprek tot ver na de overdracht.”
          </blockquote>
          <Link href="/over-ons/" className="link justify-self-start" data-r>Waarom we het zo doen</Link>
        </div>
        <div className="grid grid-cols-2 items-end gap-4 lg:col-span-7 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-5">
          {team.map((p, i) => (
            <figure key={p.name} className={i === 0 ? "col-span-2 lg:col-span-1" : i === 2 ? "mb-0 lg:mb-24" : ""} data-r>
              <div className="overflow-hidden bg-tone">
                <Image
                  src={p.photo}
                  alt={`${p.name}, ${p.role.toLowerCase()} van Astrum`}
                  width={900}
                  height={1600}
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="aspect-[4/5] w-full object-cover object-[50%_25%] transition-transform duration-700 hover:scale-[1.03]"
                />
              </div>
              <figcaption className="mt-3 text-small">
                <strong className="block text-body font-medium">{p.name}</strong>
                <span className="text-stone">{p.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Insights */}
      <section className="bg-paper" aria-labelledby="inzichten-titel" data-reveal>
        <div className="container-page grid gap-12 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32">
          <div className="lg:col-span-4">
            <h2 id="inzichten-titel" className="text-head" data-r>Inzichten uit de markt</h2>
            <p className="mt-6 max-w-[32ch] text-stone" data-r>
              Wat we zien in Dubai, zonder verkooppraat. Ook de dingen die je liever vooraf weet.
            </p>
          </div>
          <ul className="grid lg:col-span-7 lg:col-start-6">
            {articles.map((a) => (
              <li key={a.slug} data-r>
                <Link
                  href={`/inzichten/${a.slug}/`}
                  className="group grid gap-2 py-6 transition-colors hover:text-creek sm:grid-cols-[1fr_auto] sm:gap-8"
                >
                  <span className="grid gap-1">
                    <span className="text-lead group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[0.2em]">{a.title}</span>
                    <span className="text-stone">{a.dek}</span>
                  </span>
                  <span className="text-small text-stone sm:pt-1.5">
                    {a.topic}, {a.minutes} min
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand line="Eerst praten. Dan pas kiezen." />
    </>
  );
}
