"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One elegant, auto rotating student review inside the hero. Content is real student feedback reported
 * by the course team; keep it that way. The 8,9 is the average they gave. No invented review counts.
 */

const RATING = "8,9";
const reviews = [
  { text: "De oefenvragen en oefententamens kwamen echt overeen met de tentamenvragen.", who: "Student Geneeskunde · jaar 2" },
  { text: "Heldere en complete samenvattingen met precies de stof die je voor het tentamen nodig hebt.", who: "Student Geneeskunde · jaar 1" },
  { text: "Bij elke oefenvraag staat uitleg, dus je leert echt van je fouten.", who: "Student Geneeskunde · jaar 2" },
];

export function HeroReviews() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const n = reviews.length;
  const go = (k: number) => setIndex((k + n) % n);

  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => setIndex((x) => (x + 1) % n), 7000);
    return () => window.clearInterval(id);
  }, [reduce, paused, n]);

  const r = reviews[index];

  return (
    <div
      className="mt-8 max-w-md"
      role="group"
      aria-roledescription="carousel"
      aria-label="Beoordelingen van studenten"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex items-start justify-between gap-4">
        <div key={index} className="min-w-0 animate-in fade-in duration-500" aria-live="polite">
          <div className="flex gap-0.5 text-[#f5b301]" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-3.5 fill-current" />)}
          </div>
          <p className="mt-2 text-[0.95rem] italic leading-relaxed text-navy/90">“{r.text}”</p>
          <p className="mt-1.5 text-xs font-medium text-muted-ink">{r.who}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => go(index - 1)} aria-label="Vorige beoordeling"
            className="grid size-8 place-items-center rounded-full border border-line text-navy transition-colors hover:bg-sky">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Volgende beoordeling"
            className="grid size-8 place-items-center rounded-full border border-line text-navy transition-colors hover:bg-sky">
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <ol className="flex gap-1.5" aria-hidden="true">
          {reviews.map((_, i) => (
            <li key={i}>
              <button type="button" onClick={() => go(i)} tabIndex={-1} aria-label={`Beoordeling ${i + 1}`}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-accent-blue" : "w-1.5 bg-line hover:bg-muted-ink/40")} />
            </li>
          ))}
        </ol>
        <span className="text-xs text-muted-ink">
          <span className="font-semibold text-navy">{RATING}/10</span> beoordeeld door studenten Geneeskunde
        </span>
      </div>
    </div>
  );
}
