"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, CircleCheck, CircleX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { answerFor, canSubmit, currentQuestion, type EngineAction, type EngineState } from "@/lib/practice/engine";
import { cn } from "@/lib/utils";

export function QuestionView({
  state,
  dispatch,
  onSubmit,
  onBookmark,
  footer,
}: {
  state: EngineState;
  dispatch: (a: EngineAction) => void;
  onSubmit: () => void;
  onBookmark: (questionId: string, next: boolean) => void;
  footer?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const q = currentQuestion(state)!;
  const answer = answerFor(state, q.id);
  const isExam = state.mode === "exam" && !state.finished;
  const answered = answer.status === "answered";
  const fb = answer.feedback;
  const total = state.questions.length;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Move focus to the new question for keyboard and screen-reader users, but not on first load.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [state.index]);

  // The submit button unmounts once an answer is checked; keep keyboard focus inside the question instead of dropping it to <body>.
  useEffect(() => {
    if (!answered) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    (nextRef.current && !nextRef.current.disabled ? nextRef.current : headingRef.current)?.focus();
  }, [answered, q.id]);

  // A–F pick an option, as long as the user is not typing somewhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input[type=text], input[type=search], textarea, [contenteditable=true]")) return;
      const opt = q.options.find((o) => o.label.toLowerCase() === e.key.toLowerCase());
      if (opt) dispatch({ type: "select", optionId: opt.id });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, dispatch]);

  const bookmarked = Boolean(state.bookmarks[q.id]);
  const correctOption = fb ? q.options.find((o) => o.id === fb.correctOptionId) : null;
  const wrongWithReason = fb ? q.options.filter((o) => o.id !== fb.correctOptionId && fb.optionFeedback[o.id]) : [];

  return (
    <section aria-labelledby="vraag-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="vraag-titel" ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-navy outline-none">
            {q.topicTitle || "Vraag"}
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <span className="shrink-0 text-xs font-medium text-muted-ink">Vraag {state.index + 1} van {total}</span>
            <div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-sky" aria-hidden="true">
              <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${((state.index + 1) / total) * 100}%` }} />
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={bookmarked}
          onClick={() => onBookmark(q.id, !bookmarked)}
          className="border-line text-navy"
        >
          {bookmarked ? <BookmarkCheck className="text-blue" aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
          {/* Icon-only on phones so the topic title keeps its width; the label stays available to screen readers. */}
          <span className="max-sm:sr-only">{bookmarked ? "Gemarkeerd" : "Markeer vraag"}</span>
        </Button>
      </div>

      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit(state)) onSubmit();
        }}
      >
        <div className="whitespace-pre-line rounded-lg bg-sky px-4 py-4 text-[0.98rem] leading-relaxed text-navy sm:px-5">{q.stem}</div>
        {q.imageUrl ? (
          // Signed URL from private storage.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.imageUrl} alt={q.imageAlt ?? ""} className="mt-4 max-h-96 w-auto rounded-lg border border-line" />
        ) : null}

        <fieldset className="mt-4" disabled={answered || answer.status === "submitting"}>
          <legend className="sr-only">Kies een antwoord</legend>
          <ul className="space-y-2">
            {q.options.map((o) => {
              const selected = answer.selectedOptionId === o.id;
              const isCorrect = fb?.correctOptionId === o.id;
              const isWrongPick = Boolean(fb) && selected && !isCorrect;
              return (
                <li key={o.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-[0.95rem] text-navy transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-blue",
                      !fb && (selected ? "border-accent-blue bg-sky/70" : "border-line hover:border-[#c3d3e6] hover:bg-canvas"),
                      isCorrect && "border-success bg-success-soft",
                      isWrongPick && "border-danger/60 bg-danger-soft",
                      fb && !isCorrect && !isWrongPick && "border-line opacity-80",
                      (answered || answer.status === "submitting") && "cursor-default",
                    )}
                  >
                    <input
                      type="radio"
                      name={`vraag-${q.id}`}
                      value={o.id}
                      checked={selected}
                      onChange={() => dispatch({ type: "select", optionId: o.id })}
                      className="mt-1 size-4 shrink-0 accent-accent-blue"
                    />
                    <span className="font-semibold">{o.label}.</span>
                    <span className="flex-1">{o.body}</span>
                    {isCorrect ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-label="Juiste antwoord" /> : null}
                    {isWrongPick ? <CircleX className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Jouw antwoord, onjuist" /> : null}
                    {isExam && answered && selected ? <span className="text-xs font-medium text-blue">Opgeslagen</span> : null}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        {answer.error ? <p role="alert" className="mt-3 text-sm text-danger">{answer.error}</p> : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {!answered ? (
            <Button type="submit" disabled={!canSubmit(state)} className="h-10 px-5 font-semibold">
              {answer.status === "submitting" ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {isExam ? "Antwoord opslaan" : "Controleer antwoord"}
            </Button>
          ) : null}
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="ghost" disabled={state.index === 0} onClick={() => dispatch({ type: "go", index: state.index - 1 })}>
              <ArrowLeft aria-hidden="true" /> Vorige vraag
            </Button>
            <Button
              ref={nextRef}
              type="button"
              variant={answered ? "default" : "secondary"}
              disabled={state.index >= total - 1}
              onClick={() => dispatch({ type: "go", index: state.index + 1 })}
            >
              Volgende vraag <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </form>

      <div aria-live="polite">
        <AnimatePresence initial={false}>
          {fb ? (
            <motion.div
              key={q.id}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "mt-5 rounded-lg border p-4 sm:p-5",
                fb.isCorrect ? "border-success/35 bg-success-soft/60" : "border-danger/30 bg-danger-soft/60",
              )}
            >
              <p className={cn("flex items-center gap-2 font-semibold", fb.isCorrect ? "text-success-ink" : "text-danger")}>
                {fb.isCorrect ? <CircleCheck className="size-5" aria-hidden="true" /> : <CircleX className="size-5" aria-hidden="true" />}
                {answer.selectedOptionId === null
                  ? `Niet beantwoord · juiste antwoord: ${correctOption?.label}`
                  : fb.isCorrect
                    ? `Juist antwoord: ${correctOption?.label}`
                    : `Onjuist · het juiste antwoord is ${correctOption?.label}`}
              </p>
              <p className="mt-2 whitespace-pre-line text-[0.95rem] leading-relaxed text-navy/90">{fb.explanation}</p>
              {fb.concept ? (
                <p className="mt-3 text-sm text-navy/90">
                  <span className="font-semibold text-navy">Onderliggend concept: </span>
                  {fb.concept}
                </p>
              ) : null}
              {wrongWithReason.length ? (
                <div className="mt-4 border-t border-black/5 pt-3">
                  <p className="text-sm font-semibold text-navy">Waarom de andere opties niet kloppen</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-navy/85">
                    {wrongWithReason.map((o) => (
                      <li key={o.id}>
                        <span className="font-semibold">{o.label}.</span> {fb.optionFeedback[o.id]}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {footer}
    </section>
  );
}
