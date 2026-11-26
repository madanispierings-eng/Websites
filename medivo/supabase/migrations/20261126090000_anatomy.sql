-- Anatomie-oefenmodus (Wooflash-achtig): studenten benoemen en wijzen structuren aan op anatomische
-- platen, geven aan hoe zeker ze zijn, en krijgen wat ze nog niet goed kennen vaker terug.
--
-- anatomy_structures  de structuren die je moet kennen (uit de structurenlijst van het vak), met synoniemen,
--                     niveau (toepassen/basis), regio en een korte uitleg die na een fout antwoord verschijnt.
-- anatomy_images      de platen (afbeelding in private storage onder <course_id>/anatomie/...).
-- anatomy_markers     genummerde punten op een plaat; zonder structure_id is het een afgedekt label dat
--                     niet getoetst wordt (het punt blijft zichtbaar zodat het verwijslijntje niet loos eindigt).
-- anatomy_progress    per student per structuur: Leitner-bak, laatste uitkomst en zekerheid, volgende herhaling.
create table public.anatomy_structures (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug text not null,
  name text not null,
  -- Andere goedgerekende namen (synoniemen, eponiemen, Nederlandse naam).
  synonyms text[] not null default '{}',
  dutch_name text,
  level text not null check (level in ('toepassen', 'basis')),
  region text not null,
  region_sort integer not null default 0,
  -- Eén regel: wat is het (getoond als je deze structuur ten onrechte koos).
  summary text not null,
  -- Korte uitleg na een fout antwoord: ligging, verloop, relaties.
  explanation text not null,
  clinical text,
  is_premium boolean not null default true,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  constraint anatomy_structures_publishable check (status <> 'published' or reviewed_at is not null)
);

create table public.anatomy_images (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug text not null,
  title text not null,
  region text not null,
  sort_order integer not null default 0,
  image_path text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  credit text not null,
  is_premium boolean not null default true,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  constraint anatomy_images_publishable check (status <> 'published' or reviewed_at is not null)
);

create table public.anatomy_markers (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references public.anatomy_images (id) on delete cascade,
  structure_id uuid references public.anatomy_structures (id) on delete cascade,
  -- Positie als fractie van breedte en hoogte, zodat de plaat op elk formaat klopt.
  x numeric(5, 4) not null check (x between 0 and 1),
  y numeric(5, 4) not null check (y between 0 and 1),
  sort_order integer not null default 0
);
create index anatomy_markers_image on public.anatomy_markers (image_id, sort_order);
create index anatomy_markers_structure on public.anatomy_markers (structure_id);

create table public.anatomy_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  structure_id uuid not null references public.anatomy_structures (id) on delete cascade,
  box smallint not null default 0 check (box between 0 and 5),
  reviews integer not null default 0,
  lapses integer not null default 0,
  last_correct boolean not null,
  last_confidence text not null check (last_confidence in ('zeker', 'twijfel', 'gok')),
  last_reviewed_at timestamptz not null default now(),
  due_at timestamptz not null default now(),
  primary key (user_id, structure_id)
);
create index anatomy_progress_due on public.anatomy_progress (user_id, due_at);

alter table public.anatomy_structures enable row level security;
alter table public.anatomy_images enable row level security;
alter table public.anatomy_markers enable row level security;
alter table public.anatomy_progress enable row level security;

-- Zelfde regels als de rest van een vak: gepubliceerd + toegang tot het vak; admins zien alles.
create policy "anatomy structures readable with access" on public.anatomy_structures for select using (
  public.is_admin() or (status = 'published' and auth.uid() is not null and (not is_premium or public.has_course_access(course_id)))
);
create policy "admins manage anatomy structures" on public.anatomy_structures for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "anatomy images readable with access" on public.anatomy_images for select using (
  public.is_admin() or (status = 'published' and auth.uid() is not null and (not is_premium or public.has_course_access(course_id)))
);
create policy "admins manage anatomy images" on public.anatomy_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "anatomy markers readable with their image" on public.anatomy_markers for select using (
  exists (select 1 from public.anatomy_images i where i.id = image_id)
);
create policy "admins manage anatomy markers" on public.anatomy_markers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Studenten lezen hun eigen voortgang; schrijven gaat alleen via review_anatomy().
create policy "own anatomy progress readable" on public.anatomy_progress for select using (user_id = auth.uid());

-- Legt één antwoord vast. Goed en zeker: een bak hoger (herhaling na 1, 3, 7, 14, 30 dagen). Goed maar met
-- twijfel of gegokt: bak blijft, morgen terug. Fout: terug naar bak 0, meteen weer aan de beurt.
create or replace function public.review_anatomy(p_structure_id uuid, p_correct boolean, p_confidence text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_s public.anatomy_structures;
  v_row public.anatomy_progress;
  v_box smallint;
  v_due timestamptz;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_confidence not in ('zeker', 'twijfel', 'gok') then
    raise exception 'invalid_confidence' using errcode = '22023';
  end if;
  select * into v_s from public.anatomy_structures where id = p_structure_id and status = 'published';
  if not found or (v_s.is_premium and not public.has_course_access(v_s.course_id)) then
    raise exception 'structure_not_found' using errcode = 'P0002';
  end if;

  select * into v_row from public.anatomy_progress where user_id = v_user and structure_id = p_structure_id for update;
  if not found then
    v_row := row(v_user, p_structure_id, 0, 0, 0, false, 'gok', now(), now())::public.anatomy_progress;
  end if;

  if not p_correct then
    v_box := 0; v_due := now();
  elsif p_confidence = 'zeker' and (v_row.box = 0 or v_row.due_at <= now()) then
    v_box := least(v_row.box + 1, 5);
    v_due := now() + (array[interval '1 day', interval '3 days', interval '7 days', interval '14 days', interval '30 days'])[v_box];
  elsif p_confidence = 'zeker' then
    v_box := v_row.box; v_due := v_row.due_at;
  else
    v_box := v_row.box; v_due := now() + interval '1 day';
  end if;

  insert into public.anatomy_progress as p (user_id, structure_id, box, reviews, lapses, last_correct, last_confidence, last_reviewed_at, due_at)
  values (v_user, p_structure_id, v_box, v_row.reviews + 1, v_row.lapses + (case when p_correct then 0 else 1 end),
          p_correct, p_confidence, now(), v_due)
  on conflict (user_id, structure_id) do update
    set box = excluded.box, reviews = excluded.reviews, lapses = excluded.lapses, last_correct = excluded.last_correct,
        last_confidence = excluded.last_confidence, last_reviewed_at = excluded.last_reviewed_at, due_at = excluded.due_at
  returning * into v_row;

  return jsonb_build_object('box', v_row.box, 'due_at', v_row.due_at, 'reviews', v_row.reviews);
end $$;
revoke execute on function public.review_anatomy(uuid, boolean, text) from public, anon;
grant execute on function public.review_anatomy(uuid, boolean, text) to authenticated;

-- Neem anatomie mee in het vakoverzicht (aantal gepubliceerde structuren die op een plaat staan), zodat het
-- tabblad en de kaart alleen verschijnen bij een vak dat er inhoud voor heeft.
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
    'has_access', public.has_course_access(p_course_id)
  )
  where exists (select 1 from public.courses where id = p_course_id and status = 'published');
$$;
