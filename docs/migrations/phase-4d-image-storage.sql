-- Local Grindz Phase 4d: Image Storage
-- Run in Supabase → SQL Editor

-- Add logo_url to vendors (banner already covered by photo_url)
alter table vendors
  add column if not exists logo_url text;

-- Add photo_url to menu_items if not exists
alter table menu_items
  add column if not exists photo_url text;

-- Tie vendors to their auth user by UID (immutable, unlike email).
-- Populate from auth.users on first run; new vendors get it on INSERT via trigger.
alter table vendors
  add column if not exists user_id uuid references auth.users(id);

-- Backfill existing vendor rows where email matches an auth user
update vendors v
set user_id = u.id
from auth.users u
where u.email = v.email
  and v.user_id is null;

-- Auto-set user_id on new vendor inserts (when invited vendor first logs in)
create or replace function set_vendor_user_id()
returns trigger language plpgsql security definer as $$
begin
  if new.user_id is null then
    new.user_id := (select id from auth.users where email = new.email limit 1);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vendor_user_id on vendors;
create trigger trg_vendor_user_id
  before insert on vendors
  for each row execute function set_vendor_user_id();

-- ── Storage bucket (run once in Supabase Dashboard or via CLI) ──────────────
-- 1. Go to Storage → New bucket
-- 2. Name: vendor-assets
-- 3. Toggle: Public bucket (so URLs are readable without auth)
-- ─────────────────────────────────────────────────────────────────────────────

-- Storage RLS policies for bucket: vendor-assets
-- Path convention: {vendor_id}/logo.webp | {vendor_id}/banner.webp | {vendor_id}/menu/{item_id}.webp
-- Ownership: vendors.user_id = auth.uid() — immutable, survives email changes

create policy "vendors upload own assets"
  on storage.objects for insert
  with check (
    bucket_id = 'vendor-assets'
    and exists (
      select 1 from vendors
      where id::text = split_part(name, '/', 1)
        and user_id = auth.uid()
    )
  );

create policy "vendors update own assets"
  on storage.objects for update
  using (
    bucket_id = 'vendor-assets'
    and exists (
      select 1 from vendors
      where id::text = split_part(name, '/', 1)
        and user_id = auth.uid()
    )
  );

create policy "vendors delete own assets"
  on storage.objects for delete
  using (
    bucket_id = 'vendor-assets'
    and exists (
      select 1 from vendors
      where id::text = split_part(name, '/', 1)
        and user_id = auth.uid()
    )
  );

create policy "public read vendor assets"
  on storage.objects for select
  using (bucket_id = 'vendor-assets');
