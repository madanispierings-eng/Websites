# Astrum: ontwerpplan (fase 1)

Bronnen: `frontend-design` (richting, tokens, layout), `ui-ux-pro-max` (UX-regels navigatie en formulieren), de scrape in `scraper/output/` (inhoud en merk), en de art direction uit v1 (`astrum/.taste-skill/direction.json`, "The split stage").

## Opdracht

- **Onderwerp:** Astrum, boutique makelaar in Dubai voor Nederlanders. Kopen, verkopen, advies, portfolio.
- **Publiek:** Nederlandse particulieren en investeerders met een budget vanaf ongeveer AED 1 miljoen. Ze zijn voorzichtig, lezen veel en vergelijken.
- **Hoofdtaak van de site:** vertrouwen opbouwen en een kennismakingsgesprek opleveren.
- **Wat alleen Astrum heeft:** echte transactieprijzen in plaats van brochurebeloftes, één vast Nederlandstalig aanspreekpunt, en een advies dat ook "nog niet" mag zijn. De naam betekent "ster" (Latijn); de slogan is "Voor wie verder kijkt".

## Het idee

Dubai verkoopt met glanzende brochures. Astrum is het nuchtere prospectus ernaast: **de echte getallen staan groot**, en de mensen zijn zichtbaar. Al het lef zit in één ding: het grote woordmerk en de grote cijfers (kosten, percentages). De rest blijft rustig.

## Tokens (versie 2: high-end, licht)

Het zwart uit versie 1 is vervangen. De klant vond het niet high-end en niet modern genoeg.

| Rol | Naam | Hex | Gebruik |
| --- | --- | --- | --- |
| Ground | Porselein | `#F5F5F3` | Achtergrond: bijna wit, neutraal, geen crème |
| Panel | Wit | `#FFFFFF` | Kaarten, formulieren, calculator |
| Tone | Steen | `#EBEAE6` | Afwisselende secties, footer |
| Ink | Antraciet | `#1A1C1E` | Tekst (geen zwart veld) |
| Muted | Grijs | `#63605B` | Secundaire tekst |
| Field | Creek | `#1F3B3A` | Primaire knop; calculator, kosten-hero en afsluitende band |
| Accent | Champagne | `#C2A26A` / `#7D6234` | Cijfers op Creek / cijfers op licht (contrast) |

**Type:** Bodoni Moda (koppen, h1/h2, display) en Clash Grotesk (tekst, h3, interface). Het woordmerk is ASTRUM in Bodoni, ruim gespatieerd, zoals het merk zelf.

**Beweging (GSAP + Lenis):**
- soepel scrollen
- een paginagordijn in Creek bij elke paginawissel
- koppen die regel voor regel opkomen (SplitText)
- foto's die met een masker onthuld worden
- de hero-skyline die zich opent tot de volle breedte
- de stappen op Kopen die horizontaal meelopen
- een header die wegschuift tijdens het lezen

Alles staat uit bij `prefers-reduced-motion`.

## Sitemap en navigatie

```
/                      Home
/kopen                 Kopen in Dubai
/verkopen              Verkopen
/advies                Advies en portfolio
/kosten                Wat kopen echt kost (calculator)
/over-ons              Over Astrum (brief en team)
/inzichten             Inzichten (blog-overzicht)
/inzichten/[slug]      3 artikelen (concept)
/vragen                Veelgestelde vragen
/contact               Contact en Private List
/privacy               Privacy
```

Balk: woordmerk links. Rechts staan "Diensten" (een uitklapmenu met Kopen, Verkopen en Advies), "Kosten", "Over ons", "Inzichten" en "Contact", gevolgd door de actie "Plan een gesprek". Op de telefoon staan er alleen het woordmerk, "Menu" (een paneel over het hele scherm) en de actie.
Volgens ui-ux-pro-max: de balk mag niet over inhoud vallen, de terugknop moet normaal werken (echte routes), en de huidige pagina krijgt `aria-current`.

## Opzet per pagina

```
HOME
┌────────────────────┬───────────────────────┐
│ foto (sticky)      │  nav                  │
│ Pim & Denise       │  zin + knop           │
│                    │                       │
│           astrum ──┼──────────────         │  woordmerk kruist de foto
├────────────────────┴───────────────────────┤
│ 3 diensten als menukaart (papier, lijst)   │  geen kaartengrid
├────────────────────────────────────────────┤
│ CREEK-veld: groot getal "4%" + mini-calc   │  het ene luide moment
├──────────────┬─────────────────────────────┤
│ brief-citaat │  team, 3 portretten ongelijk│
├──────────────┴─────────────────────────────┤
│ inzichten: 3 titels als lijst + foto       │
│ contactband                                │
└────────────────────────────────────────────┘

DIENSTPAGINA (kopen/verkopen/advies)
┌────────────────────────────┬───────────────┐
│ h1 (2 regels) + intro      │ staande foto  │
├────────────────────────────┴───────────────┤
│ stappen als <ol>, links smalle kolom,      │
│ rechts wat je krijgt per stap              │
│ vragen over dit onderwerp (accordion)      │
│ CTA-band                                   │
└────────────────────────────────────────────┘

KOSTEN: volle breedte calculator, Creek-veld, uitleg per post eronder.
OVER ONS: brief op papier, team, waarden als genummerde lijst (I, II, III).
INZICHTEN: lijst met titel, onderwerp en leestijd; artikel: smalle leeskolom.
CONTACT: links het formulier, rechts portret + e-mail + Instagram.
```

## Principes

1. De getallen zijn het beeld. Kosten, percentages en drempels staan in displaytype, nooit in een klein label.
2. Mensen boven gebouwen. De eigen teamfoto's krijgen de beste plekken; foto's van Dubai tonen de omgeving en nooit "ons aanbod".
3. Elke pagina eindigt bij één actie: Plan een gesprek.
4. Rust: links uitgelijnd, grote marges, geen kaartenrasters, geen labels boven koppen.

## Toets aan de opdracht (frontend-design, tweede ronde)

- *Zwarte achtergrond met één goudaccent* (v1) lijkt op het standaardpatroon "near-black + één fel accent". **Herzien:** de inhoudspagina's krijgen een lichte kalksteengrond, donker blijft voor de home-hero en de footer, en Creek-groen komt erbij als kleur van het water in Dubai. Zo wordt het een palet van plaats en merk, niet van een sjabloon.
- *Diensten als drie iconkaarten* zou de standaard zijn. **Herzien:** een menukaart of prijslijst met stippellijnen, passend bij "eerlijke prijzen".
- *Stappen met 01/02/03* is alleen toegestaan als de inhoud echt een volgorde is. Dat is zo bij het koopproces, dus daar een echte `<ol>`, en nergens anders.
