# Shopify Sync Checklist — Phase 6

**Store:** rastarooster.com  
**Last audited:** 2026-07-03  
**Checkout URL format:** `https://rastarooster.com/cart/{variantId}:1`

---

## CTA Status Audit

| CTA Key           | Label                   | Status       | Destination                                              |
|-------------------|-------------------------|--------------|----------------------------------------------------------|
| `shop_prints`     | Shop Botanical Prints   | ✅ live       | rastarooster.com/collections/botanical-prints            |
| `join_topp`       | Join TOPP               | ✅ live       | rastarooster.com/collections/botanical-prints            |
| `view_inventory`  | View Current Inventory  | ✅ live       | rastarooster.com/collections/wholesale-flowers           |
| `florist_hotel`   | Florist / Hotel Access  | ✅ live       | rastarooster.com/collections/wholesale-flowers           |
| `vendor_directory`| Vendor Directory        | ✅ live       | /vendors (internal)                                      |
| `apply_vendor`    | Join as Vendor          | ✅ live       | /apply (internal)                                        |
| `support_archive` | Support the Archive     | 🔜 coming_soon| — (no Shopify product yet)                              |
| `grower_resources`| Grower Resources        | 🔜 coming_soon| — (no Shopify product yet)                              |

---

## Product Sync Status

### Digital Prints (Sky Pilot — digital delivery)

| Product                       | Shopify Status | App Status | Variant ID          | Price  |
|-------------------------------|----------------|------------|---------------------|--------|
| King Protea Digital Print     | ✅ ACTIVE       | ✅ live     | 52649043034399      | $0.99  |
| Pincushions in Bloom          | ✅ ACTIVE       | ✅ live     | 52649043067167      | $0.99  |
| Ohia Lehua Botanical          | ✅ ACTIVE       | ✅ live     | 52649043099935      | $0.99  |
| Conebush on Lava              | ✅ ACTIVE       | ✅ live     | 52649043132703      | $0.99  |
| Banksia Study                 | ✅ ACTIVE       | ✅ live     | 52649043165471      | $0.99  |
| Protea Cynaroides Close-Up    | ✅ ACTIVE       | ✅ live     | 52649043198239      | $0.99  |
| Silver Tree Foliage           | ✅ ACTIVE       | ✅ live     | 52649043231007      | $0.99  |
| Heliconia Burst               | ✅ ACTIVE       | ✅ live     | 52649043263775      | $0.99  |
| Waratah Bloom                 | ✅ ACTIVE       | ✅ live     | 52649043296543      | $0.99  |
| Tropical Torch Ginger         | ✅ ACTIVE       | ✅ live     | 52649043329311      | $0.99  |
| Puna Protea Field             | ✅ ACTIVE       | ✅ live     | 52649043362079      | $0.99  |

### Subscriptions (Shopify Subscriptions — "Botanicals" plan)

| Product                 | Plan        | Price    | Delivery  | Status       |
|-------------------------|-------------|----------|-----------|--------------|
| Pincushions in Bloom    | Botanicals  | $9/month | Monthly   | ✅ ACTIVE     |
| Conebush on Lava        | Botanicals  | $9/month | Monthly   | ✅ ACTIVE     |

### Wholesale / Florist (Ohana Bloom)

| Product                        | Shopify Status | App Status | Variant ID          | Price  |
|-------------------------------|----------------|------------|---------------------|--------|
| Counter Bloom Bundle          | ✅ ACTIVE       | ✅ live     | 52649043231007      | $42    |
| Home Bloom Bundle             | ✅ ACTIVE       | ✅ live     | 52649043296543      | $48    |
| Statement Bloom Bundle        | ✅ ACTIVE       | ✅ live     | 52649043263775      | $88    |

### Merch

| Product                        | Shopify Status | App Status | Variant ID          | Price  |
|-------------------------------|----------------|------------|---------------------|--------|
| Keiki Aipohaku T-shirt        | ✅ ACTIVE       | ✅ live     | 52613576524063      | $33.99 |
| Protea Ceramic Mug            | 🔒 DRAFT        | 🔜 coming_soon | 52649043394847  | $16    |
| TOPP Seal Tee                 | 🔒 DRAFT        | 🔜 coming_soon | 52649043427615  | $28    |
| TOPP Tote Bag                 | 🔒 DRAFT        | 🔜 coming_soon | 52649043460383  | $22    |
| Sticker Pack                  | 🔒 DRAFT        | 🔜 coming_soon | 52649043493151  | $8     |
| Embroidered Patch             | 🔒 DRAFT        | 🔜 coming_soon | 52649043525919  | $12    |

---

## Collections Required on Shopify

| Collection Handle      | Purpose                      | Status      |
|------------------------|------------------------------|-------------|
| `botanical-prints`     | Digital prints + TOPP        | ✅ exists    |
| `wholesale-flowers`    | Ohana Bloom weekly bundles   | ✅ exists    |
| `merch`                | T-shirts, mugs, totes, etc.  | ✅ exists    |

---

## Flip-to-Live Checklist

To flip a DRAFT/coming_soon product to live:

1. Publish the Shopify product (set status to ACTIVE)
2. Attach to correct collection(s)
3. Update `status` in `src/data/commerce.js` from `COMING_SOON` → `LIVE`
4. If it's a CTA entry, update `status` in `src/lib/cta.ts` from `'coming_soon'` → `'live'` and add `shopifyUrl`
5. Run `npm run build` — confirm clean
6. Commit and push

---

## Known Blockers / Next Steps

### Merch (5 items)
- Status: DRAFT in Shopify
- Blocked on: product photography
- Action: Photograph → publish ACTIVE in Shopify → flip `COMING_SOON` → `LIVE` in `commerce.js`

### Grower Guides (5 planned)
- Status: No Shopify products exist yet
- Blueprint: `docs/SHOPIFY_PRODUCT_BLUEPRINT.md` Part 1
- Blocked on: PDF content writing, cover images, Sky Pilot file attachment
- Action: Follow blueprint → create Shopify products → populate `shopifyVariantId` in `commerce.js`

### Memberships (3 planned)
- Status: No standalone Shopify membership products exist
- Blueprint: `docs/SHOPIFY_PRODUCT_BLUEPRINT.md` Part 2
- **Important:** The existing "Botanicals" plan ($9/mo on prints) is NOT a membership proxy
- Blocked on: community platform selection, verification flows, Shopify Subscriptions plan setup, legal disclosures
- Action: Follow blueprint checklist → create products → configure selling plans → populate `commerce.js`

### Required Collections (5)
See `docs/SHOPIFY_PRODUCT_BLUEPRINT.md` Part 3 for handles and descriptions.
- [ ] `topp-memberships`
- [ ] `topp-grower-guides`
- [ ] `topp-digital-archive`
- [ ] `topp-florist-resources`
- [ ] `topp-support-shop`

### Support the Archive
- Status: No Shopify product or donation mechanism yet
- Blocked on: product concept + legal structure for donations

### Storefront API
- Status: Not yet enabled
- Required for: Phase 8 cart-level integration (add-to-cart drawer without page navigation)

### CommerceGrid UI
- ✅ Live as of Phase 7A — all `live` and `coming_soon` products render on the landing page
