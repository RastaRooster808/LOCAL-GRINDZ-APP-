-- Local Grindz Phase 4d: Image Storage
-- Run in Supabase → SQL Editor

-- Add logo_url to vendors (banner already covered by photo_url)
alter table vendors
  add column if not exists logo_url text;

-- Add photo_url to menu_items if not exists
alter table menu_items
  add column if not exists photo_url text;

-- ── Storage bucket (run once in Supabase Dashboard or via CLI) ──────────────
-- 1. Go to Storage → New bucket
-- 2. Name: vendor-assets
-- 3. Toggle: Public bucket (so URLs are readable without auth)
-- ─────────────────────────────────────────────────────────────────────────────

-- Storage RLS policies (applies after bucket is created)
-- Allow authenticated vendors to upload their own assets
-- Path convention: {vendor_id}/logo.webp | {vendor_id}/banner.webp | {vendor_id}/menu/{item_id}.webp

create policy "vendors upload own assets"
  on storage.objects for insert
  with check (
    bucket_id = 'vendor-assets'
    and auth.uid() is not null
    and exists (
      select 1 from vendors
      where id::text = split_part(name, '/', 1)
      and email = auth.email()
    )
  );

create policy "vendors update own assets"
  on storage.objects for update
  using (
    bucket_id = 'vendor-assets'
    and auth.uid() is not null
    and exists (
      select 1 from vendors
      where id::text = split_part(name, '/', 1)
      and email = auth.email()
    )
  );

create policy "public read vendor assets"
  on storage.objects for select
  using (bucket_id = 'vendor-assets');
