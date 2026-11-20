import Link from "next/link";
import { ArrowLeft, Pill } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { courseSections } from "@/components/course/course-sections";
import { TabScroller } from "@/components/course/tab-scroller";
import { getCourseOverview } from "@/lib/data/learning";
import type { Course } from "@/lib/data/types";
import { container, ecLabel, yearLabel } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Compact header for the course sections, with tabs to move between them. */
export async function CourseSubheader({ course, active, title, intro }: { course: Course; active: string; title: string; intro?: string }) {
  // The kernmedicatielijst is optional content: its tab only appears for a course that has it.
  const overview = await getCourseOverview(course.id);
  const tabs = [
    ...courseSections.map((s) => ({ key: s.key as string, title: s.title, icon: s.icon })),
    ...(overview.coreMeds > 0 || active === "kernmedicatie" ? [{ key: "kernmedicatie", title: "Kernmedicatielijst", icon: Pill }] : []),
  ];
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
        <Link
          href={`/vakken/${course.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-blue hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Terug naar {course.title}
        </Link>
        <p className="mt-2 text-sm font-medium text-muted-ink">
          {yearLabel(course.studyYear)} · {ecLabel(course.ec)}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.02em] text-navy sm:text-[2.25rem]">{title}</h1>
        {intro ? <p className="mt-2 max-w-2xl text-muted-ink">{intro}</p> : null}
        <TabScroller label="Onderdelen van dit vak" className="-mb-px mt-6 overflow-x-auto">
          <ul className="flex min-w-max gap-1">
            {tabs.map((s) => (
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
