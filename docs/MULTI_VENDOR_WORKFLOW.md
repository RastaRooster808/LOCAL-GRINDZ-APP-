# Local Grindz — Multi-Vendor Workflow

## Overview

This document covers the end-to-end flow for adding, managing, and displaying multiple food truck vendors on the Local Grindz platform.

---

## Vendor Data Model

Each vendor has:
- A unique `id` (UUID, internal)
- A unique `slug` (URL-safe name, public — e.g. `alas-kitchen`)
- A `vendor_id` foreign key on all their data (menu, location, specials, orders)
- Auth tied to their email in `auth.users` + matching row in `vendors`

---

## Vendor Directory Page (`/vendors/`)

### What it shows
- Grid of vendor cards, sorted: featured first, then alphabetical
- Each card: vendor name, cuisine type, current location, open/closed badge, thumbnail photo

### Data query (client-side)
```js
const { data } = await db
  .from('vendors')
  .select(`
    slug, name, cuisine_type, description, photo_url,
    locations(name, status),
    vendor_features(feature_expires_at)
  `)
  .eq('is_active', true)
  .order('name');
```

### Filter controls
- "Open Now" toggle — filters where `locations.status = 'open'`
- Cuisine type chips — burger, plate lunch, tacos, shave ice, etc.
- Neighborhood — Hilo, Puna, Kona, Waimea, etc.

---

## Per-Vendor Storefront (`/vendors/[slug]/`)

### Static generation strategy
Because the app is static HTML/JS, vendor pages are not pre-generated. Instead:

1. `/vendors/index.html` — directory page, fetches all vendors
2. `/vendors/storefront.html` — single template page, reads `?vendor=[slug]` from URL
3. QR codes and links point to `/vendors/storefront.html?vendor=alas-kitchen`

### Page sections (same as main site, vendor-scoped)
- Hero: vendor name, cuisine, photo
- Live location widget
- Today's specials
- Full menu with cart
- Order form
- Reviews for this vendor

### Analytics event on load
```js
await db.from('vendor_events').insert({
  vendor_id: vendor.id,
  event_type: 'page_view',
  source: new URLSearchParams(location.search).get('source') || 'direct'
});
```

---

## Vendor Isolation via RLS

All vendor data is isolated by `vendor_id`. A vendor can only read/write rows where:

```sql
vendor_id = (select id from vendors where email = auth.email())
```

This means:
- Vendor A cannot see or edit Vendor B's menu
- Vendor A cannot see Vendor B's orders
- Public can read all active menus/locations (no vendor filtering needed — each storefront only queries its own slug)

---

## Adding a New Vendor (Manual — Phase 3)

Until the admin approval workflow is live, add vendors manually:

```sql
-- 1. Insert vendor row
INSERT INTO vendors (email, name, slug, cuisine_type, description, is_active)
VALUES ('vendor@email.com', 'Truck Name', 'truck-name', 'burger', 'Short bio', true)
RETURNING id;

-- 2. Seed their menu (replace VENDOR_ID)
INSERT INTO menu_items (vendor_id, name, description, price, category) VALUES
  ('VENDOR_ID', 'Item Name', 'Description', 12.00, 'burger');

-- 3. Set their initial location
INSERT INTO locations (vendor_id, name, address, hours, status) VALUES
  ('VENDOR_ID', 'Location Name', 'Address, HI', '11am – 6pm', 'open');
```

Then send the vendor an invite via Supabase Auth → Authentication → Invite User.

---

## Vendor Dashboard Routing

The vendor dashboard (`/vendor/`) auto-detects which vendor is logged in:

```js
const { data: { user } } = await db.auth.getUser();
const { data: vendor } = await db
  .from('vendors')
  .select('id, name, slug')
  .eq('email', user.email)
  .single();
```

All subsequent queries use `vendor.id` — no vendor can access another's data even if they manipulate the UI.

---

## Slug Generation

When adding a vendor, generate the slug from the business name:

```js
function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
// "Ala's Kitchen" → "alas-kitchen"
```

Slugs must be unique. Check before inserting:
```sql
SELECT id FROM vendors WHERE slug = 'alas-kitchen';
```

---

## Vendor Status Lifecycle

```
applied → pending_approval → active → suspended → reactivated
```

| Status | `is_active` | Visible in directory | Can log in |
|--------|-------------|----------------------|------------|
| pending | false | No | No |
| active | true | Yes | Yes |
| suspended | false | No | No (shows message) |

---

## Phase 3 Vendor Milestones

| # | Feature | Dependencies |
|---|---------|--------------|
| 1 | Vendor directory page | `vendors.slug`, `cuisine_type` column |
| 2 | Per-vendor storefront template | Slug routing in JS |
| 3 | Vendor application form | `vendor_applications` table |
| 4 | Admin approval flow | Admin role + email triggers |
| 5 | QR code generator in dashboard | `qrcodejs` library |
| 6 | Vendor photo upload | Supabase Storage bucket |
| 7 | Realtime order notifications | Supabase Realtime subscription |
