# Shopify Integration Plan — Local Grindz

## Overview

Local Grindz uses Shopify as its commerce layer. The React front-end (GitHub Pages) 
links out to Shopify for checkout. No Shopify JS embed required until Phase 6+.

---

## Required Shopify Collections

Create these collections in **Shopify Admin → Products → Collections**:

| Collection handle | Title | Purpose |
|---|---|---|
| `botanical-prints` | Botanical Prints | Digital art downloads |
| `memberships` | Memberships | TOPP + Vendor Pro recurring plans |
| `merch` | Local Grindz Merch | Apparel, stickers, accessories |
| `grower-resources` | Grower Resources | Digital guides for farmers |
| `vendor-products` | Vendor Products | Physical items from local vendors |
| `wholesale-flowers` | Florist & Hotel Inventory | Wholesale tropical stem orders |

---

## Required Product Tags

Tag every product with **at least one** of these:

| Tag | Used for |
|---|---|
| `digital` | Digital downloads (prints, guides) |
| `recurring` | Membership / subscription products |
| `wholesale` | Florist / hotel access tier |
| `vendor` | Products listed on behalf of a vendor |
| `hawaii` | All products (SEO) |
| `puna` | Puna-specific products |

---

## Digital Download Setup

Shopify does not natively support digital delivery. Use one of:

- **Sky Pilot** (recommended free tier) — Shopify App Store
- **SendOwl** — better for high volume
- **Digital Downloads** — Shopify's native free app (basic)

Steps:
1. Install chosen app
2. Upload PDF / high-res image to the app
3. Connect to the Shopify product variant
4. Set fulfillment to "automatic"
5. Test: place a $0 test order and confirm download link arrives in email

---

## Membership / Recurring Plans

Shopify does not natively support subscriptions. Use:

- **Shopify Subscriptions** (free, native, basic) — sufficient for TOPP monthly/annual
- **Recharge Payments** — if advanced dunning / analytics are needed

Setup:
1. Install Shopify Subscriptions app
2. Create selling plan: "Monthly" at $9, "Annual" at $88
3. Attach selling plan to `membership-topp-monthly` and `membership-topp-annual` products
4. Add `recurring` tag to all subscription products

---

## Shopify Storefront API (for future cart integration)

When ready to embed a cart in the React app:

1. **Enable Storefront API** in Shopify Admin → Apps → Develop apps → Create app
2. Grant scopes: `unauthenticated_read_product_listings`, `unauthenticated_write_checkouts`
3. Store the **Storefront API token** as a GitHub Pages secret: `VITE_SHOPIFY_STOREFRONT_TOKEN`
4. Store **shop domain** as: `VITE_SHOPIFY_DOMAIN` (e.g., `localgrindz.myshopify.com`)
5. Use `@shopify/buy-sdk` or direct GraphQL to:
   - Create a checkout: `mutation checkoutCreate`
   - Add line items: `mutation checkoutLineItemsAdd`
   - Get `checkoutUrl` from the response and redirect the customer

### Cart permalink format (no API needed)
For single-product buy links without the Storefront API:
```
https://localgrindz.myshopify.com/cart/{variantId}:{quantity}
```
Set this as `checkoutUrl` in `src/data/commerce.js` once variant IDs are known.

---

## Filling in commerce.js

After creating products in Shopify, update each item in `src/data/commerce.js`:

```js
{
  id: 'print-anthurium-01',
  shopifyProductHandle: 'botanical-print-anthurium',  // product URL handle
  shopifyVariantId: '12345678901234',                 // from product variant
  checkoutUrl: 'https://localgrindz.myshopify.com/cart/12345678901234:1',
  status: 'live',   // change from 'coming_soon'
}
```

---

## Test Checkout Checklist

Before going live:

- [ ] Enable Shopify Payments test mode (Shopify Admin → Settings → Payments → Test mode)
- [ ] Place a test order for each product type (digital, membership, physical)
- [ ] Confirm digital download email is received
- [ ] Confirm subscription is created for membership products
- [ ] Test on mobile Safari (iOS) and Chrome (Android)
- [ ] Disable test mode before launch

---

## Shopify Domain / Branding

- Custom domain: `shop.localgrindz.com` (CNAME → `shops.myshopify.com`)
- Email: `orders@localgrindz.com`
- Set in Shopify Admin → Settings → General → Store details

---

## Revenue Share (Vendor Products)

If listing products on behalf of vendors:
- Use Shopify **vendor** field to credit the source vendor
- Consider a commission split tracked outside Shopify (manual or via Supabase)
- Future: Shopify Partners / Marketplace Kit for multi-vendor payouts

---

## Notes

- Do **not** hardcode Shopify checkout URLs in source code. Store them in `src/data/commerce.js` or Supabase.
- The "powered by Shopify checkout" note is required by Shopify's terms when using Storefront API buy flows.
- Digital files must comply with Hawaiʻi's GET (General Excise Tax) on digital goods.
