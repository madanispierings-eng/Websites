"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import type { Course } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function CourseBrowser({ courses, initialYear }: { courses: Course[]; initialYear: number | null }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<number | null>(initialYear);
  const years = useMemo(() => [...new Set(courses.map((c) => c.studyYear))].sort(), [courses]);

  const visible = courses.filter(
    (c) => (year === null || c.studyYear === year) && normalize(c.title).includes(normalize(query.trim())),
  );

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
        <div role="group" aria-label="Filter op studiejaar" className="flex flex-wrap gap-1.5">
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
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((c) => (
            <CourseCard key={c.id} course={c} />
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
