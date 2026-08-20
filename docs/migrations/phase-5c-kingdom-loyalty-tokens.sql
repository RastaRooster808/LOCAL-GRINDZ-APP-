-- Phase 5c — Kingdom-themed loyalty tokens for the weekly Kalapana market booth.
--
-- Plain loyalty punch-card, not currency: a color is a thank-you for a visit,
-- redeemable only for whatever the vendor decides in person (e.g. a free
-- plate after collecting all 4 colors). No cash value, no backing claim,
-- no cryptographic verification — just a record of visits, same spirit as
-- a paper punch card. Public insert so staff can log a visit from a phone
-- at the booth with no login; only admins can mark a token redeemed.

create table if not exists public.kingdom_loyalty_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  color text not null check (color in ('blue', 'gold', 'red', 'purple')),
  market_note text, -- e.g. "Uncle Robert's Wednesday Market, Kalapana"
  customer_name text not null,
  customer_contact text, -- phone or email, optional, used for the "my tokens" lookup
  redeemed boolean not null default false,
  redeemed_at timestamptz,
  redeemed_note text
);

alter table public.kingdom_loyalty_tokens enable row level security;

create policy "public log a visit" on public.kingdom_loyalty_tokens
  for insert with check (true);

create policy "admin mark redeemed" on public.kingdom_loyalty_tokens
  for update using (
    exists (select 1 from admins where id = auth.uid())
  );

-- No public SELECT policy — the table isn't browsable, so one customer can't
-- scrape another's name/phone. Lookup goes through this function instead,
-- which only ever returns rows matching the exact contact you already know
-- (same shape as the existing get_points_balance RPC).
create or replace function public.get_kingdom_tokens(p_contact text)
returns table (id uuid, color text, created_at timestamptz, redeemed boolean, market_note text)
language sql
security definer
set search_path = public
as $$
  select id, color, created_at, redeemed, market_note
  from public.kingdom_loyalty_tokens
  where customer_contact = lower(trim(p_contact))
  order by created_at desc;
$$;

grant execute on function public.get_kingdom_tokens(text) to anon, authenticated;
