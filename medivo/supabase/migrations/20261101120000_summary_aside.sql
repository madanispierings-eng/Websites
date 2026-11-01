-- A small "aside" per summary for the reader's sidebar: clinical relevance and exam focus, each a list of short
-- points. It rides on the summaries row, so it follows the same access rules (premium content needs course access).
-- The learning-objective links in the sidebar come from learning_objectives, not from here.

alter table public.summaries
  add column aside jsonb not null default '{}'::jsonb check (
    jsonb_typeof(aside) = 'object'
    and (not aside ? 'clinical' or jsonb_typeof(aside -> 'clinical') = 'array')
    and (not aside ? 'exam' or jsonb_typeof(aside -> 'exam') = 'array')
  );
