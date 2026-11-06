-- The course overview card "Oefenen per onderwerp · N oefenvragen" must count only the
-- per-topic practice questions, not questions that belong to an old exam (exam_id set).
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
    'has_access', public.has_course_access(p_course_id)
  )
  where exists (select 1 from public.courses where id = p_course_id and status = 'published');
$$;
