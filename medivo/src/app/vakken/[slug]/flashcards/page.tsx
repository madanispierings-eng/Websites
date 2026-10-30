import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Layers } from "lucide-react";
import { AccessNotice } from "@/components/course/access-notice";
import { CourseSubheader } from "@/components/course/course-subheader";
import { EmptyState } from "@/components/empty-state";
import { FlashcardStudio } from "@/components/flashcards/flashcard-studio";
import { getCourse, getTopicTree } from "@/lib/data/catalog";
import { getCourseOverview } from "@/lib/data/learning";
import { getFlashcardDeck } from "@/lib/flashcards/server";
import { container } from "@/lib/site";
import { getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { reviewFlashcard } from "./actions";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ onderwerp?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: `Flashcards ${course.title}`, robots: { index: false, follow: true } } : {};
}

export default async function FlashcardsPage({ params, searchParams }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const { onderwerp } = await searchParams;
  const [overview, topics, viewer, deck] = await Promise.all([
    getCourseOverview(course.id),
    getTopicTree(course.id),
    getViewer(),
    getFlashcardDeck(course.id),
  ]);
  // Cards hang on top-level topics and their children; the picker shows the top level, numbered like the summary.
  const parentOf = new Map(topics.flatMap((t) => [[t.id, t.id] as const, ...t.children.map((c) => [c.id, t.id] as const)]));
  const cards = deck.cards.map((c) => ({ ...c, topicId: parentOf.get(c.topicId) ?? c.topicId }));
  const deckTopics = topics.map((t, i) => ({ id: t.id, title: t.title, number: i + 1 }));
  const initialTopicId = onderwerp && deckTopics.some((t) => t.id === onderwerp) ? onderwerp : (deckTopics.find((t) => cards.some((c) => c.topicId === t.id))?.id ?? null);

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader
        course={course}
        active="flashcards"
        title="Flashcards"
        intro="Leer de begrippen per onderwerp. Draai de kaart om en geef eerlijk aan of je het wist: wat je nog niet weet komt vaker terug."
      />
      <div className={cn(container, "py-8 lg:py-10")}>
        {overview.flashcards === 0 ? (
          <EmptyState icon={Layers} title="Nog geen flashcards voor dit vak">
            Flashcards worden per onderwerp gepubliceerd zodra ze inhoudelijk zijn gecontroleerd.
          </EmptyState>
        ) : !viewer ? (
          <AccessNotice signedIn={false} next={`/vakken/${course.slug}/flashcards`} />
        ) : !cards.length ? (
          <AccessNotice signedIn next={`/vakken/${course.slug}/flashcards`} />
        ) : (
          <FlashcardStudio
            topics={deckTopics}
            cards={cards}
            initialProgress={deck.progress}
            initialTopicId={initialTopicId}
            review={reviewFlashcard}
          />
        )}
      </div>
    </main>
  );
}
