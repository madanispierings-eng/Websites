import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ObjectiveExplanation } from "@/components/objectives/objective-explanation";
import { ObjectiveItem } from "@/app/vakken/[slug]/leerdoelen/objective-item";
import { ObjectivesProgressProvider, ObjectivesProgressSummary } from "@/app/vakken/[slug]/leerdoelen/objectives-progress";
import { parseMarkup } from "@/lib/content/markup";
import { isLaunched } from "@/lib/env";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Voorbeeld leerdoelen", robots: { index: false, follow: false } };

// Content-free placeholder explanation to judge the layout.
const blocks = parseMarkup(`Hier staat de **uitgewerkte uitleg** bij het leerdoel (opvultekst). Een tweede zin, zodat de alinea over meerdere regels loopt en het ritme te beoordelen is.

| Kolom 1 | Kolom 2 | Kolom 3 |
| --- | --- | --- |
| waarde | opvultekst | opvultekst |
| waarde | opvultekst | opvultekst |

**Tussenkop in de uitleg**

- Eerste punt (opvultekst)
- Tweede punt, iets langer zodat het over twee regels kan lopen (opvultekst)

$$ t_{1/2} = \\frac{0{,}7 \\cdot V_d}{Cl} $$`);

const explanation = {
  blocks,
  imageUrls: {},
  videos: [
    { youtubeId: "PGzT3cTPah8", title: "Voorbeeldvideo met een titel van gemiddelde lengte", channel: "Kanaal", why: "Waarom deze video helpt (opvultekst)." },
    { youtubeId: "L1W0q1kEof4", title: "Tweede voorbeeldvideo", channel: "Kanaal", why: null },
  ],
};

export default function Page() {
  if (isLaunched) notFound();
  return (
    <main id="inhoud" className={cn(container, "flex-1 py-10")}>
      <p className="mb-6 rounded-lg border border-[#e8c48a] bg-[#fdf6ec] px-4 py-3 text-sm text-navy">Ontwikkelweergave met opvultekst. Er wordt niets opgeslagen.</p>
      <h1 className="mb-6 text-3xl font-bold text-navy">Leerdoelen</h1>
      <ObjectivesProgressProvider initialCompleted={["voorbeeld-3"]} objectiveIds={["voorbeeld-1", "voorbeeld-2", "voorbeeld-3"]}>
      <div className="mb-4 max-w-xs rounded-xl border border-line bg-white p-5"><h2 className="font-semibold text-navy">Jouw voortgang</h2><ObjectivesProgressSummary /></div>
      <section className="max-w-4xl rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-lg font-semibold text-navy"><span className="mr-2 tabular-nums text-muted-ink">1</span>Onderwerp 1</h2>
        <ul className="mt-2 divide-y divide-line">
          {[1, 2, 3].map((n) => (
            <ObjectiveItem
              key={n}
              id={`voorbeeld-${n}`}
              body={`Voorbeeldleerdoel ${n}: een leerdoel dat zo lang is dat het over twee regels loopt, zoals in de echte lijst (opvultekst).`}
              canTrack={false}
              path="/vakken/voorbeeld/leerdoelen"
              explanation={n < 3 ? <ObjectiveExplanation id={`voorbeeld-${n}`} explanation={explanation} /> : undefined}
            />
          ))}
        </ul>
      </section>
      </ObjectivesProgressProvider>
    </main>
  );
}
