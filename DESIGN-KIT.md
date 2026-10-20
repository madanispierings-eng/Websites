# Website Design Kit voor Claude Code

Deze bestanden staan in de hoofdmap van deze repository:

```
.claude/settings.json      → skills/plugins (worden automatisch geïnstalleerd)
.claude/agents/visual-qa.md → browser-QA agent
.mcp.json                  → shadcn, Playwright, Chrome DevTools
CLAUDE.md                  → werkwijze: welke tool wanneer
```

Commit ze. Bij de eerste start van `claude` in dat project vraagt Claude Code
of je de marketplaces vertrouwt. Bevestig, en alles wordt geïnstalleerd. Dit
werkt lokaal én in cloud-sessies.

## Wat zit erin

| Rol | Tool | Bron |
|---|---|---|
| Visuele richting | TasteSkill (`design-taste-frontend`) | Leonxlnx/taste-skill |
| Visuele richting (alternatief) | Anthropic `frontend-design` | anthropics/claude-code |
| Design system / data | UI/UX Pro Max | nextlevelbuilder/ui-ux-pro-max-skill |
| Kritiek & polish | Impeccable (24 commando's) | pbakaus/impeccable |
| Animatie | GSAP skills (8 stuks) | greensock/gsap-skills |
| Componenten | shadcn MCP | `npx shadcn mcp` |
| Browser | Playwright MCP + Chrome DevTools MCP | Microsoft / Google |

## Lokaal op een Mac

Chrome DevTools MCP gebruikt standaard de Chromium van de cloud-omgeving. Zet
op je Mac in je shellprofiel:

```sh
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

## Optioneel: 21st.dev Magic

Vraagt een API-key van https://21st.dev/magic/console:

```sh
claude mcp add magic --scope project --env API_KEY=jouw-key -- npx -y @21st-dev/magic@latest
```

## Websites scrapen

De agent `website-scraper` haalt complete websites binnen en zet ze om naar
Markdown, JSON of CSV. Hij gebruikt Playwright voor JavaScript-zware sites en
schrijft voor grote sites zelf een crawl-script in `scraper/`.

Vraag bijvoorbeeld: *"Scrape alle producten van voorbeeld.nl naar een CSV."*

**In cloud-sessies:** het netwerk staat standaard alleen pakketbronnen
(npm, PyPI, GitHub) toe. Zet in de omgevingsinstellingen *Network access* op
**Full**, of voeg de te scrapen domeinen toe bij *Allowed domains*. Zie
https://code.claude.com/docs/en/cloud-environments#network-access.

**Optioneel: Apify** (kant-en-klare cloud-scrapers, vraagt een API-token van
https://console.apify.com/account/integrations):

```sh
claude mcp add apify --scope project --env APIFY_TOKEN=jouw-token -- npx -y @apify/actors-mcp-server
```

In cloud-sessies moet dan ook `api.apify.com` toegestaan zijn.

## Goed om te weten

- Impeccable draait hooks bij sessiestart, na elke Edit/Write en bij Stop. De
  eerste keer downloadt het een binary van zijn GitHub-releases. Uitzetten:
  `claude plugin disable impeccable@impeccable --scope project`.
- UI/UX Pro Max draait lokale Python-scripts (geen extra dependencies).
