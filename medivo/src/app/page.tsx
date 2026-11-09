import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, MessageCircleQuestion } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { FaqList } from "@/components/faq-list";
import { HomeFeatures } from "@/components/home-features";
import { HeroReviews } from "@/components/hero-reviews";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { getCourses } from "@/lib/data/catalog";
import { faq } from "@/lib/faq";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";

const highlights = [
  "Interactieve samenvattingen, flashcards en oefenvragen met uitleg",
  "Leerdoelen per vak uitgewerkt, met uitlegvideo's erbij",
  "Je voortgang per onderwerp bijgehouden, zodat je je zwakke punten ziet",
];

export default async function HomePage() {
  const courses = await getCourses();
  const years = [1, 2, 3].map((y) => ({ year: y, courses: courses.filter((c) => c.studyYear === y) }));

  return (
    <main id="inhoud">
      {/* Hero */}
      <section className="relative flex flex-col overflow-hidden bg-gradient-to-b from-[#eef4fb] to-canvas lg:block">
        <div className="relative order-2 aspect-[4/3] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[54%]">
          <Image
            src="/images/leiden-universiteit.webp"
            alt="Historisch universiteitsgebouw van baksteen aan het water in Leiden"
            fill
            priority
            sizes="(min-width: 1024px) 54vw, 100vw"
            className="object-cover object-[60%_50%] [mask-image:linear-gradient(to_bottom,black_70%,transparent)] lg:[mask-image:linear-gradient(to_right,transparent,black_30%)]"
          />
          <p
            aria-hidden="true"
            className="absolute right-6 top-6 hidden rotate-[-8deg] text-right font-hand text-[1.7rem] leading-[1.05] text-navy lg:right-12 lg:top-10 lg:block"
          >
            Samen
            <br />
            naar succes
            <br />
            in Leiden!
          </p>
        </div>
        <div className={cn(container, "relative order-1 grid gap-10 pb-8 pt-10 lg:grid-cols-2 lg:gap-0 lg:pb-28 lg:pt-16")}>
          <div className="relative z-10 max-w-xl lg:py-10">
            <Reveal>
              <h1 className="text-[2.4rem] font-bold leading-[1.06] tracking-[-0.03em] text-navy sm:text-5xl lg:text-[3.3rem] xl:text-[3.6rem]">
                De complete studieplek voor <span className="text-blue">Leiden Geneeskunde</span>
              </h1>
            </Reveal>
            <Reveal delay={0.06}>
              <p className="mt-5 text-lg leading-relaxed text-muted-ink">
                Samenvattingen, leerdoelen, oude tentamens en oefenvragen voor alle vakken van de bachelor Geneeskunde aan de
                Universiteit Leiden.
              </p>
              <ul className="mt-6 space-y-2.5">
                {highlights.map((h) => (
                  <li key={h} className="flex items-center gap-3 text-[0.95rem] text-navy/85">
                    <Check className="size-[1.1rem] shrink-0 text-success" strokeWidth={2.5} aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-8 h-12 px-6 text-[0.95rem] font-semibold">
                <Link href="/vakken">
                  Bekijk alle vakken <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <HeroReviews />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Courses by year */}
      <section className={cn(container, "py-16 lg:py-24")} aria-labelledby="vakken-titel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 id="vakken-titel" className="text-3xl font-bold tracking-[-0.02em] text-navy sm:text-4xl">
              Alle vakken van de bachelor
            </h2>
            <p className="mt-3 text-muted-ink">Alle vakken van jaar 1 tot en met jaar 3, per studiejaar geordend.</p>
          </div>
          <Link href="/vakken" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:underline">
            Naar het vakkenoverzicht <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {years.map(({ year, courses }) => (
          <div key={year} className="mt-10">
            <h3 className="text-xl font-semibold text-navy">Jaar {year}</h3>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} showYear={false} titleAs="h4" />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Learning experience */}
      <HomeFeatures />

      {/* FAQ */}
      <section className="border-t border-line bg-white" aria-labelledby="faq-titel">
        <div className={cn(container, "grid gap-10 py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:py-24")}>
          <div>
            <h2 id="faq-titel" className="text-3xl font-bold tracking-[-0.02em] text-navy sm:text-4xl">Veelgestelde vragen</h2>
            <p className="mt-3 text-muted-ink">Staat je vraag er niet bij?</p>
            <Link href="/veelgestelde-vragen" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:underline">
              Alle vragen bekijken <MessageCircleQuestion className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <FaqList items={faq.flatMap((g) => g.items).slice(0, 5)} />
        </div>
      </section>

      {/* Closing CTA */}
      <section className={cn(container, "py-16")}>
        <div className="relative overflow-hidden rounded-2xl bg-navy px-6 py-12 text-white sm:px-12">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-blue/40 blur-3xl" aria-hidden="true" />
          <h2 className="relative max-w-xl text-3xl font-bold tracking-[-0.02em]">Begin bij het vak waar je nu mee bezig bent</h2>
          <p className="relative mt-3 max-w-xl text-white/75">Maak een gratis account om je voortgang bij te houden.</p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 bg-white px-6 font-semibold text-navy hover:bg-white/90">
              <Link href="/vakken">Bekijk alle vakken</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/30 bg-transparent px-6 font-semibold text-white hover:bg-white/10 hover:text-white">
              <Link href="/registreren">Account aanmaken</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
