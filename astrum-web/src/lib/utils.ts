import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the five type steps from globals.css, so `text-body` counts as a font size and not a colour.
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ["small", "body", "lead", "head", "display"] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
