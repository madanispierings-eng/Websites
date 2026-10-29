"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, CircleAlert, CircleCheck, CircleX, Loader2 } from "lucide-react";
import { MarkupText } from "@/components/markup-text";
import { Button } from "@/components/ui/button";
import { answerFor, canSubmit, currentQuestion, isPartial, type AnswerState, type EngineAction, type EngineState } from "@/lib/practice/engine";
import type { AnswerFeedback, PracticeQuestion, QuestionType } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

const typeHint: Partial<Record<QuestionType, string>> = {
  multiple_choice: "Meerdere antwoorden mogelijk",
  dropdowns: "Kies per onderdeel",
  numeric: "Kort antwoord",
  open: "Open vraag",
};

const num = (n: number) => n.toLocaleString("nl-NL", { maximumFractionDigits: 2 });
const pts = (n: number) => `${num(n)} ${n === 1 ? "punt" : "punten"}`;

export function QuestionView({
  state,
  dispatch,
  onSubmit,
  onBookmark,
  onSelfGrade,
  footer,
}: {
  state: EngineState;
  dispatch: (a: EngineAction) => void;
  onSubmit: () => void;
  onBookmark: (questionId: string, next: boolean) => void;
  onSelfGrade: (questionId: string, score: number) => Promise<string | null>;
  footer?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const q = currentQuestion(state)!;
  const answer = answerFor(state, q.id);
  const isExam = state.mode === "exam" && !state.finished;
  const answered = answer.status === "answered";
  const locked = answered || answer.status === "submitting";
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

  // A–Z pick (or toggle) an option on choice questions, as long as the user is not typing somewhere.
  useEffect(() => {
    if (q.type !== "single_choice" && q.type !== "multiple_choice") return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input[type=text], input[type=search], textarea, select, [contenteditable=true]")) return;
      const opt = q.options.find((o) => o.label.toLowerCase() === e.key.toLowerCase());
      if (!opt) return;
      if (q.type === "single_choice") dispatch({ type: "respond", response: { option_id: opt.id } });
      else dispatch({ type: "respond", response: { option_ids: toggle(currentIds(answer), opt.id) } });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, dispatch, answer]);

  const bookmarked = Boolean(state.bookmarks[q.id]);

  return (
    <section aria-labelledby="vraag-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="vraag-titel" ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-navy outline-none">
            {q.topicTitle || "Vraag"}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="shrink-0 text-xs font-medium text-muted-ink">Vraag {state.index + 1} van {total}</span>
            <div className="h-1.5 min-w-24 max-w-xs flex-1 overflow-hidden rounded-full bg-sky" aria-hidden="true">
              <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${((state.index + 1) / total) * 100}%` }} />
            </div>
            <span className="shrink-0 text-xs font-medium text-muted-ink">
              {typeHint[q.type] ? `${typeHint[q.type]} · ` : ""}{pts(q.points)}
            </span>
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
        {q.context ? (
          <div className="mb-3 rounded-lg border border-line bg-canvas px-4 py-3 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-ink">Casus</p>
            <MarkupText source={q.context} idPrefix={`${q.id}-casus`} className="mt-1 space-y-3 text-[0.95rem] leading-relaxed text-navy" />
          </div>
        ) : null}
        <div className="rounded-lg bg-sky px-4 py-4 sm:px-5">
          <MarkupText source={q.stem} idPrefix={`${q.id}-stam`} className="space-y-3 text-[0.98rem] leading-relaxed text-navy" />
        </div>
        {q.imageUrl ? (
          // Served through /inhoud/…, which signs a fresh URL on every load.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.imageUrl} alt={q.imageAlt ?? ""} className="mt-4 max-h-96 w-auto rounded-lg border border-line" />
        ) : null}

        <div className="mt-4">
          <AnswerInput q={q} answer={answer} locked={locked} isExam={isExam} dispatch={dispatch} />
        </div>

        {answer.error ? <p role="alert" className="mt-3 text-sm text-danger">{answer.error}</p> : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {!answered ? (
            <Button type="submit" disabled={!canSubmit(state)} className="h-10 px-5 font-semibold">
              {answer.status === "submitting" ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {isExam ? "Antwoord opslaan" : q.type === "open" ? "Bekijk antwoordmodel" : "Controleer antwoord"}
            </Button>
          ) : isExam ? (
            <span className="text-sm font-medium text-blue">Antwoord opgeslagen</span>
          ) : null}
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="ghost" disabled={state.index === 0} onClick={() => dispatch({ type: "go", index: state.index - 1 })}>
              <ArrowLeft aria-hidden="true" /> <span className="max-sm:sr-only">Vorige vraag</span>
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
            >
              <FeedbackPanel q={q} answer={answer} fb={fb} onSelfGrade={onSelfGrade} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {footer}
    </section>
  );
}

const currentIds = (a: AnswerState) => (a.response && "option_ids" in a.response ? a.response.option_ids : []);
const toggle = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

function AnswerInput({ q, answer, locked, isExam, dispatch }: {
  q: PracticeQuestion;
  answer: AnswerState;
  locked: boolean;
  isExam: boolean;
  dispatch: (a: EngineAction) => void;
}) {
  const fb = answer.feedback;
  const r = answer.response;

  if (q.type === "single_choice" || q.type === "multiple_choice") {
    const multi = q.type === "multiple_choice";
    const chosen = new Set(r && "option_id" in r ? [r.option_id] : r && "option_ids" in r ? r.option_ids : []);
    const correct = new Set(
      fb ? (multi ? q.options.filter((o) => fb.answer.labels?.includes(o.label)).map((o) => o.id) : fb.correctOptionId ? [fb.correctOptionId] : []) : [],
    );
    return (
      <fieldset disabled={locked}>
        <legend className="sr-only">{multi ? "Kies alle juiste antwoorden" : "Kies een antwoord"}</legend>
        <ul className="space-y-2">
          {q.options.map((o) => {
            const selected = chosen.has(o.id);
            const isCorrect = correct.has(o.id);
            const isWrongPick = Boolean(fb) && selected && !isCorrect;
            const missed = Boolean(fb) && multi && isCorrect && !selected;
            return (
              <li key={o.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-[0.95rem] text-navy transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-blue",
                    !fb && (selected ? "border-accent-blue bg-sky/70" : "border-line hover:border-[#c3d3e6] hover:bg-canvas"),
                    isCorrect && "border-success bg-success-soft",
                    isWrongPick && "border-danger/60 bg-danger-soft",
                    fb && !isCorrect && !isWrongPick && "border-line opacity-80",
                    locked && "cursor-default",
                  )}
                >
                  <input
                    type={multi ? "checkbox" : "radio"}
                    name={`vraag-${q.id}`}
                    value={o.id}
                    checked={selected}
                    onChange={() =>
                      dispatch({ type: "respond", response: multi ? { option_ids: toggle([...chosen], o.id) } : { option_id: o.id } })
                    }
                    className="mt-1 size-4 shrink-0 accent-accent-blue"
                  />
                  <span className="font-semibold">{o.label}.</span>
                  <span className="flex-1">{o.body}</span>
                  {isCorrect && selected ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-label="Juist" /> : null}
                  {missed ? <span className="text-xs font-medium text-success-ink">Ook juist</span> : null}
                  {isCorrect && !selected && !multi ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-label="Juiste antwoord" /> : null}
                  {isWrongPick ? <CircleX className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Jouw antwoord, onjuist" /> : null}
                  {isExam && locked && selected ? <span className="text-xs font-medium text-blue">Opgeslagen</span> : null}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>
    );
  }

  if (q.type === "dropdowns") {
    const values = r && "answers" in r ? r.answers : q.items.map(() => null);
    const key = fb?.answer.answers;
    return (
      <fieldset disabled={locked}>
        <legend className="sr-only">Kies per onderdeel het juiste antwoord</legend>
        <ol className="divide-y divide-line rounded-lg border border-line">
          {q.items.map((item, i) => {
            const value = values[i];
            const ok = key ? value === key[i] : null;
            return (
              <li key={i} className="grid gap-2 px-3.5 py-3 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-center sm:gap-4">
                <label htmlFor={`${q.id}-k${i}`} className="text-[0.95rem] text-navy">{item.prompt}</label>
                <div>
                  <div className="flex items-center gap-2">
                    <select
                      id={`${q.id}-k${i}`}
                      value={value ?? ""}
                      onChange={(e) => {
                        const next = [...values];
                        next[i] = e.target.value || null;
                        dispatch({ type: "respond", response: { answers: next } });
                      }}
                      className={cn(
                        "h-10 w-full rounded-lg border bg-white px-3 text-base text-navy sm:text-sm",
                        ok === true ? "border-success bg-success-soft" : ok === false ? "border-danger/60 bg-danger-soft" : "border-input",
                      )}
                    >
                      <option value="">Kies…</option>
                      {item.choices.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {ok === true ? <CircleCheck className="size-5 shrink-0 text-success" aria-label="Juist" /> : null}
                    {ok === false ? <CircleX className="size-5 shrink-0 text-danger" aria-label="Onjuist" /> : null}
                  </div>
                  {ok === false && key ? <p className="mt-1 text-xs text-success-ink">Juist: {key[i]}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </fieldset>
    );
  }

  if (q.type === "numeric") {
    const value = r && "value" in r ? r.value : "";
    return (
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${q.id}-antwoord`} className="text-sm font-semibold text-navy">Antwoord</label>
        <input
          id={`${q.id}-antwoord`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={locked}
          value={value}
          maxLength={60}
          onChange={(e) => dispatch({ type: "respond", response: { value: e.target.value } })}
          className={cn(
            "h-10 w-40 rounded-lg border bg-white px-3 text-base tabular-nums text-navy sm:text-sm",
            fb ? (fb.isCorrect ? "border-success bg-success-soft" : "border-danger/60 bg-danger-soft") : "border-input",
          )}
        />
        {q.unit ? <span className="text-sm text-muted-ink">{q.unit}</span> : null}
      </div>
    );
  }

  const text = r && "text" in r ? r.text : "";
  return (
    <div>
      <label htmlFor={`${q.id}-antwoord`} className="text-sm font-semibold text-navy">Jouw antwoord</label>
      <textarea
        id={`${q.id}-antwoord`}
        disabled={locked}
        value={text}
        maxLength={8000}
        rows={5}
        onChange={(e) => dispatch({ type: "respond", response: { text: e.target.value } })}
        className="mt-1.5 block w-full rounded-lg border border-input bg-white px-3 py-2 text-base leading-relaxed text-navy disabled:bg-canvas sm:text-[0.95rem]"
      />
    </div>
  );
}

function FeedbackPanel({ q, answer, fb, onSelfGrade }: {
  q: PracticeQuestion;
  answer: AnswerState;
  fb: AnswerFeedback;
  onSelfGrade: (questionId: string, score: number) => Promise<string | null>;
}) {
  const unanswered = answer.response === null;
  const ungraded = fb.score === null && !unanswered;
  const partial = isPartial(fb);
  const tone = ungraded ? "pending" : fb.isCorrect ? "good" : partial ? "partial" : "bad";
  const correctOption = q.options.find((o) => o.id === fb.correctOptionId);
  const wrongWithReason = q.options.filter((o) => o.id !== fb.correctOptionId && fb.optionFeedback[o.id]);

  let title: string;
  if (unanswered) title = "Niet beantwoord";
  else if (ungraded) title = "Vergelijk je antwoord met het antwoordmodel";
  else if (q.type === "single_choice") title = fb.isCorrect ? `Juist antwoord: ${correctOption?.label}` : `Onjuist · het juiste antwoord is ${correctOption?.label}`;
  else title = fb.isCorrect ? "Juist" : partial ? "Deels juist" : "Onjuist";

  const solution =
    q.type === "multiple_choice" ? `Juiste antwoorden: ${fb.answer.labels?.join(", ")}`
      : q.type === "numeric" ? `Juiste antwoord: ${fb.answer.display ?? `${fb.answer.min}–${fb.answer.max}`}${fb.answer.display ? "" : q.unit ? ` ${q.unit}` : ""}`
        : q.type === "single_choice" && unanswered ? `Juiste antwoord: ${correctOption?.label}`
          : null;

  return (
    <div
      className={cn(
        "mt-5 rounded-lg border p-4 sm:p-5",
        tone === "good" && "border-success/35 bg-success-soft/60",
        tone === "bad" && "border-danger/30 bg-danger-soft/60",
        (tone === "partial" || tone === "pending") && "border-[#e8c48a] bg-[#fdf6ec]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={cn(
            "flex items-center gap-2 font-semibold",
            tone === "good" ? "text-success-ink" : tone === "bad" ? "text-danger" : "text-navy",
          )}
        >
          {tone === "good" ? <CircleCheck className="size-5" aria-hidden="true" /> : tone === "bad" ? <CircleX className="size-5" aria-hidden="true" /> : <CircleAlert className="size-5" aria-hidden="true" />}
          {title}
        </p>
        {fb.score !== null && q.type !== "single_choice" ? (
          <span className="text-sm font-semibold tabular-nums text-navy">
            {num(fb.score)} / {pts(fb.maxScore)}
          </span>
        ) : null}
      </div>
      {solution ? <p className="mt-1 text-sm font-medium text-navy">{solution}</p> : null}

      <div className="mt-3">
        {q.type === "open" ? <p className="mb-1 text-sm font-semibold text-navy">Antwoordmodel</p> : null}
        <MarkupText source={fb.explanation} idPrefix={`${q.id}-uitleg`} className="space-y-3 text-[0.95rem] leading-relaxed text-navy/90" />
      </div>

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

      {q.type === "open" && !unanswered ? <SelfGrade questionId={q.id} fb={fb} onSelfGrade={onSelfGrade} /> : null}
    </div>
  );
}

function SelfGrade({ questionId, fb, onSelfGrade }: {
  questionId: string;
  fb: AnswerFeedback;
  onSelfGrade: (questionId: string, score: number) => Promise<string | null>;
}) {
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const steps = Array.from({ length: Math.round(fb.maxScore * 2) + 1 }, (_, i) => i / 2);

  return (
    <div className="mt-4 border-t border-black/5 pt-3">
      <p id={`${questionId}-nakijken`} className="text-sm font-semibold text-navy">
        {fb.score === null ? "Hoeveel punten geef je jezelf?" : "Je score (aan te passen)"}
      </p>
      <div role="group" aria-labelledby={`${questionId}-nakijken`} className="mt-2 flex flex-wrap gap-1.5">
        {steps.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={fb.score === s}
            disabled={pending !== null}
            onClick={async () => {
              setPending(s);
              setError(await onSelfGrade(questionId, s));
              setPending(null);
            }}
            className={cn(
              "inline-flex h-9 min-w-11 items-center justify-center rounded-md border px-2.5 text-sm font-semibold tabular-nums transition-colors",
              fb.score === s ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:bg-canvas",
            )}
          >
            {pending === s ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : num(s)}
          </button>
        ))}
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
