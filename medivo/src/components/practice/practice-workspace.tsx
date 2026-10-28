"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState, useTransition } from "react";
import { ChevronDown, Clock, Layers, ListChecks, Loader2, RotateCcw, Shuffle, Timer } from "lucide-react";
import { QuestionView } from "@/components/practice/question-view";
import { TopicSidebar, type TopicStats } from "@/components/practice/topic-sidebar";
import { Button } from "@/components/ui/button";
import { answeredCount, createEngine, currentQuestion, engineReducer, type EngineAction, type EngineState } from "@/lib/practice/engine";
import type { PracticeApi, PracticeMode } from "@/lib/practice/types";
import type { TopicNode } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const modes: { value: PracticeMode; label: string; body: string; icon: typeof Layers }[] = [
  { value: "topic", label: "Per onderwerp", body: "Vragen uit één onderwerp, met direct uitleg.", icon: ListChecks },
  { value: "mixed", label: "Gemengd", body: "Vragen uit meerdere onderwerpen door elkaar.", icon: Shuffle },
  { value: "exam", label: "Tentamenmodus", body: "Geen tussentijdse feedback, optioneel met timer. Score en uitleg aan het eind.", icon: Timer },
  { value: "incorrect", label: "Fout beantwoord", body: "Alleen vragen die je de laatste keer fout had.", icon: RotateCcw },
];

type Holder = EngineState | null;
type HolderAction = EngineAction | { type: "init"; state: EngineState } | { type: "reset" };
function holderReducer(s: Holder, a: HolderAction): Holder {
  if (a.type === "init") return a.state;
  if (a.type === "reset") return null;
  return s ? engineReducer(s, a) : s;
}

export function PracticeWorkspace({
  courseTitle,
  topics,
  counts,
  stats,
  initialMode,
  initialTopicId,
  api,
}: {
  courseTitle: string;
  topics: TopicNode[];
  counts: Record<string, number>;
  stats: TopicStats;
  initialMode: PracticeMode;
  initialTopicId: string | null;
  api: PracticeApi;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<PracticeMode>(initialMode);
  const [topicId, setTopicId] = useState<string | null>(initialTopicId);
  const [mixedTopics, setMixedTopics] = useState<string[]>([]);
  const [examCount, setExamCount] = useState(20);
  const [examMinutes, setExamMinutes] = useState<number | null>(30);
  const [engine, dispatch] = useReducer(holderReducer, null);
  const [timer, setTimer] = useState<{ startedAt: number; limit: number } | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, startTransition] = useTransition();
  const [finishing, setFinishing] = useState(false);
  const [showTopics, setShowTopics] = useState(false);

  const topicTitle = (id: string | null) => topics.flatMap((t) => [t, ...t.children]).find((t) => t.id === id)?.title ?? null;
  const totalQuestions = Object.values(counts).reduce((a, b) => a + b, 0);

  function start() {
    setStartError(null);
    const topicIds = mode === "topic" ? (topicId ? [topicId] : []) : mode === "mixed" ? mixedTopics : [];
    startTransition(async () => {
      const res = await api.startSession({
        mode,
        topicIds,
        limit: mode === "exam" ? examCount : mode === "topic" ? 100 : 25,
        timeLimitSeconds: mode === "exam" && examMinutes ? examMinutes * 60 : null,
      });
      if (!res.ok) return setStartError(res.error);
      dispatch({ type: "init", state: createEngine(res.data.sessionId, mode, res.data.questions, res.data.bookmarkedIds) });
      setTimer(res.data.timeLimitSeconds ? { startedAt: Date.parse(res.data.startedAt), limit: res.data.timeLimitSeconds } : null);
      setShowTopics(false);
    });
  }

  const submit = useCallback(async () => {
    if (!engine) return;
    const q = currentQuestion(engine);
    const selected = q && engine.answers[q.id]?.selectedOptionId;
    if (!q || !selected) return;
    dispatch({ type: "submit-start" });
    try {
      const res = await api.submitAnswer({ sessionId: engine.sessionId, questionId: q.id, optionId: selected });
      if (res.ok) dispatch({ type: "submit-success", questionId: q.id, selectedOptionId: res.data.selectedOptionId, feedback: res.data.feedback });
      else dispatch({ type: "submit-failure", questionId: q.id, error: res.error });
    } catch {
      dispatch({ type: "submit-failure", questionId: q.id, error: "Geen verbinding. Je antwoord is niet verstuurd; probeer het opnieuw." });
    }
  }, [api, engine]);

  const finish = useCallback(async () => {
    if (!engine || finishing) return;
    setFinishing(true);
    const res = await api.finishSession({ sessionId: engine.sessionId });
    setFinishing(false);
    if (res.ok) {
      dispatch({ type: "finished", review: res.data });
      setTimer(null);
    }
  }, [api, engine, finishing]);

  async function bookmark(questionId: string, next: boolean) {
    dispatch({ type: "bookmark", questionId, bookmarked: next });
    const res = await api.toggleBookmark({ questionId, bookmarked: next });
    if (!res.ok) dispatch({ type: "bookmark", questionId, bookmarked: !next });
  }

  function newSession() {
    dispatch({ type: "reset" });
    router.refresh(); // fresh progress figures in the sidebar
  }

  const inSession = Boolean(engine);

  return (
    <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <button
          type="button"
          onClick={() => setShowTopics((v) => !v)}
          aria-expanded={showTopics}
          aria-controls="onderwerpen"
          className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-left text-sm font-semibold text-navy shadow-[var(--shadow-card)] lg:hidden"
        >
          <span>
            Onderwerpen
            {topicId ? <span className="ml-2 font-normal text-muted-ink">· {topicTitle(topicId)}</span> : null}
          </span>
          <ChevronDown className={cn("size-4 transition-transform", showTopics && "rotate-180")} aria-hidden="true" />
        </button>
        <div id="onderwerpen" className={cn("mt-3 lg:mt-0 lg:block", showTopics ? "block" : "hidden")}>
          <TopicSidebar
            courseTitle={courseTitle}
            topics={topics}
            counts={counts}
            stats={stats}
            selectedId={mode === "topic" ? topicId : null}
            disabled={inSession}
            onSelect={(id) => {
              setMode("topic");
              setTopicId(id);
              setShowTopics(false);
            }}
          />
        </div>
      </div>

      <div className="min-w-0">
        {engine?.finished ? (
          <ResultsBanner state={engine} onRestart={newSession} />
        ) : null}

        {engine ? (
          <QuestionView
            state={engine}
            dispatch={dispatch}
            onSubmit={submit}
            onBookmark={bookmark}
            footer={
              <SessionFooter
                state={engine}
                dispatch={dispatch}
                timer={timer}
                finishing={finishing}
                onFinish={finish}
                onRestart={newSession}
              />
            }
          />
        ) : (
          <section aria-labelledby="modus-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
            <h2 id="modus-titel" className="text-lg font-semibold text-navy">Kies hoe je wilt oefenen</h2>
            <div role="radiogroup" aria-labelledby="modus-titel" className="mt-4 grid gap-3 sm:grid-cols-2">
              {modes.map((m) => (
                <label
                  key={m.value}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-blue",
                    mode === m.value ? "border-accent-blue bg-sky/60" : "border-line hover:bg-canvas",
                  )}
                >
                  <input type="radio" name="modus" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} className="sr-only" />
                  <m.icon className="mt-0.5 size-5 shrink-0 text-blue" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold text-navy">{m.label}</span>
                    <span className="mt-0.5 block text-sm text-muted-ink">{m.body}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 border-t border-line pt-5">
              {mode === "topic" ? (
                <p className="text-sm text-navy">
                  {topicId ? (
                    <>Onderwerp: <strong>{topicTitle(topicId)}</strong> · {counts[topicId] ?? 0} vragen</>
                  ) : (
                    <span className="text-muted-ink">Kies een onderwerp in de lijst {""}
                      <span className="lg:hidden">hierboven</span><span className="hidden lg:inline">links</span>.
                    </span>
                  )}
                </p>
              ) : null}

              {mode === "mixed" ? (
                <fieldset>
                  <legend className="text-sm font-semibold text-navy">Onderwerpen (laat leeg voor alle onderwerpen)</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topics.filter((t) => (counts[t.id] ?? 0) + t.children.reduce((a, c) => a + (counts[c.id] ?? 0), 0) > 0).map((t) => {
                      const on = mixedTopics.includes(t.id);
                      return (
                        <label key={t.id} className={cn("cursor-pointer rounded-full border px-3 py-1.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-blue", on ? "border-accent-blue bg-sky text-navy" : "border-line text-muted-ink hover:text-navy")}>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={on}
                            onChange={() => setMixedTopics((cur) => (on ? cur.filter((x) => x !== t.id) : [...cur, t.id]))}
                          />
                          {t.title}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              {mode === "exam" ? (
                <div className="flex flex-wrap gap-6">
                  <label className="grid gap-1.5 text-sm font-semibold text-navy">
                    Aantal vragen
                    <select value={examCount} onChange={(e) => setExamCount(Number(e.target.value))} className="h-10 rounded-lg border border-input bg-white px-3 text-base font-normal sm:text-sm">
                      {[10, 20, 40, 60].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-navy">
                    Tijdslimiet
                    <select
                      value={examMinutes ?? 0}
                      onChange={(e) => setExamMinutes(Number(e.target.value) || null)}
                      className="h-10 rounded-lg border border-input bg-white px-3 text-base font-normal sm:text-sm"
                    >
                      <option value={0}>Geen timer</option>
                      {[15, 30, 60, 90, 120].map((n) => <option key={n} value={n}>{n} minuten</option>)}
                    </select>
                  </label>
                </div>
              ) : null}

              {mode === "incorrect" ? (
                <p className="text-sm text-muted-ink">We verzamelen de vragen die je bij je laatste poging fout had, uit alle onderwerpen van dit vak.</p>
              ) : null}

              {startError ? <p role="alert" className="mt-4 text-sm text-danger">{startError}</p> : null}

              <Button
                type="button"
                onClick={start}
                disabled={starting || totalQuestions === 0 || (mode === "topic" && !topicId)}
                className="mt-5 h-11 px-6 font-semibold"
              >
                {starting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                {mode === "exam" ? "Start tentamen" : "Start met oefenen"}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function useCountdown(timer: { startedAt: number; limit: number } | null, onExpire: () => void) {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);
  useEffect(() => {
    if (!timer) return;
    fired.current = false;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);
  const remaining = timer ? Math.max(0, Math.round(timer.limit - (now - timer.startedAt) / 1000)) : null;
  useEffect(() => {
    if (remaining === 0 && !fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [remaining, onExpire]);
  return remaining;
}

function SessionFooter({ state, dispatch, timer, finishing, onFinish, onRestart }: {
  state: EngineState;
  dispatch: (a: EngineAction) => void;
  timer: { startedAt: number; limit: number } | null;
  finishing: boolean;
  onFinish: () => void;
  onRestart: () => void;
}) {
  const remaining = useCountdown(state.finished ? null : timer, onFinish);
  const isExam = state.mode === "exam";
  // After finishing, every question carries review feedback, so count from the review instead of the engine.
  const done = state.finished ? state.finished.answered : answeredCount(state);
  const total = state.questions.length;

  return (
    <div className="mt-6 border-t border-line pt-5">
      {isExam || state.finished ? (
        <nav aria-label="Vragenoverzicht">
          <ol className="flex flex-wrap gap-1.5">
            {state.questions.map((q, i) => {
              const a = state.answers[q.id];
              const fb = a?.feedback;
              const skipped = Boolean(fb) && a?.selectedOptionId == null;
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "go", index: i })}
                    aria-current={state.index === i ? "step" : undefined}
                    aria-label={`Vraag ${i + 1}${skipped ? ", niet beantwoord" : fb ? (fb.isCorrect ? ", juist" : ", onjuist") : a?.status === "answered" ? ", beantwoord" : ""}`}
                    className={cn(
                      "grid size-9 place-items-center rounded-md border text-xs font-semibold tabular-nums",
                      skipped ? "border-dashed border-muted-ink/50 text-muted-ink"
                        : fb ? (fb.isCorrect ? "border-success bg-success-soft text-success-ink" : "border-danger/50 bg-danger-soft text-danger")
                        : a?.status === "answered" ? "border-accent-blue bg-sky text-navy" : "border-line text-muted-ink",
                      state.index === i && "ring-2 ring-navy ring-offset-1",
                    )}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-ink">{done} van {total} beantwoord</span>
        {remaining !== null ? (
          <span
            className={cn("inline-flex items-center gap-1.5 rounded-md bg-sky px-2.5 py-1 font-semibold tabular-nums text-navy", remaining < 60 && "bg-danger-soft text-danger")}
            role="timer"
            aria-label="Resterende tijd"
          >
            <Clock className="size-4" aria-hidden="true" />
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
          </span>
        ) : null}
        <div className="ml-auto flex gap-2">
          {state.finished ? (
            <Button type="button" variant="outline" onClick={onRestart}>Nieuwe sessie</Button>
          ) : (
            <Button
              type="button"
              variant={isExam ? "default" : "outline"}
              disabled={finishing}
              onClick={() => {
                if (!isExam || done === total || window.confirm(`Je hebt ${total - done} vragen niet beantwoord. Toch inleveren?`)) onFinish();
              }}
            >
              {finishing ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {isExam ? "Tentamen inleveren" : "Sessie afronden"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultsBanner({ state, onRestart }: { state: EngineState; onRestart: () => void }) {
  const r = state.finished!;
  const pct = r.total ? Math.round((r.correct / r.total) * 100) : 0;
  return (
    <section aria-labelledby="resultaat-titel" className="mb-5 flex flex-wrap items-center gap-5 rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="grid size-20 shrink-0 place-items-center rounded-full border-4 border-success/30 text-xl font-bold tabular-nums text-navy">{pct}%</div>
      <div className="flex-1">
        <h2 id="resultaat-titel" className="text-lg font-semibold text-navy">Sessie afgerond</h2>
        <p className="mt-1 text-sm text-muted-ink">
          {r.correct} van {r.total} goed · {r.answered} beantwoord. Loop hieronder de vragen na om de uitleg te lezen.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onRestart}>Nieuwe sessie</Button>
        <Button asChild variant="ghost"><Link href="/dashboard">Naar dashboard</Link></Button>
      </div>
    </section>
  );
}
