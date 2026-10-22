# Welcome Packet — KaRas Freshly Baked

**Vendor:** KaRas Freshly Baked (`karas-freshly-baked`) · Bakery · Kalapana
**Her email:** karaste122@yahoo.com
**Packet:** <https://claude.ai/artifact/7LfLREaiXCukC9cX8rdmAG>
**Written:** 2026-10-22 · **Status:** drafted, **nothing sent, nothing applied**

The first vendor welcome packet. Built as a page rather than a PDF so it opens on
a phone at the bake stand, and so a correction is a republish instead of a
re-send. Same pattern as `docs/TOPP_OUTREACH_KIT.md`: the artifact is the
leave-behind, this file is the record.

---

## Before anything is sent

> **The packet link is private.** Only the owner and people explicitly given
> access can open it. It must be shared from the page's Share menu before the
> email goes out, or KaRa clicks the link and gets nothing.

Four more checks, in order of how badly each fails:

1. **Supabase is restoring.** Project `pqzygehnnojdttmqadrz` was `INACTIVE` on
   2026-10-22. If it is not back when she opens her storefront, she sees an empty
   page that claims there are no vendors (`ROADMAP_TO_COMPLETION.md`, Stage 1).
   **Do not send the packet while the database is down** — her first impression
   of the platform would be a page saying she doesn't exist.
2. **Confirm the storefront URL.** The packet avoids printing one, but the email
   draft below has a placeholder. The most likely value is
   `https://rastarooster808.github.io/LOCAL-GRINDZ-APP-/#/vendors/karas-freshly-baked`
   — derived from the repo name, `base: './'`, HashRouter and the Pages deploy
   workflow. **It is unverified**: `rastarooster808.github.io` and the Pages API
   are both blocked by this environment's egress proxy, so it could not be
   opened from here. Click it once before pasting it into an email.
3. **Check the payment-handle columns exist.** The packet tells her she can save
   a PayPal/Venmo/Cash App handle. `VendorDashboard.tsx:704-707` writes
   `paypal_handle`, `venmo_handle`, `cashapp_handle`, `preferred_payment` to
   `vendors`, and **no migration in this repo creates them** — same for the
   `vendor_monthly_statements` view behind the Billing tab. Queries are in
   `docs/migrations/phase-5g-karas-contact-and-login.sql`. If they're missing,
   her save fails silently and the packet has promised something that doesn't work.
4. **Decide what her email is for** — see *Two options* below.

---

## What the packet says, and why

| Section | Why it leads where it does |
|---|---|
| **The one thing that matters most** | The open/closed toggle, before anything else. Every vendor is seeded `closed` and nothing in the system has ever set one open, so *Open Now*, the map's status pins and the directory badge have never had a true positive. One tap from her fixes that for her stand. |
| **Your listing, exactly as it stands** | Her menu and prices reproduced as a proof to check, not a summary. Seven items, $4–$12. |
| **How an order reaches you — and how you get paid** | Four steps, ending with money going from the customer's hand to hers. The platform holds no funds; that is the actual design in `src/lib/payments.ts`, not a simplification. |
| **What's in the dashboard** | Ten of the twelve tabs, each in one line. |
| **What we need back from you** | Five asks. Confirm the menu, tap open, add a payment handle, send bread photos, confirm hours. |

### The cinnamon-roll apology

Her Cinnamon Rolls are flagged `available = false` in
`phase-4-1-seed-vendors.sql:46`, with the seed comment
*"available=false demonstrates the Sold Out indicator"*. Her listing has been
telling customers she's sold out of cinnamon rolls since July because we needed
a demo row. The packet says so plainly and tells her how to clear it. Shipping a
welcome packet that quietly left that in place would have been worse.

### No fee number appears anywhere

Deliberate. The packet says the free tier is permanent, no commission is taken
today, and any change comes in writing first. It does **not** state a rate,
because the repo contradicts itself:

- `docs/REVENUE_MODEL.md:38` — **3%** above $500/month
- `src/lib/payments.ts:7` — **5%** above $500/month
- no fee logic exists in `src/` at all, and `platform_fee_due` is read from a
  view this repo never defines

**Resolve that before any vendor is quoted a number.** Telling a vendor 3% and
later billing 5% is the kind of thing that ends a relationship with a neighbour.

---

## Two options for karaste122@yahoo.com

Phase 4.9 set the convention: *"`email` stays the auth login identity; public
contact goes in new columns."* So her address can go in two places that do very
different things. Both are written out, commented, in
`docs/migrations/phase-5g-karas-contact-and-login.sql`. **Neither is applied.**

### Option A — public contact (`contact_email`)
Shows on her storefront's contact block next to phone and socials
(`Storefront.tsx:223`). No auth change; her existing login keeps working.
**Consider first:** this publishes a personal-looking yahoo address to the open
internet. Worth her explicit yes.

### Option B — her own dashboard login (`email`)
The Violet Love Designs pattern. Vendor RLS matches
`vendors.email = auth.email()`, so changing `email` is what moves the dashboard
from the operator alias to KaRa herself.

Order matters, and getting it wrong locks her out:

1. Supabase Auth admin → add `karaste122@yahoo.com` with a temporary password.
   **Never committed** (`phase-4-3-vendor-auth-rls.sql` holds the same rule).
2. Then update `vendors.email` and backfill `user_id`.
3. Send the temporary password **out of band** — a different channel from the
   packet link, never in the welcome email.
4. Decide whether to retire the old `bankspham5+karas@gmail.com` auth user.

Note she *already has* a working login under the operator alias, provisioned
2026-07-21. Option B is a transfer of control, not a new grant — which is why
it is a decision and not a default.

---

## Draft email — for the operator to send

Not sent. No mail was addressed, drafted in Gmail, or delivered from this
session. Fill the two bracketed fields and it is ready.

> **Subject: You're on Local Grindz — here's your bake stand packet**
>
> Hi KaRa,
>
> Your bakery is up on Local Grindz, and I put together a short welcome packet
> so you can see exactly what's on the page and what you can change:
>
> [PACKET LINK]
>
> Two things worth knowing up front. Your stand currently shows as **closed** —
> there's one big button in your dashboard that flips you to open, and until
> someone taps it the directory doesn't tell anyone you're baking. And your
> cinnamon rolls are showing as sold out, which was our fault, not yours: we
> built the listing with that one item switched off to demonstrate the sold-out
> badge, and it's been sitting like that. Flip it back on whenever you like, or
> tell me and I'll do it.
>
> Your storefront is here: [STOREFRONT LINK]
>
> The listing, the dashboard, the printable QR codes and the order inbox are all
> free, and nothing is taken out of your orders — customers pay you directly,
> cash or through your own PayPal/Venmo/Cash App.
>
> If you can send me a few phone photos of the bread, that'll do more for the
> page than anything else on my end. And tell me if the menu or hours in the
> packet have drifted.
>
> Mahalo,
> [name] · Local Grindz

---

## Her listing on file

| | |
|---|---|
| Slug | `karas-freshly-baked` |
| Cuisine | Bakery · Kalapana |
| Location | KaRas Bake Stand, Kalapana, HI — Fri–Sun 8am–1pm (until sold out) |
| Location status | `closed` (seeded; never set open) |
| Instagram | <https://www.instagram.com/karasfreshlybaked> |
| Special | "Fresh Bread Today" |
| Login (current) | `bankspham5+karas@gmail.com`, provisioned 2026-07-21 |
| Phone | **not on file** |

Menu: Fresh Sourdough Loaf $12 · Banana Bread $9 · French Bread $8 · Seasonal
Special $7 · Cinnamon Rolls $6 *(flagged sold out)* · Brownies $5 · Cookies $4

Golden Shot (`golden-shot`) is seeded at the same location name, "KaRas Bake
Stand" — worth confirming with her that a second vendor sharing her stand is
accurate and wanted.

---

## Reusing this for the next vendor

The structure generalises; the content does not. What made this one work was
reading her actual rows first and putting the corrections in the packet instead
of hiding them. For the next vendor, the five sections stay, and these get
re-derived from their own data: their menu as a proof, whatever is wrong in
their listing stated plainly, and the open/closed tap as the first ask.

Inoch's Ital is the obvious next one — but his row is almost entirely NULL and
his menu came off a photograph, so his packet needs a phone call before it needs
a page.
