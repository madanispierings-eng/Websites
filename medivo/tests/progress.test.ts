import { describe, expect, it } from "vitest";
import { coverage, summarize, type TopicProgress } from "@/lib/progress/summary";

const topic = (id: string, extra: Partial<TopicProgress> = {}): TopicProgress => ({
  id, title: `Onderwerp ${id}`, slug: id,
  questionsTotal: 10, questionsAnswered: 0, questionsCorrect: 0,
  flashcardsTotal: 10, flashcardsMastered: 0, flashcardsLearning: 0, flashcardsAgain: 0, flashcardsDue: 10,
  objectivesTotal: 0, objectivesDone: 0,
  ...extra,
});

describe("study progress", () => {
  it("measures coverage separately from the score", () => {
    // Every question tried, all wrong: the material is covered (questions half of the topic) but the score is 0%.
    const t = topic("a", { questionsAnswered: 10, questionsCorrect: 0 });
    expect(coverage(t)).toBe(0.5);
    const s = summarize({ answersGiven: 10, toRepeat: 10, topics: [t], exams: [] }, "/vakken/x");
    expect(s.coverage).toBe(0.5);
    expect(s.correctRate).toBe(0);
  });

  it("ignores topics without content", () => {
    const empty = topic("e", { questionsTotal: 0, flashcardsTotal: 0 });
    expect(coverage(empty)).toBeNull();
    const s = summarize({ answersGiven: 0, toRepeat: 0, topics: [empty, topic("a", { flashcardsMastered: 10, questionsAnswered: 10, questionsCorrect: 9 })], exams: [] }, "/v");
    expect(s.topicsWithContent).toBe(1);
    expect(s.topicsDone).toBe(1);
  });

  it("lists weak topics from enough answers, weakest first, and advises on the weakest", () => {
    const s = summarize(
      {
        answersGiven: 30,
        toRepeat: 12,
        topics: [
          topic("a", { questionsAnswered: 10, questionsCorrect: 7 }),
          topic("b", { questionsAnswered: 10, questionsCorrect: 4 }),
          topic("c", { questionsAnswered: 2, questionsCorrect: 0 }),
          topic("d", { questionsAnswered: 8, questionsCorrect: 8 }),
        ],
        exams: [],
      },
      "/vakken/x",
    );
    expect(s.weak.map((t) => t.id)).toEqual(["b", "a"]);
    expect(s.advice?.href).toBe("/vakken/x/oefenen?onderwerp=b");
  });

  it("suggests repeating mistakes when no topic is clearly weak", () => {
    const s = summarize({ answersGiven: 10, toRepeat: 2, topics: [topic("a", { questionsAnswered: 10, questionsCorrect: 8 })], exams: [] }, "/v");
    expect(s.advice?.href).toBe("/v/oefenen?modus=incorrect");
  });

  it("tells a new student where to start", () => {
    const s = summarize({ answersGiven: 0, toRepeat: 0, topics: [topic("a")], exams: [] }, "/v");
    expect(s.advice?.href).toBe("/v/oefenen?onderwerp=a");
    expect(s.correctRate).toBeNull();
  });
});
