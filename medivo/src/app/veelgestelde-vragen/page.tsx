import type { Metadata } from "next";
import { FaqList } from "@/components/faq-list";
import { faq } from "@/lib/faq";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Veelgestelde vragen",
  description: "Antwoorden over toegang, inhoud, abonnementen, betalen en je account bij Medivo.",
  alternates: { canonical: "/veelgestelde-vragen" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.flatMap((g) =>
    g.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  ),
};

export default function FaqPage() {
  return (
    <main id="inhoud" className={cn(container, "flex-1 py-10 lg:py-14")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <h1 className="text-3xl font-bold tracking-[-0.02em] text-navy sm:text-[2.5rem]">Veelgestelde vragen</h1>
      <p className="mt-3 max-w-2xl text-muted-ink">Over toegang, inhoud, abonnementen en je gegevens.</p>
      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Onderwerpen" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {faq.map((g) => (
              <li key={g.title}>
                <a href={`#${g.title.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="block rounded-md px-3 py-2 text-sm font-medium text-navy hover:bg-sky">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-10">
          {faq.map((g) => (
            <section key={g.title} id={g.title.toLowerCase().replace(/[^a-z]+/g, "-")} className="scroll-mt-24" aria-labelledby={`${g.title}-t`}>
              <h2 id={`${g.title}-t`} className="mb-4 text-xl font-semibold text-navy">{g.title}</h2>
              <FaqList items={g.items} />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
