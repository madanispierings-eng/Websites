import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { courseSections } from "@/components/course/course-sections";
import { TabScroller } from "@/components/course/tab-scroller";
import type { Course } from "@/lib/data/types";
import { container, ecLabel, yearLabel } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Compact header for the four course sections, with tabs to move between them. */
export function CourseSubheader({ course, active, title, intro }: { course: Course; active: string; title: string; intro?: string }) {
  return (
    <div className="border-b border-line bg-white">
      <div className={cn(container, "pt-6")}>
        <Breadcrumbs
          items={[
            { href: "/vakken", label: "Vakken" },
            { href: `/vakken/${course.slug}`, label: course.title },
            { label: title },
          ]}
        />
        <p className="mt-5 text-sm font-medium text-muted-ink">
          {course.title} · {yearLabel(course.studyYear)} · {ecLabel(course.ec)}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.02em] text-navy sm:text-[2.25rem]">{title}</h1>
        {intro ? <p className="mt-2 max-w-2xl text-muted-ink">{intro}</p> : null}
        <TabScroller label="Onderdelen van dit vak" className="-mb-px mt-6 overflow-x-auto">
          <ul className="flex min-w-max gap-1">
            {courseSections.map((s) => (
              <li key={s.key}>
                <Link
                  href={`/vakken/${course.slug}/${s.key}`}
                  aria-current={active === s.key ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 border-b-2 border-transparent px-3 pb-3 pt-1 text-sm font-medium text-muted-ink hover:text-navy focus-visible:outline-offset-[-2px]",
                    active === s.key && "border-blue text-navy",
                  )}
                >
                  <s.icon className="size-4" aria-hidden="true" />
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </TabScroller>
      </div>
    </div>
  );
}
