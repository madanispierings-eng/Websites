/** Flashcards: card status from the Leitner box, and the study session (rounds of "weet ik" / "nog niet"). */

export type Flashcard = { id: string; topicId: string; front: string; back: string };

/** The student's own schedule for a card; absent when the card was never studied. */
export type CardProgress = { box: number; lastKnown: boolean; dueAt: string };

/** nieuw: never studied · opnieuw: last answer "nog niet" · lerend: known once · beheerst: known on separate days. */
export type CardStatus = "nieuw" | "opnieuw" | "lerend" | "beheerst";

export function cardStatus(p: CardProgress | undefined): CardStatus {
  if (!p) return "nieuw";
  if (p.box === 0) return "opnieuw";
  return p.box >= 2 ? "beheerst" : "lerend";
}

/** Ready to study now: never seen, last answered "nog niet", or its next review date has passed. */
export function isDue(p: CardProgress | undefined, now = Date.now()): boolean {
  return !p || p.box === 0 || Date.parse(p.dueAt) <= now;
}

export type Tally = Record<CardStatus, number> & { total: number; due: number };

export function tally(cards: Flashcard[], progress: Record<string, CardProgress>, now = Date.now()): Tally {
  const t: Tally = { nieuw: 0, opnieuw: 0, lerend: 0, beheerst: 0, total: cards.length, due: 0 };
  for (const c of cards) {
    t[cardStatus(progress[c.id])] += 1;
    if (isDue(progress[c.id], now)) t.due += 1;
  }
  return t;
}

export type StudyState = {
  queue: string[];
  index: number;
  flipped: boolean;
  round: number;
  known: string[];
  again: string[];
  /** The round is over: show the summary. */
  roundDone: boolean;
};

export type StudyAction = { type: "flip" } | { type: "answer"; known: boolean } | { type: "next-round" };

export function shuffled<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function startStudy(ids: string[], shuffle: boolean, rand: () => number = Math.random): StudyState {
  return { queue: shuffle ? shuffled(ids, rand) : [...ids], index: 0, flipped: false, round: 1, known: [], again: [], roundDone: ids.length === 0 };
}

export const currentCardId = (s: StudyState) => (s.roundDone ? null : s.queue[s.index] ?? null);

export function studyReducer(s: StudyState, a: StudyAction): StudyState {
  switch (a.type) {
    case "flip":
      return s.roundDone ? s : { ...s, flipped: !s.flipped };
    case "answer": {
      const id = currentCardId(s);
      if (!id) return s;
      const known = a.known ? [...s.known, id] : s.known;
      const again = a.known ? s.again : [...s.again, id];
      const index = s.index + 1;
      return { ...s, known, again, index, flipped: false, roundDone: index >= s.queue.length };
    }
    case "next-round":
      // Another round with only the cards that were not known yet, in the same order they were missed.
      if (!s.roundDone || !s.again.length) return s;
      return { queue: s.again, index: 0, flipped: false, round: s.round + 1, known: [], again: [], roundDone: false };
  }
}
