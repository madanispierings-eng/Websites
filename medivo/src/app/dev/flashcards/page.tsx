import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudyProgress } from "@/components/course/study-progress";
import { isLaunched } from "@/lib/env";
import type { CourseProgress, TopicProgress } from "@/lib/progress/summary";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";
import { FlashcardsPreview } from "./preview";

export const metadata: Metadata = { title: "Voorbeeld flashcards en voortgang", robots: { index: false, follow: false } };

const topic = (n: number, answered: number, correct: number, mastered: number): TopicProgress => ({
  id: `t${n}`, title: `Onderwerp ${n}`, slug: `onderwerp-${n}`,
  questionsTotal: 20, questionsAnswered: answered, questionsCorrect: correct,
  flashcardsTotal: 25, flashcardsMastered: mastered, flashcardsLearning: 3, flashcardsAgain: 2, flashcardsDue: 8,
  objectivesTotal: 0, objectivesDone: 0,
});

// Example figures to judge the layout; not real results.
const example: CourseProgress = {
  answersGiven: 140,
  toRepeat: 23,
  topics: [topic(1, 20, 17, 22), topic(2, 18, 9, 10), topic(3, 12, 8, 6), topic(4, 4, 3, 0), topic(5, 0, 0, 0)],
  exams: [],
};

export default function Page() {
  // For development and the pre-launch preview only; gone once Medivo is launched.
  if (isLaunched) notFound();
  return (
    <main id="inhoud" className={cn(container, "flex-1 py-10")}>
      <p className="mb-6 rounded-lg border border-[#e8c48a] bg-[#fdf6ec] px-4 py-3 text-sm text-navy">
        Ontwikkelweergave met opvultekst en voorbeeldcijfers. Er wordt niets opgeslagen.
      </p>
      <h1 className="mb-6 text-3xl font-bold text-navy">Flashcards</h1>
      <FlashcardsPreview />
      <h2 className="mb-4 mt-12 text-2xl font-bold text-navy">Mijn studievoortgang (voorbeeld)</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <StudyProgress progress={example} courseTitle="Voorbeeldvak" base="/vakken/voorbeeld" />
        <StudyProgress progress={null} courseTitle="Voorbeeldvak" base="/vakken/voorbeeld" />
      </div>
    </main>
  );
}
