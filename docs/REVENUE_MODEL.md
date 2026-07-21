# Local Grindz — Revenue Model

## Overview

Local Grindz generates revenue through a layered model: free listing as the baseline, with optional paid upgrades for vendors who want more visibility. No transaction fees in Phase 3 — the platform takes nothing from orders.

---

## Revenue Streams

### 1. Featured Listings (Primary — Phase 3)

Vendors pay to be prominently placed in the directory and highlighted across the platform.

| Tier | Price | Duration | What you get |
|------|-------|----------|-------------|
| **Boost** | $10 | 7 days | Top placement in directory for 1 week |
| **Feature** | $25 | 30 days | "Featured" badge + homepage placement + weekly push |
| **Anchor** | $75 | 90 days | All Feature benefits + "Local Favorite" badge + priority in QR campaigns |

**Phase 3 implementation:** Admin sets featured status manually after payment received (Venmo/cash/check). No Stripe yet.

**Phase 4:** Stripe Checkout integration for self-serve upgrade.

**Revenue potential:**
- 10 vendors × $25/month = $250 MRR at launch
- 20 vendors × avg $20/month = $400 MRR at 6 months

---

### 2. Transaction Fee (Phase 4)

Small platform fee on each order processed through Local Grindz.

| Volume | Platform fee |
|--------|-------------|
| $0–$500/month orders | 0% (free tier) |
| $500+/month orders | 3% |

- Vendor keeps 97% of every order
- Fee handled via Stripe Connect (split payments)
- Transparent to customer — not added to order total

**Phase 3:** No transaction fee. Vendors process payments themselves (cash, Venmo, Square).

---

### 3. Vendor Subscription (Phase 4)

Monthly access tier for advanced dashboard features.

| Plan | Price | Features |
|------|-------|---------|
| **Free** | $0 | Menu, location, specials, basic order inbox |
| **Pro** | $19/mo | Analytics dashboard, QR campaign tracking, push notification broadcasts, priority support |
| **Business** | $49/mo | Multi-location, loyalty program access, CSV order exports, dedicated onboarding |

**Phase 3:** All features free. Subscription introduced in Phase 4 once vendors see value.

---

### 4. Sponsored Push Notifications (Phase 4)

Vendors can pay to send a push notification to all Local Grindz customers in their area.

| Package | Price | Reach |
|---------|-------|-------|
| Local Blast | $15 | All subscribers |
| Targeted Blast | $25 | Subscribers who favorited similar vendors |

Limited to 1 sponsored push per vendor per week to prevent fatigue.

---

### 5. QR Campaign Packages (Phase 4)

- Printed QR table cards designed and fulfilled by Local Grindz
- Laminated cards, stickers, small menu boards
- Priced at cost + $10 design/handling fee

---

## Free Tier (Always)

Every vendor always gets for free:
- Listed in the vendor directory
- Full menu management
- Live location updates
- Specials posting
- Order inbox
- Customer reviews
- Basic QR code (digital, self-printed)
- Static JSON fallback (always-on even without Supabase)

The free tier is permanent — it's what attracts vendors. Revenue comes from those who want more reach.

---

## Loyalty Program Economics

### Cost to platform
- 1 point per $1 spent
- 100 points = $1 discount
- Effective cost: 1% of GMV

### Funded by
- Phase 3: Platform absorbs cost (marketing expense)
- Phase 4: Vendor contributes 0.5%, platform contributes 0.5%
- Long-term: Built into subscription tier pricing

### Why it works
- Cross-vendor loyalty increases overall platform stickiness
- Customers return to try new vendors to earn points
- Network effect: more vendors → more earning opportunities → more customer retention

---

## Revenue Projections

### Phase 3 (launch, months 1–3)
| Source | Monthly |
|--------|---------|
| Featured listings (5 vendors × $20 avg) | $100 |
| **Total** | **$100** |

### Phase 4 (months 4–9)
| Source | Monthly |
|--------|---------|
| Featured listings (15 vendors × $25 avg) | $375 |
| Subscriptions (8 Pro × $19) | $152 |
| Transaction fees (3% of $5k GMV) | $150 |
| Push campaigns (4/month × $15) | $60 |
| **Total** | **$737** |

### Phase 5 (months 10–18, expansion)
| Source | Monthly |
|--------|---------|
| Featured listings (30 vendors) | $750 |
| Subscriptions (20 Pro + 5 Business) | $625 |
| Transaction fees (3% of $15k GMV) | $450 |
| Push campaigns | $200 |
| QR packages | $150 |
| **Total** | **$2,175** |

---

## Competitive Positioning

| Platform | Fee model | Local focus |
|----------|-----------|-------------|
| DoorDash | 15–30% commission | No |
| Square Online | $0 + 2.9% processing | No |
| **Local Grindz** | Free listing, optional upgrades | **Yes — Big Island only** |

The pitch to vendors: **"We don't take a cut of your orders. We just help people find you."**

---

## Phase 3 Action Items

- [ ] Set up Venmo/PayPal for manual featured listing payments
- [ ] Create simple featured listing "invoice" template
- [ ] Decide launch pricing (propose: first featured month free for founding vendors)
- [ ] Add `vendor_features` table to Supabase
- [ ] Wire featured badge into directory UI
- [ ] Track which vendors are interested in Pro features (survey)
