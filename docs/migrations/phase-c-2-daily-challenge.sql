-- Phase C.2 — KullaCoin Daily Challenge (Heardle-for-melodies).
-- A single hidden 4-colour song per day, shared by everyone. The target is
-- SERVER-HELD and never sent to clients: kulla_daily has RLS enabled with NO
-- policies, so only the security-definer guess RPC (which bypasses RLS) can read
-- it. Clients submit guesses; the RPC returns Wordle-style feedback (green /
-- yellow / grey) but never the answer — the cheat-resistant core. Max 6 guesses.
-- Ranking is by fewest guesses, then earliest solve.

create table if not exists public.kulla_daily (
  day        date primary key,
  target     text not null,
  created_at timestamptz not null default now()
);
alter table public.kulla_daily enable row level security;  -- no policies ⇒ hidden from all clients

create table if not exists public.kulla_daily_results (
  user_id   uuid not null references auth.users(id) on delete cascade,
  day       date not null,
  guesses   int  not null default 0,
  solved    boolean not null default false,
  solved_at timestamptz,
  primary key (user_id, day)
);
alter table public.kulla_daily_results enable row level security;
drop policy if exists "daily read own" on public.kulla_daily_results;
create policy "daily read own" on public.kulla_daily_results
  for select to authenticated using (user_id = auth.uid());
-- writes happen only through the security-definer RPCs below (no client insert/update policy)

-- Submit a guess. Returns { done, solved, guesses, feedback } — never the target.
create or replace function public.kulla_daily_guess(p_guess text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_day date := current_date;
  v_target text;
  v_guesses int := 0;
  v_solved boolean := false;
  v_fb text[] := array['b','b','b','b'];
  v_cnt int[] := array[0,0,0,0];
  i int; ci int; v_green int := 0;
begin
  if p_guess is null or p_guess !~ '^[0-3]{4}$' then
    raise exception 'invalid guess';
  end if;
  insert into public.kulla_daily(day, target)
    values (v_day, (select string_agg(floor(random()*4)::int::text, '') from generate_series(1,4)))
    on conflict (day) do nothing;
  select target into v_target from public.kulla_daily where day = v_day;
  select guesses, solved into v_guesses, v_solved
    from public.kulla_daily_results where user_id = auth.uid() and day = v_day;
  v_guesses := coalesce(v_guesses, 0);
  v_solved := coalesce(v_solved, false);
  if v_solved or v_guesses >= 6 then
    return jsonb_build_object('done', true, 'solved', v_solved, 'guesses', v_guesses, 'feedback', null);
  end if;
  for i in 1..4 loop ci := substr(v_target, i, 1)::int; v_cnt[ci+1] := v_cnt[ci+1] + 1; end loop;
  for i in 1..4 loop
    if substr(p_guess, i, 1) = substr(v_target, i, 1) then
      v_fb[i] := 'g'; ci := substr(p_guess, i, 1)::int; v_cnt[ci+1] := v_cnt[ci+1] - 1; v_green := v_green + 1;
    end if;
  end loop;
  for i in 1..4 loop
    if v_fb[i] <> 'g' then
      ci := substr(p_guess, i, 1)::int;
      if v_cnt[ci+1] > 0 then v_fb[i] := 'y'; v_cnt[ci+1] := v_cnt[ci+1] - 1; end if;
    end if;
  end loop;
  v_guesses := v_guesses + 1;
  v_solved := (v_green = 4);
  insert into public.kulla_daily_results(user_id, day, guesses, solved, solved_at)
    values (auth.uid(), v_day, v_guesses, v_solved, case when v_solved then now() else null end)
    on conflict (user_id, day) do update
      set guesses = excluded.guesses, solved = excluded.solved,
          solved_at = case when excluded.solved and kulla_daily_results.solved_at is null then now() else kulla_daily_results.solved_at end;
  return jsonb_build_object('done', v_solved or v_guesses >= 6, 'solved', v_solved, 'guesses', v_guesses, 'feedback', array_to_string(v_fb, ''));
end $$;
-- Postgres grants EXECUTE to PUBLIC by default; revoke so only signed-in users can guess.
revoke execute on function public.kulla_daily_guess(text) from public, anon;
grant execute on function public.kulla_daily_guess(text) to authenticated;

-- Your current state today (for restore), plus how many played.
create or replace function public.kulla_daily_state()
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'guesses', coalesce((select guesses from public.kulla_daily_results where user_id = auth.uid() and day = current_date), 0),
    'solved',  coalesce((select solved  from public.kulla_daily_results where user_id = auth.uid() and day = current_date), false),
    'players', (select count(*) from public.kulla_daily_results where day = current_date)
  );
$$;
revoke execute on function public.kulla_daily_state() from public, anon;
grant execute on function public.kulla_daily_state() to authenticated;

-- Today's board: solvers ranked by fewest guesses, then earliest.
create or replace function public.kulla_daily_board(p_limit int default 15)
returns table(display_name text, guesses int, rnk int)
language sql security definer set search_path = public as $$
  select display_name, guesses, (row_number() over (order by guesses asc, solved_at asc))::int
  from (
    select coalesce(p.display_name, 'Player') as display_name, r.guesses, r.solved_at
    from public.kulla_daily_results r
    left join public.kulla_players p on p.user_id = r.user_id
    where r.day = current_date and r.solved
  ) t
  order by guesses asc, solved_at asc
  limit greatest(1, least(p_limit, 100));
$$;
grant execute on function public.kulla_daily_board(int) to anon, authenticated;
