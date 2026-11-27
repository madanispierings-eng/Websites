-- Tentamenvragen per ziektebeeld in de stijl van het proeftentamen: korte casus, losse vraag,
-- vier opties, één juist antwoord. Niveau 2 krijgt één diagnosevraag, niveau 1 er twee.
alter table public.disorders add column cases jsonb not null default '[]'::jsonb;
alter table public.disorders add constraint disorders_cases_array check (jsonb_typeof(cases) = 'array');
