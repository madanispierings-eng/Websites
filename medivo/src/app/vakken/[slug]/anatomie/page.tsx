import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bone } from "lucide-react";
import { AnatomyStudio } from "@/components/anatomy/anatomy-studio";
import { AccessNotice } from "@/components/course/access-notice";
import { CourseSubheader } from "@/components/course/course-subheader";
import { EmptyState } from "@/components/empty-state";
import { getAnatomy, getAnatomyProgress } from "@/lib/data/anatomy";
import { getCourse } from "@/lib/data/catalog";
import { getCourseOverview } from "@/lib/data/learning";
import { container } from "@/lib/site";
import { getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: `Anatomie ${course.title}`, robots: { index: false, follow: true } } : {};
}

export default async function AnatomiePage({ params }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const [overview, viewer, anatomy, progress] = await Promise.all([
    getCourseOverview(course.id),
    getViewer(),
    getAnatomy(course.id),
    getAnatomyProgress(),
  ]);

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader
        course={course}
        active="anatomie"
        title="Anatomie"
        intro="Oefen de structuren uit de structurenlijst op anatomische platen: benoemen, aanwijzen en de naam typen. Wat je fout hebt of nog niet zeker weet, komt vaker terug."
      />
      <div className={cn(container, "py-8 lg:py-10")}>
        {overview.anatomy === 0 ? (
          <EmptyState icon={Bone} title="Nog geen anatomie voor dit vak">
            De anatomie-oefenmodus wordt voorbereid.
          </EmptyState>
        ) : !viewer ? (
          <AccessNotice signedIn={false} next={`/vakken/${course.slug}/anatomie`} />
        ) : !anatomy.images.length ? (
          <AccessNotice signedIn next={`/vakken/${course.slug}/anatomie`} />
        ) : (
          <AnatomyStudio structures={anatomy.structures} images={anatomy.images} initialProgress={progress} />
        )}
      </div>
    </main>
  );
}
