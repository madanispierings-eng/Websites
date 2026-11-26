-- Anatomie opgedeeld in practica (zoals op Brightspace: PR Macroscopische Anatomie 1-6, PR Bekkenplastinaten).
-- Per practicum: een korte intro, "wat moet je weten" (leerdoelen) en een checklist van te kennen structuren,
-- gegroepeerd per categorie. Een structuur kan in meerdere practica voorkomen. Platen horen bij één practicum.
create table public.anatomy_units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug text not null,
  title text not null,
  -- Korte omschrijving op de kaart, bijv. "Maag, oesophagus en diafragma".
  subtitle text,
  sort_order integer not null default 0,
  -- "Wat moet je weten?" in de summary-markup (opsommingen, vet).
  must_know text,
  is_premium boolean not null default true,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  constraint anatomy_units_publishable check (status <> 'published' or reviewed_at is not null)
);

create table public.anatomy_unit_structures (
  unit_id uuid not null references public.anatomy_units (id) on delete cascade,
  structure_id uuid not null references public.anatomy_structures (id) on delete cascade,
  -- Groep in de checklist, bijv. "Spieren", "Bloedvaten", "Zenuwen".
  category text not null default 'Structuren',
  sort_order integer not null default 0,
  primary key (unit_id, structure_id)
);
create index anatomy_unit_structures_structure on public.anatomy_unit_structures (structure_id);

alter table public.anatomy_images add column unit_id uuid references public.anatomy_units (id) on delete cascade;
create index anatomy_images_unit on public.anatomy_images (unit_id, sort_order);

alter table public.anatomy_units enable row level security;
alter table public.anatomy_unit_structures enable row level security;

-- De indeling (titels) is zichtbaar voor iedereen die het vak ziet; de inhoud valt onder de toegangsregels.
create policy "anatomy units readable" on public.anatomy_units for select using (
  public.is_admin() or status = 'published'
);
create policy "admins manage anatomy units" on public.anatomy_units for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "anatomy unit structures readable with their structure" on public.anatomy_unit_structures for select using (
  exists (select 1 from public.anatomy_structures s where s.id = structure_id)
);
create policy "admins manage anatomy unit structures" on public.anatomy_unit_structures for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Het tabblad Anatomie verschijnt zodra er gepubliceerde practica zijn, ook als de inhoud nog wordt voorbereid.
create or replace function public.course_content_overview(p_course_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'summaries', (select count(*) from public.summaries s join public.topics t on t.id = s.topic_id
                  where t.course_id = p_course_id and s.status = 'published' and t.status = 'published'),
    'objectives', (select count(*) from public.learning_objectives o join public.topics t on t.id = o.topic_id
                   where t.course_id = p_course_id and o.status = 'published' and t.status = 'published'),
    'exams', (select count(*) from public.exams e where e.course_id = p_course_id and e.status = 'published'),
    'questions', (select count(*) from public.questions q
                  where q.course_id = p_course_id and q.status = 'published' and q.exam_id is null),
    'flashcards', (select count(*) from public.flashcards f where f.course_id = p_course_id and f.status = 'published'),
    'core_medications', (select count(*) from public.core_medications m where m.course_id = p_course_id and m.status = 'published'),
    'anatomy', (select count(distinct s.id) from public.anatomy_structures s
                join public.anatomy_markers mk on mk.structure_id = s.id
                join public.anatomy_images i on i.id = mk.image_id and i.status = 'published'
                where s.course_id = p_course_id and s.status = 'published'),
    'anatomy_units', (select count(*) from public.anatomy_units u where u.course_id = p_course_id and u.status = 'published'),
    'has_access', public.has_course_access(p_course_id)
  )
  where exists (select 1 from public.courses where id = p_course_id and status = 'published');
$$;
