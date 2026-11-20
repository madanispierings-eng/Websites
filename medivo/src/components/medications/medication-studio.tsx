"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Search, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CoreMedication, MedicationGroup } from "@/lib/data/core-medications";
import { cn } from "@/lib/utils";

type Mode = "kies" | "flashcards" | "uitleg";

export function MedicationStudio({ groups, total }: { groups: MedicationGroup[]; total: number }) {
  const [mode, setMode] = useState<Mode>("kies");
  const all = useMemo(() => groups.flatMap((g) => g.medications), [groups]);
  const categories = useMemo(() => groups.map((g) => g.category), [groups]);

  if (mode === "flashcards") return <Flashcards all={all} categories={categories} onBack={() => setMode("kies")} />;
  if (mode === "uitleg") return <Uitleg groups={groups} onBack={() => setMode("kies")} />;

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2">
        <ModeCard
          image="/images/onderdelen/flashcards.webp"
          title="Flashcards"
          body="De naam van het middel voorop, alles wat je moet kennen achterop. Oefen tot je ze allemaal kent."
          action="Start flashcards"
          onClick={() => setMode("flashcards")}
        />
        <ModeCard
          image="/images/onderdelen/kernmedicatie-uitleg.webp"
          title="Uitleg per middel"
          body="Lees per medicijn wat het is en hoe het werkt, met het werkingsmechanisme, de indicaties en de bijwerkingen."
          action="Bekijk de uitleg"
          onClick={() => setMode("uitleg")}
        />
      </div>
      <p className="mt-4 text-sm text-muted-ink">{total} middelen in {groups.length} groepen.</p>
    </div>
  );
}

function ModeCard({ image, title, body, action, onClick }: { image: string; title: string; body: string; action: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white text-left shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
    >
      <div className="relative aspect-[16/7] overflow-hidden bg-sky">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h2 className="text-lg font-semibold text-navy">{title}</h2>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-ink">{body}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue">
          {action}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function Facts({ m, className }: { m: CoreMedication; className?: string }) {
  return (
    <dl className={cn("space-y-3 text-left", className)}>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-blue">Werkingsmechanisme</dt>
        <dd className="mt-0.5 text-[0.95rem] leading-relaxed text-navy">{m.mechanism}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-blue">Indicatie(s)</dt>
        <dd className="mt-0.5 text-[0.95rem] leading-relaxed text-navy">{m.indications}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-blue">Bijwerkingen</dt>
        <dd className="mt-0.5 text-[0.95rem] leading-relaxed text-navy">{m.sideEffects}</dd>
      </div>
    </dl>
  );
}

function Flashcards({ all, categories, onBack }: { all: CoreMedication[]; categories: string[]; onBack: () => void }) {
  const [filter, setFilter] = useState<string>("all");
  const pool = useMemo(() => (filter === "all" ? all : all.filter((m) => m.category === filter)), [all, filter]);
  const [deck, setDeck] = useState<CoreMedication[]>(() => shuffle(pool));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());

  // Reset the deck whenever the category filter changes.
  const filterRef = useRef(filter);
  useEffect(() => {
    if (filterRef.current !== filter) {
      filterRef.current = filter;
      setDeck(shuffle(pool));
      setI(0);
      setFlipped(false);
      setKnown(new Set());
    }
  }, [filter, pool]);

  const card = deck[i] ?? null;
  const restart = (cards: CoreMedication[] = pool) => { setDeck(shuffle(cards)); setI(0); setFlipped(false); setKnown(new Set()); };
  const advance = (markKnown: boolean) => {
    if (!card) return;
    if (markKnown) setKnown((k) => new Set(k).add(card.id));
    setFlipped(false);
    setI((n) => n + 1);
  };

  // Keyboard: space/enter flips, arrows navigate.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("select, input, textarea, button")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === "ArrowRight") { setFlipped(false); setI((n) => Math.min(n + 1, deck.length)); }
      else if (e.key === "ArrowLeft") { setFlipped(false); setI((n) => Math.max(n - 1, 0)); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck.length]);

  const done = i >= deck.length;
  const unknown = deck.filter((m) => !known.has(m.id));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="text-navy">
          <ArrowLeft aria-hidden="true" /> Andere modus
        </Button>
        <label className="flex items-center gap-2 text-sm font-medium text-navy">
          Groep
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-white px-3 text-sm text-navy"
          >
            <option value="all">Alle groepen</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      {done ? (
        <section className="rounded-xl border border-line bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-success-soft text-success-ink">
            <Check className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-lg font-semibold text-navy">Ronde klaar</h2>
          <p className="mt-1 text-sm text-muted-ink">
            Je markeerde {known.size} van {deck.length} als gekend.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {unknown.length ? (
              <Button type="button" onClick={() => restart(unknown)} className="font-semibold">
                <RotateCcw aria-hidden="true" /> Oefen de {unknown.length} overige
              </Button>
            ) : null}
            <Button type="button" variant={unknown.length ? "outline" : "default"} onClick={() => restart()} className="font-semibold">
              <Shuffle aria-hidden="true" /> Opnieuw, alles
            </Button>
          </div>
        </section>
      ) : card ? (
        <>
          <div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted-ink">
            <span className="tabular-nums">Kaart {i + 1} van {deck.length}</span>
            <span className="tabular-nums">{known.size} gekend</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-sky" aria-hidden="true">
            <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${(i / deck.length) * 100}%` }} />
          </div>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-pressed={flipped}
            className="mt-4 flex min-h-[18rem] w-full flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-8 text-center shadow-[var(--shadow-card)] transition-colors hover:border-[#c3d3e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            {!flipped ? (
              <>
                {/* Alleen de naam voorop: de groep/klasse zou het antwoord verklappen. */}
                <p className="text-2xl font-bold text-navy sm:text-3xl">{card.name}</p>
                <p className="mt-4 text-sm text-muted-ink">Tik of druk op spatie om om te draaien</p>
              </>
            ) : (
              <div className="w-full max-w-xl">
                <p className="text-lg font-semibold text-navy">{card.name}</p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted-ink">
                  {card.subgroup ? `${card.category} · ${card.subgroup}` : card.category}
                </p>
                <Facts m={card} className="mt-3" />
              </div>
            )}
          </button>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" disabled={i === 0} onClick={() => { setFlipped(false); setI((n) => Math.max(n - 1, 0)); }}>
              <ArrowLeft aria-hidden="true" /> Vorige
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => advance(false)} className="border-line text-navy">Nog oefenen</Button>
              <Button type="button" onClick={() => advance(true)} className="font-semibold">
                <Check aria-hidden="true" /> Ik ken dit
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-ink">Geen middelen in deze groep.</p>
      )}
    </div>
  );
}

function Uitleg({ groups, onBack }: { groups: MedicationGroup[]; onBack: () => void }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!needle) return groups;
    return groups
      .map((g) => ({
        category: g.category,
        medications: g.medications.filter((m) =>
          [m.name, m.category, m.subgroup ?? "", m.mechanism, m.indications, m.sideEffects, m.explanation]
            .join(" ").toLowerCase().includes(needle),
        ),
      }))
      .filter((g) => g.medications.length > 0);
  }, [groups, needle]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="text-navy">
          <ArrowLeft aria-hidden="true" /> Andere modus
        </Button>
        <label className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-ink" aria-hidden="true" />
          <span className="sr-only">Zoek een medicijn</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op naam, groep of werking…"
            className="h-10 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm text-navy"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-ink">Geen middelen gevonden voor “{q}”.</p>
      ) : (
        <div className="space-y-8">
          {filtered.map((g) => (
            <section key={g.category} aria-labelledby={`cat-${g.category}`}>
              <h2 id={`cat-${g.category}`} className="text-sm font-semibold uppercase tracking-[0.06em] text-muted-ink">{g.category}</h2>
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                {g.medications.map((m) => (
                  <article key={m.id} className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)]">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg font-semibold text-navy">{m.name}</h3>
                      {m.subgroup ? <span className="rounded-full bg-sky px-2.5 py-0.5 text-xs font-medium text-blue">{m.subgroup}</span> : null}
                    </div>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-navy/90">{m.explanation}</p>
                    <Facts m={m} className="mt-4 border-t border-line pt-4" />
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
