-- Phase 5.e — Seed vendor: Uncle Robert's Awa Bar & Farmers Market (Kalapana)
-- Idempotent: upserts by slug; the location inserts only when missing.
-- Run as a migration (service role).
--
-- A VENUE, NOT A KITCHEN. Uncle Robert's hosts food vendors; it does not sell a
-- menu of its own, so this seed deliberately creates NO menu_items. With an
-- empty menu, src/pages/Storefront.tsx now hides the Menu and Place Order
-- sections, so the listing never invites an order nobody can fill.
--
-- NOT RECORDED, because uncleroberts.website could not be reached to confirm
-- them: street address, market nights, hours, phone, contact email, socials.
-- The location is seeded 'closed' rather than asserting the market is on
-- tonight. Confirm with the ʻohana before promoting it.

-- ── Vendor ───────────────────────────────────────────────────────────────
-- cuisine_type must contain a 'markets' match from src/lib/marketplace.ts —
-- 'Farmers Market · Awa Bar' hits both 'market' and 'farm'.
insert into vendors (slug, name, email, cuisine_type, description, neighborhood, is_active)
values
  ('uncle-roberts', 'Uncle Robert''s Awa Bar & Farmers Market',
   'bankspham5+uncleroberts@gmail.com', 'Farmers Market · Awa Bar',
   'A Kalapana institution on the Red Road — the Keliʻihoʻomalu ʻohana''s awa bar, night market and gathering place, with local food vendors, crafts, and live music.',
   'Kalapana', true)
on conflict (slug) do update
  set name = excluded.name,
      cuisine_type = excluded.cuisine_type,
      description = excluded.description,
      neighborhood = excluded.neighborhood,
      is_active = true;

-- ── Location ─────────────────────────────────────────────────────────────
insert into locations (vendor_id, name, address, hours, status)
select v.id, 'Kalapana — market nights to be confirmed', null, null, 'closed'
from vendors v
where v.slug = 'uncle-roberts'
  and not exists (select 1 from locations l where l.vendor_id = v.id);

-- No menu_items by design. See the header.
