import {
  Activity, Ambulance, Baby, Biohazard, Bone, Brain, BrainCircuit, Dna, FlaskConical, HeartPulse, Hourglass, Microscope,
  Pill, Salad, ShieldAlert, Stethoscope, type LucideIcon,
} from "lucide-react";

export type Tint = "rose" | "amber" | "sky" | "violet" | "teal" | "green";

// Card colours from the reference design: soft tint, a matching icon colour.
export const tintClasses: Record<Tint, { card: string; icon: string; ring: string }> = {
  rose: { card: "bg-[#fdf3f3]", icon: "text-[#c2414b]", ring: "border-[#f6dede]" },
  amber: { card: "bg-[#fdf6ec]", icon: "text-[#b86a12]", ring: "border-[#f5e6cc]" },
  sky: { card: "bg-[#eef5fd]", icon: "text-[#1760b5]", ring: "border-[#d8e7f8]" },
  violet: { card: "bg-[#f4f2fd]", icon: "text-[#5b45c4]", ring: "border-[#e2ddf8]" },
  teal: { card: "bg-[#eef8f6]", icon: "text-[#0e7a65]", ring: "border-[#d3ede7]" },
  green: { card: "bg-[#f1f8ee]", icon: "text-[#3b7d23]", ring: "border-[#dcecd3]" },
};

const visuals: Record<string, { icon: LucideIcon; tint: Tint }> = {
  "van-cel-tot-molecuul": { icon: Dna, tint: "teal" },
  "van-mens-tot-cel": { icon: Microscope, tint: "sky" },
  "van-basis-tot-homeostase": { icon: Activity, tint: "rose" },
  "sturing-en-stofwisseling": { icon: FlaskConical, tint: "amber" },
  "hersenen-en-aansturing": { icon: Brain, tint: "violet" },
  "mechanisms-of-disease-1": { icon: ShieldAlert, tint: "rose" },
  "mechanisms-of-disease-2": { icon: Biohazard, tint: "amber" },
  "vraagstukken-buik": { icon: Salad, tint: "green" },
  "vraagstukken-bewegen": { icon: Bone, tint: "sky" },
  "vraagstukken-borst-en-nier": { icon: HeartPulse, tint: "rose" },
  pharmacology: { icon: Pill, tint: "violet" },
  "vraagstukken-voortplanting-en-vroege-levensfasen": { icon: Baby, tint: "amber" },
  "vraagstukken-psychische-gezondheid-en-hormonen": { icon: BrainCircuit, tint: "violet" },
  "vraagstukken-latere-levensfasen": { icon: Hourglass, tint: "teal" },
  "vraagstukken-spoedeisende-zorg": { icon: Ambulance, tint: "rose" },
};

export function courseVisual(slug: string) {
  return visuals[slug] ?? { icon: Stethoscope, tint: "sky" as Tint };
}

const heroImages: Record<string, string> = {
  pharmacology: "/images/medicatie.webp",
  "vraagstukken-borst-en-nier": "/images/hartmodel.webp",
};

export function courseHeroImage(slug: string) {
  return heroImages[slug] ?? "/images/microscoop.webp";
}
