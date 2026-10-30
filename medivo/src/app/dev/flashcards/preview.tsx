"use client";

import { FlashcardStudio } from "@/components/flashcards/flashcard-studio";
import type { CardProgress, Flashcard } from "@/lib/flashcards/deck";

// Development-only preview of the flashcards with an in-memory review. Content-free placeholders.
const topics = [
  { id: "t1", title: "Onderwerp 1", number: 1 },
  { id: "t2", title: "Onderwerp 2 met een wat langere titel", number: 2 },
  { id: "t3", title: "Onderwerp 3", number: 3 },
];

const cards: Flashcard[] = [
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `a${i}`,
    topicId: "t1",
    front: `Voorbeeldvraag ${i + 1} over de stof (opvultekst)?`,
    back:
      i === 2
        ? "Antwoord met een formule:\n\n$$ t_{1/2} = \\frac{0{,}7 \\cdot V_d}{Cl} $$\n\nEn een toelichting in een zin (opvultekst)."
        : i === 0
          ? "Antwoord als lijst:\n\n- Eerste punt van het antwoord (opvultekst)\n- Tweede punt, iets langer, zodat het over twee regels loopt (opvultekst)\n- Derde punt (opvultekst)"
          : `Kort antwoord op vraag ${i + 1} (opvultekst), in een of twee zinnen zoals op de echte kaarten.`,
  })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: `b${i}`, topicId: "t2", front: `Langere voorbeeldvraag ${i + 1} die over meerdere regels loopt, zoals een casusvraag (opvultekst)?`, back: "Antwoord (opvultekst)." })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, topicId: "t3", front: `Vraag ${i + 1} (opvultekst)?`, back: "Antwoord (opvultekst)." })),
];

const day = 24 * 3600 * 1000;
const progress: Record<string, CardProgress> = {
  a0: { box: 3, lastKnown: true, dueAt: new Date(Date.now() + 5 * day).toISOString() },
  a1: { box: 2, lastKnown: true, dueAt: new Date(Date.now() + 2 * day).toISOString() },
  a2: { box: 1, lastKnown: true, dueAt: new Date(Date.now() + day).toISOString() },
  a3: { box: 0, lastKnown: false, dueAt: new Date().toISOString() },
  b0: { box: 2, lastKnown: true, dueAt: new Date(Date.now() + 2 * day).toISOString() },
};

export function FlashcardsPreview() {
  return (
    <FlashcardStudio
      topics={topics}
      cards={cards}
      initialProgress={progress}
      initialTopicId="t1"
      review={async ({ known }) => {
        await new Promise((r) => setTimeout(r, 150));
        return { ok: true, data: { box: known ? 1 : 0, lastKnown: known, dueAt: new Date(Date.now() + (known ? day : 0)).toISOString() } };
      }}
    />
  );
}
