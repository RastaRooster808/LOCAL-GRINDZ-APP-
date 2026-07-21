# Local Grindz / TOPP — Project Instructions

Big Island food truck marketplace + TOPP botanical commerce (rastarooster.com).
Vite 6 + React 18 + TypeScript, HashRouter (GitHub Pages), Supabase backend,
Shopify storefront links (no Storefront API yet).

## Governance — Digital Executive Team

All significant work follows `docs/TEAM_CHARTER.md`: ten review checkpoints
(Solomon → Sentinel), applied in order before any release. Summarize the
checkpoint review in the PR/commit or conversation when shipping a significant
feature. Sentinel's release gate: build clean, docs updated, rollback exists,
no performance regression, no critical issues.

## Standing rules

- Work autonomously inside a feature branch. Small commits. Document every change
  in CHANGELOG.md. Never commit to main without explicit permission.
- Do NOT: change payment settings/taxes, install apps, publish Shopify products
  from code, expose Admin tokens, fake live products, delete content, or modify
  legal/customer settings without explicit approval. Creating DRAFT Shopify
  products is allowed.
- No service keys in frontend code. The Supabase anon (publishable) key in client
  code is fine. Storage RLS uses `auth.uid()`, never `auth.email()`.
- Prioritize SEO, conversion, accessibility, speed, maintainability.

## Commerce model

- `src/data/commerce.js` is the single source of truth for products; typed via
  `src/data/commerce.d.ts` (tsconfig has no allowJs — keep the .d.ts in sync).
- Product status flow: Shopify DRAFT ↔ commerce.js `COMING_SOON`; Shopify
  ACTIVE + delivery configured ↔ `LIVE`. Checkout URL format:
  `https://rastarooster.com/cart/{variantId}:1`.
- Digital prints deliver via Sky Pilot. The "Botanicals" $9/mo plan is a print
  subscription, NOT a membership — never reuse it as one.
- Product/CTA sync state lives in `docs/SHOPIFY_SYNC_CHECKLIST.md`; planned
  products in `docs/SHOPIFY_PRODUCT_BLUEPRINT.md`.

## Environment notes

- `cdn.shopify.com` is blocked by the proxy (403); Shopify's storage backend
  (`shopify-shop-assets.storage.googleapis.com`, signed URLs from the Files API)
  is reachable — use it to verify images.
- Shopify Files `.heic.jpg` transform URLs 404 — attach raw HEIC as product
  media instead and use the converted product image .jpg URL.
- Verify with `npm run build` (tsc + vite).
