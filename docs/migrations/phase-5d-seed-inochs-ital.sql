-- Phase 5.d — Seed vendor: Inoch's Ital (Caribbean ital mobile kitchen)
-- Idempotent: upserts by slug; menu items and the location insert only when missing.
-- Run as a migration (service role).
--
-- SOURCE OF THE FACTS: a Facebook post ("Inoch's Ital mobile …Hawaiian style",
-- Jul 17 2025) whose photo shows the truck's own hand-painted menu board:
-- Veggie Burger $9, Breadfruit Fries $7, Red Lentil Curry Soup $8. Prices were
-- read off that sign and are over a year old — confirm before relying on them.
--
-- DELIBERATELY ABSENT, because nobody has confirmed them: neighborhood, street
-- address, hours, phone, contact email, socials, payment handles. The location
-- is seeded 'closed' rather than asserting the truck is open somewhere.
-- No photo either: the only image available is someone else's photograph.

-- ── Vendor ───────────────────────────────────────────────────────────────
-- email is NOT NULL + UNIQUE; plus-addressed so the owner can hand the
-- dashboard over if Inoch claims it.
-- cuisine_type must contain a foodtrucks match from src/lib/marketplace.ts —
-- 'Caribbean Ital · Vegan' hits both 'caribbean' and 'vegan'.
insert into vendors (slug, name, email, cuisine_type, description, neighborhood, is_active)
values
  ('inochs-ital', 'Inoch''s Ital', 'bankspham5+inochsital@gmail.com', 'Caribbean Ital · Vegan',
   'Caribbean ital cooking out of a hand-painted mobile kitchen — veggie burgers, breadfruit fries, and red lentil curry soup, all plant-based.',
   null, true)
on conflict (slug) do update
  set name = excluded.name,
      cuisine_type = excluded.cuisine_type,
      description = excluded.description,
      is_active = true;

-- ── Location ─────────────────────────────────────────────────────────────
-- Seeded 'closed' with no address: the truck is mobile and its schedule is
-- unconfirmed. Fill this in and flip to 'open' once you have talked to Inoch.
insert into locations (vendor_id, name, address, hours, status)
select v.id, 'Mobile — schedule to be confirmed', null, null, 'closed'
from vendors v
where v.slug = 'inochs-ital'
  and not exists (select 1 from locations l where l.vendor_id = v.id);

-- ── Menu ─────────────────────────────────────────────────────────────────
-- category is stored SINGULAR: src/pages/Storefront.tsx renders `{category}s`,
-- so 'main' displays as "Mains". Storing 'Mains' would render "Mainss".
insert into menu_items (vendor_id, name, description, price, category, available)
select v.id, x.item_name, x.item_desc, x.price, x.category, true
from vendors v
join (values
  ('Veggie Burger',         'House-made plant-based patty, Caribbean style.',      9.00, 'main'),
  ('Breadfruit Fries',      'ʻUlu cut and fried — a Caribbean-Hawaiian crossover.', 7.00, 'side'),
  ('Red Lentil Curry Soup', 'Red lentils simmered in island curry spice.',          8.00, 'soup')
) as x(item_name, item_desc, price, category) on true
where v.slug = 'inochs-ital'
  and not exists (
    select 1 from menu_items m where m.vendor_id = v.id and m.name = x.item_name
  );
