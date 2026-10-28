export const site = {
  name: "Medivo",
  description:
    "Samenvattingen, leerdoelen, oude tentamens en oefenvragen voor alle vakken van de bachelor Geneeskunde aan de Universiteit Leiden.",
  nav: [
    { href: "/", label: "Home" },
    { href: "/vakken", label: "Vakken" },
    { href: "/over-ons", label: "Over ons" },
    { href: "/veelgestelde-vragen", label: "Veelgestelde vragen" },
  ],
  disclaimer:
    "Medivo is een onafhankelijk studieplatform en is niet verbonden aan of goedgekeurd door de Universiteit Leiden of het LUMC.",
} as const;

export const photoCredits = [
  { file: "leiden-universiteit.webp", what: "Universiteitsgebouw in Leiden", author: "Job Vermeulen", url: "https://unsplash.com/photos/1uGA4uP_c2E" },
  { file: "medicatie.webp", what: "Medicatie", author: "freestocks", url: "https://unsplash.com/photos/nss2eRzQwgw" },
  { file: "microscoop.webp", what: "Microscoop", author: "Logan Gutierrez", url: "https://unsplash.com/photos/Rl9bIWKCVF0" },
  { file: "hartmodel.webp", what: "Anatomisch hartmodel", author: "Ali Hajiluyi", url: "https://unsplash.com/photos/MhFJNz_D8t4" },
] as const;

export const container = "mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8";

export function yearLabel(year: number) {
  return `Jaar ${year}`;
}

export function ecLabel(ec: number | null) {
  return ec === null ? "EC volgt" : `${ec.toLocaleString("nl-NL")} EC`;
}
