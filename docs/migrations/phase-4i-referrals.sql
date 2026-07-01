-- Phase 4I — Customer Referral System
-- Apply in Supabase Dashboard → SQL Editor

-- Referral codes: one per customer (auto-generated)
create table if not exists referral_codes (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null unique,
  code text unique not null,               -- e.g. "KAI-7X4Q"
  uses integer not null default 0,
  points_earned integer not null default 0,
  created_at timestamptz not null default now()
);

-- Referral redemptions: track who used which code
create table if not exists referral_uses (
  id uuid primary key default gen_random_uuid(),
  code text not null references referral_codes(code),
  referee_email text not null,
  order_id uuid,                           -- order that triggered the reward
  referrer_pts integer not null default 50,
  referee_pts integer not null default 25,
  created_at timestamptz not null default now(),
  unique(referee_email)                    -- each email can only redeem once
);

-- RLS: customers can read their own referral code by email
alter table referral_codes enable row level security;
create policy "read own referral code"
  on referral_codes for select
  using (true);                            -- public so storefront can validate codes

create policy "insert own referral code"
  on referral_codes for insert
  with check (true);                       -- validated by client email ownership

alter table referral_uses enable row level security;
create policy "read referral uses"
  on referral_uses for select
  using (true);

create policy "insert referral use"
  on referral_uses for insert
  with check (true);

-- Index for fast code lookups
create index if not exists idx_referral_codes_code on referral_codes(code);
create index if not exists idx_referral_uses_referee on referral_uses(referee_email);
