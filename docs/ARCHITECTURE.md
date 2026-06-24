# Local Grindz — Platform Architecture

A new developer should be fully oriented after reading this document.

---

## What this is

Local Grindz is a **static Progressive Web App** deployed on GitHub Pages. There is no server, no database, no login system, and no build pipeline. All data lives in JSON files committed to the repository. The vendor communicates updates by filling out a form that generates formatted text; the developer manually edits the JSON files and pushes — GitHub Pages deploys in under two minutes.

---

## File Structure

```
/
├── index.html            Customer home screen
├── menu.html             Full menu browser
├── order.html            Build-an-order + ticket generator
├── loyalty.html          Digital punch card (localStorage)
├── vendor.html           Vendor update portal
├── dashboard.html        Vendor dashboard (read-only data view)
│
├── styles/
│   ├── main.css          Global tokens, layout, nav, utility classes
│   ├── pages.css         Shared styles for menu/order/loyalty pages
│   ├── vendor.css        Vendor portal styles
│   └── dashboard.css     Dashboard styles
│
├── scripts/
│   ├── nav.js            Shared navigation component (injected at runtime)
│   ├── app.js            Customer home: location, featured item, specials
│   ├── menu.js           Menu page: fetch + render + category filtering
│   ├── order.js          Order page: cart logic + ticket generation
│   ├── loyalty.js        Loyalty page: stamp logic + localStorage
│   ├── vendor.js         Vendor portal: form, summary generation, clipboard
│   └── dashboard.js      Dashboard: fetch all JSON, render overview
│
├── data/
│   ├── vendors.json      Vendor profile (name, tagline, contact, status)
│   ├── menus.json        Menu items (price, category, spicy_level, featured)
│   ├── locations.json    Current truck location, hours, live_status
│   ├── specials.json     Time-limited specials (price, qty, end_time, active)
│   ├── loyalty.json      Loyalty campaign config (stamp_code, stamps_required)
│   └── updates.json      Log of vendor-submitted updates with developer_status
│
├── docs/
│   └── ARCHITECTURE.md   This file
│
├── service-worker.js     Cache-first PWA service worker (v6)
└── manifest.json         PWA manifest (name, icons, theme)
```

---

## Data Files — Purpose and Shape

### `data/vendors.json`
One object per vendor. Currently one vendor (Ala's Kitchen).

```json
[{
  "vendor_id": "v001",
  "business_name": "Ala's Kitchen",
  "tagline": "Get Smashed",
  "contact_name": "Ala",
  "approved_status": true
}]
```

Read by: `dashboard.js`, `vendor.js`

---

### `data/menus.json`
All menu items. Set `featured: true` on one item to highlight it on the home screen.

```json
[{
  "item_id": "m001",
  "name": "Volcano Smash",
  "description": "...",
  "price": 14.00,
  "category": "burgers",
  "spicy_level": 3,
  "available": true,
  "featured": true
}]
```

Read by: `app.js`, `menu.js`, `order.js`, `dashboard.js`

---

### `data/locations.json`
Current truck position. Update `live_status`, `current_location_name`, `hours_today`, and `last_updated` whenever the truck moves.

```json
[{
  "vendor_id": "v001",
  "current_location_name": "Kalapana Black Sand Beach",
  "address": "End of Hwy 130, Pahoa, HI 96778",
  "hours_today": "11:00 AM – 7:00 PM",
  "live_status": "open",
  "last_updated": "2026-06-24T10:00:00-10:00"
}]
```

`live_status` is either `"open"` or `"closed"`. Read by: `app.js`, `dashboard.js`

---

### `data/specials.json`
Time-limited specials. Set `active: true` and provide an ISO `end_time` in HST (`-10:00`). The app auto-hides expired specials based on `end_time < now`.

```json
[{
  "special_id": "sp001",
  "title": "Garlic Butter Volcano Smash",
  "description": "...",
  "price": 15.00,
  "original_price": 14.00,
  "quantity_remaining": 25,
  "start_time": "2026-06-24T11:00:00-10:00",
  "end_time": "2026-06-24T19:00:00-10:00",
  "active": true
}]
```

`quantity_remaining` is static — update it manually as the special sells. Read by: `app.js`, `dashboard.js`

---

### `data/loyalty.json`
Campaign-level config for the loyalty punch card. Change `stamp_code` to rotate the code customers enter. Set `campaign_active: false` to pause the program without deleting it.

```json
{
  "campaign_name": "Smash Club",
  "stamp_code": "808",
  "stamps_required": 10,
  "reward_description": "1 Free Volcano Smash",
  "campaign_active": true
}
```

Read by: `loyalty.js`, `dashboard.js`, `vendor.js`

---

### `data/updates.json`
Append-only log of every vendor update request and its resolution status.

```json
[{
  "update_id": "u001",
  "vendor": "Ala's Kitchen",
  "type": "location",
  "message": "Moving to Kalapana Night Market",
  "timestamp": "2026-06-23T18:00:00",
  "developer_status": "completed",
  "notes": "Updated in locations.json."
}]
```

`type` is one of: `menu`, `location`, `hours`, `special`, `photo`, `general`.
`developer_status` is one of: `pending`, `completed`, `archived`.
Read by: `dashboard.js`

---

## How Navigation Works

`scripts/nav.js` is included on every page. It runs immediately, creates a `<nav>` element, appends it to `<body>`, and marks the current page with `aria-current="page"` by comparing `window.location.pathname` to each nav item's href.

No HTML page contains a hardcoded `<nav>` block. To change the navigation globally, edit `scripts/nav.js` alone.

Nav items: **Home · Menu · Location · Loyalty · Vendor Portal · Dashboard**

---

## Customer App Flow

```
Customer opens Local Grindz PWA
         │
         ▼
    index.html
    app.js fetches (parallel, Promise.allSettled):
      ├─ locations.json  → show truck status + hours
      ├─ menus.json      → show featured item
      └─ specials.json   → show Today's Special card (if active, not expired)
         │
         ├─ Menu (menu.html)
         │    menu.js fetches menus.json
         │    Category tabs filter items client-side
         │
         ├─ Order (order.html)
         │    order.js fetches menus.json
         │    Customer taps +/- → cart builds → Place Order → ticket view
         │    Ticket is a local HTML render — no payment processing
         │    Customer shows ticket at the window
         │
         └─ Loyalty (loyalty.html)
              loyalty.js fetches loyalty.json (stamp_code, stamps_required)
              Customer enters stamp code → stamp saved to localStorage
              At N stamps → Redeem section appears
              Card resets after redemption
```

**Offline behavior:** The service worker caches all HTML, CSS, JS, and JSON on first load. The app works fully offline with the last-fetched data. On reconnect, a hard refresh pulls fresh data.

---

## Vendor Portal Flow

```
Vendor opens vendor.html
         │
         ▼
    Vendor fills out form:
      - Business info (pre-filled from vendors.json)
      - Update type (Menu / Location / Hours / Special / Photo / General)
      - If "Special": title, price, quantity, end time fields appear
      - Description / message
      - Urgency level
      - Optional developer notes
         │
         ▼
    Tap "Generate Update"
    vendor.js builds a formatted plain-text summary
    Summary is auto-copied to clipboard
         │
         ▼
    Vendor pastes into a text message or email → sends to developer
```

The portal generates no network requests on submit. It is a client-side form-to-clipboard tool.

---

## Developer Workflow

```
1. Receive vendor update (text, email, or GitHub issue)

2. Open the correct data file in /data/:
   - Location/hours  → locations.json
   - Menu item       → menus.json
   - Special         → specials.json (set active: true, update end_time)
   - Loyalty code    → loyalty.json (update stamp_code)
   - General log     → updates.json (append entry)

3. Edit the JSON manually in any text editor or GitHub's web editor

4. Append to updates.json:
   {
     "update_id": "uXXX",
     "type": "...",
     "message": "...",
     "timestamp": "YYYY-MM-DDTHH:MM:SS",
     "developer_status": "completed",
     "notes": "What you changed and where."
   }

5. git add data/*.json && git commit -m "..." && git push origin main

6. GitHub Pages deploys in 1–2 minutes.
   Customers who have the PWA open need to hard-refresh to pick up new data
   (the service worker caches aggressively — bump CACHE_NAME version when
   you need clients to evict the old cache immediately).
```

---

## Deployment Workflow

| Step | What happens |
|------|--------------|
| `git push origin main` | GitHub Pages auto-builds from the `main` branch |
| Build time | ~1–2 minutes (no build step — pure static) |
| Cache invalidation | Service worker is versioned (`CACHE_NAME = 'local-grindz-vN'`). Bump N to force all clients to fetch fresh assets on next visit. |
| Rollback | `git revert` or edit the JSON file directly in the GitHub web UI |
| Custom domain | Add `CNAME` file to repo root and configure DNS |

**Branch convention:** Feature work happens on named branches (`claude/...`). Merge to `main` to go live.

---

## Future Firebase Migration Path

Firebase Realtime Database or Firestore can replace the JSON files with zero HTML/CSS changes.

**What changes:**
1. Replace `fetch('/data/*.json')` calls in each script with `firebase.database().ref('...').once('value')` (RTDB) or `getDocs(collection(db, '...'))` (Firestore)
2. Vendor portal's `handleSubmit` in `vendor.js` writes directly to the database instead of generating clipboard text — the clipboard flow disappears
3. Remove the developer-edits-JSON step from the workflow; vendor submissions go live after developer reviews in a Firebase Console or an admin panel
4. Service worker cache list removes the JSON file paths (data is fetched from Firebase, not from `/data/`)
5. Add Firebase SDK `<script>` to each HTML `<head>` (or bundle with a build step)

**What stays the same:** All HTML, all CSS, all render functions, the service worker shell, the PWA manifest, and the overall page structure.

**Firebase cost baseline:** Spark (free) plan is sufficient for a single food truck: 1 GB storage, 10 GB/month transfer, 100 simultaneous connections.

---

## Future Supabase Migration Path

Supabase (Postgres + REST API + Realtime) is a stronger fit if you want SQL queries, row-level security, or image storage for menu photos.

**What changes:**
1. Replace `fetch('/data/*.json')` with `supabase.from('table').select('...')` using the `@supabase/supabase-js` client
2. Create tables: `vendors`, `menu_items`, `locations`, `specials`, `loyalty_campaigns`, `updates`
3. Enable Row Level Security — all reads are public; writes require the Supabase anon key + a server-side function or authenticated role
4. Vendor portal submits via `supabase.from('updates').insert(...)` — no developer in the loop for data entry
5. Add a lightweight admin view (or use Supabase Studio) for the developer to review and approve submissions
6. Supabase Storage replaces manual image hosting for menu photos

**What stays the same:** Same as Firebase — all rendering, HTML, CSS, and the PWA shell are untouched.

**Supabase cost baseline:** Free tier includes 500 MB DB, 5 GB file storage, 2 GB bandwidth/month — more than adequate for a single vendor.

---

## Design Tokens (CSS custom properties)

Defined in `styles/main.css` `:root`. Reference these everywhere; never hardcode color values.

| Token | Value | Use |
|-------|-------|-----|
| `--lava-red` | `#e63946` | Primary action color, open status |
| `--volcanic-black` | `#111111` | Page background |
| `--card-dark` | `#2a1a1a` | Card backgrounds |
| `--gold` | `#ffd700` | Headings, prices, highlights |
| `--ash-gray` | `#b8b8b8` | Secondary text, metadata |
| `--text-light` | `#ffffff` | Body text |

---

## PWA Service Worker

`service-worker.js` uses a **cache-first** strategy. On install it pre-caches all HTML, CSS, JS, and data files. On fetch it returns the cache hit, falling back to the network.

**To force clients to download fresh assets:** bump `CACHE_NAME` from `local-grindz-vN` to `local-grindz-v(N+1)`. The old cache is abandoned on next visit and new assets are fetched.

Current version: **v6**

---

## Adding a New Page (checklist)

- [ ] Create `pagename.html` with `<link rel="stylesheet" href="/styles/main.css">` in `<head>`
- [ ] Add `<script src="/scripts/nav.js"></script>` before `</body>` — nav renders automatically
- [ ] Add the page's href to `NAV_ITEMS` in `scripts/nav.js` if it should appear in the nav
- [ ] Add the HTML and JS paths to `ASSETS_TO_CACHE` in `service-worker.js` and bump the cache version
- [ ] Add the page's script to `scripts/` and link it before `</body>`
