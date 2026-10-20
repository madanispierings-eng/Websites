import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/sections";
import { site, team, values } from "@/lib/site";

export const metadata: Metadata = {
  title: "Over Astrum",
  description:
    "Astrum is een boutique makelaar in Dubai, opgericht door Pim Verberg, Denise Birjmohun en Ron Veen. Persoonlijk, in het Nederlands, met echte verkoopprijzen.",
  alternates: { canonical: "/over-ons/" },
};

export default function OverOnsPage() {
  return (
    <>
      <section className="container-page grid gap-10 pt-16 pb-20 lg:grid-cols-12 lg:gap-5 lg:pt-24 lg:pb-28" data-reveal>
        <div className="grid content-start gap-8 lg:col-span-6">
          <h1 className="text-head max-w-[14ch]" data-r>Over Astrum</h1>
          <p className="measure text-lead" data-r>
            Boutique in aanpak, persoonlijk in contact. Astrum helpt Nederlanders die in Dubai willen kopen of verkopen, en blijft klein, zodat je altijd met dezelfde mensen praat.
          </p>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden lg:col-span-5 lg:col-start-8" data-r>
          <Image
            src="/img/duo.jpg"
            alt="Pim Verberg en Denise Birjmohun in een sales gallery in Dubai"
            fill
            priority
            sizes="(min-width:1024px) 40vw, 100vw"
            className="object-cover object-[50%_25%]"
            data-drift
          />
        </div>
      </section>

      {/* The letter, on paper */}
      <section className="bg-tone py-24 lg:py-32" aria-labelledby="brief" data-reveal>
        <article className="zigzag-bottom mx-auto grid w-[min(640px,calc(100%-40px))] gap-5 bg-paper px-6 pt-14 pb-16 text-ink sm:px-14" data-r>
          <Image src="/img/pim-face.jpg" alt="" width={88} height={88} className="size-11 rounded-full object-cover" />
          <h2 id="brief" className="text-lead font-medium">Waarom we het zo doen</h2>
          <p>Wij zijn Pim, Denise en Ron. We helpen Nederlanders die in Dubai willen kopen of verkopen, en we doen dat zoals we het zelf zouden willen.</p>
          <p>
            Dubai verkoopt zichzelf met torens en beloftes. Wij werken met{" "}
            <mark className="-mx-0.5 bg-gold-light box-decoration-clone px-0.5 text-ink">echte verkoopprijzen in plaats van beloftes</mark>: wat er in een gebouw
            werkelijk betaald is, leggen we naast de brochure.
          </p>
          <p>Je hebt één vast aanspreekpunt, in het Nederlands, van het eerste gesprek tot ver na de overdracht. Geen callcenter, geen wisselende agents.</p>
          <p>Pim deelt op Instagram wat hij in de markt ziet, ook de dingen die andere makelaars liever overslaan. Volg gerust een tijdje mee voordat je belt.</p>
          <p className="mt-4 text-lead">
            Pim, Denise en Ron
            <span className="block text-small text-stone">Oprichters van Astrum</span>
          </p>
          <p className="mt-4 border-t-4 border-dotted border-tone pt-6">
            <a className="link text-lead" href={`mailto:${site.email}`}>{site.email}</a>
          </p>
        </article>
      </section>

      <section className="container-page grid gap-12 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32" aria-labelledby="waarden" data-reveal>
        <h2 id="waarden" className="text-head lg:col-span-4" data-r>Waar we voor staan</h2>
        <ol className="grid gap-6 lg:col-span-7 lg:col-start-6">
          {values.map((v, i) => (
            <li key={v} className="grid grid-cols-[3.5rem_1fr] items-baseline gap-4" data-r>
              <span className="text-head leading-none text-gold-deep" aria-hidden="true">{["I", "II", "III"][i]}</span>
              <span className="text-lead">{v}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-paper" aria-labelledby="team" data-reveal>
        <div className="container-page py-24 lg:py-32">
          <h2 id="team" className="text-head" data-r>Het team</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {team.map((p, i) => (
              <figure key={p.name} className={i === 1 ? "lg:mt-24" : i === 2 ? "lg:mt-12" : ""} data-r>
                <div className="overflow-hidden bg-tone">
                  <Image
                    src={p.photo}
                    alt={`${p.name}, ${p.role.toLowerCase()} van Astrum`}
                    width={900}
                    height={1600}
                    sizes="(min-width:1024px) 30vw, (min-width:640px) 50vw, 100vw"
                    className="aspect-[4/5] w-full object-cover object-[50%_25%] transition-transform duration-700 hover:scale-[1.03]"
                  />
                </div>
                <figcaption className="mt-4">
                  <strong className="block text-lead font-medium">{p.name}</strong>
                  <span className="text-stone">{p.role}</span>
                  {p.note && <span className="mt-1 block text-small text-stone">{p.note}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <CtaBand line="Het begint met een eerlijk gesprek." />
    </>
  );
}
