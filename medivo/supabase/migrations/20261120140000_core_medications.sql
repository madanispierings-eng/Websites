-- Kernmedicatielijst: een vak-specifieke lijst kernmedicatie. Per medicijn leggen we vast wat de
-- student moet kennen (werkingsmechanisme, indicatie(s), belangrijkste bijwerkingen) plus een
-- uitleg ("wat is het, hoe werkt het"). Premium-inhoud, net als de rest van een vak; de lijst wordt
-- getoond met flashcards (naam voorop, de rest achterop) en als doorzoekbaar overzicht.
create table public.core_medications (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  -- Groep (bv. "Anti-emetica") en optioneel een subgroep/klasse (bv. "Dopamine D2-antagonisten").
  category text not null,
  category_sort integer not null default 0,
  subgroup text,
  name text not null,
  sort_order integer not null default 0,
  -- De drie dingen die de student moet kennen.
  mechanism text not null,
  indications text not null,
  side_effects text not null,
  -- Langere uitleg zodat de student begrijpt wat het middel is en hoe het werkt.
  explanation text not null,
  is_premium boolean not null default true,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_medications_publishable check (status <> 'published' or reviewed_at is not null)
);
create index core_medications_course on public.core_medications (course_id, category_sort, sort_order);

alter table public.core_medications enable row level security;

-- Studenten zien gepubliceerde kernmedicatie alleen met toegang tot het vak; admins zien alles.
create policy "core medications readable with access" on public.core_medications for select using (
  public.is_admin() or (
    status = 'published' and auth.uid() is not null
    and (not is_premium or public.has_course_access(course_id))
  )
);
create policy "admins manage core medications" on public.core_medications for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
