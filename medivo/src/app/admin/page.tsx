import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { container, ecLabel } from "@/lib/site";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./_components/ui";

export const metadata: Metadata = { title: "Beheer", robots: { index: false, follow: false } };

const tables = [
  ["topics", "Onderwerpen"],
  ["summaries", "Samenvattingen"],
  ["learning_objectives", "Leerdoelen"],
  ["questions", "Vragen"],
  ["exams", "Tentamens"],
  ["profiles", "Gebruikers"],
] as const;

export default async function AdminPage() {
  const supabase = (await createClient())!;
  const counts = await Promise.all(
    tables.map(async ([table, label]) => {
      const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
      return { label, count: count ?? 0 };
    }),
  );
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, study_year, ec, status, topics(count), questions(count)")
    .order("study_year")
    .order("sort_order");

  type Row = { id: string; title: string; slug: string; study_year: number; ec: number | null; status: "draft" | "published" | "archived"; topics: { count: number }[]; questions: { count: number }[] };

  return (
    <main id="inhoud" className={cn(container, "flex-1 py-10")}>
      <h1 className="text-3xl font-bold tracking-[-0.02em] text-navy">Beheer</h1>
      <p className="mt-2 max-w-2xl text-muted-ink">
        Kies een vak om onderwerpen, samenvattingen, leerdoelen, tentamens en oefenvragen toe te voegen.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {counts.map((c) => (
          <div key={c.label} className="rounded-xl border border-line bg-white p-4">
            <dt className="text-xs text-muted-ink">{c.label}</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums text-navy">{c.count}</dd>
          </div>
        ))}
      </dl>

      {[1, 2, 3].map((year) => (
        <section key={year} className="mt-10" aria-labelledby={`jaar-${year}`}>
          <h2 id={`jaar-${year}`} className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-ink">Jaar {year}</h2>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
            {((courses ?? []) as Row[]).filter((c) => c.study_year === year).map((c) => (
              <li key={c.id}>
                <Link href={`/admin/vakken/${c.slug}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-canvas">
                  <span className="min-w-0 flex-1 font-medium text-navy">{c.title}</span>
                  <span className="text-xs text-muted-ink">{ecLabel(c.ec)}</span>
                  <span className="text-xs tabular-nums text-muted-ink">
                    {c.topics[0]?.count ?? 0} onderwerpen · {c.questions[0]?.count ?? 0} vragen
                  </span>
                  <StatusBadge status={c.status} />
                  <ChevronRight className="size-4 text-navy/50" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
