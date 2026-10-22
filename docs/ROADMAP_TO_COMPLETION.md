# Roadmap to Completion

**Written:** 2026-10-22 · **Branch:** `claude/phase-2-completion-check-j9i9wk`
**Measured against:** `5d8405c` (PR #40 head), `main` at `205468b`

This is not a feature wishlist. `docs/PHASE_4_ROADMAP.md` already holds the
feature vision and most of it is **built** — orders, loyalty, referrals,
messaging, push, AI search, raffles, image storage, admin console, map. The
migrations are in `docs/migrations/` and the pages are in `src/pages/`.

What is missing is different in kind. The platform is feature-complete and
**not yet trustworthy**: its data layer is asleep, its failures are invisible,
its verification is unreproducible, and it has never cut a release. This
roadmap is ordered by that, not by feature count.

---

## Definition of done

Completion is **one real vendor and one real customer completing a transaction
with nobody from Local Grindz in the loop**, on a site that tells the truth
when something breaks.

Five conditions, all testable:

1. A visitor loading the site sees real vendors, or an honest error — never a
   false "no vendors."
2. A vendor logs into `/vendor` with their own credentials and edits their own
   listing.
3. A customer places an order, pays the vendor directly, and watches the status
   change.
4. Anyone can clone the repo, run one command, and see the test suite pass.
5. The version shipped is a tagged release, not `[Unreleased]`.

Nothing below is a new feature. It is all the distance between *built* and
*done*.

---

## Stage 0 — Wake the platform up

**The site's data layer is currently asleep and this outranks everything else.**

Supabase project `pqzygehnnojdttmqadrz` returned `status: INACTIVE` on
2026-10-22. SQL queries time out. Every data-driven surface — the directory,
storefronts, map, vendor dashboard, admin console, order tracking — is talking
to a database that is not answering.

| # | Task | Owner |
|---|---|---|
| 0.1 | Restore the project from the Supabase dashboard | **Operator** |
| 0.2 | Decide the pause problem (below) | **Operator** |
| 0.3 | Merge PR #40 — open since 2026-09-04, green, `mergeable_state: clean` | **Operator** |
| 0.4 | Drop `claude/phase-2-completion-check-j9i9wk` from `deploy.yml` triggers once merged | Dev |

### The pause problem

Free-tier Supabase projects pause after roughly a week of inactivity. A
marketplace that nobody visits for a week takes itself offline, and the next
visitor is the one who finds out. Three options:

- **Upgrade to Pro** — projects don't pause. Costs money, solves it outright.
- **Keep-alive** — a scheduled GitHub Action hitting the REST API every few
  days. Free, but it is a workaround, and it fails silently when the Action does.
- **Accept it** — only defensible if the site is not being shown to anyone,
  which stops being true the moment a vendor is onboarded.

This is a business decision, not a technical one. **It needs an answer before
any vendor is invited**, because a vendor whose storefront is down the first
time they check it does not come back.

**Exit:** project `ACTIVE_HEALTHY`, the pause decision recorded, PR #40 merged.

---

## Stage 1 — Make failure legible

A database outage currently renders as a **lie**.

`src/pages/Directory.tsx:79` reads:

```ts
query.then(({ data }) => {
  let results = (data as Vendor[]) || [];
  ...
  setVendors(results);
  setLoading(false);
});
```

`error` is never destructured. When Supabase is unreachable, `data` is null,
`results` is `[]`, loading ends, and the page renders:

> No vendors in this category yet — local vendors can join free.

Six vendors exist. The site tells visitors there are none, and invites them to
fill the gap. The same pattern appears at **9 call sites across 7 pages** —
`Landing`, `Directory`, `Map`, `Events`, `Raffle`, `VendorDashboard`,
`AdminDashboard` — including all three public discovery surfaces. Eight other
sites in the codebase do handle `error`, so this is inconsistency, not policy.

| # | Task |
|---|---|
| 1.1 | Add a shared load helper returning `{ data, error, loading }` — one place to get this right |
| 1.2 | Convert all 9 sites; distinguish **empty** from **broken** in the UI |
| 1.3 | Error state gets a retry affordance, not a dead end |
| 1.4 | Regression test: with the client stubbed to fail, the directory must *not* say "no vendors yet" |

**Exit:** no read path in `src/` discards its `error`. An outage reads as an
outage.

---

## Stage 2 — Make the data true

The discovery features are built and have almost nothing truthful to show.

**Every one of the six vendors is seeded `status: 'closed'`** —
`phase-4-1-seed-vendors.sql:26` hardcodes `'closed'` for the original three, and
the Inoch's, Uncle Robert's and Violet seeds do the same. So:

- the **Open Now** filter has never returned a vendor,
- map pins have never shown an open venue,
- the open/closed badge has never been green from seed data.

The features work. The data has never exercised them.

| # | Task | Owner |
|---|---|---|
| 2.1 | **Violet's login** — add `violetpainstheworld@gmail.com` in Supabase Auth admin, run the `user_id` backfill, send the temp password out of band (`docs/VIOLET_LOVE_DESIGNS.md`) | **Operator** |
| 2.2 | Confirm Violet's street address and phone first-hand — both current values were read through search; violetlovedesign.com and the Puna Kai tenant page are egress-blocked here | Operator |
| 2.3 | Confirm **Inoch's Ital** — neighborhood, address, hours, phone and socials are all NULL; the menu came off a photograph and Inoch has not been contacted | Operator |
| 2.4 | Fill **Uncle Robert's** vendor row from the landing page merged in #39 (address, Facebook, Wednesday market) | Dev |
| 2.5 | Decide how `locations.status` becomes `open` — manual vendor toggle, or derived from `hours`. Nothing currently sets it | Dev + Operator |
| 2.6 | One vendor all the way through: real hours, a real open state, a real order | Both |

**Honesty rule already in force:** unverified fields stay NULL and locations
stay `closed`. Nothing here should be filled in by guessing — the fix is a phone
call, not a commit.

**Exit:** every listed vendor has confirmed contact details and hours; at least
one is genuinely open during its posted hours; Violet can log in.

---

## Stage 3 — Make verification reproducible

**There are no tests in this repository.** No `npm test`, no test files,
and `.github/workflows/deploy.yml` runs `npm run build` only.

The "281 assertions across 12 suites" quoted in PR #40 were real — they ran, and
they caught every bug listed in that PR. But they were bundled with esbuild into
scratch files and executed ad hoc; the container was reclaimed and they are
gone. Nobody else can run them, and nothing stops the next commit from
reintroducing the bugs they caught.

That is the single largest gap between this project and a finished one.

| # | Task |
|---|---|
| 3.1 | Add a test runner and an `npm test` script |
| 3.2 | Commit suites for the pure modules — `harmonics`, `carrierColor`, `pitch`, `fft`, `vocalTrigger`, `sampleLoader`, `marketplace`, `payments`, `cta`, `voiceLeading`, `phoneticCodex`, `posterParse` |
| 3.3 | Re-pin the bug regressions by hand, each written to **fail** against the original bug: onset warm-up, phantom onset, kick double-trigger, onset timing, loudness normalization, singular menu categories |
| 3.4 | Add a `test` job to CI; make it required on PRs |
| 3.5 | Remove `@supabase/server` from `package.json` — it is a dependency with **zero imports** anywhere in `src/` |

**Exit:** `npm test` passes from a clean clone, CI runs it on every PR, and the
bugs PR #40 found cannot come back silently.

---

## Stage 4 — Ship a version

`package.json` says `4.0.0`. `CHANGELOG.md` has **68 consecutive
`[Unreleased]` headings** and not one released version. There is no tag, no
release, no way to say what is running.

| # | Task |
|---|---|
| 4.1 | Collapse the `[Unreleased]` entries under a real version heading with a date |
| 4.2 | Tag it and cut a GitHub release |
| 4.3 | Keep exactly one `[Unreleased]` section open from then on |
| 4.4 | Record which Supabase migrations are applied to production — `list_migrations` versus `docs/migrations/` has never been reconciled |

**Exit:** a tagged release whose notes describe what a visitor actually gets,
and a known-good migration baseline.

---

## Stage 5 — Finish the commerce side

From `docs/SHOPIFY_SYNC_CHECKLIST.md`, last audited 2026-07-03. All of this is
blocked on **content and operator decisions**, not code.

| Blocked on | Items |
|---|---|
| Sky Pilot file attachment | 15 July 2026 field-series prints, all DRAFT |
| Product photography | 5 merch items (mug, tee, tote, stickers, patch), all DRAFT |
| PDF writing + covers | 5 grower guides — no Shopify products exist |
| Platform choice + legal | 3 memberships — see the warning below |
| Operator | 5 collections not yet created; `support_archive` and `grower_resources` CTAs still `coming_soon` |
| Phase 8 | Storefront API not enabled — needed for an in-page cart |
| Photos not uploaded | 2 prints (King Protea cinder field, pincushion pair) |

**Two standing constraints that do not bend:**

- The **"Botanicals" $9/mo plan is a print subscription, not a membership**.
  It must never be reused as a membership proxy.
- DRAFT products may be created from code. **Publishing** a product, changing
  payment settings or taxes, and touching legal or customer settings all
  require explicit operator approval.

**Exit:** `SHOPIFY_SYNC_CHECKLIST.md` has no DRAFT item that the app advertises
as available, and every `coming_soon` CTA either goes live or comes off the page.

---

## Stage 6 — Measure the baseline nobody has measured

`PHASE_4_ROADMAP.md` sets targets — Lighthouse 95+ performance, 95+
accessibility, 100 SEO, LCP < 2.5s, CLS < 0.1. **None has ever been measured.**

One number is known: the entry chunk is **527.73 kB raw / 149.55 kB gzip**,
above Vite's 500 kB warning, and the build says so on every run. The audio
routes are already code-split (KullaCoin 38.5 kB gzip, SmartPiano 12.7 kB,
SignatureSong 16.4 kB, Map 46.0 kB, VendorDashboard 77.6 kB); the shared entry
is what is heavy.

| # | Task |
|---|---|
| 6.1 | Run Lighthouse against the deployed site and **record the real numbers** before optimizing anything |
| 6.2 | Split the entry chunk if the measurement justifies it — not before |
| 6.3 | Keyboard and screen-reader pass on the paths that matter: directory → storefront → order |
| 6.4 | Structured data and OG tags for vendor storefronts |

**Exit:** measured scores in the repo, and any gap against the targets either
closed or consciously accepted in writing.

---

## One open decision, for the operator

**Is the music suite part of Local Grindz, or its own product?**

`KullaCoin`, `SmartPiano`, `SignatureSong` and the harmonic colour engine are a
substantial, genuinely novel body of work — and they share nothing with a food
marketplace except a deploy target. They are a third of the routes and a large
share of the shipped JavaScript.

Three honest options:

1. **Keep them together** — the marketplace carries a music arcade. Cheap to
   do nothing; confusing to explain to a vendor or an investor.
2. **Split the repo** — the music suite gets its own domain and its own
   release cadence. Clean, and the shared OKLCH/harmonics libs become a
   package.
3. **Front-door them separately** — one codebase, two entry points, two
   stories. Middle path.

This does not block any stage above, and nothing should be split before PR #40
merges. But **"complete" cannot be defined until it is answered**, because
option 1 and option 2 have different finish lines.

---

## The short version

| Stage | Blocks on | Gate |
|---|---|---|
| **0** Wake it up | **Operator** | DB awake, #40 merged, pause decided |
| **1** Legible failure | Dev | No swallowed errors; outage reads as outage |
| **2** True data | **Operator** + dev | Confirmed vendors; one genuinely open; Violet logs in |
| **3** Reproducible tests | Dev | `npm test` green from a clean clone, in CI |
| **4** Ship a version | Dev | Tagged release; migrations reconciled |
| **5** Commerce | **Operator** | No advertised DRAFTs; CTAs resolved |
| **6** Baseline | Dev | Measured Lighthouse, recorded |

**Stages 0 and 2 are mostly not code.** They are a dashboard click, a phone
call to Inoch, a confirmed address for Violet, and a password sent out of band.
The code is further along than the business groundwork, and no amount of
engineering closes that gap.

The fastest honest path to a site worth showing someone: **restore the database,
merge #40, fix the nine swallowed errors, and get one vendor fully real.**
Everything else can follow.
