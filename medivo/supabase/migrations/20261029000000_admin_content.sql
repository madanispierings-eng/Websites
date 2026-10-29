-- Admin authoring: save a question with its options and answer key in one transaction.
-- Doing this through separate REST calls could leave a published question without an answer key.

create or replace function public.admin_save_question(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_labels text[];
  v_correct uuid;
  v_feedback jsonb := '{}'::jsonb;
  v_opt record;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select array_agg(o ->> 'label' order by ord) into v_labels
  from jsonb_array_elements(p -> 'options') with ordinality as t(o, ord);
  if coalesce(array_length(v_labels, 1), 0) < 2 then
    raise exception 'need_two_options' using errcode = '22023';
  end if;
  if not (p ->> 'correct_label') = any (v_labels) then
    raise exception 'correct_option_missing' using errcode = '22023';
  end if;

  -- Fields first, as a draft: the final status is set at the end, once the answer key exists.
  if v_id is null then
    insert into public.questions (course_id, topic_id, exam_id, stem, image_path, image_alt, difficulty, source,
                                  copyright_status, is_premium, status)
    values ((p ->> 'course_id')::uuid, (p ->> 'topic_id')::uuid, nullif(p ->> 'exam_id', '')::uuid, p ->> 'stem',
            nullif(p ->> 'image_path', ''), nullif(p ->> 'image_alt', ''), nullif(p ->> 'difficulty', '')::smallint,
            p ->> 'source', (p ->> 'copyright_status')::public.rights_status, coalesce((p ->> 'is_premium')::boolean, true),
            'draft')
    returning id into v_id;
  else
    update public.questions set
      topic_id = (p ->> 'topic_id')::uuid,
      exam_id = nullif(p ->> 'exam_id', '')::uuid,
      stem = p ->> 'stem',
      image_path = nullif(p ->> 'image_path', ''),
      image_alt = nullif(p ->> 'image_alt', ''),
      difficulty = nullif(p ->> 'difficulty', '')::smallint,
      source = p ->> 'source',
      copyright_status = (p ->> 'copyright_status')::public.rights_status,
      is_premium = coalesce((p ->> 'is_premium')::boolean, true),
      status = 'draft'
    where id = v_id;
    if not found then
      raise exception 'question_not_found' using errcode = 'P0002';
    end if;
  end if;

  -- Options are matched by label, so existing answers keep pointing at the same option.
  insert into public.question_options (question_id, label, body, sort_order)
  select v_id, o ->> 'label', o ->> 'body', ord
  from jsonb_array_elements(p -> 'options') with ordinality as t(o, ord)
  on conflict (question_id, label) do update set body = excluded.body, sort_order = excluded.sort_order;

  select id into v_correct from public.question_options where question_id = v_id and label = p ->> 'correct_label';

  for v_opt in select id, label from public.question_options where question_id = v_id loop
    if coalesce(p -> 'option_feedback' ->> v_opt.label, '') <> '' then
      v_feedback := v_feedback || jsonb_build_object(v_opt.id::text, p -> 'option_feedback' ->> v_opt.label);
    end if;
  end loop;

  insert into public.question_answer_keys (question_id, correct_option_id, explanation, concept, option_feedback)
  values (v_id, v_correct, p ->> 'explanation', nullif(p ->> 'concept', ''), v_feedback)
  on conflict (question_id) do update set
    correct_option_id = excluded.correct_option_id,
    explanation = excluded.explanation,
    concept = excluded.concept,
    option_feedback = excluded.option_feedback;

  -- Removing an option that students already chose would silently delete their answers.
  if exists (
    select 1 from public.question_attempts a
    join public.question_options o on o.id = a.selected_option_id
    where o.question_id = v_id and not (o.label = any (v_labels))
  ) then
    raise exception 'option_in_use' using errcode = '22023';
  end if;
  delete from public.question_options where question_id = v_id and not (label = any (v_labels));

  update public.questions set
    reviewed_at = case when (p ->> 'reviewed')::boolean then coalesce(reviewed_at, now()) end,
    reviewed_by = case when (p ->> 'reviewed')::boolean then coalesce(reviewed_by, auth.uid()) end,
    status = (p ->> 'status')::public.publication_status
  where id = v_id;

  return v_id;
end $$;

revoke execute on function public.admin_save_question(jsonb) from public, anon;
grant execute on function public.admin_save_question(jsonb) to authenticated;
