"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleCheck, CircleX, RotateCcw, Search, Shuffle } from "lucide-react";
import { MarkupText } from "@/components/markup-text";
import { Button } from "@/components/ui/button";
import type { Disorder, DisorderTheme, ExamCase } from "@/lib/data/disorders";
import { cn } from "@/lib/utils";

type Mode = "kies" | "overzicht" | "flashcards" | "casussen";

/** What the course's niveaulijst asks per level, in the course's own words. */
const LEVELS = {
  1: {
    short: "Niveau 1",
    tag: "volledig kennen",
    what: "Epidemiologie, pathogenese, klinisch beeld, diagnostiek, differentiaaldiagnose, de meest gangbare therapie en de prognose.",
  },
  2: {
    short: "Niveau 2",
    tag: "herkennen voor de DD",
    what: "De klinische presentatie kunnen betrekken bij het opstellen van een differentiaaldiagnose.",
  },
} as const;

export function DisorderStudio({ themes }: { themes: DisorderTheme[] }) {
  const [mode, setMode] = useState<Mode>("kies");
  const unique = useMemo(() => {
    const seen = new Map<string, Disorder>();
    for (const t of themes) for (const d of t.disorders) if (!seen.has(d.id)) seen.set(d.id, d);
    return [...seen.values()];
  }, [themes]);
  const themeLabels = useMemo(() => new Map(themes.map((t) => [t.id, t.label])), [themes]);

  if (mode === "overzicht") return <Overzicht themes={themes} themeLabels={themeLabels} onBack={() => setMode("kies")} />;
  if (mode === "flashcards") return <Flashcards themes={themes} all={unique} themeLabels={themeLabels} onBack={() => setMode("kies")} />;
  if (mode === "casussen") return <Cases themes={themes} all={unique} onBack={() => setMode("kies")} />;

  const n1 = unique.filter((d) => d.level === 1).length;
  const n2 = unique.filter((d) => d.level === 2).length;
  const nCases = unique.reduce((n, d) => n + d.cases.length, 0);
  return (
    <div>
      <div className={cn("grid gap-5 sm:grid-cols-2", nCases > 0 && "lg:grid-cols-3")}>
        <ModeCard
          image="/images/onderdelen/ziektebeelden.webp"
          title="Overzicht per thema"
          body="Klap een thema open voor de ziektebeelden die erbij horen, en een ziektebeeld voor de uitleg op het niveau dat je moet kennen."
          action="Bekijk het overzicht"
          onClick={() => setMode("overzicht")}
        />
        <ModeCard
          image="/images/onderdelen/flashcards.webp"
          title="Flashcards"
          body="Het ziektebeeld voorop, de uitleg in de diepte die je moet kennen achterop. Per thema of alles door elkaar."
          action="Start flashcards"
          onClick={() => setMode("flashcards")}
        />
        {nCases > 0 ? (
          <ModeCard
            image="/images/onderdelen/oefenen.webp"
            title="Casussen oefenen"
            body="Korte casussen zoals op het tentamen: herken het ziektebeeld en beantwoord vragen over diagnostiek, beleid en complicaties. Daarna zie je waarom."
            action={`Start met ${nCases} vragen`}
            onClick={() => setMode("casussen")}
          />
        ) : null}
      </div>

      <section aria-labelledby="niveaus" className="mt-6 rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 id="niveaus" className="text-base font-semibold text-navy">Hoe goed moet je een ziektebeeld kennen?</h2>
        <p className="mt-1 text-sm text-muted-ink">
          {unique.length} ziektebeelden in {themes.length} thema&apos;s. Bij elk ziektebeeld staat het niveau uit de ziektebeeldenlijst van het vak.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {([1, 2] as const).map((l) => (
            <div key={l} className="rounded-lg bg-canvas p-4">
              <dt className="flex flex-wrap items-center gap-2">
                <LevelBadge level={l} />
                <span className="text-sm text-muted-ink tabular-nums">{l === 1 ? n1 : n2} ziektebeelden</span>
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-navy">{LEVELS[l].what}</dd>
            </div>
          ))}
        </dl>
      </section>
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

function LevelBadge({ level, compact = false }: { level: 1 | 2 | null; compact?: boolean }) {
  if (level === null) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-muted-ink">
        {compact ? "Geen niveau" : "Niveau niet vermeld"}
      </span>
    );
  }
  const l = LEVELS[level];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        level === 1 ? "bg-navy text-white" : "bg-sky text-blue",
      )}
    >
      {l.short}
      {compact ? null : <span className="font-medium opacity-85">· {l.tag}</span>}
    </span>
  );
}

/** What the student must know for this disease, followed by the key points and the full explanation. */
function DisorderBody({ d, themeLabels, currentTheme, idPrefix }: { d: Disorder; themeLabels: Map<string, string>; currentTheme?: string; idPrefix: string }) {
  const others = d.themeIds.filter((t) => t !== currentTheme).map((t) => themeLabels.get(t)).filter(Boolean);
  return (
    <div className="text-left">
      <p className="text-[0.98rem] leading-relaxed text-navy">{d.summary}</p>

      <div className="mt-4 rounded-lg border-l-4 border-blue bg-canvas px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-blue">Wat moet je kennen?</p>
        <p className="mt-1 text-sm leading-relaxed text-navy">
          {d.level ? (
            <>
              <strong className="font-semibold">{LEVELS[d.level].short}: </strong>
              {LEVELS[d.level].what}
            </>
          ) : (
            "Dit ziektebeeld staat in de themalijst, maar niet in de niveaulijst. De uitleg is daarom volledig, zoals bij niveau 1."
          )}
        </p>
      </div>

      {d.keyPoints.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-ink">Kernpunten</p>
          <ul className="mt-2 space-y-1.5">
            {d.keyPoints.map((k, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-navy">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <MarkupText source={d.explanation} idPrefix={idPrefix} className="mt-5 border-t border-line pt-4" />

      {others.length ? (
        <p className="mt-5 text-xs text-muted-ink">Komt ook terug bij {others.join(", ")}.</p>
      ) : null}
    </div>
  );
}

const matches = (d: Disorder, needle: string) =>
  [d.name, d.summary, d.keyPoints.join(" "), d.explanation].join(" ").toLowerCase().includes(needle);

function Overzicht({ themes, themeLabels, onBack }: { themes: DisorderTheme[]; themeLabels: Map<string, string>; onBack: () => void }) {
  const [q, setQ] = useState("");
  const [openThemes, setOpenThemes] = useState<Set<string>>(new Set());
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const needle = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!needle) return themes;
    return themes
      .map((t) => ({ ...t, disorders: t.disorders.filter((d) => matches(d, needle)) }))
      .filter((t) => t.disorders.length > 0);
  }, [themes, needle]);

  const allThemesOpen = themes.every((t) => openThemes.has(t.id));
  const toggleIn = (setter: typeof setOpenThemes, key: string) =>
    setter((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  // While searching, every theme with a hit is open so the results are visible at once.
  const themeOpen = (id: string) => (needle ? true : openThemes.has(id));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="text-navy">
          <ArrowLeft aria-hidden="true" /> Andere modus
        </Button>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <label className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-ink" aria-hidden="true" />
            <span className="sr-only">Zoek een ziektebeeld</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek een ziektebeeld of symptoom…"
              className="h-10 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm text-navy"
            />
          </label>
          {!needle ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenThemes(allThemesOpen ? new Set() : new Set(themes.map((t) => t.id)))}
              className="h-10 shrink-0 border-line text-navy"
            >
              {allThemesOpen ? "Thema's inklappen" : "Thema's uitklappen"}
            </Button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-ink">Geen ziektebeelden gevonden voor “{q}”.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const open = themeOpen(t.id);
            const n1 = t.disorders.filter((d) => d.level === 1).length;
            const n2 = t.disorders.filter((d) => d.level === 2).length;
            return (
              <section key={t.id} className="overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-card)]">
                <h2>
                  <button
                    type="button"
                    onClick={() => toggleIn(setOpenThemes, t.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-blue sm:px-6 sm:py-5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold uppercase tracking-[0.06em] text-blue">{t.label}</span>
                      <span className="mt-0.5 block text-lg font-semibold text-navy">{t.title || t.label}</span>
                      <span className="mt-1 block text-sm text-muted-ink tabular-nums">
                        {t.disorders.length} {t.disorders.length === 1 ? "ziektebeeld" : "ziektebeelden"}
                        {needle ? " gevonden" : ` · ${n1} niveau 1 · ${n2} niveau 2`}
                      </span>
                    </span>
                    <ChevronDown className={cn("size-5 shrink-0 text-muted-ink transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} aria-hidden="true" />
                  </button>
                </h2>
                {open ? (
                  <ul className="space-y-2 border-t border-line bg-canvas/60 p-3 sm:p-4">
                    {t.disorders.map((d) => {
                      const key = `${t.id}:${d.id}`;
                      const expanded = openItems.has(key);
                      return (
                        <li key={key} className="overflow-hidden rounded-lg border border-line bg-white">
                          <button
                            type="button"
                            onClick={() => toggleIn(setOpenItems, key)}
                            aria-expanded={expanded}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-blue"
                          >
                            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
                              <span className="font-semibold text-navy">{d.name}</span>
                              <LevelBadge level={d.level} compact />
                            </span>
                            <ChevronDown className={cn("size-5 shrink-0 text-muted-ink transition-transform duration-200 motion-reduce:transition-none", expanded && "rotate-180")} aria-hidden="true" />
                          </button>
                          {expanded ? (
                            <div className="border-t border-line px-4 pb-5 pt-4 sm:px-5">
                              <DisorderBody d={d} themeLabels={themeLabels} currentTheme={t.id} idPrefix={`zb-${t.id.slice(0, 4)}-${d.slug}`} />
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
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

function Flashcards({ themes, all, themeLabels, onBack }: { themes: DisorderTheme[]; all: Disorder[]; themeLabels: Map<string, string>; onBack: () => void }) {
  const [theme, setTheme] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const pool = useMemo(() => {
    const base = theme === "all" ? all : (themes.find((t) => t.id === theme)?.disorders ?? []);
    return level === "all" ? base : base.filter((d) => String(d.level) === level);
  }, [all, themes, theme, level]);
  const [deck, setDeck] = useState<Disorder[]>(() => shuffle(pool));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const topRef = useRef<HTMLDivElement>(null);

  // A new filter starts a fresh, shuffled round.
  const poolRef = useRef(pool);
  useEffect(() => {
    if (poolRef.current !== pool) {
      poolRef.current = pool;
      setDeck(shuffle(pool));
      setI(0);
      setFlipped(false);
      setKnown(new Set());
    }
  }, [pool]);

  const card = deck[i] ?? null;
  const restart = (cards: Disorder[] = pool) => { setDeck(shuffle(cards)); setI(0); setFlipped(false); setKnown(new Set()); };
  const go = (next: number) => {
    setFlipped(false);
    setI(next);
    // The back can be long: bring the next card's front into view.
    topRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  const advance = (markKnown: boolean) => {
    if (!card) return;
    if (markKnown) setKnown((k) => new Set(k).add(card.id));
    go(i + 1);
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("select, input, textarea, button, a")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === "ArrowRight") { setFlipped(false); setI((n) => Math.min(n + 1, deck.length)); }
      else if (e.key === "ArrowLeft") { setFlipped(false); setI((n) => Math.max(n - 1, 0)); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck.length]);

  const done = i >= deck.length;
  const unknown = deck.filter((d) => !known.has(d.id));
  const selectCls = "h-9 rounded-lg border border-input bg-white px-3 text-sm text-navy";

  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="text-navy">
          <ArrowLeft aria-hidden="true" /> Andere modus
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-navy">
            Thema
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className={cn(selectCls, "max-w-[15rem]")}>
              <option value="all">Alle thema&apos;s door elkaar</option>
              {themes.map((t) => (
                <option key={t.id} value={t.id}>{t.title ? `${t.label}: ${t.title}` : t.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-navy">
            Niveau
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectCls}>
              <option value="all">Alle</option>
              <option value="1">Niveau 1</option>
              <option value="2">Niveau 2</option>
            </select>
          </label>
        </div>
      </div>

      {done && deck.length ? (
        <section className="rounded-xl border border-line bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-success-soft text-success-ink">
            <Check className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-lg font-semibold text-navy">Ronde klaar</h2>
          <p className="mt-1 text-sm text-muted-ink">Je markeerde {known.size} van {deck.length} als gekend.</p>
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
            <div className="h-full rounded-full bg-success transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(i / deck.length) * 100}%` }} />
          </div>

          {!flipped ? (
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="mt-4 flex min-h-[18rem] w-full flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-10 text-center shadow-[var(--shadow-card)] transition-colors hover:border-[#c3d3e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-ink">
                {card.themeIds.map((t) => themeLabels.get(t)).filter(Boolean).join(" · ")}
              </span>
              <span className="mt-3 text-2xl font-bold text-navy sm:text-3xl">{card.name}</span>
              <span className="mt-4"><LevelBadge level={card.level} /></span>
              <span className="mt-6 text-sm text-muted-ink">Wat weet je ervan? Tik of druk op spatie om om te draaien</span>
            </button>
          ) : (
            <article className="mt-4 rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-7">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="text-xl font-bold text-navy">{card.name}</h2>
                  <LevelBadge level={card.level} />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setFlipped(false)} className="text-muted-ink">
                  <RotateCcw aria-hidden="true" /> Voorkant
                </Button>
              </header>
              <div className="px-5 py-5 sm:px-7 sm:py-6">
                <DisorderBody d={card} themeLabels={themeLabels} idPrefix={`fc-${card.slug}`} />
              </div>
            </article>
          )}

          <div className={cn("mt-4 flex flex-wrap items-center justify-between gap-2", flipped && "sticky bottom-3 z-10 rounded-xl border border-line bg-white/95 p-2 shadow-[var(--shadow-lift)] backdrop-blur")}>
            <Button type="button" variant="ghost" disabled={i === 0} onClick={() => go(Math.max(i - 1, 0))}>
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
        <p className="rounded-xl border border-line bg-white p-6 text-sm text-muted-ink">Geen ziektebeelden met deze keuze.</p>
      )}
    </div>
  );
}

/** How each question type is labelled above the vignette. */
const CASE_LABELS: Record<ExamCase["type"], string> = {
  diagnose: "Diagnose",
  diagnostiek: "Diagnostiek",
  beleid: "Beleid",
  pathofysiologie: "Pathofysiologie",
  complicatie: "Complicaties",
};

type CaseItem = { key: string; d: Disorder; c: ExamCase };
type CaseResult = { key: string; correct: boolean };
const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Exam-style questions as in the proeftentamen: a short case, one question, four options, then why. */
function Cases({ themes, all, onBack }: { themes: DisorderTheme[]; all: Disorder[]; onBack: () => void }) {
  const [theme, setTheme] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");
  const themeLabels = useMemo(() => new Map(themes.map((t) => [t.id, t.label])), [themes]);
  const pool = useMemo(() => {
    const base = theme === "all" ? all : (themes.find((t) => t.id === theme)?.disorders ?? []);
    return base
      .filter((d) => level === "all" || String(d.level) === level)
      .flatMap((d) => d.cases.map((c, k): CaseItem => ({ key: `${d.id}:${k}`, d, c })))
      .filter((it) => kind === "all" || (kind === "diagnose" ? it.c.type === "diagnose" : it.c.type !== "diagnose"));
  }, [all, themes, theme, level, kind]);
  const [deck, setDeck] = useState<CaseItem[]>(() => shuffle(pool));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<CaseResult[]>([]);
  const topRef = useRef<HTMLDivElement>(null);

  const poolRef = useRef(pool);
  useEffect(() => {
    if (poolRef.current !== pool) {
      poolRef.current = pool;
      setDeck(shuffle(pool));
      setI(0);
      setPicked(null);
      setChecked(false);
      setResults([]);
    }
  }, [pool]);

  const item = deck[i] ?? null;
  const restart = (items: CaseItem[] = pool) => {
    setDeck(shuffle(items));
    setI(0);
    setPicked(null);
    setChecked(false);
    setResults([]);
  };
  const check = () => {
    if (!item || picked === null) return;
    setChecked(true);
    setResults((r) => [...r, { key: item.key, correct: picked === item.c.answer }]);
  };
  const next = () => {
    setPicked(null);
    setChecked(false);
    setI((n) => n + 1);
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const done = i >= deck.length;
  const score = results.filter((r) => r.correct).length;
  const wrong = deck.filter((it) => results.some((r) => r.key === it.key && !r.correct));
  const selectCls = "h-9 rounded-lg border border-input bg-white px-3 text-sm text-navy";
  const right = item ? item.c.options[item.c.answer] : "";
  const correct = item !== null && picked === item.c.answer;

  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="text-navy">
          <ArrowLeft aria-hidden="true" /> Andere modus
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-navy">
            Thema
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className={cn(selectCls, "max-w-[13rem]")}>
              <option value="all">Alle thema&apos;s</option>
              {themes.map((t) => (
                <option key={t.id} value={t.id}>{t.title ? `${t.label}: ${t.title}` : t.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-navy">
            Niveau
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectCls}>
              <option value="all">Alle</option>
              <option value="1">Niveau 1</option>
              <option value="2">Niveau 2</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-navy">
            Vragen
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectCls}>
              <option value="all">Alle</option>
              <option value="diagnose">Diagnose stellen</option>
              <option value="verdieping">Diagnostiek, beleid en meer</option>
            </select>
          </label>
        </div>
      </div>

      {done && deck.length ? (
        <section className="rounded-xl border border-line bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-success-soft text-success-ink">
            <Check className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-lg font-semibold text-navy">Ronde klaar</h2>
          <p className="mt-1 text-sm text-muted-ink">
            Je had {score} van de {deck.length} vragen goed.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {wrong.length ? (
              <Button type="button" onClick={() => restart(wrong)} className="font-semibold">
                <RotateCcw aria-hidden="true" /> Oefen de {wrong.length} foute opnieuw
              </Button>
            ) : null}
            <Button type="button" variant={wrong.length ? "outline" : "default"} onClick={() => restart()} className="font-semibold">
              <Shuffle aria-hidden="true" /> Opnieuw, alles
            </Button>
          </div>
        </section>
      ) : item ? (
        <>
          <div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted-ink">
            <span className="tabular-nums">Vraag {i + 1} van {deck.length}</span>
            <span className="tabular-nums">{score} goed</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-sky" aria-hidden="true">
            <div className="h-full rounded-full bg-success transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(i / deck.length) * 100}%` }} />
          </div>

          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
            <article className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
              <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-blue">
                Casus
                <span className="rounded-full bg-sky px-2 py-0.5 normal-case tracking-normal">{CASE_LABELS[item.c.type]}</span>
              </p>
              <MarkupText source={item.c.vignette} idPrefix={`cv-${item.d.slug}`} className="mt-2" />
              <p className="mt-5 font-semibold text-navy">{item.c.question}</p>
            </article>

            <div>
              <fieldset disabled={checked} className="space-y-2">
                <legend className="sr-only">{item.c.question}</legend>
                {item.c.options.map((o, k) => {
                  const isPicked = picked === k;
                  const isRight = checked && k === item.c.answer;
                  const isWrongPick = checked && isPicked && k !== item.c.answer;
                  return (
                    <label
                      key={k}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border bg-white px-4 py-3 text-[0.95rem] text-navy transition-colors",
                        !checked && (isPicked ? "border-blue bg-sky" : "border-line hover:border-[#c3d3e6]"),
                        isRight && "border-success bg-success-soft",
                        isWrongPick && "border-[#e3a3a3] bg-[#fdf1f1]",
                        checked && !isRight && !isWrongPick && "border-line opacity-70",
                        checked && "cursor-default",
                      )}
                    >
                      <input
                        type="radio"
                        name={`casus-${item.key}`}
                        value={k}
                        checked={isPicked}
                        onChange={() => setPicked(k)}
                        className="mt-1 size-4 shrink-0 accent-[var(--color-blue)]"
                      />
                      <span className="w-4 shrink-0 font-semibold text-muted-ink">{LETTERS[k]}</span>
                      <span className="flex-1">{o}</span>
                      {isRight ? <CircleCheck className="size-5 shrink-0 text-success" aria-label="Juist antwoord" /> : null}
                      {isWrongPick ? <CircleX className="size-5 shrink-0 text-[#c24b4b]" aria-label="Jouw antwoord, onjuist" /> : null}
                    </label>
                  );
                })}
              </fieldset>

              {!checked ? (
                <Button type="button" onClick={check} disabled={picked === null} className="mt-4 w-full font-semibold">
                  Controleer
                </Button>
              ) : null}
            </div>
          </div>

          {checked ? (
            <section
              aria-live="polite"
              className={cn(
                "mt-5 rounded-2xl border p-5 shadow-[var(--shadow-card)] sm:p-7",
                correct ? "border-success/30 bg-success-soft/40" : "border-[#e8c48a] bg-[#fffaf1]",
              )}
            >
              <p className="flex items-start gap-2 font-semibold text-navy">
                {correct ? (
                  <><CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" /> Goed: {LETTERS[item.c.answer]}. {right}</>
                ) : (
                  <><CircleX className="mt-0.5 size-5 shrink-0 text-[#c24b4b]" aria-hidden="true" /> Het juiste antwoord is {LETTERS[item.c.answer]}. {right}</>
                )}
              </p>
              <MarkupText source={item.c.explanation} idPrefix={`ce-${item.key}`} className="mt-3" />
              <details className="mt-4 rounded-lg border border-line bg-white">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-blue">Lees de volledige uitleg over {item.d.name}</summary>
                <div className="border-t border-line px-4 pb-5 pt-4">
                  <DisorderBody d={item.d} themeLabels={themeLabels} idPrefix={`cd-${item.d.slug}`} />
                </div>
              </details>
              <div className="mt-5 flex justify-end">
                <Button type="button" onClick={next} className="font-semibold">
                  {i + 1 < deck.length ? "Volgende vraag" : "Bekijk resultaat"} <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <p className="rounded-xl border border-line bg-white p-6 text-sm text-muted-ink">Nog geen vragen met deze keuze.</p>
      )}
    </div>
  );
}
