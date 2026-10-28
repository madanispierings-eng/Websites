import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CourseForm, type AdminCourse } from "./course-form";
import { requireAdmin } from "./guard";

export const metadata: Metadata = { title: "Beheer", robots: { index: false, follow: false } };

const tables = [
  ["courses", "Vakken"],
  ["topics", "Onderwerpen"],
  ["summaries", "Samenvattingen"],
  ["learning_objectives", "Leerdoelen"],
  ["questions", "Vragen"],
  ["exams", "Tentamens"],
  ["profiles", "Gebruikers"],
  ["subscriptions", "Abonnementen"],
] as const;

export default async function AdminPage() {
  await requireAdmin();
  const supabase = (await createClient())!;

  const counts = await Promise.all(
    tables.map(async ([table, label]) => {
      const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
      return { label, count: count ?? 0 };
    }),
  );
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, study_year, ec, description, status")
    .order("study_year")
    .order("sort_order");

  return (
    <main id="inhoud" className={cn(container, "flex-1 py-10")}>
      <h1 className="text-3xl font-bold tracking-[-0.02em] text-navy">Beheer</h1>
      <p className="mt-2 text-muted-ink">Alleen zichtbaar voor beheerders. Elke wijziging wordt ook in de database op rechten gecontroleerd.</p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map((c) => (
          <div key={c.label} className="rounded-xl border border-line bg-white p-4">
            <dt className="text-xs text-muted-ink">{c.label}</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums text-navy">{c.count}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10" aria-labelledby="vakbeheer">
        <h2 id="vakbeheer" className="text-xl font-semibold text-navy">Vakken</h2>
        <p className="mt-1 text-sm text-muted-ink">Laat EC leeg zolang de waarde niet is gecontroleerd.</p>
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {((courses ?? []) as AdminCourse[]).map((c) => (
            <li key={c.id} className="rounded-xl border border-line bg-white p-5">
              <p className="text-xs font-medium text-muted-ink">Jaar {c.study_year} · /vakken/{c.slug}</p>
              <h3 className="mb-3 font-semibold text-navy">{c.title}</h3>
              <CourseForm course={c} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
