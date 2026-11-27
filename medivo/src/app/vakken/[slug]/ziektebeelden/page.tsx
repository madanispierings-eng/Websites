import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { AccessNotice } from "@/components/course/access-notice";
import { CourseSubheader } from "@/components/course/course-subheader";
import { DisorderStudio } from "@/components/disorders/disorder-studio";
import { EmptyState } from "@/components/empty-state";
import { getCourse } from "@/lib/data/catalog";
import { getDisorderThemes } from "@/lib/data/disorders";
import { getCourseOverview } from "@/lib/data/learning";
import { container } from "@/lib/site";
import { getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: `Ziektebeelden ${course.title}`, robots: { index: false, follow: true } } : {};
}

export default async function ZiektebeeldenPage({ params }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const [overview, viewer, themes] = await Promise.all([
    getCourseOverview(course.id),
    getViewer(),
    getDisorderThemes(course.id),
  ]);

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader
        course={course}
        active="ziektebeelden"
        title="Ziektebeelden"
        intro="Alle ziektebeelden van dit vak per thema. Lees de uitleg op precies het niveau dat je moet kennen, of oefen ze met flashcards."
      />
      <div className={cn(container, "py-8 lg:py-10")}>
        {overview.disorders === 0 ? (
          <EmptyState icon={Stethoscope} title="Nog geen ziektebeelden voor dit vak">
            De ziektebeeldenlijst wordt voorbereid.
          </EmptyState>
        ) : !viewer ? (
          <AccessNotice signedIn={false} next={`/vakken/${course.slug}/ziektebeelden`} />
        ) : !themes.length ? (
          <AccessNotice signedIn next={`/vakken/${course.slug}/ziektebeelden`} />
        ) : (
          <DisorderStudio themes={themes} />
        )}
      </div>
    </main>
  );
}
