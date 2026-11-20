import { MedicationStudio } from "@/components/medications/medication-studio";
import type { MedicationGroup } from "@/lib/data/core-medications";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";

// Development-only preview of the kernmedicatie study modes with placeholder data.

export const metadata = { title: "Voorbeeld kernmedicatie · MijnMedivo", robots: { index: false, follow: false } };

const groups: MedicationGroup[] = [
  {
    category: "Anti-emetica",
    medications: [
      { id: "m1", category: "Anti-emetica", subgroup: "Dopamine D2-antagonisten", name: "Metoclopramide",
        mechanism: "Blokkeert dopamine-D2-receptoren in de area postrema en de maag; anti-emetisch én prokinetisch.",
        indications: "Misselijkheid en braken, gastroparese.", sideEffects: "Extrapiramidale verschijnselen, rusteloosheid.",
        explanation: "Een anti-emeticum dat tegelijk de maag sneller laat legen (opvultekst)." },
      { id: "m2", category: "Anti-emetica", subgroup: "Serotonine 5-HT3-antagonisten", name: "Ondansetron",
        mechanism: "Blokkeert 5-HT3-receptoren in de area postrema en op vagale afferenten in de darm.",
        indications: "Misselijkheid/braken door chemotherapie en postoperatief.", sideEffects: "Obstipatie, hoofdpijn, QT-verlenging.",
        explanation: "Een krachtig anti-emeticum voor hevig braken (opvultekst)." },
    ],
  },
  {
    category: "Zuurremming",
    medications: [
      { id: "m3", category: "Zuurremming", subgroup: "Protonpompremmers", name: "Omeprazol",
        mechanism: "Remt irreversibel de H+/K+-ATPase van de pariëtale cel; sterke zuurremming.",
        indications: "Reflux, ulcus, maagbescherming bij NSAID's.", sideEffects: "Hoofdpijn, diarree; langdurig B12-/magnesiumtekort.",
        explanation: "De krachtigste zuurremmer: zet de zuurpomp zelf uit (opvultekst)." },
      { id: "m4", category: "Zuurremming", subgroup: "H2-antagonisten", name: "Famotidine",
        mechanism: "Blokkeert de histamine-H2-receptor op de pariëtale cel.",
        indications: "Maagklachten en reflux, ulcus.", sideEffects: "Hoofdpijn, veranderde ontlasting.",
        explanation: "Remt het zuur via de histaminereceptor; minder krachtig dan een PPI (opvultekst)." },
    ],
  },
];

export default function KernmedicatiePreview() {
  const total = groups.reduce((n, g) => n + g.medications.length, 0);
  return (
    <main className={cn(container, "flex-1 py-10")}>
      <p className="mb-6 text-sm text-muted-ink">Ontwikkelweergave met opvultekst.</p>
      <MedicationStudio groups={groups} total={total} />
    </main>
  );
}
