import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CourseForm, type AdminCourse } from "../../course-form";
import { getAdminCourse, getAdminExams, getAdminTopics, topicTree } from "../../_components/data";
import { ExamForm } from "../../_components/forms";
import { TopicForm } from "../../_components/forms";
import { AdminCrumbs, Panel, StatusBadge, rightsLabel } from "../../_components/ui";

export const metadata: Metadata = { title: "Vak beheren", robots: { index: false, follow: false } };

export default async function AdminCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const course = await getAdminCourse((await params).slug);
  const [topics, exams] = await Promise.all([getAdminTopics(course.id), getAdminExams(course.id)]);
  const tree = topicTree(topics);
  const mainTopics = topics.filter((t) => !t.parent_id);

  return (
    <main id="inhoud" className={cn(container, "flex-1 space-y-6 py-10")}>
      <div>
        <AdminCrumbs items={[{ label: course.title }]} />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-navy">{course.title}</h1>
          <Link href={`/vakken/${course.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue hover:underline">
            Bekijk als student <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <Panel
        id="onderwerpen"
        title="Onderwerpen"
        description="Alle inhoud hangt aan een onderwerp. Open een onderwerp om de samenvatting, leerdoelen en oefenvragen te beheren."
      >
        {tree.length ? (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {tree.map((t) => (
              <li key={t.id}>
                <Link href={`/admin/onderwerpen/${t.id}`} className={cn("flex items-center gap-3 px-4 py-3 text-sm hover:bg-canvas", t.depth && "pl-10")}>
                  <span className="w-6 text-right text-xs tabular-nums text-muted-ink">{t.sort_order}</span>
                  <span className={cn("flex-1 text-navy", !t.depth && "font-medium")}>{t.title}</span>
                  <StatusBadge status={t.status} />
                  <ChevronRight className="size-4 text-navy/50" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-ink">Nog geen onderwerpen. Voeg hieronder het eerste toe.</p>
        )}
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="mb-3 text-sm font-semibold text-navy">Nieuw onderwerp</h3>
          <TopicForm courseId={course.id} parents={mainTopics.map((t) => ({ id: t.id, title: t.title }))} />
        </div>
      </Panel>

      <Panel id="tentamens" title="Oude tentamens" description="Alleen tentamens die je zelf hebt gemaakt of waarvoor je toestemming hebt. Koppel vragen aan een tentamen via het vraagformulier.">
        {exams.length ? (
          <ul className="space-y-3">
            {exams.map((e) => (
              <li key={e.id}>
                <details className="rounded-lg border border-line">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <span className="font-medium tabular-nums text-navy">{e.exam_year}</span>
                    <span className="flex-1 text-navy">{e.title ?? ""}</span>
                    <span className="text-xs text-muted-ink">{rightsLabel[e.rights_status]}</span>
                    <StatusBadge status={e.status} />
                  </summary>
                  <div className="border-t border-line p-4"><ExamForm courseId={course.id} exam={e} /></div>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-ink">Nog geen tentamens.</p>
        )}
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="mb-3 text-sm font-semibold text-navy">Tentamen toevoegen</h3>
          <ExamForm courseId={course.id} />
        </div>
      </Panel>

      <Panel id="instellingen" title="Vakgegevens">
        <CourseForm course={course as AdminCourse} />
      </Panel>
    </main>
  );
}
