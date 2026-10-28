-- Private storage for course images and PDFs. Nothing in this bucket is public: files are served through
-- short-lived signed URLs, which Supabase only issues to users that pass the SELECT policy below.
-- Path convention: <course uuid>/free/<file> or <course uuid>/premium/<file>.
-- Skipped on plain Postgres (tests), where the storage schema does not exist.

do $migration$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    raise notice 'storage schema not found, skipping storage setup';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('course-content', 'course-content', false, 20971520,
          array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf'])
  on conflict (id) do update set public = false;

  execute $p$
    create policy "course content readable with access" on storage.objects for select to authenticated using (
      bucket_id = 'course-content'
      and exists (
        select 1 from public.courses c
        where c.id::text = (storage.foldername(name))[1]
          and c.status = 'published'
          and ((storage.foldername(name))[2] = 'free' or public.has_course_access(c.id))
      )
    )
  $p$;
  execute $p$
    create policy "admins manage course content" on storage.objects for all to authenticated
      using (bucket_id = 'course-content' and public.is_admin())
      with check (bucket_id = 'course-content' and public.is_admin())
  $p$;
end
$migration$;
