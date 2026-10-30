"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import type { Course } from "@/lib/data/types";
import { ecLabel, yearLabel } from "@/lib/site";
import { cn } from "@/lib/utils";

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function CourseBrowser({ courses, initialYear }: { courses: Course[]; initialYear: number | null }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<number | null>(initialYear);
  const years = useMemo(() => [...new Set(courses.map((c) => c.studyYear))].sort(), [courses]);

  const visible = courses.filter(
    (c) => (year === null || c.studyYear === year) && normalize(c.title).includes(normalize(query.trim())),
  );
  // One section per study year, in curriculum order; the total EC only when every course has a known value.
  const groups = years
    .map((y) => {
      const list = visible.filter((c) => c.studyYear === y);
      const ec = list.every((c) => c.ec !== null) ? list.reduce((sum, c) => sum + (c.ec ?? 0), 0) : null;
      return { year: y, courses: list, ec };
    })
    .filter((g) => g.courses.length > 0);

  function chooseYear(next: number | null) {
    setYear(next);
    // Keep the filter in the address bar so it survives a reload and can be shared.
    const url = new URL(window.location.href);
    if (next === null) url.searchParams.delete("jaar");
    else url.searchParams.set("jaar", String(next));
    window.history.replaceState(null, "", url);
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-ink" aria-hidden="true" />
          <label htmlFor="zoeken" className="sr-only">Zoek een vak</label>
          <input
            id="zoeken"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek een vak…"
            autoComplete="off"
            className="h-11 w-full rounded-lg border border-input bg-white pl-10 pr-3 text-base text-navy shadow-xs placeholder:text-muted-ink/80 sm:text-sm"
          />
        </div>
        <div role="group" aria-label="Filter op studiejaar" className="flex flex-wrap gap-1.5 md:shrink-0 md:flex-nowrap">
          {[null, ...years].map((y) => (
            <button
              key={y ?? "alle"}
              type="button"
              aria-pressed={year === y}
              onClick={() => chooseYear(y)}
              className={cn(
                "h-10 rounded-lg px-4 text-sm font-medium text-navy/80 transition-colors hover:bg-sky hover:text-navy",
                year === y && "bg-sky-strong text-navy",
              )}
            >
              {y === null ? "Alle jaren" : `Jaar ${y}`}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length === 1 ? "1 vak gevonden" : `${visible.length} vakken gevonden`}
      </p>

      {visible.length ? (
        <div className="mt-12 space-y-16">
          {groups.map((g) => (
            <section key={g.year} aria-labelledby={`jaar-${g.year}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h2 id={`jaar-${g.year}`} className="text-2xl font-bold tracking-[-0.01em] text-navy sm:text-[1.75rem]">
                  {yearLabel(g.year)}
                </h2>
                <p className="text-sm text-muted-ink">
                  {g.courses.length === 1 ? "1 vak" : `${g.courses.length} vakken`}
                  {g.ec !== null ? ` · ${ecLabel(g.ec)}` : ""}
                </p>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {g.courses.map((c) => (
                  <CourseCard key={c.id} course={c} showYear={false} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="font-semibold text-navy">Geen vakken gevonden</p>
          <p className="mt-1 text-sm text-muted-ink">Probeer een andere zoekterm of kies &lsquo;Alle jaren&rsquo;.</p>
        </div>
      )}
    </>
  );
}
