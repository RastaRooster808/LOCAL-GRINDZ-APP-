# Local Grindz — Phase 2 Plan

**Current state:** Verified, passing static PWA on GitHub Pages.
**Phase 2 goal:** Live database, vendor auth, real order persistence, push notifications.
**Constraint:** GitHub Pages version stays live and functional throughout the migration.

---

## 1. Current Static Architecture

### How the app works today

Every page is a standalone HTML file. JavaScript runs in the browser. All data is read from JSON files committed to the repository. There is no server, no API, no authentication, and no real-time capability.

```
Browser
  │
  ├─ GET /data/locations.json  ← fetch() in app.js
  ├─ GET /data/menus.json      ← fetch() in app.js, menu.js, order.js
  ├─ GET /data/specials.json   ← fetch() in app.js, dashboard.js
  ├─ GET /data/loyalty.json    ← fetch() in loyalty.js, vendor.js, dashboard.js
  ├─ GET /data/vendors.json    ← fetch() in vendor.js, dashboard.js
  └─ GET /data/updates.json    ← fetch() in dashboard.js

Service Worker (v7)
  └─ cache.addAll(25 assets)   ← cache-first, no expiry
```

### Data flow for each user role today

**Customer** reads everything. Cannot write anything. Loyalty stamps stored in browser localStorage (`lg_loyalty_v1`). Clearing browser storage loses all stamps. Switching devices loses all stamps.

**Vendor** fills out a form that generates formatted text. Copies it to clipboard. Texts or emails it to the developer. Developer manually edits JSON files and pushes to GitHub. ~2 minute deploy delay.

**Developer / admin** is the only person who touches data. All changes go through git. No interface exists for approvals, order management, or push notifications.

### Current script responsibilities

| Script | Reads | Writes | Side effects |
|--------|-------|--------|--------------|
| `app.js` | locations.json, menus.json, specials.json | — | Renders home page sections |
| `menu.js` | menus.json | — | Renders menu with category filter |
| `order.js` | menus.json | — | Generates random local ticket (not persisted) |
| `loyalty.js` | loyalty.json, vendors.json | localStorage | Stamp validation, card state |
| `vendor.js` | vendors.json, loyalty.json | clipboard only | Form-to-text generation |
| `dashboard.js` | All 6 JSON files | — | Renders vendor overview |
| `nav.js` | — | — | Injects nav from NAV_ITEMS array |

### Known limitations of the current system

- **No real orders.** Tickets are client-side only. If customer closes the tab, the order is gone. Vendor never sees it digitally.
- **No vendor auth.** Anyone who knows the vendor portal URL can submit updates. Anyone can see the stamp code on the dashboard.
- **No live updates.** Vendor cannot open/close the truck without texting the developer. Location updates take minutes.
- **Loyalty is fragile.** localStorage is per-device, per-browser. Private browsing wipes it. Users who clear cache lose their card.
- **Quantity is fictional.** `quantity_remaining` in specials.json is a static number that the developer must manually update. It never decrements.
- **No push capability.** No mechanism exists to notify customers when the truck opens, a special goes live, or an order is ready.

---

## 2. Files That Will Remain Unchanged

These files require no modification for Phase 2. They handle presentation, not data access.

```
index.html          HTML structure only — data populated by JS
menu.html           HTML structure only
order.html          HTML structure only
loyalty.html        HTML structure only
vendor.html         HTML structure only — form fields stay, submit target changes
dashboard.html      HTML structure only — IDs stay, data source changes

styles/
  main.css          No changes
  pages.css         No changes
  vendor.css        No changes
  dashboard.css     No changes (may extend for admin sections)

icons/
  icon-192x192.png  No changes
  icon-512x512.png  No changes

favicon.ico         No changes
manifest.json       No changes
scripts/nav.js      No changes — NAV_ITEMS may gain /admin.html entry
docs/ARCHITECTURE.md  Update after migration completes
```

---

## 3. Files That Will Be Replaced by Live Database Calls

### JSON data files → Supabase tables

| Current file | Replaced by | When |
|---|---|---|
| `data/vendors.json` | `vendors` table | Step 3 |
| `data/menus.json` | `menu_items` table | Step 3 |
| `data/locations.json` | `locations` table | Step 4 |
| `data/specials.json` | `specials` table | Step 4 |
| `data/loyalty.json` | `loyalty_campaigns` table | Step 5 |
| `data/updates.json` | `updates` table | Step 3 |

The JSON files stay in the repo during migration as offline fallbacks. They are removed only in the final step after Supabase reads are confirmed stable in production.

### Scripts — modified, not replaced

Each script gets a new data-access layer. The render functions are untouched.

| Script | What changes | What stays |
|---|---|---|
| `app.js` | `fetch('/data/*.json')` → `supabase.from()` | All `render*()` functions |
| `menu.js` | `fetch('/data/menus.json')` → `supabase.from('menu_items')` | `renderMenu()`, `buildItemCard()`, category tabs |
| `order.js` | `fetch()` → Supabase; `placeOrder()` writes to `orders` table | Cart logic, `renderOrderMenu()`, `resetOrder()` |
| `loyalty.js` | `fetch()` → Supabase; stamps write to `stamp_events` table | All render functions, validation logic |
| `vendor.js` | `handleSubmit()` → `supabase.from('updates').insert()` + auth guard | Form validation, `generateSummary()` can stay for preview |
| `dashboard.js` | All fetches → Supabase; add Realtime subscription for orders | All `render*()` functions |

### New files required

```
scripts/supabase-client.js   Supabase JS client init (URL + anon key)
scripts/auth.js              Session management, login redirect guard
pages/
  login.html                 Email magic link login form
  admin.html                 Admin approval queue + order management
  admin.js                   Admin data operations
service-worker.js            Bump to v8; remove JSON paths from cache list
```

---

## 4. Recommended Backend: Supabase

### Decision

**Supabase.** Not Firebase, not Airtable.

### Comparison

| Criterion | Supabase | Firebase | Airtable |
|---|---|---|---|
| **Data model** | PostgreSQL — relational, joins work, foreign keys, constraints | NoSQL — documents, no joins, manual denormalization | Spreadsheet — good for simple tables, awkward for relational data |
| **Auth** | Magic link, OAuth, SMS — built-in, no setup | Firebase Auth — solid but more config | None built-in — requires third party |
| **Realtime** | Postgres LISTEN/NOTIFY via WebSocket | Realtime Database / Firestore listeners | Webhooks only — no true realtime |
| **REST API from vanilla JS** | Auto-generated REST + JS SDK via CDN | Requires Firebase SDK (heavier bundle) | REST API — works, rate-limited at free tier |
| **Free tier limits** | 500 MB DB, 5 GB storage, 2 GB/month transfer, unlimited API requests | Spark plan: limited reads/writes, no Cloud Functions | 1,000 records/table, 5 API calls/second |
| **Schema control** | Full SQL DDL — migrations, indexes, views | Schema-less — no enforcement | No schema enforcement |
| **Row-level security** | First-class, policy-based — reads/writes per user per row | Security rules — capable but syntax is awkward | Per-base permissions only |
| **Edge Functions** | Deno-based, included | Cloud Functions — requires Blaze (paid) plan | Automations — limited, no code |
| **Push notifications** | Edge Functions can send via web-push | Cloud Messaging — good, requires paid plan for web | Not applicable |
| **Single vendor scale** | Massively overkill, free forever | Adequate, free tier tight | Could work, hits limits with order volume |
| **Migration path** | Direct: replace `fetch()` calls one at a time | Direct: replace `fetch()` calls, swap SDK | Indirect: requires API proxy layer |

### Why not Firebase

The data model for Local Grindz is naturally relational: vendors → menu_items, vendors → orders, orders → order_items, loyalty_campaigns → stamp_events. Firebase's document model requires manual denormalization and is harder to query. The free (Spark) plan also excludes Cloud Functions, which are needed for push notifications.

### Why not Airtable

Airtable's free tier allows 1,000 records per table and 5 API requests per second. A food truck serving 50 customers in a day with order history, stamp events, and specials would be at the limit within weeks. More importantly, Airtable has no WebSocket/Realtime capability — the vendor dashboard cannot receive live order updates without polling, which is expensive against the rate limit.

### Supabase setup

```
1. Create project at supabase.com
2. Note: Project URL and anon key (safe to expose in browser JS)
3. Note: Service role key (server-side only — never in browser JS)
4. Enable Email Auth with magic links in Authentication settings
5. Disable email confirmation (magic link IS the confirmation)
```

---

## 5. Proposed Database Schema

### Design principles

- UUIDs as primary keys (`gen_random_uuid()`) — safe to expose in URLs
- `created_at` / `updated_at` on every table for audit trail
- All monetary values as `NUMERIC(8,2)` — not `FLOAT`
- Soft deletes (`deleted_at`) on menu items and specials — never hard-delete customer-facing data
- Row Level Security (RLS) enabled on every table from day one

---

### Table: `vendors`

Maps to `data/vendors.json`. One row per vendor.

```sql
CREATE TABLE vendors (
  vendor_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name    TEXT NOT NULL,
  tagline          TEXT,
  contact_name     TEXT,
  phone            TEXT,
  email            TEXT UNIQUE,
  instagram        TEXT,
  facebook         TEXT,
  approved_status  BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Seed
INSERT INTO vendors (vendor_id, business_name, tagline, contact_name, approved_status)
VALUES ('v001-...', 'Ala''s Kitchen', 'Get Smashed', 'Ala', TRUE);
```

**RLS policies:**
- Public read (all approved vendors visible to customers)
- Vendor can only update their own row (`auth.uid() = user_id`)
- Admin can read and write all rows

---

### Table: `menu_items`

Maps to `data/menus.json`. All current items map 1:1.

```sql
CREATE TABLE menu_items (
  item_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(8,2) NOT NULL,
  category      TEXT CHECK (category IN ('burgers', 'plates', 'sides', 'drinks', 'other')),
  spicy_level   INTEGER DEFAULT 0 CHECK (spicy_level BETWEEN 0 AND 5),
  available     BOOLEAN DEFAULT TRUE,
  featured      BOOLEAN DEFAULT FALSE,
  image_url     TEXT,
  sort_order    INTEGER DEFAULT 0,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON menu_items (vendor_id, available);
```

**Current items to seed:** m001 Volcano Smash $14 (featured, spicy:3), m002 Classic Smash $10, m003 Loco Moco Smash $13, m004 Puna Fries $5 (spicy:1), m005 Lilikoi Lemonade $4.

**RLS policies:**
- Public read where `available = TRUE AND deleted_at IS NULL`
- Vendor can insert/update their own items (`vendor_id` matches their record)
- Admin can read/write all

---

### Table: `locations`

Maps to `data/locations.json`. One row per vendor — upserted on update.

```sql
CREATE TABLE locations (
  location_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE UNIQUE,
  current_location_name TEXT,
  address               TEXT,
  latitude              NUMERIC(10, 7),
  longitude             NUMERIC(10, 7),
  hours_today           TEXT,
  live_status           TEXT DEFAULT 'closed' CHECK (live_status IN ('open', 'closed', 'paused')),
  next_location         TEXT,
  next_date             DATE,
  last_updated          TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Phase 2 capability:** Vendor taps "I'm open" → single `UPDATE locations SET live_status = 'open', last_updated = NOW()` — no developer needed. Dashboard sees the change via Realtime subscription immediately.

**RLS policies:**
- Public read
- Vendor can update only their own row
- Admin can update all

---

### Table: `specials`

Maps to `data/specials.json`. Supports multiple simultaneous specials per vendor.

```sql
CREATE TABLE specials (
  special_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id          UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  description        TEXT,
  price              NUMERIC(8,2) NOT NULL,
  original_price     NUMERIC(8,2),
  quantity_available INTEGER,
  quantity_remaining INTEGER,
  start_time         TIMESTAMPTZ,
  end_time           TIMESTAMPTZ,
  active             BOOLEAN DEFAULT FALSE,
  admin_approved     BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON specials (vendor_id, active, end_time);
```

`quantity_remaining` decrements automatically via a Postgres trigger when an order containing the special is confirmed. `admin_approved = FALSE` means the special is in the queue but not yet visible to customers.

**RLS policies:**
- Public read where `active = TRUE AND admin_approved = TRUE AND (end_time IS NULL OR end_time > NOW())`
- Vendor can insert their own specials (starts as `admin_approved = FALSE`)
- Admin can update `admin_approved`

---

### Table: `loyalty_campaigns`

Maps to `data/loyalty.json`. One campaign per vendor.

```sql
CREATE TABLE loyalty_campaigns (
  campaign_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id          UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE UNIQUE,
  campaign_name      TEXT NOT NULL,
  stamp_code         TEXT NOT NULL,
  stamps_required    INTEGER DEFAULT 10,
  reward_description TEXT NOT NULL,
  reward_item_id     UUID REFERENCES menu_items(item_id) ON DELETE SET NULL,
  campaign_active    BOOLEAN DEFAULT TRUE,
  start_date         DATE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
```

`stamp_code` is readable by authenticated vendors only — not public. Customers do not need to see it in the schema; they enter it on the loyalty page and the server validates it.

**RLS policies:**
- Public read of `campaign_name`, `stamps_required`, `reward_description`, `campaign_active` only
- `stamp_code` column excluded from public reads (Postgres column-level security or view)
- Vendor can update their own campaign

---

### Table: `loyalty_cards`

**New table.** Replaces `localStorage` in `loyalty.js`. Cards are tied to an anonymous device fingerprint initially; can be claimed by an authenticated account later.

```sql
CREATE TABLE loyalty_cards (
  card_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id        UUID NOT NULL REFERENCES loyalty_campaigns(campaign_id) ON DELETE CASCADE,
  customer_token     TEXT NOT NULL,  -- hashed device ID or auth user_id
  stamps             INTEGER DEFAULT 0,
  lifetime_stamps    INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (campaign_id, customer_token)
);
```

`customer_token` is a SHA-256 hash of a stable device identifier generated once and stored in localStorage. This preserves the anonymous experience while making stamps cross-session and cross-browser on the same device.

**RLS policies:**
- Customer can read and update only their own card (matched by `customer_token`)
- Vendor can read all cards for their campaign (for redemption verification)
- Admin can read all

---

### Table: `stamp_events`

**New table.** Audit log of every stamp earned and every redemption.

```sql
CREATE TABLE stamp_events (
  stamp_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id        UUID NOT NULL REFERENCES loyalty_cards(card_id) ON DELETE CASCADE,
  event_type     TEXT CHECK (event_type IN ('earned', 'redeemed', 'expired', 'reset')),
  stamp_code     TEXT,               -- code entered (for earned events)
  stamped_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Table: `orders`

**New table.** Replaces the local-only ticket in `order.js`.

```sql
CREATE TABLE orders (
  order_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES vendors(vendor_id),
  ticket_number   TEXT NOT NULL,     -- short 4-digit display number, not the UUID
  customer_name   TEXT,
  customer_phone  TEXT,
  items           JSONB NOT NULL,    -- [{item_id, name, qty, unit_price, subtotal}]
  subtotal        NUMERIC(8,2) NOT NULL,
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','ready','completed','cancelled')),
  notes           TEXT,
  pickup_time     TEXT,
  loyalty_card_id UUID REFERENCES loyalty_cards(card_id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON orders (vendor_id, status, created_at DESC);
```

`ticket_number` is a human-readable 4-digit code generated server-side, unique per day per vendor. The full `order_id` UUID is used for API calls. The ticket number is what gets shown to the customer and called at the window.

`items` is stored as JSONB (snapshot of name + price at time of order) so menu price changes don't retroactively affect order history.

**RLS policies:**
- Customer can insert new orders and read their own (by customer_phone or loyalty_card_id)
- Vendor can read all their orders and update `status`
- Admin can read and update all

---

### Table: `updates`

Maps to `data/updates.json`. Converted to a live submissions table.

```sql
CREATE TABLE updates (
  update_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        UUID NOT NULL REFERENCES vendors(vendor_id),
  type             TEXT CHECK (type IN ('menu','location','hours','special','photo','general')),
  message          TEXT NOT NULL,
  price            NUMERIC(8,2),
  quantity         INTEGER,
  end_time         TEXT,
  developer_status TEXT DEFAULT 'pending'
                   CHECK (developer_status IN ('pending','completed','archived')),
  admin_notes      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS policies:**
- Vendor can insert (authenticated only) and read their own
- Admin can read all and update `developer_status` / `admin_notes`

---

### Table: `push_subscriptions`

**New table.** Stores Web Push API subscriptions for customer notifications.

```sql
CREATE TABLE push_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES vendors(vendor_id),
  endpoint        TEXT NOT NULL UNIQUE,
  p256dh          TEXT NOT NULL,
  auth_key        TEXT NOT NULL,
  subscribed_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Vendor Login Requirements

### Problem with the current system

`vendor.html` is fully public. Anyone with the URL can see the stamp code on the dashboard. Anyone can submit a fake update form (though it only generates text — it cannot write anything). In Phase 2, vendor submissions will write to the database, so authentication is required.

### Approach: Email magic link via Supabase Auth

No passwords. Vendor enters their email → receives a one-tap login link → session created. Session persists until the browser is cleared or the link expires (7 days by default).

This is the right choice for a food truck vendor who:
- Uses a phone most of the time
- Won't remember a password
- Already gets texts and emails on their phone

### Auth flow

```
Vendor visits /vendor.html or /dashboard.html
        │
        ▼
auth.js checks localStorage for Supabase session
        │
   Not logged in?          Logged in?
        │                      │
        ▼                      ▼
  Redirect to          Load vendor record
  /login.html          matching user_id
        │                      │
Vendor enters email            ▼
        │              Show vendor-specific data
        ▼              (only their menu, orders, etc.)
Supabase sends magic link
        │
Vendor taps link in email/SMS
        │
        ▼
Browser redirected back to /vendor.html
Supabase SDK reads token from URL hash
Session stored in localStorage
        │
        ▼
auth.js fetches vendor record for this user_id
vendor.js uses session to make authenticated requests
```

### New files for auth

**`login.html`** — Single input for email, submit button, success message.

**`scripts/auth.js`** — Manages session state. Exports `getSession()`, `requireAuth()`, `signOut()`. Every protected page calls `requireAuth()` on load.

### Vendor data scoping

After login, the vendor sees only their own data. This is enforced at the database level (RLS policies check `vendor_id` against the authenticated user's linked vendor record) and at the UI level (vendor.js always passes the session's `vendor_id` to every query).

### Protected pages in Phase 2

| Page | Protection level |
|---|---|
| `index.html` | Public |
| `menu.html` | Public |
| `order.html` | Public |
| `loyalty.html` | Public |
| `vendor.html` | Requires vendor auth |
| `dashboard.html` | Requires vendor auth |
| `admin.html` | Requires admin role |
| `login.html` | Public (redirect to vendor.html if already authed) |

---

## 7. Admin Approval Workflow

### Current reality

The developer is the admin. "Approval" means reading a text message, deciding if it's valid, editing a JSON file, and pushing to GitHub. This takes 2–60 minutes depending on what the developer is doing.

### Phase 2 admin panel (`/admin.html`)

Admin is the developer. Admin role is set in Supabase via a custom claim in the JWT (`role: 'admin'`) or via a separate `admins` table. The admin page requires this role.

### Approval queue items

```
Pending updates (from the `updates` table)
  └─ View message, type, vendor
  └─ Tap Approve / Reject / Archive
  └─ If approve + type is "special" → auto-insert into specials table with admin_approved = TRUE

Pending vendors (new vendor sign-up flow, Phase 3)
  └─ View profile
  └─ Tap Approve → sets vendors.approved_status = TRUE

Pending menu items (vendor submitted a new item)
  └─ View item details
  └─ Tap Approve → sets menu_items.available = TRUE

Flagged reviews (Phase 3)
  └─ View review text
  └─ Approve, remove, or ignore
```

### Approval decision tree for specials

```
Vendor submits special via vendor.html
        │
        ▼
Row inserted in specials: active=FALSE, admin_approved=FALSE
Row inserted in updates: type='special', developer_status='pending'
        │
        ▼
Admin sees pending update in /admin.html queue
Admin taps Approve Special
        │
        ▼
Supabase function:
  UPDATE specials SET active=TRUE, admin_approved=TRUE WHERE ...
  UPDATE updates SET developer_status='completed' WHERE ...
        │
        ▼
Special is now visible to customers
Push notification sent: "New special just dropped at Ala's Kitchen!"
```

### Fast-track for location updates (no approval needed)

Location and hours updates should NOT require admin approval — the vendor must be able to open and close the truck instantly. These write directly to the `locations` table when the vendor is authenticated. No queue.

---

## 8. Order Flow MVP

### Current state

`order.js` builds a cart, calls `placeOrder()`, generates a random 4-digit ticket number, renders it on screen. The ticket is a local HTML render. No network call is made. Vendor never sees the order.

### Phase 2 MVP order flow

**Customer side** (order.html — same UI, new submit behavior):

```
Customer taps + on items → cart builds (same as today)
Customer taps "Place Order"
        │
        ▼
New: ask for name + phone (optional fields, 1-tap modal)
        │
        ▼
POST to Supabase: orders.insert({
  vendor_id, items (JSONB snapshot), subtotal,
  customer_name, customer_phone, status: 'pending'
})
        │
        ▼
Supabase returns order_id + ticket_number
        │
        ▼
Display ticket with real ticket_number from server
(same ticket UI — no change to appearance)
        │
        ▼
Subscribe to Supabase Realtime on this order_id
When status changes → update ticket screen
  'accepted' → "Order received! We're cooking."
  'ready'    → "Your order is ready! Come to the window." + push notification
```

**Vendor side** (new section on dashboard.html):

```
Dashboard subscribes to Realtime: orders WHERE vendor_id = me AND status = 'pending'
        │
New order arrives
        │
        ▼
Order card appears: ticket #, items, total, time
        │
Vendor taps "Accept" → status = 'accepted'
Vendor taps "Ready"  → status = 'ready'  → triggers push to customer
Vendor taps "Done"   → status = 'completed'
```

### What this does NOT include in MVP

- Payment processing (Square/Stripe) — Phase 3
- Pickup time estimation — Phase 3
- Order history for customers — Phase 3
- Refunds or cancellations — Phase 3
- Multi-vendor order routing — Phase 4+

### Offline handling for orders

If the customer is offline when they tap Place Order, show an error: "You need a connection to place an order. Try again when you have signal." Do not fall back to local-only tickets — a local ticket that the vendor cannot see causes confusion at the window.

---

## 9. Push Notification Plan

### Technology

Web Push API — no third-party service required, no monthly fee. Works on Android Chrome, Android Firefox, Safari on iOS 16.4+ (installed PWA only). Uses VAPID keys generated once and stored in Supabase secrets.

### Implementation components

**Browser side (new `scripts/push.js`):**
```javascript
// On order placement or first loyalty stamp
async function subscribeToPush(vendorId) {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY,
  });
  // POST subscription to Supabase push_subscriptions table
}
```

**Service worker (`service-worker.js`):**
```javascript
self.addEventListener('push', event => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

**Server side (Supabase Edge Function `send-push`):**
Called by database triggers or admin actions. Uses the `web-push` npm package with stored VAPID keys to send to all relevant subscriptions.

### Notification triggers

| Event | Trigger | Audience | Message |
|---|---|---|---|
| Truck opens | `locations.live_status` changes to `open` | All subscribers for this vendor | "Ala's Kitchen is open! Come get smashed." |
| Special goes live | `specials.active` → TRUE | All subscribers | "New special: Garlic Butter Volcano Smash $15 — limited qty!" |
| Order ready | `orders.status` → `ready` | Customer who placed order | "Your order #4821 is ready at the window!" |
| Loyalty reward earned | `loyalty_cards.stamps` reaches `stamps_required` | That customer | "You've earned a free Volcano Smash! Show your card." |
| Truck closing soon | Manual trigger from vendor dashboard | All subscribers | "Last call — closing in 30 minutes." |

### Permission flow

Ask for push permission only after a meaningful action — not on first page load. Good moments to ask:
- After placing an order: "Want a notification when your order is ready?"
- After earning 5 stamps: "Want to know when you've earned your free burger?"
- After checking location: "Want to know when the truck opens tomorrow?"

Never ask on cold load. Users dismiss that immediately.

### iOS limitations

iOS requires the PWA to be installed to the home screen before push notifications work (iOS 16.4+). Show a non-blocking install prompt in the loyalty or order pages: "Add to Home Screen for push notifications."

---

## 10. Migration Steps — JSON to Live Backend

The migration is done in 8 discrete steps. Each step is independently deployable and reversible. The GitHub Pages static version stays live throughout.

---

### Step 1 — Supabase project setup (no code changes)

```
1. Create Supabase project at supabase.com
2. Run all CREATE TABLE statements from Section 5 in the SQL editor
3. Enable Row Level Security on all tables
4. Create RLS policies per table (public reads, auth writes)
5. Seed all tables from current JSON files:
   - vendors.json     → vendors table
   - menus.json       → menu_items table
   - locations.json   → locations table
   - specials.json    → specials table
   - loyalty.json     → loyalty_campaigns table
   - updates.json     → updates table
6. Note the project URL and anon key
7. Generate VAPID key pair for push notifications (store in Supabase secrets)
```

No files change. GitHub Pages is unaffected.

---

### Step 2 — Add Supabase client (no behavior change)

Create `scripts/supabase-client.js`:

```javascript
const SUPABASE_URL  = 'https://your-project.supabase.co';
const SUPABASE_ANON = 'your-anon-key';  // safe to expose — RLS enforces security
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
```

Add the Supabase CDN script to every HTML page's `<head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="/scripts/supabase-client.js"></script>
```

Add `scripts/supabase-client.js` to the service worker cache list. Bump to v8. The CDN script is not cached (it changes, and we want fresh). Add `integrity` attribute from the CDN for security.

At this point: page behavior is identical to today. The Supabase client is loaded but nothing calls it yet.

---

### Step 3 — Migrate reads: vendors, menus, updates (dashboard + menu page)

Replace `fetch('/data/vendors.json')` with Supabase reads in `dashboard.js` and `vendor.js`. Keep the JSON `fetch()` as a fallback:

```javascript
async function loadVendorData() {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('approved_status', true)
      .single();
    if (error) throw error;
    return data;
  } catch {
    // Fall back to JSON file
    const res = await fetch('/data/vendors.json');
    return (await res.json())[0];
  }
}
```

Apply the same pattern to `menus.json` in `menu.js` and `order.js`.

**Test:** Deploy to a feature branch. Menu page loads items from Supabase. If Supabase is down, loads from JSON. Behavior is identical to the user.

---

### Step 4 — Migrate reads: location and specials (home page)

Replace `fetch('/data/locations.json')` and `fetch('/data/specials.json')` in `app.js` with Supabase reads. Same fallback pattern as Step 3.

Add Supabase Realtime subscription to `app.js` for location updates:

```javascript
supabase
  .channel('location-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'locations',
    filter: `vendor_id=eq.${VENDOR_ID}`,
  }, payload => renderLocation(payload.new))
  .subscribe();
```

**What this unlocks:** When the vendor updates their status via the dashboard, every customer with the home page open sees it update within seconds. No developer, no git push, no deploy.

---

### Step 5 — Migrate loyalty reads + add auth for stamp validation

Replace `fetch('/data/loyalty.json')` in `loyalty.js` with Supabase read.

**Stamp validation change:** Currently, the stamp code is fetched in `loadCampaign()` and validated client-side. This means anyone who opens DevTools can see the stamp code and add unlimited stamps.

In Phase 2:
- `loyalty.js` does NOT fetch the stamp code
- On stamp submission, calls a Supabase Edge Function `validate-stamp` with the entered code
- Edge Function reads the real stamp code server-side, validates, and inserts a `stamp_events` row
- Returns `{valid: true}` or `{valid: false, reason: '...'}` — stamp code never sent to browser

```javascript
async function handleAddStamp() {
  const entered = document.getElementById('stamp-code-input').value.trim().toUpperCase();
  const { data, error } = await supabase.functions.invoke('validate-stamp', {
    body: { stamp_code: entered, card_id: getCardId() },
  });
  if (data?.valid) {
    // increment local state + re-render
  } else {
    showFeedback(data?.reason || "Code doesn't match.", 'error');
  }
}
```

`getCardId()` returns the UUID stored in localStorage for this device's loyalty card, or creates one if new.

---

### Step 6 — Add vendor auth

Create `login.html` and `scripts/auth.js`.

Add auth guard to `vendor.html` and `dashboard.html`:

```javascript
// Top of vendor.js and dashboard.js
import { requireAuth } from './auth.js';
const session = await requireAuth(); // redirects to /login.html if not authed
const vendorId = await getVendorIdForUser(session.user.id);
```

**Change in `vendor.js` `handleSubmit()`:** Instead of generating clipboard text and stopping there, also insert to Supabase:

```javascript
const { error } = await supabase.from('updates').insert({
  vendor_id: vendorId,
  type: data.updateType,
  message: data.message,
  // ...other fields
});
```

Keep the clipboard text generation — the vendor still gets a copy, and it serves as offline fallback if the insert fails.

---

### Step 7 — Migrate orders to Supabase

Replace `placeOrder()` in `order.js` with a Supabase insert:

```javascript
async function placeOrder() {
  const items = buildItemsSnapshot(); // JSONB snapshot of cart
  const { data, error } = await supabase.from('orders').insert({
    vendor_id: VENDOR_ID,
    items,
    subtotal: calcTotal(),
    customer_name: ...,
    customer_phone: ...,
    status: 'pending',
  }).select().single();

  if (error) {
    showError('Could not place order. Please check your connection.');
    return;
  }

  renderTicket(data.ticket_number, data.order_id);
  subscribeToOrderStatus(data.order_id);
}
```

Add order queue to `dashboard.html` — a live-updating list of pending orders that the vendor accepts and marks ready.

---

### Step 8 — Push notifications + vendor location control

**Push notifications:**
- Add `scripts/push.js` with subscribe logic
- Update `service-worker.js` to handle `push` and `notificationclick` events
- Create Supabase Edge Function `send-push` that reads subscriptions and calls web-push
- Wire triggers: location status change, order ready, loyalty complete

**Vendor location control (new section on dashboard.html):**
```
[ I'm Open ]  [ I'm Closed ]  [ Set Location ]
```
Tapping "I'm Open" → `supabase.from('locations').update({live_status: 'open', last_updated: new Date()})` → Realtime fires → all customers see updated status → push sent to subscribers.

---

### Step 9 — Remove JSON files

After Step 8 is confirmed stable in production for 2 weeks:

1. Remove all `data/*.json` files from the repo
2. Remove JSON fallbacks from all scripts
3. Remove `data/` paths from `service-worker.js` cache list, bump to v9
4. Update `docs/ARCHITECTURE.md`

---

### Step 10 — Consider moving off GitHub Pages

GitHub Pages serves static files. After Phase 2, the app is still static HTML/CSS/JS — Supabase handles all the backend. GitHub Pages continues to work.

However, a few capabilities that require server-side routing may push toward Netlify or Vercel:
- URL redirects after magic link auth (requires `/_redirects` config on Netlify)
- Edge middleware for auth route protection (optional but cleaner than JS redirects)
- Previews for feature branches

**Recommendation:** Stay on GitHub Pages through Phase 2. Move to Netlify in Phase 3 only if the redirect/auth UX becomes a problem.

---

## Summary Table

| Phase | What it unlocks | Files changed |
|---|---|---|
| 1 (done) | Static PWA working, verified | All current files |
| 2 — Step 1 | Supabase project + schema | None |
| 2 — Step 2 | Supabase client available | All HTML heads, new `supabase-client.js`, SW v8 |
| 2 — Step 3 | Menu/vendor reads from DB | `menu.js`, `dashboard.js`, `vendor.js` |
| 2 — Step 4 | Live location + specials | `app.js` |
| 2 — Step 5 | Server-side stamp validation | `loyalty.js`, new Edge Function |
| 2 — Step 6 | Vendor login, updates to DB | New `login.html`, `auth.js`, `vendor.js` |
| 2 — Step 7 | Real order flow | `order.js`, `dashboard.js` (new order queue) |
| 2 — Step 8 | Push notifications, vendor location control | `service-worker.js`, new `push.js`, new Edge Functions |
| 2 — Step 9 | Remove JSON files | Delete `data/`, clean scripts, SW v9 |
| Phase 3 | Payment (Square/Stripe), reviews, multi-vendor | New pages + API routes |
