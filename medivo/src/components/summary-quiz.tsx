"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, HelpCircle, Lightbulb, RotateCcw } from "lucide-react";
import { ContentBlocks } from "@/components/content-blocks";
import { MarkupText } from "@/components/markup-text";
import { Button } from "@/components/ui/button";
import type { AnswerBlock } from "@/lib/content/blocks";
import { imageUrlsFor } from "@/lib/content/images";
import { cn } from "@/lib/utils";

type QuizItem = { q: string; a: string | AnswerBlock[] };

/**
 * Interactive self-check under a hoorcollege: the student types an answer, reveals the model
 * answer, and moves to the next question. Nothing is graded or stored — it is a study aid.
 */
export function SummaryQuiz({ id, title, items }: { id: string; title?: string; items: QuizItem[] }) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const total = items.length;
  const item = items[index];
  const isRevealed = Boolean(revealed[index]);
  const atLast = index === total - 1;
  const answeredCount = Object.keys(revealed).filter((k) => revealed[Number(k)]).length;

  const go = (next: number) => setIndex(Math.min(total - 1, Math.max(0, next)));
  const reveal = () => setRevealed((r) => ({ ...r, [index]: true }));
  const reset = () => { setTyped({}); setRevealed({}); setIndex(0); };

  return (
    <section
      id={id}
      aria-label={title ?? "Controlevragen"}
      className="not-prose overflow-hidden rounded-2xl border border-blue/20 bg-white shadow-[var(--shadow-card)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-blue/20 bg-sky px-5 py-3">
        <h4 className="flex items-center gap-2 text-lg font-semibold text-navy">
          <HelpCircle className="size-5 shrink-0 text-blue" aria-hidden="true" />
          {title ?? "Controlevragen"} <span className="font-normal text-muted-ink">· test jezelf</span>
        </h4>
        <span className="text-xs font-medium text-muted-ink tabular-nums">Vraag {index + 1} van {total}</span>
      </header>

      <div className="p-5 sm:p-6">
        {/* progress dots */}
        <ol className="mb-4 flex flex-wrap gap-1.5" aria-hidden="true">
          {items.map((_, i) => (
            <li
              key={i}
              className={cn(
                "size-2.5 rounded-full",
                i === index ? "bg-accent-blue ring-2 ring-accent-blue/30" : revealed[i] ? "bg-success" : "bg-line",
              )}
            />
          ))}
        </ol>

        <p className="text-[1.02rem] font-medium leading-relaxed text-navy">{item.q}</p>

        <label htmlFor={`${id}-a-${index}`} className="mt-3 block text-xs font-medium text-muted-ink">
          Jouw antwoord
        </label>
        <textarea
          id={`${id}-a-${index}`}
          value={typed[index] ?? ""}
          onChange={(e) => setTyped((t) => ({ ...t, [index]: e.target.value }))}
          rows={3}
          placeholder="Typ hier je antwoord en vergelijk het daarna met het modelantwoord…"
          className="mt-1 w-full resize-y rounded-lg border border-input bg-white px-3 py-2 text-base leading-relaxed text-navy placeholder:text-muted-ink/70 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 sm:text-sm"
        />

        {isRevealed ? (
          <div className="mt-4 rounded-lg border border-success/25 bg-success-soft/40 p-4">
            <h5 className="flex items-center gap-2 text-sm font-semibold text-navy">
              <Lightbulb className="size-4 shrink-0 text-success-ink" aria-hidden="true" />
              Modelantwoord
            </h5>
            <Answer a={item.a} idPrefix={`${id}-ans-${index}`} />
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => go(index - 1)} disabled={index === 0}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Vorige
          </Button>
          {!isRevealed ? (
            <Button type="button" size="sm" className="font-semibold" onClick={reveal}>
              <Lightbulb className="size-4" aria-hidden="true" /> Toon antwoord
            </Button>
          ) : null}
          {!atLast ? (
            <Button type="button" variant={isRevealed ? "default" : "outline"} size="sm" className="font-semibold" onClick={() => go(index + 1)}>
              Volgende vraag <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
          {atLast && answeredCount === total ? (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-4" aria-hidden="true" /> Opnieuw
            </Button>
          ) : null}
          <span className="ml-auto text-xs text-muted-ink tabular-nums">{answeredCount}/{total} bekeken</span>
        </div>
      </div>
    </section>
  );
}

/** A model answer is either summary markup (a plain string) or rich blocks that keep tables, figures and formulas. */
function Answer({ a, idPrefix }: { a: string | AnswerBlock[]; idPrefix: string }) {
  const imageUrls = useMemo(() => (typeof a === "string" ? {} : imageUrlsFor(a)), [a]);
  if (typeof a === "string") {
    return <MarkupText source={a} idPrefix={idPrefix} className="mt-2 space-y-2 text-[0.95rem] leading-relaxed text-navy/90" />;
  }
  return <ContentBlocks blocks={a} imageUrls={imageUrls} idPrefix={idPrefix} className="mt-2 space-y-3 text-[0.95rem] leading-relaxed text-navy/90" />;
}
