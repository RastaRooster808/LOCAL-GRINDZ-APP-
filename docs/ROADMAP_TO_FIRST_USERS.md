# Roadmap to First Users

**Written:** 2026-10-22 · measured against the live database, not the seed files.

## Where you actually are

| | |
|---|---|
| Orders ever placed | **0** |
| Reviews | 0 |
| Vendor applications | 0 |
| Active vendors | 6 |
| Open right now | **1** — Ala's Kitchen |
| Menu items across all vendors | 14 |
| Vendors who can log in | 3 of 6 |
| Database | `ACTIVE_HEALTHY` |

Two of those numbers matter more than the rest.

**Zero orders.** The order → accept → pay → complete path has never been walked
by a human being. Not once. Every other part of this platform has been exercised
at least by accident; that one has not, and it is the only path that makes money.

**One vendor is open.** Ala's Kitchen is showing open right now, which means the
open/closed mechanism works in production. I had been saying it never had a true
positive — that was true of the seed data and is no longer true. It works.

---

## The shape of the problem

This is a marketplace cold start, and it has one rule: **supply before demand,
because a first impression is one-shot.** A customer who opens Local Grindz on a
Tuesday, sees that nothing is open, and closes it does not come back on Friday.
You do not get to re-launch to the same person.

The promise of this product is *who is grinding right now*. If that is false the
first time someone checks, nothing else you build matters.

So: **do not launch the marketplace.** Launch one vendor, one neighbourhood, one
weekend, and only widen after a stranger has paid someone through it.

---

## Gate 0 — Stop the site saying things that aren't true

**Blocking. Nothing below starts until this is done.**

### 0.1 Merge PR #40 — there are two order forms live right now that cannot be filled

`main` does not have the `hasMenu` guard. **Uncle Robert's and Violet Love
Designs both have zero menu items and both render an empty menu above a working
order form on the live site today.** A customer can place an order that no one
can fill, and the first person to try is someone you know.

The fix has been sitting in PR #40, green and mergeable, since 2026-09-04.

### 0.2 Fix the nine swallowed errors

`Directory.tsx:79` and eight siblings discard `error`. When the database is
unreachable the directory renders *"No vendors in this category yet — local
vendors can join free."* Six vendors exist. During the pause earlier this month,
that is what the site said.

### 0.3 Decide the free-tier pause

The project paused on 2026-10-22 after about a week idle. A marketplace nobody
visits for a week takes itself offline, and the next visitor finds out. Upgrade,
or schedule a keep-alive. **This must be answered before a vendor is invited** —
a vendor whose storefront is down the first time she checks does not come back.

**Exit:** no vendor shows an order form they cannot fill; an outage reads as an
outage; the pause question has an answer in writing.

---

## Gate 1 — Make it one, not zero

**You place the first order. Not a test record — a real one.**

Go to KaRa's stand on a baking day. Order through the app on your phone. Pay her
through the handle she has saved. Watch her accept it, mark it ready, mark it
complete. Buy the bread.

This is not ceremony. It is the only way to find what breaks on a path that has
never carried a human, and it costs you twelve dollars and a morning.

Things most likely to break, in order:
- the payment handle deep link opening the wrong app or a wrong amount
- the vendor-side status buttons under the RLS policies as *she* is logged in
- the customer "I've sent the payment" button, which **is already known broken** —
  it writes `payment_status='marked_paid'` as an anon user and there is no anon
  UPDATE policy, so the write is denied and the button only changes local UI.
  Her "Confirm Received" works. Fix or remove the customer-side one before a
  stranger uses it and believes it did something.

**Exit:** one order in the database, placed by a human on a phone, confirmed
received by the vendor. `orders_total = 1`.

---

## Gate 2 — One vendor genuinely live

KaRas Freshly Baked is the right beachhead and it is not close:

- **Predictable schedule.** Fri–Sun, 8am–1pm. A customer can form a habit.
- **Built-in urgency.** She sells out. Scarcity is the pitch, not a problem.
- **She can already log in.** Her auth user has existed since July.
- **Four items, clean.** Sourdough classic $12, jalapeño cheddar / blueberry
  lemon / double chocolate $15. Simple enough to order from on a phone.

What is missing from her record: **no phone, no contact email, no photos, and a
stand that has never been toggled open.**

| | Owner |
|---|---|
| Send the welcome packet — **rewritten first**, see below | You |
| Walk her through the open/closed toggle in person, once | You |
| Her phone number and contact email on the record | You |
| A payment handle saved — PayPal, Venmo or Cash App | KaRa |
| Three photos of the bread | KaRa |
| Toggle open/closed correctly for **two consecutive weekends** | KaRa |

**The packet must be rewritten before it is sent.** The version in the repo leads
with an apology about cinnamon rolls flagged sold-out. Her live menu is four
sourdough loaves and nothing is flagged. That apology is for a problem she does
not have, about a product she does not sell.

**Exit:** two consecutive weekends where her open/closed state was correct
without you touching it.

---

## Gate 3 — First customers, in person, small

Not ads. Not the island. A QR code taped to her stand and a sentence from KaRa
to people already standing in front of her.

The QR kit is already in her dashboard and generates codes for her storefront,
menu, ordering and reviews. Print them.

Why this and not marketing: these customers are **already buying bread**. The app
has to beat "hand her cash," which is a low bar for preorder and a high bar for
anything else. If it cannot win there, it will not win against strangers.

**Exit:** ≥5 orders from people you did not personally recruit, and ≥1 person who
orders twice. The second number matters more.

---

## Gate 4 — Vendors two and three

Only after Gate 3. Each new vendor before the product works just multiplies a
bad first impression.

- **Ala's Kitchen** — already open, already logged in, already has phone and
  contact. One menu item on record; needs the rest. Lowest-effort second vendor.
- **Violet Love Designs** — **cannot log in.** `user_id` is null; no auth user
  exists. She was promised a dashboard she cannot open. One admin action.
- **Inoch's Ital** — no phone, no address, no hours, no socials, and he has not
  been contacted. His menu was read off a photograph. **This needs a phone call,
  not a packet.**
- **Golden Shot** — six menu items, cannot log in.
- **Uncle Robert's** — zero menu items; a venue, not a kitchen. Right as a
  landing page, wrong as a storefront until it has something to sell.

**Settle the platform fee before vendor two.** `REVENUE_MODEL.md` says 3% above
$500/month; `payments.ts` says 5%; no fee logic exists. KaRa will be under $500
and pays nothing either way — so you can onboard her honestly today. The second
vendor might not be, and telling one vendor 3% and another 5% ends both
relationships.

**Exit:** three vendors managing their own listings without you in the loop.

---

## Gate 5 — Then tell the island

Only here does the Kingdom Emporium, the directory, the map and the marketing
matter. Before this, a customer arriving from a broad channel finds a thin
marketplace and forms a permanent opinion.

---

## What to measure

Four numbers. Check them weekly.

1. **Orders from strangers** — people neither you nor the vendor recruited.
2. **Repeat rate** — the only honest signal that the product is useful.
3. **Open-state accuracy** — of the hours a vendor was actually trading, what
   fraction did the app say they were open? This is the product promise, stated
   as a number. Below ~80% and the directory is lying by omission.
4. **Time-to-accept** — order placed → vendor accepted. If this drifts past a
   few minutes the preorder proposition is dead.

Vanity numbers to ignore: vendor count, page views, signups.

---

## What would make me stop and rethink

- KaRa does not toggle open after two weekends of reminders. The one-tap action
  is the lightest ask in the product; if it does not stick, the model needs
  rethinking, not more features.
- Five orders happen and nobody orders twice.
- The first real order exposes something structural in the payment path.

---

## Honest assessment

**You are not ready for first users plural. You are ready for first user,
singular** — one vendor, then one customer — and that is further along than it
sounds, because the hard parts exist: the dashboard works, three vendors can log
in, the database is healthy, and one vendor is open right now.

The gap is not features. `PHASE_4_ROADMAP.md` is largely built. The gap is that
**nothing has ever been used**, and the three things standing between you and
using it are a merge, a phone call, and a Friday morning.

Also true, and worth saying plainly: there are **no tests** in this repository and
CI runs `npm run build` only. You can reach Gate 3 without them. You should not
reach Gate 5 without them, because by then a bug costs you a vendor relationship
rather than an afternoon.
