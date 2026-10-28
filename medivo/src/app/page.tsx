import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BookOpenText, Check, ClipboardList, FileText, LayoutGrid, ListChecks, MessageCircleQuestion, Smartphone, Target,
} from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { FaqList } from "@/components/faq-list";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { getCourses } from "@/lib/data/catalog";
import { faq } from "@/lib/faq";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";

const highlights = [
  "Ingedeeld per vak en per onderwerp",
  "Afgestemd op de opbouw van de Leidse bachelor",
  "Oefenvragen met uitleg bij elk antwoord",
];

const features = [
  { icon: LayoutGrid, label: "Alle bachelorvakken" },
  { icon: FileText, label: "Duidelijke samenvattingen" },
  { icon: Target, label: "Oefen gericht per onderwerp" },
  { icon: ClipboardList, label: "Oude tentamens" },
  { icon: Smartphone, label: "Altijd en overal toegankelijk" },
];

const steps = [
  { icon: LayoutGrid, title: "Kies je vak", body: "Elk vak van jaar 1 tot en met 3 heeft een eigen overzicht met dezelfde vaste indeling." },
  { icon: BookOpenText, title: "Leer de stof", body: "Lees de samenvatting per onderwerp en vink leerdoelen af die je beheerst." },
  { icon: ListChecks, title: "Oefen en controleer", body: "Beantwoord vragen per onderwerp, lees de uitleg en zie per onderwerp hoe je ervoor staat." },
];

const pillars = [
  { title: "Volledige samenvatting", body: "Hoofdstukken per onderwerp, met inhoudsopgave, tabellen, afbeeldingen en zoeken binnen de tekst." },
  { title: "Leerdoelen", body: "Alle leerdoelen per onderwerp, af te vinken, met een directe link naar de bijbehorende stof." },
  { title: "Oude tentamens", body: "Een overzicht per jaar en type, met bronvermelding. Alleen materiaal waarvoor toestemming is." },
  { title: "Oefenen per onderwerp", body: "Eén vraag tegelijk, feedback na het antwoorden en een tentamenmodus met timer." },
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
            </Reveal>
          </div>
        </div>

        {/* Feature bar */}
        <div className={cn(container, "relative z-10 order-3 -mt-10 pb-12 lg:-mt-20")}>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-[var(--shadow-lift)] sm:grid-cols-3 lg:grid-cols-5">
            {features.map(({ icon: Icon, label }, i) => (
              <li
                key={label}
                className={cn("flex flex-col items-center gap-2.5 bg-white px-4 py-5 text-center", i === features.length - 1 && "col-span-2 lg:col-span-1")}
              >
                <Icon className="size-6 text-blue" strokeWidth={1.6} aria-hidden="true" />
                <span className="text-sm font-medium text-navy">{label}</span>
              </li>
            ))}
          </ul>
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
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-ink">Jaar {year}</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-white" aria-labelledby="werkwijze-titel">
        <div className={cn(container, "py-16 lg:py-24")}>
          <h2 id="werkwijze-titel" className="text-3xl font-bold tracking-[-0.02em] text-navy sm:text-4xl">Zo werkt Medivo</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="rounded-xl border border-line bg-canvas p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-navy text-sm font-semibold text-white">{i + 1}</span>
                  <Icon className="size-5 text-blue" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-navy">{title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-ink">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Learning experience */}
      <section className={cn(container, "grid items-center gap-12 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-24")} aria-labelledby="ervaring-titel">
        <div>
          <h2 id="ervaring-titel" className="text-3xl font-bold tracking-[-0.02em] text-navy sm:text-4xl">
            Elk vak, dezelfde vier onderdelen
          </h2>
          <p className="mt-3 text-muted-ink">Je weet altijd waar je iets vindt. Zo besteed je je tijd aan leren, niet aan zoeken.</p>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {pillars.map((p) => (
              <div key={p.title}>
                <dt className="font-semibold text-navy">{p.title}</dt>
                <dd className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-ink">{p.body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <PracticePreview />
      </section>

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

/** A schematic of the practice screen. Lines stand in for text: no example medical content is shown. */
function PracticePreview() {
  return (
    <figure className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-lift)] sm:p-7">
      <div aria-hidden="true">
        <div className="flex items-center justify-between">
          <div className="h-3 w-32 rounded-full bg-navy/80" />
          <div className="h-7 w-28 rounded-md border border-line" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 w-16 rounded-full bg-muted-ink/30" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sky">
            <div className="h-full w-[30%] rounded-full bg-success" />
          </div>
        </div>
        <div className="mt-5 space-y-2 rounded-lg bg-sky p-4">
          <div className="h-2.5 w-full rounded-full bg-navy/20" />
          <div className="h-2.5 w-11/12 rounded-full bg-navy/20" />
          <div className="h-2.5 w-2/3 rounded-full bg-navy/20" />
        </div>
        <ul className="mt-4 space-y-2">
          {["A", "B", "C", "D"].map((l) => (
            <li
              key={l}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                l === "B" ? "border-accent-blue bg-sky/60" : "border-line",
              )}
            >
              <span className={cn("grid size-4 place-items-center rounded-full border", l === "B" ? "border-accent-blue" : "border-muted-ink/40")}>
                {l === "B" ? <span className="size-2 rounded-full bg-accent-blue" /> : null}
              </span>
              <span className="text-xs font-semibold text-navy">{l}.</span>
              <span className={cn("h-2 rounded-full bg-navy/15", l === "C" ? "w-3/4" : "w-1/2")} />
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-success/30 bg-success-soft p-4">
          <Check className="mt-0.5 size-5 shrink-0 rounded-full bg-success p-0.5 text-white" strokeWidth={3} />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-28 rounded-full bg-success/60" />
            <div className="h-2 w-full rounded-full bg-success/25" />
            <div className="h-2 w-4/5 rounded-full bg-success/25" />
          </div>
        </div>
      </div>
      <figcaption className="mt-5 text-sm text-muted-ink">
        Schematische weergave van het oefenscherm: na het indienen zie je direct of je antwoord juist is, met uitleg.
      </figcaption>
    </figure>
  );
}
