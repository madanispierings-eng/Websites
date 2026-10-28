import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenText, ChevronRight, ClipboardList, RotateCcw, Timer } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { courseSections } from "@/components/course/course-sections";
import { VisitBeacon } from "@/components/course/visit-beacon";
import { EmptyState } from "@/components/empty-state";
import { getCourse, getTopicTree } from "@/lib/data/catalog";
import { getCourseOverview } from "@/lib/data/learning";
import { courseHeroImage } from "@/lib/course-visuals";
import { container, ecLabel, yearLabel } from "@/lib/site";
import { getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  if (!course) return {};
  return {
    title: course.title,
    description: `${course.title} (${yearLabel(course.studyYear).toLowerCase()}, bachelor Geneeskunde Leiden): samenvatting, leerdoelen, oude tentamens en oefenvragen.`,
    alternates: { canonical: `/vakken/${course.slug}` },
  };
}

export default async function CoursePage({ params }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const [overview, topics, viewer] = await Promise.all([getCourseOverview(course.id), getTopicTree(course.id), getViewer()]);
  const base = `/vakken/${course.slug}`;

  const quickLinks = [
    { href: `${base}/samenvatting`, label: "Samenvatting lezen", icon: BookOpenText },
    { href: `${base}/oefenen?modus=exam`, label: "Tentamen simuleren", icon: Timer },
    { href: `${base}/oefenen?modus=incorrect`, label: "Fout beantwoorde vragen", icon: RotateCcw },
    { href: `${base}/tentamens`, label: "Oude tentamens", icon: ClipboardList },
  ];

  return (
    <main id="inhoud" className={cn(container, "flex-1 pb-16 pt-6")}>
      {viewer ? <VisitBeacon courseId={course.id} /> : null}
      <Breadcrumbs items={[{ href: "/vakken", label: "Vakken" }, { label: course.title }]} />

      {/* Course hero */}
      <section className="relative mt-5 overflow-hidden rounded-2xl bg-navy text-white">
        <Image
          src={courseHeroImage(course.slug)}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover opacity-50 [mask-image:linear-gradient(to_right,transparent_25%,black_75%)] sm:opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/10" aria-hidden="true" />
        <div className="relative max-w-2xl px-6 py-10 sm:px-10 sm:py-12">
          <h1 className="text-3xl font-bold tracking-[-0.02em] sm:text-[2.6rem] sm:leading-tight">{course.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.95rem] font-medium text-white/90">
            <span>{yearLabel(course.studyYear)}</span>
            <span className="h-4 w-px bg-white/40" aria-hidden="true" />
            <span>{ecLabel(course.ec)}</span>
            <span className="h-4 w-px bg-white/40" aria-hidden="true" />
            <span>{course.university}</span>
          </p>
          <p className="mt-5 leading-relaxed text-white/80">
            {course.description ??
              `Studiemateriaal voor ${course.title}, ${yearLabel(course.studyYear).toLowerCase()} van de ${course.program.charAt(0).toLowerCase()}${course.program.slice(1)} aan de ${course.university}.`}
          </p>
        </div>
      </section>

      {/* The four sections */}
      <section aria-label="Onderdelen" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {courseSections.map((s) => {
          const n = s.count(overview);
          return (
            <Link
              key={s.key}
              href={`${base}/${s.key}`}
              className="group flex flex-col rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <span className={cn("grid size-10 place-items-center rounded-lg", s.tone)}>
                <s.icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-semibold text-navy">{s.title}</h2>
              <p className="mt-1 text-sm text-muted-ink">{s.body}</p>
              <p className="mt-auto flex items-center justify-between pt-4 text-xs font-medium text-muted-ink">
                {n > 0 ? s.countLabel(n) : "Wordt voorbereid"}
                <ChevronRight className="size-4 text-navy/60 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </p>
            </Link>
          );
        })}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="onderwerpen-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 id="onderwerpen-titel" className="text-lg font-semibold text-navy">Inhoud per onderwerp</h2>
          {topics.length ? (
            <ol className="mt-4 divide-y divide-line">
              {topics.map((t, i) => (
                <li key={t.id}>
                  <Link
                    href={`${base}/samenvatting#${t.slug}`}
                    className="flex items-center gap-4 py-3 text-sm text-navy hover:text-blue"
                  >
                    <span className="w-5 text-right font-semibold tabular-nums text-muted-ink">{i + 1}</span>
                    <span className="flex-1">{t.title}</span>
                    <ChevronRight className="size-4 text-navy/50" aria-hidden="true" />
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

        <aside aria-labelledby="snel-titel" className="rounded-xl border border-line bg-sky/60 p-5 sm:p-6">
          <h2 id="snel-titel" className="text-lg font-semibold text-navy">Snel naar</h2>
          <ul className="mt-3 space-y-1">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-navy hover:bg-white">
                  <Icon className="size-[1.1rem] text-blue" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
