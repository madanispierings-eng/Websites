/**
 * A student's progress in one course, as shown on the course page and the progress page.
 * Two separate measures, never mixed: coverage (how much of the material has been studied) and performance
 * (how well the practice questions went). 80% correct on questions does not mean 80% of the material is mastered.
 */

export type TopicProgress = {
  id: string;
  title: string;
  slug: string;
  questionsTotal: number;
  questionsAnswered: number;
  /** Right at the first go (answers made with a hint do not count). */
  questionsCorrect: number;
  flashcardsTotal: number;
  flashcardsMastered: number;
  flashcardsLearning: number;
  flashcardsAgain: number;
  flashcardsDue: number;
  objectivesTotal: number;
  objectivesDone: number;
};

export type ExamResult = { id: string; finishedAt: string; examTitle: string | null; questions: number; points: number; scored: number };

export type CourseProgress = { answersGiven: number; toRepeat: number; topics: TopicProgress[]; exams: ExamResult[] };

/** Share of a topic that has been studied: questions tried, flashcards mastered and objectives ticked off, equally weighted. */
export function coverage(t: TopicProgress): number | null {
  const parts: number[] = [];
  if (t.questionsTotal) parts.push(Math.min(t.questionsAnswered / t.questionsTotal, 1));
  if (t.flashcardsTotal) parts.push(Math.min(t.flashcardsMastered / t.flashcardsTotal, 1));
  if (t.objectivesTotal) parts.push(Math.min(t.objectivesDone / t.objectivesTotal, 1));
  return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
}

/** A topic counts as done once 80% of it has been studied. */
export const TOPIC_DONE = 0.8;
/** Below this share of first-go correct answers a topic needs attention (from at least MIN_ANSWERED answers). */
export const WEAK_BELOW = 0.75;
export const MIN_ANSWERED = 3;

export type Advice = { text: string; href: string; label: string };

export type ProgressSummary = {
  coverage: number;
  topicsDone: number;
  topicsWithContent: number;
  questionsTotal: number;
  questionsAnswered: number;
  questionsCorrect: number;
  correctRate: number | null;
  flashcards: { total: number; mastered: number; learning: number; again: number; due: number };
  weak: (TopicProgress & { rate: number })[];
  advice: Advice | null;
};

const sum = (ts: TopicProgress[], k: keyof TopicProgress) => ts.reduce((a, t) => a + (t[k] as number), 0);
export const pct = (x: number) => `${Math.round(x * 100)}%`;

export function summarize(p: CourseProgress, base: string): ProgressSummary {
  const covs = p.topics.map((t) => ({ t, c: coverage(t) })).filter((x): x is { t: TopicProgress; c: number } => x.c !== null);
  const questionsAnswered = sum(p.topics, "questionsAnswered");
  const questionsCorrect = sum(p.topics, "questionsCorrect");
  const weak = p.topics
    .filter((t) => t.questionsAnswered >= MIN_ANSWERED)
    .map((t) => ({ ...t, rate: t.questionsCorrect / t.questionsAnswered }))
    .filter((t) => t.rate < WEAK_BELOW)
    .sort((a, b) => a.rate - b.rate || b.questionsAnswered - a.questionsAnswered);
  const flashcards = {
    total: sum(p.topics, "flashcardsTotal"),
    mastered: sum(p.topics, "flashcardsMastered"),
    learning: sum(p.topics, "flashcardsLearning"),
    again: sum(p.topics, "flashcardsAgain"),
    due: sum(p.topics, "flashcardsDue"),
  };

  let advice: Advice | null = null;
  const firstWithQuestions = p.topics.find((t) => t.questionsTotal > 0);
  const studied = questionsAnswered + flashcards.mastered + flashcards.learning + flashcards.again + sum(p.topics, "objectivesDone");
  if (!studied) {
    advice = firstWithQuestions
      ? { text: `Begin met ${firstWithQuestions.title}: maak de oefenvragen of leer de flashcards.`, href: `${base}/oefenen?onderwerp=${firstWithQuestions.id}`, label: "Start met oefenen" }
      : null;
  } else if (weak[0] && weak[0].rate < 0.6) {
    advice = { text: `Je scoort laag op ${weak[0].title} (${pct(weak[0].rate)}). Oefen dit onderwerp opnieuw.`, href: `${base}/oefenen?onderwerp=${weak[0].id}`, label: "Oefen dit onderwerp" };
  } else if (p.toRepeat > 0) {
    advice = {
      text: `${p.toRepeat} ${p.toRepeat === 1 ? "vraag had" : "vragen had"} je nog niet in één keer goed. Herhaal je fouten.`,
      href: `${base}/oefenen?modus=incorrect`,
      label: "Herhaal je fouten",
    };
  } else if (flashcards.due > 0 && flashcards.mastered + flashcards.learning + flashcards.again > 0) {
    advice = { text: `${flashcards.due} flashcards zijn klaar om te herhalen.`, href: `${base}/flashcards`, label: "Herhaal flashcards" };
  } else {
    const next = covs.filter((x) => x.c < TOPIC_DONE).sort((a, b) => a.c - b.c)[0];
    if (next) advice = { text: `Ga verder met ${next.t.title}: daar heb je nog het minst gedaan.`, href: `${base}/oefenen?onderwerp=${next.t.id}`, label: "Ga verder" };
  }

  return {
    coverage: covs.length ? covs.reduce((a, x) => a + x.c, 0) / covs.length : 0,
    topicsDone: covs.filter((x) => x.c >= TOPIC_DONE).length,
    topicsWithContent: covs.length,
    questionsTotal: sum(p.topics, "questionsTotal"),
    questionsAnswered,
    questionsCorrect,
    correctRate: questionsAnswered ? questionsCorrect / questionsAnswered : null,
    flashcards,
    weak,
    advice,
  };
}
