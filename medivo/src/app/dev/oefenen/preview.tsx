"use client";

import { PracticeWorkspace } from "@/components/practice/practice-workspace";
import type { TopicNode } from "@/lib/data/types";
import type { AnswerFeedback, PracticeApi, PracticeQuestion } from "@/lib/practice/types";

// Development-only preview of the practice UI with an in-memory API.
// The questions are deliberately content-free placeholders: Medivo never invents medical questions.

const topics: TopicNode[] = [
  { id: "t1", parentId: null, slug: "onderwerp-1", title: "Onderwerp 1", sortOrder: 1, children: [
    { id: "t1a", parentId: "t1", slug: "sub-1a", title: "Subonderwerp 1a", sortOrder: 1 },
    { id: "t1b", parentId: "t1", slug: "sub-1b", title: "Subonderwerp 1b", sortOrder: 2 },
  ] },
  { id: "t2", parentId: null, slug: "onderwerp-2", title: "Onderwerp 2", sortOrder: 2, children: [] },
  { id: "t3", parentId: null, slug: "onderwerp-3", title: "Onderwerp 3 met een wat langere titel", sortOrder: 3, children: [] },
];

const questions: PracticeQuestion[] = Array.from({ length: 6 }, (_, i) => ({
  id: `q${i + 1}`,
  topicId: i < 3 ? "t1a" : "t2",
  topicTitle: i < 3 ? "Subonderwerp 1a" : "Onderwerp 2",
  stem: `Voorbeeldvraag ${i + 1}. Dit is opvultekst om de opmaak te testen; er staat geen inhoud in. Kies het antwoord dat met B is gemarkeerd.`,
  imageUrl: null,
  imageAlt: null,
  options: ["A", "B", "C", "D"].map((l) => ({ id: `q${i + 1}${l}`, label: l, body: `Antwoordoptie ${l} (opvultekst)` })),
}));

const key = (q: PracticeQuestion): AnswerFeedback => ({
  isCorrect: false,
  correctOptionId: `${q.id}B`,
  explanation: "Hier verschijnt de uitleg bij het juiste antwoord. In deze voorbeeldweergave is het opvultekst.",
  concept: "Hier staat het onderliggende concept.",
  optionFeedback: { [`${q.id}A`]: "Uitleg waarom A niet klopt (opvultekst).", [`${q.id}C`]: "Uitleg waarom C niet klopt (opvultekst)." },
});

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let mode = "topic";
const answers = new Map<string, string>();

const api: PracticeApi = {
  async startSession(input) {
    await wait(300);
    mode = input.mode;
    answers.clear();
    return { ok: true, data: { sessionId: crypto.randomUUID(), questions, startedAt: new Date().toISOString(), timeLimitSeconds: input.timeLimitSeconds, bookmarkedIds: [] } };
  },
  async submitAnswer({ questionId, optionId }) {
    await wait(250);
    if (!answers.has(questionId)) answers.set(questionId, optionId);
    const q = questions.find((x) => x.id === questionId)!;
    const selected = answers.get(questionId)!;
    const fb = { ...key(q), isCorrect: selected === `${q.id}B` };
    return { ok: true, data: { selectedOptionId: selected, feedback: mode === "exam" ? null : fb } };
  },
  async finishSession() {
    await wait(300);
    const review = questions.map((q) => {
      const sel = answers.get(q.id) ?? null;
      return { ...key(q), isCorrect: sel === `${q.id}B`, questionId: q.id, selectedOptionId: sel };
    });
    return { ok: true, data: { total: questions.length, answered: answers.size, correct: review.filter((r) => r.isCorrect).length, review } };
  },
  async toggleBookmark({ bookmarked }) {
    return { ok: true, data: { bookmarked } };
  },
};

export function PracticePreview() {
  return (
    <PracticeWorkspace
      courseTitle="Voorbeeldvak"
      topics={topics}
      counts={{ t1a: 3, t1b: 0, t2: 3, t3: 0 }}
      stats={{ t1a: { answered: 2, correct: 1 } }}
      initialMode="topic"
      initialTopicId="t1a"
      api={api}
    />
  );
}
