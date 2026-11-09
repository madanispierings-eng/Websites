-- Reset a student's own practice progress for one topic, without touching the questions themselves.
-- After a reset the topic's "x van y gemaakt" and its first-go score fall back to zero, so a student
-- can start a fresh practice session and see their current level cleanly, over and over.
--
-- Scope, on purpose:
--   * Only the caller's own attempts are removed (security definer, filtered on auth.uid()).
--   * Only practice questions of the topic (exam_id is null); questions that belong to an old exam
--     never count toward topic progress, so they are irrelevant here.
--   * Only attempts made in practice sessions (topic / mixed / incorrect). Attempts made while
--     simulating or sitting an exam (mode = 'exam') are left alone, so the "Proeftentamens" history
--     and its scores stay intact.
-- The questions, summaries, flashcards and learning objectives are never deleted.

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
    and q.topic_id = p_topic_id
    and q.exam_id is null
    and s.mode <> 'exam';

  get diagnostics v_deleted = row_count;
  return v_deleted;
end $$;

revoke execute on function public.reset_topic_progress(uuid) from public, anon;
grant execute on function public.reset_topic_progress(uuid) to authenticated;
