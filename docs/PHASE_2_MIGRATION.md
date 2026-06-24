# Local Grindz — Phase 2 Migration Guide

**Status:** Ready to implement  
**Backend:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions)  
**Constraint:** GitHub Pages site stays live throughout — JSON fallback always works

---

## What Phase 2 Adds

| Feature | Phase 1 (now) | Phase 2 |
|---|---|---|
| Vendor data | Static JSON | Supabase `vendors` table |
| Menu | Static JSON | Live DB, vendor can edit |
| Location / status | Static JSON | Vendor toggles "I'm Open" live |
| Specials | Static JSON | Vendor creates from portal |
| Loyalty stamps | localStorage only | Server-validated, cross-device |
| Orders | Local ticket, no persistence | Real ticket, status updates |
| Reviews | None | Stored, admin-approved |
| Vendor login | None | Magic link via Supabase Auth |
| Admin approval | Manual JSON edit | Approval queue in DB |

The app still loads from JSON when Supabase is not configured, so the
live GitHub Pages site is unaffected until you flip the config switch.

---

## Files Added in Phase 2

```
LOCAL-GRINDZ-APP-/
├── docs/
│   └── PHASE_2_MIGRATION.md   ← this file
├── scripts/
│   └── api.js                 ← dual-mode data layer (NEW)
└── supabase/
    └── schema.sql             ← full DB schema + seed data (NEW)
```

## Files That Will Be Updated (not removed)

```
scripts/app.js         replace fetch() calls with LocalGrindzAPI.*
scripts/dashboard.js   replace fetch() calls with LocalGrindzAPI.*
scripts/menu.js        replace fetch() calls with LocalGrindzAPI.*
scripts/order.js       replace submitOrder() with LocalGrindzAPI.submitOrder()
scripts/loyalty.js     replace stamp validation with LocalGrindzAPI.validateStamp()
scripts/vendor.js      replace update submit with LocalGrindzAPI.submitVendorUpdate()
index.html             add api.js script tag + optional config block
menu.html              add api.js script tag
order.html             add api.js script tag
loyalty.html           add api.js script tag
vendor.html            add api.js script tag
dashboard.html         add api.js script tag
service-worker.js      bump cache name, add api.js to cache list
```

## Files That Stay Exactly As-Is

```
data/vendors.json      JSON fallback — never deleted
data/menus.json        JSON fallback — never deleted
data/locations.json    JSON fallback — never deleted
data/specials.json     JSON fallback — never deleted
data/loyalty.json      JSON fallback — never deleted
data/updates.json      JSON fallback — never deleted
styles/                all CSS unchanged
scripts/nav.js         unchanged
manifest.json          unchanged
favicon.ico            unchanged
icons/                 unchanged
```

---

## Step 1 — Create the Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `local-grindz`
3. Database password: generate a strong password and save it
4. Region: `us-west-1` (Oregon — closest to Hawai'i)
5. After project spins up (≈ 2 min), go to **Settings → API**
6. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon / public key** → `SUPABASE_ANON_KEY`

---

## Step 2 — Run the Schema

1. In Supabase: **SQL Editor → New query**
2. Paste the full contents of `supabase/schema.sql`
3. Click **Run** (≈ 5 sec)
4. Verify in **Table Editor** that all tables appear:
   - vendors, menu_items, locations, specials
   - reviews, loyalty_campaigns, loyalty_cards, stamp_events
   - orders, vendor_updates, admin_users, push_subscriptions
5. Confirm seed data: `vendors` table should have one row for `v001 — Ala's Kitchen`

---

## Step 3 — Create the First Vendor Account

1. In Supabase: **Authentication → Users → Invite user**
2. Enter the vendor's email address
3. They receive a magic link and set their session
4. Copy their **User UID** from the Authentication panel
5. In SQL Editor, link it to the vendor row:

```sql
UPDATE vendors
SET auth_user_id = '<paste-uid-here>'
WHERE vendor_id = 'v001';
```

---

## Step 4 — Create the Admin Account

1. Invite yourself or the developer's email the same way
2. Copy your User UID
3. Insert into admin_users:

```sql
INSERT INTO admin_users (user_id, email, role)
VALUES ('<your-uid>', 'you@example.com', 'super_admin');
```

---

## Step 5 — Add api.js to Each HTML Page

Add the config block **before** any page-specific scripts. The script tag
for `api.js` must come first.

**When Supabase is configured:**
```html
<!-- Add this block to each HTML page <head> or just before </body> -->
<script>
  window.SUPABASE_URL      = 'https://xxxx.supabase.co';
  window.SUPABASE_ANON_KEY = 'eyJ...'; <!-- anon/public key — safe to expose -->
</script>
<script src="/scripts/api.js"></script>
<!-- page script comes after -->
<script src="/scripts/app.js"></script>
```

**Without Supabase (JSON fallback — works today, no change needed):**
```html
<!-- Just add api.js. Without SUPABASE_URL/KEY it silently uses JSON. -->
<script src="/scripts/api.js"></script>
<script src="/scripts/app.js"></script>
```

The anon key is safe to commit to a public repo. Supabase RLS restricts
what the key can actually access. Never commit the service role key.

### Exact changes per page

| Page | Script tag to add before page script |
|---|---|
| `index.html` | `<script src="/scripts/api.js"></script>` before `app.js` |
| `menu.html` | `<script src="/scripts/api.js"></script>` before `menu.js` |
| `order.html` | `<script src="/scripts/api.js"></script>` before `order.js` |
| `loyalty.html` | `<script src="/scripts/api.js"></script>` before `loyalty.js` |
| `vendor.html` | `<script src="/scripts/api.js"></script>` before `vendor.js` |
| `dashboard.html` | `<script src="/scripts/api.js"></script>` before `dashboard.js` |

---

## Step 6 — Update Page Scripts to Use the API

`LocalGrindzAPI` is a global set by `api.js`. Each existing script keeps its
render functions unchanged; only the data-fetching calls change.

### app.js (index.html — customer home)

```js
// Before (Phase 1):
async function loadLocationData() {
  const res = await fetch('/data/locations.json');
  const locations = await res.json();
  renderLocation(locations[0]);
}

// After (Phase 2):
async function loadLocationData() {
  try {
    const locs = await LocalGrindzAPI.getLocations('v001');
    if (locs?.[0]) renderLocation(locs[0]);
  } catch { /* keep static fallback */ }
}
```

Repeat the same pattern for `loadMenuData` → `LocalGrindzAPI.getMenuItems('v001')`
and `loadSpecialsData` → `LocalGrindzAPI.getSpecials('v001')`.

### dashboard.js (vendor dashboard)

```js
// Before:
const [vendorsR, locationsR, menuR, specialsR, updatesR, loyaltyR] = await Promise.allSettled([
  fetchJSON('/data/vendors.json'),
  fetchJSON('/data/locations.json'),
  ...
]);

// After:
const [vendorsR, locationsR, menuR, specialsR, updatesR, loyaltyR] = await Promise.allSettled([
  LocalGrindzAPI.getVendors(),
  LocalGrindzAPI.getLocations('v001'),
  LocalGrindzAPI.getMenuItems('v001'),
  LocalGrindzAPI.getSpecials('v001'),
  LocalGrindzAPI.getVendorUpdates('v001'),
  LocalGrindzAPI.getLoyaltyCampaign('v001'),
]);
```

Render functions (renderVendorHero, renderLocationCard, etc.) need no changes —
they receive the same data shape.

### menu.js

```js
// Before:
const res = await fetch('/data/menus.json');
allItems = await res.json();

// After:
allItems = await LocalGrindzAPI.getMenuItems('v001');
```

### order.js

```js
// Before (local ticket only):
const ticket = `LG-${Math.floor(1000 + Math.random() * 9000)}`;

// After (persists to DB if Supabase is live):
const order = await LocalGrindzAPI.submitOrder({
  vendor_id: 'v001',
  customer_name: name,
  customer_phone: phone,
  items: cart,         // [{item_id, name, price, qty}]
  total: total,
  special_requests: notes,
});
const ticket = order.ticket_number;
```

### loyalty.js

```js
// Before (stamp code fetched to browser — insecure):
campaign.stamp_code = data.stamp_code;  // visible in DevTools

// After (server validates; code never sent to browser):
async function handleAddStamp() {
  const entered = input.value.trim().toUpperCase();

  // Try Supabase Edge Function first
  const result = await LocalGrindzAPI.validateStamp('v001', entered, getCustomerToken());
  if (result !== null) {
    // Supabase mode: use server response
    if (!result.valid) { showFeedback('Invalid code.', 'error'); return; }
    // stamp was recorded server-side; sync card state
    state.stamps = result.stamps;
    ...
  } else {
    // JSON mode: use local comparison (existing logic unchanged)
    const isValid = entered === campaign.stamp_code;
    ...
  }
}
```

### vendor.js

```js
// Before (generates text for copy-paste only):
// no network write

// After (submits to DB when Supabase is live):
const formData = collectFormData();
const result = await LocalGrindzAPI.submitVendorUpdate({
  vendor_id: 'v001',
  type: formData.updateType,
  message: formData.message,
  urgency: formData.urgency,
  dev_notes: formData.devNotes,
  sp_title: formData.spTitle,
  sp_price: formData.spPrice,
  sp_qty: formData.spQty,
  sp_end: formData.spEnd,
});

if (result === null) {
  // JSON mode: fall through to existing copy-to-clipboard flow
  showConfirmation(formData);
} else {
  // Supabase mode: show "Submitted!" confirmation
  showSubmittedConfirmation(result);
}
```

---

## Step 7 — Create the Two Required Edge Functions

Edge Functions are Deno scripts deployed to Supabase's edge network.
Create them at `supabase/functions/` using the Supabase CLI.

### validate-stamp

Validates a loyalty stamp code server-side without exposing it to the browser.

**File:** `supabase/functions/validate-stamp/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { vendor_id, code, customer_token } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // service role — reads stamp_code
  );

  // Fetch campaign including stamp_code (server-side only)
  const { data: campaign } = await supabase
    .from('loyalty_campaigns')
    .select('stamp_code, stamps_required, campaign_active')
    .eq('vendor_id', vendor_id)
    .single();

  if (!campaign?.campaign_active) {
    return Response.json({ valid: false, reason: 'Campaign is paused.' });
  }

  const valid = code.toUpperCase().trim() === campaign.stamp_code.toUpperCase().trim();

  if (!valid) {
    return Response.json({ valid: false, reason: 'Code does not match.' });
  }

  // Upsert loyalty card and add a stamp
  const { data: card } = await supabase
    .from('loyalty_cards')
    .upsert({ vendor_id, customer_token, stamps: 1, lifetime_stamps: 1 },
             { onConflict: 'vendor_id,customer_token', ignoreDuplicates: false })
    .select()
    .single();

  // If card existed, increment stamps
  if (card && card.stamps > 1) {
    await supabase
      .from('loyalty_cards')
      .update({
        stamps: card.stamps + 1,
        lifetime_stamps: card.lifetime_stamps + 1,
      })
      .eq('id', card.id);
  }

  // Log the stamp event
  await supabase.from('stamp_events').insert({ card_id: card.id, event_type: 'stamp' });

  const newStamps = (card?.stamps ?? 0) + 1;
  return Response.json({
    valid: true,
    stamps: newStamps,
    stamps_required: campaign.stamps_required,
    reason: 'Stamp added.',
  });
});
```

### check-order

Returns order status by ticket number without exposing the entire orders table.

**File:** `supabase/functions/check-order/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { ticket_number } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: order } = await supabase
    .from('orders')
    .select('ticket_number, status, customer_name, items, total, created_at')
    .eq('ticket_number', ticket_number)
    .single();

  if (!order) return new Response('Not Found', { status: 404 });

  return Response.json(order);
});
```

### Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project (get project ref from Settings → General)
supabase link --project-ref <your-project-ref>

# Deploy both functions
supabase functions deploy validate-stamp
supabase functions deploy check-order
```

---

## Step 8 — Add Realtime Subscriptions (optional)

Supabase Realtime pushes WebSocket updates to connected browsers.
Add this to `order.js` after submitting an order to show live status:

```js
// Realtime order status (requires Supabase JS client loaded via CDN)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>

const supabase = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

function subscribeToOrderStatus(ticketNumber, onStatusChange) {
  if (!window.SUPABASE_URL) return; // JSON mode — no realtime
  return supabase
    .channel(`order-${ticketNumber}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `ticket_number=eq.${ticketNumber}`,
    }, payload => onStatusChange(payload.new.status))
    .subscribe();
}
```

---

## Step 9 — Add Vendor Auth Guard

Create `scripts/auth.js` to protect vendor-only pages.

```js
// scripts/auth.js
// Guards pages that require vendor login.
// Redirect to /login.html if no session found.

(async function () {
  if (!window.SUPABASE_URL) return; // JSON mode — no auth guard

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = '/login.html?next=' + encodeURIComponent(window.location.pathname);
  } else {
    window._vendorAuthToken = session.access_token;
  }
})();
```

Add to `vendor.html` and `dashboard.html` **before** the page script:

```html
<script src="/scripts/auth.js"></script>
```

Pages to protect with auth: `vendor.html`, `dashboard.html`  
Pages that remain public: `index.html`, `menu.html`, `order.html`, `loyalty.html`

---

## Step 10 — Bump the Service Worker

After adding `api.js` to the project, update `service-worker.js`:

```js
const CACHE_NAME = 'local-grindz-v8';  // bump version
const ASSETS_TO_CACHE = [
  // ... existing list ...
  'scripts/api.js',    // add this line
];
```

---

## Step 11 — Test in JSON Fallback Mode

Before adding Supabase credentials, verify the app still loads correctly:

```bash
# Serve locally (Python built-in server)
cd /path/to/LOCAL-GRINDZ-APP-
python3 -m http.server 8080
```

Open `http://localhost:8080` and confirm:
- [ ] Home page loads with location and featured item
- [ ] Menu page shows all items and category filters work
- [ ] Today's Special card appears (or is hidden if expired)
- [ ] Loyalty stamp input validates against the local code
- [ ] Vendor portal form generates copy-paste summary
- [ ] Dashboard loads all sections
- [ ] Console shows: `[LocalGrindz] JSON fallback mode — add SUPABASE_URL + SUPABASE_ANON_KEY to enable live data.`

---

## Step 12 — Test with Supabase Credentials

Add the config block to one page (e.g. `index.html`) and test:

- [ ] Console shows: `[LocalGrindz] Supabase active — https://xxxx.supabase.co`
- [ ] Home page loads vendor data from Supabase
- [ ] Menu items match what's in the DB
- [ ] Order submission creates a row in the `orders` table
- [ ] Loyalty stamp validation calls the Edge Function (check Network tab)
- [ ] Vendor update submission appears in `vendor_updates` table

---

## What Still Needs Manual Setup in Supabase

| Task | Where in Supabase | Notes |
|---|---|---|
| Run `schema.sql` | SQL Editor | One-time; safe to re-run |
| Create vendor auth account | Authentication → Users → Invite | One per vendor |
| Link vendor UID to vendors table | SQL Editor (Step 3 above) | After vendor accepts invite |
| Create admin auth account | Authentication → Users → Invite | Developer/admin email |
| Insert admin_users row | SQL Editor (Step 4 above) | Required for approval queue |
| Deploy Edge Functions | Supabase CLI | `validate-stamp` + `check-order` |
| Set Edge Function secrets | Supabase Dashboard → Functions → Secrets | `SUPABASE_SERVICE_ROLE_KEY` |
| Enable Realtime on `orders` table | Database → Replication | Toggle orders table on |
| Generate VAPID keys (push notifications) | Terminal: `npx web-push generate-vapid-keys` | Phase 2B |
| Configure `send-push` Edge Function | After VAPID keys generated | Phase 2B |
| Set up custom domain (optional) | Supabase → Settings → Custom Domains | After MVP is stable |

---

## Rollback Plan

The JSON files are never touched or deleted. To roll back to Phase 1:

1. Remove the `<script>` config block with `SUPABASE_URL` / `SUPABASE_ANON_KEY` from each HTML file
2. The app immediately reverts to JSON mode
3. Bump the service worker cache name to force a refresh

No database changes are needed. No data is lost.

---

## Database Schema Summary

See `supabase/schema.sql` for the complete, runnable SQL.

| Table | Purpose | Public Read | Auth Write |
|---|---|---|---|
| `vendors` | Vendor profiles | Approved only | Own row |
| `menu_items` | Menu items | Available + approved vendor | Own vendor |
| `locations` | Live location + status | All approved | Own vendor |
| `specials` | Active specials | Active + approved vendor | Own vendor |
| `reviews` | Customer reviews | Approved only | Anyone (anon) |
| `loyalty_campaigns` | Loyalty program config | Via public view (no stamp_code) | Own vendor |
| `loyalty_cards` | Per-device stamp counts | By customer_token | Edge Function |
| `stamp_events` | Stamp + redeem audit log | None | Edge Function only |
| `orders` | Customer orders | None (use check-order fn) | Anyone insert; vendor status |
| `vendor_updates` | Update submissions | Own vendor | Anyone insert |
| `admin_users` | Admin role registry | None | Admin only |
| `push_subscriptions` | Web Push subscriptions | Own token | Anyone insert |

---

## Security Notes

- **anon key** — safe to put in client-side JS and commit to GitHub. Supabase RLS controls access.
- **service_role key** — never expose in the browser or commit it. Used only in Edge Functions.
- **stamp_code** — stored in `loyalty_campaigns` but excluded from all public SELECT policies. Only the `validate-stamp` Edge Function reads it using the service role key.
- **orders** — no public SELECT allowed. Customers look up their own order only via the `check-order` Edge Function.
- **admin_users** — no public read; `is_admin()` function is SECURITY DEFINER and can't be bypassed.
