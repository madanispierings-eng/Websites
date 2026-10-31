-- A worked-out explanation per learning objective: summary blocks (text, tables, formulas, images) plus explanation
-- videos. The objective itself stays public; its explanation is learning content and follows the summary rules
-- (premium content needs access to the course).

create table public.objective_explanations (
  objective_id uuid primary key references public.learning_objectives (id) on delete cascade,
  content jsonb not null default '[]'::jsonb check (jsonb_typeof(content) = 'array'),
  -- [{"youtube_id": "...", "title": "...", "channel": "...", "why": "..."}], validated by the app.
  videos jsonb not null default '[]'::jsonb check (
    jsonb_typeof(videos) = 'array'
    and not jsonb_path_exists(videos, '$[*] ? (!exists(@.youtube_id) || !exists(@.title))')
  ),
  is_premium boolean not null default true,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint objective_explanations_reviewed_before_publish check (status <> 'published' or reviewed_at is not null)
);
create trigger objective_explanations_touch before update on public.objective_explanations
  for each row execute function public.touch_updated_at();

alter table public.objective_explanations enable row level security;
create policy "objective explanations readable with access" on public.objective_explanations for select using (
  public.is_admin() or (
    status = 'published'
    and exists (
      select 1 from public.learning_objectives o join public.topics t on t.id = o.topic_id
      where o.id = objective_id and o.status = 'published' and t.status = 'published'
        and (not is_premium or public.has_course_access(t.course_id))
    )
  )
);
create policy "admins manage" on public.objective_explanations for all using (public.is_admin()) with check (public.is_admin());
