# Local Grindz — Phase 3 Platform Plan

## Overview

Phase 3 transforms Local Grindz from a single-vendor PWA into a multi-vendor food truck marketplace for the Big Island of Hawaii. The stack remains static HTML/CSS/JS + Supabase. No framework migration yet.

---

## 1. Multi-Vendor Marketplace Roadmap

### Milestone 1 — Vendor Directory (Week 1–2)
- Public vendor listing page (`/vendors/`)
- Each vendor gets a profile page (`/vendors/[slug]/`)
- Vendor card: name, cuisine type, current location, status badge (open/closed)
- Search/filter by cuisine type, neighborhood, open now

### Milestone 2 — Per-Vendor Storefronts (Week 2–3)
- Each vendor profile shows their live menu, location, specials
- QR code per vendor links directly to their storefront
- Shared customer-facing UI, vendor-scoped data via Supabase RLS

### Milestone 3 — Order Management (Week 3–4)
- Orders scoped to vendor
- Vendor dashboard shows only their orders
- Customer order history (session-based, no account required)
- Order status updates pushed via Supabase Realtime

### Milestone 4 — Loyalty + Accounts (Week 4–5)
- Customer accounts (email/magic link via Supabase Auth)
- Loyalty points earned per vendor purchase
- Cross-vendor point redemption (platform-wide rewards)

### Milestone 5 — Admin + Revenue (Week 5–6)
- Admin dashboard (`/admin/`)
- Vendor approval queue
- Featured listing management
- Platform analytics

---

## 2. Vendor Onboarding Workflow

```
Vendor submits application (name, cuisine, contact, location)
        ↓
Row inserted into vendor_applications (status: pending)
        ↓
Admin reviews in /admin/ dashboard
        ↓
Admin approves → vendor row created → invite email sent via Supabase Auth
        ↓
Vendor sets password via magic link
        ↓
Vendor completes profile (menu, location, photo, hours)
        ↓
Profile goes live on /vendors/[slug]/
```

**Application form fields:**
- Business name
- Cuisine type (burger, plate lunch, shave ice, tacos, etc.)
- Primary location / neighborhood
- Contact email & phone
- Instagram handle (optional)
- Brief description

---

## 3. Customer Account Workflow

### Guest flow (no account needed)
- Browse vendors, menu, specials
- Place orders (name + note only)
- Submit reviews

### Authenticated customer flow
- Sign up / magic link login
- Order history across all vendors
- Save favorite vendors
- Earn and redeem loyalty points
- Receive push notifications for order status

### Auth method
- Supabase magic link (no password friction)
- Optional: Google OAuth for returning users

---

## 4. Admin Approval System

See `docs/ADMIN_APPROVAL_SYSTEM.md` for full detail.

### Summary
- Separate `/admin/` dashboard, protected by `admin` role in Supabase
- Vendor application queue with approve/reject/request-info actions
- Reject sends templated email explaining why
- Approve triggers vendor account creation + onboarding email
- Admin can suspend/reactivate vendors at any time
- Flagged reviews queue (customer reports)

---

## 5. Order Management Workflow

### Customer side
1. Customer browses vendor storefront
2. Adds items to cart (session storage)
3. Submits order with name and optional note
4. Receives order confirmation with estimated wait
5. Sees status updates: `pending → preparing → ready`

### Vendor side
1. New order appears in vendor dashboard (Realtime subscription)
2. Vendor taps order to view details
3. Vendor updates status: `preparing → ready`
4. Customer notified via push (if subscribed)

### Order states
`pending` → `preparing` → `ready` → `done` | `cancelled`

### Supabase Realtime
- Vendor dashboard subscribes to `orders` table filtered by `vendor_id`
- Customer confirmation page subscribes to their order row by `id`

---

## 6. QR Ordering System

### Per-vendor QR codes
- Generated at `/vendor/qr.html` in the dashboard
- Links to `https://localgrindz.app/vendors/[slug]/?source=qr`
- Downloadable as PNG for printing on truck, flyers, menus

### QR flow
```
Customer scans QR
        ↓
Opens vendor storefront in browser (PWA install prompt shown)
        ↓
Browses menu → adds to cart → places order
        ↓
Order confirmation shown on screen
```

### Table/spot QR (future)
- QR encodes a spot number: `?spot=3`
- Order includes spot so vendor knows where to bring food

### Implementation
- Use `qrcodejs` library (CDN, no build step)
- Generate client-side, download via canvas `toDataURL()`

---

## 7. Loyalty Across Vendors

### Earn
- 1 point per $1 spent at any Local Grindz vendor
- Bonus points for first order at a new vendor (+10)
- Bonus points for leaving a verified review (+5)

### Redeem
- 100 points = $1 off any order
- Applied at checkout as a discount code
- Vendor is reimbursed by platform (revenue model detail in `docs/REVENUE_MODEL.md`)

### Supabase tables needed
```sql
-- customer_points
customer_id, vendor_id, points_earned, order_id, created_at

-- point_redemptions
customer_id, points_used, discount_amount, order_id, created_at
```

### No expiry (Phase 3). Expiry policy deferred to Phase 4.

---

## 8. Push Notifications

### Web Push (PWA)
- Service worker handles `push` event
- Permission requested after first order placed
- Payload: order status change, new specials from saved vendors

### Implementation
- Supabase Edge Function triggers push on `orders` row update
- VAPID keys stored in Supabase secrets
- Subscription stored in `push_subscriptions` table

### Notification types
| Trigger | Message |
|---------|---------|
| Order status → `preparing` | "Your order is being prepared!" |
| Order status → `ready` | "Your order is ready for pickup!" |
| New special from saved vendor | "Ala's Kitchen just posted a deal" |
| Vendor goes live at new location | "Ala's Kitchen is now open at Beachside Park" |

---

## 9. Vendor Analytics

### Vendor dashboard — Analytics tab
- Orders today / this week / this month
- Revenue today / this week / this month
- Top-selling items (ranked by qty)
- Review average and count
- Page views (tracked client-side, stored in `vendor_events` table)

### Charts
- Use Chart.js (CDN) — no build step
- Daily order volume (7-day bar chart)
- Revenue trend (30-day line chart)

### Supabase query example
```sql
select date_trunc('day', created_at) as day, count(*), sum(total)
from orders
where vendor_id = $1 and created_at > now() - interval '30 days'
group by day
order by day;
```

---

## 10. Featured Paid Listings

### What vendors get
- Top placement in vendor directory
- "Featured" badge on storefront card
- Highlighted in "Today's Picks" section on homepage
- Included in push notifications to all customers (weekly)

### Pricing (proposed)
| Tier | Price | Duration |
|------|-------|----------|
| Boost | $10 | 7 days |
| Feature | $25 | 30 days |
| Anchor | $75 | 90 days |

### Implementation
- Admin marks vendor as featured with expiry date in `vendor_features` table
- Homepage and directory query `is_featured = true AND feature_expires_at > now()`
- Payment via Stripe (Phase 4) — Phase 3 admin sets manually after payment received

---

## 11. Supabase Table Additions

```sql
-- Vendor applications (pre-approval)
create table vendor_applications (
  id uuid primary key default uuid_generate_v4(),
  business_name text not null,
  cuisine_type text,
  location text,
  contact_email text not null,
  contact_phone text,
  instagram text,
  description text,
  status text not null default 'pending', -- pending | approved | rejected
  admin_note text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

-- Customer accounts (extends Supabase auth.users)
create table customers (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  total_points integer not null default 0,
  created_at timestamptz default now()
);

-- Loyalty points ledger
create table customer_points (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  vendor_id uuid references vendors(id),
  order_id uuid references orders(id),
  points integer not null,
  reason text, -- 'purchase' | 'review' | 'first_visit' | 'redemption'
  created_at timestamptz default now()
);

-- Saved/favourite vendors
create table customer_favorites (
  customer_id uuid references customers(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (customer_id, vendor_id)
);

-- Push notification subscriptions
create table push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz default now()
);

-- Featured vendor listings
create table vendor_features (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id) on delete cascade,
  tier text not null, -- 'boost' | 'feature' | 'anchor'
  feature_expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Vendor page view events (lightweight analytics)
create table vendor_events (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id) on delete cascade,
  event_type text not null, -- 'page_view' | 'qr_scan' | 'menu_view'
  source text, -- 'qr' | 'direct' | 'directory'
  created_at timestamptz default now()
);

-- Add slug to vendors table
alter table vendors add column if not exists slug text unique;
alter table vendors add column if not exists cuisine_type text;
alter table vendors add column if not exists description text;
alter table vendors add column if not exists photo_url text;
alter table vendors add column if not exists is_active boolean not null default true;
```

---

## 12. RLS / Security Plan

### Principle: deny by default, grant explicitly

| Table | Public Read | Public Write | Vendor Write | Admin Write |
|-------|-------------|--------------|--------------|-------------|
| vendors | slug, name, cuisine, status only | No | Own row | Yes |
| menu_items | available=true | No | Own vendor_id | Yes |
| locations | All | No | Own vendor_id | Yes |
| specials | active=true | No | Own vendor_id | Yes |
| orders | No | Insert only | Own vendor_id | Yes |
| reviews | approved=true | Insert only | No | Yes |
| customers | No | Own row | No | Yes |
| customer_points | Own row | No | No | Yes |
| vendor_applications | No | Insert only | No | Yes |
| vendor_features | featured fields only | No | No | Yes |
| push_subscriptions | No | Own row | No | Yes |

### Admin role
```sql
create role admin_role;
-- Granted via Supabase dashboard to admin user
-- All tables: full access via service_role key in Edge Functions only
```

### Vendor identity check pattern
```sql
-- Used in all vendor RLS policies
vendor_id = (select id from vendors where email = auth.email())
```

### Sensitive fields never exposed to public anon key
- `vendors.email`
- `orders.customer_note` (only vendor + admin)
- `push_subscriptions` (entire table)

---

## 13. Testing Checklist

### Public site
- [ ] Homepage loads from GitHub Pages
- [ ] Menu loads from Supabase (not JSON fallback)
- [ ] Location loads from Supabase
- [ ] Specials load from Supabase
- [ ] Reviews load from Supabase
- [ ] Static JSON fallback loads when Supabase URL is blank
- [ ] Order form submits and row appears in Supabase
- [ ] Review form submits and row appears in Supabase
- [ ] PWA install prompt appears on mobile
- [ ] Service worker caches assets for offline use

### Vendor dashboard
- [ ] Login with correct credentials succeeds
- [ ] Login with wrong credentials shows error
- [ ] Logout works and redirects to login
- [ ] Menu tab loads vendor's items
- [ ] Add menu item saves and appears in list
- [ ] Toggle item availability updates in real time on public site
- [ ] Delete item removes from list and public site
- [ ] Location tab loads current location
- [ ] Save location updates public site
- [ ] Specials tab loads active specials
- [ ] Add special saves and appears on public site
- [ ] Deactivate special removes from public site
- [ ] Orders tab shows submitted orders
- [ ] Order status update saves

### Security
- [ ] Anon user cannot read `vendors.email`
- [ ] Anon user cannot read other vendors' orders
- [ ] Vendor cannot update another vendor's menu
- [ ] Admin routes return 403 for non-admin users

---

## 14. Deployment Checklist

### Per release
- [ ] All changes on feature branch, not main
- [ ] `scripts/config.js` has correct Supabase URL and anon key
- [ ] Static JSON fallbacks are up to date
- [ ] Service worker cache version bumped if assets changed
- [ ] New Supabase tables migrated before code ships
- [ ] RLS policies tested for new tables
- [ ] GitHub Pages builds successfully after merge to main
- [ ] Test public site on mobile (iOS Safari + Android Chrome)
- [ ] Test vendor dashboard on mobile

### Before Phase 3 launch
- [ ] Custom domain configured on GitHub Pages
- [ ] HTTPS confirmed (GitHub Pages provides this)
- [ ] Supabase project not on free tier pause schedule (upgrade to Pro)
- [ ] At least 2 vendors onboarded and live
- [ ] Admin account confirmed working
- [ ] Push notification VAPID keys generated and stored in Supabase secrets
- [ ] QR codes printed and tested for at least 1 vendor
