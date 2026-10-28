import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fallbackCourses } from "@/lib/data/catalog-fallback";

// The built-in catalogue must match the database seed exactly.
const seed = readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8");
const seeded = [...seed.matchAll(/\('[0-9a-f-]+', '([a-z0-9-]+)', '([^']+)', (\d), (null|\d+), \d+, 'published'\)/g)].map(
  ([, slug, title, year, ec]) => ({ slug, title, studyYear: Number(year), ec: ec === "null" ? null : Number(ec) }),
);

describe("course catalogue", () => {
  it("matches supabase/seed.sql", () => {
    expect(seeded).toHaveLength(15);
    expect(fallbackCourses.map(({ slug, title, studyYear, ec }) => ({ slug, title, studyYear, ec }))).toEqual(seeded);
  });

  it("has unique slugs", () => {
    expect(new Set(fallbackCourses.map((c) => c.slug)).size).toBe(fallbackCourses.length);
  });

  it("only lists EC values that were supplied", () => {
    expect(fallbackCourses.filter((c) => c.ec !== null).map((c) => c.slug)).toHaveLength(10);
    expect(fallbackCourses.filter((c) => c.studyYear === 3).every((c) => c.ec === null)).toBe(true);
  });
});
