import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenText, ListChecks, Target } from "lucide-react";
import { CourseSubheader } from "@/components/course/course-subheader";
import { EmptyState } from "@/components/empty-state";
import { Progress } from "@/components/ui/progress";
import { getCourse, getLearningObjectives, getQuestionCounts, getTopicTree } from "@/lib/data/catalog";
import { getCompletedObjectives, getObjectiveExplanations } from "@/lib/data/learning";
import { ObjectiveExplanation } from "@/components/objectives/objective-explanation";
import { container } from "@/lib/site";
import { getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ObjectiveItem } from "./objective-item";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: `Leerdoelen ${course.title}`, alternates: { canonical: `/vakken/${course.slug}/leerdoelen` } } : {};
}

export default async function ObjectivesPage({ params }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const [objectives, topics, completed, viewer, counts, explanations] = await Promise.all([
    getLearningObjectives(course.id),
    getTopicTree(course.id),
    getCompletedObjectives(),
    getViewer(),
    getQuestionCounts(course.id),
    getObjectiveExplanations(course.id),
  ]);
  const path = `/vakken/${course.slug}/leerdoelen`;
  const done = objectives.filter((o) => completed.has(o.id)).length;
  const groups = topics
    .map((t) => {
      const ids = new Set([t.id, ...t.children.map((c) => c.id)]);
      return { topic: t, items: objectives.filter((o) => ids.has(o.topicId)) };
    })
    .filter((g) => g.items.length);

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader course={course} active="leerdoelen" title="Leerdoelen" intro="Klap een leerdoel open voor de uitgewerkte uitleg, met dia’s en uitlegvideo’s. Vink het af zodra je het beheerst." />
      <div className={cn(container, "py-8 lg:py-10")}>
        {groups.length ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-5">
              {groups.map(({ topic, items }, i) => (
                <section key={topic.id} id={topic.slug} aria-labelledby={`${topic.slug}-titel`} className="scroll-mt-24 rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 id={`${topic.slug}-titel`} className="text-lg font-semibold text-navy">
                      <span className="mr-2 tabular-nums text-muted-ink">{i + 1}</span>{topic.title}
                    </h2>
                    <div className="flex gap-2 text-sm">
                      <Link href={`/vakken/${course.slug}/samenvatting#${topic.slug}`} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-blue hover:bg-sky">
                        <BookOpenText className="size-4" aria-hidden="true" /> Samenvatting
                      </Link>
                      {counts[topic.id] || topic.children.some((c) => counts[c.id]) ? (
                        <Link href={`/vakken/${course.slug}/oefenen?onderwerp=${topic.id}`} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-blue hover:bg-sky">
                          <ListChecks className="size-4" aria-hidden="true" /> Oefenen
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <ul className="mt-2 divide-y divide-line">
                    {items.map((o) => (
                      <ObjectiveItem
                        key={o.id}
                        id={o.id}
                        body={o.body}
                        completed={completed.has(o.id)}
                        canTrack={Boolean(viewer)}
                        path={path}
                        explanation={explanations.has(o.id) ? <ObjectiveExplanation id={o.id} explanation={explanations.get(o.id)!} /> : undefined}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)]">
                <h2 className="font-semibold text-navy">Jouw voortgang</h2>
                {viewer ? (
                  <>
                    <p className="mt-1 text-sm text-muted-ink">{done} van {objectives.length} leerdoelen afgevinkt</p>
                    <Progress value={objectives.length ? (done / objectives.length) * 100 : 0} className="mt-3 h-2 bg-sky [&>*]:bg-success" aria-label="Leerdoelen afgevinkt" />
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-ink">
                    <Link href={`/inloggen?volgende=${encodeURIComponent(path)}`} className="font-medium text-blue hover:underline">Log in</Link> om leerdoelen af te vinken en je voortgang te bewaren.
                  </p>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <EmptyState icon={Target} title="De leerdoelen worden voorbereid">
            Leerdoelen worden pas gepubliceerd als ze zijn gecontroleerd. Ze verschijnen hier per onderwerp.
          </EmptyState>
        )}
      </div>
    </main>
  );
}
