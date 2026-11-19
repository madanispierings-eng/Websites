import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListChecks } from "lucide-react";
import { AccessNotice } from "@/components/course/access-notice";
import { CourseSubheader } from "@/components/course/course-subheader";
import { EmptyState } from "@/components/empty-state";
import { PracticeWorkspace, type WorkspaceMode } from "@/components/practice/practice-workspace";
import { examTitle, getCourse, getExams, getQuestionCounts, getTopicTree } from "@/lib/data/catalog";
import { getTopicStats } from "@/lib/data/learning";
import { getViewer } from "@/lib/supabase/server";
import { resumableSession } from "@/lib/practice/server";
import { finishSession, resumeSession, revealAnswer, selfGrade, startSession, submitAnswer, toggleBookmark } from "./actions";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ modus?: string; onderwerp?: string; tentamen?: string }> };

const MODES: WorkspaceMode[] = ["topic", "mixed", "incorrect"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: `Oefenen ${course.title}`, robots: { index: false, follow: true } } : {};
}

export default async function PracticePage({ params, searchParams }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const { modus, onderwerp, tentamen } = await searchParams;
  const [topics, counts, stats, viewer, exams] = await Promise.all([
    getTopicTree(course.id),
    getQuestionCounts(course.id),
    getTopicStats(course.id),
    getViewer(),
    getExams(course.id),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const topicIds = new Set(topics.flatMap((t) => [t.id, ...t.children.map((c) => c.id)]));
  const initialTopicId = onderwerp && topicIds.has(onderwerp) ? onderwerp : null;
  const initialExamId = exams.some((e) => e.id === tentamen) ? tentamen! : null;
  // Op de gewone oefenpagina alleen een onafgeronde oefensessie aanbieden; een onafgerond
  // tentamen hervat je via het tabblad Tentamens. Via de "?tentamen=…"-deeplink hervatten we
  // juist het betreffende tentamen.
  const resumable = await resumableSession(course.id, initialExamId ? "exam" : "practice");
  const initialMode: WorkspaceMode = MODES.includes(modus as WorkspaceMode) ? (modus as WorkspaceMode) : "topic";

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader
        course={course}
        active="oefenen"
        title="Oefenen"
        intro="Kies een onderwerp en test je kennis. Na elk antwoord lees je waarom het klopt of niet. Oude tentamens vind je op het tabblad Tentamens."
      />
      {/* Wider than the default container so the "lees de theorie" panel next to a question has room. */}
      <div className="mx-auto w-full max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
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
            exams={exams.map((e) => ({ id: e.id, label: examTitle(e), questionCount: e.questionCount }))}
            initialExamId={initialExamId}
            resumable={resumable}
            api={{ startSession: startSession.bind(null, course.id), submitAnswer, revealAnswer, selfGrade, finishSession, toggleBookmark, resumeSession }}
          />
        )}
      </div>
    </main>
  );
}
