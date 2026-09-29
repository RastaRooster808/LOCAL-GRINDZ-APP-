-- Phase 5d — Custom tee order: real design uploads + a flat mockup preview.
--
-- Customers now upload their own art per print spot (front/back/sleeve, each
-- with its own size) instead of just linking a reference image. print_specs
-- captures the structured data; print_locations stays as a simple derived
-- list for anything still reading it. reference_image_url is kept as an
-- optional "inspiration link", separate from the actual uploaded print files.

alter table public.custom_tee_orders
  add column if not exists print_specs jsonb;
-- print_specs shape: [{ "location": "front"|"back"|"sleeve", "size": "small"|"medium"|"large", "image_url": text }]

-- Reuse the existing public vendor-assets bucket (already created in
-- phase-4-7) rather than standing up a new one. Anon customers may upload
-- into the custom-tee-designs/ prefix only — same constrained-path pattern
-- as the existing "public upload review photos" policy.
drop policy if exists "public upload custom tee designs" on storage.objects;
create policy "public upload custom tee designs" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'vendor-assets'
    and split_part(objects.name, '/', 1) = 'custom-tee-designs'
  );
