-- A second attempt with a hint from the summary. In practice modes (never in exam mode), a wrong answer to a
-- question that points at a summary section is not answered with the key straight away: the student reads the
-- section and gets one more attempt. The answer key is released only after that second attempt, or when the
-- student asks for it. A correct second attempt counts as correct, marked "with hint".

-- Which part of a summary helps with this question: {"summary_id": uuid, "heading": "<heading text>"}.
-- Not secret: it points at study material, not at the answer.
alter table public.questions
  add column hint jsonb check (hint is null or (jsonb_typeof(hint) = 'object' and hint ? 'summary_id' and hint ? 'heading'));

alter table public.question_attempts
  -- False while the student still has a second attempt to make.
  add column final boolean not null default true,
  add column attempts smallint not null default 1 check (attempts between 1 and 2),
  -- The student saw the hint before the final answer (a second attempt, or the answer shown after one).
  add column used_hint boolean not null default false;

-- The feedback for a final attempt: score, key and explanation.
create or replace function public.attempt_feedback(p_attempt public.question_attempts, p_key public.question_answer_keys)
returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
    'recorded', true,
    'selected_option_id', p_attempt.selected_option_id,
    'response', p_attempt.response,
    'is_correct', p_attempt.is_correct,
    'score', p_attempt.score,
    'max_score', p_attempt.max_score,
    'needs_grading', p_attempt.score is null,
    'used_hint', p_attempt.used_hint,
    'attempts', p_attempt.attempts,
    'correct_option_id', p_key.correct_option_id,
    'answer', p_key.answer,
    'explanation', p_key.explanation,
    'concept', p_key.concept,
    'option_feedback', p_key.option_feedback
  );
$$;
revoke execute on function public.attempt_feedback(public.question_attempts, public.question_answer_keys) from public, anon, authenticated;

-- What a wrong first attempt may show without giving the answer away: the chosen option that is wrong, or which
-- drop-down items are wrong (not what they should be).
create or replace function public.retry_hint(p_question public.questions, p_key public.question_answer_keys, p_response jsonb)
returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
    'retry', true,
    'response', p_response,
    'wrong_option_ids', case when p_question.type = 'single_choice' then jsonb_build_array(p_response ->> 'option_id') else '[]'::jsonb end,
    'wrong_items', case when p_question.type = 'dropdowns' then coalesce((
      select jsonb_agg(r.n - 1 order by r.n)
      from jsonb_array_elements(p_response -> 'answers') with ordinality r(v, n)
      where r.v is distinct from (p_key.answer -> 'answers' -> (r.n::int - 1))
    ), '[]'::jsonb) else '[]'::jsonb end
  );
$$;
revoke execute on function public.retry_hint(public.questions, public.question_answer_keys, jsonb) from public, anon, authenticated;

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
  v_correct boolean;
  v_can_retry boolean;
  v_existing boolean;
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
  select * into v_key from public.question_answer_keys where question_id = p_question_id;
  if not found or (v_question.type = 'single_choice' and v_key.correct_option_id is null) then
    raise exception 'answer_key_missing' using errcode = 'P0002';
  end if;

  perform public.validate_response(v_question, p_response);

  select * into v_attempt from public.question_attempts where session_id = p_session_id and question_id = p_question_id;
  v_existing := found;

  -- Already answered for good: return what was recorded (a repeated submit changes nothing).
  if v_existing and v_attempt.final then
    if v_session.mode = 'exam' then
      return jsonb_build_object('recorded', true, 'selected_option_id', v_attempt.selected_option_id, 'response', v_attempt.response);
    end if;
    return public.attempt_feedback(v_attempt, v_key);
  end if;

  v_score := public.grade_response(v_question, v_key, p_response);
  v_correct := coalesce(v_score >= v_question.points, false);

  -- The second attempt, after the hint: final whatever the outcome.
  if v_existing then
    update public.question_attempts set
      response = p_response,
      selected_option_id = case when v_question.type = 'single_choice' then (p_response ->> 'option_id')::uuid end,
      score = v_score, is_correct = v_correct, attempts = 2, used_hint = true, final = true, answered_at = now()
    where id = v_attempt.id
    returning * into v_attempt;
    return public.attempt_feedback(v_attempt, v_key);
  end if;

  -- A first wrong answer gets a second attempt with the hint, in practice modes, for auto-graded questions with a hint.
  v_can_retry := v_session.mode <> 'exam' and v_question.hint is not null and v_score is not null and not v_correct;

  insert into public.question_attempts (user_id, session_id, question_id, selected_option_id, response, score, max_score, is_correct, final)
  values (v_user, p_session_id, p_question_id,
          case when v_question.type = 'single_choice' then (p_response ->> 'option_id')::uuid end,
          p_response, v_score, v_question.points, v_correct, not v_can_retry)
  on conflict (session_id, question_id) do nothing
  returning * into v_attempt;

  -- A simultaneous duplicate submit (double click) lost the race: answer with what the first one recorded.
  if not found then
    select * into v_attempt from public.question_attempts where session_id = p_session_id and question_id = p_question_id;
    if v_session.mode = 'exam' then
      return jsonb_build_object('recorded', true, 'selected_option_id', v_attempt.selected_option_id, 'response', v_attempt.response);
    end if;
    if not v_attempt.final then
      return public.retry_hint(v_question, v_key, v_attempt.response);
    end if;
    return public.attempt_feedback(v_attempt, v_key);
  end if;

  if v_session.mode = 'exam' then
    return jsonb_build_object('recorded', true, 'selected_option_id', v_attempt.selected_option_id, 'response', v_attempt.response);
  end if;
  if v_can_retry then
    return public.retry_hint(v_question, v_key, p_response);
  end if;
  return public.attempt_feedback(v_attempt, v_key);
end $$;

-- The student gives up on the second attempt: the first (wrong) answer stands and the key is shown.
create or replace function public.reveal_answer(p_session_id uuid, p_question_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_attempt public.question_attempts;
  v_key public.question_answer_keys;
begin
  if not exists (select 1 from public.practice_sessions where id = p_session_id and user_id = v_user) then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;
  update public.question_attempts set final = true, used_hint = true
  where session_id = p_session_id and question_id = p_question_id and not final
  returning * into v_attempt;
  if not found then
    select * into v_attempt from public.question_attempts where session_id = p_session_id and question_id = p_question_id;
    if not found or not v_attempt.final then
      raise exception 'nothing_to_reveal' using errcode = '22023';
    end if;
  end if;
  select * into v_key from public.question_answer_keys where question_id = p_question_id;
  return public.attempt_feedback(v_attempt, v_key);
end $$;

-- Finishing a session closes any second attempt that was never made.
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
  update public.question_attempts set final = true, used_hint = true where session_id = p_session_id and not final;

  select coalesce(jsonb_agg(jsonb_build_object(
      'question_id', s.qid,
      'selected_option_id', a.selected_option_id,
      'response', a.response,
      'is_correct', coalesce(a.is_correct, false),
      'score', a.score,
      'max_score', q.points,
      'needs_grading', a.id is not null and a.score is null,
      'used_hint', coalesce(a.used_hint, false),
      'attempts', coalesce(a.attempts, 0),
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
    'with_hint', (select count(*) from public.question_attempts where session_id = p_session_id and is_correct and used_hint),
    'points', (select coalesce(sum(points), 0) from public.questions where id = any (v_session.question_ids)),
    'scored', (select coalesce(sum(score), 0) from public.question_attempts where session_id = p_session_id),
    'review', v_review
  );
end $$;

-- Progress counts only what was right at the first go; "with hint" answers come back in "incorrect" practice.
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
  where q.course_id = p_course_id
  group by q.topic_id;
$$;

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
              select distinct on (a.question_id) a.question_id, a.is_correct, a.used_hint
              from public.question_attempts a
              where a.user_id = v_user and a.question_id = q.id and a.final
              order by a.question_id, a.answered_at desc
            ) latest where not latest.is_correct or latest.used_hint
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

revoke execute on function public.reveal_answer(uuid, uuid) from public, anon;
grant execute on function public.reveal_answer(uuid, uuid) to authenticated;
