"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Slide = { key: string; tab: string; path: string; caption: string; src: string };

const slides: Slide[] = [
  { key: "samenvatting", tab: "Samenvatting", path: "/samenvatting", src: "/images/showcase/samenvatting.webp",
    caption: "Interactieve samenvatting per onderwerp, met inhoudsopgave, klinische relevantie en tentamenfocus." },
  { key: "controlevragen", tab: "Controlevragen", path: "/samenvatting", src: "/images/showcase/controlevragen.webp",
    caption: "Test jezelf onderaan elk hoorcollege: typ je antwoord en vergelijk het met het modelantwoord." },
  { key: "oefenen", tab: "Oefenen", path: "/oefenen", src: "/images/showcase/oefenen.webp",
    caption: "50 oefenvragen per onderwerp, in verschillende vormen en met uitleg na elk antwoord." },
  { key: "flashcards", tab: "Flashcards", path: "/flashcards", src: "/images/showcase/flashcards.webp",
    caption: "Stamp de kernbegrippen per onderwerp met flashcards die bijhouden wat je al beheerst." },
  { key: "leerdoelen", tab: "Leerdoelen", path: "/leerdoelen", src: "/images/showcase/leerdoelen.webp",
    caption: "Elk leerdoel uitgebreid uitgewerkt, met passende uitlegvideo's erbij." },
];

export function ShowcaseCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const regionRef = useRef<HTMLDivElement>(null);

  const go = useCallback((n: number) => setIndex((n + slides.length) % slides.length), []);

  // Auto-advance, paused on hover/focus and when the tab is hidden; off for reduced motion.
  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 5500);
    return () => window.clearInterval(id);
  }, [reduce, paused]);

  const active = slides[index];

  return (
    <div
      ref={regionRef}
      className="relative"
      role="group"
      aria-roledescription="carousel"
      aria-label="Voorbeeld van een vak: Mechanisms of Disease 2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
      }}
    >
      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Onderdelen van een vak">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => go(i)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              i === index ? "bg-navy text-white" : "border border-line bg-white text-navy hover:bg-sky",
            )}
          >
            {s.tab}
          </button>
        ))}
      </div>

      {/* Browser frame */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-lift)]">
        <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-3 rounded-full bg-[#e2574c]" />
            <span className="size-3 rounded-full bg-[#e6b34a]" />
            <span className="size-3 rounded-full bg-[#56bd5b]" />
          </span>
          <span className="ml-2 flex-1 truncate rounded-md bg-white px-3 py-1 text-xs text-muted-ink ring-1 ring-line" aria-hidden="true">
            medivo.nl/vakken/mechanisms-of-disease-2{active.path}
          </span>
        </div>
        <div className="relative overflow-hidden bg-canvas">
          <div
            className={cn("flex", !reduce && "transition-transform duration-500 ease-out")}
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((s, i) => (
              <div key={s.key} className="w-full shrink-0" aria-hidden={i !== index}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt={`${s.tab} — voorbeeld uit Mechanisms of Disease 2`}
                  width={1440}
                  height={900}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="block aspect-[1440/900] w-full object-cover object-top"
                />
              </div>
            ))}
          </div>

          {/* Arrows */}
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Vorige"
            className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/90 text-navy shadow-md backdrop-blur transition-colors hover:bg-white"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Volgende"
            className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/90 text-navy shadow-md backdrop-blur transition-colors hover:bg-white"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Caption + dots */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-[0.95rem] leading-relaxed text-muted-ink" aria-live="polite">{active.caption}</p>
        <ol className="flex shrink-0 gap-1.5" aria-hidden="true">
          {slides.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => go(i)}
                tabIndex={-1}
                aria-label={`Ga naar ${s.tab}`}
                className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-accent-blue" : "w-2 bg-line hover:bg-muted-ink/40")}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
