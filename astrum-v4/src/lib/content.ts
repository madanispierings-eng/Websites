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
  { href: "#diensten", label: "Diensten" },
  { href: "#wijken", label: "Wijken" },
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
  { href: "#diensten", label: "Kopen, verkopen, advies" },
  { href: "#wijken", label: "Wijken" },
  { href: "#werkwijze", label: "Werkwijze" },
  { href: "#kosten", label: "Wat kopen kost" },
  { href: "#over-ons", label: "Over ons" },
  { href: "#vragen", label: "Vragen" },
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

export const statement = {
  text: "Het gaat niet om het hoogste gebouw of het snelste project. Het gaat om de keuze die past bij jouw plan.",
  usps: ["Eerst jouw plan, dan pas een woning", "Echte verkoopprijzen in plaats van beloftes", "Eén vast aanspreekpunt, in het Nederlands"],
};

/** De wijken waar Nederlandse kopers het vaakst naar vragen. Alle foto's zijn in Dubai gemaakt. */
export const areas: District[] = [
  {
    id: "palm",
    name: "Palm Jumeirah",
    line: "Het eiland in de vorm van een palm: villa’s op de bladeren, appartementen op de stam en hotels op de kroon.",
    coords: "25°07′N 55°08′E",
    photo: unsplash(
      "https://images.unsplash.com/photo-1677632227880-4d21073ef8f4",
      6000, 4000,
      "De bladeren van de Palm Jumeirah vol villa’s, van bovenaf gezien vanaf Aura Skypool, met Atlantis aan de horizon",
      "Thomas Haas", "thomashaas", "wfANLGIhOtM", "50% 55%",
    ),
  },
  {
    id: "marina",
    name: "Dubai Marina",
    line: "Woontorens rond een jachthaven van drie kilometer, met de zee en het strand van JBR op loopafstand.",
    coords: "25°05′N 55°08′E",
    photo: unsplash(
      "https://images.unsplash.com/photo-1721801783842-7133fbf11509",
      6000, 4000,
      "Dubai Marina van bovenaf, met de jachthaven tussen de woontorens",
      "Nelemson Guevarra", "nelemson", "kFVru8-ObEA", "50% 50%",
    ),
  },
  {
    id: "jumeirah",
    name: "Jumeirah",
    line: "De kust van het oudere Dubai: lagere bebouwing, villa’s met tuinen en de stranden rond Burj Al Arab.",
    coords: "25°08′N 55°11′E",
    photo: unsplash(
      "https://images.unsplash.com/flagged/photo-1555457900-4f4cf4768371",
      5726, 3222,
      "Burj Al Arab bij daglicht, met Jumeirah Beach Hotel en de skyline van Dubai in de verte",
      "Nathan John", "jnate", "FI8xXh9eX5w", "35% 50%",
    ),
  },
  {
    id: "downtown",
    name: "Downtown",
    line: "Het centrum rond Burj Khalifa en Dubai Mall, met appartementen tot hoog in de torens en de fonteinen voor de deur.",
    coords: "25°12′N 55°16′E",
    photo: unsplash(
      "https://images.unsplash.com/photo-1708361089093-beef4c4584e7",
      7883, 5604,
      "Burj Khalifa en de torens van Downtown Dubai in de schemering, gezien vanaf Sky Views",
      "Fabien Bellanger", "fabbel78", "WyfXOHgI49s", "50% 50%",
    ),
  },
  {
    id: "creek",
    name: "Creek Harbour",
    line: "Een nieuwe wijk aan de kreek, grotendeels off-plan, met uitzicht over het water op de skyline van Downtown.",
    coords: "25°12′N 55°21′E",
    photo: unsplash(
      "https://images.unsplash.com/photo-1706798636475-882837a93f94",
      2992, 3740,
      "De skyline van Dubai met Burj Khalifa bij zonsondergang, gezien over het water vanaf Creek Harbour",
      "Shifan Hassan", "shifanhassan", "BebLGxMR-uM", "50% 55%",
    ),
  },
];

/** Een eigen foto van Astrum, uit /public. */
export type LocalPhoto = { src: string; width: number; height: number; alt: string; focus?: string };

export const process = {
  title: "Vier stappen. In jouw tempo.",
  intro: "Een goede aankoop begint bij jouw plan. Pas daarna kijken we naar projecten.",
  steps: [
    {
      name: "Kennismaken",
      text: "We beginnen met jouw plan, niet met een project. Wat wil je, hoe lang kun je wachten, wat mag het kosten?",
      local: { src: "/img/duo.jpg", width: 920, height: 1125, alt: "Pim Verberg en Denise Birjmohun van Astrum in een sales gallery in Dubai", focus: "50% 30%" } as LocalPhoto,
    },
    {
      name: "Uitzoeken",
      text: "We vergelijken wijken, ontwikkelaars en echte verkoopprijzen. Je ziet wat er speelt, ook wat minder mooi is.",
      photo: unsplash(
        "https://images.unsplash.com/photo-1748373502104-cb28af375638",
        6000, 4000,
        "De kust van Dubai van bovenaf, met het strand van JBR, de torens van de Marina en de Palm in de verte",
        "Nejc Soklič", "nejc_soklic", "C3ZBEAzk64Q", "50% 50%",
      ),
    },
    {
      name: "Aankopen",
      text: "We lopen elk document met je door en zijn erbij tot de overdracht. Geen haast om te tekenen.",
      photo: unsplash(
        "https://images.unsplash.com/photo-1677632227484-7ae0b3d2528a",
        5994, 3996,
        "Uitzicht vanaf Aura Skypool over de kust van Dubai, met Burj Al Arab en Downtown in de nevel",
        "Thomas Haas", "thomashaas", "rS9JaZD6mtE", "50% 50%",
      ),
    },
    {
      name: "Daarna",
      text: "Ook na de sleutel blijven we bereikbaar. Voor vragen over verhuur, de markt of je volgende stap.",
      photo: unsplash(
        "https://images.unsplash.com/photo-1688671525781-d9447cf1abd2",
        3210, 2140,
        "De skyline van Dubai over het water, met Burj Al Arab en Burj Khalifa in de verte",
        "Thomas Haas", "thomashaas", "3D5YdOq68Y4", "50% 50%",
      ),
    },
  ],
};

export const team = {
  title: "De mensen achter Astrum",
  intro: "Persoonlijk betrokken, van het eerste gesprek tot ver na de overdracht.",
  quote: "Astrum begeleidt investeerders persoonlijk en met geduld. Samen bouwen we aan een portfolio voor nu en voor later, als je vaste partner in de Emiraten.",
  people: [
    { name: "Pim Verberg", role: "Co-founder", note: "Deelt op Instagram wat hij in de markt ziet.", photo: { src: "/img/pim.jpg", width: 900, height: 1600, alt: "Pim Verberg, co-founder van Astrum", focus: "50% 22%" } as LocalPhoto },
    { name: "Denise Birjmohun", role: "Co-founder", photo: { src: "/img/denise.jpg", width: 900, height: 1600, alt: "Denise Birjmohun, co-founder van Astrum", focus: "50% 22%" } as LocalPhoto },
    { name: "Ron Veen", role: "Co-founder", photo: { src: "/img/ron.jpg", width: 900, height: 1600, alt: "Ron Veen, co-founder van Astrum", focus: "50% 22%" } as LocalPhoto },
  ],
};

export const privateList = {
  name: "Astrum Private List",
  text: "Wat er echt verkocht is, welke projecten eraan komen en kansen die we eerst met deze lijst delen. Persoonlijk samengesteld, zonder ruis.",
};
