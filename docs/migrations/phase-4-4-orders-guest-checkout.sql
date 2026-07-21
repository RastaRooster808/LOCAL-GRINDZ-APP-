-- Phase 4.4 — Orders schema completion + guest-checkout RLS fix
-- Applied to the live DB 2026-07-21 during KaRas end-to-end order test.
-- These two fixes make guest checkout actually work; before them, NO order
-- could be placed by a logged-out customer (the flow's normal case).

-- 1. Phase 4C lifecycle columns were never applied to the live orders table.
--    Without customer_email, any checkout that submits an email errored outright.
alter table orders
  add column if not exists accepted_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists estimated_minutes integer,
  add column if not exists cancellation_reason text,
  add column if not exists customer_email text;

-- 2. Guest checkout read-back.
--    The app does insert(...).select('id') and the order-tracking page reads the
--    order by id. INSERT...RETURNING applies the SELECT policy to the new row, and
--    there was no anon SELECT policy on orders (only a vendor-scoped one) — so a
--    guest's order failed to place AND could not be tracked. Order ids are
--    unguessable UUIDs the app already treats as bearer links.
--
--    TRADEOFF: using(true) permits table enumeration by anon (customer names/
--    emails/totals). Acceptable for the pre-launch MVP; the hardening path is a
--    security-definer place_order()/get_order(id) RPC pair that removes enumeration
--    while keeping guest checkout. Tracked as a follow-up.
drop policy if exists "public read order by link" on orders;
create policy "public read order by link" on orders
  for select
  to public
  using (true);

-- Verified end-to-end 2026-07-21 (KaRas):
--   guest places order (anon insert+select) → order tracking read (anon select)
--   → vendor accepts (auth update: status/accepted_at/estimated_minutes)
--   → vendor confirms payment (auth update: payment_status='confirmed')
--   → vendor_monthly_statements reflects confirmed prepaid volume.
-- Test orders removed after the run.