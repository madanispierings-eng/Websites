import type { Metadata } from "next";
import { getCourses } from "@/lib/data/catalog";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CourseBrowser } from "./course-browser";

export const metadata: Metadata = {
  title: "Vakken",
  description: "Alle vakken van de bachelor Geneeskunde aan de Universiteit Leiden, per studiejaar.",
  alternates: { canonical: "/vakken" },
};

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ jaar?: string }> }) {
  const [courses, { jaar }] = await Promise.all([getCourses(), searchParams]);
  const year = Number(jaar);
  const initialYear = [1, 2, 3].includes(year) ? year : null;

  return (
    <main id="inhoud" className={cn(container, "flex-1 py-10 lg:py-14")}>
      <h1 className="text-3xl font-bold tracking-[-0.02em] text-navy sm:text-[2.5rem]">
        Bachelor Geneeskunde · Universiteit Leiden
      </h1>
      <p className="mt-3 max-w-2xl text-muted-ink">
        Kies een vak en ga naar de samenvattingen, leerdoelen, oude tentamens en oefenvragen.
      </p>
      <CourseBrowser courses={courses} initialYear={initialYear} />
      <p className="mt-10 text-xs text-muted-ink">
        Bij &lsquo;EC volgt&rsquo; is het aantal studiepunten nog niet gecontroleerd en daarom nog niet vermeld.
      </p>
    </main>
  );
}
