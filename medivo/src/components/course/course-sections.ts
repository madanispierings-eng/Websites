import { ClipboardList, FileText, ListChecks, Target, type LucideIcon } from "lucide-react";
import type { CourseOverview } from "@/lib/data/learning";

export type CourseSection = {
  key: "samenvatting" | "leerdoelen" | "tentamens" | "oefenen";
  title: string;
  body: string;
  icon: LucideIcon;
  tone: string;
  count: (o: CourseOverview) => number;
  countLabel: (n: number) => string;
};

export const courseSections: CourseSection[] = [
  {
    key: "samenvatting",
    title: "Volledige samenvatting",
    body: "Een uitgebreide samenvatting per onderwerp.",
    icon: FileText,
    tone: "text-blue bg-sky",
    count: (o) => o.summaries,
    countLabel: (n) => (n === 1 ? "1 hoofdstuk" : `${n} hoofdstukken`),
  },
  {
    key: "leerdoelen",
    title: "Leerdoelen",
    body: "Alle leerdoelen per onderwerp, om af te vinken.",
    icon: Target,
    tone: "text-[#b86a12] bg-[#fdf6ec]",
    count: (o) => o.objectives,
    countLabel: (n) => (n === 1 ? "1 leerdoel" : `${n} leerdoelen`),
  },
  {
    key: "tentamens",
    title: "Oude tentamens",
    body: "Tentamens per jaar, met bronvermelding.",
    icon: ClipboardList,
    tone: "text-[#c2414b] bg-[#fdf3f3]",
    count: (o) => o.exams,
    countLabel: (n) => (n === 1 ? "1 tentamen" : `${n} tentamens`),
  },
  {
    key: "oefenen",
    title: "Oefenen per onderwerp",
    body: "Meerkeuzevragen met uitleg bij elk antwoord.",
    icon: ListChecks,
    tone: "text-success-ink bg-success-soft",
    count: (o) => o.questions,
    countLabel: (n) => (n === 1 ? "1 oefenvraag" : `${n} oefenvragen`),
  },
];
