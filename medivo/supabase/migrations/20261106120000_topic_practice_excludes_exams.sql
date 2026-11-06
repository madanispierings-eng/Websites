-- Exam questions (exam_id not null) belong only to a specific old exam, chosen on the Tentamens page.
-- They must not surface under "oefenen per onderwerp" (topic/mixed/incorrect practice, or the exam
-- simulation that draws from the topic pool), nor count toward a topic's question totals or progress.
-- Only a session started for a specific exam (p_exam_id) uses them.

-- ---------------------------------------------------------------------------
-- Practice session selection: topic pool excludes exam questions.
-- ---------------------------------------------------------------------------
create or replace function public.start_practice_session(
  p_course_id uuid,
  p_mode public.practice_mode,
  p_topic_ids uuid[] default '{}',
  p_limit integer default 20,
  p_time_limit_seconds integer default null,
  p_exam_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_ids uuid[];
  v_session uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 200 then
    raise exception 'invalid_limit' using errcode = '22023';
  end if;
  if p_exam_id is null and p_mode = 'topic' and coalesce(array_length(p_topic_ids, 1), 0) < 1 then
    raise exception 'topic_mode_needs_one_topic' using errcode = '22023';
  end if;

  if p_exam_id is not null then
    -- A whole exam, in its original order.
    select array_agg(id order by exam_position, created_at) into v_ids from (
      select q.id, q.exam_position, q.created_at
      from public.questions q
      join public.exams e on e.id = q.exam_id and e.status = 'published'
      where q.exam_id = p_exam_id
        and q.course_id = p_course_id
        and q.status = 'published'
        and (not q.is_premium or public.has_course_access(p_course_id))
      order by q.exam_position, q.created_at
      limit p_limit
    ) picked;
  else
    select array_agg(id) into v_ids from (
      select q.id
      from public.questions q
      join public.topics t on t.id = q.topic_id
      where q.course_id = p_course_id
        and q.status = 'published'
        and q.exam_id is null  -- practice-per-topic never pulls questions that belong to an old exam
        and (not q.is_premium or public.has_course_access(p_course_id))
        -- A subtopic counts as part of its parent topic.
        and (coalesce(array_length(p_topic_ids, 1), 0) = 0 or q.topic_id = any (p_topic_ids) or t.parent_id = any (p_topic_ids))
        and (
          p_mode <> 'incorrect' or exists (
            select 1 from (
              select distinct on (a.question_id) a.question_id, a.is_correct, a.used_hint
              from public.question_attempts a
              where a.user_id = v_user and a.question_id = q.id and a.final
              order by a.question_id, a.answered_at desc
            ) latest where not latest.is_correct or latest.used_hint
          )
        )
      order by case when p_mode = 'topic' then t.sort_order else 0 end,
               case when p_mode = 'topic' then q.created_at end,
               random()
      limit p_limit
    ) picked;
  end if;

  if v_ids is null then
    raise exception 'no_questions_available' using errcode = 'P0002';
  end if;

  insert into public.practice_sessions (user_id, course_id, mode, topic_ids, question_ids, time_limit_seconds, exam_id)
  values (v_user, p_course_id, p_mode, coalesce(p_topic_ids, '{}'), v_ids,
          case when p_mode = 'exam' then p_time_limit_seconds end, p_exam_id)
  returning id into v_session;

  return v_session;
end $$;

revoke execute on function public.start_practice_session(uuid, public.practice_mode, uuid[], integer, integer, uuid) from public, anon;
grant execute on function public.start_practice_session(uuid, public.practice_mode, uuid[], integer, integer, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Sidebar counts: questions per topic, exam questions excluded.
-- ---------------------------------------------------------------------------
create or replace function public.topic_question_counts(p_course_id uuid)
returns table (topic_id uuid, question_count bigint)
language sql stable security definer set search_path = public as $$
  select q.topic_id, count(*)
  from public.questions q
  join public.courses c on c.id = q.course_id and c.status = 'published'
  where q.course_id = p_course_id and q.status = 'published' and q.exam_id is null
  group by q.topic_id;
$$;

-- ---------------------------------------------------------------------------
-- Per-topic answered/correct stats, exam attempts excluded.
-- ---------------------------------------------------------------------------
create or replace function public.my_topic_stats(p_course_id uuid)
returns table (topic_id uuid, answered bigint, correct bigint)
language sql stable security definer set search_path = public as $$
  select q.topic_id, count(*), count(*) filter (where latest.is_correct and not latest.used_hint)
  from (
    select distinct on (a.question_id) a.question_id, a.is_correct, a.used_hint
    from public.question_attempts a
    where a.user_id = auth.uid() and a.final
    order by a.question_id, a.answered_at desc
  ) latest
  join public.questions q on q.id = latest.question_id
  where q.course_id = p_course_id and q.exam_id is null
  group by q.topic_id;
$$;

-- ---------------------------------------------------------------------------
-- Course progress: per-topic question totals and the "latest" set exclude exam questions,
-- so a topic's "x van y" reflects only its practice questions. Finished exam sessions keep
-- their own "exams" section.
-- ---------------------------------------------------------------------------
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
    join public.questions q on q.id = a.question_id and q.course_id = p_course_id and q.exam_id is null
    where a.user_id = auth.uid() and a.final
    order by a.question_id, a.answered_at desc
  ),
  per_topic as (
    select t.id, t.title, t.slug, t.sort_order,
      (select count(*) from public.questions q where q.topic_id = t.id and q.status = 'published' and q.exam_id is null) as questions_total,
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
                      where a.user_id = auth.uid() and a.final and q.course_id = p_course_id and q.exam_id is null),
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
