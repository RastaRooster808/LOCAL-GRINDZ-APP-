# Local Grindz — Phase 4 Roadmap

## Vision
Build Local Grindz into the digital marketplace for Hawaiʻi's food community — a platform that lets vendors manage their business from a phone while customers discover local food, order, earn rewards, and support neighborhood businesses. Architecture should be modular to expand to farmers markets, craft vendors, cultural events, and community organizations.

---

## Architectural Decision Point

Phase 4 introduces a fork: **stay vanilla JS** or **migrate to React + TypeScript**.

| Factor | Vanilla JS (current) | React + TypeScript |
|---|---|---|
| Time to ship | Fast — no build step | Slower — setup + migration |
| Component reuse | Manual | Hooks, contexts, libraries |
| State management | Global vars + DOM | useState/useReducer/Zustand |
| Realtime UI | Manual DOM updates | React Query + Supabase hooks |
| Team onboarding | Anyone | React devs |
| Existing codebase | Keep as-is | Rewrite or incremental migration |
| Deployment | GitHub Pages (static) | Vercel/Netlify (still static) |

**Recommendation:** Migrate to React + TypeScript for Phase 4. The Realtime dashboard, vendor inbox, live orders, and customer profiles all require complex state that vanilla JS will make painful to maintain. New pages can be built in React while existing pages stay vanilla until replaced.

---

## Priority Sequence

### Phase 4A — Core Infrastructure (build first, everything depends on these)
1. **#21 Security** — RLS audit, rate limiting, input sanitization
2. **#7 Image Storage** — Supabase Storage for vendor logos, banners, menu photos
3. **#20 Performance** — Lighthouse 95+ baseline before adding complexity

### Phase 4B — Vendor Operations (revenue-enabling features)
4. **#3 Live Orders** — Full order lifecycle with customer-visible status updates
5. **#1 Live Vendor Dashboard** — Realtime across all data (orders, reviews, favorites, loyalty)
6. **#6 Menu Builder** — Visual editor with categories, modifiers, photos, drag-and-drop
7. **#13 Vendor Specials** — Countdown timers, auto-expiry, homepage feature
8. **#8 Vendor Verification** — Badge system (Verified, Local Farm, Organic, etc.)

### Phase 4C — Customer Experience
9. **#9 Customer Profiles** — Requires auth (magic link), favorites, order history, loyalty history
10. **#16 Review Improvements** — Photos, replies, helpful votes, verified purchase
11. **#11 QR Ecosystem** — Per-vendor QR for profile/menu/loyalty/review/order, PNG/SVG/PDF
12. **#15 Interactive Map** — OpenStreetMap (free) with cluster pins, filters, Open Now

### Phase 4D — Growth & Engagement
13. **#10 Rewards Engine** — Points + punch cards + coupons + birthday rewards + referrals
14. **#17 Customer Referral System** — Referral codes, tracking, leaderboard
15. **#5 Vendor Analytics Dashboard** — Full charts: revenue, returning customers, heat map
16. **#14 Featured Listings** — Paid promotion with homepage carousel, auto-expiry

### Phase 4E — Platform Scale
17. **#2 Vendor Inbox** — Realtime messaging, typing indicator, unread badge, attachments
18. **#4 Push Notifications** — Web Push via Supabase Edge Functions
19. **#12 AI Search** — Natural language search across vendors/menus/reviews/specials
20. **#18 Admin Console** — Full platform management: approvals, suspensions, analytics, campaigns
21. **#19 Offline Mode** — Enhanced service worker: order queue, sync on reconnect

---

## Feature Specs

### #1 Live Vendor Dashboard
- Supabase Realtime channels per vendor_id
- Events: INSERT on orders, reviews, customer_favorites, customer_points
- No polling — event-driven DOM updates
- Toast notifications for each event type
- Unread counts in tab labels

### #2 Vendor Inbox
```sql
create table vendor_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null,
  sender_id uuid references auth.users(id),
  receiver_vendor_id uuid references vendors(id),
  body text not null,
  read boolean default false,
  attachment_url text,
  created_at timestamptz default now()
);
```
- Realtime channel per conversation_id
- Typing indicator via ephemeral broadcast (no DB write)
- Unread badge on vendor dashboard tab
- Push notification on new message

### #3 Live Orders — Full Lifecycle
**Order statuses:** `pending → accepted → preparing → ready → completed | cancelled`

Customer side:
- Order confirmation page: `?order=<uuid>`
- Realtime subscription to single order row
- Visual status stepper (Accepted → Preparing → Ready)
- Push notification at each status change

Vendor side:
- Accept/Reject buttons on new orders
- One-tap status progression
- Sound alert on new order (Web Audio API)
- Count badge on browser tab

```sql
alter table orders add column if not exists
  estimated_minutes integer,
  accepted_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  cancellation_reason text;
```

### #4 Push Notifications
- Service worker `push` event handler (skeleton already in service-worker.js)
- Supabase Edge Function: `notify-customer`
  - Triggered by order status changes
  - Sends Web Push via VAPID keys
  - Payload: title, body, icon, order URL
- Customer subscribes on first order submit

### #5 Vendor Analytics
Charts (Chart.js):
- Orders per day (7/30/90 day)
- Revenue per day
- Average ticket size
- Top menu items by qty and revenue
- QR scans vs direct traffic (vendor_events)
- Review count over time
- Loyalty points issued vs redeemed
- Orders by hour heatmap

### #6 Menu Builder
- Drag-and-drop via native HTML5 drag API (no library needed)
- Item photos: upload to Supabase Storage → store URL in menu_items.photo_url
- Modifiers: `menu_modifiers` table (e.g., "Size: Small/Medium/Large", "Add cheese: +$1")
- Sold Out toggle (already exists as `available`)
- Featured Item flag: `menu_items.featured boolean`
- Category reordering: `menu_categories` table with sort_order

```sql
create table menu_categories (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id),
  name text not null,
  sort_order integer default 0
);

alter table menu_items
  add column if not exists photo_url text,
  add column if not exists featured boolean default false,
  add column if not exists category_id uuid references menu_categories(id);

create table menu_modifiers (
  id uuid primary key default uuid_generate_v4(),
  menu_item_id uuid references menu_items(id) on delete cascade,
  label text not null,
  options jsonb not null, -- [{ name: 'Small', price_delta: 0 }, ...]
  required boolean default false
);
```

### #7 Image Storage
- Supabase Storage bucket: `vendor-assets` (public reads, authenticated writes)
- RLS: vendors write only to `{vendor_id}/*` path
- Images: logo (400×400), banner (1200×400), menu items (600×600)
- Client-side compression before upload (Canvas API)
- Lazy loading via `loading="lazy"` + Intersection Observer

### #8 Vendor Verification Badges
```sql
alter table vendors add column if not exists
  badges text[] default '{}';
-- Values: 'verified' | 'community-favorite' | 'local-farm' | 'organic'
--         | 'food-truck' | 'pop-up' | 'featured'
```
- Admin assigns badges from admin console
- Badges render on vendor cards, directory, and storefront header

### #9 Customer Profiles
Requires Supabase magic-link auth for customers (no password).
```sql
create table customer_profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  avatar_url text,
  diet_preferences text[],
  created_at timestamptz default now()
);
-- customer_favorites already exists
-- orders already has customer_email — link by email until profile migration
```

### #10 Rewards Engine
```sql
create table loyalty_campaigns (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id),
  type text not null, -- 'points' | 'punch_card' | 'coupon' | 'birthday' | 'referral'
  config jsonb not null, -- flexible per type
  active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz
);

create table coupon_codes (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id),
  code text unique not null,
  discount_type text not null, -- 'percent' | 'fixed'
  discount_value numeric not null,
  max_uses integer,
  uses integer default 0,
  expires_at timestamptz
);
```

### #11 QR Ecosystem
Per-vendor QR codes for:
- `/vendors/storefront.html?vendor={slug}` — profile
- `/vendors/storefront.html?vendor={slug}#menu` — menu
- `/vendors/storefront.html?vendor={slug}#order` — ordering
- `/vendors/storefront.html?vendor={slug}#reviews` — reviews
- `/vendors/storefront.html?vendor={slug}&loyalty=true` — loyalty check-in

Downloads: PNG (canvas), SVG (inline), PDF (jsPDF library)

### #12 AI Search
- Supabase `pgvector` extension
- Embed vendor descriptions, menu items, reviews → store in `embeddings` table
- Edge Function: `search` — takes query, embeds it, returns cosine similarity matches
- Fallback: full-text search via Postgres `tsvector` (no AI cost)
- Client: single search input on directory page

### #13 Vendor Specials — Enhanced
```sql
alter table specials add column if not exists
  countdown boolean default false,
  featured_on_homepage boolean default false,
  push_sent boolean default false;
```
- Countdown timer rendered client-side from `expires_at`
- Auto-hide when expired (CSS + JS check)
- Edge Function trigger: when `featured_on_homepage = true` → send push notification

### #14 Featured Listings
- Already have `vendor_features` table with tier + expiry
- Add: homepage carousel (CSS scroll-snap)
- Map pin highlight color by tier
- Tiers: `boost` (7 days) | `featured` (30 days) | `spotlight` (homepage hero)

### #15 Interactive Map
- OpenStreetMap + Leaflet.js (free, no API key)
- Cluster pins via Leaflet.markercluster
- Each pin: vendor name, status badge, cuisine, link to storefront
- Filter by: Open Now, cuisine, neighborhood
- Geolocation: "Near Me" button

### #16 Review Improvements
```sql
alter table reviews
  add column if not exists photo_url text,
  add column if not exists vendor_reply text,
  add column if not exists vendor_replied_at timestamptz,
  add column if not exists helpful_count integer default 0,
  add column if not exists reported boolean default false;
```

### #17 Customer Referral System
```sql
create table referral_codes (
  id uuid primary key default uuid_generate_v4(),
  customer_email text not null,
  code text unique not null,
  uses integer default 0,
  points_earned integer default 0,
  created_at timestamptz default now()
);
```
- Each customer gets a unique code after first order
- Referral earns 50 pts when referee places first order
- Referee earns 25 pts on first order
- Leaderboard: top referrers by month

### #18 Admin Console — Extended
New tabs beyond current (Applications / Vendors / Featured):
- **Reports** — abuse reports on reviews
- **Analytics** — platform-wide: GMV, active vendors, orders/day, new signups
- **Push Campaigns** — send platform-wide or vendor-targeted push notifications
- **Announcements** — markdown banner shown on homepage

### #19 Offline Mode — Enhanced
Service worker additions:
- Cache vendor pages visited (storefront.html + data)
- Queue orders placed offline → sync on reconnect via Background Sync API
- Offline indicator banner
- Cache menu JSON per vendor

### #20 Performance Targets
- Lighthouse Performance: 95+
- Lighthouse Accessibility: 95+
- Lighthouse SEO: 100 (meta tags, OG, structured data)
- Lighthouse PWA: passing
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms
- Image optimization: WebP, lazy load, explicit width/height

### #21 Security Checklist
- [ ] Full RLS audit — every table has explicit policies, no `using (true)` on sensitive data
- [ ] Service key never in frontend code
- [ ] Rate limiting on order submit (1 order/10s per IP) — Edge Function
- [ ] Input sanitization: strip HTML from all text fields before DB insert
- [ ] Duplicate order prevention: idempotency key on order submit
- [ ] VAPID private key stored in Supabase Vault (not .env)
- [ ] Admin routes: double-check `admins` table row required, not just URL obscurity
- [ ] Review `SECURITY DEFINER` functions — grant execute only where needed

---

## SQL Migrations Needed (Phase 4)
1. `phase-4a-security-audit.sql`
2. `phase-4b-image-storage.sql` (bucket + RLS)
3. `phase-4c-orders-lifecycle.sql`
4. `phase-4d-menu-builder.sql`
5. `phase-4e-customer-profiles.sql`
6. `phase-4f-rewards-engine.sql`
7. `phase-4g-messaging.sql`
8. `phase-4h-referrals.sql`
9. `phase-4i-review-improvements.sql`
10. `phase-4j-ai-search.sql` (pgvector)

## Edge Functions Needed (Phase 4)
1. `notify-customer` — Web Push on order status change
2. `notify-vendor` — Web Push on new order
3. `search` — AI/vector search with pgvector fallback to tsvector
4. `send-campaign` — Admin-triggered push to all subscribers
5. `process-referral` — Award points when referral code used

---

## Tech Stack Additions
| Need | Choice | Reason |
|---|---|---|
| React migration | Vite + React 18 + TypeScript | Fast build, excellent DX |
| State management | Zustand | Lightweight, no boilerplate |
| Realtime hooks | `@supabase/supabase-js` v2 hooks | Native |
| Map | Leaflet.js | Free, no API key |
| PDF generation | jsPDF | Client-side QR PDF export |
| Push notifications | Web Push API + VAPID | Browser-native |
| AI embeddings | Supabase + pgvector | Integrated, no extra service |
| Image compression | browser-image-compression | Client-side before upload |
| Drag and drop | HTML5 native drag API | No library needed for menu |
