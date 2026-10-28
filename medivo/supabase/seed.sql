-- Initial catalogue: bachelor Geneeskunde, Universiteit Leiden.
-- Course titles and EC values as supplied by the Medivo team. EC values that have not been verified are NULL;
-- do not fill them in without checking the official study guide.
-- Keep in sync with src/lib/data/catalog-fallback.ts (checked by tests/catalog.test.ts).

insert into public.universities (id, slug, name, short_name)
values ('00000000-0000-4000-8000-000000000001', 'universiteit-leiden', 'Universiteit Leiden', 'Leiden')
on conflict (id) do nothing;

insert into public.programs (id, university_id, slug, name, degree_level)
values ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001',
        'bachelor-geneeskunde', 'Bachelor Geneeskunde', 'bachelor')
on conflict (id) do nothing;

insert into public.curriculum_versions (id, program_id, label, is_current)
values ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000011', 'Huidig curriculum', true)
on conflict (id) do nothing;

insert into public.courses (curriculum_version_id, slug, title, study_year, ec, sort_order, status) values
  ('00000000-0000-4000-8000-000000000021', 'van-cel-tot-molecuul', 'Van Cel tot Molecuul', 1, 6, 1, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'van-mens-tot-cel', 'Van Mens tot Cel', 1, 7, 2, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'van-basis-tot-homeostase', 'Van Basis tot Homeostase', 1, 8, 3, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'sturing-en-stofwisseling', 'Sturing en Stofwisseling', 1, 7, 4, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'hersenen-en-aansturing', 'Hersenen en Aansturing', 1, 7, 5, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'mechanisms-of-disease-1', 'Mechanisms of Disease 1', 2, 7, 1, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'mechanisms-of-disease-2', 'Mechanisms of Disease 2', 2, 7, 2, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'vraagstukken-buik', 'Vraagstukken Buik', 2, 8, 3, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'vraagstukken-bewegen', 'Vraagstukken Bewegen', 2, 9, 4, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'vraagstukken-borst-en-nier', 'Vraagstukken Borst en Nier', 2, 9, 5, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'pharmacology', 'Pharmacology', 2, null, 6, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'vraagstukken-voortplanting-en-vroege-levensfasen', 'Vraagstukken Voortplanting en Vroege Levensfasen', 3, null, 1, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'vraagstukken-psychische-gezondheid-en-hormonen', 'Vraagstukken Psychische Gezondheid en Hormonen', 3, null, 2, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'vraagstukken-latere-levensfasen', 'Vraagstukken Latere Levensfasen', 3, null, 3, 'published'),
  ('00000000-0000-4000-8000-000000000021', 'vraagstukken-spoedeisende-zorg', 'Vraagstukken Spoedeisende Zorg', 3, null, 4, 'published')
on conflict (curriculum_version_id, slug) do nothing;
