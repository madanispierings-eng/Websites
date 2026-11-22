"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState, useTransition } from "react";
import { ChevronDown, Clock, History, Layers, ListChecks, Loader2, Pause, Play, RotateCcw, Shuffle, Timer, X } from "lucide-react";
import { QuestionView } from "@/components/practice/question-view";
import { TopicSidebar, type TopicStats } from "@/components/practice/topic-sidebar";
import { Button } from "@/components/ui/button";
import { answeredCount, createEngine, currentQuestion, engineReducer, isPartial, resumeEngine, type EngineAction, type EngineState } from "@/lib/practice/engine";
import type { PracticeApi, PracticeExam, PracticeMode, QuestionResponse, ResumableSession } from "@/lib/practice/types";
import type { TopicNode } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/** What the student picks in de oefenkiezer. Oude tentamens staan apart op hun eigen pagina. */
export type WorkspaceMode = PracticeMode;

type StartOpts = {
  sessionMode: PracticeMode;
  topicIds: string[];
  limit: number;
  timeLimitSeconds: number | null;
  examId: string | null;
  repeatAnswered?: boolean;
};

/** Shown before an exam starts: the instructions screen. */
type ExamIntro = { opts: StartOpts; count: number; minutes: number | null; label: string };

/** Indicatief cijfer (1–10) volgens een Cohen-Schotanus-variant: eerst de gokscore (`guess`)
 *  aftrekken, dan de 5,5-grens (cesuur) op 60% van het bereik tussen gokscore en maximumscore.
 *  Officieel leidt Leiden/LUMC die 60% af van de besten; solo nemen we de maximumscore als referentie. */
function examGrade(scored: number, points: number, guess: number): number | null {
  if (!points) return null;
  const g = Math.max(0, Math.min(guess, points * 0.95));
  const cesuur = g + 0.6 * (points - g);
  let c: number;
  if (scored <= g) c = 1;
  else if (scored <= cesuur) c = 1 + (4.5 * (scored - g)) / (cesuur - g);
  else c = 5.5 + (4.5 * (scored - cesuur)) / (points - cesuur);
  return Math.min(10, Math.max(1, Math.round(c * 10) / 10));
}

const modes: { value: WorkspaceMode; label: string; body: string; icon: typeof Layers }[] = [
  { value: "topic", label: "Per onderwerp", body: "Vragen uit één of meer gekozen onderwerpen, met direct uitleg.", icon: ListChecks },
  { value: "mixed", label: "Gemengd", body: "Vragen uit meerdere onderwerpen door elkaar.", icon: Shuffle },
  { value: "incorrect", label: "Fout beantwoord", body: "Vragen die je de laatste keer fout had, of alleen met hint goed.", icon: RotateCcw },
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
  exams = [],
  initialExamId = null,
  resumable = null,
  api,
}: {
  courseTitle: string;
  topics: TopicNode[];
  counts: Record<string, number>;
  stats: TopicStats;
  initialMode: WorkspaceMode;
  initialTopicId: string | null;
  exams?: PracticeExam[];
  initialExamId?: string | null;
  resumable?: ResumableSession | null;
  api: PracticeApi;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<WorkspaceMode>(initialMode);
  const [topicIds, setTopicIds] = useState<string[]>(initialTopicId ? [initialTopicId] : []);
  const [mixedTopics, setMixedTopics] = useState<string[]>([]);
  const [engine, dispatch] = useReducer(holderReducer, null);
  const [timer, setTimer] = useState<{ startedAt: number; limit: number } | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [allAnswered, setAllAnswered] = useState(false);
  const [examIntro, setExamIntro] = useState<ExamIntro | null>(null);
  const lastStartOpts = useRef<StartOpts | null>(null);
  const [starting, startTransition] = useTransition();
  const [finishing, setFinishing] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [startingNew, setStartingNew] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const autoResumed = useRef(false);

  const topicTitle = (id: string | null) => topics.flatMap((t) => [t, ...t.children]).find((t) => t.id === id)?.title ?? null;
  const totalQuestions = Object.values(counts).reduce((a, b) => a + b, 0);
  const topicQuestionCount = topicIds.reduce((a, id) => a + (counts[id] ?? 0), 0);
  const toggleTopic = (id: string) => {
    setMode("topic");
    setTopicIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const startSessionWith = useCallback(
    (opts: StartOpts) => {
      setStartError(null);
      setAllAnswered(false);
      lastStartOpts.current = opts;
      startTransition(async () => {
        const res = await api.startSession({
          mode: opts.sessionMode,
          topicIds: opts.topicIds,
          limit: opts.limit,
          timeLimitSeconds: opts.timeLimitSeconds,
          examId: opts.examId,
          repeatAnswered: opts.repeatAnswered,
        });
        if (!res.ok) {
          // Alle vragen van deze selectie al gemaakt: bied een bewuste herhaling aan i.p.v. een foutmelding.
          if (res.code === "all_answered") return setAllAnswered(true);
          return setStartError(res.error);
        }
        dispatch({ type: "init", state: createEngine(res.data.sessionId, opts.sessionMode, res.data.questions, res.data.bookmarkedIds) });
        setTimer(res.data.timeLimitSeconds ? { startedAt: Date.parse(res.data.startedAt), limit: res.data.timeLimitSeconds } : null);
        setShowTopics(false);
      });
    },
    [api],
  );

  // Start the same selection again, now including questions the student already answered.
  const repeatAnswered = useCallback(() => {
    if (lastStartOpts.current) startSessionWith({ ...lastStartOpts.current, repeatAnswered: true });
  }, [startSessionWith]);

  function start() {
    // Per onderwerp, gemengd en "fout beantwoord" pakken de hele (resterende) selectie in één
    // sessie — tot het maximum van 200 — zodat je kunt doorgaan tot je alles hebt gehad.
    // Tentamens start je niet hier maar via het tabblad Tentamens (deeplink).
    startSessionWith({
      sessionMode: mode,
      topicIds: mode === "topic" ? topicIds : mode === "mixed" ? mixedTopics : [],
      limit: 200,
      timeLimitSeconds: null,
      examId: null,
    });
  }

  // Arriving from "Oude tentamens" with a chosen exam: start that exam straight away, as an exam
  // (feedback and review at the end) without a timer, instead of showing the mode picker.
  const autoStarted = useRef(false);
  const [autoStart, setAutoStart] = useState(Boolean(initialExamId));
  // If there is already an unfinished session for this exam, resume it (keeping the student's
  // answers) instead of starting a fresh one — e.g. after a refresh on the "?tentamen=…" link.
  const resumeMatchesExam = Boolean(initialExamId && resumable && resumable.examId === initialExamId);
  useEffect(() => {
    if (!autoStart || autoStarted.current || engine || !initialExamId || examIntro || resumeMatchesExam) return;
    autoStarted.current = true;
    const ex = exams.find((e) => e.id === initialExamId);
    setExamIntro({
      opts: { sessionMode: "exam", topicIds: [], limit: 200, timeLimitSeconds: null, examId: initialExamId },
      count: ex?.questionCount ?? 0,
      minutes: null,
      label: ex?.label ?? "Oefententamen",
    });
  }, [autoStart, initialExamId, engine, examIntro, exams, resumeMatchesExam]);

  const resume = useCallback(async () => {
    if (!resumable || resuming) return;
    setResumeError(null);
    setResuming(true);
    const res = await api.resumeSession({ sessionId: resumable.sessionId });
    setResuming(false);
    if (!res.ok) return setResumeError(res.error);
    const { sessionId, mode: sessionMode, questions, startedAt, timeLimitSeconds, bookmarkedIds, answers } = res.data;
    dispatch({ type: "init", state: resumeEngine(sessionId, sessionMode, questions, answers, bookmarkedIds) });
    setTimer(timeLimitSeconds ? { startedAt: Date.parse(startedAt), limit: timeLimitSeconds } : null);
    setShowTopics(false);
  }, [api, resumable, resuming]);

  // Alleen de "?tentamen=…"-deeplink (vanaf Oude tentamens) springt direct terug in een lopend
  // tentamen. Op de gewone oefenpagina openen we nooit automatisch een sessie: de student komt op
  // het moduskeuzescherm, met daarboven een knop om door te gaan waar hij was gebleven.
  const canAutoResume = Boolean(resumable) && Boolean(initialExamId) && resumeMatchesExam;
  useEffect(() => {
    if (autoResumed.current || engine || starting || resuming || startingNew || !canAutoResume) return;
    autoResumed.current = true;
    void resume();
  }, [canAutoResume, engine, starting, resuming, startingNew, resume]);

  // Changing the selection clears a stale "already answered" notice or start error.
  useEffect(() => { setAllAnswered(false); setStartError(null); }, [mode, topicIds, mixedTopics]);

  const submit = useCallback(async () => {
    if (!engine) return;
    const q = currentQuestion(engine);
    const response = q && engine.answers[q.id]?.response;
    if (!q || !response) return;
    dispatch({ type: "submit-start" });
    try {
      const res = await api.submitAnswer({ sessionId: engine.sessionId, questionId: q.id, response });
      if (res.ok) dispatch({ type: "submit-success", questionId: q.id, response: res.data.response, feedback: res.data.feedback, retry: res.data.retry });
      else dispatch({ type: "submit-failure", questionId: q.id, error: res.error });
    } catch {
      dispatch({ type: "submit-failure", questionId: q.id, error: "Geen verbinding. Je antwoord is niet verstuurd; probeer het opnieuw." });
    }
  }, [api, engine]);

  // A tentamen saves answers in the background: no feedback, and the typed/picked response is left
  // untouched, so typing an open answer is never interrupted. "saved" only marks the answer recorded.
  // The latest save is tracked so hand-in can wait for it: a just-typed answer is never lost.
  const bgSaveInFlight = useRef<Promise<unknown> | null>(null);
  const bgSave = useCallback((questionId: string, response: QuestionResponse) => {
    if (!engine) return;
    const sessionId = engine.sessionId;
    const p = (async () => {
      try {
        const res = await api.submitAnswer({ sessionId, questionId, response });
        if (res.ok) dispatch({ type: "saved", questionId });
      } catch {
        // A failed background save is retried on the next change and flushed when the student hands in.
      }
    })();
    bgSaveInFlight.current = p;
    void p.finally(() => { if (bgSaveInFlight.current === p) bgSaveInFlight.current = null; });
  }, [api, engine]);

  const finish = useCallback(async () => {
    if (!engine || finishing) return;
    setFinishing(true);
    // Let a background save that is still running (a just-typed answer) reach the server first.
    if (bgSaveInFlight.current) await bgSaveInFlight.current;
    const res = await api.finishSession({ sessionId: engine.sessionId });
    setFinishing(false);
    if (res.ok) {
      dispatch({ type: "finished", review: res.data });
      setTimer(null);
    }
  }, [api, engine, finishing]);

  const selfGrade = useCallback(async (questionId: string, score: number) => {
    if (!engine) return null;
    try {
      const res = await api.selfGrade({ sessionId: engine.sessionId, questionId, score });
      if (!res.ok) return res.error;
      dispatch({ type: "graded", questionId, score: res.data.score, isCorrect: res.data.isCorrect });
      return null;
    } catch {
      return "Geen verbinding. Probeer het opnieuw.";
    }
  }, [api, engine]);

  const reveal = useCallback(async (questionId: string) => {
    if (!engine) return null;
    try {
      const res = await api.revealAnswer({ sessionId: engine.sessionId, questionId });
      if (!res.ok) return res.error;
      dispatch({ type: "revealed", questionId, feedback: res.data.feedback });
      return null;
    } catch {
      return "Geen verbinding. Probeer het opnieuw.";
    }
  }, [api, engine]);

  async function bookmark(questionId: string, next: boolean) {
    dispatch({ type: "bookmark", questionId, bookmarked: next });
    const res = await api.toggleBookmark({ questionId, bookmarked: next });
    if (!res.ok) dispatch({ type: "bookmark", questionId, bookmarked: !next });
  }

  function newSession() {
    setStartingNew(true); // the current session stays unfinished; don't auto-resume back into it
    setAutoStart(false); // show the mode picker after an auto-started exam, don't re-launch it
    dispatch({ type: "reset" });
    router.refresh(); // fresh progress figures in the sidebar
  }

  const inSession = Boolean(engine);
  // A tentamen runs in a focused environment: only the question, no topic sidebar on the left.
  const examSession = inSession && engine?.mode === "exam";
  // The countdown lives here so the timer can sit prominently at the top of the exam, not only in the footer.
  const { remaining, paused: timerPaused, toggle: toggleTimer } = useCountdown(engine && !engine.finished ? timer : null, finish);
  // While the chosen exam is being started automatically, show a loader instead of the mode picker.
  const autoStarting = autoStart && !engine && !startError && !examIntro;
  // Same loader while an in-progress session is being resumed automatically after a refresh.
  const autoResuming = canAutoResume && !engine && !startingNew && !resumeError;
  // The exam intro (instructions) also runs full-width, without the topic sidebar.
  const focusView = examSession || Boolean(examIntro && !engine);

  return (
    <div className={cn("grid gap-6", !focusView && "lg:grid-cols-[19rem_minmax(0,1fr)]")}>
      {focusView ? null : (
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
            {topicIds.length === 1 ? (
              <span className="ml-2 font-normal text-muted-ink">· {topicTitle(topicIds[0])}</span>
            ) : topicIds.length > 1 ? (
              <span className="ml-2 font-normal text-muted-ink">· {topicIds.length} gekozen</span>
            ) : null}
          </span>
          <ChevronDown className={cn("size-4 transition-transform", showTopics && "rotate-180")} aria-hidden="true" />
        </button>
        <div id="onderwerpen" className={cn("mt-3 lg:mt-0 lg:block", showTopics ? "block" : "hidden")}>
          <TopicSidebar
            courseTitle={courseTitle}
            topics={topics}
            counts={counts}
            stats={stats}
            selectedIds={mode === "topic" ? topicIds : []}
            disabled={inSession}
            onToggle={toggleTopic}
          />
        </div>
      </div>
      )}

      <div className="min-w-0">
        {remaining !== null ? (
          <div
            className={cn(
              "mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-card)]",
              examSession && "sticky top-16 z-20 lg:top-[4.75rem]",
              remaining < 60 && !timerPaused ? "border-danger/40 bg-danger-soft" : "border-line bg-white",
            )}
          >
            <span className="inline-flex items-center gap-2 text-lg font-semibold tabular-nums text-navy" role="timer" aria-label="Resterende tijd">
              <Clock className="size-5 text-blue" aria-hidden="true" />
              {formatRemaining(remaining)}
              {timerPaused ? <span className="text-sm font-normal text-muted-ink"> · gepauzeerd</span> : null}
            </span>
            {!engine?.finished ? (
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={toggleTimer}>
                {timerPaused ? <><Play className="size-4" aria-hidden="true" /> Hervat</> : <><Pause className="size-4" aria-hidden="true" /> Pauze</>}
              </Button>
            ) : null}
          </div>
        ) : null}

        {engine?.finished ? (
          <ResultsBanner state={engine} onRestart={newSession} />
        ) : null}

        {engine ? (
          <QuestionView
            state={engine}
            dispatch={dispatch}
            onSubmit={submit}
            onBgSave={bgSave}
            onBookmark={bookmark}
            onSelfGrade={selfGrade}
            onReveal={reveal}
            onFinish={finish}
            footer={
              <SessionFooter
                state={engine}
                dispatch={dispatch}
                finishing={finishing}
                onFinish={finish}
                onRestart={newSession}
              />
            }
          />
        ) : examIntro ? (
          <ExamIntroScreen
            intro={examIntro}
            starting={starting}
            onBegin={() => { const o = examIntro.opts; setExamIntro(null); startSessionWith(o); }}
            onCancel={() => { setExamIntro(null); setAutoStart(false); autoStarted.current = false; }}
          />
        ) : autoStarting || autoResuming ? (
          <section className="grid place-items-center rounded-xl border border-line bg-white p-12 text-center shadow-[var(--shadow-card)]">
            <Loader2 className="size-6 animate-spin text-blue" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-ink">{autoResuming ? "Je sessie wordt hervat…" : "Tentamen wordt geladen…"}</p>
          </section>
        ) : (
          <>
            {resumable ? (
              <section aria-labelledby="hervat-titel" className="mb-5 rounded-xl border border-accent-blue/40 bg-sky/50 p-5 shadow-[var(--shadow-card)] sm:p-6">
                <div className="flex flex-wrap items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-blue/15 text-accent-blue">
                    <History className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 id="hervat-titel" className="font-semibold text-navy">Ga door waar je was gebleven</h2>
                    <p className="mt-1 text-sm text-muted-ink">
                      Je hebt nog een onafgeronde {modeLabel(resumable.mode)}-sessie · {resumable.answered} van {resumable.total} vragen beantwoord.
                    </p>
                    {resumeError ? <p role="alert" className="mt-2 text-sm text-danger">{resumeError}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" onClick={resume} disabled={resuming} className="h-10 font-semibold">
                        {resuming ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                        {resumeError ? "Opnieuw proberen" : "Doorgaan"}
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

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
                <div className="text-sm text-navy">
                  {topicIds.length === 1 ? (
                    <p>Onderwerp: <strong>{topicTitle(topicIds[0])}</strong> · {topicQuestionCount} vragen</p>
                  ) : topicIds.length > 1 ? (
                    <>
                      <p><strong>{topicIds.length} onderwerpen</strong> gekozen · {topicQuestionCount} vragen samen</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {topicIds.map((id) => (
                          <li key={id} className="inline-flex items-center gap-1.5 rounded-full border border-accent-blue bg-sky px-2.5 py-1 text-xs text-navy">
                            {topicTitle(id)}
                            <button
                              type="button"
                              onClick={() => toggleTopic(id)}
                              aria-label={`${topicTitle(id)} verwijderen`}
                              className="grid size-4 place-items-center rounded-full text-navy/60 hover:bg-white/70 hover:text-navy"
                            >
                              <X className="size-3" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <span className="text-muted-ink">Kies één of meer onderwerpen in de lijst {""}
                      <span className="lg:hidden">hierboven</span><span className="hidden lg:inline">links</span>.
                    </span>
                  )}
                </div>
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

              {mode === "incorrect" ? (
                <p className="text-sm text-muted-ink">We verzamelen de vragen die je bij je laatste poging fout had of alleen met hint goed, uit alle onderwerpen van dit vak.</p>
              ) : null}

              {startError ? <p role="alert" className="mt-4 text-sm text-danger">{startError}</p> : null}

              {allAnswered ? (
                <div role="status" className="mt-4 rounded-lg border border-[#e8c48a] bg-[#fdf6ec] p-4 text-sm text-navy">
                  <p className="font-semibold">Je hebt alle vragen van deze selectie al gemaakt.</p>
                  <p className="mt-1 text-muted-ink">Oefen gericht je foute vragen, of begin opnieuw met al deze vragen erbij.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={repeatAnswered} disabled={starting}>
                      {starting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                      Opnieuw, met alle vragen
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => { setAllAnswered(false); setMode("incorrect"); }}>
                      Fout beantwoord oefenen
                    </Button>
                  </div>
                </div>
              ) : null}

              <Button
                type="button"
                onClick={start}
                disabled={starting || totalQuestions === 0 || (mode === "topic" && topicIds.length === 0)}
                className="mt-5 h-11 px-6 font-semibold"
              >
                {starting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                Start met oefenen
              </Button>
            </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const modeLabel = (m: PracticeMode) => (m === "exam" ? "tentamen" : modes.find((x) => x.value === m)?.label.toLowerCase() ?? "oefen");

/** A countdown the student can pause. Pausing is client-side only; it freezes the clock and the
 *  server no longer rejects answers after the time limit, so a paused tentamen never loses work. */
function useCountdown(timer: { startedAt: number; limit: number } | null, onExpire: () => void) {
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);
  const pausedMs = useRef(0);
  const pauseStart = useRef<number | null>(null);
  const fired = useRef(false);
  useEffect(() => {
    // A fresh timer resets the pause bookkeeping.
    pausedMs.current = 0;
    pauseStart.current = null;
    fired.current = false;
    setPaused(false);
    setNow(Date.now());
  }, [timer]);
  useEffect(() => {
    if (!timer || paused) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [timer, paused]);
  const elapsed = timer ? (now - timer.startedAt - pausedMs.current) / 1000 : 0;
  const remaining = timer ? Math.max(0, Math.round(timer.limit - elapsed)) : null;
  useEffect(() => {
    if (remaining === 0 && !fired.current && !paused) {
      fired.current = true;
      onExpire();
    }
  }, [remaining, paused, onExpire]);
  const toggle = useCallback(() => {
    setPaused((p) => {
      if (p) {
        if (pauseStart.current != null) pausedMs.current += Date.now() - pauseStart.current;
        pauseStart.current = null;
      } else {
        pauseStart.current = Date.now();
      }
      setNow(Date.now());
      return !p;
    });
  }, []);
  return { remaining, paused, toggle };
}

function SessionFooter({ state, dispatch, finishing, onFinish, onRestart }: {
  state: EngineState;
  dispatch: (a: EngineAction) => void;
  finishing: boolean;
  onFinish: () => void;
  onRestart: () => void;
}) {
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
              const skipped = Boolean(fb) && a?.response == null;
              const pending = Boolean(fb) && !skipped && (fb!.score === null || isPartial(fb!));
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "go", index: i })}
                    aria-current={state.index === i ? "step" : undefined}
                    aria-label={`Vraag ${i + 1}${skipped ? ", niet beantwoord" : fb ? (fb.score === null ? ", nog nakijken" : fb.isCorrect ? (fb.usedHint ? ", juist met hint" : ", juist") : isPartial(fb) ? ", deels juist" : ", onjuist") : a?.status === "answered" ? ", beantwoord" : ""}`}
                    className={cn(
                      "grid size-9 place-items-center rounded-md border text-xs font-semibold tabular-nums",
                      skipped ? "border-dashed border-muted-ink/50 text-muted-ink"
                        : pending ? "border-[#e8c48a] bg-[#fdf6ec] text-navy"
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
        <div className="ml-auto flex gap-2">
          {state.finished ? (
            <Button type="button" variant="outline" onClick={onRestart}>Terug naar oefenen</Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                disabled={finishing}
                onClick={() => {
                  // Leave to the topic/mode picker without finishing; the session stays saved and resumable.
                  if (!isExam || window.confirm("Terug naar het oefenmenu? Je tentamen wordt niet ingeleverd; je kunt later verdergaan.")) onRestart();
                }}
              >
                Terug naar oefenen
              </Button>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultsBanner({ state, onRestart }: { state: EngineState; onRestart: () => void }) {
  const r = state.finished!;
  const pct = r.points ? Math.round((r.scored / r.points) * 100) : 0;
  const toGrade = Object.values(state.answers).filter((a) => a.feedback && a.response !== null && a.feedback.score === null).length;
  const nl = (n: number) => n.toLocaleString("nl-NL", { maximumFractionDigits: 2 });
  // Gokscore voor de Cohen-Schotanus-correctie: per meerkeuzevraag met n opties telt 1/n punt als "gokbaar".
  const guess = state.mode === "exam"
    ? state.questions.reduce((s, q) => s + (q.type === "single_choice" && q.options.length ? q.points / q.options.length : 0), 0)
    : 0;
  const grade = state.mode === "exam" ? examGrade(r.scored, r.points, guess) : null;
  const passed = grade !== null && grade >= 5.5;
  return (
    <section aria-labelledby="resultaat-titel" className="mb-5 flex flex-wrap items-center gap-5 rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className={cn("grid size-20 shrink-0 place-items-center rounded-full border-4 text-xl font-bold tabular-nums text-navy", grade === null ? "border-success/30" : passed ? "border-success" : "border-danger/60")}>
        {grade !== null ? grade.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : `${pct}%`}
      </div>
      <div className="flex-1">
        <h2 id="resultaat-titel" className="text-lg font-semibold text-navy">{grade !== null ? "Tentamen afgerond" : "Sessie afgerond"}</h2>
        <p className="mt-1 text-sm text-muted-ink">
          {grade !== null ? (
            <><strong className={passed ? "text-success-ink" : "text-danger"}>Cijfer {grade.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} — {passed ? "geslaagd" : "niet gehaald"}</strong> (indicatief, Cohen-Schotanus-normering met gokcorrectie). </>
          ) : null}
          {nl(r.scored)} van {nl(r.points)} punten ({pct}%) · {r.correct} van {r.total} vragen volledig goed
          {r.withHint ? ` (waarvan ${r.withHint} met hint)` : ""} · {r.answered} beantwoord.{" "}
          {toGrade
            ? `Kijk nog ${toGrade} open ${toGrade === 1 ? "vraag" : "vragen"} na met het antwoordmodel (oranje in het overzicht); je cijfer loopt mee.`
            : "Loop hieronder de vragen na om de uitleg te lezen."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="default" onClick={onRestart}>Terug naar oefenen</Button>
        <Button asChild variant="ghost"><Link href="/dashboard">Naar dashboard</Link></Button>
      </div>
    </section>
  );
}

function ExamIntroScreen({ intro, starting, onBegin, onCancel }: {
  intro: ExamIntro;
  starting: boolean;
  onBegin: () => void;
  onCancel: () => void;
}) {
  const { count, minutes, label } = intro;
  const Point = ({ children }: { children: React.ReactNode }) => (
    <li className="flex gap-2.5">
      <span className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-accent-blue" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
  return (
    <section aria-labelledby="tentamen-intro-titel" className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sky text-blue"><Timer className="size-6" aria-hidden="true" /></span>
        <div>
          <p className="text-sm font-medium text-muted-ink">Tentamenmodus</p>
          <h2 id="tentamen-intro-titel" className="text-xl font-bold text-navy">Je staat op het punt een tentamen te starten</h2>
        </div>
      </div>
      {label ? <p className="mt-1.5 text-sm text-muted-ink">{label}</p> : null}

      <dl className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-line bg-canvas px-3 py-2">
          <dt className="text-xs text-muted-ink">Vragen</dt>
          <dd className="text-base font-semibold text-navy">{count ? count : "—"}</dd>
        </div>
        <div className="rounded-lg border border-line bg-canvas px-3 py-2">
          <dt className="text-xs text-muted-ink">Tijd</dt>
          <dd className="text-base font-semibold text-navy">{minutes ? `${minutes} min` : "Geen limiet"}</dd>
        </div>
        <div className="rounded-lg border border-line bg-canvas px-3 py-2">
          <dt className="text-xs text-muted-ink">Per vraag</dt>
          <dd className="text-base font-semibold text-navy">1 punt</dd>
        </div>
      </dl>

      <h3 className="mt-6 text-sm font-semibold text-navy">Lees dit voordat je begint</h3>
      <ul className="mt-2.5 space-y-2.5 text-sm leading-relaxed text-navy/90">
        <Point>Maak het tentamen <strong>zelfstandig en zonder hulpmiddelen</strong> — dus zonder de samenvatting of andere theorie ernaast. Zo oefen je onder echte tentamenomstandigheden.</Point>
        <Point>De <strong>tijd wordt bijgehouden</strong> en staat bovenin beeld zodra je begint. Je kunt pauzeren, maar houd dat beperkt voor een eerlijke uitslag. Is de tijd om, dan wordt het tentamen automatisch ingeleverd.</Point>
        <Point>Je krijgt <strong>tijdens het tentamen geen feedback</strong>. Je kunt vrij tussen de vragen navigeren, een vraag markeren om er later op terug te komen, en je antwoorden worden automatisch bewaard.</Point>
        <Point>Lees elke vraag rustig en volledig; bij meerkeuze is er <strong>één beste antwoord</strong>, tenzij anders vermeld.</Point>
        <Point>Na het inleveren worden je antwoorden <strong>geanalyseerd</strong>: je ziet per vraag of het goed was, het juiste antwoord met uitleg, en je krijgt een <strong>cijfer volgens de normering</strong> (Cohen-Schotanus-methode met gokcorrectie, zoals aan Leiden/het LUMC gebruikelijk). Het is een indicatief cijfer: de officiële cesuur wordt op de hele groep bepaald. Open vragen kijk je zelf na met het antwoordmodel; die punten tellen mee.</Point>
      </ul>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button type="button" onClick={onBegin} disabled={starting} className="h-11 px-6 font-semibold">
          {starting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Begin tentamen
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={starting}>Annuleren</Button>
        <span className="ml-auto text-sm text-muted-ink">Succes!</span>
      </div>
    </section>
  );
}

/** Aftelklok: 1:27:42 boven het uur, anders 27:42. */
function formatRemaining(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
