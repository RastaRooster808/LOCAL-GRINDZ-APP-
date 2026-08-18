# Changelog

All notable changes to Local Grindz are documented here.

---

## [Unreleased] — Rasta Rooster custom tee order request (2026-08-18)

### Added — direct-to-community custom apparel, no middleman
- New **`/custom-tee`** page: customers pick garment (standard tee / heavy
  cotton / hoodie), size, color, print locations (front, or front + back for
  a flat add-on), and choose free Pāhoa pickup or flat-rate Hawaiʻi Island
  shipping. A live price quote updates as they choose.
- `src/lib/customTeeOrder.ts` — typed pricing calculator
  (`calculateCustomTeeOrder`) and the garment/fulfillment option tables the
  page renders from, so price logic lives in one place.
- Orders are design **requests**, not live checkout: no payment is collected
  in-app. Submissions insert into a new `custom_tee_orders` table
  (`docs/migrations/phase-5b-custom-tee-orders.sql`) for admin follow-up —
  same guest-submit / admin-review RLS pattern as `vendor_applications`.
  Screen printing, heat transfer, or DTG production and payment are arranged
  directly with the customer after design review.
- Linked from the homepage promo rotator and footer nav.

### Not included in this pass
- No drag/rotate/scale visual customizer canvas yet — design intent is
  captured via notes + an optional reference-art link. No reference-image
  file upload (would need a new public storage bucket + RLS policy).
- No Stripe/Apple Pay checkout and no admin dashboard tab for reviewing
  these orders yet — both are natural next steps once the intake flow is
  validated with real customers.

### Governance note
- Reviewed against `docs/TEAM_CHARTER.md`: Atlas (no live Shopify/payment
  changes — intentionally a request-only flow), Kai (clear price transparency
  before any payment is asked for), Orion (build clean, RLS mirrors an
  existing, working table pattern), Sentinel (no critical issues; rollback is
  deleting the route + dropping the table). No payment, tax, or Shopify
  product settings were touched, per standing rules.

---

## [Unreleased] — Unreal importer: optical zoom and a camera cut (2026-08-16)

### Added — the lens moves too
- The importer now keyframes **`CurrentFocalLength`** on the CineCameraComponent
  alongside the camera's position: **24mm → 35mm → 85mm** across macro → meso →
  micro. Wide over the planet, tightening to a portrait lens on the person — the
  optical half of a Powers of Ten zoom, on top of the physical descent. Tunable
  via `FOCAL_MACRO / FOCAL_MESO / FOCAL_MICRO`.
- Added a **camera cut track**, so the sequence renders through this camera
  instead of whatever the level happens to be looking through.
- Both are **guarded**: the binding API shifts between UE 5.x releases, so a
  failure costs the lens move or the cut track, never the whole sequence.
- The importer now logs the **`origin` anchor** from the export, read with
  `.get()` so exports made before the anchor existed still load.

### Note on "studio login" scripts
- A circulating variant of this script gates itself behind a fake
  `verify_studio_login(api_token=...)`. It is not genuine: `is_confirmed = True`
  is hardcoded so the check always passes, Unreal Python has no studio API token,
  and its comment invites mapping the token to `urllib` network calls. It also
  never opens `user_spectrum.json` — it is a hardcoded dolly that ignores the
  spectrum entirely. A warning is now recorded in the file header. **This
  importer talks to nothing outside your machine.**

---

## [Unreleased] — Hawaiʻi is the offset, stated in the file (2026-08-16)

### Added — the anchor travels with the export
- Confirmed the frame was already correct: coordinates are Big Island local ENU
  with the island centre as origin, so **placing Hawaiʻi at the Unreal world
  origin is exactly the assumption the export was built on**. No retune needed.
- That anchor previously lived only in a code comment. Each `user_spectrum.json`
  now carries an **`origin`** block naming it — `Hawaiʻi Island (centre)`, lat
  **19.5949**, lon **-155.5028**, frame `ENU (+X east, +Y north, +Z up)`, units
  `cm` — so the assumption is visible and checkable in the file itself.
- Added **`micro_ground_geo`**: the person's point as real **lat / lon /
  altitude**, so a georeferenced scene (e.g. Cesium for Unreal) can place it
  without assuming anything. A scene with Hawaiʻi at the origin ignores it and
  uses the ENU centimetres exactly as before.

### Verified
- Six signatures (ALOHA, MAHALO, HONU, PONO, WAI, ʻĀINA) all resolve to
  coordinates **inside the real Hawaiʻi Island bounds** (18.9–20.3 °N,
  156.1–154.8 °W) with plausible altitudes (718 m – 1717 m).
- The importer contract is unchanged — every key
  `tools/unreal/generate_zoom_sequence.py` reads is still present; the new keys
  are additive and the script ignores extras. Build clean.

---

## [Unreleased] — The line, traced on the sheet itself (2026-08-16)

### Added — the reading drawn back onto the photo
- The parsed poster is no longer a separate abstract grid beside the picture. The
  photo now renders to a canvas with the **current line traced directly on it**:
  the sheet dims, the line's swatches are **cut back out of the veil** so you see
  the actual ink, and a thread joins them — which is what makes a diagonal read
  as a line rather than scattered squares.
- **A playhead walks the line as it sounds.** Each swatch lights with a white ring
  and its own glow exactly when its note plays, driven from elapsed time against
  the audio's own step, so picture and sound stay together.
- `Cell` now carries its pixel `rect`, and `PosterRead` its `width`/`height`, so a
  reading can be mapped back onto the image at any display size. The overlay is
  DPR-aware and redraws on resize and on any change of direction or line.

### Verified
- On a ↘-progression poster: the middle diagonal (line 15 / 30) traces correctly
  across the sheet; white highlight pixels went **0 → 180 → 207** across playback,
  confirming the playhead lights and advances. Cell rectangles align exactly with
  the printed swatches — visible where a single-cell corner diagonal lights one
  swatch and nothing else. No page errors, build clean.

---

## [Unreleased] — Spectrum export fixed; a keyboard you can actually play (2026-08-16)

### Fixed — the spectrum export could fail with no way out
- **"Download my spectrum" had no error handling at all**, so any failure surfaced
  as a raw error and the spectrum was unreachable. It now catches failures and
  **always renders the JSON on the page** with a **Copy** button, so the export is
  never trapped behind a download the browser refuses — iOS in particular blocks
  programmatic blob saves, and a phone has nowhere obvious to put a file.
- The blob URL was revoked after **1 second**, which can cut off a slow device
  mid-save; now 60 s.
- **`user_id` dropped macron'd letters:** `ʻĀINA` named the asset `INA`, because
  `Ā` isn't in `A-Za-z` and was stripped whole. Kahakō now folds to the base vowel
  first, so it correctly reads `AINA`. Verified end-to-end: the download yields
  `AINA_e5c339e6` and the on-page copy matches the file byte for byte.
- Confirmed the maths was never at fault — eight signature shapes (including
  poster-derived, all-ʻokina, all-A, single-note and 24-note) produce no NaN, land
  on-island, and give valid asset IDs.

### Changed — a bigger, more playable keyboard
- Thirteen keys across a phone gave **~26 px targets**, too fine to play. Keys are
  now much taller with larger letters, and on narrow screens the board **wraps to
  two rows (7 + 6)** so each key roughly doubles in width — rainbow order intact.
  Measured: **45 × 88 px** on a 390 px phone (was ~26 px wide), **52 × 136 px** in
  one continuous row on desktop.
- Added press feedback, removed the tap-highlight flash, and honoured
  `prefers-reduced-motion`.

### Found
- **The real poster reads as a `run` along ↘.** The down-right diagonal is a
  rainbow progression, about a key at a time — so that is the direction the
  poster's melody runs. Recorded in `docs/KULA_MELE_COLOR_MAP.md`.

---

## [Unreleased] — Read the poster in any direction (2026-08-16)

### Added — rows, columns, and both diagonals
- `readLinesDetailed(read, order)` splits the grid four ways: **`row`**, **`col`**,
  **`diag-down`** (↘, cells sharing `col − row`), **`diag-up`** (↙, sharing
  `col + row`). Each line carries its notes **and** the cell indices they came
  from, so the on-screen highlight and playback cannot drift apart.
- The read-out gains a **direction selector**; navigation is now by *line* rather
  than row, and any line can still be adopted as a signature.

### Added — what the poster does in each direction
- `scoreOrder` / `rankOrders` measure the mean circular key-step between
  neighbours and label each direction: **band** (colour constant — you're running
  along a stripe), **run** (a rainbow, ~a key at a time), **mixed**, **scatter**.
- Deliberately *not* a verdict: a near-zero step means monotone, not "the reading
  direction". The app reports the shape of all four and leaves the choice to a
  person, since which one the author meant is a judgement about the artwork.

### Verified
- On a poster printed with colour constant along ↘: scorer labelled ↘ a `band`
  (step 0.00) and rows/columns `run`s (step 1.00). In-browser, switching gave
  **31 diagonal lines vs 18 rows vs 14 columns**, highlight following each,
  playback clean, no page errors.

---

## [Unreleased] — Poster parser confirmed on the real poster (2026-08-16)

### Verified
- A hand-held photo of the actual **"TAS CODE"** sheet — shot at an angle, paper
  curled, uneven room light — read as **20 × 26 (520 swatches)**, matching the
  printed grid. The parser works on the real artifact, not just synthetic tests.
- **De-skew is therefore not needed and stays unbuilt.** It had been held as the
  likely next step, since band projection assumes a roughly axis-aligned grid.
  In practice the ink mask tolerates the skew of an ordinary phone photo: a
  modest lean shifts a column's pixels without merging it into its neighbour.
  Revisit only if a photo genuinely fails — try a flatter, straight-on shot first.

---

## [Unreleased] — Kula Mele: lightness → octave (2026-08-16)

### Changed — the poster reader now hears shade, not just hue
- **Hue picks the key, lightness picks the octave** (`colorToOctave`): `l < 0.38`
  sings an octave **down**, `l > 0.62` an octave **up**. This resolves the
  documented collapse where a bright red and a deep maroon landed on the same
  note — they are now the same key an octave apart — and it mirrors the KullaCoin
  coin model, where a Kulla is colour + octave + velocity.
- `PosterRead` now carries **`notes`** (`{slot, octave}`) alongside `seq` (keys
  only); `playNote` takes an octave and a new `playNotes` plays a row as printed.
- The grid read-out marks octaves (▾ / ▴ plus an inset edge); the row you play
  sounds the way the poster looks.
- **Signatures stay octave-less by design** — the 13 keys are what a player taps
  back, and the keyboard has no octave control.

### Verified
- Twelve inks across three lightness bands → **12 distinct sounding notes**
  (previously 8 inks collapsed to 7 keys). Three shades of red became three
  octaves of A: **130.8 / 261.6 / 523.3 Hz**.
- Full poster parse unchanged at **518/520 (99.6%)**. In-browser: a 3-band poster
  read as **"A ▾", "A", "A ▴"** (6 down, 6 centre, 6 up), playback clean, no errors.

---

## [Unreleased] — Kula Mele: the Flower as the tuner's centrepiece (2026-08-16)

### Added — the tuner's face is the sacred geometry
- The voice tuner is now built around a **Flower** centrepiece. The **Fruit of
  Life is exactly 13 circles** (centre + ring of 6 + outer ring of 6) — a
  one-to-one seat for each Hawaiian key — drawn over a faint interlacing **Flower
  of Life** lattice. It is the same lattice the Powers of Ten export lands on.
- Sing and your note's circle **blooms in its own hue**, with a **cents arc**:
  green within ±8 cents, gold when sharp/flat, sweeping right for sharp and left
  for flat. The YIN detector now surfaces exact cents, not just the nearest key.
- A ~400 ms hold stops the bloom flickering between breaths; the glow pulse is
  suppressed under `prefers-reduced-motion`; canvas is DPR-aware.

### Fixed
- Canvas backing store was left at the default **300×150** because the resize
  guard only checked `width`, squashing the drawing 2:1. Now checks both axes.

### Verified
- End-to-end with a **synthetic microphone**: Chromium launched with a generated
  440 Hz WAV as the capture device → YIN → tuner reports **"Heard: H"** (H *is*
  440 Hz), flower blooms on H's seat with the in-tune arc. Canvas confirmed
  300×300. Build clean, no page errors.

---

## [Unreleased] — Kula Mele: the poster parser (image as source) (2026-08-16)

### Added — read a printed colour-code poster into a melody
- New **`src/lib/posterParse.ts`**: reads a printed swatch grid (e.g. the "TAS
  CODE" poster) off a photo and turns it into notes on the 13-key colour piano.
  Pure functions (raw RGBA in, cells out) so the same code runs in the browser
  and in headless tests. **The image never leaves the device** — decode, downscale
  (max 900 px) and parse all happen in the page.
- **Band detection, not brute force:** printed posters put saturated swatches on
  white paper, so the parser builds an "ink" mask and projects it onto each axis;
  runs above threshold are the swatch columns/rows. O(w·h), scales to hundreds of
  cells, tolerates uneven spacing. Variance-based `autoGrid` stays as the fallback
  for gapless grids; explicit rows/cols always override.
- Cells are sampled on an **inset sub-lattice** (grid lines excluded), averaged,
  and matched to the **nearest key hue**. Low-saturation / near-white / near-black
  cells become **rests**, so white paper and pencil handwriting are skipped rather
  than sung.
- **UI:** upload → **🔍 Read the colours** → a live read-out of the detected grid,
  row-by-row navigation, **▶ Play this row** (each row is a phrase), and **Use as
  my signature** (takes the row's first 6 notes).
- **Known limitation (documented):** matching is by hue alone, so a bright red and
  a deep maroon land on the same key; encoding lightness as an octave is the
  natural next step.
- **Verified:** synthetic 20 × 26 poster with uneven lighting + noise → grid
  recovered exactly, **518/520 cells correct (99.6%)**, white/pencil → rests.
  End-to-end in-browser: upload → read → 520 cells → play row → adopt signature.

---

## [Unreleased] — Kula Mele: full alphabet, continuous rainbow, flower-of-life, IP notice (2026-08-16)

### Changed — the full 13-letter alphabet as one continuous rainbow
- The color piano now spans the **complete Hawaiian alphabet**: 5 vowels + 7
  consonants (H K L M N P **W**) + the **ʻokina** = **13 keys** (was 11). Pitches
  extend to a C4→A5 run. Colors are now **generated as one continuous rainbow**
  (`hue = i/13·360`, `hslHex`), and the keyboard renders as a single flowing
  spectrum bar rather than discrete blocks.
- Spelling now recognizes **W** and folds any apostrophe (`'‘’\``) to the
  **ʻokina** key; kahakō (macron) still strips to the base vowel — so `ʻāina` →
  `ʻAINA`, `wai` → `WAI`, `ʻawa` → `ʻAWA`. Table refreshed in
  `docs/KULA_MELE_COLOR_MAP.md`.

### Added — "land into the realm of your image"
- Unlocking with an uploaded image now **lands you into that image**: it becomes
  the animated backdrop of the lit-in state (`--realm` background + veil for
  legible text). The upload is reframed as "the realm your song lands you in."

### Changed — Powers of Ten offset = a Flower-of-Life lattice
- `micro_ground` no longer scatters randomly: it **snaps to a Flower-of-Life
  node** over Hawaiʻi, placed by the signature's own harmonics — average **pitch →
  ring** (and ground elevation), average **hue → seat** around the ring, with a
  small hash jitter to keep colliding words distinct. Re-validated: all sample
  signatures land on-island; the Unreal importer's key contract is unchanged.

### Added — IP protection ahead of vendor release
- Repository **`NOTICE`**: proprietary/all-rights-reserved, with a limited,
  revocable **vendor/partner license** clause and an explicit note that anti-cheat
  controls (e.g. the server-held daily-challenge target) are load-bearing and must
  not be weakened. Copyright headers added to the Kula Mele source + the Unreal
  tool.

---

## [Unreleased] — Kula Mele: the color piano & signature sign-in (2026-08-15)

### Added — "a piano made of colour" (11 Hawaiian letters)
- New **`/signature`** route (**Kula Mele**), an additive module that leaves the
  4-colour KullaCoin economy untouched. Eleven Hawaiian letters — 5 warm vowels
  (A E I O U) + 6 cool consonants (H K L M N P) — each a **colour + pitch** on a
  luminous keyboard. Colours flow as a spectrum; pitches are a rising C-major run
  so any Hawaiian word sounds musical. Mapping documented in
  `docs/KULA_MELE_COLOR_MAP.md` (W and the ʻokina reserved for a later 12th/13th
  key). Nav link added.

### Added — the signature song as an accessible sign-in
- Spell a Hawaiian word → it becomes your **signature song** of colour and light.
  Play it back (tap the keys **or sing it**) to "light in": a cascade of colour
  confirms the match; wrong notes reset gently with **zero penalty**.
- **Voice accessibility via real DSP:** mic audio runs through a **YIN** pitch
  detector (squared-difference → CMNDF → absolute threshold → parabolic
  interpolation), mapped to the nearest key within ±130 cents. Validated
  offline to resolve all 11 colour-keys through harmonics + noise (an earlier
  autocorrelation attempt octave-erred and was replaced).
- **Honest security boundary:** the song is an **accessible local unlock** that
  opens your profile on the device — *not* an account password. Right after
  lighting in, a **Supabase magic-link** hand-off secures the real account across
  devices (reuses the Account page's `signInWithOtp` flow). Signature persists
  under a `kulla_`-prefixed key so it rides the existing KullaCoin cloud sync.
- **Image-as-source:** upload your colour-code poster to show it as a palette
  reference (automatic grid-reading from a photo is a documented future upgrade).

### Added — Powers of Ten export (Unreal bridge)
- Once a signature exists, a **"Download my spectrum"** button exports
  **`user_spectrum.json`** — deterministically derived from the signature (FNV-1a
  of `word:seq`) so everyone shares the macro planet view but each person gets a
  **unique ground point** (planet → atmosphere → individual).
- Committed the importer **`tools/unreal/generate_zoom_sequence.py`** (the
  provided LevelSequence script) and documented the exact schema in
  `docs/KULA_MELE_COLOR_MAP.md`. Verified the export satisfies every key the
  script reads (dry-ran the importer's accesses; asset-safe `user_id`); browser
  download smoke-tested. **All three priority-1 threads now landed.**
- **Anchored the zoom on Hawaiʻi (HST):** coordinates now use a Big Island local
  ENU frame (E/N/Up, meters × 100 = cm, origin = island centre). Unique points
  spread across the real footprint (≈150 km × 130 km) with elevation from sea
  level → Mauna Kea (≈4207 m), so the flight lands everyone somewhere on the
  island. Tunable via the `HI` constants in `buildSpectrum()`. Re-validated:
  six sample signatures all land on-island; importer contract unchanged.

---

## [Unreleased] — KullaCoin Phase C.2: the daily hidden-song challenge (2026-08-15)

### Added — a cheat-resistant "Heardle for melodies"
- One hidden **4-note song per day**, shared by everyone. The target is
  **generated and stored server-side** in new **`kulla_daily`** — a table with
  **RLS enabled and no policies**, so no client (anon or signed-in) can ever read
  the answer. Only the security-definer guess RPC (which bypasses RLS) sees it.
- **`kulla_daily_guess(text)`** validates a `[0-3]{4}` guess, lazily seeds the
  day's random target, and returns **Wordle-style colour feedback** (green = right
  colour & spot, gold = in the song wrong spot, grey = not in the song) — **never
  the target**. Max **6 guesses**; solved on 4 greens. `EXECUTE` revoked from
  `public`/`anon` (Postgres' default PUBLIC grant), so only signed-in players
  guess. Verified live end-to-end with a seeded target, then test data cleaned.
- **`kulla_daily_results`** (RLS: read-your-own; writes only via the definer RPC),
  plus **`kulla_daily_state()`** (restore your progress) and public read-only
  **`kulla_daily_board()`** (today's solvers ranked by fewest guesses, then
  earliest).

### Added — the 🎯 Daily overlay in the app
- New toolbar button opens a Daily Song panel: a 6×4 feedback grid, four colour
  pads (Blue/Gold/Red/Green) to compose a guess, **▶ Hear** to preview the guess
  through the game's synth (new `kulla-note-preview` message the embed answers),
  ⌫ back, and Guess. Today's board + player count shown below.
- Per-device guess history persists to a `kulla_daily_hist_<UTC-date>` key (rides
  the existing cloud sync); only colour hints are ever stored, never the answer.
  Logged-out players see a log-in prompt.

### Honest scope
- Unlike the play-to-reveal leaderboard (which ranks *collection* since the answer
  is shown), the Daily is a genuine **skill** test: the answer never reaches the
  client, so it can't be peeked. No real-money value — in-game bragging rights.

---

## [Unreleased] — KullaCoin Phase C: leaderboard, achievements & the winner's coupon (2026-08-12)

### Added — a real, cross-device leaderboard
- New **`kulla_solves`** + **`kulla_players`** tables (RLS owner-only) and a public
  **`kulla_leaderboard()`** security-definer RPC that ranks players by **songs
  mastered** (name is player-chosen, no PII). Verified live: seeded ranking
  returns correct ranks/names; empty board is graceful.
- The game reports each solved scene to the app (`postMessage`); `KullaCoin.tsx`
  records it to `kulla_solves` (logged-in only) and refreshes the board.
- **🏆 Leaderboard overlay** in the app: top players, your songs + rank, and a
  playful **achievement title** (Malihini → Hoa Mele → Mele Maker → Kanaka Mele
  → Kumu Mele → Kupuna Mele at all 108). In-game only, non-cashable.

### Added — the winner's free-food coupon (honest framing)
- The board's **#1 wins a free-food coupon**, spotlighted with a 👑. It's
  presented as a **contest prize honored by a participating vendor (e.g. KTA),
  valid once a vendor signs on** — not a fabricated redeemable voucher. When the
  logged-in player leads, they see a "coupon pending a vendor" notice.

### Honest scope
- Because the play-to-reveal answer is shown, this ranks **collection, not skill**
  — the board says so. The cheat-resistant **daily hidden-song challenge** and
  real-value reward economy remain the future stakes tier (server-spec).

---

## [Unreleased] — KullaCoin Phase B: cloud save (accounts) (2026-08-12)

### Added — your KullaCoin follows you across devices (when logged in)
- New **`kulla_state`** table (`docs/migrations/phase-b-1-kulla-state.sql`): a
  per-user JSONB snapshot of the KullaCoin localStorage (wallet, progress, loops,
  best times), **RLS-scoped to `auth.uid()`** (owner-only read/insert/update;
  `anon` has no access). Logged-out play stays entirely on-device.
- **`KullaCoin.tsx`** now cloud-syncs when a Supabase session exists: it hydrates
  from `kulla_state` **before** booting the game, then saves on change. Because
  the srcDoc iframe shares this origin's `localStorage` and dispatches `storage`
  events up to the app, sync needs **no changes to the game code**. A header
  chip shows **☁ Synced** / **☁ offline**, or **Log in to save ☁** when signed out.
- Graceful by design: table-missing or offline → the game keeps working locally.
- App shell repainted to the bright theme; build verified clean.
- **Deploy note:** the `kulla_state` migration still needs applying to the live
  project — the Supabase management endpoint was timing out at push time; the SQL
  is idempotent and ready in `docs/migrations/`.

---

## [Unreleased] — KullaCoin: multi-track loop overdub (2026-08-12)

### Changed — the loop recorder is now multi-track
- The first recording sets the **bar length**; each further **● Add layer** records
  a new layer **aligned to the loop**, so you can stack a bassline under a melody.
  **▶ Loop (N)** plays all layers together; **Clear** wipes them.
- Overdub records against the running loop clock so layers line up on the beat.
- Verified in a headless Chromium smoke test: layer 1 → 1 track playing; overdub
  → 2 tracks playing with "● Add layer" / "■ Stop (2)"; Clear resets — zero
  console errors; build clean.

---

## [Unreleased] — KullaCoin: 108 songs, riddle scenes, and a loop recorder (2026-08-12)

### Added — a much bigger Trial
- **108 unique songs / levels** (was 3): 3 authored showcase scenes, 6 **riddle
  levels**, and a generated library of unique 4-note songs, each with its own
  cartoon reveal. Level nav (◀ ▶ 🎲) and a live `n / 108` counter.
- **Riddle levels** hide the target dots and give a decodable clue
  (e.g. "Sea, sand, sea, palm.") with a colour-key legend
  (blue=sea/sky · gold=sun/sand · red=lava/sunset · green=leaf/honu). The
  spoiler "Hear it" button is suppressed on riddles. Wrong note still does
  nothing — zero penalty.
- **▶ Hear it** previews a (non-riddle) scene's song so you can learn/play it back.
- **Loop recorder:** ● Rec loop captures your pad taps with timing and loops them
  (▶ Loop / Clear) — record a groove and let it ride while you keep playing.
- Verified in a headless Chromium smoke test: 108 unique songs, riddle targets
  hidden, looper records + loops, a normal scene still reveals — zero console
  errors; build clean.

---

## [Unreleased] — KullaCoin: bright tropical repaint + play-to-reveal Trial (2026-08-12)

### Changed — goodbye all-black, hello Big Island
- Repainted KullaCoin from the dark "vault" world to a **bright sky-and-grass**
  theme: sky→grass page gradient, floating fruit &amp; musubi (🍍🥭🍙🍌🍈🌺), a
  grassy footer, and cream cards with soft depth. Coins still read as jewels, now
  on a sunny field. Text flipped to dark-on-light for contrast.

### Changed — The Trial is now play-to-reveal, not a runner
- Replaced the Geometry-Dash-style runner (too punishing — obstacle spacing made
  it near-impossible) with a **musical puzzle**: each level shows a colourful
  cartoon scene + a clue; play the colour-code melody in order on four big pads
  and the hidden layer is **revealed with a funny animated payoff** (sunrise,
  a devoured musubi, a lehua blooming). A **wrong note does nothing** — instant
  retry, zero penalty. Uses more space, focuses on musical timing, stays light.
- Ships with three scenes (Sunrise / Musubi / Bloom) and a Next-scene flow.
- Verified in a headless Chromium smoke test: pads + targets render, a wrong note
  keeps progress at 0 with no reveal, the correct sequence reveals the payoff —
  zero console errors; build clean.
- Note: this supersedes the earlier deterministic-physics "Phase A" runner work.
  Server verification for a melody puzzle is simpler still — the submitted input
  is just the note sequence, checked against the level's target (server-phase §03).

---

## [Unreleased] — KullaCoin: pick-your-sequence medley (2026-08-12)

### Changed — the medley is now a chooser, capped by level
- At **Level 1 (10 songs)** you can select **up to 2** of your songs to play in
  sequence; **Level 2 (20)** → 3; **Level N → N+1**. You tap songs to add them to
  the sequence (with order badges), and picking beyond the cap drops the oldest.
- The sequence plays in your chosen order and can loop, through the selected
  Hawaiian sound world. Play with nothing selected defaults to your most-recent
  `cap` songs.
- Verified in a headless Chromium smoke test (seed 12 coins → Level 1, cap 2,
  selection + cap-enforcement + playback), zero console errors; build clean.

---

## [Unreleased] — KullaCoin wired into the app at `/kullacoin` (2026-08-12)

### Added — the coin-as-song mini-app is now a route
- **New `/kullacoin` route** (`src/pages/KullaCoin.tsx`, lazy-loaded). It frames
  the self-contained KullaCoin experience — Canvas art + Web Audio + Proof-of-
  Melody minting (play the 4-note song to mint), Hawaiian sound worlds
  (ʻukulele + ʻiliʻili, ʻohe flute + ipu heke, pū conch), a SHA-256-chained
  wallet, and a scan-to-hear QR baked into every saved wallpaper.
- **Isolated by design:** the game ships as one tested HTML file
  (`src/pages/kullacoin.embed.html`) embedded in a sandboxed `<iframe srcDoc>`
  via Vite's `?raw` import. Its generic class names (`.card`/`.panel`/`.key`…)
  can't collide with the marketplace's global CSS, and the game stays a single
  source of truth — editing the file updates the route.
- **Discoverable:** added a **KullaCoin** entry to the marketplace nav.
- **Guardrail preserved:** art-only, no real money. KULLA is earned, never sold
  for cash, never cashed out — a closed-loop rewards concept, not a currency.
- Verified: `npm run build` clean (KullaCoin is its own ~15 KB gzip chunk).

### Added — personal identity: your own signature song
- **Enroll with name + phone number** and KullaCoin derives a unique,
  deterministic 4-note **signature song** (via SHA-256 of name+number) that only
  you own — an independent sound per person. It becomes your wallet's Block #0.
- **Per-person wallet:** the ledger is namespaced by a hash of the number, so
  each enrolled person has an independent wallet; "switch person" swaps identity.
- **Privacy:** name and number are stored **only in the device's localStorage** —
  nothing is transmitted (the embed makes no network calls; the QR is a data URI).
  Displayed number is masked to the last four digits.

### Added — per-coin deep-link QR (scan to hear that exact song)
- Every coin now generates its **own** QR at runtime, encoding the song in a
  deep link: `…/#/kullacoin?s=<12-digit code>`. Scanning it opens KullaCoin and
  plays **that** coin — so a friend who sees your lock screen hears your exact
  song, not a generic demo.
- The QR is produced by the `qrcode` library bundled to a ~24 KB self-contained
  IIFE (via esbuild) and inlined — no external requests, CSP-safe. The old
  static QR data-URI is gone.
- **Deep-link read:** opening `?s=<code>` (or, on the app route, the code passed
  through by `KullaCoin.tsx` via `postMessage`, since HashRouter hides the query
  from the iframe) shows a "🎁 A song was shared with you" banner and plays it.
- **Robustness:** `sha256` gained a non-crypto fallback (see below), and the
  share code is validated (`[0-3]{12}`, octave/velocity range-checked) before use.
- Verified in a headless Chromium smoke test: QR generation, share URL, `?s=`
  deep link, and the postMessage path — zero console errors.

### Added — The Trial (a rhythm run built from your coin)
- **`⛰ Run this coin's Trial`** launches a Geometry-Dash-style runner generated
  deterministically from the current coin: a cube auto-scrolls and you tap /
  space / click to jump spikes timed to the coin's looping song, difficulty
  ramping across the run.
- **Binary collision, zero-death-penalty friction:** a miss resets instantly
  (no death animation, no loading). **Practice mode** drops a checkpoint so you
  can grind a hard section. Clearing records your fewest-tries best per coin.
- Self-contained Canvas + Web Audio; verified end-to-end in a headless Chromium
  smoke test (enroll → launch → run → clear), zero console errors.
- **Robustness:** `sha256` now falls back to a non-crypto hash when
  `crypto.subtle` is unavailable (file://, plain http), so the toy never
  hard-fails outside a secure context.

### Added — levels & the medley (sequence + loop your songs)
- **Level = floor(songs / 10).** A progress bar in the wallet shows how close you
  are to the next level; each 10 mints levels you up.
- **At Level 1 (10 songs) a Medley panel unlocks:** it sequences your most recent
  `level × 10` songs into one continuous piece and can **loop**. The medley grows
  as you level — Level 2 sequences 20, Level 3 sequences 30, and so on — and it
  plays through whichever Hawaiian sound world is selected.

---

## [Unreleased] — Vendor chat/inbox restored (2026-07-25)

### Fixed — messaging was dead (no table existed)
- **Built `public.vendor_messages`** (Phase 4L, never applied) so the Vendor
  Dashboard inbox and the storefront customer chat widget work again.
  (`docs/migrations/phase-4-14-*.sql`.)
- **Secure by design:** vendors read/update/realtime only their own threads
  (scoped by `vendors.user_id = auth.uid()`); customers can send but have no
  table read — a customer reads only their own thread via the scoped
  security-definer `get_customer_thread` RPC. Verified: anon direct read = 0,
  anon RPC read = 1.
- Storefront customer widget now reads via the RPC and polls for replies (anon
  has no realtime read); vendor inbox keeps realtime.

---

## [Unreleased] — Field Report subscription is live (2026-07-25)

### Changed
- **The Field Report ($4.99/mo) is a live Shopify subscription** — monthly
  selling plan attached (via Shopify admin). The `/protea` "Join · $4.99/mo"
  button now links straight to the live subscription product
  (rastarooster.com/products/the-field-report-monthly-membership); the email
  waitlist stub is removed. Membership flipped to **LIVE** in `commerce.js`.

---

## [Unreleased] — Raffle: tickets, gifting, Shopify pay, animated draw (2026-07-25)

### Changed
- **`/raffle` legibility overhaul** — sans-serif body, larger type, higher contrast.
- **$1 tickets pay through rastarooster.com** (Shopify). Created a "Camry Raffle
  Ticket — $1" DRAFT product; the pay button opens `rastarooster.com/cart/{variant}:{qty}`.
- **Multiple tickets** (quantity stepper, up to 50) and **gift-a-friend** (records
  the friend as the entrant + the gift-giver). `raffle_entries` gains
  `tickets`, `is_gift`, `gifted_by`; `raffles` gains `ticket_variant_id`
  (`docs/migrations/phase-4-13-*.sql`).
- **Admin digital draw** is now an animated, ticket-weighted randomizer — the
  name spins slot-machine style and eases to a stop on the winner. Entrant table
  shows ticket counts and gift attribution.

---

## [Unreleased] — Camry is the raffle prize (2026-07-25)

### Changed
- The **2003 Toyota Camry is now the raffle prize** (not an auction). Raffle
  record updated with the prize + a prize photo (`prize_image_url` column added,
  `docs/migrations/phase-4-12-*.sql`). The `/raffle` page shows the Camry photo.
- Homepage promo now reads **"Win a 2003 Toyota Camry"** and links to /raffle.
- The Shopify draft was **archived + renamed** "…(Raffle Prize — not for sale)"
  — it's a prize awarded via the raffle, not a Shopify checkout item. Noted the
  Ko Hawaiʻi Pae ʻĀina provenance / Hawaiian Kingdom plates + a registration
  disclosure for the winner.

---

## [Unreleased] — TOPP sponsor section: prints as menu items (2026-07-25)

### Changed
- Reworked the `/protea` hub (reached by clicking the TOPP sponsor). The
  botanical prints are now **all listed as buyable menu items**, grouped into
  sections (King Protea, Pincushions, Conebush & Lava, Landscapes & Foliage,
  Botanical Studies), each with a Buy → Shopify link. The members-only grey-out
  **wall is removed**; The Field Report ($4.99/mo) is now an **optional upsell**
  banner, not a paywall.
- The **Ohana Bloom Counter** arrangement is listed but flagged
  **"Out of season · Out of stock."**

---

## [Unreleased] — Monthly sponsor spots + raffle launch (2026-07-25)

### Added
- **Monthly Sponsor Spots** on the home page (`SponsorSpots` component,
  `SPONSOR_SPOTS` data): three premium slots — TOPP holds one (links to /protea);
  the other two are open "Your Business Here · Ask about our rates" cards linking
  to /apply. TOPP's product catalog is left intact — it's now framed as a sponsor,
  not the store.

### Changed
- **Raffle launched with entrant capture** (payment still pending). Church record
  corrected to **Keaukaha, Hilo** — admin office 67 Keokea Loop, Sunday services
  at Keaukaha Elementary Cafeteria (240 Desha Ave), (808) 933-4463,
  halepulekeolahou@gmail.com. The $1 payment method is still TBD (Shopify vs
  church P2P) — until set, the page records entrants and says the church follows up.

---

## [Unreleased] — Community raffle / donation drawing (2026-07-25)

### Added
- **`raffles` + `raffle_entries` tables** (`docs/migrations/phase-4-11-*.sql`):
  a monthly community drawing. Platform holds no funds — a $1 entry deep-links
  to the org's own Venmo/PayPal/Cash App (vendor-payment model). Entrants are
  recorded; PII is insert-only for the public, admin-read only (RLS). Anon
  insert verified.
- **`/raffle` page** (`src/pages/Raffle.tsx`): reads the active raffle, shows
  prize/draw date, captures entrant name/email/phone, then presents the $1
  donation link. Framed as a "$1 donation entry · monthly thank-you drawing."
- Seeded the **Ekalesia Hoʻole Pope o Kekaha** (Kekaha, Kauaʻi) raffle + a
  homepage promo linking to it. `Raffle` type added.
- **Admin Dashboard → Raffles tab**: per-raffle entrant table (name/email/phone),
  live entry count, and a **Draw Winner** button (random pick, shows the winner's
  contact). Entrant reads use the admin's authenticated session per RLS.

### Pending before launch (NOT yet merged to production)
- Church **payment handle + method** (Venmo/PayPal/Cash App) to enable the $1 link.
- **Prize + draw date**; confirm the **legal framing** (HI raffle rules).

---

## [Unreleased] — Vendor contact fields + real Ala's / KaRas info (2026-07-25)

### Added
- Vendor **phone, contact_email, facebook_url, instagram_url** fields
  (`docs/migrations/phase-4-9-*.sql`, `phase-4-10-*.sql`). `email` stays the
  auth login identity — public contact lives in the new columns.
- **Storefront** now shows the vendor description + a contact row (tap-to-call
  phone, email, Instagram, Facebook).
- **Vendor Dashboard → Profile** lets vendors edit phone, contact email, and
  Instagram/Facebook URLs.

### Changed
- **Ala's Kitchen** populated with real info: "Serving up deliciously created
  grinds… the famous Smash Burgers. Pacific Islander-owned." · (808) 289-0328 ·
  chefalamaui@mail.com · Facebook · address 16-1668 Keaau-Pāhoa Rd, Keaʻau, HI
  96749. Featured-card copy + badges updated.
- **KaRas Freshly Baked** Instagram wired: instagram.com/karasfreshlybaked.

---

## [Unreleased] — EijaHu gallery rehosted into Supabase (2026-07-25)

### Changed
- **EijaHu Blissings images rehosted** off the partner's wsimg CDN into our own
  `vendor-assets` bucket (`partners/eijahu-blissings/*`). The Blissings page hero
  + gallery and the marketplace featured-card banner now serve from Supabase —
  no external hotlink dependency. Done via a one-off `rehost-eija-gallery` edge
  function (runs in Supabase infra, which can reach wsimg; writes with the
  service role). pg_net enabled to trigger it.
- Follow-up: the `rehost-eija-gallery` edge function can be deleted from the
  Supabase dashboard now that the copy is complete.

---

## [Unreleased] — Image uploads fixed + vendor photo gallery (2026-07-25)

### Fixed — image uploads were completely broken
- **The `vendor-assets` storage bucket never existed** — every upload (vendor
  logo, banner, menu photos, customer review photos) silently failed. Created it
  (public, 5 MB limit, image mime types). `docs/migrations/phase-4-7-*.sql`.
- **The storage write RLS was buggy** — it split the vendor's *name* instead of
  the object *path* and keyed on `auth.email()`, so the check was always false
  (uploads denied even with a bucket). Repaired to match on the path's first
  segment (`{vendor_id}/…`) and `vendors.user_id = auth.uid()` per the project
  rule. Added a `delete` policy (own assets) and a constrained anon policy for
  review-photo uploads (reviews/ subfolder only).

### Added — vendor photo gallery (multi-image)
- **`public.vendor_photos`** table + RLS (`docs/migrations/phase-4-8-*.sql`):
  public read, vendor manages own; added to realtime.
- **Vendor Dashboard → Gallery tab** — multi-file upload (compressed to webp,
  stored at `{vendor_id}/gallery/*.webp`), thumbnail grid, one-tap remove.
- **Storefront** shows a Photos section + bottom-nav link when a vendor has
  gallery photos.
- `VendorPhoto` type added.

---

## [Unreleased] — EijaHu Blissings partner page (2026-07-24)

### Added
- **`/blissings` route + `src/pages/Blissings.tsx`** — partner page for EijaHu
  Blissings (Eija & Sanoi, ceremonial handpoke tatu). Hero, their story,
  the three-day ceremony, testimonies, a work gallery, and an "Answer the Call"
  connect CTA. Content and imagery are the partner's own; brand voice/spelling
  preserved. Scoped `.bliss-*` styles in an earthy ceremonial palette.
- **Featured card** for EijaHu Blissings in the Wellness (Healing Arts) category.
- `FeaturedVendor.routeTo` — optional internal app route for featured cards
  (takes precedence over `menuSlug`/`shopUrl`); `FeaturedVendorCard` renders it
  as an in-app link.

---

## [Unreleased] — protea.khpa.io hub + Field Report freemium gate (2026-07-23)

### Added
- **`/protea` route + `src/pages/Protea.tsx`** — the TOPP · Ohana Bloom hub for
  protea.khpa.io. Freemium structure:
  - **Public, no login:** the three LIVE Ohana Bloom weekly tiers (Counter $42,
    Ohana Home $48, Statement $88 — real Shopify checkout) + a minimal set of the
    print archive (first 6 prints, individually buyable at $4.99).
  - **Greyed / locked:** the rest of the 35-print archive shows a grayscale-blur
    lock overlay, gated behind membership.
  - **The unlock:** "The Field Report — $4.99/mo" newsletter membership with an
    email join (waitlist + presentation-only unlock via `localStorage`).
- Scoped `.protea-*` styles in `index.css` (TOPP archival aesthetic: lava
  masthead, Georgia serif, Courier data, blush/gold/leaf accents).
- Three analytics events: `protea_tier_reserve`, `protea_print_buy`,
  `field_report_join`.

### Notes / remaining wiring
- Membership entitlement is **presentation-only** — real high-res files are
  delivered by Sky Pilot after Shopify purchase, so the grey-out exposes nothing.
  Flip `isMember` to a real check once the Shopify $4.99/mo subscription product
  and auth entitlement exist.
- The app uses HashRouter; the page lives at `/#/protea`. Pointing the
  protea.khpa.io apex at this page is a deploy step (redirect / dedicated build).

---

## [Unreleased] — TOPP flower outreach kit (2026-07-23)

### Added
- **`docs/TOPP_OUTREACH_KIT.md`** — florist/hotel/restaurant wholesale outreach
  kit for TOPP's Ohana Bloom weekly Puna protea harvest. Grounded in the real
  operating numbers (~50 stems/week, Friday same-day, Hilo/Puna core, 1-week
  lead, ~$1–1.4k/mo honest ceiling). Three supply tiers (Counter $42 / Lobby $88
  / House Account). Tailored, per-venue pitches for six named Hilo targets:
  hotels (SCP Hilo, Inn at Kulaniapia Falls, Grand Naniloa) and farm-to-table
  restaurants (Lehua, Moon and Turtle, Seaside). Ranked approach order + the
  free-sample-bunch close. Companion one-page supply sheet published as an
  Artifact (TOPP archival aesthetic).
- Strategy note: premium-and-scarce, one account at a time — scarcity is the
  pitch. Supply sheet + all six pitches finalized with real contact
  (Ken B. · (808) 333-3147 · khparelations@gmail.com) — kit is send-ready.

---

## [Unreleased] — Rebrand: The Kingdom Emporium (2026-07-21)

### Changed
- Official name is now **The Kingdom Emporium**; **Local Grindz** kept as the
  colloquial nickname. Updated across user-facing app surfaces: page headers,
  landing hero (shows "a.k.a. Local Grindz"), footers, referral copy, vendor
  dashboard copy, `index.html` title/OG/Twitter/JSON-LD (`alternateName`),
  `manifest.json` (PWA name), `404.html`. Storefront doc-title + meta updated.
- Docs, SQL, and legacy static files retain "Local Grindz" (non-user-facing).

---


## [Unreleased] — Bug-fix + polish pass: Maya / Leilani / Sage (2026-07-21)

### Fixed — live updates were completely dead (Maya + Leilani)
- **`supabase_realtime` publication was EMPTY.** The customer order-tracking page
  promised "🔴 updates live — no refresh needed" but never moved, and vendors
  never saw new orders without refreshing. Published `orders` + set replica
  identity full. Live order flow now works both directions.

### Fixed — customer payment signal was a silent no-op (Maya)
- "I've sent the payment" wrote an anon UPDATE that RLS denied → vendor never saw
  it. Added narrow security-definer RPC `mark_order_payment_sent` (unpaid→marked_paid
  only); client now calls it. Vendor "Confirm Received" remains the billing truth.

### Improved — discoverability (Sage)
- `index.html`: broadened title/description/keywords to the real marketplace
  (food trucks, bakery, wellness, flowers/protea, fruit, markets, makers);
  added canonical URL, `og:url`, and WebSite/Organization JSON-LD structured data.

### Findings (flagged, not silently fixed)
- **`vendor_messages` table does not exist** on the live DB (Phase 4L never applied)
  → vendor↔customer chat/inbox is entirely non-functional. Re-apply
  `docs/migrations/phase-4l-messaging.sql` before relying on that feature.
- HashRouter (`/#/`) limits deep-link SEO for vendor pages — architectural, deferred.
- No `og:image` — needs a real marketplace/Sunday Funday hero photo (owner input).

---

## [Unreleased] — Phase 4.4: Guest Checkout Fixed (found via KaRas order test) (2026-07-21)

Ran a full end-to-end order test as KaRas. Guest checkout was **completely broken**
in production — two more drift/config bugs, now fixed and verified live:

### Fixed (live DB)
- **`orders` was missing the Phase 4C lifecycle columns** (`customer_email`,
  `accepted_at`, `ready_at`, `completed_at`, `estimated_minutes`,
  `cancellation_reason`). Any checkout submitting an email errored. Columns added.
- **Guests couldn't place or track orders.** `insert().select('id')` and the
  order-tracking read both need anon SELECT on the returned row; only a
  vendor-scoped SELECT policy existed → every guest order failed. Added
  `public read order by link` (order ids are unguessable bearer links).

### Verified end-to-end (roles simulated at the DB)
guest insert+read → vendor accept (status/ETA) → vendor confirm payment →
EOM statement reflects confirmed prepaid volume. Test orders cleaned up after.

### Known follow-up
- `using(true)` allows anon table enumeration — harden with a security-definer
  `place_order()/get_order(id)` RPC pair post-launch.
- Customer "I've sent the payment" (anon UPDATE) still no-ops; vendor confirm is
  the billing source of truth.

---

## [Unreleased] — Phase 4.3: KaRas Onboarding + RLS Drift Fixes (2026-07-21)

### Fixed (live DB — schema drift discovered during KaRas onboarding)
- **`vendors.user_id` never existed on the live table** despite app code + storage
  RLS referencing it. Added + backfilled by email (`docs/migrations/phase-4-3-*`).
- **`orders` had RLS on with no UPDATE policy** — vendor status changes
  (accept/preparing/ready/cancel) and Phase 4.2 payment confirm were being
  silently denied. Added `vendor update own orders`.
- Added `vendor update own` on `vendors` so the profile + payment-methods forms
  actually persist (previously SELECT-only → denied on save).

### Added
- KaRas Freshly Baked vendor login provisioned against the live project
  (auth user + identity, email-confirmed, linked to the seeded vendor row).
  Full chain verified: login → vendor match → 7 menu items, 1 location.

### Known follow-up
- Customer "I've sent the payment" writes as anon with no UPDATE policy → only
  flips local UI; vendor "Confirm Received" (billing source of truth) works.

---

## [Unreleased] — Phase 4.2: Vendor Payments, Receipts, EOM Statements (2026-07-21)

### Added
- **Prepay via the vendor's own PayPal / Venmo / Cash App** — platform never holds
  funds. Checkout gains a payment selector (built from the vendor's configured
  handles; cash always available); order tracking shows a prefilled deep-link pay
  button + "I've sent the payment"; vendors confirm receipt on the order card
- **Receipts**: order tracking page now shows date, method, payment state, and a
  Print/Save Receipt button (print stylesheet strips buttons)
- **EOM statements**: `vendor_monthly_statements` view — 5% fee on confirmed
  prepaid volume above $500/month; new Billing tab in the vendor dashboard shows
  12 months (cash + first $500/month always free; nothing charged automatically)
- **One-tap OPEN/CLOSED toggle** at the top of the Location tab
- **"Save as a new location"** checkbox — moves the truck while keeping location
  history intact
- Payment Methods form in Profile tab (PayPal.Me / Venmo / $cashtag + preferred)
- Migration `phase_4_2_vendor_payments` **applied to live DB**: vendor handle
  columns, order payment_method/payment_status/payment_ref, statements view
  (security_invoker)

### Notes
- Handles are cleaned client-side (strips @, $, pasted URLs)
- Payment deep links: paypal.me/{handle}/{amt}, account.venmo.com/pay?recipients=…,
  cash.app/${handle}/{amt} — note includes the short order ID for reconciliation

---

## [Unreleased] — Phase 4.1: KaRas Freshly Baked + Golden Shot (2026-07-21)

### Added
- Featured vendors in `marketplace.ts`: Ala's Kitchen — Get Smashed (food truck,
  lava-red theme), KaRas Freshly Baked (bakery, cream/gold/volcanic theme),
  Golden Shot (wellness, gold/amber/tropical-green theme) — all with themed
  gradient banners + emoji identity until photography exists (no fake photos)
- Featured Vendors section moved directly below the hero, 4 cards in a grid,
  each with logo/banner, category label, rating line, badges, View Menu button
- `PromoRotator` — rotating homepage promos (Fresh Bread Today / Golden Shot
  Special / Get Smashed Burger of the Day), 6s cycle, reduced-motion aware
- Navigation updated: Home · Food Trucks · Bakery · Wellness · Flowers · Fruit ·
  Markets · Featured · Events · Profile (restaurants kept as alias)
- Categories: bakery + wellness added to marketplace category model
- `docs/migrations/phase-4-1-seed-vendors.sql` — idempotent seed: 3 vendors,
  locations, 16 menu items (incl. sold-out example for the indicator),
  3 specials feeding the promos, vendor_features rows for featured placement

### Blocked
- **Supabase project is INACTIVE (auto-paused)** — live site's DB features are
  down; restore was denied by session permissions. Owner: approve restore or
  un-pause in the Supabase dashboard, then apply the Phase 4.1 seed migration.

### Preserved
- Auth, vendor/admin dashboards, loyalty, reviews, QR ordering, offline support,
  GitHub Pages build — no existing functionality removed; vendor profile
  features (cover, gallery, hours, reviews, specials, loyalty, order-ahead)
  come from the existing Storefront machinery once vendors are seeded

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
