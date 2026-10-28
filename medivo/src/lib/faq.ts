export type FaqGroup = { title: string; items: { q: string; a: string }[] };

// Answers describe how the platform works today. Prices and plans are configured in Stripe and shown at checkout,
// so they are deliberately not repeated here.
export const faq: FaqGroup[] = [
  {
    title: "Toegang en account",
    items: [
      {
        q: "Voor wie is Medivo bedoeld?",
        a: "Medivo is gemaakt voor studenten in de bachelor Geneeskunde aan de Universiteit Leiden. Het platform volgt de vakken van jaar 1 tot en met 3.",
      },
      {
        q: "Heb ik een account nodig?",
        a: "Het overzicht van vakken kun je zonder account bekijken. Voor oefenvragen, het bijhouden van je voortgang en het opslaan van vragen heb je een gratis account nodig.",
      },
      {
        q: "Werkt Medivo op mijn telefoon?",
        a: "Ja. Alle onderdelen, ook het oefenen van vragen, werken in de browser op telefoon, tablet en laptop. Je hoeft niets te installeren.",
      },
      {
        q: "Is Medivo verbonden aan de Universiteit Leiden of het LUMC?",
        a: "Nee. Medivo is een onafhankelijk studieplatform. We volgen de opbouw van de bachelor, maar zijn niet verbonden aan of goedgekeurd door de universiteit of het LUMC.",
      },
    ],
  },
  {
    title: "Inhoud",
    items: [
      {
        q: "Wat vind ik per vak?",
        a: "Elk vak heeft vier onderdelen: een volledige samenvatting per onderwerp, de leerdoelen, een overzicht van oude tentamens en oefenvragen per onderwerp. Inhoud wordt per vak gepubliceerd zodra die is gecontroleerd.",
      },
      {
        q: "Hoe wordt de inhoud gecontroleerd?",
        a: "Niets wordt gepubliceerd zonder inhoudelijke controle. Ook materiaal dat met hulp van software is opgesteld, wordt eerst nagekeken voordat het online komt.",
      },
      {
        q: "Mogen jullie oude tentamens publiceren?",
        a: "We tonen alleen tentamenmateriaal waarvoor we toestemming hebben of dat we zelf hebben gemaakt. Bij elk tentamen staat de bron vermeld.",
      },
      {
        q: "Ik zie een fout in een vraag of samenvatting. Wat nu?",
        a: "Laat het ons weten. Meldingen over inhoud krijgen voorrang, omdat juiste informatie voor ons het belangrijkst is.",
      },
    ],
  },
  {
    title: "Abonnementen en betalen",
    items: [
      {
        q: "Wat kost Medivo?",
        a: "De actuele prijzen en de opties (per vak of voor de hele bachelor) zie je op het moment dat je toegang koopt. Je betaalt nooit automatisch zonder dat je zelf een abonnement hebt afgesloten.",
      },
      {
        q: "Hoe betaal ik?",
        a: "Betalingen lopen via Stripe, een gespecialiseerde betaalprovider. Medivo ziet en bewaart je betaalgegevens niet.",
      },
      {
        q: "Kan ik mijn abonnement opzeggen?",
        a: "Ja, je beheert je abonnement zelf vanuit je dashboard. Na opzeggen houd je toegang tot het einde van de betaalde periode.",
      },
    ],
  },
  {
    title: "Privacy en gegevens",
    items: [
      {
        q: "Welke gegevens bewaren jullie?",
        a: "Alleen wat nodig is om het platform te laten werken: je naam, e-mailadres, je studievoortgang en je abonnementsstatus. We verkopen geen gegevens.",
      },
      {
        q: "Kan ik mijn account verwijderen?",
        a: "Ja. Als je je account verwijdert, worden je profiel en je voortgang verwijderd. Gegevens die we wettelijk moeten bewaren, zoals factuurgegevens, blijven alleen zo lang als de wet voorschrijft.",
      },
    ],
  },
];
