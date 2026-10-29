import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { CourseSubheader } from "@/components/course/course-subheader";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourse, getExams } from "@/lib/data/catalog";
import type { Exam } from "@/lib/data/types";
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
  const exams = await getExams(course.id);

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader
        course={course}
        active="tentamens"
        title="Oude tentamens"
        intro="Alleen tentamenmateriaal waarvoor Medivo toestemming heeft of dat zelf is gemaakt, altijd met bronvermelding."
      />
      <div className={cn(container, "py-8 lg:py-10")}>
        {exams.length ? (
          <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-[var(--shadow-card)]">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs uppercase tracking-[0.06em] text-muted-ink">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Jaar</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Vragen</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Uitwerkingen</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Bron</th>
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
                    <td className="px-5 py-4 text-muted-ink">{e.source}</td>
                    <td className="px-5 py-4 text-right">
                      <Button asChild size="sm" className="font-semibold">
                        <Link href={`/vakken/${course.slug}/oefenen?tentamen=${e.id}`}>Oefenen</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="Nog geen tentamens beschikbaar">
            We publiceren alleen tentamens waarvoor we toestemming hebben. Wil je alvast oefenen? Kijk bij{" "}
            <Link href={`/vakken/${course.slug}/oefenen`} className="font-medium text-blue hover:underline">Oefenen per onderwerp</Link>.
          </EmptyState>
        )}
      </div>
    </main>
  );
}
