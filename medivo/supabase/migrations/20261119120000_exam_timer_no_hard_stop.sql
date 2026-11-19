-- Oefen-tentamenmodus: laat de harde server-tijdsafkap los, zodat de timer een
-- client-side studiehulp wordt die de student kan pauzeren. De tijdslimiet blijft
-- bestaan voor weergave; antwoorden worden niet meer geweigerd na de tijd.
-- Zelfde signatuur, dus CREATE OR REPLACE behoudt de rechten.
CREATE OR REPLACE FUNCTION public.submit_response(p_session_id uuid, p_question_id uuid, p_response jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$
