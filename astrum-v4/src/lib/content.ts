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
  sentence: "Vastgoed in Dubai, voor wie verder kijkt.",
  specRight: "Eén aanspreekpunt, in het Nederlands",
  action: "Plan een gesprek",
};

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

export type District = { id: string; name: string; coords: string; photo: Photo };

const utm = "?utm_source=astrum&utm_medium=referral";

/** Van schemer naar nacht: zo verschuift het licht in de vitrine met elke wissel. */
export const districts: District[] = [
  {
    id: "creek-harbour",
    name: "Creek Harbour",
    coords: "25°12′N 55°21′E",
    photo: {
      src: "https://images.unsplash.com/photo-1706798636475-882837a93f94",
      width: 2992,
      height: 3740,
      alt: "De skyline van Dubai met Burj Khalifa bij zonsondergang, gezien over het water vanaf Creek Harbour",
      by: "Shifan Hassan",
      byUrl: `https://unsplash.com/@shifanhassan${utm}`,
      page: `https://unsplash.com/photos/BebLGxMR-uM${utm}`,
      focus: "50% 55%",
    },
  },
  {
    id: "palm-jumeirah",
    name: "Palm Jumeirah",
    coords: "25°07′N 55°08′E",
    photo: {
      src: "https://images.unsplash.com/photo-1773393776501-11b5543ceba0",
      width: 4284,
      height: 5712,
      alt: "Atlantis op de Palm Jumeirah, verlicht in het blauwe uur, weerspiegeld in de zee",
      by: "Nejc Soklič",
      byUrl: `https://unsplash.com/@nejc_soklic${utm}`,
      page: `https://unsplash.com/photos/sj5gkA4Mfps${utm}`,
      focus: "50% 45%",
    },
  },
  {
    id: "dubai-marina",
    name: "Dubai Marina",
    coords: "25°05′N 55°08′E",
    photo: {
      src: "https://images.unsplash.com/photo-1728418598142-75c1b31cb318",
      width: 4284,
      height: 5712,
      alt: "Een jacht in de haven van Dubai Marina bij nacht, met verlichte woontorens erachter",
      by: "Nejc Soklič",
      byUrl: `https://unsplash.com/@nejc_soklic${utm}`,
      page: `https://unsplash.com/photos/Vm1L3yVjLK8${utm}`,
      focus: "50% 60%",
    },
  },
  {
    id: "downtown",
    name: "Downtown",
    coords: "25°12′N 55°16′E",
    photo: {
      src: "https://images.unsplash.com/photo-1582120031356-35f21bf61055",
      width: 4430,
      height: 6642,
      alt: "Burj Khalifa en Downtown Dubai bij nacht, van bovenaf gezien",
      by: "Timo Volz",
      byUrl: `https://unsplash.com/@magict1911${utm}`,
      page: `https://unsplash.com/photos/1VLkjaZ0P4M${utm}`,
      focus: "45% 50%",
    },
  },
];

/** imgix-parameters: formaat kiest de browser (AVIF/WebP), breedte per srcset-stap. */
export const photoUrl = (p: Photo, w: number, h?: number) =>
  `${p.src}?auto=format&fit=crop&q=72&w=${w}${h ? `&h=${h}` : ""}`;
export const photoSrcSet = (p: Photo, widths = [640, 960, 1440, 2000, 2600]) =>
  widths.map((w) => `${photoUrl(p, w)} ${w}w`).join(", ");

export const menu = [
  { href: "#wijken", label: "Wijken" },
  { href: "#diensten", label: "Kopen, verkopen, advies" },
  { href: "#kosten", label: "Wat kopen kost" },
  { href: "#over-ons", label: "Over ons" },
  { href: "#contact", label: "Contact" },
];
