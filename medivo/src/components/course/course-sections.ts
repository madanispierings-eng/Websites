import { ClipboardList, FileText, Layers, ListChecks, Target, type LucideIcon } from "lucide-react";
import type { CourseOverview } from "@/lib/data/learning";

export type CourseSection = {
  key: "samenvatting" | "leerdoelen" | "tentamens" | "flashcards" | "oefenen";
  title: string;
  body: string;
  icon: LucideIcon;
  /** Photograph for the course page (Unsplash; credited in the footer through photoCredits). */
  image: string;
  count: (o: CourseOverview) => number;
  countLabel: (n: number) => string;
};

export const courseSections: CourseSection[] = [
  {
    key: "samenvatting",
    title: "Volledige samenvatting",
    body: "Uitgebreid en overzichtelijk, per onderwerp.",
    icon: FileText,
    image: "/images/onderdelen/samenvatting.webp",
    count: (o) => o.summaries,
    countLabel: (n) => (n === 1 ? "1 hoofdstuk" : `${n} hoofdstukken`),
  },
  {
    key: "leerdoelen",
    title: "Leerdoelen",
    body: "Alle leerdoelen per onderwerp, om af te vinken.",
    icon: Target,
    image: "/images/onderdelen/leerdoelen.webp",
    count: (o) => o.objectives,
    countLabel: (n) => (n === 1 ? "1 leerdoel" : `${n} leerdoelen`),
  },
  {
    key: "tentamens",
    title: "Oude tentamens",
    body: "Complete tentamens, in de originele vorm.",
    icon: ClipboardList,
    image: "/images/onderdelen/tentamens.webp",
    count: (o) => o.exams,
    countLabel: (n) => (n === 1 ? "1 tentamen" : `${n} tentamens`),
  },
  {
    key: "flashcards",
    title: "Flashcards",
    body: "Begrippen actief herhalen, per onderwerp.",
    icon: Layers,
    image: "/images/onderdelen/flashcards.webp",
    count: (o) => o.flashcards,
    countLabel: (n) => (n === 1 ? "1 kaart" : `${n} kaarten`),
  },
  {
    key: "oefenen",
    title: "Oefenen per onderwerp",
    body: "Tentamenvragen met uitleg bij elk antwoord.",
    icon: ListChecks,
    image: "/images/onderdelen/oefenen.webp",
    count: (o) => o.questions,
    countLabel: (n) => (n === 1 ? "1 oefenvraag" : `${n} oefenvragen`),
  },
];
