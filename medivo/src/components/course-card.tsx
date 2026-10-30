import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { courseImage } from "@/lib/course-visuals";
import type { Course } from "@/lib/data/types";
import { ecLabel, yearLabel } from "@/lib/site";

export function CourseCard({
  course,
  showYear = true,
  titleAs: Title = "h3",
}: {
  course: Course;
  /** Off where the cards are already grouped under a year heading. */
  showYear?: boolean;
  titleAs?: "h3" | "h4";
}) {
  const image = courseImage(course.slug);
  return (
    <Link
      href={`/vakken/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white transition-colors duration-200 hover:bg-sky/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-sky sm:aspect-[3/2]">
        {/* The title says what the course is; the photograph only sets the scene. */}
        <Image
          src={image.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 items-end justify-between gap-3 px-5 pb-5 pt-4">
        <div>
          <Title className="text-[1.05rem] font-semibold leading-snug text-navy">{course.title}</Title>
          <p className="mt-1 text-sm text-muted-ink">
            {showYear ? `${yearLabel(course.studyYear)} · ` : ""}
            {ecLabel(course.ec)}
          </p>
        </div>
        <ArrowRight
          className="mb-0.5 size-4 shrink-0 text-navy/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-navy motion-reduce:transition-none"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
