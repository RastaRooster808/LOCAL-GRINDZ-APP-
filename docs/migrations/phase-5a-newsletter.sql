-- Phase 5A — Newsletter signups
-- Apply in Supabase Dashboard → SQL Editor

create table if not exists newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'landing',   -- 'landing' | 'storefront' | 'checkout'
  tags text[] not null default '{}',         -- e.g. {'vendor','wholesale','prints'}
  created_at timestamptz not null default now(),
  constraint newsletter_signups_email_key unique (email)
);

create index if not exists idx_newsletter_source on newsletter_signups(source);

alter table newsletter_signups enable row level security;

create policy "anyone can sign up" on newsletter_signups for insert with check (true);
-- No select/update/delete policy — managed server-side only
