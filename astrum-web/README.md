# Astrum: website (Next.js)

De meerpagina-site voor Astrum, boutique makelaar in Dubai voor Nederlanders. Gebouwd in vier fasen:

| Fase | Skills | Resultaat |
| --- | --- | --- |
| 1. Concept en structuur | `frontend-design`, `ui-ux-pro-max` | [DESIGN.md](DESIGN.md): sitemap, navigatie, tokens, opzet per pagina |
| 2. Componenten | shadcn (MCP), Next.js, Tailwind v4 | Button, NavigationMenu, Sheet, Dialog, Accordion, Tabs, Slider, Select, RadioGroup, formulieren |
| 3. Afwerking en beweging | `design-taste-frontend` (lint + inspector), `gsap-react`, `gsap-scrolltrigger` | `src/components/motion.tsx`, met `prefers-reduced-motion` |
| 4. Controle | Vercel Web Interface Guidelines, React best practices, `impeccable`, visual-qa agent | Toegankelijkheid, SEO, bundelgrootte |

## Draaien

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # statische site in out/
```

## Online zetten

`npm run build` maakt de map `out/`. Sleep die map naar **app.netlify.com/drop**, of koppel de repo aan Netlify met build command `npm run build` en publish directory `out`.
De formulieren (`kennismaking`, `marktupdates`) gebruiken Netlify Forms via `public/__forms.html`.

## Pagina's

`/`, `/kopen/`, `/verkopen/`, `/advies/`, `/kosten/`, `/over-ons/`, `/inzichten/` (+ 3 artikelen), `/vragen/`, `/contact/`, `/privacy/`, plus `sitemap.xml` en `robots.txt`.

## Inhoud aanpassen

| Wat | Waar |
| --- | --- |
| Contactgegevens, diensten, team, fotobronnen | `src/lib/site.ts` |
| Kostentarieven van de calculator | `src/lib/costs.ts` |
| Veelgestelde vragen | `src/lib/faq.ts` |
| Artikelen | `src/lib/articles.ts` |
| Kleuren en typestappen | `src/app/globals.css` (bovenaan) |

## Voor livegang laten controleren door Astrum

- **Tarieven** in `src/lib/costs.ts`: DLD 4% + AED 580, Oqood AED 1.150, trustee AED 4.000/2.000 + btw, courtage 2% + btw, hypotheekregistratie 0,25% + AED 290, taxatie ca. AED 3.000, afsluitkosten tot 1%. Wisselkoers standaard 4,25.
- **Conceptteksten:** de drie artikelen, de vragen en antwoorden (Golden Visa vanaf AED 2 miljoen, verhuur via Ejari/DET, verkoop met Form A/F en NOC), "ter plekke of via video", "We reageren binnen één werkdag" en "Foto’s en presentatie: verzorgd".
- **Ontbreekt nog:** telefoonnummer/WhatsApp, kantooradres, RERA/ORN-nummer en bio's van het team.
- **Beeld:** teamfoto's zijn van Astrum. Foto's en film van Dubai komen uit Wikimedia Commons (CC BY / CC BY-SA), met bronvermelding in de footer. De OMNIYAT-beelden van de oude site zijn niet gebruikt.
