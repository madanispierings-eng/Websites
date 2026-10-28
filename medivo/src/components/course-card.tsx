import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { courseVisual, tintClasses } from "@/lib/course-visuals";
import type { Course } from "@/lib/data/types";
import { ecLabel, yearLabel } from "@/lib/site";
import { cn } from "@/lib/utils";

export function CourseCard({ course }: { course: Course }) {
  const { icon: Icon, tint } = courseVisual(course.slug);
  const t = tintClasses[tint];
  return (
    <Link
      href={`/vakken/${course.slug}`}
      className={cn(
        "group relative flex min-h-40 flex-col rounded-xl border p-5 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] motion-reduce:hover:translate-y-0",
        t.card,
        t.ring,
      )}
    >
      <Icon className={cn("size-9", t.icon)} strokeWidth={1.5} aria-hidden="true" />
      <h3 className="mt-auto pt-6 text-[0.95rem] font-semibold leading-snug text-navy">{course.title}</h3>
      <p className="mt-1 flex items-center gap-2 text-xs text-muted-ink">
        <span>{yearLabel(course.studyYear)}</span>
        <span aria-hidden="true">·</span>
        <span>{ecLabel(course.ec)}</span>
      </p>
      <ChevronRight
        className="absolute bottom-5 right-4 size-4 text-navy/60 transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
