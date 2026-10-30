import { describe, expect, it } from "vitest";
import { answerFor, canSubmit, createEngine, engineReducer, hintVisible, isComplete, type EngineState } from "@/lib/practice/engine";
import type { AnswerFeedback, PracticeQuestion } from "@/lib/practice/types";

// Neutral fixtures: the engine is content-agnostic.
const q = (id: string, extra: Partial<PracticeQuestion> = {}): PracticeQuestion => ({
  id,
  topicId: "t1",
  topicTitle: "Onderwerp",
  type: "single_choice",
  context: null,
  stem: `Vraag ${id}`,
  points: 1,
  imageUrl: null,
  imageAlt: null,
  options: ["a", "b", "c", "d"].map((o) => ({ id: `${id}-${o}`, label: o.toUpperCase(), body: o })),
  items: [],
  unit: null,
  hint: null,
  ...extra,
});

const feedback: AnswerFeedback = {
  isCorrect: false, score: 0, maxScore: 1, correctOptionId: "q1-b", answer: {}, explanation: "x", concept: null, optionFeedback: {}, usedHint: false,
};

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
    expect(run(start, { type: "respond", response: { option_id: "q2-a" } })).toBe(start);
  });

  it("ignores a response of the wrong shape", () => {
    expect(run(start, { type: "respond", response: { text: "x" } })).toBe(start);
  });

  it("locks the choice while submitting and blocks a second submit", () => {
    const s = run(start, { type: "respond", response: { option_id: "q1-a" } }, { type: "submit-start" });
    expect(answerFor(s, "q1").status).toBe("submitting");
    expect(canSubmit(s)).toBe(false);
    expect(run(s, { type: "respond", response: { option_id: "q1-b" } })).toBe(s);
    expect(run(s, { type: "submit-start" })).toBe(s);
  });

  it("stores the server's answer, not the local one", () => {
    const s = run(
      start,
      { type: "respond", response: { option_id: "q1-c" } },
      { type: "submit-start" },
      { type: "submit-success", questionId: "q1", response: { option_id: "q1-a" }, feedback },
    );
    expect(answerFor(s, "q1")).toMatchObject({ status: "answered", response: { option_id: "q1-a" } });
    expect(run(s, { type: "respond", response: { option_id: "q1-b" } })).toBe(s);
  });

  it("returns to idle with an error after a failed submit", () => {
    const s = run(
      start,
      { type: "respond", response: { option_id: "q1-a" } },
      { type: "submit-start" },
      { type: "submit-failure", questionId: "q1", error: "Netwerkfout" },
    );
    expect(answerFor(s, "q1")).toMatchObject({ status: "idle", error: "Netwerkfout", response: { option_id: "q1-a" } });
    expect(canSubmit(s)).toBe(true);
  });

  it("keeps navigation within bounds", () => {
    expect(run(start, { type: "go", index: 1 }).index).toBe(1);
    expect(run(start, { type: "go", index: 2 })).toBe(start);
    expect(run(start, { type: "go", index: -1 })).toBe(start);
  });

  it("knows when each question type has an answer", () => {
    const dd = q("d", { type: "dropdowns", options: [], items: [{ prompt: "x", choices: ["laag", "hoog"] }, { prompt: "y", choices: ["ja", "nee"] }] });
    expect(isComplete(dd, { answers: [null, null] })).toBe(false);
    expect(isComplete(dd, { answers: ["hoog", null] })).toBe(true);
    expect(isComplete(dd, { answers: ["middel", null] })).toBe(false);
    const mc = q("m", { type: "multiple_choice" });
    expect(isComplete(mc, { option_ids: [] })).toBe(false);
    expect(isComplete(mc, { option_ids: ["m-a", "m-c"] })).toBe(true);
    expect(isComplete(q("n", { type: "numeric", options: [] }), { value: "  " })).toBe(false);
    expect(isComplete(q("o", { type: "open", options: [] }), { text: "Antwoord" })).toBe(true);
  });

  it("updates the score when an open answer is marked", () => {
    const open = q("o", { type: "open", options: [], points: 4 });
    const s = run(
      createEngine("s3", "mixed", [open]),
      { type: "respond", response: { text: "Antwoord" } },
      { type: "submit-start" },
      { type: "submit-success", questionId: "o", response: { text: "Antwoord" }, feedback: { ...feedback, score: null, maxScore: 4, correctOptionId: null } },
      { type: "graded", questionId: "o", score: 3.5, isCorrect: false },
    );
    expect(answerFor(s, "o").feedback).toMatchObject({ score: 3.5, isCorrect: false });
  });

  it("fills in all feedback when an exam is finished", () => {
    const exam = createEngine("s2", "exam", [q("q1"), q("q2")]);
    const s = run(exam, {
      type: "finished",
      review: {
        total: 2,
        answered: 1,
        correct: 1,
        withHint: 0,
        points: 2,
        scored: 1,
        review: [
          { ...feedback, questionId: "q1", response: { option_id: "q1-b" }, isCorrect: true, score: 1 },
          { ...feedback, questionId: "q2", response: null, correctOptionId: "q2-a" },
        ],
      },
    });
    expect(s.finished?.correct).toBe(1);
    expect(answerFor(s, "q2").feedback?.correctOptionId).toBe("q2-a");
    expect(canSubmit(s)).toBe(false);
  });

  describe("second attempt with a hint", () => {
    const hint = { title: "1.1 Paragraaf", blocks: [] };
    const hinted = createEngine("s4", "topic", [q("q1", { hint }), q("d", { type: "dropdowns", options: [], items: [{ prompt: "x", choices: ["a", "b"] }, { prompt: "y", choices: ["a", "b"] }] })]);
    const afterWrong = run(
      hinted,
      { type: "respond", response: { option_id: "q1-a" } },
      { type: "submit-start" },
      { type: "submit-success", questionId: "q1", response: { option_id: "q1-a" }, feedback: null, retry: { wrongOptionIds: ["q1-a"], wrongItems: [] } },
    );

    it("reopens the question without feedback and clears a single choice", () => {
      const a = answerFor(afterWrong, "q1");
      expect(a).toMatchObject({ status: "idle", feedback: null, response: null });
      expect(a.retry?.wrongOptionIds).toEqual(["q1-a"]);
      expect(hintVisible(afterWrong, afterWrong.questions[0])).toBe(true);
    });

    it("does not let the wrong option be picked again", () => {
      expect(run(afterWrong, { type: "respond", response: { option_id: "q1-a" } })).toBe(afterWrong);
      const s = run(afterWrong, { type: "respond", response: { option_id: "q1-b" } });
      expect(canSubmit(s)).toBe(true);
    });

    it("records the second answer as final", () => {
      const s = run(
        afterWrong,
        { type: "respond", response: { option_id: "q1-b" } },
        { type: "submit-start" },
        { type: "submit-success", questionId: "q1", response: { option_id: "q1-b" }, feedback: { ...feedback, isCorrect: true, score: 1, usedHint: true } },
      );
      expect(answerFor(s, "q1")).toMatchObject({ status: "answered", retry: null });
      expect(answerFor(s, "q1").feedback?.usedHint).toBe(true);
      expect(canSubmit(s)).toBe(false);
    });

    it("shows the answer when the student gives up", () => {
      const s = run(afterWrong, { type: "revealed", questionId: "q1", feedback: { ...feedback, usedHint: true } });
      expect(answerFor(s, "q1")).toMatchObject({ status: "answered", retry: null });
    });

    it("keeps a dropdown answer to adjust", () => {
      const s = run(
        { ...hinted, index: 1 },
        { type: "respond", response: { answers: ["a", "b"] } },
        { type: "submit-start" },
        { type: "submit-success", questionId: "d", response: { answers: ["a", "b"] }, feedback: null, retry: { wrongOptionIds: [], wrongItems: [1] } },
      );
      expect(answerFor(s, "d")).toMatchObject({ status: "idle", response: { answers: ["a", "b"] } });
      expect(answerFor(s, "d").retry?.wrongItems).toEqual([1]);
    });

    it("never shows a hint in exam mode", () => {
      const exam = createEngine("s5", "exam", [q("q1", { hint })]);
      const s = run(exam, { type: "open-hint", questionId: "q1" });
      expect(hintVisible(s, s.questions[0])).toBe(false);
    });
  });
});
