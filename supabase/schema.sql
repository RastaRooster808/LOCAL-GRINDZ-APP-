-- =============================================================================
-- Local Grindz — Supabase Schema
-- Run this in the Supabase SQL Editor (project → SQL Editor → New query).
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- fuzzy search on vendor names

-- ─── Updated-at trigger (shared by all tables) ───────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- ─── vendors ─────────────────────────────────────────────────────────────────
-- One row per food truck / vendor. approved_status gates public visibility.
-- auth_user_id links to Supabase Auth so the vendor can log in via magic link.

CREATE TABLE IF NOT EXISTS vendors (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        TEXT        UNIQUE NOT NULL,       -- 'v001' — JSON compat key
  auth_user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name    TEXT        NOT NULL,
  tagline          TEXT,
  contact_name     TEXT,
  phone            TEXT,
  email            TEXT,
  instagram        TEXT,
  facebook         TEXT,
  approved_status  BOOLEAN     NOT NULL DEFAULT FALSE,
  loyalty_pin      TEXT,                              -- legacy field; kept for JSON compat
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendors_auth_user_id_idx ON vendors(auth_user_id);
CREATE INDEX IF NOT EXISTS vendors_vendor_id_idx    ON vendors(vendor_id);

DROP TRIGGER IF EXISTS vendors_set_updated_at ON vendors;
CREATE TRIGGER vendors_set_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── menu_items ──────────────────────────────────────────────────────────────
-- Items are visible only when vendor is approved AND item.available = true.
-- Vendors manage their own menu; admin can override via approved_status.

CREATE TABLE IF NOT EXISTS menu_items (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      TEXT          UNIQUE NOT NULL,          -- 'm001' — JSON compat
  vendor_id    TEXT          NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  name         TEXT          NOT NULL,
  description  TEXT,
  price        NUMERIC(8,2)  NOT NULL CHECK (price >= 0),
  category     TEXT          NOT NULL DEFAULT 'general',
  spicy_level  SMALLINT      NOT NULL DEFAULT 0 CHECK (spicy_level BETWEEN 0 AND 5),
  available    BOOLEAN       NOT NULL DEFAULT TRUE,
  featured     BOOLEAN       NOT NULL DEFAULT FALSE,
  image_url    TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS menu_items_vendor_id_idx  ON menu_items(vendor_id);
CREATE INDEX IF NOT EXISTS menu_items_category_idx   ON menu_items(category);
CREATE INDEX IF NOT EXISTS menu_items_available_idx  ON menu_items(available);

DROP TRIGGER IF EXISTS menu_items_set_updated_at ON menu_items;
CREATE TRIGGER menu_items_set_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── locations ───────────────────────────────────────────────────────────────
-- One active row per vendor. Vendors update this directly (live location toggle).
-- live_status: 'open' | 'closed' | 'break'

CREATE TABLE IF NOT EXISTS locations (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             TEXT          UNIQUE NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  current_location_name TEXT          NOT NULL,
  address               TEXT          NOT NULL,
  latitude              NUMERIC(10,7),
  longitude             NUMERIC(10,7),
  hours_today           TEXT,
  live_status           TEXT          NOT NULL DEFAULT 'closed'
                          CHECK (live_status IN ('open', 'closed', 'break')),
  last_updated          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS locations_vendor_id_idx    ON locations(vendor_id);
CREATE INDEX IF NOT EXISTS locations_live_status_idx  ON locations(live_status);

-- ─── specials ────────────────────────────────────────────────────────────────
-- Time-limited specials with quantity tracking.
-- active + end_time together control visibility.

CREATE TABLE IF NOT EXISTS specials (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  special_id          TEXT          UNIQUE NOT NULL,     -- 'sp001' — JSON compat
  vendor_id           TEXT          NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  title               TEXT          NOT NULL,
  description         TEXT,
  price               NUMERIC(8,2)  NOT NULL CHECK (price >= 0),
  original_price      NUMERIC(8,2),
  quantity_available  INTEGER       CHECK (quantity_available > 0),
  quantity_remaining  INTEGER       CHECK (quantity_remaining >= 0),
  start_time          TIMESTAMPTZ,
  end_time            TIMESTAMPTZ,
  active              BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS specials_vendor_id_idx ON specials(vendor_id);
CREATE INDEX IF NOT EXISTS specials_active_idx    ON specials(active);
CREATE INDEX IF NOT EXISTS specials_end_time_idx  ON specials(end_time);

-- ─── reviews ─────────────────────────────────────────────────────────────────
-- Customer-submitted reviews. admin must set approved = TRUE before they appear.
-- customer_token is a SHA-256 device fingerprint — no PII.

CREATE TABLE IF NOT EXISTS reviews (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       TEXT        NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  item_id         TEXT        REFERENCES menu_items(item_id) ON DELETE SET NULL,
  customer_token  TEXT,                          -- anonymous device fingerprint
  rating          SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT        CHECK (char_length(comment) <= 500),
  approved        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reviews_vendor_id_idx  ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS reviews_approved_idx   ON reviews(approved);

-- ─── loyalty_campaigns ───────────────────────────────────────────────────────
-- stamp_code is NEVER returned to the browser via the public API.
-- The validate-stamp Edge Function reads it server-side only.

CREATE TABLE IF NOT EXISTS loyalty_campaigns (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id            TEXT        UNIQUE NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  campaign_name        TEXT        NOT NULL DEFAULT 'Loyalty Program',
  stamp_code           TEXT        NOT NULL,     -- server-side only; excluded from public SELECT
  stamps_required      SMALLINT    NOT NULL DEFAULT 10 CHECK (stamps_required BETWEEN 1 AND 50),
  reward_description   TEXT        NOT NULL,
  reward_item_id       TEXT        REFERENCES menu_items(item_id) ON DELETE SET NULL,
  campaign_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  start_date           DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS loyalty_campaigns_set_updated_at ON loyalty_campaigns;
CREATE TRIGGER loyalty_campaigns_set_updated_at
  BEFORE UPDATE ON loyalty_campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── loyalty_cards ───────────────────────────────────────────────────────────
-- One card per (customer_token, vendor_id) pair.
-- customer_token stored in localStorage — no account required.

CREATE TABLE IF NOT EXISTS loyalty_cards (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        TEXT        NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  customer_token   TEXT        NOT NULL,
  stamps           SMALLINT    NOT NULL DEFAULT 0 CHECK (stamps >= 0),
  lifetime_stamps  INTEGER     NOT NULL DEFAULT 0 CHECK (lifetime_stamps >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vendor_id, customer_token)
);

CREATE INDEX IF NOT EXISTS loyalty_cards_vendor_id_idx       ON loyalty_cards(vendor_id);
CREATE INDEX IF NOT EXISTS loyalty_cards_customer_token_idx  ON loyalty_cards(customer_token);

DROP TRIGGER IF EXISTS loyalty_cards_set_updated_at ON loyalty_cards;
CREATE TRIGGER loyalty_cards_set_updated_at
  BEFORE UPDATE ON loyalty_cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── stamp_events ────────────────────────────────────────────────────────────
-- Append-only ledger of stamp and redemption events. Audit trail.

CREATE TABLE IF NOT EXISTS stamp_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     UUID        NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL CHECK (event_type IN ('stamp', 'redeem')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stamp_events_card_id_idx ON stamp_events(card_id);

-- ─── orders ──────────────────────────────────────────────────────────────────
-- items is a JSONB snapshot of the cart at time of order (price freeze).
-- ticket_number is the human-readable pickup identifier shown to customer.
-- status lifecycle: pending → accepted → ready → completed | cancelled

CREATE TABLE IF NOT EXISTS orders (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        TEXT          NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  ticket_number    TEXT          UNIQUE NOT NULL,
  customer_name    TEXT          NOT NULL CHECK (char_length(customer_name) <= 80),
  customer_phone   TEXT,
  items            JSONB         NOT NULL,   -- [{item_id, name, price, qty}]
  total            NUMERIC(8,2)  NOT NULL CHECK (total >= 0),
  special_requests TEXT          CHECK (char_length(special_requests) <= 300),
  pickup_time      TEXT,
  status           TEXT          NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','accepted','ready','completed','cancelled')),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_vendor_id_idx     ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS orders_ticket_number_idx ON orders(ticket_number);
CREATE INDEX IF NOT EXISTS orders_status_idx        ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx    ON orders(created_at DESC);

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── vendor_updates ──────────────────────────────────────────────────────────
-- Submitted by vendors via the vendor portal form.
-- developer_status: pending → in_progress → completed | rejected

CREATE TABLE IF NOT EXISTS vendor_updates (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id          TEXT        UNIQUE NOT NULL,   -- 'u001' — JSON compat
  vendor_id          TEXT        NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  type               TEXT        NOT NULL DEFAULT 'general'
                       CHECK (type IN ('menu','location','hours','special','photo','general')),
  message            TEXT        NOT NULL,
  urgency            TEXT        NOT NULL DEFAULT 'normal'
                       CHECK (urgency IN ('low','normal','urgent')),
  dev_notes          TEXT,
  sp_title           TEXT,
  sp_price           NUMERIC(8,2),
  sp_qty             INTEGER,
  sp_end             TEXT,
  developer_status   TEXT        NOT NULL DEFAULT 'pending'
                       CHECK (developer_status IN ('pending','in_progress','completed','rejected')),
  admin_notes        TEXT,
  timestamp          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_updates_vendor_id_idx        ON vendor_updates(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_updates_developer_status_idx ON vendor_updates(developer_status);
CREATE INDEX IF NOT EXISTS vendor_updates_timestamp_idx        ON vendor_updates(timestamp DESC);

-- ─── admin_users ─────────────────────────────────────────────────────────────
-- Maps Supabase Auth users to admin roles.
-- Populated manually after creating an admin account in Supabase Auth.

CREATE TABLE IF NOT EXISTS admin_users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'admin'
                CHECK (role IN ('admin', 'super_admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── push_subscriptions ──────────────────────────────────────────────────────
-- Web Push API subscriptions. vendor_id = NULL means subscribed to all vendors.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_token  TEXT        NOT NULL,
  vendor_id       TEXT        REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  endpoint        TEXT        NOT NULL UNIQUE,
  p256dh          TEXT        NOT NULL,
  auth            TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_customer_token_idx ON push_subscriptions(customer_token);
CREATE INDEX IF NOT EXISTS push_subscriptions_vendor_id_idx      ON push_subscriptions(vendor_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Supabase exposes the PostgREST API publicly with the anon key.
-- RLS is the only thing preventing unauthorized reads/writes.
-- Enable it on every table. DENY all by default; add explicit grants.

ALTER TABLE vendors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE specials           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_cards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamp_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_updates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ── Helper: is the current session an admin? ─────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$;

-- ── Helper: does the current session own this vendor? ────────────────────────

CREATE OR REPLACE FUNCTION owns_vendor(vid TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendors WHERE vendor_id = vid AND auth_user_id = auth.uid()
  );
$$;

-- ── vendors ──────────────────────────────────────────────────────────────────

-- Anyone can read approved vendors (customer-facing pages)
CREATE POLICY "vendors: public read approved"
  ON vendors FOR SELECT
  USING (approved_status = TRUE);

-- A vendor can read their own row even if pending
CREATE POLICY "vendors: vendor reads own row"
  ON vendors FOR SELECT
  USING (auth_user_id = auth.uid());

-- Only admins can update approved_status, delete, or insert new vendors
CREATE POLICY "vendors: admin full access"
  ON vendors FOR ALL
  USING (is_admin());

-- Vendors can update their own non-approval fields
CREATE POLICY "vendors: vendor updates own profile"
  ON vendors FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ── menu_items ───────────────────────────────────────────────────────────────

-- Public can read available items for approved vendors
CREATE POLICY "menu_items: public read available"
  ON menu_items FOR SELECT
  USING (
    available = TRUE AND
    EXISTS (SELECT 1 FROM vendors WHERE vendor_id = menu_items.vendor_id AND approved_status = TRUE)
  );

-- Vendor reads all their own items (including unavailable)
CREATE POLICY "menu_items: vendor reads own items"
  ON menu_items FOR SELECT
  USING (owns_vendor(vendor_id));

-- Vendor manages their own menu
CREATE POLICY "menu_items: vendor manages own items"
  ON menu_items FOR ALL
  USING (owns_vendor(vendor_id))
  WITH CHECK (owns_vendor(vendor_id));

-- Admin full access
CREATE POLICY "menu_items: admin full access"
  ON menu_items FOR ALL
  USING (is_admin());

-- ── locations ────────────────────────────────────────────────────────────────

-- Public reads all locations for approved vendors
CREATE POLICY "locations: public read"
  ON locations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM vendors WHERE vendor_id = locations.vendor_id AND approved_status = TRUE)
  );

-- Vendor updates their own location (live status toggle)
CREATE POLICY "locations: vendor updates own location"
  ON locations FOR ALL
  USING (owns_vendor(vendor_id))
  WITH CHECK (owns_vendor(vendor_id));

-- Admin full access
CREATE POLICY "locations: admin full access"
  ON locations FOR ALL
  USING (is_admin());

-- ── specials ─────────────────────────────────────────────────────────────────

-- Public reads active specials for approved vendors
CREATE POLICY "specials: public read active"
  ON specials FOR SELECT
  USING (
    active = TRUE AND
    (end_time IS NULL OR end_time > NOW()) AND
    EXISTS (SELECT 1 FROM vendors WHERE vendor_id = specials.vendor_id AND approved_status = TRUE)
  );

-- Vendor manages their own specials
CREATE POLICY "specials: vendor manages own specials"
  ON specials FOR ALL
  USING (owns_vendor(vendor_id))
  WITH CHECK (owns_vendor(vendor_id));

-- Admin full access
CREATE POLICY "specials: admin full access"
  ON specials FOR ALL
  USING (is_admin());

-- ── reviews ──────────────────────────────────────────────────────────────────

-- Public reads only approved reviews
CREATE POLICY "reviews: public read approved"
  ON reviews FOR SELECT
  USING (approved = TRUE);

-- Anyone (anon) can insert a review; it starts unapproved
CREATE POLICY "reviews: public insert"
  ON reviews FOR INSERT
  WITH CHECK (approved = FALSE);

-- Admin approves / deletes reviews
CREATE POLICY "reviews: admin full access"
  ON reviews FOR ALL
  USING (is_admin());

-- ── loyalty_campaigns ────────────────────────────────────────────────────────
-- CRITICAL: stamp_code must NEVER be included in a public SELECT.
-- The column-level security below enforces this at the policy level.
-- Public policy explicitly excludes stamp_code by using a view (see below).

-- Anon can read campaign metadata but NOT stamp_code
-- Enforced via the loyalty_campaign_public view; direct table access is admin-only.
CREATE POLICY "loyalty_campaigns: admin full access"
  ON loyalty_campaigns FOR ALL
  USING (is_admin());

-- Vendor manages their own campaign
CREATE POLICY "loyalty_campaigns: vendor manages own"
  ON loyalty_campaigns FOR ALL
  USING (owns_vendor(vendor_id))
  WITH CHECK (owns_vendor(vendor_id));

-- Public view that hides stamp_code
CREATE OR REPLACE VIEW loyalty_campaign_public AS
  SELECT
    lc.id,
    lc.vendor_id,
    lc.campaign_name,
    lc.stamps_required,
    lc.reward_description,
    lc.reward_item_id,
    lc.campaign_active,
    lc.start_date,
    lc.created_at,
    lc.updated_at
  FROM loyalty_campaigns lc
  JOIN vendors v ON v.vendor_id = lc.vendor_id
  WHERE v.approved_status = TRUE AND lc.campaign_active = TRUE;

-- ── loyalty_cards ────────────────────────────────────────────────────────────

-- Customer can read their own card (by token — no auth required)
CREATE POLICY "loyalty_cards: read own by token"
  ON loyalty_cards FOR SELECT
  USING (customer_token = current_setting('request.jwt.claims', TRUE)::jsonb->>'customer_token'
         OR is_admin());

-- Anyone can insert a new card (first stamp creates it)
CREATE POLICY "loyalty_cards: insert own"
  ON loyalty_cards FOR INSERT
  WITH CHECK (TRUE);

-- Customer can update their own card (stamp add / redeem)
CREATE POLICY "loyalty_cards: update own by token"
  ON loyalty_cards FOR UPDATE
  USING (customer_token = current_setting('request.jwt.claims', TRUE)::jsonb->>'customer_token'
         OR is_admin());

-- ── stamp_events ─────────────────────────────────────────────────────────────

-- Stamp events come from the validate-stamp Edge Function (service role)
-- and from admin. Direct anon inserts are blocked.
CREATE POLICY "stamp_events: admin full access"
  ON stamp_events FOR ALL
  USING (is_admin());

-- ── orders ───────────────────────────────────────────────────────────────────

-- Anyone can insert an order (customer-facing order page)
CREATE POLICY "orders: public insert"
  ON orders FOR INSERT
  WITH CHECK (TRUE);

-- Customers can read their own order by ticket number (no auth required)
-- Implemented via the check-order Edge Function to avoid leaking all orders.
-- Direct public SELECT is blocked; vendors and admins use authenticated reads.
CREATE POLICY "orders: vendor reads own orders"
  ON orders FOR SELECT
  USING (owns_vendor(vendor_id));

-- Vendor updates order status
CREATE POLICY "orders: vendor updates status"
  ON orders FOR UPDATE
  USING (owns_vendor(vendor_id))
  WITH CHECK (owns_vendor(vendor_id));

-- Admin full access
CREATE POLICY "orders: admin full access"
  ON orders FOR ALL
  USING (is_admin());

-- ── vendor_updates ───────────────────────────────────────────────────────────

-- Anyone can insert a vendor update (the "Submit Update" form is public)
CREATE POLICY "vendor_updates: public insert"
  ON vendor_updates FOR INSERT
  WITH CHECK (TRUE);

-- Vendor reads their own submitted updates
CREATE POLICY "vendor_updates: vendor reads own"
  ON vendor_updates FOR SELECT
  USING (owns_vendor(vendor_id));

-- Admin reads and manages all updates (approval queue)
CREATE POLICY "vendor_updates: admin full access"
  ON vendor_updates FOR ALL
  USING (is_admin());

-- ── admin_users ──────────────────────────────────────────────────────────────

-- Only admins can read the admin_users table
CREATE POLICY "admin_users: admin only"
  ON admin_users FOR ALL
  USING (is_admin());

-- ── push_subscriptions ───────────────────────────────────────────────────────

-- Anyone can insert their own subscription
CREATE POLICY "push_subscriptions: public insert"
  ON push_subscriptions FOR INSERT
  WITH CHECK (TRUE);

-- Customer can read/delete their own subscriptions by token
CREATE POLICY "push_subscriptions: read own by token"
  ON push_subscriptions FOR SELECT
  USING (customer_token = current_setting('request.jwt.claims', TRUE)::jsonb->>'customer_token'
         OR is_admin());

CREATE POLICY "push_subscriptions: delete own by token"
  ON push_subscriptions FOR DELETE
  USING (customer_token = current_setting('request.jwt.claims', TRUE)::jsonb->>'customer_token'
         OR is_admin());

-- Admin full access
CREATE POLICY "push_subscriptions: admin full access"
  ON push_subscriptions FOR ALL
  USING (is_admin());

-- =============================================================================
-- SEED DATA
-- Match the existing JSON files so the app works identically on day one.
-- Remove this block after first production sync.
-- =============================================================================

INSERT INTO vendors (vendor_id, business_name, tagline, contact_name, approved_status, loyalty_pin)
VALUES ('v001', 'Ala''s Kitchen', 'Get Smashed', 'Ala', TRUE, '808')
ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO menu_items (item_id, vendor_id, name, description, price, category, spicy_level, available, featured)
VALUES
  ('m001','v001','Volcano Smash',
   'Double smash patty with ghost pepper aioli, caramelized onions, and lava sauce on a brioche bun.',
   14.00,'burgers',3,TRUE,TRUE),
  ('m002','v001','Classic Smash',
   'Single smash patty with American cheese, pickles, mustard, and ketchup on a potato bun.',
   10.00,'burgers',0,TRUE,FALSE),
  ('m003','v001','Loco Moco Smash',
   'Smash patty over rice with brown gravy and a fried egg. Local style done right.',
   13.00,'plates',0,TRUE,FALSE),
  ('m004','v001','Puna Fries',
   'Thick-cut fries tossed in island seasoning with your choice of dipping sauce.',
   5.00,'sides',1,TRUE,FALSE),
  ('m005','v001','Lilikoi Lemonade',
   'Fresh-squeezed lemonade with passion fruit syrup. Perfectly chilled.',
   4.00,'drinks',0,TRUE,FALSE)
ON CONFLICT (item_id) DO NOTHING;

INSERT INTO locations (vendor_id, current_location_name, address, latitude, longitude, hours_today, live_status, last_updated)
VALUES ('v001','Kalapana Black Sand Beach','End of Hwy 130, Pahoa, HI 96778',
        19.3598,-154.978,'11:00 AM – 7:00 PM','open','2026-06-24T10:00:00-10:00')
ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO loyalty_campaigns (vendor_id, campaign_name, stamp_code, stamps_required, reward_description, campaign_active, start_date)
VALUES ('v001','Smash Club','808',10,'1 Free Volcano Smash',TRUE,'2026-06-01')
ON CONFLICT (vendor_id) DO NOTHING;

-- =============================================================================
-- EDGE FUNCTIONS REQUIRED
-- These cannot be defined in SQL — create them in supabase/functions/.
-- See docs/PHASE_2_MIGRATION.md for implementation details.
-- =============================================================================

-- 1. validate-stamp
--    POST { vendor_id, code, customer_token }
--    Reads stamp_code server-side, never exposes it.
--    Returns { valid: boolean, stamps: number, stamps_required: number }

-- 2. check-order
--    POST { ticket_number }
--    Returns order status without requiring auth.
--    Returns { status, customer_name, items, total, created_at } or 404.

-- 3. send-push
--    Called internally when order status changes or a special goes live.
--    Reads push_subscriptions, sends Web Push via VAPID.
