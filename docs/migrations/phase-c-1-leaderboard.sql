-- Phase C.1 — KullaCoin leaderboard + achievements (songs-mastered board).
-- Real cross-device board. Honest scope: the play-to-reveal answer is shown, so
-- this ranks COLLECTION / persistence, not competitive skill (a cheat-resistant
-- "daily hidden-song" mode is the future skill board). No real-money reward:
-- the winner earns a free-food *coupon* that a participating vendor honors — a
-- contest prize, not currency, and only valid once a vendor backs it.
--
-- Security: rows are owner-only (auth.uid()); the public board is served through
-- a security-definer aggregate RPC so nobody reads another player's raw rows.

create table if not exists public.kulla_players (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player',
  updated_at   timestamptz not null default now()
);
alter table public.kulla_players enable row level security;
drop policy if exists "players read own" on public.kulla_players;
create policy "players read own" on public.kulla_players for select to authenticated using (user_id = auth.uid());
drop policy if exists "players insert own" on public.kulla_players;
create policy "players insert own" on public.kulla_players for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "players update own" on public.kulla_players;
create policy "players update own" on public.kulla_players for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.kulla_solves (
  user_id    uuid not null references auth.users(id) on delete cascade,
  level      int  not null check (level >= 0 and level < 100000),
  created_at timestamptz not null default now(),
  primary key (user_id, level)
);
alter table public.kulla_solves enable row level security;
drop policy if exists "solves read own" on public.kulla_solves;
create policy "solves read own" on public.kulla_solves for select to authenticated using (user_id = auth.uid());
drop policy if exists "solves insert own" on public.kulla_solves;
create policy "solves insert own" on public.kulla_solves for insert to authenticated with check (user_id = auth.uid());

-- Public board: top players by songs mastered (name is player-chosen, no PII).
create or replace function public.kulla_leaderboard(p_limit int default 20)
returns table(display_name text, songs int, rnk int)
language sql security definer set search_path = public as $$
  select display_name, songs,
         (row_number() over (order by songs desc, first_solve asc))::int as rnk
  from (
    select coalesce(p.display_name, 'Player') as display_name,
           count(*)::int as songs, min(s.created_at) as first_solve
    from public.kulla_solves s
    left join public.kulla_players p on p.user_id = s.user_id
    group by s.user_id, p.display_name
  ) t
  order by songs desc, first_solve asc
  limit greatest(1, least(p_limit, 100));
$$;
grant execute on function public.kulla_leaderboard(int) to anon, authenticated;

create or replace function public.kulla_my_songs()
returns int language sql security definer set search_path = public as $$
  select count(*)::int from public.kulla_solves where user_id = auth.uid();
$$;
grant execute on function public.kulla_my_songs() to authenticated;
