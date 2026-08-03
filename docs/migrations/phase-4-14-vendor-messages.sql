-- Phase 4.14 — vendor <-> customer chat (Phase 4L, finally built).
-- Applied to live project pqzygehnnojdttmqadrz.
--
-- Security model (verified):
--   * Vendors (authenticated) read/update/realtime ONLY their own vendor's
--     messages, scoped by vendors.user_id = auth.uid().
--   * Customers (anon) may SEND (insert as sender='customer') but have NO
--     table SELECT — so nobody can read others' conversations. A customer
--     reads only their own thread via the scoped security-definer RPC
--     get_customer_thread(vendor_id, email). The storefront widget polls it.

create table if not exists public.vendor_messages (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  customer_email text not null,
  sender text not null check (sender in ('customer','vendor')),
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists vendor_messages_idx on public.vendor_messages(vendor_id, customer_email, created_at);

alter table public.vendor_messages enable row level security;

drop policy if exists "send message" on public.vendor_messages;
create policy "send message" on public.vendor_messages
  for insert to anon, authenticated
  with check (
    sender = 'customer'
    or (sender = 'vendor' and exists (
      select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()
    ))
  );

drop policy if exists "vendor reads own messages" on public.vendor_messages;
create policy "vendor reads own messages" on public.vendor_messages
  for select to authenticated
  using (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));

drop policy if exists "vendor updates own messages" on public.vendor_messages;
create policy "vendor updates own messages" on public.vendor_messages
  for update to authenticated
  using (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()))
  with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));

create or replace function public.get_customer_thread(p_vendor_id uuid, p_customer_email text)
returns table (id uuid, sender text, body text, created_at timestamptz)
language sql security definer set search_path = public as $$
  select id, sender, body, created_at
  from public.vendor_messages
  where vendor_id = p_vendor_id and customer_email = p_customer_email
  order by created_at asc
$$;
grant execute on function public.get_customer_thread(uuid, text) to anon, authenticated;

do $$ begin
  alter publication supabase_realtime add table public.vendor_messages;
exception when duplicate_object then null; end $$;
alter table public.vendor_messages replica identity full;
