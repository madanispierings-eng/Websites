import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileText, GraduationCap, Landmark } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { courseSections } from "@/components/course/course-sections";
import { StudyProgress } from "@/components/course/study-progress";
import { VisitBeacon } from "@/components/course/visit-beacon";
import { EmptyState } from "@/components/empty-state";
import { getCourse, getTopicTree } from "@/lib/data/catalog";
import { getCourseOverview, getCourseProgress } from "@/lib/data/learning";
import { courseImage } from "@/lib/course-visuals";
import { container, ecLabel, yearLabel } from "@/lib/site";
import { getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  if (!course) return {};
  return {
    title: course.title,
    description: `${course.title} (${yearLabel(course.studyYear).toLowerCase()}, bachelor Geneeskunde Leiden): samenvatting, leerdoelen, oude tentamens, flashcards en oefenvragen.`,
    alternates: { canonical: `/vakken/${course.slug}` },
  };
}

export default async function CoursePage({ params }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const [overview, topics, viewer, progress] = await Promise.all([
    getCourseOverview(course.id),
    getTopicTree(course.id),
    getViewer(),
    getCourseProgress(course.id),
  ]);
  const base = `/vakken/${course.slug}`;
  const image = courseImage(course.slug);

  return (
    <main id="inhoud" className={cn(container, "flex-1 pb-16 pt-6")}>
      {viewer ? <VisitBeacon courseId={course.id} /> : null}
      <Breadcrumbs items={[{ href: "/vakken", label: "Vakken" }, { label: course.title }]} />

      {/* Course hero: the course photograph on the right, the title on solid navy on the left. */}
      <section className="relative mt-5 overflow-hidden rounded-2xl bg-navy text-white">
        <div className="absolute inset-y-0 right-0 w-full sm:w-[62%]">
          <Image src={image.src} alt="" fill priority sizes="(min-width: 640px) 62vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/65 sm:via-navy/85 sm:to-navy/30 lg:via-navy/55 lg:to-navy/0" aria-hidden="true" />
        </div>
        <div className="relative max-w-2xl px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">{yearLabel(course.studyYear)}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] sm:text-[2.75rem] sm:leading-[1.1]">{course.title}</h1>
          <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.95rem] font-medium text-white/90">
            <li className="inline-flex items-center gap-2"><GraduationCap className="size-[1.1rem]" aria-hidden="true" />{ecLabel(course.ec)}</li>
            <li className="inline-flex items-center gap-2"><Landmark className="size-[1.1rem]" aria-hidden="true" />{course.university}</li>
            <li className="inline-flex items-center gap-2"><FileText className="size-[1.1rem]" aria-hidden="true" />{yearLabel(course.studyYear)}</li>
          </ul>
          <p className="mt-5 max-w-xl leading-relaxed text-white/90">
            {course.description ??
              `Studiemateriaal voor ${course.title}, ${yearLabel(course.studyYear).toLowerCase()} van de ${course.program.charAt(0).toLowerCase()}${course.program.slice(1)} aan de ${course.university}.`}
          </p>
        </div>
      </section>

      {/* The five sections */}
      <section aria-label="Onderdelen" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-5">
        {courseSections.map((s, i) => {
          const n = s.count(overview);
          return (
            <Link
              key={s.key}
              href={`${base}/${s.key}`}
              className={cn(
                "group flex overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-card)] transition-shadow max-sm:flex-row sm:flex-col hover:shadow-[var(--shadow-lift)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue",
                // Three over two on tablets, with the bottom two centred; one row of five on wide screens.
                "lg:col-span-2 xl:col-span-1",
                i === 3 && "lg:col-start-2 xl:col-start-auto",
                i === 4 && "sm:col-span-2",
              )}
            >
              <div className={cn("relative shrink-0 overflow-hidden bg-sky max-sm:w-28 sm:aspect-[16/7]", i === 4 && "sm:aspect-[32/7] lg:aspect-[16/7]")}>
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 260px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col px-4 pb-4 pt-3.5 max-sm:py-3">
                <h2 className="font-semibold leading-snug text-navy">{s.title}</h2>
                <p className="mt-1 text-sm text-muted-ink">{s.body}</p>
                <p className="mt-auto flex items-center justify-between gap-3 pt-4 max-sm:pt-2 text-xs font-medium text-muted-ink">
                  {n > 0 ? s.countLabel(n) : "Wordt voorbereid"}
                  <span className="grid size-8 place-items-center rounded-full bg-sky text-navy transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </span>
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="onderwerpen-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 id="onderwerpen-titel" className="text-lg font-semibold text-navy">Inhoud per onderwerp</h2>
          {topics.length ? (
            <ol className="mt-4 space-y-2">
              {topics.map((t, i) => (
                <li key={t.id}>
                  <Link
                    href={`${base}/samenvatting#${t.slug}`}
                    className="group flex items-center gap-4 rounded-lg border border-line px-3 py-2.5 text-[0.95rem] text-navy transition-colors hover:border-[#c3d3e6] hover:bg-canvas"
                  >
                    <span className="grid h-7 min-w-9 place-items-center rounded-md bg-sky px-2 text-sm font-semibold tabular-nums text-blue">{i + 1}</span>
                    <span className="flex-1">{t.title}</span>
                    <ChevronRight className="size-4 shrink-0 text-navy/50 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="De onderwerpen worden voorbereid" className="mt-4">
              De inhoud van dit vak wordt nog samengesteld en gecontroleerd. Zodra onderwerpen zijn gepubliceerd, verschijnen ze hier.
            </EmptyState>
          )}
        </section>

        <StudyProgress progress={progress} courseTitle={course.title} base={base} />
      </div>
    </main>
  );
}
