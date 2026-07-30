-- Phase 4.11 — monthly community raffle / donation drawing.
-- Applied to live project pqzygehnnojdttmqadrz.
--
-- Model: the platform never holds funds. A $1 entry deep-links to the org's own
-- Venmo/PayPal/Cash App (same as vendor payments). Entrants are recorded so
-- there's a list to draw from; entrant PII is insert-only for the public and
-- readable only to authenticated admins.

create table if not exists public.raffles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  org_name text not null,
  title text not null default 'Monthly Community Drawing',
  description text,
  prize text,
  price numeric(10,2) not null default 1.00,
  payment_method text,              -- 'venmo' | 'paypal' | 'cashapp'
  payment_handle text,
  draw_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.raffle_entries (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);
create index if not exists raffle_entries_raffle_idx on public.raffle_entries(raffle_id, created_at);

alter table public.raffles enable row level security;
alter table public.raffle_entries enable row level security;

drop policy if exists "public read active raffles" on public.raffles;
create policy "public read active raffles" on public.raffles
  for select to public using (is_active);

drop policy if exists "public enter raffle" on public.raffle_entries;
create policy "public enter raffle" on public.raffle_entries
  for insert to anon, authenticated with check (true);

drop policy if exists "authenticated read entries" on public.raffle_entries;
create policy "authenticated read entries" on public.raffle_entries
  for select to authenticated using (true);

insert into public.raffles (slug, org_name, title, description, prize, price, is_active)
values (
  'ekalesia-hoole-pope-kekaha',
  'Ekalesia Hoʻole Pope o Kekaha',
  'Monthly Community Drawing',
  'Support the Ekalesia Hoʻole Pope o Kekaha — a Hawaiian Protestant church in Kekaha, Kauaʻi. Each $1 donation enters you in the monthly thank-you drawing.',
  'To be announced',
  1.00,
  true
)
on conflict (slug) do nothing;
