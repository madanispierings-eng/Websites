// Conceptartikelen op basis van algemene marktkennis. Astrum controleert ze vóór publicatie.
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "img"; src: string; alt: string; caption: string };

export type Article = {
  slug: string;
  title: string;
  dek: string;
  topic: string;
  minutes: number;
  image: { src: string; alt: string };
  intro: string;
  body: Block[];
};

export const articles: Article[] = [
  {
    slug: "vraagprijs-of-transactieprijs",
    title: "Vraagprijs of transactieprijs?",
    dek: "Wat er in Dubai echt betaald wordt, en hoe je dat zelf nagaat.",
    topic: "Markt",
    minutes: 4,
    image: { src: "/img/marina.jpg", alt: "Dubai Marina bij nacht" },
    intro:
      "Op de portalen zie je wat verkopers vragen. Wat kopers betalen is iets anders. In Dubai kun je dat verschil gewoon opzoeken, en dat is precies waar je moet beginnen.",
    body: [
      { type: "h2", text: "Elke verkoop staat geregistreerd" },
      {
        type: "p",
        text: "Iedere overdracht in Dubai loopt via het Dubai Land Department. Daardoor bestaat er een openbaar register van transacties: datum, gebied, type woning, oppervlakte en prijs. Wie wil weten wat een appartement waard is, kijkt niet naar de advertenties in hetzelfde gebouw, maar naar wat daar de afgelopen maanden echt is betaald.",
      },
      { type: "img", src: "/img/skyline.jpg", alt: "De skyline van Dubai, van ver gezien", caption: "Van een afstand lijkt elk gebouw even duur." },
      { type: "h2", text: "Waarom vraagprijzen hoger liggen" },
      {
        type: "p",
        text: "Een vraagprijs is een openingsbod. Verkopers testen de markt, sommige advertenties blijven maanden staan en een deel van het aanbod wordt nooit verkocht. Het gemiddelde van wat er online staat, ligt daardoor bijna altijd boven het gemiddelde van wat er overgedragen wordt.",
      },
      { type: "h2", text: "Zo vergelijk je eerlijk" },
      {
        type: "ul",
        items: [
          "Vergelijk per vierkante voet, niet per woning. Een appartement van 900 sq ft is iets anders dan een van 1.200 sq ft.",
          "Kijk naar hetzelfde gebouw, of hooguit dezelfde straat. Twee torens naast elkaar kunnen ver uit elkaar liggen in prijs.",
          "Neem de laatste zes tot twaalf maanden. Oudere transacties zeggen weinig in een markt die snel beweegt.",
          "Houd off-plan en bestaand apart. Off-plan wordt vaak met een betalingsplan verkocht; dat zit in de prijs.",
          "Let op verdieping, uitzicht en oplevering. Een hoge verdieping met zeezicht verklaart een groot deel van een verschil.",
        ],
      },
      { type: "h2", text: "Wat dit voor jou betekent" },
      {
        type: "p",
        text: "Als koper weet je wat een redelijk bod is, en wanneer je beter kunt doorlopen. Als verkoper zet je een prijs neer die kopers serieus nemen, zodat je woning niet maandenlang blijft staan. Wij leggen bij elke woning die we bespreken de vraagprijs naast de transacties. Ook als dat verhaal minder mooi is.",
      },
    ],
  },
  {
    slug: "het-zuiden-van-dubai",
    title: "Het zuiden van Dubai",
    dek: "Waarom je daar een tijdlijn koopt, geen wijk.",
    topic: "Gebieden",
    minutes: 5,
    image: { src: "/img/skyline.jpg", alt: "De skyline van Dubai, van ver gezien" },
    intro:
      "In het zuiden van Dubai, rond Expo City, Dubai South en de luchthaven Al Maktoum, wordt veel gebouwd. Wie daar koopt, koopt vooral een verwachting over de komende jaren. Dat kan goed uitpakken, als je weet waar je op rekent.",
    body: [
      { type: "h2", text: "Een gebied dat nog moet ontstaan" },
      {
        type: "p",
        text: "Delen van het zuiden zijn vandaag nog bouwplaats. De overheid heeft grote plannen voor de uitbreiding van Al Maktoum International Airport, en rond Expo City groeit een nieuwe stadswijk. Prijzen liggen er lager dan in de gevestigde wijken aan de kust, juist omdat de voorzieningen nog moeten komen.",
      },
      { type: "img", src: "/img/palm.jpg", alt: "Palm Jumeirah, gezien vanuit het vliegtuig", caption: "Ook Palm Jumeirah was ooit een tijdlijn." },
      { type: "h2", text: "Waar je eigenlijk op wacht" },
      {
        type: "ul",
        items: [
          "Infrastructuur: wegen, metro en de luchthaven. Hoe sneller die er zijn, hoe eerder het gebied leeft.",
          "Voorzieningen: scholen, winkels, zorg. Huurders kiezen een wijk waar ze kunnen wonen, niet een belofte.",
          "Oplevering van de projecten om je heen. Veel nieuw aanbod tegelijk drukt de huren in de eerste jaren.",
        ],
      },
      { type: "h2", text: "De vragen die je jezelf stelt" },
      {
        type: "p",
        text: "Hoe lang kun en wil je wachten? Heb je de huur nodig vanaf de oplevering, of kun je een paar jaar overbruggen? En wat gebeurt er met je plan als de luchthaven of de metro later komt dan gepland? Wie hier rustig antwoord op heeft, kan in het zuiden goed instappen. Wie snel rendement zoekt, is vaak beter af in een wijk die al af is.",
      },
      { type: "h2", text: "Hoe wij ernaar kijken" },
      {
        type: "p",
        text: "We bekijken per project wanneer het wordt opgeleverd, wat er in dezelfde periode in de buurt opgeleverd wordt en welke ontwikkelaar het bouwt. Zo zie je niet alleen de wijk zoals hij op de render staat, maar ook de jaren ertussen.",
      },
    ],
  },
  {
    slug: "off-plan-contract-checklist",
    title: "Off-plan: check dit eerst",
    dek: "Wat je nagaat voordat je een off-plan contract tekent.",
    topic: "Off-plan",
    minutes: 6,
    image: { src: "/img/old-city.jpg", alt: "Een windtoren in de oude wijk Al Fahidi" },
    intro:
      "Off-plan kopen kan aantrekkelijk zijn: een lagere instap en betalen in termijnen. Maar je tekent voor iets wat nog niet bestaat. Deze punten loop je na voordat je je handtekening zet.",
    body: [
      { type: "h2", text: "De ontwikkelaar" },
      {
        type: "ul",
        items: [
          "Welke projecten heeft deze ontwikkelaar eerder opgeleverd, en op tijd?",
          "Hoe zien die gebouwen er een paar jaar na oplevering uit? Ga kijken, of laat ons kijken.",
        ],
      },
      { type: "h2", text: "Registratie en escrow" },
      {
        type: "ul",
        items: [
          "Is het project geregistreerd bij RERA, de toezichthouder van het Dubai Land Department?",
          "Gaan je betalingen naar de escrow-rekening van het project, en niet naar de ontwikkelaar zelf?",
          "Wordt je koop geregistreerd in Oqood? Dat is je bewijs van eigendom tot de oplevering.",
        ],
      },
      { type: "img", src: "/img/marina.jpg", alt: "Dubai Marina bij nacht", caption: "Dubai Marina: grotendeels off-plan verkocht, jaren voor de oplevering." },
      { type: "h2", text: "Het betalingsplan" },
      {
        type: "p",
        text: "Kijk of de termijnen gekoppeld zijn aan de voortgang van de bouw of aan vaste data. Betalen op voortgang beschermt je beter als het project vertraging oploopt. Check ook wat er na de oplevering nog openstaat: bij een post-handover-plan betaal je door terwijl je de woning al gebruikt of verhuurt.",
      },
      { type: "h2", text: "Het koopcontract (SPA)" },
      {
        type: "ul",
        items: [
          "De opleverdatum, en wat er gebeurt bij vertraging. Hoeveel uitstel mag de ontwikkelaar nemen?",
          "Wat er gebeurt als jij een termijn niet kunt betalen.",
          "Of je de woning voor oplevering mag doorverkopen, en tegen welke kosten.",
          "De oppervlakte: mag die bij oplevering afwijken, en hoe wordt dat verrekend?",
        ],
      },
      { type: "h2", text: "Na de sleutel" },
      {
        type: "p",
        text: "Vraag naar de verwachte servicekosten per vierkante voet. Plan een inspectie van gebreken bij de oplevering, de snagging, voordat je tekent dat alles in orde is. En bedenk vooraf of je wilt verhuren, en hoe: een jaarcontract of korte verhuur vraagt een andere aanpak.",
      },
      {
        type: "p",
        text: "We lopen dit lijstje met je door voor elk project dat je overweegt. Ook als dat betekent dat we je afraden te tekenen.",
      },
    ],
  },
];

export const getArticle = (slug: string) => articles.find((a) => a.slug === slug);
