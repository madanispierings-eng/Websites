import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListChecks } from "lucide-react";
import { AccessNotice } from "@/components/course/access-notice";
import { CourseSubheader } from "@/components/course/course-subheader";
import { EmptyState } from "@/components/empty-state";
import { PracticeWorkspace } from "@/components/practice/practice-workspace";
import { getCourse, getQuestionCounts, getTopicTree } from "@/lib/data/catalog";
import { getTopicStats } from "@/lib/data/learning";
import type { PracticeMode } from "@/lib/practice/types";
import { container } from "@/lib/site";
import { getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { finishSession, startSession, submitAnswer, toggleBookmark } from "./actions";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ modus?: string; onderwerp?: string }> };

const MODES: PracticeMode[] = ["topic", "mixed", "exam", "incorrect"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: `Oefenen ${course.title}`, robots: { index: false, follow: true } } : {};
}

export default async function PracticePage({ params, searchParams }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const { modus, onderwerp } = await searchParams;
  const [topics, counts, stats, viewer] = await Promise.all([
    getTopicTree(course.id),
    getQuestionCounts(course.id),
    getTopicStats(course.id),
    getViewer(),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const topicIds = new Set(topics.flatMap((t) => [t.id, ...t.children.map((c) => c.id)]));
  const initialTopicId = onderwerp && topicIds.has(onderwerp) ? onderwerp : null;
  const initialMode = MODES.includes(modus as PracticeMode) ? (modus as PracticeMode) : "topic";

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader
        course={course}
        active="oefenen"
        title="Oefenen per onderwerp"
        intro="Kies een onderwerp en test je kennis met meerkeuzevragen. Na elk antwoord lees je waarom het klopt of niet."
      />
      <div className={cn(container, "py-8 lg:py-10")}>
        {total === 0 ? (
          <EmptyState icon={ListChecks} title="Nog geen oefenvragen voor dit vak">
            Vragen worden per onderwerp gepubliceerd zodra ze inhoudelijk zijn gecontroleerd en de rechten zijn geregeld.
          </EmptyState>
        ) : !viewer ? (
          <AccessNotice signedIn={false} next={`/vakken/${course.slug}/oefenen`} />
        ) : (
          <PracticeWorkspace
            courseTitle={course.title}
            topics={topics}
            counts={counts}
            stats={stats}
            initialMode={initialMode}
            initialTopicId={initialTopicId}
            api={{ startSession: startSession.bind(null, course.id), submitAnswer, finishSession, toggleBookmark }}
          />
        )}
      </div>
    </main>
  );
}
