# The Command Center

**Prototype:** <https://claude.ai/artifact/K4MqCB6KxLb6wLJ3K7RYQr>
**Written:** 2026-10-22 · **Status:** design, nothing built

> "Open the app, understand what matters, move forward."

This document is about why the app does not feel like that yet, and what
specifically has to change. It is not a feature list — most of the features
already exist.

---

## The diagnosis

The app is organised around **what got built**, not around **who is looking**.

Twenty routes, one per thing that was made. The home page is a storefront for
strangers: a featured-trucks carousel, an Open Now strip, "Got a food truck?",
a newsletter box. Nowhere does anything ask *who are you and what should you do
next*.

Two measurements make it concrete:

- **Ten of the twenty routes are reachable only by typing the URL.**
  `/events` `/protea` `/blissings` `/raffle` `/rasta-rooster` `/kingdom-tokens`
  `/kullacoin` `/piano` `/signature` `/admin`. The home page links to seven
  routes. There is no hallway.
- **The vendor dashboard has twelve tabs.** A tab bar is the user choosing
  where to look. A command center has already decided and put the one thing
  that matters at the top.

That is the whole gap. Not polish, not animation, not an LLM — *orientation*.
The app has no opinion about what matters, so it cannot have an opinion about
what you should do.

### Who needs it most is already here

The clearest user of a command center in this project is **the operator**.
Local Grindz, the Kingdom Emporium, TOPP, Ohana Bloom, Rasta Rooster, KullaCoin,
Kula Mele, Uncle Robert's, plus live relationships with KaRa, Violet and Inoch —
eight ventures and three vendors, navigated by typing hash URLs into a phone.

That person does not need another screen. They need to know that the database is
asleep, that a demo flag has been on a real bakery's menu for three months, and
that two different platform fees are written down. All three were true this
morning and none of them is visible anywhere in the product.

---

## The model: signals, not screens

One structure carries it. A **signal** is something that might matter, and it
knows four things a page cannot infer:

| Field | Why it exists |
|---|---|
| `severity` | `crit` / `warn` / `info` — lets the surface rank instead of list |
| `consequence` | *what goes wrong if this is ignored.* The thing dashboards never say |
| `owner` | you, a vendor, or a third party — separates "act" from "wait" |
| `action` | one concrete next step, not a link to a tab |
| `audience` | which roles should ever see it |

Most signals are **derived, not stored** — ordinary queries over tables that
already exist:

```
no vendor has locations.status = 'open'        → crit, marketplace
vendor.menu_items has available = false        → warn, that vendor
vendor.user_id is null but email is personal   → warn, blocked login
vendor.phone is null and address is null       → info, unconfirmed listing
orders.status = 'pending' older than 10 min    → crit, that vendor
```

A handful need a small table — acknowledgements, snoozes, and the few signals
that are genuinely editorial rather than computed.

**Personalization is then a projection, not a feature.** Same model, filtered by
audience and sorted by severity. The prototype's persona switch is not a demo
trick; it is the actual implementation — one surface, three audiences, no
duplicated pages. The roles already exist in the schema: `vendors`, `admins`,
and everyone else.

---

## What AI genuinely adds — and where it must not go

Being honest about this is what will keep the product trustworthy.

**Do not use a model to decide what is broken.** Ranking, blocking and
consequence are deterministic queries. They must give the same answer twice, and
they must be right when it matters. An LLM that occasionally omits "your
database is down" is worse than a `case` statement that never does. The feeling
of intelligence in the prototype comes entirely from state-awareness — there is
no model in it at all.

Where a model earns its place:

- **Onboarding intake.** "I run a bake stand in Kalapana, Fridays through
  Sundays, I sell out by one" → a vendor row, hours, a location, a first
  special. This is the single highest-value use: it removes the form. It is also
  exactly the "learns their priorities, assembles the right workspace" claim,
  and it is achievable.
- **Content creation.** Descriptions, specials copy, a listing rewritten for
  search. Draft-only, always vendor-approved — never auto-published.
- **Semantic search.** Already substrate: `phase-4n-ai-search.sql` has pgvector
  on `vendors` and `menu_items`, HNSW indexes, a `match_vendors` RPC and an FTS
  fallback. Unused by the UI.
- **The week in a sentence.** Summarising what changed, over signals the rules
  produced — not instead of them.

`ShopAgent` is the shape of the conversational layer already. It is scoped to
TOPP's catalogue; the command center is where it becomes an assistant with
context about *you*.

---

## Build order

**Prerequisite — Stage 1 of `ROADMAP_TO_COMPLETION.md` is not optional any more.**
Nine read sites discard their `error`. Build a command center on top of that and
an outage renders as *"Nothing needs you right now."* A dashboard that says all
clear while the database is down is worse than no dashboard, because people stop
checking. **Fix the error handling before the home route learns to reassure
anyone.**

1. **The hallway.** Give the ten orphan routes a way in. Cheap, immediate, and it
   stops the app feeling like a pile of pages. Do this first because it is an
   afternoon and it changes the felt experience more than anything else here.
2. **`src/lib/signals.ts`.** The model and the derivations, as pure functions over
   query results. Testable without a browser — which also means it is the first
   thing in this repo with real tests.
3. **The home route becomes the command center.** Not a new page. `/` renders the
   marketing storefront for an anonymous visitor and the command center for
   anyone known. Same route, different projection.
4. **Collapse the vendor dashboard's twelve tabs** to a signal stack plus the
   tabs as a drawer. KaRa's "tap yourself open" should be the first thing on the
   screen, not inside Location.
5. **Conversational onboarding.** The intake above, replacing `/apply`'s form.
6. **Surface the search that already exists.** pgvector is sitting there.

Steps 1 and 2 are worth doing regardless of whether the rest is ever built.

---

## What to decide before building

- **Does the operator view ship inside Local Grindz, or is it its own app?**
  Related to the open music-suite question in `ROADMAP_TO_COMPLETION.md`. A
  command center spanning eight ventures is not really a food-truck marketplace
  feature.
- **Does the vendor command center replace the dashboard, or sit above it?**
  Replacing is better and riskier: KaRa has used those tabs since July.
- **How honest is the empty state?** When nothing is wrong, does it say "all
  clear" — and how do you know the difference between *nothing is wrong* and
  *nothing was checked*? This is the error-handling question wearing a different
  hat, and it decides whether anyone ever trusts the surface.

---

## On the pitch itself

The vision holds up. One caution worth keeping: *"users don't have to learn a
complicated system before they get value"* is the right promise and the easiest
one to break. The current app asks a vendor to learn twelve tabs before the
first order. The prototype asks KaRa to do one thing — tap open — and says why
it matters.

That contrast, not the aesthetic, is the product. The dark instrument panel is
just what honesty looks like when it is laid out well.
