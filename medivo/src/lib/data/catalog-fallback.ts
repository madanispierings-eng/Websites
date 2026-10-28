import type { Course } from "./types";

// Built-in copy of the initial catalogue (supabase/seed.sql), used when Supabase is not configured so the
// public site still renders. tests/catalog.test.ts keeps both in sync.
// EC values are only filled in where they have been verified; null means "not yet verified".

const university = "Universiteit Leiden";
const program = "Bachelor Geneeskunde";

const rows: [slug: string, title: string, year: number, ec: number | null][] = [
  ["van-cel-tot-molecuul", "Van Cel tot Molecuul", 1, 6],
  ["van-mens-tot-cel", "Van Mens tot Cel", 1, 7],
  ["van-basis-tot-homeostase", "Van Basis tot Homeostase", 1, 8],
  ["sturing-en-stofwisseling", "Sturing en Stofwisseling", 1, 7],
  ["hersenen-en-aansturing", "Hersenen en Aansturing", 1, 7],
  ["mechanisms-of-disease-1", "Mechanisms of Disease 1", 2, 7],
  ["mechanisms-of-disease-2", "Mechanisms of Disease 2", 2, 7],
  ["vraagstukken-buik", "Vraagstukken Buik", 2, 8],
  ["vraagstukken-bewegen", "Vraagstukken Bewegen", 2, 9],
  ["vraagstukken-borst-en-nier", "Vraagstukken Borst en Nier", 2, 9],
  ["pharmacology", "Pharmacology", 2, 2],
  ["vraagstukken-voortplanting-en-vroege-levensfasen", "Vraagstukken Voortplanting en Vroege Levensfasen", 3, 9],
  ["vraagstukken-psychische-gezondheid-en-hormonen", "Vraagstukken Psychische Gezondheid en Hormonen", 3, 6],
  ["vraagstukken-latere-levensfasen", "Vraagstukken Latere Levensfasen", 3, 9],
  ["vraagstukken-spoedeisende-zorg", "Vraagstukken Spoedeisende Zorg", 3, 6],
];

export const fallbackCourses: Course[] = rows.map(([slug, title, studyYear, ec]) => ({
  id: slug,
  slug,
  title,
  studyYear,
  ec,
  description: null,
  university,
  program,
}));
