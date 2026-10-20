# Astrum: nieuwe website

Herontwerp van [astrumuae.com](https://astrumuae.com) als statische site (HTML, CSS, GSAP), geen buildstap.

```sh
cd astrum && python3 -m http.server 8765   # http://localhost:8765
```

Netlify: publiceer de map `astrum/`. De formulieren `kennismaking` en `marktupdates` gebruiken Netlify Forms, net als de huidige site.

## Opbouw

| Bestand | Inhoud |
| --- | --- |
| `index.html` | De pagina: hero, intro, diensten, werkwijze, kostencalculator, brief en team, vragen, contact, Private List |
| `styles.css` | Design tokens (kleuren en vijf typestappen) bovenaan, daarna per sectie |
| `main.js` | Menu, dialoog, formulieren, kostencalculator, en de GSAP-animaties (met `prefers-reduced-motion`) |
| `privacy.html` | Korte privacyverklaring |
| `img/`, `video/`, `fonts/`, `vendor/` | Geoptimaliseerde beelden, de Creek-loop, Clash Grotesk, GSAP 3.12.5 |
| `assets/credits.json` | Bron en licentie van elke foto en de film uit Wikimedia Commons |
| `.taste-skill/direction.json` | De gekozen art direction (TasteSkill, "The split stage") |

## Voor livegang controleren

- **Kostentarieven** in `main.js` (`costs()`): DLD 4% + AED 580, Oqood AED 1.150, trustee AED 4.000/2.000 + btw, courtage 2% + btw, hypotheekregistratie 0,25% + AED 290, taxatie ca. AED 3.000, afsluitkosten tot 1%. Gangbare tarieven, maar laat Astrum ze bevestigen. Wisselkoers staat standaard op 4,25 AED per euro.
- **Voorbeeldteksten** die Astrum moet bevestigen: "ter plekke of op video", "We reageren binnen één werkdag", de vragen en antwoorden (Golden Visa vanaf AED 2 miljoen, op afstand kopen met volmacht), en de brief "Waarom we het zo doen", die uit hun eigen zinnen is samengesteld.
- **Ontbreekt nog**: telefoonnummer/WhatsApp, kantooradres en RERA/ORN-nummer. Die horen in de contactsectie en de footer zodra ze er zijn.
- **Beeld**: de teamfoto's zijn van Astrum. De Dubai-foto's en de film komen uit Wikimedia Commons (CC BY / CC BY-SA, vermeld in de footer). De OMNIYAT-foto's van de oude site zijn bewust niet gebruikt, omdat ze alleen met toestemming van OMNIYAT mogen.
