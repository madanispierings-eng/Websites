-- Opbouw van een (oefen)tentamen volgens de toetsmatrijs, voor het instructiescherm:
-- [{"label": "Deel A – 36 meerkeuzevragen (1 punt per vraag)", "points": 36}, ...]. Leeg = onbekend.
alter table public.exams add column structure jsonb not null default '[]'::jsonb;
alter table public.exams add constraint exams_structure_is_array check (jsonb_typeof(structure) = 'array');
