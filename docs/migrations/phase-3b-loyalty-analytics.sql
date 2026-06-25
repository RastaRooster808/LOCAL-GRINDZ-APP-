-- Local Grindz Phase 3b Migration: Loyalty + Analytics
-- Run in Supabase → SQL Editor

-- ── Customer loyalty points ledger ──────────────────────────────────────────
create table if not exists customer_points (
  id uuid primary key default uuid_generate_v4(),
  customer_email text not null,
  vendor_id uuid references vendors(id),
  order_id uuid references orders(id),
  points integer not null,          -- positive = earned, negative = redeemed
  reason text not null default 'purchase', -- 'purchase' | 'review' | 'redemption'
  created_at timestamptz default now(),
  -- Basic sanity constraints to limit spoofing via the anon key
  constraint chk_reason check (reason in ('purchase', 'review', 'redemption')),
  constraint chk_points_review check (reason != 'review' or points = 5),
  constraint chk_points_redemption check (reason != 'redemption' or points < 0),
  constraint chk_points_purchase check (reason != 'purchase' or (points > 0 and points <= 5000))
);

alter table customer_points enable row level security;

-- Constrained insert: only valid reason/points combinations get through.
-- Balance reads go through the SECURITY DEFINER RPC, not direct SELECT.
create policy "public insert points" on customer_points
  for insert with check (
    reason in ('purchase', 'review', 'redemption')
    and customer_email = lower(customer_email)
  );

-- No public SELECT — balances are read via get_points_balance() RPC (security definer).
-- Vendors can view points earned at their stall.
create policy "vendor read own customer points" on customer_points
  for select using (
    vendor_id = (select id from vendors where email = auth.email())
  );

-- ── Vendor page-view events (lightweight analytics) ──────────────────────────
create table if not exists vendor_events (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id) on delete cascade,
  event_type text not null default 'page_view',
  source text,        -- 'qr' | 'direct' | 'directory'
  created_at timestamptz default now()
);

alter table vendor_events enable row level security;

-- Anyone can insert events (page-view tracking)
create policy "public insert events" on vendor_events
  for insert with check (true);

-- Vendors read their own events
create policy "vendor read own events" on vendor_events
  for select using (
    vendor_id = (select id from vendors where email = auth.email())
  );

-- ── Helper: get points balance for an email ───────────────────────────────────
-- SECURITY DEFINER bypasses RLS so customers can check their own balance
-- without needing a public SELECT policy on the full table.
create or replace function get_points_balance(p_email text)
returns integer
language sql
security definer
as $$
  select coalesce(sum(points), 0)::integer
  from customer_points
  where customer_email = lower(p_email);
$$;
