-- "Meerdere antwoorden mogelijk"-vragen (bijv. kies 4 van de 16, 2 punten) gaven eerst
-- alles-of-niets: wie niet exact de juiste set koos, kreeg 0. Dat betekende dat 3 van de 4
-- goed alsnog 0 opleverde. Nu telt elke juiste gekozen optie mee en telt elke foute keuze
-- even zwaar tegen: score = (punten / aantal juiste opties) * (juist gekozen - fout gekozen),
-- begrensd op [0, punten]. Bij 4 juiste opties en 2 punten is dat 0,5 per optie; 3 goed en
-- geen fout = 1,5; alles aankruisen levert 0 op (juist - fout <= 0). Zelfde signatuur, dus
-- CREATE OR REPLACE behoudt de (ingetrokken) rechten.
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
      -- Deelscore: elke juiste optie telt mee, elke foute keuze telt even zwaar tegen.
      v_n := (select count(*) from jsonb_array_elements_text(p_key.answer -> 'labels'));
      if v_n = 0 then
        return 0;
      end if;
      select coalesce(sum(
               case when o.label in (select l from jsonb_array_elements_text(p_key.answer -> 'labels') l)
                    then 1 else -1 end), 0)
        into v_score
      from public.question_options o
      where o.question_id = p_question.id
        and o.id in (select x::uuid from jsonb_array_elements_text(p_response -> 'option_ids') x);
      return round(greatest(0, least(p_question.points, (p_question.points / v_n) * v_score)), 2);
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
