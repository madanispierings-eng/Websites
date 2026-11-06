-- Resume an unfinished practice session. A session stays open (finished_at is null) when the student navigates
-- away without handing it in, so "verder gaan" reads back what was already answered and puts the student back
-- where they left off. This function returns the session together with its recorded attempts, each rendered the
-- way the client needs it, without closing the session:
--   * exam mode  -> only the recorded response (feedback stays hidden until the exam is handed in);
--   * final (practice) -> the full feedback, exactly as submit_response returned it;
--   * open second attempt (not final) -> the retry hint, so the half-finished question reopens for its second try.
create or replace function public.resume_practice_session(p_session_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_session public.practice_sessions;
  v_answers jsonb;
begin
  select * into v_session from public.practice_sessions where id = p_session_id and user_id = v_user;
  if not found then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;
  if v_session.finished_at is not null then
    raise exception 'session_finished' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(
    case
      when v_session.mode = 'exam'
        then jsonb_build_object('question_id', a.question_id, 'kind', 'exam', 'response', a.response)
      when a.final
        then jsonb_build_object('question_id', a.question_id, 'kind', 'final', 'feedback', public.attempt_feedback(a, k))
      else jsonb_build_object('question_id', a.question_id, 'kind', 'retry', 'hint', public.retry_hint(q, k, a.response))
    end
    order by a.answered_at
  ), '[]'::jsonb)
  into v_answers
  from public.question_attempts a
  join public.questions q on q.id = a.question_id
  left join public.question_answer_keys k on k.question_id = a.question_id
  where a.session_id = p_session_id;

  return jsonb_build_object(
    'mode', v_session.mode,
    'started_at', v_session.started_at,
    'time_limit_seconds', v_session.time_limit_seconds,
    'question_ids', to_jsonb(v_session.question_ids),
    'answers', v_answers
  );
end $$;

revoke execute on function public.resume_practice_session(uuid) from public, anon, authenticated;
grant execute on function public.resume_practice_session(uuid) to authenticated;
