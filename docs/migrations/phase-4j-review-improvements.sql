-- Phase 4J — Review Improvements
-- Apply in Supabase Dashboard → SQL Editor

alter table reviews
  add column if not exists photo_url text,
  add column if not exists vendor_reply text,
  add column if not exists vendor_replied_at timestamptz,
  add column if not exists helpful_count integer not null default 0,
  add column if not exists reported boolean not null default false;

-- RLS: anyone can increment helpful_count
create policy "increment helpful count"
  on reviews for update
  using (true)
  with check (true);
