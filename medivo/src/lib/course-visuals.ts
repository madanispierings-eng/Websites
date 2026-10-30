// One photograph per course (Unsplash; credited in the footer through photoCredits in lib/site).
const images: Record<string, { src: string; alt: string }> = {
  "van-cel-tot-molecuul": { src: "/images/vakken/van-cel-tot-molecuul.webp", alt: "DNA-dubbele helix" },
  "van-mens-tot-cel": { src: "/images/vakken/van-mens-tot-cel.webp", alt: "Cellen onder de fluorescentiemicroscoop" },
  "van-basis-tot-homeostase": { src: "/images/vakken/van-basis-tot-homeostase.webp", alt: "Bloeddrukmeting" },
  "sturing-en-stofwisseling": { src: "/images/vakken/sturing-en-stofwisseling.webp", alt: "Glucosemeter" },
  "hersenen-en-aansturing": { src: "/images/vakken/hersenen-en-aansturing.webp", alt: "MRI-beelden van de hersenen" },
  "mechanisms-of-disease-1": { src: "/images/vakken/mechanisms-of-disease-1.webp", alt: "Bacteriekweek op een kweekplaat" },
  "mechanisms-of-disease-2": { src: "/images/vakken/mechanisms-of-disease-2.webp", alt: "Histologische coupe van plaveiselepitheel" },
  "vraagstukken-buik": { src: "/images/vakken/vraagstukken-buik.webp", alt: "Echografie" },
  "vraagstukken-bewegen": { src: "/images/vakken/vraagstukken-bewegen.webp", alt: "Modellen van het kniegewricht" },
  "vraagstukken-voortplanting-en-vroege-levensfasen": { src: "/images/vakken/vraagstukken-voortplanting-en-vroege-levensfasen.webp", alt: "Pasgeborene op de weegschaal" },
  "vraagstukken-borst-en-nier": { src: "/images/hartmodel.webp", alt: "Anatomisch hartmodel" },
  pharmacology: { src: "/images/medicatie.webp", alt: "Medicatie" },
  "vraagstukken-psychische-gezondheid-en-hormonen": { src: "/images/vakken/vraagstukken-psychische-gezondheid-en-hormonen.webp", alt: "Gesprek met een hulpverlener" },
  "vraagstukken-latere-levensfasen": { src: "/images/vakken/vraagstukken-latere-levensfasen.webp", alt: "Handen van een oudere op een wandelstok" },
  "vraagstukken-spoedeisende-zorg": { src: "/images/vakken/vraagstukken-spoedeisende-zorg.webp", alt: "Ambulance onderweg" },
};

export function courseImage(slug: string) {
  return images[slug] ?? { src: "/images/microscoop.webp", alt: "Microscoop" };
}
