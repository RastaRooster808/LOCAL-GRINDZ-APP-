-- Phase 4.6 — Realtime + payment-sent RPC (bug-fix pass: Maya + Leilani)
-- Applied to the live DB 2026-07-21.

-- BUG (Maya trust / Leilani vendor): the supabase_realtime publication was EMPTY,
-- so NOTHING updated live — customer order-tracking never moved despite the UI
-- promising "🔴 updates live", and vendors never saw new orders without refreshing.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
alter table public.orders replica identity full;

-- BUG (Maya conversion): customer "I've sent the payment" wrote an anon UPDATE that
-- RLS denied — it silently no-oped, so the vendor never saw the "customer says sent"
-- signal. Narrow security-definer RPC only flips unpaid→marked_paid for one order id.
-- Vendor still verifies real receipt via "Confirm Received" (billing source of truth).
create or replace function public.mark_order_payment_sent(p_order_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update orders set payment_status = 'marked_paid'
  where id = p_order_id and payment_status = 'unpaid';
$$;
grant execute on function public.mark_order_payment_sent(uuid) to anon, authenticated;

-- FINDING (not fixed here — needs its own change): the vendor_messages table does
-- not exist on the live DB (Phase 4L messaging migration never applied), so the
-- vendor↔customer chat / inbox feature is entirely non-functional. Re-apply
-- docs/migrations/phase-4l-messaging.sql before shipping that feature.