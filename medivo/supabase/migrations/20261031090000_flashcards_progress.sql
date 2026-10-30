-- Flashcards per topic, studied Quizlet-style ("weet ik" / "nog niet") with a simple Leitner schedule, and one
-- read-only overview of a student's own progress in a course for the course page.
--
-- Leitner boxes: 0 = again (last answer "nog niet"), 1–5 = known, each box waits longer before the card is due again.
-- A card only moves up when it is due (or never known yet), so clicking "weet ik" ten times in one sitting does
-- not make a card "mastered": that takes recall on separate days. Mastered = box 2 or higher.

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete restrict,
  -- Both sides use the summary markup (bold, terms, formulas).
  front text not null check (length(front) between 1 and 500),
  back text not null check (length(back) between 1 and 4000),
  sort_order integer not null default 0,
  source text not null,
  copyright_status public.rights_status not null default 'unknown',
  is_premium boolean not null default true,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flashcards_publishable check (
    status <> 'published'
    or (reviewed_at is not null and copyright_status in ('licensed', 'own_work', 'public_domain'))
  )
);
create index flashcards_topic on public.flashcards (topic_id, sort_order) where status = 'published';
create index flashcards_course on public.flashcards (course_id);
create trigger flashcards_touch before update on public.flashcards for each row execute function public.touch_updated_at();

alter table public.flashcards enable row level security;
create policy "flashcards readable with access" on public.flashcards for select using (
  public.is_admin() or (
    status = 'published' and auth.uid() is not null
    and (not is_premium or public.has_course_access(course_id))
  )
);
create policy "admins manage" on public.flashcards for all using (public.is_admin()) with check (public.is_admin());

create table public.flashcard_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  flashcard_id uuid not null references public.flashcards (id) on delete cascade,
  box smallint not null default 0 check (box between 0 and 5),
  reviews integer not null default 0,
  lapses integer not null default 0,
  last_known boolean not null,
  last_reviewed_at timestamptz not null default now(),
  due_at timestamptz not null default now(),
  primary key (user_id, flashcard_id)
);
create index flashcard_progress_due on public.flashcard_progress (user_id, due_at);

alter table public.flashcard_progress enable row level security;
-- Students read their own rows; every write goes through review_flashcard().
create policy "own flashcard progress readable" on public.flashcard_progress for select using (user_id = auth.uid());

create or replace function public.review_flashcard(p_flashcard_id uuid, p_known boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_card public.flashcards;
  v_row public.flashcard_progress;
  v_box smallint;
  v_promoted boolean;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_card from public.flashcards where id = p_flashcard_id and status = 'published';
  if not found or (v_card.is_premium and not public.has_course_access(v_card.course_id)) then
    raise exception 'flashcard_not_found' using errcode = 'P0002';
  end if;

  select * into v_row from public.flashcard_progress where user_id = v_user and flashcard_id = p_flashcard_id for update;
  if not found then
    v_row := row(v_user, p_flashcard_id, 0, 0, 0, false, now(), now())::public.flashcard_progress;
  end if;

  -- Known again before it was due: no promotion, the schedule stays as it was.
  v_promoted := p_known and (v_row.box = 0 or v_row.due_at <= now());
  v_box := case when not p_known then 0 when v_promoted then least(v_row.box + 1, 5) else v_row.box end;

  insert into public.flashcard_progress as p (user_id, flashcard_id, box, reviews, lapses, last_known, last_reviewed_at, due_at)
  values (
    v_user, p_flashcard_id, v_box, v_row.reviews + 1, v_row.lapses + (case when p_known then 0 else 1 end), p_known, now(),
    case when not p_known then now()
         when v_promoted then now() + (array[interval '1 day', interval '3 days', interval '7 days', interval '14 days', interval '30 days'])[v_box]
         else v_row.due_at
    end
  )
  on conflict (user_id, flashcard_id) do update
    set box = excluded.box, reviews = excluded.reviews, lapses = excluded.lapses, last_known = excluded.last_known,
        last_reviewed_at = excluded.last_reviewed_at, due_at = excluded.due_at
  returning * into v_row;

  return jsonb_build_object('box', v_row.box, 'due_at', v_row.due_at, 'last_known', v_row.last_known, 'reviews', v_row.reviews);
end $$;
revoke execute on function public.review_flashcard(uuid, boolean) from public, anon;
grant execute on function public.review_flashcard(uuid, boolean) to authenticated;

-- Flashcards per topic for the course page, without revealing the cards.
create or replace function public.course_content_overview(p_course_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'summaries', (select count(*) from public.summaries s join public.topics t on t.id = s.topic_id
                  where t.course_id = p_course_id and s.status = 'published' and t.status = 'published'),
    'objectives', (select count(*) from public.learning_objectives o join public.topics t on t.id = o.topic_id
                   where t.course_id = p_course_id and o.status = 'published' and t.status = 'published'),
    'exams', (select count(*) from public.exams e where e.course_id = p_course_id and e.status = 'published'),
    'questions', (select count(*) from public.questions q where q.course_id = p_course_id and q.status = 'published'),
    'flashcards', (select count(*) from public.flashcards f where f.course_id = p_course_id and f.status = 'published'),
    'has_access', public.has_course_access(p_course_id)
  )
  where exists (select 1 from public.courses where id = p_course_id and status = 'published');
$$;

-- The viewer's own progress in a course: content covered per topic, practice results and recent exam simulations.
-- Coverage (what has been studied) and performance (how well) are reported separately.
create or replace function public.my_course_progress(p_course_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  with
  topics as (
    select t.id, t.title, t.slug, t.sort_order from public.topics t
    where t.course_id = p_course_id and t.status = 'published'
  ),
  latest as (
    select distinct on (a.question_id) a.question_id, a.is_correct, a.used_hint
    from public.question_attempts a
    join public.questions q on q.id = a.question_id and q.course_id = p_course_id
    where a.user_id = auth.uid() and a.final
    order by a.question_id, a.answered_at desc
  ),
  per_topic as (
    select t.id, t.title, t.slug, t.sort_order,
      (select count(*) from public.questions q where q.topic_id = t.id and q.status = 'published') as questions_total,
      (select count(*) from latest l join public.questions q on q.id = l.question_id where q.topic_id = t.id) as questions_answered,
      (select count(*) from latest l join public.questions q on q.id = l.question_id
        where q.topic_id = t.id and l.is_correct and not l.used_hint) as questions_correct,
      (select count(*) from public.flashcards f where f.topic_id = t.id and f.status = 'published') as flashcards_total,
      (select count(*) from public.flashcard_progress p join public.flashcards f on f.id = p.flashcard_id
        where p.user_id = auth.uid() and f.topic_id = t.id and f.status = 'published' and p.box >= 2) as flashcards_mastered,
      (select count(*) from public.flashcard_progress p join public.flashcards f on f.id = p.flashcard_id
        where p.user_id = auth.uid() and f.topic_id = t.id and f.status = 'published' and p.box = 1) as flashcards_learning,
      (select count(*) from public.flashcard_progress p join public.flashcards f on f.id = p.flashcard_id
        where p.user_id = auth.uid() and f.topic_id = t.id and f.status = 'published' and p.box = 0) as flashcards_again,
      (select count(*) from public.flashcard_progress p join public.flashcards f on f.id = p.flashcard_id
        where p.user_id = auth.uid() and f.topic_id = t.id and f.status = 'published' and p.due_at <= now()) as flashcards_due,
      (select count(*) from public.learning_objectives o where o.topic_id = t.id and o.status = 'published') as objectives_total,
      (select count(*) from public.objective_completions c join public.learning_objectives o on o.id = c.objective_id
        where c.user_id = auth.uid() and o.topic_id = t.id and o.status = 'published') as objectives_done
    from topics t
  )
  select jsonb_build_object(
    'answers_given', (select count(*) from public.question_attempts a join public.questions q on q.id = a.question_id
                      where a.user_id = auth.uid() and a.final and q.course_id = p_course_id),
    'to_repeat', (select count(*) from latest where not is_correct or used_hint),
    'topics', coalesce((select jsonb_agg(to_jsonb(p) order by p.sort_order) from per_topic p), '[]'::jsonb),
    'exams', coalesce((
      select jsonb_agg(x order by x.finished_at desc) from (
        select s.id, s.finished_at, e.title as exam_title, cardinality(s.question_ids) as questions,
          (select coalesce(sum(q.points), 0) from public.questions q where q.id = any (s.question_ids)) as points,
          (select coalesce(sum(a.score), 0) from public.question_attempts a where a.session_id = s.id) as scored
        from public.practice_sessions s
        left join public.exams e on e.id = s.exam_id
        where s.user_id = auth.uid() and s.course_id = p_course_id and s.mode = 'exam' and s.finished_at is not null
        order by s.finished_at desc
        limit 10
      ) x
    ), '[]'::jsonb)
  )
  where auth.uid() is not null;
$$;
revoke execute on function public.my_course_progress(uuid) from public, anon;
grant execute on function public.my_course_progress(uuid) to authenticated;
