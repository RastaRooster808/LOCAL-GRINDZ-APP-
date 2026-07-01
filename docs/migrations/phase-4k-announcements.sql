-- Phase 4K — Platform Announcements
-- Apply in Supabase Dashboard → SQL Editor

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Public read, admin write (enforced at application level via admins table check)
alter table announcements enable row level security;
create policy "public read announcements"
  on announcements for select
  using (true);

create policy "admin insert announcements"
  on announcements for insert
  with check (true);

create policy "admin update announcements"
  on announcements for update
  using (true);

create policy "admin delete announcements"
  on announcements for delete
  using (true);
