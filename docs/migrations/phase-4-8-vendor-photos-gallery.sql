-- Phase 4.8 — Fix 2: multi-photo vendor gallery.
-- Applied to live project pqzygehnnojdttmqadrz via apply_migration.
-- A vendor can attach many photos (stored at {vendor_id}/gallery/*.webp in the
-- vendor-assets bucket); anyone can view them on the public storefront.

create table if not exists public.vendor_photos (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists vendor_photos_vendor_idx
  on public.vendor_photos(vendor_id, sort_order, created_at);

alter table public.vendor_photos enable row level security;

drop policy if exists "public read vendor photos" on public.vendor_photos;
create policy "public read vendor photos" on public.vendor_photos
  for select to public using (true);

drop policy if exists "vendor insert own photos" on public.vendor_photos;
create policy "vendor insert own photos" on public.vendor_photos
  for insert to authenticated
  with check (exists (
    select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()
  ));

drop policy if exists "vendor update own photos" on public.vendor_photos;
create policy "vendor update own photos" on public.vendor_photos
  for update to authenticated
  using (exists (
    select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()
  ));

drop policy if exists "vendor delete own photos" on public.vendor_photos;
create policy "vendor delete own photos" on public.vendor_photos
  for delete to authenticated
  using (exists (
    select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()
  ));

do $$ begin
  alter publication supabase_realtime add table public.vendor_photos;
exception when duplicate_object then null; end $$;
alter table public.vendor_photos replica identity full;
