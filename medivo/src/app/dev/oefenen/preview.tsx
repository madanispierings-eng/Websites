"use client";

import { PracticeWorkspace } from "@/components/practice/practice-workspace";
import type { TopicNode } from "@/lib/data/types";
import type { AnswerFeedback, PracticeApi, PracticeQuestion, QuestionResponse } from "@/lib/practice/types";

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

const hint: PracticeQuestion["hint"] = {
  title: "1.2 Voorbeeldparagraaf uit de samenvatting",
  blocks: [
    { type: "paragraph", spans: [{ text: "Hier verschijnt het stuk uit de samenvatting dat bij de vraag hoort. " }, { text: "Kernbegrip", marks: ["term"] }, { text: " staat vetgedrukt (opvultekst)." }] },
    { type: "list", ordered: false, items: ["Eerste punt uit de paragraaf (opvultekst)", "Tweede punt uit de paragraaf (opvultekst)"] },
    { type: "paragraph", spans: [{ text: "Een tweede alinea, zodat het paneel ook bij een langere paragraaf te beoordelen is. Opvultekst opvultekst opvultekst opvultekst opvultekst." }] },
  ],
};
const base = { topicId: "t1a", topicTitle: "Subonderwerp 1a", context: null, imageUrl: null, imageAlt: null, options: [], items: [], unit: null, points: 1, hint };
const abcd = (id: string, n = 4) => ["A", "B", "C", "D", "E"].slice(0, n).map((l) => ({ id: `${id}${l}`, label: l, body: `Antwoordoptie ${l} (opvultekst)` }));

const questions: PracticeQuestion[] = [
  { ...base, id: "q1", type: "single_choice", stem: "Voorbeeldvraag met één goed antwoord. Opvultekst; kies B.", options: abcd("q1") },
  {
    ...base, id: "q2", type: "multiple_choice", options: abcd("q2", 5),
    stem: "Voorbeeldvraag waarbij meer antwoorden mogelijk zijn. Opvultekst; B en D zijn juist.\n\n| Kolom 1 | Kolom 2 |\n| --- | --- |\n| waarde | 1,2 |\n| waarde | 3,4 |",
  },
  {
    ...base, id: "q3", type: "dropdowns", points: 2,
    stem: "Voorbeeld van een list-box- of invulvraag. Kies per onderdeel; steeds de eerste optie is juist.",
    items: [
      { prompt: "Onderdeel 1 (opvultekst)", choices: ["eerste", "tweede", "derde"] },
      { prompt: "Onderdeel 2 met een iets langere omschrijving (opvultekst)", choices: ["eerste", "tweede"] },
      { prompt: "Onderdeel 3", choices: ["eerste", "tweede", "derde"] },
    ],
  },
  { ...base, id: "q4", type: "numeric", unit: "mg", stem: "Voorbeeld van een rekenvraag met kort antwoord. Opvultekst; het antwoord is 400 (goed: 380–420).\n\n$$ D = \\frac{C \\cdot V_d}{F} $$" },
  {
    ...base, id: "q5", type: "open", points: 4, topicId: "t2", topicTitle: "Onderwerp 2",
    context: "Voorbeeld van een casus die bij meerdere deelvragen hoort. Opvultekst over een patiënt en een geneesmiddel.",
    stem: "a) (4 pt) Voorbeeld van een open deelvraag. Leg uit in je eigen woorden (opvultekst).",
  },
];

const keys: Record<string, AnswerFeedback["answer"]> = {
  q2: { labels: ["B", "D"] },
  q3: { answers: ["eerste", "eerste", "eerste"] },
  q4: { min: 380, max: 420, display: "400 mg (goed: 380–420)" },
};

function grade(q: PracticeQuestion, r: QuestionResponse): number | null {
  if ("option_id" in r) return r.option_id === `${q.id}B` ? q.points : 0;
  if ("option_ids" in r) return [...r.option_ids].sort().join() === ["q2B", "q2D"].join() ? q.points : 0;
  if ("answers" in r) return (r.answers.filter((a, i) => a === keys.q3.answers![i]).length / q.items.length) * q.points;
  if ("value" in r) {
    const v = Number(r.value.replace(",", ".").match(/-?\d+(\.\d+)?/)?.[0]);
    return v >= 380 && v <= 420 ? q.points : 0;
  }
  return null;
}

const feedback = (q: PracticeQuestion, r: QuestionResponse | null, score: number | null): AnswerFeedback => ({
  isCorrect: score !== null && score >= q.points,
  score: r ? score : 0,
  maxScore: q.points,
  correctOptionId: q.type === "single_choice" ? `${q.id}B` : null,
  answer: keys[q.id] ?? {},
  explanation:
    q.type === "open"
      ? "Hier staat het antwoordmodel met de puntenverdeling (opvultekst).\n\n- Eerste punt van het model (1 pt)\n- Tweede punt van het model (3 pt)"
      : "Hier verschijnt de uitleg bij het juiste antwoord. In deze voorbeeldweergave is het opvultekst.",
  concept: q.type === "single_choice" ? "Hier staat het onderliggende concept." : null,
  optionFeedback: q.type === "single_choice" ? { [`${q.id}A`]: "Uitleg waarom A niet klopt (opvultekst)." } : {},
  usedHint: false,
});

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let mode = "topic";
const answers = new Map<string, { response: QuestionResponse; score: number | null; final: boolean; usedHint: boolean }>();

const api: PracticeApi = {
  async startSession(input) {
    await wait(300);
    mode = input.mode;
    answers.clear();
    return { ok: true, data: { sessionId: crypto.randomUUID(), questions, startedAt: new Date().toISOString(), timeLimitSeconds: input.timeLimitSeconds, bookmarkedIds: [] } };
  },
  async submitAnswer({ questionId, response }) {
    await wait(250);
    const q = questions.find((x) => x.id === questionId)!;
    const prev = answers.get(questionId);
    const score = grade(q, response);
    if (!prev) {
      // Like the database: a wrong first answer with a hint (outside exam mode) opens a second attempt.
      const retry = mode !== "exam" && q.hint !== null && score !== null && score < q.points;
      answers.set(questionId, { response, score, final: !retry, usedHint: false });
      if (retry) {
        const wrongItems = "answers" in response ? response.answers.flatMap((a, i) => (a === keys.q3.answers![i] ? [] : [i])) : [];
        return { ok: true, data: { response, feedback: null, retry: { wrongOptionIds: "option_id" in response ? [response.option_id] : [], wrongItems } } };
      }
    } else if (!prev.final) {
      answers.set(questionId, { response, score, final: true, usedHint: true });
    }
    const a = answers.get(questionId)!;
    const fb = { ...feedback(q, a.response, a.score), usedHint: a.usedHint };
    return { ok: true, data: { response: a.response, feedback: mode === "exam" ? null : fb, retry: null } };
  },
  async revealAnswer({ questionId }) {
    await wait(200);
    const q = questions.find((x) => x.id === questionId)!;
    const a = answers.get(questionId);
    if (!a) return { ok: false, error: "Deze vraag heeft geen openstaande tweede poging." };
    a.final = true;
    a.usedHint = true;
    return { ok: true, data: { feedback: { ...feedback(q, a.response, a.score), usedHint: true } } };
  },
  async selfGrade({ questionId, score }) {
    await wait(200);
    const q = questions.find((x) => x.id === questionId)!;
    const a = answers.get(questionId);
    if (a) a.score = score;
    return { ok: true, data: { score, isCorrect: score >= q.points } };
  },
  async finishSession() {
    await wait(300);
    const review = questions.map((q) => {
      const a = answers.get(q.id);
      return { ...feedback(q, a?.response ?? null, a ? a.score : 0), usedHint: Boolean(a?.usedHint), questionId: q.id, response: a?.response ?? null };
    });
    return {
      ok: true,
      data: {
        total: questions.length,
        answered: answers.size,
        correct: review.filter((r) => r.isCorrect).length,
        withHint: review.filter((r) => r.isCorrect && r.usedHint).length,
        points: questions.reduce((s, q) => s + q.points, 0),
        scored: review.reduce((s, r) => s + (r.score ?? 0), 0),
        review,
      },
    };
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
      counts={{ t1a: 4, t1b: 0, t2: 1, t3: 0 }}
      stats={{ t1a: { answered: 2, correct: 1 } }}
      initialMode="topic"
      initialTopicId="t1a"
      exams={[{ id: "e1", label: "Voorbeeldtentamen", questionCount: 5 }]}
      api={api}
    />
  );
}
