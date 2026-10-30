import { describe, expect, it } from "vitest";
import { cardStatus, currentCardId, isDue, startStudy, studyReducer, tally, type Flashcard } from "@/lib/flashcards/deck";

const card = (id: string): Flashcard => ({ id, topicId: "t", front: id, back: id });
const NOW = Date.parse("2026-10-30T12:00:00Z");

describe("flashcard status", () => {
  it("follows the Leitner box", () => {
    expect(cardStatus(undefined)).toBe("nieuw");
    expect(cardStatus({ box: 0, lastKnown: false, dueAt: "2026-10-30T12:00:00Z" })).toBe("opnieuw");
    expect(cardStatus({ box: 1, lastKnown: true, dueAt: "2026-10-31T12:00:00Z" })).toBe("lerend");
    expect(cardStatus({ box: 3, lastKnown: true, dueAt: "2026-11-06T12:00:00Z" })).toBe("beheerst");
  });

  it("counts what is due", () => {
    const progress = {
      a: { box: 2, lastKnown: true, dueAt: "2026-11-02T12:00:00Z" },
      b: { box: 1, lastKnown: true, dueAt: "2026-10-29T12:00:00Z" },
      c: { box: 0, lastKnown: false, dueAt: "2026-10-30T12:00:00Z" },
    };
    expect(isDue(progress.a, NOW)).toBe(false);
    expect(isDue(progress.b, NOW)).toBe(true);
    const t = tally(["a", "b", "c", "d"].map(card), progress, NOW);
    expect(t).toMatchObject({ total: 4, due: 3, beheerst: 1, lerend: 1, opnieuw: 1, nieuw: 1 });
  });
});

describe("study session", () => {
  it("only answers after the card is flipped", () => {
    const s = startStudy(["a", "b"], false);
    // The reducer itself accepts an answer; the UI only offers the buttons after flipping.
    const flipped = studyReducer(s, { type: "flip" });
    expect(flipped.flipped).toBe(true);
    const next = studyReducer(flipped, { type: "answer", known: true });
    expect(next).toMatchObject({ index: 1, flipped: false, known: ["a"] });
    expect(currentCardId(next)).toBe("b");
  });

  it("repeats the cards that were not known in a next round", () => {
    let s = startStudy(["a", "b", "c"], false);
    s = studyReducer(s, { type: "answer", known: false });
    s = studyReducer(s, { type: "answer", known: true });
    s = studyReducer(s, { type: "answer", known: false });
    expect(s.roundDone).toBe(true);
    expect(currentCardId(s)).toBeNull();
    s = studyReducer(s, { type: "next-round" });
    expect(s).toMatchObject({ queue: ["a", "c"], round: 2, index: 0, roundDone: false });
  });

  it("shuffles without losing cards", () => {
    let i = 0;
    const s = startStudy(["a", "b", "c", "d"], true, () => [0.9, 0.1, 0.5][i++ % 3]);
    expect([...s.queue].sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("ends immediately for an empty selection", () => {
    expect(startStudy([], true).roundDone).toBe(true);
  });
});
