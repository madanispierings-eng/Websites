import { Star } from "lucide-react";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Social proof below the hero: the average rating that bachelor-medicine students gave, plus a few
 * short, anonymised quotes. Content reflects real student feedback reported by the course team.
 */

const RATING = "8,9";
const RATING_PCT = 89; // 8.9 / 10

const quotes = [
  { text: "De oefenvragen en oefententamens kwamen echt overeen met de tentamenvragen.", who: "Student Geneeskunde · jaar 2" },
  { text: "Heldere en complete samenvattingen — precies de stof die je voor het tentamen nodig hebt.", who: "Student Geneeskunde · jaar 1" },
  { text: "Bij elke oefenvraag staat uitleg, dus je leert echt van je fouten.", who: "Student Geneeskunde · jaar 2" },
];

function Stars({ pct = 100, className }: { pct?: number; className?: string }) {
  const row = (cls: string) => (
    <div className={cn("flex gap-0.5", cls)}>
      {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-4 fill-current" aria-hidden="true" />)}
    </div>
  );
  return (
    <div className={cn("relative inline-flex", className)} aria-hidden="true">
      {row("text-line")}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>{row("text-[#f5b301]")}</div>
    </div>
  );
}

export function HomeReviews() {
  return (
    <section className="border-y border-line bg-white" aria-labelledby="reviews-titel">
      <div className={cn(container, "grid gap-8 py-12 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:py-14")}>
        <div>
          <div className="flex items-end gap-2">
            <span className="font-serif text-6xl font-semibold leading-none text-navy">{RATING}</span>
            <span className="pb-1.5 text-lg font-medium text-muted-ink">/ 10</span>
          </div>
          <Stars pct={RATING_PCT} className="mt-3" />
          <h2 id="reviews-titel" className="mt-3 text-sm leading-relaxed text-muted-ink">
            Gemiddeld beoordeeld door studenten van de bachelor Geneeskunde in Leiden.
          </h2>
        </div>

        <ul className="grid gap-4 sm:grid-cols-3">
          {quotes.map((q) => (
            <li key={q.text} className="flex flex-col rounded-2xl border border-line bg-canvas p-5">
              <Stars className="text-[#f5b301]" />
              <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-navy/90">“{q.text}”</p>
              <p className="mt-4 text-xs font-medium text-muted-ink">{q.who}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
