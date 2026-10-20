import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand, FaqList } from "@/components/sections";
import { faqs } from "@/lib/faq";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Veelgestelde vragen over vastgoed in Dubai",
  description:
    "Antwoorden op de vragen die Nederlanders stellen over kopen, kosten, visum, verhuur en verkopen in Dubai.",
  alternates: { canonical: "/vragen/" },
};

const topics = ["Kopen", "Kosten", "Visum en wonen", "Op afstand", "Verkopen"] as const;

const pictures: Partial<Record<(typeof topics)[number], { src: string; alt: string }>> = {
  Kosten: { src: "/img/skyline.jpg", alt: "De skyline van Dubai in de avondzon" },
  "Visum en wonen": { src: "/img/marina.jpg", alt: "Dubai Marina bij nacht" },
  Verkopen: { src: "/img/duo.jpg", alt: "Pim Verberg en Denise Birjmohun van Astrum" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function VragenPage() {
  return (
    <>
      <section data-reveal>
        <div className="container-page grid gap-12 pt-16 pb-24 lg:grid-cols-12 lg:gap-5 lg:pt-24 lg:pb-32">
          <div className="grid content-start gap-8 lg:col-span-5 lg:self-center">
            <h1 className="text-head" data-r>Wat je vooraf wilt weten</h1>
            <ul className="grid gap-1 text-muted-foreground" data-r>
              <li>Kantoor in {site.city}</li>
              <li>Gesprekken in het Nederlands, ter plekke of via video</li>
              <li><a className="link text-ink" href={`mailto:${site.email}`}>{site.email}</a></li>
            </ul>
            <nav aria-label="Onderwerpen" className="flex flex-wrap gap-x-6 gap-y-2" data-r>
              {topics.map((t) => (
                <a key={t} href={`#${t.replace(/\s+/g, "-").toLowerCase()}`} className="link">{t}</a>
              ))}
            </nav>
          </div>
          <div className="relative lg:col-span-6 lg:col-start-7" data-r>
            <div className="relative aspect-[4/5] overflow-hidden lg:aspect-[5/6]">
              <Image src="/img/old-city.jpg" alt="Een windtoren in de oude wijk Al Fahidi in Dubai" fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover object-[30%_50%]" data-drift />
            </div>
            <div className="absolute -bottom-10 -left-6 aspect-square w-[36%] overflow-hidden lg:-left-10">
              <Image src="/img/palm.jpg" alt="Palm Jumeirah, gezien vanuit het vliegtuig" fill sizes="20vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {topics.map((t, i) => (
        <section
          key={t}
          id={t.replace(/\s+/g, "-").toLowerCase()}
          className={i % 2 ? "bg-paper" : undefined}
          aria-labelledby={`h-${i}`}
          data-reveal
        >
          <div className="container-page grid gap-8 py-20 lg:grid-cols-12 lg:gap-5 lg:py-24">
            <div className="lg:col-span-4">
              <h2 id={`h-${i}`} className="text-head" data-r>{t}</h2>
              {pictures[t] && (
                <div className="relative mt-10 aspect-square max-w-xs overflow-hidden" data-r>
                  <Image src={pictures[t]!.src} alt={pictures[t]!.alt} fill sizes="20rem" className="object-cover" />
                </div>
              )}
            </div>
            <div className="lg:col-span-7 lg:col-start-6" data-r>
              <FaqList items={faqs.filter((f) => f.topic === t)} />
            </div>
          </div>
        </section>
      ))}

      <CtaBand line="Staat jouw vraag er niet bij?" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </>
  );
}
