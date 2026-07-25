-- Phase 4.7 — Fix 1: create the vendor-assets bucket + repair storage RLS.
-- Applied to live project pqzygehnnojdttmqadrz via apply_migration.
--
-- Root causes fixed:
--   (a) the 'vendor-assets' bucket never existed -> every upload failed.
--   (b) the write policies split the vendor's NAME instead of the object PATH
--       and keyed on auth.email() -> the check was always false, so even with a
--       bucket, authenticated uploads were denied. Now keyed on the object path's
--       first segment ({vendor_id}/...) and vendors.user_id = auth.uid()
--       (per the project rule: storage RLS uses auth.uid(), never auth.email()).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vendor-assets', 'vendor-assets', true, 5242880,
        array['image/webp','image/jpeg','image/png','image/gif','image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vendors upload own assets" on storage.objects;
create policy "vendors upload own assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'vendor-assets'
    and exists (
      select 1 from public.vendors v
      where v.user_id = auth.uid()
        and v.id::text = split_part(objects.name, '/', 1)
    )
  );

drop policy if exists "vendors update own assets" on storage.objects;
create policy "vendors update own assets" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'vendor-assets'
    and exists (
      select 1 from public.vendors v
      where v.user_id = auth.uid()
        and v.id::text = split_part(objects.name, '/', 1)
    )
  )
  with check (
    bucket_id = 'vendor-assets'
    and exists (
      select 1 from public.vendors v
      where v.user_id = auth.uid()
        and v.id::text = split_part(objects.name, '/', 1)
    )
  );

-- Vendors may delete their own assets (needed for gallery photo removal).
drop policy if exists "vendors delete own assets" on storage.objects;
create policy "vendors delete own assets" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'vendor-assets'
    and exists (
      select 1 from public.vendors v
      where v.user_id = auth.uid()
        and v.id::text = split_part(objects.name, '/', 1)
    )
  );

-- Anonymous customers may attach a review photo (reviews/ subfolder only).
-- NOTE: opens an anon upload surface; constrained to image mime types (bucket
-- allowed_mime_types) and 5MB. Consider login-gating or moderation later.
drop policy if exists "public upload review photos" on storage.objects;
create policy "public upload review photos" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'vendor-assets'
    and split_part(objects.name, '/', 2) = 'reviews'
  );
