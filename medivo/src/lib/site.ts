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
  { file: "vakken/van-cel-tot-molecuul.webp", what: "DNA-dubbele helix", author: "Warren Umoh", url: "https://unsplash.com/photos/-qycBqByWIY" },
  { file: "vakken/van-mens-tot-cel.webp", what: "Cellen onder de fluorescentiemicroscoop", author: "National Cancer Institute", url: "https://unsplash.com/photos/W2OVh2w2Kpo" },
  { file: "vakken/van-basis-tot-homeostase.webp", what: "Bloeddrukmeting", author: "Julia Taubitz", url: "https://unsplash.com/photos/vN5s_G5SPkY" },
  { file: "vakken/sturing-en-stofwisseling.webp", what: "Glucosemeter", author: "Jane Korsak", url: "https://unsplash.com/photos/BlgBBf_b_94" },
  { file: "vakken/hersenen-en-aansturing.webp", what: "MRI-beelden van de hersenen", author: "National Cancer Institute", url: "https://unsplash.com/photos/BDKid0yJcAk" },
  { file: "vakken/mechanisms-of-disease-1.webp", what: "Bacteriekweek op een kweekplaat", author: "Adrian Lange", url: "https://unsplash.com/photos/Wk902ZLaA7M" },
  { file: "vakken/mechanisms-of-disease-2.webp", what: "Histologische coupe van plaveiselepitheel", author: "Bioscience Image Library by Fayette Reynolds", url: "https://unsplash.com/photos/GAGetw-WkHs" },
  { file: "vakken/vraagstukken-buik.webp", what: "Echografie", author: "Green Country Ultrasound LLC", url: "https://unsplash.com/photos/-dQRBFWd-ok" },
  { file: "vakken/vraagstukken-bewegen.webp", what: "Modellen van het kniegewricht", author: "CHUTTERSNAP", url: "https://unsplash.com/photos/Iq7CXTzBNbQ" },
  { file: "vakken/vraagstukken-voortplanting-en-vroege-levensfasen.webp", what: "Pasgeborene op de weegschaal", author: "Christian Bowen", url: "https://unsplash.com/photos/I0ItPtIsVEE" },
  { file: "vakken/vraagstukken-psychische-gezondheid-en-hormonen.webp", what: "Gesprek met een hulpverlener", author: "Vitaly Gariev", url: "https://unsplash.com/photos/m-82PNzgFq4" },
  { file: "vakken/vraagstukken-latere-levensfasen.webp", what: "Handen van een oudere op een wandelstok", author: "Alexas_Fotos", url: "https://unsplash.com/photos/6W1voPFLfrc" },
  { file: "vakken/vraagstukken-spoedeisende-zorg.webp", what: "Ambulance onderweg", author: "Ian Taylor", url: "https://unsplash.com/photos/4hWvAJP8ofM" },
  { file: "onderdelen/samenvatting.webp", what: "open boek", author: "Olga Tutunaru", url: "https://unsplash.com/photos/JMATuFkXeHU" },
  { file: "onderdelen/leerdoelen.webp", what: "afvinklijst", author: "Jakub Żerdzicki", url: "https://unsplash.com/photos/fXlL5I0IvK0" },
  { file: "onderdelen/tentamens.webp", what: "antwoordformulier", author: "Nguyen Dang Hoang Nhu", url: "https://unsplash.com/photos/cbEvoHbJnIE" },
  { file: "onderdelen/flashcards.webp", what: "stapel kaartjes", author: "Kate Trysh", url: "https://unsplash.com/photos/WX5jK0BT5JQ" },
  { file: "onderdelen/oefenen.webp", what: "stethoscoop op studieboeken", author: "Bermix Studio", url: "https://unsplash.com/photos/vT-Hkq0_FBU" },
] as const;

export const container = "mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8";

export function yearLabel(year: number) {
  return `Jaar ${year}`;
}

export function ecLabel(ec: number | null) {
  return ec === null ? "EC volgt" : `${ec.toLocaleString("nl-NL")} EC`;
}
