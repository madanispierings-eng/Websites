-- Question types as they appear on real exams, and whole exams in their original order.
--   single_choice    one correct option (as before)
--   multiple_choice  "more answers possible": all correct options and nothing else
--   dropdowns        list-box, matching and fill-in questions: one choice per item, partial credit per item
--   numeric          very-short-answer calculations, correct within a range
--   open             written answers; the student marks them against the answer model
-- Public, answer-free configuration lives in questions.content; everything that reveals the answer stays in
-- question_answer_keys, which students cannot read.

alter type public.question_type add value if not exists 'multiple_choice';
alter type public.question_type add value if not exists 'dropdowns';
alter type public.question_type add value if not exists 'numeric';
alter type public.question_type add value if not exists 'open';

-- Reconstructed exams do not always have a known year.
alter table public.exams alter column exam_year drop not null;

alter table public.questions
  add column content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  add column context text,
  add column points numeric(5, 2) not null default 1 check (points > 0),
  add column exam_position integer;
create index questions_exam on public.questions (exam_id, exam_position);

alter table public.question_answer_keys
  alter column correct_option_id drop not null,
  add column answer jsonb not null default '{}'::jsonb check (jsonb_typeof(answer) = 'object');

alter table public.practice_sessions add column exam_id uuid references public.exams (id) on delete set null;

alter table public.question_attempts
  alter column selected_option_id drop not null,
  add column response jsonb not null default '{}'::jsonb,
  -- Null while an open answer still has to be marked by the student.
  add column score numeric(5, 2),
  add column max_score numeric(5, 2) not null default 1;
update public.question_attempts set score = case when is_correct then 1 else 0 end where score is null;

-- ---------------------------------------------------------------------------
-- Grading
-- ---------------------------------------------------------------------------

-- Checks that a response has the right shape for the question; raises invalid_answer otherwise.
create or replace function public.validate_response(p_question public.questions, p_response jsonb)
returns void
language plpgsql stable set search_path = public as $$
declare
  v_items jsonb := coalesce(p_question.content -> 'items', '[]'::jsonb);
  v_ids uuid[];
begin
  if p_response is null or jsonb_typeof(p_response) <> 'object' then
    raise exception 'invalid_answer' using errcode = '22023';
  end if;
  case p_question.type::text
    when 'single_choice' then
      if not exists (select 1 from public.question_options
                     where id = nullif(p_response ->> 'option_id', '')::uuid and question_id = p_question.id) then
        raise exception 'invalid_option' using errcode = '22023';
      end if;
    when 'multiple_choice' then
      if jsonb_typeof(p_response -> 'option_ids') <> 'array' or jsonb_array_length(p_response -> 'option_ids') = 0 then
        raise exception 'invalid_option' using errcode = '22023';
      end if;
      select array_agg(x::uuid) into v_ids from jsonb_array_elements_text(p_response -> 'option_ids') x;
      if exists (select 1 from unnest(v_ids) i
                 where not exists (select 1 from public.question_options o where o.id = i and o.question_id = p_question.id)) then
        raise exception 'invalid_option' using errcode = '22023';
      end if;
    when 'dropdowns' then
      if jsonb_typeof(p_response -> 'answers') <> 'array'
         or jsonb_array_length(p_response -> 'answers') <> jsonb_array_length(v_items) then
        raise exception 'invalid_answer' using errcode = '22023';
      end if;
      if exists (
        select 1 from jsonb_array_elements(p_response -> 'answers') with ordinality a(v, n)
        where jsonb_typeof(a.v) <> 'null'
          and not ((v_items -> (a.n::int - 1) -> 'choices') ? (a.v #>> '{}'))
      ) then
        raise exception 'invalid_answer' using errcode = '22023';
      end if;
    when 'numeric' then
      if jsonb_typeof(p_response -> 'value') <> 'string' or length(trim(p_response ->> 'value')) = 0
         or length(p_response ->> 'value') > 60 then
        raise exception 'invalid_answer' using errcode = '22023';
      end if;
    when 'open' then
      if jsonb_typeof(p_response -> 'text') <> 'string' or length(trim(p_response ->> 'text')) = 0
         or length(p_response ->> 'text') > 8000 then
        raise exception 'invalid_answer' using errcode = '22023';
      end if;
  end case;
end $$;

-- Score for a (validated) response. Null means the student marks it themselves (open questions).
create or replace function public.grade_response(p_question public.questions, p_key public.question_answer_keys, p_response jsonb)
returns numeric
language plpgsql stable set search_path = public as $$
declare
  v_items jsonb := coalesce(p_question.content -> 'items', '[]'::jsonb);
  v_n int;
  v_score numeric := 0;
  v_raw text;
  v_value numeric;
begin
  case p_question.type::text
    when 'single_choice' then
      return case when (p_response ->> 'option_id')::uuid = p_key.correct_option_id then p_question.points else 0 end;
    when 'multiple_choice' then
      -- Correct only when the chosen labels are exactly the key's labels.
      return case when (
        select coalesce(array_agg(o.label order by o.label), '{}')
        from public.question_options o
        where o.question_id = p_question.id and o.id in (select x::uuid from jsonb_array_elements_text(p_response -> 'option_ids') x)
      ) = (
        select coalesce(array_agg(l order by l), '{}') from jsonb_array_elements_text(p_key.answer -> 'labels') l
      ) then p_question.points else 0 end;
    when 'dropdowns' then
      v_n := jsonb_array_length(v_items);
      select coalesce(sum(coalesce((v_items -> (r.n::int - 1) ->> 'points')::numeric, p_question.points / v_n)), 0)
      into v_score
      from jsonb_array_elements(p_response -> 'answers') with ordinality r(v, n)
      where jsonb_typeof(r.v) = 'string' and r.v = p_key.answer -> 'answers' -> (r.n::int - 1);
      return round(least(v_score, p_question.points), 2);
    when 'numeric' then
      -- Accept a decimal comma and a unit after the number: "5,8 L/h" reads as 5.8.
      v_raw := substring(replace(replace(p_response ->> 'value', ' ', ''), ',', '.') from '-?[0-9]+(?:\.[0-9]+)?');
      if v_raw is null then
        return 0;
      end if;
      v_value := v_raw::numeric;
      return case when v_value between (p_key.answer ->> 'min')::numeric and (p_key.answer ->> 'max')::numeric
                  then p_question.points else 0 end;
    when 'open' then
      return null;
  end case;
  return 0;
end $$;

revoke execute on function public.validate_response(public.questions, jsonb) from public, anon, authenticated;
revoke execute on function public.grade_response(public.questions, public.question_answer_keys, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Practice engine
-- ---------------------------------------------------------------------------

drop function public.start_practice_session(uuid, public.practice_mode, uuid[], integer, integer);

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
  if p_exam_id is null and p_mode = 'topic' and coalesce(array_length(p_topic_ids, 1), 0) <> 1 then
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
        and (not q.is_premium or public.has_course_access(p_course_id))
        -- A subtopic counts as part of its parent topic.
        and (coalesce(array_length(p_topic_ids, 1), 0) = 0 or q.topic_id = any (p_topic_ids) or t.parent_id = any (p_topic_ids))
        and (
          p_mode <> 'incorrect' or exists (
            select 1 from (
              select distinct on (a.question_id) a.question_id, a.is_correct
              from public.question_attempts a
              where a.user_id = v_user and a.question_id = q.id
              order by a.question_id, a.answered_at desc
            ) latest where not latest.is_correct
          )
        )
      -- Parts of one exam case stay together and in order within a topic session.
      order by case when p_mode = 'topic' then t.sort_order else 0 end,
               case when p_mode = 'topic' then q.exam_id end,
               case when p_mode = 'topic' then q.exam_position end,
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

-- Records one answer of any type. Idempotent: a repeated submit returns the first recorded answer.
-- In exam mode feedback stays hidden until finish_practice_session.
create or replace function public.submit_response(p_session_id uuid, p_question_id uuid, p_response jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_session public.practice_sessions;
  v_question public.questions;
  v_key public.question_answer_keys;
  v_attempt public.question_attempts;
  v_score numeric;
begin
  select * into v_session from public.practice_sessions where id = p_session_id and user_id = v_user;
  if not found then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;
  if v_session.finished_at is not null then
    raise exception 'session_finished' using errcode = '22023';
  end if;
  if not (p_question_id = any (v_session.question_ids)) then
    raise exception 'question_not_in_session' using errcode = '22023';
  end if;
  if v_session.mode = 'exam' and v_session.time_limit_seconds is not null
     and now() > v_session.started_at + make_interval(secs => v_session.time_limit_seconds) then
    raise exception 'time_expired' using errcode = '22023';
  end if;

  select * into v_question from public.questions where id = p_question_id;
  perform public.validate_response(v_question, p_response);

  select * into v_key from public.question_answer_keys where question_id = p_question_id;
  if not found or (v_question.type = 'single_choice' and v_key.correct_option_id is null) then
    raise exception 'answer_key_missing' using errcode = 'P0002';
  end if;

  v_score := public.grade_response(v_question, v_key, p_response);

  insert into public.question_attempts (user_id, session_id, question_id, selected_option_id, response, score, max_score, is_correct)
  values (v_user, p_session_id, p_question_id,
          case when v_question.type = 'single_choice' then (p_response ->> 'option_id')::uuid end,
          p_response, v_score, v_question.points, coalesce(v_score >= v_question.points, false))
  on conflict (session_id, question_id) do nothing;

  select * into v_attempt from public.question_attempts where session_id = p_session_id and question_id = p_question_id;

  if v_session.mode = 'exam' then
    return jsonb_build_object('recorded', true, 'selected_option_id', v_attempt.selected_option_id, 'response', v_attempt.response);
  end if;

  return jsonb_build_object(
    'recorded', true,
    'selected_option_id', v_attempt.selected_option_id,
    'response', v_attempt.response,
    'is_correct', v_attempt.is_correct,
    'score', v_attempt.score,
    'max_score', v_attempt.max_score,
    'needs_grading', v_attempt.score is null,
    'correct_option_id', v_key.correct_option_id,
    'answer', v_key.answer,
    'explanation', v_key.explanation,
    'concept', v_key.concept,
    'option_feedback', v_key.option_feedback
  );
end $$;

-- The single-choice entry point the app used before; kept so older clients keep working.
create or replace function public.submit_answer(p_session_id uuid, p_question_id uuid, p_option_id uuid)
returns jsonb
language sql security definer set search_path = public as $$
  select public.submit_response(p_session_id, p_question_id, jsonb_build_object('option_id', p_option_id));
$$;

-- The student marks their own open answer against the answer model, in steps of half a point.
-- In exam mode that is only possible once the exam has been handed in and the model answers are visible.
create or replace function public.self_grade(p_session_id uuid, p_question_id uuid, p_score numeric)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_session public.practice_sessions;
  v_attempt public.question_attempts;
begin
  select * into v_session from public.practice_sessions where id = p_session_id and user_id = v_user;
  if not found then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;
  if v_session.mode = 'exam' and v_session.finished_at is null then
    raise exception 'grade_after_finish' using errcode = '22023';
  end if;
  select a.* into v_attempt from public.question_attempts a
  join public.questions q on q.id = a.question_id and q.type = 'open'
  where a.session_id = p_session_id and a.question_id = p_question_id;
  if not found then
    raise exception 'not_gradable' using errcode = '22023';
  end if;
  if p_score is null or p_score < 0 or p_score > v_attempt.max_score or p_score * 2 <> trunc(p_score * 2) then
    raise exception 'invalid_score' using errcode = '22023';
  end if;

  update public.question_attempts set score = p_score, is_correct = p_score >= max_score
  where id = v_attempt.id
  returning * into v_attempt;

  return jsonb_build_object('score', v_attempt.score, 'max_score', v_attempt.max_score, 'is_correct', v_attempt.is_correct);
end $$;

-- Closes a session and returns the score in points plus a full review (answer keys included).
create or replace function public.finish_practice_session(p_session_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_session public.practice_sessions;
  v_review jsonb;
begin
  select * into v_session from public.practice_sessions where id = p_session_id and user_id = v_user;
  if not found then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;

  update public.practice_sessions set finished_at = coalesce(finished_at, now()) where id = p_session_id;

  select coalesce(jsonb_agg(jsonb_build_object(
      'question_id', s.qid,
      'selected_option_id', a.selected_option_id,
      'response', a.response,
      'is_correct', coalesce(a.is_correct, false),
      'score', a.score,
      'max_score', q.points,
      'needs_grading', a.id is not null and a.score is null,
      'correct_option_id', k.correct_option_id,
      'answer', coalesce(k.answer, '{}'::jsonb),
      'explanation', k.explanation,
      'concept', k.concept,
      'option_feedback', k.option_feedback
    ) order by s.ord), '[]'::jsonb)
  into v_review
  from unnest(v_session.question_ids) with ordinality as s(qid, ord)
  join public.questions q on q.id = s.qid
  left join public.question_attempts a on a.session_id = p_session_id and a.question_id = s.qid
  left join public.question_answer_keys k on k.question_id = s.qid;

  return jsonb_build_object(
    'total', coalesce(array_length(v_session.question_ids, 1), 0),
    'answered', (select count(*) from public.question_attempts where session_id = p_session_id),
    'correct', (select count(*) from public.question_attempts where session_id = p_session_id and is_correct),
    'points', (select coalesce(sum(points), 0) from public.questions where id = any (v_session.question_ids)),
    'scored', (select coalesce(sum(score), 0) from public.question_attempts where session_id = p_session_id),
    'review', v_review
  );
end $$;

revoke execute on function public.start_practice_session(uuid, public.practice_mode, uuid[], integer, integer, uuid) from public, anon;
revoke execute on function public.submit_response(uuid, uuid, jsonb) from public, anon;
revoke execute on function public.self_grade(uuid, uuid, numeric) from public, anon;
grant execute on function public.start_practice_session(uuid, public.practice_mode, uuid[], integer, integer, uuid) to authenticated;
grant execute on function public.submit_response(uuid, uuid, jsonb) to authenticated;
grant execute on function public.self_grade(uuid, uuid, numeric) to authenticated;
