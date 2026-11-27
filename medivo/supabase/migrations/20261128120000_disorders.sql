-- Ziektebeeldenlijst van een vak: per ziektebeeld het niveau waarop de student het moet kennen
-- (1 = volledig: epidemiologie t/m prognose; 2 = herkennen voor de differentiaaldiagnose), een
-- samenvatting, kernpunten en een uitleg in de summary-markup. Een ziektebeeld kan bij meerdere
-- thema's horen (disorder_topics). Getoond als uitklapbaar overzicht per thema en als flashcards.
create table public.disorders (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug text not null,
  name text not null,
  -- Null: staat in de themalijst maar niet in de niveaulijst van het vak.
  level smallint check (level in (1, 2)),
  summary text not null,
  key_points text[] not null default '{}',
  explanation text not null,
  sort_order integer not null default 0,
  is_premium boolean not null default true,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  constraint disorders_publishable check (status <> 'published' or reviewed_at is not null)
);
create index disorders_course on public.disorders (course_id, sort_order);

create table public.disorder_topics (
  disorder_id uuid not null references public.disorders (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (disorder_id, topic_id)
);
create index disorder_topics_topic on public.disorder_topics (topic_id, sort_order);

alter table public.disorders enable row level security;
alter table public.disorder_topics enable row level security;

create policy "disorders readable with access" on public.disorders for select using (
  public.is_admin() or (
    status = 'published' and auth.uid() is not null
    and (not is_premium or public.has_course_access(course_id))
  )
);
create policy "admins manage disorders" on public.disorders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "disorder topics readable with their disorder" on public.disorder_topics for select using (
  exists (select 1 from public.disorders d where d.id = disorder_id)
);
create policy "admins manage disorder topics" on public.disorder_topics for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Het tabblad Ziektebeelden verschijnt alleen bij een vak met gepubliceerde ziektebeelden.
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
    'disorders', (select count(*) from public.disorders d where d.course_id = p_course_id and d.status = 'published'),
    'has_access', public.has_course_access(p_course_id)
  )
  where exists (select 1 from public.courses where id = p_course_id and status = 'published');
$$;
