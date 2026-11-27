-- Casussen bij ziektebeelden: per ziektebeeld een casus op tentamenniveau, de uitleg waarom het dit
-- ziektebeeld is, en de afleiders (slugs van andere ziektebeelden van hetzelfde vak) waaruit de
-- student moet kiezen. Getoond in de modus "Casussen oefenen" op de ziektebeeldenpagina.
alter table public.disorders
  add column case_vignette text,
  add column case_explanation text,
  add column case_distractors text[] not null default '{}';

alter table public.disorders add constraint disorders_case_complete
  check ((case_vignette is null) = (case_explanation is null));
