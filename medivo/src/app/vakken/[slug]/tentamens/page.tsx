import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, History } from "lucide-react";
import { CourseSubheader } from "@/components/course/course-subheader";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourse, getExams } from "@/lib/data/catalog";
import type { Exam } from "@/lib/data/types";
import { resumableSession } from "@/lib/practice/server";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

const typeLabel: Record<Exam["examType"], string> = {
  regular: "Tentamen",
  resit: "Hertentamen",
  midterm: "Deeltoets",
  practice: "Proeftentamen",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: `Oude tentamens ${course.title}`, alternates: { canonical: `/vakken/${course.slug}/tentamens` } } : {};
}

export default async function ExamsPage({ params }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const [exams, resumable] = await Promise.all([getExams(course.id), resumableSession(course.id, "exam")]);

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader
        course={course}
        active="tentamens"
        title="Oude tentamens"
        intro="Oefententamens die aansluiten op de stof: dezelfde opbouw, vraagtypes en moeilijkheidsgraad als het echte tentamen."
      />
      <div className={cn(container, "py-8 lg:py-10")}>
        {resumable?.examId ? (
          <section aria-labelledby="hervat-tentamen" className="mb-5 rounded-xl border border-accent-blue/40 bg-sky/50 p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="flex flex-wrap items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-blue/15 text-accent-blue">
                <History className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="hervat-tentamen" className="font-semibold text-navy">Ga door waar je was gebleven</h2>
                <p className="mt-1 text-sm text-muted-ink">
                  Je hebt nog een onafgerond tentamen · {resumable.answered} van {resumable.total} vragen beantwoord.
                </p>
                <div className="mt-4">
                  <Button asChild className="h-10 font-semibold">
                    <Link href={`/vakken/${course.slug}/oefenen?tentamen=${resumable.examId}`}>Doorgaan</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : null}
        {exams.length ? (
          <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-[var(--shadow-card)]">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs uppercase tracking-[0.06em] text-muted-ink">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Jaar</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Vragen</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Uitwerkingen</th>
                  <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">Oefenen</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {exams.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-4 font-semibold tabular-nums text-navy">{e.examYear ?? "–"}</td>
                    <td className="px-5 py-4 text-navy">{e.title ?? typeLabel[e.examType]}</td>
                    <td className="px-5 py-4 tabular-nums text-muted-ink">{e.questionCount ?? "–"}</td>
                    <td className="px-5 py-4">
                      {e.hasExplanations ? <Badge className="bg-success-soft text-success-ink">Met uitleg</Badge> : <span className="text-muted-ink">Geen</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button asChild size="sm" className="font-semibold">
                        <Link href={`/vakken/${course.slug}/oefenen?tentamen=${e.id}`}>Start tentamen</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="Nog geen tentamens beschikbaar">
            De oefententamens voor dit vak worden nog voorbereid. Wil je alvast oefenen? Kijk bij{" "}
            <Link href={`/vakken/${course.slug}/oefenen`} className="font-medium text-blue hover:underline">Oefenen per onderwerp</Link>.
          </EmptyState>
        )}
      </div>
    </main>
  );
}
