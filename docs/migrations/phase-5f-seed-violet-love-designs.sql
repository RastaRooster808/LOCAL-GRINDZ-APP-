-- Phase 5.f — Seed vendor: Violet Love Designs (art & lauhala weaving, Pāhoa)
-- Idempotent: upserts by slug; the location inserts only when missing.
-- Run as a migration (service role).
--
-- THE EMAIL IS DELIBERATE AND DIFFERENT FROM THE OTHERS. Every prior vendor uses
-- a bankspham5+slug alias so the operator holds the dashboard. This one uses the
-- artist's own address, because vendor RLS matches on
--   vendors.email = auth.email()
-- (see phase-4-3-vendor-auth-rls.sql), and vendors.user_id backfills from it.
-- Setting it here is what lets Violet sign in at /vendor and manage her own
-- profile, hours and orders.
--
-- THE LOGIN ITSELF IS NOT CREATED HERE. Vendor auth users are provisioned through
-- the Supabase Auth admin, never committed — the app uses signInWithPassword, so
-- committing anything here would mean committing a credential. After the auth
-- user exists with this address, re-run the user_id backfill in
-- phase-4-3-vendor-auth-rls.sql, or simply:
--   update vendors v set user_id = u.id from auth.users u
--    where v.slug = 'violet-love-designs' and v.user_id is null and v.email = u.email;
--
-- SOURCING: the business, its craft and the gallery come from Violet Love
-- Designs' own public listings. The street address and phone come from directory
-- listings read through search — violetlovedesign.com and the Puna Kai tenant
-- page are both blocked by this environment's egress proxy, so neither was read
-- first-hand. Confirm both before promoting. No prices are recorded, so no
-- menu_items: the storefront hides Menu and Place Order when a vendor has none.

-- ── Vendor ───────────────────────────────────────────────────────────────
-- cuisine_type must contain a 'makers' match from src/lib/marketplace.ts —
-- 'Art & Lauhala Weaving' hits 'art'.
insert into vendors (slug, name, email, contact_email, phone, cuisine_type, description, neighborhood, is_active)
values
  ('violet-love-designs', 'Violet Love Designs',
   'violetpainstheworld@gmail.com', 'violetpainstheworld@gmail.com', '(808) 731-6679',
   'Art & Lauhala Weaving',
   'Contemporary art and Hawaiian craft from Pāhoa — coconut and lauhala weaving handmade on the Big Island, fine art, prints and island jewelry. Violet Loves Art Gallery at Puna Kai gives local artists a place to show and sell, and weaving classes run most weekends.',
   'Pāhoa', true)
on conflict (slug) do update
  set name = excluded.name,
      email = excluded.email,
      contact_email = excluded.contact_email,
      phone = excluded.phone,
      cuisine_type = excluded.cuisine_type,
      description = excluded.description,
      neighborhood = excluded.neighborhood,
      is_active = true;

-- ── Location ─────────────────────────────────────────────────────────────
-- Seeded 'closed': the class days are known, the gallery's own hours are not,
-- and that badge means "open right now".
insert into locations (vendor_id, name, address, hours, status)
select v.id,
       'Violet Loves Art Gallery — Puna Kai Shopping Center',
       '15-2714 Pahoa Village Rd, Unit J1, Pāhoa, HI 96778',
       'Lauhala weaving Saturdays · Coconut weaving Sundays — gallery hours to be confirmed',
       'closed'
from vendors v
where v.slug = 'violet-love-designs'
  and not exists (select 1 from locations l where l.vendor_id = v.id);

-- No menu_items: no prices confirmed. The papale (woven coconut-leaf hat) is
-- their best seller and the weaving classes are bookable, but nothing here
-- asserts a price nobody has verified.
