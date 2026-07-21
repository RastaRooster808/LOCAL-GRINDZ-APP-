# Changelog

All notable changes to Local Grindz are documented here.

---

## [Unreleased] — Marketplace Categories + Featured Vendor Placement (2026-07-19)

### Added
- `src/lib/marketplace.ts` — marketplace category model (Restaurants, Markets,
  Fruit, Flowers, Artists & Makers) filtering the existing vendors table by
  cuisine_type ilike patterns; featured-vendor registry (presentation-layer only)
- `MarketplaceNav` — Home / Restaurants / Markets / Fruit / Flowers / Featured
  Vendors / Events / Profile, on Landing, Directory, and Events
- `FeaturedVendorCard` — premium placement card: banner, circular logo,
  "★ Featured Vendor" badge, category label ("Featured Florist — TOPP"),
  tagline ("Premium Hawaiian Protea Delivery"), vendor-only badges
  (Delivery Available / Protea Delivery / Premium Arrangements), Shop TOPP button
- `src/pages/Events.tsx` (+ `/events` route) — community events feed from the
  existing announcements table
- Landing: Featured Vendors section above the commerce grid
- Directory: category browsing via `?cat=` param; TOPP featured card appears
  inside Flowers and Featured Vendors views with disclosure line

### Preserved (per requirements)
- Existing vendor query, cuisine chips (shown for All/Restaurants), Open Now
  filter, vendor_features featured-first sorting — no schema changes
- Local Grindz branding stays marketplace-first; featured vendor branding is
  boxed inside labeled cards with an independence disclosure; Flowers category
  empty-state invites other florists ("every flower grower is welcome")

---

## [Unreleased] — Reprice + Print Bundles (2026-07-17)

### Changed
- **All 31 digital prints repriced $0.99 → $4.99** in Shopify (62 variant updates,
  zero errors) and in `commerce.js` — first step of the $10K/month revenue plan

### Added
- 2 bundle products (DRAFT in Shopify, COMING_SOON in commerce.js):
  - King Protea — Bud to Bloom Collection: 11 prints, $14.99 (73% off singles)
  - Pincushion & Farm Life Collection: 6 prints, $9.99 (67% off singles)
- Bundle delivery zips prepared for Sky Pilot attachment

### Blocked
- Third bundle (TOPP Complete Archive Vol. 1, all 31 prints, $29.99) — creation
  denied by session permission classifier; awaiting owner decision (create manually
  in admin, or re-approve creation here)

---

## [Unreleased] — Shop Agent: Conversational AI over Storefront MCP (2026-07-17)

### Added
- `supabase/functions/shop-agent/index.ts` — stateless edge function running a Claude
  tool loop against Shopify's public Storefront MCP endpoints (`/api/mcp` for cart +
  Knowledge Base policies/FAQ, `/api/ucp/mcp` for product search); runtime tool
  discovery, cart GID continuity, ANTHROPIC_API_KEY server-side only
- `src/components/ShopAgent.tsx` — floating chat widget on the landing page with
  suggestion chips, linkified replies, error/loading states
- `docs/SHOP_AGENT.md` — architecture, deploy steps, smoke tests, Knowledge Base FAQ
  starter set, Sentinel pre-launch checklist

### Pending (blocked on store owner)
- `supabase secrets set ANTHROPIC_API_KEY=...` + `supabase functions deploy shop-agent`
- Enter Knowledge Base FAQs (digital delivery, re-downloads, returns, sizing)
- Sentinel checklist in docs/SHOP_AGENT.md before customer exposure

---

## [Unreleased] — Crimson King Series + Market Bouquet (2026-07-17)

### Added
- 4 new digital prints (DRAFT in Shopify, COMING_SOON in commerce.js):
  - `king-protea-crimson-crown` (IMG_0614) — second King plant, deep crimson bloom
  - `king-protea-crimson-dome-macro` (IMG_0615) — nectar visible in florets
  - `king-protea-crimson-against-lava` (IMG_0616) — three-quarter lava portrait
  - `topp-market-bouquet-farm-stand` (photo) — hand-tied bouquet: cream king protea,
    Safari Sunset leucadendron, orange pincushions, spider lilies
- All images uploaded via staged-upload API with self-identifying filenames;
  variant IDs + checkout URLs wired at creation
- Alternate frame IMG_0612 (car in background) not used

### Pending
- Sky Pilot attachment + publish for the 4 new products, then flip LIVE
- IMG_0599 firework pair still outstanding

---

## [Unreleased] — Launch: July Field Series LIVE + Sky Pilot Delivery Audit (2026-07-10)

### Launched
- All 16 July field series prints published ACTIVE in Shopify (15 by store owner,
  Full Bloom pilot via API) and flipped `COMING_SOON` → `LIVE` in `commerce.js`
- Test order #1073 (King Protea on Lava — Close Study): PAID, $0 shipping —
  Sky Pilot email delivery confirmation pending from store owner

### Fixed
- **All 11 original digital prints had `requiresShipping: true`** — digital products
  demanding a shipping address at checkout. Set to `false` via Admin API.

### Added
- `docs/SKY_PILOT_FILE_MANIFEST.csv` — full 27-product digital delivery manifest:
  product/variant IDs, expected filenames, attachment status, per-product notes.
  Sky Pilot has no public API; attachment columns require manual verification in-app.

### Audit findings (Sky Pilot Delivery Setup Audit)
- 27 digital products audited; all ACTIVE; all now `requiresShipping: false`
- 11 originals: Sky Pilot attachments assumed working (order #1072 delivered), reverify
- 16 new: attachments UNVERIFIED; user uploaded files to Sky Pilot 2026-07-09
- 1 missing file: `King-Protea_Cinder-Field-Wide.jpg` not in the Sky Pilot upload batch
  (product created after) — must be uploaded + attached
- All 27 variants have `sku: null` — recommend adding SKUs for deterministic matching
- 3 misleading-filename hazards flagged in manifest (red-Pincushion = lehua,
  Yellow-Starbust = shrub scene, King-Protea_and_Puppy_3 = no puppy)

---

## [Unreleased] — Phase 7C Prep: New Field Photo Batch (2026-07-09)

### Added
- `src/data/commerce.js`: 2 new COMING_SOON entries from July 2026 Puna field session:
  - `pincushion-lava-firework-pair-digital-print` (IMG_0599 — open Leucospermum pair on lava)
  - `king-protea-lava-cliff-wide-digital-print` (IMG_0578 — King Protea on a'a lava cliff, wide)
- CDN URLs now wired for all 5 King Protea Bud Study entries (IMG_0563–0568); matched by
  dimension profile (3 square 3024×3024, 2 portrait 3024×4032) against known crop patterns

### July 2026 field batch fully reviewed (20 of 21 photos)
11 distinct scenes selected as COMING_SOON digital print entries:
- `king-protea-cinder-field-wide` (IMG_0578) — plant on cinder field, open bloom + bud
- `king-protea-open-bloom-lava` (IMG_0579) — bloom cradled in foliage on lava
- `king-protea-silver-dome-macro` (IMG_0580) — extreme macro of open floret dome
- `king-protea-full-bloom-close` (IMG_0582; alts 0583, 0584) — full anthesis portrait
- `king-protea-farm-dog` (IMG_0585) — bloom + farm puppy field-life portrait
- `king-protea-lava-outcrop` (IMG_0586) — bloom emerging from a'a outcrop
- `king-protea-profile-sky` (IMG_0587) — full plant profile against grey sky
- `pincushion-pair-farm-puppy` (IMG_0590; alts 0588, 0589, 0591) — orange + yellow pair
- `yellow-pincushion-starburst-macro` (IMG_0594; alt 0593) — overhead starburst
- `ohia-lehua-salmon-bloom` (IMG_0595; alt 0596) — native ʻōhiʻa lehua, NOT protea
- `orange-pincushion-shrub-wide` (IMG_0597; alt 0598) — production shrub, working farm
- `pincushion-lava-firework-pair` (IMG_0599) — added earlier from sample

### CDN images wired (2026-07-09, second upload)
19 descriptively-named HEIC files uploaded to Shopify Files; visually verified via
storage-backend download + contact sheet, wired 10 entries using Shopify's JPG-converted
CDN URLs (`.heic.jpg` — HEIC won't render in Chrome/Firefox):
- full-bloom-close ← King-Protea_and_Puppy_5 · farm-dog ← King-Protea_and_Puppy
- open-bloom-lava ← King-Protea_and_Puppy_3 (no puppy in frame despite filename)
- silver-dome-macro ← King-Protea_close_up · profile-sky ← Pink-King_Protea
- lava-outcrop ← pink-King_protea_2 · pincushion-pair ← Pincushion-Farm_Puppy
- starburst-macro ← Yellow-Bloom_2 · shrub-wide ← Yellow-Starbust
- ohia-lehua ← red-Pincushion (filename says pincushion; photo is Metrosideros)

### Shopify products created (2026-07-09)
15 draft products created via Admin API — 5 bud study + 10 field batch — each with
image attached, $0.99, product type "Digital Download", vendor TOPP. commerce.js now
carries real handles, variant IDs, and checkout URLs for all 15; status stays
COMING_SOON until Sky Pilot files are attached and products are published ACTIVE.
Note: `.heic.jpg` transform URLs 404'd as product images; fixed by attaching the raw
HEIC as product media (Shopify converts to JPG) and re-pointing commerce.js at the
converted product image URLs.

### Pending
- 2 field batch entries still without Shopify uploads: `king-protea-cinder-field-wide`
  (IMG_0578) and `pincushion-lava-firework-pair` (IMG_0599)
- 7 unidentified UUID files from July 3 upload remain (bud study took 5 of 14; some may
  duplicate the newly named uploads): `0B40D45F`, `6270A4F0`, `7E9ED4EC`, `8251AAC4`,
  `3963D6A9`, `E979FEF0`, `DE05D8E7` — candidates for cleanup in Shopify Files
- 2 duplicate-sized file pairs flagged for cleanup: `E979FEF0`/`271EADDB`, `DE05D8E7`/`D172302E`
- Shopify products still needed for all bud study + field batch entries before any can go LIVE

---

## [Unreleased] — Phase 7B: Shopify Product Blueprint (2026-07-03)

### Added
- `docs/SHOPIFY_PRODUCT_BLUEPRINT.md` — complete product specs for 5 Grower Guides and 3 Membership tiers: titles, handles, prices, descriptions, SEO fields, tags, collections, image requirements, file requirements, legal disclosures, subscription setup notes, and a Phase 7C readiness checklist
- 5 new Shopify collections documented: `topp-memberships`, `topp-grower-guides`, `topp-digital-archive`, `topp-florist-resources`, `topp-support-shop`

### Changed
- `src/data/commerce.js`: expanded blocker comments on Memberships and Grower Resources sections — clearly documents what must exist before dev wiring, and explicitly notes that the "Botanicals" print subscription is not a membership proxy
- `docs/SHOPIFY_SYNC_CHECKLIST.md`: expanded Known Blockers section with per-category action items, collection checklist, and blueprint cross-references

### No code changes
- No products flipped to live
- No fake checkout URLs added
- Botanicals print subscription not reused as membership

---

## Phase 7A: CommerceGrid UI (2026-07-03)

### Added
- `src/data/commerce.d.ts` — TypeScript declaration file for `commerce.js` exports (`CommerceItem`, `PRODUCT_TYPES`, `PRODUCT_STATUS`, helpers)
- `src/components/CommerceCard.tsx` — product card rendering image, title, type label, description, tags, price, and CTA per status
- `src/components/CommerceGrid.tsx` — sectioned grid grouping products by type (prints → flowers → merch → memberships → grower resources); filters out `draft`/`hidden` entries
- CSS: `.commerce-product-grid`, `.commerce-card`, `.commerce-card-img-wrap`, `.commerce-card-img-ph`, `.commerce-status-badge`, `.commerce-card-type`, `.commerce-tag`, `.commerce-card-footer`, `.commerce-notify-flash`, mobile breakpoint

### Changed
- `Landing.tsx`: replaced CTACard commerce section with `<CommerceGrid />` — all live and coming-soon products now visible on the landing page

### Status at Phase 7A
- **Rendered live** (15 products): 11 digital prints + Keiki Aipohaku Tee + 3 Ohana Bloom bundles
- **Rendered coming soon** (11 products): 3 memberships + 6 merch items (DRAFT in Shopify) + 2 grower guides
- **Hidden from grid**: 1 vendor placeholder (DRAFT status)
- **Blocked**: merch photography needed for 5 items before Shopify publish → flip to live

---

## Phase 6: Live Shopify Commerce Wiring (2026-07-03)

### Added
- `CTAStatus` type (`'live' | 'coming_soon' | 'sold_out' | 'hidden'`) replaces `comingSoon: boolean` in `src/lib/cta.ts`
- `sold_out` and `hidden` status values added to `PRODUCT_STATUS` in `src/data/commerce.js`
- `CTAButton` now handles all 4 statuses: hidden (null), sold_out (disabled + red badge), coming_soon (notify flash), live (Shopify link or internal route)
- `CTACard` now returns null for `hidden` status
- CSS: `.cta-sold-out` (dimmed, not-allowed cursor) and `.cta-badge--sold-out` (red tint badge)
- `docs/SHOPIFY_SYNC_CHECKLIST.md` — full audit table of all products, CTAs, and flip-to-live instructions

### Changed
- `florist_hotel` CTA: `coming_soon` → `live`, wired to `rastarooster.com/collections/wholesale-flowers`
- `view_inventory` CTA: `coming_soon` → `live`, wired to `rastarooster.com/collections/wholesale-flowers`
- `handleCTAClick` checks `cta.status !== 'live'` (was `cta.comingSoon`)

---

## Phase 5: Commerce Data Model + Analytics (prior session)

### Added
- 11 TOPP protea digital prints: all LIVE with real Shopify variant IDs, CDN images, $0.99 checkout URLs
- 3 Ohana Bloom weekly bundles: Counter ($42), Home ($48), Statement ($88) — all LIVE
- 5 TOPP merch products: Ceramic Mug, TOPP Seal Tee, Tote Bag, Sticker Pack, Embroidered Patch — COMING_SOON (DRAFT in Shopify)
- Keiki Aipohaku T-shirt: LIVE, $33.99
- `PRODUCT_TYPES` and `PRODUCT_STATUS` enums in `src/data/commerce.js`
- `src/lib/analytics.ts` — lightweight event queue with `window.lgAnalytics` drain hook
- `docs/SHOPIFY_INTEGRATION.md` — collection requirements, Sky Pilot setup, Storefront API notes
- `docs/migrations/phase-5a-newsletter.sql` — `newsletter_signups` table with insert-only RLS

### Changed
- `src/lib/cta.ts`: `shop_prints` and `join_topp` wired to `botanical-prints` collection (live)
- Landing page newsletter form wired to Supabase `newsletter_signups`

---

## Phase 4: Platform Expansion

- Orders lifecycle, image storage, referrals, reviews, announcements, messaging, push notifications, AI search
- See `docs/migrations/phase-4*.sql` for schema details

---

## Phase 3: Multi-Vendor + Admin

- Admin approval system, loyalty analytics, multi-vendor workflow
- See `docs/ADMIN_APPROVAL_SYSTEM.md`, `docs/MULTI_VENDOR_WORKFLOW.md`
