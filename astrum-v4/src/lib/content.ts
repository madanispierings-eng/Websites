// Teksten uit de scrape van astrumuae.com (scraper/output/brand.json), wijken met hun echte coördinaten.

export const site = {
  name: "Astrum",
  url: "https://astrumuae.com",
  email: "info@astrumuae.com",
  instagram: "https://www.instagram.com/astrumuae",
  linkedin: "https://www.linkedin.com/company/astrumrealty/",
  slogan: "Voor wie verder kijkt",
};

export const hero = {
  title: ["Vastgoed in Dubai,", "voor wie verder kijkt"],
  support: ["Met echte transactieprijzen en één", "vast aanspreekpunt, in het Nederlands"],
  action: "Plan een gesprek",
};

export const nav = [
  { href: "#wijken", label: "Wijken" },
  { href: "#diensten", label: "Diensten" },
  { href: "#kosten", label: "Kosten" },
  { href: "#over-ons", label: "Over ons" },
];

/** Een Unsplash-foto, gehotlinkt via imgix zoals de Unsplash-richtlijnen vragen. */
export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
  by: string;
  byUrl: string;
  page: string;
  /** focal point for object-position, so the crop keeps the subject */
  focus: string;
};

export type District = { id: string; name: string; line: string; coords: string; photo: Photo };

const utm = "?utm_source=astrum&utm_medium=referral";

/** De vier wijken van de slider, bij daglicht. */
export const districts: District[] = [
  {
    id: "palm-jumeirah",
    name: "Palm Jumeirah",
    line: "Villa’s en appartementen aan het water, op het eiland in de vorm van een palm.",
    coords: "25°07′N 55°08′E",
    photo: {
      src: "https://images.unsplash.com/photo-1786991810391-e28ee367c3aa",
      width: 8256,
      height: 5504,
      alt: "Luchtfoto van de Palm Jumeirah met de bladeren vol villa’s en Atlantis The Royal aan de horizon",
      by: "Anubhav Sonker",
      byUrl: `https://unsplash.com/@anubhavsonker${utm}`,
      page: `https://unsplash.com/photos/to8TlBSHjvU${utm}`,
      focus: "50% 45%",
    },
  },
  {
    id: "dubai-marina",
    name: "Dubai Marina",
    line: "Wonen boven de jachthaven, met de zee en het strand op loopafstand.",
    coords: "25°05′N 55°08′E",
    photo: {
      src: "https://images.unsplash.com/photo-1722502831583-b4e93ecc6027",
      width: 5960,
      height: 3973,
      alt: "De jachthaven van Dubai Marina van bovenaf, met witte jachten tussen de woontorens",
      by: "Nelemson Guevarra",
      byUrl: `https://unsplash.com/@nelemson${utm}`,
      page: `https://unsplash.com/photos/RpMvnAq0b44${utm}`,
      focus: "50% 55%",
    },
  },
  {
    id: "jumeirah",
    name: "Jumeirah",
    line: "De kust van het oude Dubai: lage villa’s, brede stranden en Burj Al Arab.",
    coords: "25°08′N 55°11′E",
    photo: {
      src: "https://images.unsplash.com/photo-1523816572-a1a23d1a67b8",
      width: 4861,
      height: 3238,
      alt: "Burj Al Arab in turquoise water voor de kust van Jumeirah, van bovenaf gezien",
      by: "Christoph Schulz",
      byUrl: `https://unsplash.com/@christoph${utm}`,
      page: `https://unsplash.com/photos/jG3I8b5iyHI${utm}`,
      focus: "45% 50%",
    },
  },
  {
    id: "downtown",
    name: "Downtown",
    line: "Het hart van de stad rond Burj Khalifa, de plek waar de prijzen het hardst bewegen.",
    coords: "25°12′N 55°16′E",
    photo: {
      src: "https://images.unsplash.com/photo-1651467606797-e1c660cf3fda",
      width: 6000,
      height: 3900,
      alt: "Burj Khalifa boven de skyline van Downtown Dubai onder donkere wolken",
      by: "Ahmed Aldaie",
      byUrl: `https://unsplash.com/@ahmedaldaie${utm}`,
      page: `https://unsplash.com/photos/aKj9uDanF18${utm}`,
      focus: "60% 50%",
    },
  },
];

/** imgix-parameters: formaat kiest de browser (AVIF/WebP), breedte per srcset-stap. */
export const photoUrl = (p: Photo, w: number, h?: number) =>
  `${p.src}?auto=format&fit=crop&q=72&w=${w}${h ? `&h=${h}` : ""}`;
export const photoSrcSet = (p: Photo, widths = [640, 960, 1440, 2000, 2800]) =>
  widths.map((w) => `${photoUrl(p, w)} ${w}w`).join(", ");

export const menu = [
  { href: "#wijken", label: "Wijken" },
  { href: "#diensten", label: "Kopen, verkopen, advies" },
  { href: "#kosten", label: "Wat kopen kost" },
  { href: "#over-ons", label: "Over ons" },
  { href: "#contact", label: "Contact" },
];

/**
 * Wat Astrum doet (uit astrumuae.com): kopen, verkopen, advies en portfolio. Astrum toont geen woningaanbod; de foto's
 * zijn Unsplash-beelden die in Dubai gemaakt zijn en laten de stad zien, niet een woning van Astrum.
 */
export type Service = { id: string; name: string; where: string; line: string; ask: string; main: Photo; detail?: Photo };

const unsplash = (
  src: string,
  width: number,
  height: number,
  alt: string,
  by: string,
  handle: string,
  id: string,
  focus = "50% 50%",
): Photo => ({ src, width, height, alt, by, byUrl: `https://unsplash.com/@${handle}${utm}`, page: `https://unsplash.com/photos/${id}${utm}`, focus });

export const services: Service[] = [
  {
    id: "kopen",
    name: "Kopen",
    where: "Bestaande bouw en off-plan",
    line: "We zoeken mee, toetsen de cijfers aan echte transacties en begeleiden je tot de overdracht. Geen haast om te tekenen.",
    ask: "kopen in Dubai",
    main: unsplash(
      "https://images.unsplash.com/photo-1654520015092-b9b4ddf2e7c7",
      4288, 2848,
      "Een woonkamer in Moon Tower in Dubai met een raam van vloer tot plafond en torens erachter",
      "Coralt Zou", "cora1t", "Jvy0fB41xtQ", "55% 50%",
    ),
    detail: unsplash(
      "https://images.unsplash.com/photo-1719474815671-08411b0ea840",
      4666, 3111,
      "Een lichte keuken in een appartement in The Sterling West in Business Bay, met uitzicht op de torens",
      "Nisha Vastu", "nisharoi", "uUNm0_e1kFo", "65% 50%",
    ),
  },
  {
    id: "verkopen",
    name: "Verkopen",
    where: "Voor eigenaren in Dubai",
    line: "Een eerlijke vraagprijs op basis van wat er in jouw gebouw en wijk echt betaald is. En een koper die past.",
    ask: "verkopen in Dubai",
    main: unsplash(
      "https://images.unsplash.com/photo-1772175089016-4023a6f3d219",
      4480, 6720,
      "Het zwembad van The Address Downtown in Dubai, met de torens van Downtown erachter op een zonnige dag",
      "Damian Kamp", "dmotionmedia", "NUyGj5eS_rM", "50% 45%",
    ),
  },
  {
    id: "advies",
    name: "Advies en portfolio",
    where: "Ook als het antwoord nee is",
    line: "Twijfel je nog? Dan kijken we eerst samen of Dubai bij jouw plan past. Daarna bouwen we, als je wilt, aan een portfolio voor nu en voor later.",
    ask: "advies over Dubai",
    main: unsplash(
      "https://images.unsplash.com/photo-1619806840163-38e329be64bb",
      4820, 3615,
      "Downtown Dubai vanaf een dak gezien, met Burj Khalifa boven de torens en het water van de fonteinen",
      "Jeshur Jacinto", "jnjshots", "b_oMlBq0VrQ", "50% 55%",
    ),
    detail: unsplash(
      "https://images.unsplash.com/photo-1615747476328-41153cf6da54",
      5284, 6605,
      "Witte bogen aan het water in Dubai, met de skyline en Burj Khalifa in de verte",
      "Ismail Merad", "ismail_fwcr", "T9WWuoUwxjA", "50% 60%",
    ),
  },
];
