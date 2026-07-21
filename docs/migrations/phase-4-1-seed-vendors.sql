-- Phase 4.1 — Seed featured vendors: Ala's Kitchen, KaRas Freshly Baked, Golden Shot
-- Idempotent: upserts by slug; menu items / locations / specials insert only when missing.
-- Run as a migration (service role). Apply AFTER restoring the Supabase project.

-- ── Vendors ──────────────────────────────────────────────────────────────
-- email is NOT NULL + UNIQUE; plus-addressed variants keep dashboards claimable by the owner
insert into vendors (slug, name, email, cuisine_type, description, neighborhood, is_active)
values
  ('alas-kitchen', 'Ala''s Kitchen — Get Smashed', 'bankspham5+alas@gmail.com', 'Burger',
   'Hand-smashed patties, local beef, island-style toppings. Find the truck, order ahead, get smashed.',
   'Puna', true),
  ('karas-freshly-baked', 'KaRas Freshly Baked', 'bankspham5+karas@gmail.com', 'Bakery',
   'Warm artisan bakery on the lava: fresh sourdough, French bread, cookies, brownies, cinnamon rolls, banana bread, and seasonal specials. Baked in small batches — when it sells out, it sells out.',
   'Kalapana', true),
  ('golden-shot', 'Golden Shot', 'bankspham5+goldenshot@gmail.com', 'Wellness',
   'Turmeric, ginger, and island botanicals pressed into daily wellness shots. Singles, bundles, and a daily cleanse — subscription coming soon.',
   'Kalapana', true)
on conflict (slug) do update
  set name = excluded.name,
      cuisine_type = excluded.cuisine_type,
      description = excluded.description,
      is_active = true;

-- ── Locations ────────────────────────────────────────────────────────────
insert into locations (vendor_id, name, address, hours, status)
select v.id, x.loc_name, x.address, x.hours, 'closed'
from (values
  ('alas-kitchen',        'Kalapana Night Market', 'Kalapana, HI', 'Wed 5–9pm · Sat 11am–3pm'),
  ('karas-freshly-baked', 'KaRas Bake Stand',      'Kalapana, HI', 'Fri–Sun 8am–1pm (until sold out)'),
  ('golden-shot',         'KaRas Bake Stand',      'Kalapana, HI', 'Fri–Sun 8am–1pm')
) as x(slug, loc_name, address, hours)
join vendors v on v.slug = x.slug
where not exists (
  select 1 from locations l where l.vendor_id = v.id and l.name = x.loc_name
);

-- ── Menu items ───────────────────────────────────────────────────────────
-- KaRas Freshly Baked (available=false demonstrates the Sold Out indicator)
insert into menu_items (vendor_id, name, description, price, category, available)
select v.id, x.item, x.descr, x.price, x.cat, x.avail
from (values
  ('karas-freshly-baked', 'Fresh Sourdough Loaf', 'Naturally leavened, baked this morning. Today''s Fresh Bake.', 12.00, 'Bakery', true),
  ('karas-freshly-baked', 'French Bread',         'Crisp crust, soft crumb — baked daily.',                       8.00, 'Bakery', true),
  ('karas-freshly-baked', 'Cookies',              'Small-batch cookies, rotating flavors.',                        4.00, 'Bakery', true),
  ('karas-freshly-baked', 'Brownies',             'Fudgy, dense, dangerous.',                                      5.00, 'Bakery', true),
  ('karas-freshly-baked', 'Cinnamon Rolls',       'Weekend batch with island honey glaze.',                        6.00, 'Bakery', false),
  ('karas-freshly-baked', 'Banana Bread',         'Apple bananas from down the road.',                             9.00, 'Bakery', true),
  ('karas-freshly-baked', 'Seasonal Special',     'Ask at the stand — changes with the season.',                   7.00, 'Bakery', true),
  ('golden-shot', 'Golden Shot Original', 'Turmeric, ginger, lemon, black pepper. Suggested serving: one 2oz shot daily.', 6.00, 'Wellness', true),
  ('golden-shot', 'Turmeric Ginger Shot', 'Double ginger press with island turmeric. Ingredients: turmeric, ginger, lemon.', 6.00, 'Wellness', true),
  ('golden-shot', 'Immunity Shot',        'Citrus, ginger, and honey. Take at first sniffle.',                            7.00, 'Wellness', true),
  ('golden-shot', 'Wellness Bundle',      '5-shot bundle — mix and match. Bundle pricing saves 20%.',                    24.00, 'Wellness', true),
  ('golden-shot', 'Daily Cleanse',        '7-day cleanse pack. Subscription option coming soon.',                        36.00, 'Wellness', true),
  ('golden-shot', 'Seasonal Special',     'Rotating seasonal press — ask what''s fresh.',                                 7.00, 'Wellness', true),
  ('alas-kitchen', 'Classic Smash',        'Double smashed patties, grilled onion, house sauce.',                        14.00, 'Burgers', true),
  ('alas-kitchen', 'Get Smashed Deluxe',   'Triple patty, bacon, island slaw.',                                          18.00, 'Burgers', true),
  ('alas-kitchen', 'Burger of the Day',    'Today''s special build — see the truck board.',                              16.00, 'Burgers', true)
) as x(slug, item, descr, price, cat, avail)
join vendors v on v.slug = x.slug
where not exists (
  select 1 from menu_items m where m.vendor_id = v.id and m.name = x.item
);

-- ── Specials (feed the rotating homepage promos + storefront specials) ────
insert into specials (vendor_id, title, description, active)
select v.id, x.title, x.descr, true
from (values
  ('karas-freshly-baked', 'Fresh Bread Today',              'Sourdough out of the oven this morning — preorder for pickup before it sells out.'),
  ('golden-shot',         'Golden Shot Special',            'Bundle pricing on turmeric-ginger shots this week.'),
  ('alas-kitchen',        'Get Smashed Burger of the Day',  'New smash special daily — ask at the window.'),
  ('alas-kitchen',        'Garlic Butter Volcano Smash',    'Our classic double smash elevated with roasted garlic compound butter and crispy shallots.'),
  ('alas-kitchen',        'Tuesday Smash Deal',             'Buy any burger, get Shaka Fries free every Tuesday!')
) as x(slug, title, descr)
join vendors v on v.slug = x.slug
where not exists (
  select 1 from specials s where s.vendor_id = v.id and s.title = x.title
);

-- ── Featured placement (existing vendor_features mechanism) ───────────────
insert into vendor_features (vendor_id, tier, feature_expires_at)
select v.id, 'featured', now() + interval '365 days'
from vendors v
where v.slug in ('alas-kitchen', 'karas-freshly-baked', 'golden-shot')
  and not exists (
    select 1 from vendor_features f
    where f.vendor_id = v.id and f.feature_expires_at > now()
  );
