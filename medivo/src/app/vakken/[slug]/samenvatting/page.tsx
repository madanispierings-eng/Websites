import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { AccessNotice } from "@/components/course/access-notice";
import { CourseSubheader } from "@/components/course/course-subheader";
import { EmptyState } from "@/components/empty-state";
import { getCourse, getTopicTree } from "@/lib/data/catalog";
import { getCourseOverview, getSummaries } from "@/lib/data/learning";
import { container } from "@/lib/site";
import { getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { SummaryReader } from "./summary-reader";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  if (!course) return {};
  // Premium content: keep it out of search results.
  return { title: `Samenvatting ${course.title}`, robots: { index: false, follow: true } };
}

export default async function SummaryPage({ params }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const [summaries, topics, overview, viewer] = await Promise.all([
    getSummaries(course.id),
    getTopicTree(course.id),
    getCourseOverview(course.id),
    getViewer(),
  ]);

  const allTopics = topics.flatMap((t) => [t, ...t.children]);
  const chapters = summaries.map((s) => {
    const topic = allTopics.find((t) => t.id === s.topicId);
    // The first chapter of a topic carries the topic anchor, so links from the course page land on it.
    const anchor = topic && summaries.find((x) => x.topicId === s.topicId)?.id === s.id ? topic.slug : `h-${s.id}`;
    return { ...s, anchor, topicTitle: topic?.title ?? "" };
  });

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader course={course} active="samenvatting" title="Volledige samenvatting" />
      <div className={cn(container, "py-8 lg:py-10")}>
        {chapters.length ? (
          <SummaryReader chapters={chapters} />
        ) : overview.summaries > 0 ? (
          <AccessNotice signedIn={Boolean(viewer)} next={`/vakken/${course.slug}/samenvatting`} />
        ) : (
          <EmptyState icon={FileText} title="De samenvatting wordt voorbereid">
            Hoofdstukken verschijnen hier zodra ze inhoudelijk zijn gecontroleerd en gepubliceerd.
          </EmptyState>
        )}
      </div>
    </main>
  );
}
