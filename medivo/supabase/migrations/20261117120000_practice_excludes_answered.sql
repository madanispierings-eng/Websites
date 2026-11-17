-- Oefenen per onderwerp/gemengd kan vragen weglaten die de student al heeft beantwoord,
-- zodat je elke vraag één keer krijgt. De server zet dit aan (p_skip_answered = true);
-- herhalen gebeurt bewust (p_skip_answered = false) of via de "Fout beantwoord"-modus.
-- Default is false: oud gedrag, zodat bestaande aanroepen ongewijzigd blijven.
-- Exam- en incorrect-modus worden nooit gefilterd.
--
-- De functie krijgt er een parameter bij; daarom eerst de oude signatuur droppen.
drop function if exists public.start_practice_session(uuid, practice_mode, uuid[], integer, integer, uuid);

create or replace function public.start_practice_session(
  p_course_id uuid,
  p_mode practice_mode,
  p_topic_ids uuid[] default '{}'::uuid[],
  p_limit integer default 20,
  p_time_limit_seconds integer default null,
  p_exam_id uuid default null,
  p_skip_answered boolean default false
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
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
        -- Per onderwerp / gemengd: sla vragen over die de student al heeft beantwoord,
        -- tenzij hij er bewust voor kiest ze te herhalen.
        and (
          not p_skip_answered or p_mode not in ('topic', 'mixed') or not exists (
            select 1 from public.question_attempts a
            where a.user_id = v_user and a.question_id = q.id and a.final
          )
        )
      order by case when p_mode = 'topic' then t.sort_order else 0 end,
               case when p_mode = 'topic' then q.created_at end,
               random()
      limit p_limit
    ) picked;
  end if;

  if v_ids is null then
    -- Onderscheid "je hebt alles al gemaakt" van "er zijn geen vragen", zodat de UI
    -- een bewuste herhaal-keuze kan tonen in plaats van een kale foutmelding.
    if p_skip_answered and p_mode in ('topic', 'mixed') and exists (
      select 1
      from public.questions q
      join public.topics t on t.id = q.topic_id
      where q.course_id = p_course_id
        and q.status = 'published'
        and q.exam_id is null
        and (not q.is_premium or public.has_course_access(p_course_id))
        and (coalesce(array_length(p_topic_ids, 1), 0) = 0 or q.topic_id = any (p_topic_ids) or t.parent_id = any (p_topic_ids))
    ) then
      raise exception 'all_answered' using errcode = 'P0003';
    end if;
    raise exception 'no_questions_available' using errcode = 'P0002';
  end if;

  insert into public.practice_sessions (user_id, course_id, mode, topic_ids, question_ids, time_limit_seconds, exam_id)
  values (v_user, p_course_id, p_mode, coalesce(p_topic_ids, '{}'), v_ids,
          case when p_mode = 'exam' then p_time_limit_seconds end, p_exam_id)
  returning id into v_session;

  return v_session;
end $function$;

-- Rechten herstellen voor de nieuwe signatuur (DROP/CREATE verliest de grants van het origineel).
revoke execute on function public.start_practice_session(uuid, public.practice_mode, uuid[], integer, integer, uuid, boolean) from public, anon;
grant execute on function public.start_practice_session(uuid, public.practice_mode, uuid[], integer, integer, uuid, boolean) to authenticated;
