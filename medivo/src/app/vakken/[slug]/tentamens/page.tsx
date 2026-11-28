import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { CourseSubheader } from "@/components/course/course-subheader";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getCourse, getExams } from "@/lib/data/catalog";
import { getCourseProgress } from "@/lib/data/learning";
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

/** "Vraagstukken Buik Oefententamen 2" → "Oefententamen 2": the course name is already on the page. */
function shortTitle(e: Exam) {
  const t = e.title ?? typeLabel[e.examType];
  const m = t.match(/((?:Oefen|Proef|Her)?tentamen \d+)$/i);
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : t;
}

const totalPoints = (e: Exam) => e.structure.reduce((n, p) => n + p.points, 0);
const sameStructure = (a: Exam, b: Exam) => JSON.stringify(a.structure) === JSON.stringify(b.structure);
const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long" });

export default async function ExamsPage({ params }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const [rawExams, resumable, progress] = await Promise.all([
    getExams(course.id),
    resumableSession(course.id, "exam"),
    getCourseProgress(course.id),
  ]);
  const exams = [...rawExams].sort(
    (a, b) => (b.examYear ?? 0) - (a.examYear ?? 0) || shortTitle(a).localeCompare(shortTitle(b), "nl", { numeric: true }),
  );
  // Laatste afgeronde poging per tentamen (de lijst is al nieuwste-eerst).
  const lastResult = new Map<string, { scored: number; points: number; finishedAt: string }>();
  for (const r of progress?.exams ?? []) {
    if (r.examTitle && !lastResult.has(r.examTitle)) lastResult.set(r.examTitle, r);
  }
  const shared = exams.length > 0 && exams[0].structure.length > 0 && exams.every((e) => sameStructure(e, exams[0])) ? exams[0] : null;

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader
        course={course}
        active="tentamens"
        title="Oude tentamens"
        intro="Oefententamens die aansluiten op de stof: dezelfde opbouw, vraagtypes en moeilijkheidsgraad als het echte tentamen."
      />
      <div className={cn(container, "py-8 lg:py-10")}>
        {exams.length ? (
          <div className={cn("grid gap-8 lg:items-start lg:gap-10", shared ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : "max-w-4xl")}>
            <section aria-labelledby="tentamens-lijst">
              <h2 id="tentamens-lijst" className="sr-only">Tentamens</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-card)]">
                {exams.map((e) => {
                  const busy = resumable?.examId === e.id ? resumable : null;
                  const last = e.title ? lastResult.get(e.title) : undefined;
                  const points = totalPoints(e);
                  const meta = [
                    e.examYear ? String(e.examYear) : null,
                    e.questionCount ? `${e.questionCount} vragen` : null,
                    points ? `${points} punten` : null,
                    e.hasExplanations ? "met uitwerkingen" : null,
                  ].filter(Boolean);
                  const href = `/vakken/${course.slug}/oefenen?tentamen=${e.id}`;
                  return (
                    <li key={e.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-navy sm:text-lg">{shortTitle(e)}</h3>
                        <p className="mt-0.5 text-sm text-muted-ink">{meta.join(" · ")}</p>
                        {busy ? (
                          <div className="mt-3 max-w-xs">
                            <div className="h-1.5 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                              <div className="h-full rounded-full bg-accent-blue" style={{ width: `${Math.max(3, Math.round((busy.answered / busy.total) * 100))}%` }} />
                            </div>
                            <p className="mt-1.5 text-xs text-muted-ink">Bezig: {busy.answered} van {busy.total} vragen beantwoord</p>
                          </div>
                        ) : last && last.points > 0 ? (
                          <p className="mt-2 text-xs text-muted-ink">
                            Laatst gemaakt op {dateFmt.format(new Date(last.finishedAt))}:{" "}
                            <span className="font-semibold tabular-nums text-navy">{Math.round(last.scored * 10) / 10} van {last.points} punten</span>{" "}
                            ({Math.round((last.scored / last.points) * 100)}%)
                          </p>
                        ) : null}
                      </div>
                      <Button asChild variant={busy ? "default" : "outline"} className="h-11 w-full shrink-0 font-semibold sm:w-36">
                        <Link href={href}>{busy ? "Doorgaan" : last ? "Opnieuw maken" : "Start tentamen"}</Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {shared ? (
              <aside aria-labelledby="opbouw" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                <h2 id="opbouw" className="font-semibold text-navy">Opbouw van elk tentamen</h2>
                <dl className="mt-3 divide-y divide-line text-sm">
                  {shared.structure.map((p) => (
                    <div key={p.label} className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-muted-ink">{p.label}</dt>
                      <dd className="shrink-0 tabular-nums text-navy">{p.points} pt</dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4 pt-2.5 font-semibold text-navy">
                    <dt>Totaal</dt>
                    <dd className="tabular-nums">{totalPoints(shared)} pt</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs leading-relaxed text-muted-ink">
                  Je kunt tussendoor stoppen; je antwoorden blijven bewaard en je gaat later verder waar je was.
                </p>
              </aside>
            ) : null}
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
