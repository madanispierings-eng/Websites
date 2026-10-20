# Astrum v3: plan (overdracht)

Status: plan gemaakt, nog geen code. De gebruiker moet nog kiezen bij de open punten onderaan.

## Opdracht

Ultra-luxe, moderne, dynamische homepage voor Astrum (boutique makelaar in Dubai voor Nederlanders), op Awwwards-niveau. Inhoud uit `scraper/output/` en `src/lib/`. Strikte eisen van de gebruiker:

- Diep, rijk palet met subtiele accenten; geen paars-blauwe verlopen.
- Asymmetrische lay-outs, geen bento-grids of kaarten-templates.
- Grote elegante koppen tegenover minimalistische bodytekst.
- GSAP + Lenis voor smooth scrolling over de hele site.
- Scroll-reveals, parallax en scale-up op beelden.
- Magnetische knoppen, tekst-reveals per letter/woord (SplitText).
- Custom cursor die van vorm verandert boven projecten en video.
- Na elke stap controleren met Playwright (1440, 768, 390).
- Moderne Dubai-foto's (Unsplash via `UNSPLASH_ACCESS_KEY`).

## Richting (TasteSkill)

Getrokken: **The name as a monument**, seed `313255916`, hero "Name under a photograph". Bestand: `.taste-skill/direction.json` (staat in .gitignore; opnieuw trekken met dezelfde seed als het ontbreekt). Palet en type van de trekking (roze/aubergine, Bebas Neue) zijn vervangen door het merk (`--keep palette,type`).

**Idee:** de naam ASTRUM ("ster") wordt het venster op Dubai bij nacht: de letters zijn uit de skyline gesneden, en wie scrollt kijkt erdoorheen, verder de stad in ("Voor wie verder kijkt").

**Live ding:** de kostencalculator (echte bijkomende kosten bij een prijs).

## Design system

| Rol | Kleur |
| --- | --- |
| Ground, Nachtcreek | `#102624` |
| Surface | `#173432` |
| Licht veld, Porselein | `#F2EFE8` |
| Ink | `#F2EFE8` op donker, `#1A1C1E` op licht |
| Accent, Champagne | `#C9AB72`, alleen hoofdknop en grote cijfers |

Type: Bodoni Moda (display, woordmerk, h2) en Clash Grotesk (tekst, UI, 17-19px). Raster 12 kolommen, marges 24px (16px telefoon), 160-240px tussen secties.

## Opbouw

1. Hero: ASTRUM als monument onder een foto van Dubai
2. Intro: "Voor wie verder kijkt", kop als bijschrift bij een doorlopend panorama
3. Wijken: Palm, Marina, Downtown, Creek Harbour; vierkante foto, tabs, scale-up
4. Diensten: Kopen, Verkopen, Advies als tekstkolommen
5. Werkwijze: Kennismaken, Uitzoeken, Aankopen, Daarna; één sticky woord per scherm
6. Kosten: calculator, grote cijfers in champagne
7. Over ons: brief, portretten Pim, Denise, Ron als initiaal
8. Vragen: grote vragen links, open antwoorden rechts
9. Contact: e-mail, Instagram, Dubai in grote regels
10. Footer: "Plan een gesprek" boven een afgesneden ASTRUM

## Hero

- Desktop: foto/video schermbreed (bovenste 58%), daaronder Nachtcreek-band met zin + knop "Plan een gesprek" en ASTRUM in Bodoni over de volle breedte. Nav rechtsboven over de foto.
- Telefoon: foto 50svh, ASTRUM op één regel (~23vw), zin en knop erboven, nav wordt "Menu".
- Intro-timeline (~2s): letters per letter op met de stad als masker in de letters, dan groeit het beeld vanuit de letters tot de volle foto en worden de letters massief; daarna zin, knop, nav.
- Scroll: woordmerk schaalt 1 naar 0.94, foto parallax (scale 1.08 naar 1).
- Lenis gekoppeld aan ScrollTrigger via `gsap.ticker`; cursor (8px stip + naijlende ring via `quickTo`; 88px "Bekijk" boven wijken, "Pauze/Speel" boven video; alleen `pointer: fine`); magnetische knoppen max 8px.
- `prefers-reduced-motion`: geen intro, geen Lenis, geen cursor, poster in plaats van video.

## Open punten (antwoord gebruiker nodig)

1. Bouwen in `astrum-web/` (advies) of als losse site?
2. Wijken tonen in plaats van projecten, zonder verzonnen prijzen of klantverhalen?
3. Foto's: Unsplash (key wordt toegevoegd), eigen beeld van Astrum, of Wikimedia Commons.
4. Donker Creek-groen met lichte secties akkoord, of hero lichter? (v2-feedback: zwart was niet high-end.)

Later: `NETLIFY_AUTH_TOKEN` voor preview-links.
