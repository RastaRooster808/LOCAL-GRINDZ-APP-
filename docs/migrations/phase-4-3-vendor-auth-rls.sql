-- Phase 4.3 — Vendor auth linkage + missing UPDATE RLS policies
-- Applied to the live DB 2026-07-21 during KaRas onboarding. Committed here so a
-- fresh environment reproduces the intended schema.
--
-- Discovered as schema drift: the app code (VendorDashboard lazy-backfill) and the
-- auth.uid() storage RLS both reference vendors.user_id, but the column was never
-- applied to the live vendors table. Separately, `orders` had RLS enabled with only
-- INSERT + SELECT policies — silently denying every vendor status update
-- (accept/preparing/ready/cancel) and the Phase 4.2 payment confirmation.

-- 1. vendors.user_id (intended; backfilled by email)
alter table vendors
  add column if not exists user_id uuid references auth.users(id);
create index if not exists idx_vendors_user_id on vendors(user_id);
update vendors v
  set user_id = u.id
  from auth.users u
  where v.user_id is null and v.email = u.email;

-- 2. Vendors can update their own profile row (payment handles, description, images)
drop policy if exists "vendor update own" on vendors;
create policy "vendor update own" on vendors
  for update
  using (email = auth.email())
  with check (email = auth.email());

-- 3. Vendors can update their own orders (status lifecycle + payment confirm)
drop policy if exists "vendor update own orders" on orders;
create policy "vendor update own orders" on orders
  for update
  using (vendor_id = (select id from vendors where email = auth.email()))
  with check (vendor_id = (select id from vendors where email = auth.email()));

-- NOTE — vendor login users are created via the Supabase Auth admin (dashboard or
-- admin API), NOT committed here (never store passwords in the repo). KaRas's login
-- (bankspham5+karas@gmail.com) was provisioned directly against the live project.
--
-- KNOWN FOLLOW-UP — the customer "I've sent the payment" button (order tracking)
-- writes payment_status='marked_paid' as an anon user; there is no anon UPDATE
-- policy, so that write is denied and the button only flips local UI state. The
-- billing-critical path (vendor "Confirm Received") works. Harden later with either
-- a scoped anon policy or an edge function.