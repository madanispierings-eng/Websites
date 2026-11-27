-- Voortgang per hoofdonderwerp: een thema telt de vragen, flashcards en leerdoelen van zijn
-- subonderwerpen (de colleges) mee, en het voortgangsoverzicht toont alleen hoofdonderwerpen.
-- Voortgang wissen voor een thema wist ook die van zijn colleges.
-- Plus: welke onderwerpen een gepubliceerde samenvatting hebben (zonder de inhoud te tonen).

create or replace function public.my_course_progress(p_course_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  with
  topics as (
    select t.id, t.title, t.slug, t.sort_order from public.topics t
    where t.course_id = p_course_id and t.status = 'published' and t.parent_id is null
  ),
  -- A main topic counts everything in its subtopics too (e.g. a theme and its lectures).
  member as (
    select t.id as topic_id, s.id as member_id from topics t
    join public.topics s on s.id = t.id or (s.parent_id = t.id and s.status = 'published')
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
      (select count(*) from public.questions q where q.topic_id in (select member_id from member m where m.topic_id = t.id) and q.status = 'published' and q.exam_id is null) as questions_total,
      (select count(*) from latest l join public.questions q on q.id = l.question_id where q.topic_id in (select member_id from member m where m.topic_id = t.id)) as questions_answered,
      (select count(*) from latest l join public.questions q on q.id = l.question_id
        where q.topic_id in (select member_id from member m where m.topic_id = t.id) and l.is_correct and not l.used_hint) as questions_correct,
      (select count(*) from public.flashcards f where f.topic_id in (select member_id from member m where m.topic_id = t.id) and f.status = 'published') as flashcards_total,
      (select count(*) from public.flashcard_progress p join public.flashcards f on f.id = p.flashcard_id
        where p.user_id = auth.uid() and f.topic_id in (select member_id from member m where m.topic_id = t.id) and f.status = 'published' and p.box >= 2) as flashcards_mastered,
      (select count(*) from public.flashcard_progress p join public.flashcards f on f.id = p.flashcard_id
        where p.user_id = auth.uid() and f.topic_id in (select member_id from member m where m.topic_id = t.id) and f.status = 'published' and p.box = 1) as flashcards_learning,
      (select count(*) from public.flashcard_progress p join public.flashcards f on f.id = p.flashcard_id
        where p.user_id = auth.uid() and f.topic_id in (select member_id from member m where m.topic_id = t.id) and f.status = 'published' and p.box = 0) as flashcards_again,
      (select count(*) from public.flashcard_progress p join public.flashcards f on f.id = p.flashcard_id
        where p.user_id = auth.uid() and f.topic_id in (select member_id from member m where m.topic_id = t.id) and f.status = 'published' and p.due_at <= now()) as flashcards_due,
      (select count(*) from public.learning_objectives o where o.topic_id in (select member_id from member m where m.topic_id = t.id) and o.status = 'published') as objectives_total,
      (select count(*) from public.objective_completions c join public.learning_objectives o on o.id = c.objective_id
        where c.user_id = auth.uid() and o.topic_id in (select member_id from member m where m.topic_id = t.id) and o.status = 'published') as objectives_done
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

create or replace function public.reset_topic_progress(p_topic_id uuid)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_deleted bigint;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  delete from public.question_attempts a
  using public.questions q, public.practice_sessions s
  where a.user_id = v_user
    and a.question_id = q.id
    and a.session_id = s.id
    and s.user_id = v_user
    and (q.topic_id = p_topic_id or q.topic_id in (select t.id from public.topics t where t.parent_id = p_topic_id))
    and q.exam_id is null
    and s.mode <> 'exam';

  get diagnostics v_deleted = row_count;
  return v_deleted;
end $$;

create or replace function public.topics_with_summary(p_course_id uuid)
returns setof uuid
language sql stable security definer set search_path = public as $$
  select distinct s.topic_id
  from public.summaries s
  join public.topics t on t.id = s.topic_id and t.course_id = p_course_id
  join public.courses c on c.id = t.course_id and c.status = 'published'
  where s.status = 'published';
$$;
revoke execute on function public.topics_with_summary(uuid) from public;
grant execute on function public.topics_with_summary(uuid) to anon, authenticated;
