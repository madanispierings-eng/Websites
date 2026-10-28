# Medivo

Studieplatform voor de bachelor Geneeskunde aan de Universiteit Leiden. Next.js (App Router), TypeScript, Tailwind CSS,
shadcn/ui, Motion, Supabase (Postgres, Auth, Storage) en Zod.

## Status

| Onderdeel | Status |
| --- | --- |
| Design system, navigatie, homepage, vakkenoverzicht (zoeken + jaarfilter), over ons, FAQ, privacy | klaar |
| Vakdashboard `/vakken/[slug]` met de vier onderdelen | klaar |
| Samenvattingslezer (inhoudsopgave, zoeken, leesvoortgang, veilige gestructureerde inhoud, signed URLs) | klaar |
| Leerdoelen afvinken met voortgang | klaar |
| Overzicht oude tentamens (alleen met rechten, met bron) | klaar |
| Oefenomgeving: per onderwerp, gemengd, tentamenmodus met timer, fout beantwoorde vragen, markeren | klaar |
| Auth: registreren, inloggen, e-mailbevestiging, wachtwoord herstellen, uitloggen, beschermde routes | klaar |
| Studentendashboard (recent, voortgang, sessies, opgeslagen vragen, abonnement, profiel) | klaar |
| Beheer `/admin`: overzicht en vakbeheer (beschrijving, EC, publicatiestatus) | eerste versie |
| Beheer van onderwerpen, samenvattingen, leerdoelen en vragen via de UI | volgende fase |
| Stripe Checkout, webhooks, Customer Portal | volgende fase (schema `subscriptions`, `entitlements`, `products` staat klaar) |
| Account verwijderen vanuit het dashboard | volgende fase (vereist een server-side service-role functie) |

Er staat **geen medische inhoud** in de code of de seed. Onderwerpen, samenvattingen, leerdoelen en vragen worden via de
database toegevoegd en kunnen pas gepubliceerd worden na een vastgelegde review (`reviewed_at`). Tentamens en vragen
kunnen alleen gepubliceerd worden met geregelde rechten (`licensed`, `own_work` of `public_domain`); de database dwingt dat af.

## Architectuur

- **Catalogus**: `universities → programs → curriculum_versions → courses → topics → learning_objectives / summaries / questions`.
  Vakken hebben stabiele UUID's; de slug is per curriculumversie uniek.
- **Zonder Supabase** draait de publieke site op de ingebouwde catalogus (`src/lib/data/catalog-fallback.ts`, gelijk aan
  `supabase/seed.sql`, bewaakt door `tests/catalog.test.ts`). Accounts en leerinhoud tonen dan een eerlijke lege staat.
- **Antwoorden** staan in `question_answer_keys`, een tabel zonder leesrecht voor studenten. Antwoorden worden gecontroleerd
  door `submit_answer()` (security definer): één antwoord per vraag per sessie, herhaalde inzendingen geven het eerste antwoord
  terug, en in tentamenmodus blijft feedback verborgen tot `finish_practice_session()`.
- **Toegang** tot premium-inhoud loopt via `has_course_access()` (entitlement per vak of per opleiding) in RLS-policies,
  inclusief Storage. Bestanden staan in een privébucket en worden via kortlevende signed URLs geserveerd.
- **Rollen**: `profiles.role` (`student`/`admin`). Studenten kunnen hun rol niet wijzigen (kolomrechten); admin-routes
  controleren de rol server-side en RLS controleert alles nogmaals.
- **Inhoud** is gestructureerde JSON (Zod-schema in `src/lib/content/blocks.ts`), nooit HTML.

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul Supabase-gegevens in, of laat leeg voor alleen de publieke site
npm run dev
```

`/dev/oefenen` toont het oefenscherm met opvultekst en een nep-API, voor ontwikkeling en visuele controle.
In productie geeft die route een 404.

## Supabase opzetten

1. Maak een project aan en zet `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Voer de migraties uit (`supabase db push` met de Supabase CLI, of de bestanden in `supabase/migrations/` op volgorde in de SQL-editor).
3. Voer `supabase/seed.sql` uit voor de vakkenlijst.
4. Auth → URL Configuration: zet de Site URL en voeg `<site>/auth/confirm` toe als redirect-URL. Pas de e-mailtemplates
   aan zodat ze naar `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (bevestiging) en
   `...&type=recovery&volgende=/account/nieuw-wachtwoord` (herstel) linken.
5. Maak een beheerder: `update public.profiles set role = 'admin' where id = '<user uuid>';`

## Tests

```bash
npm test             # engine, catalogus/seed, redirect-veiligheid
npm run typecheck
npm run lint
PGHOST=localhost PGPORT=5432 PGUSER=postgres scripts/test-db.sh   # migraties + RLS/oefenengine op een lege scratch-Postgres
```

`scripts/test-db.sh` installeert een minimale Supabase-stub (rollen, `auth.users`, `auth.uid()`) en controleert onder meer
dat studenten geen antwoorden kunnen lezen, hun rol niet kunnen wijzigen, geen data van anderen zien, dubbele inzendingen
geen resultaten veranderen en tentamenmodus geen feedback lekt. Nooit tegen een echt Supabase-project draaien.

## Beeld

Foto's van Unsplash (Unsplash-licentie); naamsvermelding staat in de footer (`src/lib/site.ts`).
