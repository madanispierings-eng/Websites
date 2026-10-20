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
 * Soorten woningen voor de showcase. Sfeerbeelden van Unsplash, geen aanbod van Astrum en niet allemaal in Dubai
 * gefotografeerd; de tekst beschrijft het type woning en waar je het in Dubai vooral vindt.
 */
export type Home = { id: string; name: string; where: string; line: string; main: Photo; detail?: Photo };

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

export const homes: Home[] = [
  {
    id: "penthouse",
    name: "Penthouse",
    where: "Vooral in Downtown en Business Bay",
    line: "Dubbele hoogte, glas van vloer tot plafond en de stad aan je voeten. Zeldzaam, dus de prijs per vierkante meter vraagt een eerlijke vergelijking.",
    main: unsplash(
      "https://images.unsplash.com/photo-1776362355123-ca966d36e29c",
      5000, 2812,
      "Een penthouse met een woonkamer van dubbele hoogte, ramen van vloer tot plafond en een trap naar de bovenverdieping",
      "Aalo Lens", "aalolens", "Ez7fz5mavj0", "40% 50%",
    ),
    detail: unsplash(
      "https://images.unsplash.com/photo-1705326701287-346fc37a2c86",
      6616, 3676,
      "Een lichte woonkamer met een witte bank, ronde fauteuils en een lage tafel",
      "Pipcke", "pipcke", "SZ-DsEZxzlg", "50% 60%",
    ),
  },
  {
    id: "appartement",
    name: "Appartement in een toren",
    where: "Vooral in Dubai Marina, JBR en Creek Harbour",
    line: "Een balkon boven het water, een zwembad in het gebouw en verhuur die zichzelf vaak bewijst. We kijken eerst naar wat er in jouw gebouw echt verkocht is.",
    main: unsplash(
      "https://images.unsplash.com/photo-1767055114909-1170503862f1",
      3333, 5000,
      "Een witte woontoren met golvende balkons, van onderaf gezien tegen een bewolkte lucht",
      "Jonathan Lim", "jonathankslim", "7dthTZ48vEY", "50% 40%",
    ),
  },
  {
    id: "villa",
    name: "Villa met zwembad",
    where: "Vooral op de Palm Jumeirah en in Dubai Hills",
    line: "Ruimte, een eigen tuin en water voor de deur. Voor wie er wil wonen of lang wil vasthouden, met het onderhoud en de servicekosten vooraf op papier.",
    main: unsplash(
      "https://images.unsplash.com/photo-1613977257363-707ba9348227",
      7781, 5190,
      "Een moderne witte villa met een zwembad, ligbedden en een overdekt terras",
      "John Fornander", "johnfo", "Id7u0EkTjBE", "50% 55%",
    ),
    detail: unsplash(
      "https://images.unsplash.com/photo-1543489822-c49534f3271f",
      3456, 1944,
      "Een infinity pool aan een witte gevel, met zee en eilanden aan de horizon",
      "big.tiny.belly", "bigtinybelly", "XtnNrQYC7ts", "60% 50%",
    ),
  },
];
