import { describe, expect, it } from "vitest";
import { answerFor, canSubmit, createEngine, engineReducer, type EngineState } from "@/lib/practice/engine";
import type { PracticeQuestion } from "@/lib/practice/types";

// Neutral fixtures: the engine is content-agnostic.
const q = (id: string): PracticeQuestion => ({
  id,
  topicId: "t1",
  topicTitle: "Onderwerp",
  stem: `Vraag ${id}`,
  imageUrl: null,
  imageAlt: null,
  options: ["a", "b", "c", "d"].map((o) => ({ id: `${id}-${o}`, label: o.toUpperCase(), body: o })),
});

const feedback = { isCorrect: false, correctOptionId: "q1-b", explanation: "x", concept: null, optionFeedback: {} };

function run(state: EngineState, ...actions: Parameters<typeof engineReducer>[1][]) {
  return actions.reduce(engineReducer, state);
}

describe("practice engine", () => {
  const start = createEngine("s1", "topic", [q("q1"), q("q2")]);

  it("cannot submit without a choice", () => {
    expect(canSubmit(start)).toBe(false);
    expect(run(start, { type: "submit-start" })).toBe(start);
  });

  it("ignores options that do not belong to the question", () => {
    expect(run(start, { type: "select", optionId: "q2-a" })).toBe(start);
  });

  it("locks the choice while submitting and blocks a second submit", () => {
    const s = run(start, { type: "select", optionId: "q1-a" }, { type: "submit-start" });
    expect(answerFor(s, "q1").status).toBe("submitting");
    expect(canSubmit(s)).toBe(false);
    expect(run(s, { type: "select", optionId: "q1-b" })).toBe(s);
    expect(run(s, { type: "submit-start" })).toBe(s);
  });

  it("stores the server's answer, not the local one", () => {
    const s = run(
      start,
      { type: "select", optionId: "q1-c" },
      { type: "submit-start" },
      { type: "submit-success", questionId: "q1", selectedOptionId: "q1-a", feedback },
    );
    expect(answerFor(s, "q1")).toMatchObject({ status: "answered", selectedOptionId: "q1-a" });
    expect(run(s, { type: "select", optionId: "q1-b" })).toBe(s);
  });

  it("returns to idle with an error after a failed submit", () => {
    const s = run(
      start,
      { type: "select", optionId: "q1-a" },
      { type: "submit-start" },
      { type: "submit-failure", questionId: "q1", error: "Netwerkfout" },
    );
    expect(answerFor(s, "q1")).toMatchObject({ status: "idle", error: "Netwerkfout", selectedOptionId: "q1-a" });
    expect(canSubmit(s)).toBe(true);
  });

  it("keeps navigation within bounds", () => {
    expect(run(start, { type: "go", index: 1 }).index).toBe(1);
    expect(run(start, { type: "go", index: 2 })).toBe(start);
    expect(run(start, { type: "go", index: -1 })).toBe(start);
  });

  it("fills in all feedback when an exam is finished", () => {
    const exam = createEngine("s2", "exam", [q("q1"), q("q2")]);
    const s = run(exam, {
      type: "finished",
      review: {
        total: 2,
        answered: 1,
        correct: 1,
        review: [
          { questionId: "q1", selectedOptionId: "q1-b", isCorrect: true, correctOptionId: "q1-b", explanation: "", concept: null, optionFeedback: {} },
          { questionId: "q2", selectedOptionId: null, isCorrect: false, correctOptionId: "q2-a", explanation: "", concept: null, optionFeedback: {} },
        ],
      },
    });
    expect(s.finished?.correct).toBe(1);
    expect(answerFor(s, "q2").feedback?.correctOptionId).toBe("q2-a");
    expect(canSubmit(s)).toBe(false);
  });
});
