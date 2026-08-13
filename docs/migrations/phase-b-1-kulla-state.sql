-- Phase B.1 — KullaCoin cloud save (accounts + server-owned state).
-- A per-user JSONB blob of the KullaCoin localStorage snapshot (wallet, progress,
-- loops, best times). Cloud save so progress follows a signed-in player across
-- devices. Scoped strictly to the owner via RLS (auth.uid()), never auth.email().
--
-- This is deliberately a simple key/value blob — NOT the normalized, verified
-- model from the server-phase spec (that lands with the leaderboard + replay
-- verification). It gives real cross-device save now, with no trust placed in
-- the client for anything of value (there is no leaderboard yet).

create table if not exists public.kulla_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kulla_state enable row level security;

-- Owner-only read
drop policy if exists "kulla read own" on public.kulla_state;
create policy "kulla read own" on public.kulla_state
  for select to authenticated
  using (user_id = auth.uid());

-- Owner-only insert
drop policy if exists "kulla insert own" on public.kulla_state;
create policy "kulla insert own" on public.kulla_state
  for insert to authenticated
  with check (user_id = auth.uid());

-- Owner-only update
drop policy if exists "kulla update own" on public.kulla_state;
create policy "kulla update own" on public.kulla_state
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- anon has no access at all (no policy granted to anon) — logged-out play stays
-- entirely on-device; nothing is transmitted.
