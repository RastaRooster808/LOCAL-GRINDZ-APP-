-- Phase 4M — Web Push Subscriptions
-- Apply in Supabase Dashboard → SQL Editor

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_type text not null check (user_type in ('vendor', 'customer')),
  user_ref text not null,         -- vendor_id (uuid text) or customer_email
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

create index if not exists idx_push_subs_user on push_subscriptions(user_type, user_ref);

alter table push_subscriptions enable row level security;

create policy "anyone can subscribe" on push_subscriptions for insert with check (true);
create policy "anyone can read own" on push_subscriptions for select using (true);
create policy "anyone can delete own" on push_subscriptions for delete using (true);
