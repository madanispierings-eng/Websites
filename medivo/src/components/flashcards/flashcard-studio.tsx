"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, Layers, RotateCcw, Shuffle, X } from "lucide-react";
import { MarkupText } from "@/components/markup-text";
import { Button } from "@/components/ui/button";
import {
  cardStatus,
  currentCardId,
  isDue,
  startStudy,
  studyReducer,
  tally,
  type CardProgress,
  type CardStatus,
  type Flashcard,
  type StudyState,
} from "@/lib/flashcards/deck";
import type { ActionResult } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

export type DeckTopic = { id: string; title: string; number: number };

type Review = (input: { flashcardId: string; known: boolean }) => Promise<ActionResult<CardProgress>>;

const statusMeta: Record<CardStatus, { label: string; bar: string; pill: string }> = {
  beheerst: { label: "Beheerst", bar: "bg-success", pill: "bg-success-soft text-success-ink" },
  lerend: { label: "Aan het leren", bar: "bg-accent-blue", pill: "bg-sky text-blue" },
  opnieuw: { label: "Opnieuw", bar: "bg-[#e3a04f]", pill: "bg-[#fdf6ec] text-[#8a4f0c]" },
  nieuw: { label: "Nieuw", bar: "bg-line", pill: "bg-canvas text-muted-ink" },
};
const order: CardStatus[] = ["beheerst", "lerend", "opnieuw", "nieuw"];

export function FlashcardStudio({
  topics,
  cards,
  initialProgress,
  initialTopicId,
  review,
}: {
  topics: DeckTopic[];
  cards: Flashcard[];
  initialProgress: Record<string, CardProgress>;
  initialTopicId: string | null;
  review: Review;
}) {
  const [topicId, setTopicId] = useState<string | null>(initialTopicId);
  const [progress, setProgress] = useState(initialProgress);
  const [onlyDue, setOnlyDue] = useState(true);
  const [shuffle, setShuffle] = useState(true);
  const [backFirst, setBackFirst] = useState(false);
  const [study, setStudy] = useState<StudyState | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  // "now" is fixed per render pass of the overview so counts do not jitter while studying.
  const [now, setNow] = useState(() => Date.now());

  const deck = useMemo(() => (topicId ? cards.filter((c) => c.topicId === topicId) : cards), [cards, topicId]);
  const counts = useMemo(() => tally(deck, progress, now), [deck, progress, now]);
  const topic = topics.find((t) => t.id === topicId) ?? null;
  const studyIds = (onlyDue ? deck.filter((c) => isDue(progress[c.id], now)) : deck).map((c) => c.id);

  function begin(ids: string[]) {
    setStudy(startStudy(ids, shuffle));
    setSessionKey((k) => k + 1);
  }

  function stop() {
    setStudy(null);
    setNow(Date.now());
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <TopicPicker
        topics={topics}
        cards={cards}
        progress={progress}
        now={now}
        selected={topicId}
        disabled={Boolean(study)}
        onSelect={(id) => {
          setTopicId(id);
          setOnlyDue(true);
        }}
      />

      <div className="min-w-0">
        {study ? (
          <StudySession
            key={sessionKey}
            state={study}
            setState={setStudy}
            cards={cards}
            backFirst={backFirst}
            review={review}
            onReviewed={(id, p) => setProgress((cur) => ({ ...cur, [id]: p }))}
            onStop={stop}
          />
        ) : (
          <section aria-labelledby="deck-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-ink">{topic ? `Thema ${topic.number}` : "Hele vak"}</p>
            <h2 id="deck-titel" className="mt-1 text-xl font-semibold text-navy">{topic ? topic.title : "Alle onderwerpen"}</h2>
            <p className="mt-1 text-sm text-muted-ink">
              {counts.total} {counts.total === 1 ? "kaart" : "kaarten"} · {counts.due} klaar om te herhalen
            </p>

            <MasteryBar counts={counts} className="mt-5" />

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-navy">Welke kaarten?</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  { v: true, title: `Te herhalen (${counts.due})`, body: "Nieuwe kaarten, kaarten die je nog niet wist en kaarten waarvan de herhaaldatum is bereikt." },
                  { v: false, title: `Alle kaarten (${counts.total})`, body: "Het hele onderwerp doorlopen, ook wat je al beheerst." },
                ].map((o) => (
                  <label
                    key={String(o.v)}
                    className={cn(
                      "cursor-pointer rounded-lg border p-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-blue",
                      onlyDue === o.v ? "border-accent-blue bg-sky/60" : "border-line hover:bg-canvas",
                    )}
                  >
                    <input type="radio" name="kaarten" className="sr-only" checked={onlyDue === o.v} onChange={() => setOnlyDue(o.v)} />
                    <span className="block text-sm font-semibold text-navy">{o.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-ink">{o.body}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className="size-4 accent-accent-blue" />
                <Shuffle className="size-4 text-muted-ink" aria-hidden="true" /> Schudden
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={backFirst} onChange={(e) => setBackFirst(e.target.checked)} className="size-4 accent-accent-blue" />
                Eerst de uitleg, dan het begrip raden
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => begin(studyIds)} disabled={!studyIds.length} className="h-11 px-6 font-semibold">
                <Layers aria-hidden="true" /> Start met leren
              </Button>
              {!studyIds.length && onlyDue ? (
                <p className="text-sm text-muted-ink">Alles in dit onderwerp is bijgewerkt. Kies ‘Alle kaarten’ om toch te oefenen.</p>
              ) : null}
            </div>

            <CardList deck={deck} progress={progress} />
          </section>
        )}
      </div>
    </div>
  );
}

function MasteryBar({ counts, className }: { counts: ReturnType<typeof tally>; className?: string }) {
  return (
    <div className={className}>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
        {order.map((s) =>
          counts[s] ? <div key={s} className={cn("h-full", statusMeta[s].bar)} style={{ width: `${(counts[s] / Math.max(counts.total, 1)) * 100}%` }} /> : null,
        )}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-navy">
        {order.map((s) => (
          <li key={s} className="inline-flex items-center gap-2">
            <span className={cn("size-2.5 rounded-full", statusMeta[s].bar)} aria-hidden="true" />
            {statusMeta[s].label} <span className="font-semibold tabular-nums">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopicPicker({ topics, cards, progress, now, selected, disabled, onSelect }: {
  topics: DeckTopic[];
  cards: Flashcard[];
  progress: Record<string, CardProgress>;
  now: number;
  selected: string | null;
  disabled: boolean;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const rows = [
    { id: null as string | null, label: "Alle onderwerpen", number: null as number | null, t: tally(cards, progress, now) },
    ...topics.map((t) => ({ id: t.id as string | null, label: t.title, number: t.number as number | null, t: tally(cards.filter((c) => c.topicId === t.id), progress, now) })),
  ].filter((r) => r.t.total > 0);
  const current = rows.find((r) => r.id === selected) ?? rows[0];

  return (
    <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="flashcard-onderwerpen"
        className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-left text-sm font-semibold text-navy shadow-[var(--shadow-card)] lg:hidden"
      >
        <span className="min-w-0 truncate">
          Onderwerp <span className="font-normal text-muted-ink">· {current?.label}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      <nav
        id="flashcard-onderwerpen"
        aria-label="Onderwerpen"
        className={cn("mt-3 rounded-xl border border-line bg-white p-2 shadow-[var(--shadow-card)] lg:mt-0 lg:block", open ? "block" : "hidden")}
      >
        <ul>
          {rows.map((r) => {
            const active = r.id === selected;
            const mastered = r.t.total ? r.t.beheerst / r.t.total : 0;
            return (
              <li key={r.id ?? "alle"}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    onSelect(r.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                    active ? "bg-sky" : "hover:bg-canvas",
                  )}
                >
                  <span className="flex items-start gap-2 text-sm">
                    {r.number !== null ? <span className="w-5 shrink-0 text-right font-semibold tabular-nums text-muted-ink">{r.number}</span> : null}
                    <span className={cn("flex-1 text-navy", active && "font-semibold")}>{r.label}</span>
                    <span className="shrink-0 tabular-nums text-muted-ink">{r.t.total}</span>
                  </span>
                  <span className={cn("mt-1.5 flex items-center gap-2", r.number !== null && "pl-7")}>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                      <span className="block h-full rounded-full bg-success" style={{ width: `${mastered * 100}%` }} />
                    </span>
                    <span className="w-9 text-right text-xs tabular-nums text-muted-ink">{Math.round(mastered * 100)}%</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function CardList({ deck, progress }: { deck: Flashcard[]; progress: Record<string, CardProgress> }) {
  const [open, setOpen] = useState(false);
  const shown = open ? deck : deck.slice(0, 8);
  return (
    <div className="mt-8 border-t border-line pt-6">
      <h3 className="text-base font-semibold text-navy">Alle kaarten in deze set</h3>
      <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
        {shown.map((c) => {
          const s = cardStatus(progress[c.id]);
          return (
            <li key={c.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
              <MarkupText source={c.front} idPrefix={`lijst-${c.id}-v`} className="space-y-1 text-[0.95rem] font-semibold leading-snug text-navy" />
              <MarkupText source={c.back} idPrefix={`lijst-${c.id}-a`} className="space-y-1 text-[0.95rem] leading-relaxed text-navy/85" />
              <span className={cn("w-fit rounded-full px-2 py-0.5 text-xs font-medium", statusMeta[s].pill)}>{statusMeta[s].label}</span>
            </li>
          );
        })}
      </ul>
      {deck.length > 8 ? (
        <Button type="button" variant="ghost" onClick={() => setOpen((v) => !v)} className="mt-2 text-blue">
          {open ? "Minder tonen" : `Toon alle ${deck.length} kaarten`}
        </Button>
      ) : null}
    </div>
  );
}

function StudySession({ state, setState, cards, backFirst, review, onReviewed, onStop }: {
  state: StudyState;
  setState: (s: StudyState) => void;
  cards: Flashcard[];
  backFirst: boolean;
  review: Review;
  onReviewed: (id: string, p: CardProgress) => void;
  onStop: () => void;
}) {
  const reduce = useReducedMotion();
  const [s, dispatch] = useReducer(studyReducer, state);
  const [error, setError] = useState<string | null>(null);
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const id = currentCardId(s);
  const card = id ? byId.get(id) ?? null : null;
  const cardRef = useRef<HTMLButtonElement | null>(null);
  // Set when the next card to mount should take focus (session start, after an answer, new round).
  const focusNext = useRef(true);
  const setCardRef = useCallback((el: HTMLButtonElement | null) => {
    cardRef.current = el;
    if (el && focusNext.current) {
      focusNext.current = false;
      el.focus({ preventScroll: true });
    }
  }, []);
  const summaryRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => setState(s), [s, setState]);
  useEffect(() => {
    if (s.roundDone) summaryRef.current?.focus();
  }, [s.roundDone]);

  const answer = useCallback(
    (known: boolean) => {
      if (!id || !s.flipped) return;
      dispatch({ type: "answer", known });
      setError(null);
      review({ flashcardId: id, known })
        .then((res) => (res.ok ? onReviewed(id, res.data) : setError(res.error)))
        .catch(() => setError("Geen verbinding: je laatste antwoord is niet opgeslagen."));
      // Keep keyboard focus on the card: the next one takes focus as soon as it mounts.
      focusNext.current = true;
    },
    [id, s.flipped, review, onReviewed],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || s.roundDone) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select")) return;
      if (e.key === " " || e.key === "Enter") {
        if (t.closest("button") && t !== cardRef.current) return;
        e.preventDefault();
        dispatch({ type: "flip" });
      } else if (e.key === "1" || e.key === "ArrowLeft") answer(false);
      else if (e.key === "2" || e.key === "ArrowRight") answer(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, s.roundDone]);

  const total = s.queue.length;
  const front = card ? (backFirst ? card.back : card.front) : "";
  const back = card ? (backFirst ? card.front : card.back) : "";

  return (
    <section aria-label="Flashcards leren" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm font-medium text-navy">
          {s.roundDone ? `Ronde ${s.round} klaar` : `Kaart ${s.index + 1} van ${total}`}
          {s.round > 1 && !s.roundDone ? <span className="text-muted-ink"> · ronde {s.round}</span> : null}
        </p>
        <div className="h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-sky max-sm:order-last max-sm:basis-full" aria-hidden="true">
          <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${(s.index / Math.max(total, 1)) * 100}%` }} />
        </div>
        <span className="inline-flex items-center gap-3 text-sm tabular-nums max-sm:ml-auto">
          <span className="inline-flex items-center gap-1 text-[#8a4f0c]"><X className="size-4" aria-hidden="true" />{s.again.length}<span className="sr-only"> nog niet</span></span>
          <span className="inline-flex items-center gap-1 text-success-ink"><Check className="size-4" aria-hidden="true" />{s.known.length}<span className="sr-only"> geweten</span></span>
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onStop}>Stoppen</Button>
      </div>

      {s.roundDone ? (
        <div className="py-10 text-center">
          <h2 ref={summaryRef} tabIndex={-1} className="text-2xl font-semibold text-navy outline-none">
            {s.again.length ? "Goed bezig, nog even doorzetten" : "Alles geweten in deze ronde"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-ink">
            Je wist {s.known.length} van de {total} {total === 1 ? "kaart" : "kaarten"}.
            {s.again.length ? ` Oefen de ${s.again.length} die je nog niet wist direct nog een keer.` : " Ze komen terug zodra ze aan herhaling toe zijn."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {s.again.length ? (
              <Button
                type="button"
                onClick={() => {
                  focusNext.current = true;
                  dispatch({ type: "next-round" });
                }}
                className="h-11 px-5 font-semibold"
              >
                <RotateCcw aria-hidden="true" /> Oefen de {s.again.length} opnieuw
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onStop} className="h-11 border-line text-navy">Terug naar het overzicht</Button>
          </div>
        </div>
      ) : card ? (
        <>
          <div className="mt-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${s.round}-${s.index}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  ref={setCardRef}
                  type="button"
                  onClick={() => dispatch({ type: "flip" })}
                  aria-label={s.flipped ? "Kaart omdraaien naar de voorkant" : "Kaart omdraaien om het antwoord te zien"}
                  className="group relative block min-h-[17rem] w-full rounded-2xl text-left outline-none [perspective:1600px] focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 sm:min-h-[20rem]"
                >
                  <div
                    className={cn(
                      "relative grid min-h-[17rem] w-full [transform-style:preserve-3d] sm:min-h-[20rem]",
                      !reduce && "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      s.flipped && "[transform:rotateY(180deg)]",
                    )}
                  >
                    <CardFace label={backFirst ? "Uitleg" : "Begrip"} hint="Klik of druk op spatie om om te draaien" hidden={s.flipped}>
                      <MarkupText
                        source={front}
                        idPrefix={`kaart-${card.id}-v`}
                        className={cn("space-y-2 text-center text-navy", backFirst ? "text-lg leading-relaxed" : "text-2xl font-semibold leading-snug sm:text-[1.75rem]")}
                      />
                    </CardFace>
                    <CardFace label={backFirst ? "Begrip" : "Uitleg"} back hidden={!s.flipped}>
                      <MarkupText
                        source={back}
                        idPrefix={`kaart-${card.id}-a`}
                        className={cn("space-y-2 text-center text-navy", backFirst ? "text-2xl font-semibold leading-snug" : "text-lg leading-relaxed")}
                      />
                    </CardFace>
                  </div>
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {s.flipped ? (
              <>
                <Button type="button" variant="outline" onClick={() => answer(false)} className="h-12 border-[#e8c48a] bg-[#fdf6ec] text-base font-semibold text-[#8a4f0c] hover:bg-[#fbecd6]">
                  <X aria-hidden="true" /> Nog niet <kbd className="ml-1 hidden rounded border border-current/30 px-1.5 text-xs font-medium sm:inline">1</kbd>
                </Button>
                <Button type="button" onClick={() => answer(true)} className="h-12 bg-success text-base font-semibold text-white hover:bg-success/90">
                  <Check aria-hidden="true" /> Weet ik <kbd className="ml-1 hidden rounded border border-white/40 px-1.5 text-xs font-medium sm:inline">2</kbd>
                </Button>
              </>
            ) : (
              <Button type="button" variant="secondary" onClick={() => dispatch({ type: "flip" })} className="col-span-2 h-12 text-base font-semibold">
                Draai om <kbd className="ml-1 hidden rounded border border-current/30 px-1.5 text-xs font-medium sm:inline">spatie</kbd>
              </Button>
            )}
          </div>
          {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
          <p className="sr-only" aria-live="polite">{s.flipped ? `Achterkant: ${back}` : ""}</p>
        </>
      ) : null}
    </section>
  );
}

function CardFace({ label, hint, back, hidden, children }: { label: string; hint?: string; back?: boolean; hidden: boolean; children: React.ReactNode }) {
  return (
    <div
      aria-hidden={hidden}
      className={cn(
        "col-start-1 row-start-1 flex min-h-[17rem] flex-col rounded-2xl border px-6 py-5 [backface-visibility:hidden] sm:min-h-[20rem] sm:px-10",
        back ? "border-accent-blue/30 bg-sky/50 [transform:rotateY(180deg)]" : "border-line bg-white shadow-[var(--shadow-card)] group-hover:border-[#c3d3e6]",
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-ink">{label}</span>
      <div className="flex flex-1 items-center justify-center py-6">{children}</div>
      {hint ? <span className="text-center text-xs text-muted-ink">{hint}</span> : null}
    </div>
  );
}
