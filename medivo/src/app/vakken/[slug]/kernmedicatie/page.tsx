import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pill } from "lucide-react";
import { AccessNotice } from "@/components/course/access-notice";
import { CourseSubheader } from "@/components/course/course-subheader";
import { EmptyState } from "@/components/empty-state";
import { MedicationStudio } from "@/components/medications/medication-studio";
import { getCourse } from "@/lib/data/catalog";
import { getCoreMedications, groupMedications } from "@/lib/data/core-medications";
import { getCourseOverview } from "@/lib/data/learning";
import { container } from "@/lib/site";
import { getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: `Kernmedicatielijst ${course.title}`, robots: { index: false, follow: true } } : {};
}

export default async function KernmedicatiePage({ params }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const [overview, viewer, meds] = await Promise.all([
    getCourseOverview(course.id),
    getViewer(),
    getCoreMedications(course.id),
  ]);

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader
        course={course}
        active="kernmedicatie"
        title="Kernmedicatielijst"
        intro="De kernmedicatie van dit vak. Leer ze met flashcards (de naam voorop, alles wat je moet kennen achterop) of lees de uitleg per middel."
      />
      <div className={cn(container, "py-8 lg:py-10")}>
        {overview.coreMeds === 0 ? (
          <EmptyState icon={Pill} title="Nog geen kernmedicatie voor dit vak">
            De kernmedicatielijst wordt voorbereid.
          </EmptyState>
        ) : !viewer ? (
          <AccessNotice signedIn={false} next={`/vakken/${course.slug}/kernmedicatie`} />
        ) : !meds.length ? (
          <AccessNotice signedIn next={`/vakken/${course.slug}/kernmedicatie`} />
        ) : (
          <MedicationStudio groups={groupMedications(meds)} total={meds.length} />
        )}
      </div>
    </main>
  );
}
