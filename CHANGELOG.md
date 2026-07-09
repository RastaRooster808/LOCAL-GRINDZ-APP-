# Changelog

All notable changes to Local Grindz are documented here.

---

## [Unreleased] — Phase 7C Prep: New Field Photo Batch (2026-07-09)

### Added
- `src/data/commerce.js`: 2 new COMING_SOON entries from July 2026 Puna field session:
  - `pincushion-lava-firework-pair-digital-print` (IMG_0599 — open Leucospermum pair on lava)
  - `king-protea-lava-cliff-wide-digital-print` (IMG_0578 — King Protea on a'a lava cliff, wide)
- CDN URLs now wired for all 5 King Protea Bud Study entries (IMG_0563–0568); matched by
  dimension profile (3 square 3024×3024, 2 portrait 3024×4032) against known crop patterns

### Pending
- 7 additional photos from same July 3 upload batch (UUIDs in Shopify) await identification:
  `0B40D45F`, `6270A4F0`, `7E9ED4EC`, `8251AAC4`, `3963D6A9`, `E979FEF0`, `DE05D8E7`
- 2 duplicate-sized file pairs flagged: `E979FEF0`/`271EADDB` and `DE05D8E7`/`D172302E`
- Remaining ~14 photos from "21 photo" batch not yet uploaded to Shopify
- Shopify products still needed for all bud study + new batch entries before any can go LIVE

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
