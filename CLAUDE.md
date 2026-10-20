# Design-werkwijze

In dit project zijn design-skills, component-bibliotheken en browsertools geïnstalleerd. Gebruik ze in deze volgorde, met elk een eigen rol, zodat esthetische regels elkaar niet tegenspreken.

1. **Richting bepalen (één leidende stijl):** gebruik `design-taste-frontend` (TasteSkill) voor websites en landingspagina's. Gebruik `frontend-design` alleen als TasteSkill niet past of als de gebruiker erom vraagt. Combineer ze niet binnen één pagina.
2. **Design system:** gebruik `ui-ux-pro-max` om kleurenpaletten, lettertype-combinaties en stijlkeuzes op te zoeken die passen bij de branche, en leg ze vast als CSS-variabelen of design tokens. Neem dit over binnen de richting uit stap 1, niet ernaast.
3. **Componenten:** zoek in een React/Tailwind-project eerst via de `shadcn` MCP-server naar een bestaand component voordat je er zelf een bouwt. Pas het daarna aan op de gekozen stijl.
4. **Animatie:** gebruik de `gsap-*` skills voor scroll-animaties (ScrollTrigger), timelines en transities. Houd beweging doelgericht en respecteer `prefers-reduced-motion`.
5. **Afwerking:** gebruik `impeccable` (bijv. `/impeccable critique`, `/impeccable polish`, `/impeccable audit`) om typische AI-designfouten op te sporen.
6. **Controleren:** laat de `visual-qa` agent de pagina in een echte browser bekijken (Playwright of Chrome DevTools) en fouten herstellen.

Lever nooit UI-werk op zonder stap 6.
