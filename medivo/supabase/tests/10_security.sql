-- Security and practice-engine checks. Fixtures here are test data only (no medical content).
\set ON_ERROR_STOP on
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'student@test.local', '{"full_name":"Test Student"}'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'other@test.local', '{}'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'admin@test.local', '{}');
update public.profiles set role = 'admin' where id = 'aaaaaaaa-0000-4000-8000-000000000003';

-- Fixture content on the first course.
insert into public.topics (id, course_id, slug, title, status)
select 'bbbbbbbb-0000-4000-8000-000000000001', id, 'test-onderwerp', 'Testonderwerp', 'published'
from public.courses where slug = 'van-cel-tot-molecuul';
insert into public.questions (id, course_id, topic_id, stem, source, copyright_status, is_premium, reviewed_at, status)
select ('cccccccc-0000-4000-8000-00000000000' || n)::uuid, c.id, 'bbbbbbbb-0000-4000-8000-000000000001',
       'Testvraag ' || n, 'test', 'own_work', n = 2, now(), 'published'
from public.courses c, generate_series(1, 2) n where c.slug = 'van-cel-tot-molecuul';
insert into public.question_options (id, question_id, label, body, sort_order)
select ('dddddddd-000' || q || '-4000-8000-00000000000' || o)::uuid, ('cccccccc-0000-4000-8000-00000000000' || q)::uuid,
       chr(64 + o), 'Optie ' || chr(64 + o), o
from generate_series(1, 2) q, generate_series(1, 4) o;
insert into public.question_answer_keys (question_id, correct_option_id, explanation)
select ('cccccccc-0000-4000-8000-00000000000' || q)::uuid, ('dddddddd-000' || q || '-4000-8000-000000000002')::uuid, 'Uitleg ' || q
from generate_series(1, 2) q;

-- Unpublished questions without review must be rejected.
do $$ begin
  begin
    insert into public.questions (course_id, topic_id, stem, source, status)
    select course_id, id, 'x', 'x', 'published' from public.topics where slug = 'test-onderwerp';
    raise exception 'FAIL: unreviewed question was published';
  exception when check_violation then null;
  end;
end $$;

-- ---- as the student ----
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

do $$
declare v_session uuid; v_res jsonb; v_res2 jsonb; n int;
begin
  -- Catalogue is visible.
  select count(*) into n from public.courses;
  if n <> 15 then raise exception 'FAIL: expected 15 courses, got %', n; end if;

  -- Answer keys are invisible.
  select count(*) into n from public.question_answer_keys;
  if n <> 0 then raise exception 'FAIL: student can read % answer keys', n; end if;

  -- Premium question invisible without entitlement, free one visible.
  select count(*) into n from public.questions;
  if n <> 1 then raise exception 'FAIL: expected 1 visible question, got %', n; end if;

  -- Role escalation blocked by column grants.
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    raise exception 'FAIL: student changed own role';
  exception when insufficient_privilege then null;
  end;
  update public.profiles set full_name = 'Nieuwe naam' where id = auth.uid();

  -- Cannot insert attempts directly.
  begin
    insert into public.question_attempts (user_id, session_id, question_id, selected_option_id, is_correct)
    values (auth.uid(), gen_random_uuid(), 'cccccccc-0000-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000002', true);
    raise exception 'FAIL: direct attempt insert allowed';
  exception when insufficient_privilege or foreign_key_violation then null;
  end;

  -- Topic session: only the free question is available.
  v_session := public.start_practice_session(
    (select id from public.courses where slug = 'van-cel-tot-molecuul'), 'topic',
    array['bbbbbbbb-0000-4000-8000-000000000001'::uuid]);
  select array_length(question_ids, 1) into n from public.practice_sessions where id = v_session;
  if n <> 1 then raise exception 'FAIL: session has % questions', n; end if;

  -- Wrong answer, then a second (different) submit must return the first answer.
  v_res := public.submit_answer(v_session, 'cccccccc-0000-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000001');
  if (v_res ->> 'is_correct')::boolean then raise exception 'FAIL: wrong answer marked correct'; end if;
  if v_res ->> 'correct_option_id' <> 'dddddddd-0001-4000-8000-000000000002' then raise exception 'FAIL: key not returned'; end if;
  v_res2 := public.submit_answer(v_session, 'cccccccc-0000-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000002');
  if (v_res2 ->> 'is_correct')::boolean then raise exception 'FAIL: duplicate submit overwrote result'; end if;
  select count(*) into n from public.question_attempts;
  if n <> 1 then raise exception 'FAIL: % attempts recorded', n; end if;

  -- Option from another question is rejected.
  begin
    perform public.submit_answer(v_session, 'cccccccc-0000-4000-8000-000000000001', 'dddddddd-0002-4000-8000-000000000001');
    raise exception 'FAIL: foreign option accepted';
  exception when invalid_parameter_value then null;
  end;

  -- "Incorrect" mode picks up the wrongly answered question.
  v_session := public.start_practice_session((select id from public.courses where slug = 'van-cel-tot-molecuul'), 'incorrect');

  -- Exam mode hides feedback until finished.
  v_session := public.start_practice_session((select id from public.courses where slug = 'van-cel-tot-molecuul'), 'exam', '{}', 10, 600);
  v_res := public.submit_answer(v_session, 'cccccccc-0000-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000002');
  if v_res ? 'correct_option_id' or v_res ? 'is_correct' then raise exception 'FAIL: exam mode leaked feedback'; end if;
  v_res := public.finish_practice_session(v_session);
  if (v_res ->> 'correct')::int <> 1 then raise exception 'FAIL: exam score %', v_res; end if;
  begin
    perform public.submit_answer(v_session, 'cccccccc-0000-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000001');
    raise exception 'FAIL: answer accepted after finish';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- ---- question types and whole exams ----
reset role;
insert into public.exams (id, course_id, exam_year, title, source, rights_status, is_premium, status)
select 'eeeeeeee-0000-4000-8000-000000000001', id, null, 'Testtentamen', 'test', 'own_work', false, 'published'
from public.courses where slug = 'van-cel-tot-molecuul';
insert into public.questions (id, course_id, topic_id, exam_id, exam_position, type, stem, content, points, source,
                              copyright_status, is_premium, reviewed_at, status)
select v.id::uuid, c.id, 'bbbbbbbb-0000-4000-8000-000000000001', 'eeeeeeee-0000-4000-8000-000000000001', v.pos,
       v.type::public.question_type, 'Typevraag ' || v.pos, v.content::jsonb, v.points, 'test', 'own_work', false, now(), 'published'
from public.courses c, (values
  ('ffffffff-0000-4000-8000-000000000001', 1, 'multiple_choice', '{}', 1),
  ('ffffffff-0000-4000-8000-000000000002', 2, 'dropdowns',
   '{"items":[{"prompt":"x","choices":["laag","hoog"]},{"prompt":"y","choices":["laag","hoog"],"points":1.5},{"prompt":"z","choices":["ja","nee"]}]}', 3),
  ('ffffffff-0000-4000-8000-000000000003', 3, 'numeric', '{"unit":"mg"}', 1),
  ('ffffffff-0000-4000-8000-000000000004', 4, 'open', '{}', 4)
) as v(id, pos, type, content, points)
where c.slug = 'van-cel-tot-molecuul';
insert into public.question_options (question_id, label, body, sort_order)
select 'ffffffff-0000-4000-8000-000000000001', chr(64 + o), 'Optie ' || chr(64 + o), o from generate_series(1, 4) o;
insert into public.question_answer_keys (question_id, answer, explanation) values
  ('ffffffff-0000-4000-8000-000000000001', '{"labels":["B","D"]}', 'B en D'),
  ('ffffffff-0000-4000-8000-000000000002', '{"answers":["hoog","laag","ja"]}', 'hoog, laag, ja'),
  ('ffffffff-0000-4000-8000-000000000003', '{"min":380,"max":420,"display":"400 mg"}', '400 mg'),
  ('ffffffff-0000-4000-8000-000000000004', '{}', 'Modelantwoord');

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';
do $$
declare
  v_course uuid := (select id from public.courses where slug = 'van-cel-tot-molecuul');
  v_exam uuid := 'eeeeeeee-0000-4000-8000-000000000001';
  v_session uuid; v_res jsonb; v_ids uuid[]; n int;
  q_mc uuid := 'ffffffff-0000-4000-8000-000000000001';
  q_dd uuid := 'ffffffff-0000-4000-8000-000000000002';
  q_num uuid := 'ffffffff-0000-4000-8000-000000000003';
  q_open uuid := 'ffffffff-0000-4000-8000-000000000004';
  opt_b uuid := (select id from public.question_options where question_id = 'ffffffff-0000-4000-8000-000000000001' and label = 'B');
  opt_c uuid := (select id from public.question_options where question_id = 'ffffffff-0000-4000-8000-000000000001' and label = 'C');
  opt_d uuid := (select id from public.question_options where question_id = 'ffffffff-0000-4000-8000-000000000001' and label = 'D');
begin
  -- The public question row carries no answers.
  if (select content::text from public.questions where id = q_dd) ~ 'answers' then raise exception 'FAIL: key in content'; end if;

  -- A whole exam comes in its original order, whatever the mode.
  v_session := public.start_practice_session(v_course, 'mixed', '{}', 200, null, v_exam);
  select question_ids into v_ids from public.practice_sessions where id = v_session;
  if v_ids <> array[q_mc, q_dd, q_num, q_open] then raise exception 'FAIL: exam order %', v_ids; end if;

  -- Multiple choice: a subset is wrong.
  v_res := public.submit_response(v_session, q_mc, jsonb_build_object('option_ids', jsonb_build_array(opt_b)));
  if (v_res ->> 'is_correct')::boolean or (v_res ->> 'score')::numeric <> 0 then raise exception 'FAIL: partial MC correct %', v_res; end if;
  if v_res -> 'answer' -> 'labels' <> '["B","D"]'::jsonb then raise exception 'FAIL: MC key not returned'; end if;
  -- An option of another question is refused.
  begin
    perform public.submit_response(v_session, q_mc, jsonb_build_object('option_ids', jsonb_build_array('dddddddd-0001-4000-8000-000000000001')));
    raise exception 'FAIL: foreign option accepted';
  exception when invalid_parameter_value then null;
  end;

  -- Dropdowns: partial credit per item, with per-item points (1.5) and the rest shared (0.75 each).
  begin
    perform public.submit_response(v_session, q_dd, '{"answers":["hoog","middel","ja"]}');
    raise exception 'FAIL: unknown choice accepted';
  exception when invalid_parameter_value then null;
  end;
  v_res := public.submit_response(v_session, q_dd, '{"answers":["hoog","hoog",null]}');
  if (v_res ->> 'score')::numeric <> 1 or (v_res ->> 'is_correct')::boolean then raise exception 'FAIL: dropdown score %', v_res; end if;

  -- Numeric: decimal comma and unit are accepted, the range decides.
  v_res := public.submit_response(v_session, q_num, '{"value":"399,5 mg"}');
  if not (v_res ->> 'is_correct')::boolean then raise exception 'FAIL: numeric in range marked wrong %', v_res; end if;

  -- Open: recorded ungraded until the student marks it.
  v_res := public.submit_response(v_session, q_open, '{"text":"Mijn antwoord"}');
  if not (v_res ->> 'needs_grading')::boolean or v_res ->> 'score' is not null then raise exception 'FAIL: open graded %', v_res; end if;
  begin
    perform public.self_grade(v_session, q_open, 4.5);
    raise exception 'FAIL: score above maximum accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.self_grade(v_session, q_num, 1);
    raise exception 'FAIL: self-graded a numeric question';
  exception when invalid_parameter_value then null;
  end;
  v_res := public.self_grade(v_session, q_open, 2.5);
  if (v_res ->> 'score')::numeric <> 2.5 then raise exception 'FAIL: self grade %', v_res; end if;

  v_res := public.finish_practice_session(v_session);
  if (v_res ->> 'points')::numeric <> 9 or (v_res ->> 'scored')::numeric <> 4.5 then raise exception 'FAIL: points %', v_res; end if;

  -- Exam mode: no feedback, and no self-grading before handing in.
  v_session := public.start_practice_session(v_course, 'exam', '{}', 200, 600, v_exam);
  v_res := public.submit_response(v_session, q_dd, '{"answers":["hoog","laag","ja"]}');
  if v_res ? 'answer' or v_res ? 'score' or v_res ? 'explanation' then raise exception 'FAIL: exam mode leaked %', v_res; end if;
  perform public.submit_response(v_session, q_open, '{"text":"x"}');
  begin
    perform public.self_grade(v_session, q_open, 4);
    raise exception 'FAIL: self-graded before handing in';
  exception when invalid_parameter_value then null;
  end;
  v_res := public.finish_practice_session(v_session);
  if (v_res ->> 'scored')::numeric <> 3 then raise exception 'FAIL: exam scored %', v_res; end if;
  perform public.self_grade(v_session, q_open, 4);
  select count(*) into n from public.question_attempts where session_id = v_session and score is null;
  if n <> 0 then raise exception 'FAIL: ungraded after self-grade'; end if;
end $$;

-- ---- as another student: cannot see or use the first student's data ----
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000002';
do $$
declare n int;
begin
  select count(*) into n from public.question_attempts;
  if n <> 0 then raise exception 'FAIL: other student sees % attempts', n; end if;
  select count(*) into n from public.practice_sessions;
  if n <> 0 then raise exception 'FAIL: other student sees % sessions', n; end if;
  begin
    perform public.submit_answer((select id from public.practice_sessions limit 1), 'cccccccc-0000-4000-8000-000000000001',
                                 'dddddddd-0001-4000-8000-000000000002');
    raise exception 'FAIL: foreign session usable';
  exception when no_data_found then null;
  end;
end $$;

-- ---- anonymous visitors ----
reset request.jwt.claim.sub;
set local role anon;
do $$
declare n int;
begin
  select count(*) into n from public.courses;
  if n <> 15 then raise exception 'FAIL: anon sees % courses', n; end if;
  select count(*) into n from public.questions;
  if n <> 0 then raise exception 'FAIL: anon sees % questions', n; end if;
  if (public.course_content_overview((select id from public.courses where slug = 'van-cel-tot-molecuul')) ->> 'questions')::int <> 6
  then raise exception 'FAIL: overview counts wrong'; end if;
  begin
    perform public.start_practice_session((select id from public.courses limit 1), 'mixed');
    raise exception 'FAIL: anon started a session';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---- admin ----
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000003';
do $$
declare n int;
begin
  select count(*) into n from public.question_answer_keys;
  if n <> 6 then raise exception 'FAIL: admin sees % answer keys', n; end if;
  update public.courses set description = 'Bijgewerkt' where slug = 'pharmacology';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not edit course'; end if;
end $$;

-- Admin authoring: question, options and key are saved together.
do $$
declare v_q uuid; v_course uuid; n int; v_key public.question_answer_keys;
begin
  select course_id into v_course from public.topics where slug = 'test-onderwerp';
  v_q := public.admin_save_question(jsonb_build_object(
    'course_id', v_course, 'topic_id', 'bbbbbbbb-0000-4000-8000-000000000001', 'stem', 'Nieuwe testvraag',
    'source', 'eigen werk', 'copyright_status', 'own_work', 'is_premium', false, 'reviewed', false, 'status', 'draft',
    'options', jsonb_build_array(jsonb_build_object('label', 'A', 'body', 'a'), jsonb_build_object('label', 'B', 'body', 'b'),
                                 jsonb_build_object('label', 'C', 'body', 'c')),
    'correct_label', 'B', 'explanation', 'Uitleg', 'option_feedback', jsonb_build_object('A', 'waarom A niet')));
  select count(*) into n from public.question_options where question_id = v_q;
  if n <> 3 then raise exception 'FAIL: % options saved', n; end if;
  select * into v_key from public.question_answer_keys where question_id = v_q;
  if v_key.correct_option_id <> (select id from public.question_options where question_id = v_q and label = 'B')
  then raise exception 'FAIL: wrong key'; end if;
  if (select count(*) from jsonb_object_keys(v_key.option_feedback)) <> 1 then raise exception 'FAIL: feedback not mapped'; end if;

  -- Publishing without review is refused by the table constraint.
  begin
    perform public.admin_save_question(jsonb_build_object(
      'id', v_q, 'course_id', v_course, 'topic_id', 'bbbbbbbb-0000-4000-8000-000000000001', 'stem', 'x', 'source', 'eigen werk',
      'copyright_status', 'own_work', 'reviewed', false, 'status', 'published',
      'options', jsonb_build_array(jsonb_build_object('label', 'A', 'body', 'a'), jsonb_build_object('label', 'B', 'body', 'b')),
      'correct_label', 'A', 'explanation', 'x'));
    raise exception 'FAIL: unreviewed question published';
  exception when check_violation then null;
  end;

  -- Reviewed and published, option C removed, correct answer changed.
  perform public.admin_save_question(jsonb_build_object(
    'id', v_q, 'course_id', v_course, 'topic_id', 'bbbbbbbb-0000-4000-8000-000000000001', 'stem', 'Aangepast', 'source', 'eigen werk',
    'copyright_status', 'own_work', 'is_premium', false, 'reviewed', true, 'status', 'published',
    'options', jsonb_build_array(jsonb_build_object('label', 'A', 'body', 'a2'), jsonb_build_object('label', 'B', 'body', 'b')),
    'correct_label', 'A', 'explanation', 'Nieuwe uitleg'));
  select count(*) into n from public.question_options where question_id = v_q;
  if n <> 2 then raise exception 'FAIL: removed option kept (% left)', n; end if;
  if (select status from public.questions where id = v_q) <> 'published' then raise exception 'FAIL: not published'; end if;
end $$;

-- Removing an option a student answered is refused (it would delete their answer).
do $$ begin
  begin
    perform public.admin_save_question(jsonb_build_object(
      'id', 'cccccccc-0000-4000-8000-000000000001', 'course_id', (select course_id from public.topics where slug = 'test-onderwerp'),
      'topic_id', 'bbbbbbbb-0000-4000-8000-000000000001', 'stem', 'Testvraag 1', 'source', 'test', 'copyright_status', 'own_work',
      'is_premium', false, 'reviewed', true, 'status', 'published',
      'options', jsonb_build_array(jsonb_build_object('label', 'B', 'body', 'b'), jsonb_build_object('label', 'C', 'body', 'c')),
      'correct_label', 'B', 'explanation', 'x'));
    raise exception 'FAIL: answered option removed';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- Students cannot author questions.
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';
do $$ begin
  begin
    perform public.admin_save_question('{"options": []}'::jsonb);
    raise exception 'FAIL: student saved a question';
  exception when insufficient_privilege then null;
  end;
end $$;

rollback;
\echo 'All database security checks passed.'
