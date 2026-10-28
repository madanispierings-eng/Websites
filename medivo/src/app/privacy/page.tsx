import type { Metadata } from "next";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

const sections = [
  {
    title: "Welke gegevens we verwerken",
    items: [
      "Accountgegevens: naam, e-mailadres en een versleuteld wachtwoord (beheerd door onze authenticatieprovider).",
      "Studiegegevens die je zelf invult, zoals je studiejaar.",
      "Voortgang: gegeven antwoorden, afgevinkte leerdoelen, gemarkeerde vragen en bezochte vakken.",
      "Abonnementsstatus. Betaalgegevens worden verwerkt door Stripe; Medivo ontvangt geen kaart- of rekeninggegevens.",
    ],
  },
  {
    title: "Waarvoor",
    items: [
      "Om je toegang te geven tot het platform en de inhoud waarvoor je hebt betaald.",
      "Om je voortgang te tonen en oefensessies zoals 'fout beantwoorde vragen' mogelijk te maken.",
      "Om de dienst veilig te houden, bijvoorbeeld tegen misbruik van accounts.",
    ],
  },
  {
    title: "Cookies",
    items: [
      "We gebruiken alleen functionele cookies die nodig zijn om je ingelogd te houden. Er zijn geen advertentie- of trackingcookies, daarom vragen we geen cookietoestemming.",
    ],
  },
  {
    title: "Bewaren en verwijderen",
    items: [
      "Je profiel en voortgang bewaren we zolang je account bestaat.",
      "Verwijder je je account, dan worden je profiel en voortgang verwijderd. Gegevens die we wettelijk moeten bewaren, zoals facturen, bewaren we niet langer dan de wettelijke termijn.",
    ],
  },
  {
    title: "Je rechten",
    items: [
      "Je hebt onder de AVG recht op inzage, correctie, verwijdering en overdracht van je gegevens, en je kunt bezwaar maken tegen verwerking.",
      "Je kunt een klacht indienen bij de Autoriteit Persoonsgegevens.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main id="inhoud" className={cn(container, "flex-1 py-10 lg:py-14")}>
      <article className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-navy sm:text-[2.5rem]">Privacy</h1>
        <p className="mt-4 rounded-lg border border-[#e8c48a] bg-[#fdf6ec] px-4 py-3 text-sm text-navy">
          Concept. De gegevens van de verwerkingsverantwoordelijke en een contactadres worden vóór de lancering toegevoegd.
        </p>
        <p className="mt-6 leading-relaxed text-muted-ink">
          Medivo gaat zorgvuldig om met je gegevens en verzamelt niet meer dan nodig is om het platform te laten werken.
        </p>
        {sections.map((s) => (
          <section key={s.title} className="mt-8">
            <h2 className="text-xl font-semibold text-navy">{s.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-ink marker:text-blue">
              {s.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </section>
        ))}
      </article>
    </main>
  );
}
