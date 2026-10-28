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

  it("has the supplied EC values", () => {
    const ec = Object.fromEntries(fallbackCourses.map((c) => [c.slug, c.ec]));
    expect(ec["pharmacology"]).toBe(2);
    expect(ec["vraagstukken-voortplanting-en-vroege-levensfasen"]).toBe(9);
    expect(ec["vraagstukken-psychische-gezondheid-en-hormonen"]).toBe(6);
    expect(ec["vraagstukken-latere-levensfasen"]).toBe(9);
    expect(ec["vraagstukken-spoedeisende-zorg"]).toBe(6);
    expect(fallbackCourses.every((c) => c.ec !== null)).toBe(true);
  });
});
