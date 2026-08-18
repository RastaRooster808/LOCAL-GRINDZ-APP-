# Kula Mele — the Color Piano (13 Hawaiian letters)

The "piano made of color": the **full Hawaiian alphabet** — 5 vowels
(A E I O U) + 7 consonants (H K L M N P W) + the **ʻokina** = **13 keys**. Pitches
are a rising C-major run (C4→A5) so any Hawaiian word sounds musical; the colors
are one **continuous rainbow** — hue = `i / 13 · 360`, so the keyboard reads as a
single flowing world of light rather than discrete blocks.

**Source of truth: `src/lib/harmonics.ts`.** Nothing else computes a frequency or
a colour — see *The harmonic engine* below. Frequencies are equal temperament at
full double precision; the column here is rounded for reading only.

| Slot | Letter | Note | Freq (Hz, displayed) | Colour | L | C |
|:----:|:------:|:----:|:---------------------|:-------|--:|--:|
| 0 | A | C4 | 261.63 | #fe0087 | 0.645 | 0.262 |
| 1 | E | D4 | 293.66 | #ff0719 | 0.630 | 0.255 |
| 2 | I | E4 | 329.63 | #ff8500 | 0.740 | 0.183 |
| 3 | O | F4 | 349.23 | #febd00 | 0.835 | 0.172 |
| 4 | U | G4 | 392.00 | #d8db00 | 0.860 | 0.189 |
| 5 | H | A4 | 440.00 | #63f700 | 0.860 | 0.268 |
| 6 | K | B4 | 493.88 | #00f5b6 | 0.860 | 0.178 |
| 7 | L | C5 | 523.25 | #00eeed | 0.860 | 0.147 |
| 8 | M | D5 | 587.33 | #00d0fe | 0.795 | 0.146 |
| 9 | N | E5 | 659.26 | #0097fe | 0.665 | 0.185 |
| 10 | P | F5 | 698.46 | #6567ff | 0.600 | 0.220 |
| 11 | W | G5 | 783.99 | #a735ff | 0.600 | 0.274 |
| 12 | ʻokina | A5 | 880.00 | #fe00ec | 0.690 | 0.311 |

Mean chroma **0.215**. Lightness roams within **[0.60, 0.86]** by design — see
*The harmonic engine*: holding L constant capped chroma at whatever the worst hue
allowed (~0.15) and forced yellow into olive, so each hue is instead taken to its
most colourful point inside that band.

## The full alphabet (12 + ʻokina)

The Hawaiian alphabet is 12 letters — 5 vowels (A E I O U) + 7 consonants
(H K L M N P W) — plus the **ʻokina** (glottal stop), here the 13th key and a
bright top note. Spelling **strips kahakō** (macron) to the base vowel and folds
any apostrophe form (`'` `‘` `’` `` ` ``) to the ʻokina key, so `ʻāina` → `ʻAINA`
and `wai` → `WAI` map cleanly. Any unsupported character is ignored.

## Signature song → sign-in

A chosen Hawaiian word becomes a sequence of color-notes — the player's
**signature song**. Reproducing it (by tapping the keys, or singing into the mic)
lights them in.

### The tuner's face — the Flower

The tuner's centrepiece is the sacred geometry itself. The **Fruit of Life is
exactly thirteen circles** — one centre, a ring of six, an outer ring of six —
which is a one-to-one seat for each Hawaiian key (slot 0 = centre, 1–6 = inner
ring, 7–12 = outer ring), drawn over a faint **Flower of Life** lattice (circles
of radius r on a triangular lattice of spacing r, interlacing into petals). It is
the same lattice the Powers of Ten export lands you on.

Sing, and your note's circle **blooms** in its own hue, with an arc reporting the
**cents offset** — green within ±8 cents, gold when sharp or flat, sweeping right
for sharp and left for flat. A ~400 ms hold keeps the bloom from flickering
between breaths. The glow pulse is suppressed under `prefers-reduced-motion`.

**Voice path:** mic audio → **YIN** pitch detector (`detectPitch`: squared
difference function → CMNDF → absolute threshold → parabolic interpolation) →
nearest key within ±130 cents → same match logic as a tap. Validated to resolve
all 11 keys through harmonics + noise.

**Security boundary (important):** a short melody is low-entropy, so the
signature song is an **accessible local unlock** — it opens the player's profile
on the device and lights the screen. It is **not** an account password and must
never be presented as protecting the account from someone else. Real account
security stays with Supabase email magic-link (offered immediately after
lighting in). Front door of color and light; real lock behind it.

## Posters — an output, and an optional creator tool

**An image is never required to reach your space.** The authoritative data is the
mathematically generated spectrum, so the relationship runs one way:

> Identity creates the spectrum. The spectrum creates the scene.
> Hawaiʻi provides the anchor. Unreal provides the cinematic realization.

**Your poster** (`generatePoster`) therefore runs *outwards* — it renders a PNG
**from** your signature's spectrum, laid out as a diagonal progression in the same
language the printed sheets use, captioned with the word and its lattice
coordinates. A keepsake, not an input.

**Reading a printed sheet** is a separate, optional creator tool for turning an
existing poster into notes. It lives behind *Explore → Technical details* and
feeds nothing in the sign-in path.

`src/lib/posterParse.ts` reads a printed colour-code grid (e.g. the "TAS CODE"
poster) off a photo and turns it into notes. It is **pure** — raw RGBA + width and
height in, cells out — so the same code runs in the browser (from a `<canvas>`)
and in headless tests. Decoding and downscaling (max 900 px) happen in the page;
**the image never leaves the device.**

**How detection works.** Printed posters put saturated swatches on white paper, so
the parser builds an "ink" mask (saturation ≥ 0.25, mid lightness) and projects it
onto each axis. Runs above a relative threshold are the swatch **columns** and
**rows** (`inkProfile` → `findBands` → `detectBands`). This is O(w·h), scales to
hundreds of cells, and tolerates uneven spacing — where brute-force grid fitting
would not. `autoGrid` (within-cell variance + an elbow rule) remains the fallback
for gapless grids, and explicit `rows`/`cols` always override.

**Colour → note.** Each cell is sampled on an inset sub-lattice (grid lines and
borders excluded), averaged, and converted to HSL. Then:

- **Hue → key** (nearest of the 13 key hues).
- **Lightness → octave** (`colorToOctave`): `l < 0.38` sings an octave **down**,
  `l > 0.62` an octave **up**, otherwise centre. This is what keeps a deep maroon
  distinct from a bright red — same key, different octave — and it mirrors the
  KullaCoin coin model, where a Kulla is colour + octave + velocity.
- Low-saturation or near-black/near-white cells become **rests**, so white paper
  and pencil handwriting are skipped, not sung.

`PosterRead` therefore carries both `seq` (keys only) and `notes`
(`{slot, octave}` — what the poster actually sounds like). **Signatures stay
octave-less on purpose:** the 13 keys are what a player taps back, and the
keyboard has no octave control, so a poster-derived signature uses `seq`.

**Verified:** twelve inks spanning three lightness bands mapped to **12 distinct
sounding notes** (previously 8 inks collapsed to 7 keys). Three shades of red
became three octaves of A — 130.8 / 261.6 / 523.3 Hz.

**Verified:** on a synthetic 20 × 26 poster with uneven lighting and sensor noise,
band detection recovered the grid exactly and cell→key accuracy was **518/520
(99.6%)**; white paper and pencil grey both read as rests. End-to-end in-browser:
upload → read → 520 cells → play a row → adopt a row as a signature.

**Verified on the real poster.** A hand-held photo of the actual "TAS CODE" sheet
— shot at an angle, paper curled at the top, uneven room light — read as
**20 × 26 (520 swatches)**, matching the printed grid.

This settles an open question. Band projection assumes the grid is roughly
axis-aligned, so a de-skew pass (detect the sheet's corners, rectify, then
project) was held as the likely next step. **It proved unnecessary:** the ink
mask is robust to the skew present in an ordinary phone photo, because a modest
lean shifts a column's pixels without merging it into its neighbour. De-skew
stays unbuilt — revisit it only if a photo genuinely fails, and reach for a
flatter, straight-on shot first.

### Reading direction

A printed grid needn't be read left-to-right, and the TAS CODE poster carries
visible diagonal rainbows. `readLinesDetailed(read, order)` splits the grid four
ways — **`row`**, **`col`**, **`diag-down`** (↘, cells sharing `col − row`) and
**`diag-up`** (↙, sharing `col + row`) — returning each line's notes *and* the
cell indices they came from, so highlighting and playback can't drift apart.

`scoreOrder` / `rankOrders` describe what each direction does, by the mean
circular key-step between neighbours:

| kind | meaning | typical step |
|:--|:--|:--|
| `band` | colour is constant — you're running the length of a stripe | ~0 |
| `run` | a rainbow progression, about a key at a time | ~1 |
| `mixed` | some structure, no clean pattern | ≤2.5 |
| `scatter` | neighbours unrelated | >2.5 |

**A low score is not "the" reading direction.** A step near zero means the colour
never changes along that line — informative, but musically a monotone. Which
direction the author intended as the code is a judgement about the artwork, so
the app reports the shape of all four and lets a person choose.

**Verified:** on a poster printed with colour constant along ↘, the scorer
labelled ↘ a `band` (step 0.00) and rows/columns `run`s (step 1.00); in-browser,
switching direction regave 31 diagonal lines vs 18 rows vs 14 columns with the
highlight following each.

**The real poster reads as a `run` along ↘.** Measured on the actual TAS CODE
sheet: the down-right diagonal is a rainbow progression, roughly a key at a time
— not a stripe. So the poster's melody runs **↘**, and that is the direction to
read it in. The visible diagonal banding is the pattern the eye catches; the
progression underneath it is the music.

## Powers of Ten (Unreal)

The signature page exports a **`user_spectrum.json`** ("Download my spectrum",
shown once a signature exists) that drives the Unreal LevelSequence "Powers of
Ten" zoom — **planet → atmosphere → the individual**. The whole flight is
**anchored on Hawaiʻi (HST)**: everyone shares the same macro planet view over
the Big Island; the signature deterministically fixes one **unique point on the
island** (via an FNV-1a hash of `word:seq`), so the camera flies down to *you*,
somewhere on Hawaiʻi.

**Coordinate frame — Big Island local ENU:** `+X` = East, `+Y` = North, `+Z` =
Up, origin = island centre, **meters × 100 = Unreal cm**. **Hawaiʻi is the
offset** — place the island centre at the Unreal world origin and every
coordinate in the export is measured from it.

That anchor is no longer an unwritten assumption: each export carries an
**`origin`** block naming it (`Hawaiʻi Island (centre)`, lat **19.5949**, lon
**-155.5028**, frame, units), plus **`micro_ground_geo`** giving the person's
point as real **lat / lon / altitude**. A georeferenced scene (e.g. Cesium for
Unreal) can place it directly; a scene with Hawaiʻi at the origin can ignore both
and use the ENU centimetres as before. Verified: six signatures all resolve to
coordinates inside the real island bounds with plausible altitudes. Footprint ≈ **150 km
E-W × 130 km N-S**; `micro_ground` elevation runs **sea level → Mauna Kea summit
(≈4207 m)**. `macro_space` sits ~2000 km straight up (the archipelago/planet
framing); `meso_atmosphere` ~12 km on descent. Tunable constants live in the `HI`
object in `buildSpectrum()`.

**The offset is the harmonic color code — a Flower-of-Life lattice.** Instead of a
random scatter, `micro_ground` snaps to a node of a **Flower-of-Life** triangular
lattice (`FOL_RINGS` rings of overlapping circles) laid over the island. The
signature's own harmonics place it: **average pitch → ring** (higher notes → outer
rings *and* higher ground elevation), **average hue → seat** around that ring. A
small hash jitter keeps colliding words distinct without leaving the node's cell.
So each person lands on one point in a shared "sea of flower of life."

Importer: `tools/unreal/generate_zoom_sequence.py` (run in the Unreal Editor
Python console; set `json_file_path` to the downloaded file).

Schema emitted by `buildSpectrum()` in `SignatureSong.tsx` (Unreal units = cm):

```json
{
  "user_id": "ALOHA_fad07aaf",          // asset-safe → Seq_Zoom_<user_id>
  "signature_word": "ALOHA",
  "generated_at": "…ISO…",
  "spectrum": [ { "letter": "A", "color": "#ff3b6b", "freq": 261.63 }, … ],
  "sequence_settings": { "duration_seconds": 13, "fps": 30 },
  "coordinates": {                                  // Big Island local ENU, cm
    "macro_space":     { "x": 0, "y": 0, "z": 200000000, "pitch": -90, "yaw": … },
    "meso_atmosphere": { "x": …, "y": …, "z": 1200000,   "pitch": -60, "yaw": … },
    "micro_ground":    { "x": …, "y": …, "z": …,         "pitch": -8,  "yaw": … }
  }
}
```

The importer reads `user_id`, `sequence_settings.{duration_seconds,fps}`, and
`coordinates.{macro_space,meso_atmosphere,micro_ground}.{x,y,z,pitch,yaw}`; extra
keys (`spectrum`, `signature_word`, `generated_at`) are ignored, so the contract
can grow without breaking the script.

## The harmonic engine — one source of truth

`src/lib/harmonics.ts` is the only place that decides a frequency, a colour, or a
lattice position. The keyboard, the tuner, the exported scene package and the
Unreal importer all read from it; none of them recompute anything. That is what
stops the browser rendering one colour while Unreal calculates a slightly
different one.

```
identity → canonical characters → harmonic frequency → normalized position
         → OKLCH colour → sRGB → Hawaiʻi lattice anchor
```

**Precision.** Frequencies come from equal temperament (A4 = 440) at full double
precision and are rounded *only at display time*. `A` is
**261.6255653005986**, not `261.63`; `C5 / C4` is exactly `2`. Rounding early is
how two systems drift apart, so the stored value keeps all 16 digits and the UI
formats a copy.

**Colour.** OKLCH at fixed `L = 0.72`, `C = 0.16`, hue = `index / 13 × 360`.
A perceptually uniform space means equal hue steps *look* equal, which an HSL
rainbow does not deliver. Chroma is reduced by binary search only where the sRGB
gamut demands it (7 of the 13 keys), so hue and lightness stay intact and the set
stays even.

**Anchor.** Hawaiʻi is the spatial **origin**, not another colour input: mean
pitch chooses the lattice ring and ground height, mean hue chooses the seat around
it, and a bounded hash jitter separates collisions without letting a signature
leave its cell.

## Two exports, two audiences

| audience | artefact | contains |
|:--|:--|:--|
| the player | their space, on screen | spectrum, placement — no files |
| a creator | `harmonic_scene.json` | nodes, palette, anchor, cameras, lens, cuts, timeline |

The player never downloads, copies, or feeds anything to Python. The creator
artefact is folded behind **Technical details** and is built by the browser in
full — `src/lib/scenePackage.ts` (v2.0). Its sections are named documents in one
file rather than six loose ones: no archive library, nothing arrives
half-copied, and the importer has a single thing to open.

`tools/unreal/import_harmonic_scene.py` consumes it in one call —
`import_harmonic_scene("harmonic_scene.json")` — building cameras, the anchor,
the lens progression, camera cuts and the timeline, then opening the sequence.
It computes nothing itself; it only places what the package already decided.

**Cinematic language**, identical for every identity:

| frame | camera | lens | focus |
|--:|:--|--:|:--|
| 0 | `CAM_Environment` | 24 mm | anchor |
| 120 | `CAM_Anchor` | 35 mm | anchor |
| 240 | `CAM_Lattice` | 50 mm | lattice |
| 360 | `CAM_User` | 85 mm | identity |

## Voice leading — why the sign-in sounds composed

A signature played alone is a row of notes. It is played as **two voices**: the
melody, and a bass line generated beneath it by `src/lib/voiceLeading.ts`. The
bass is not decoration — its motion is constrained by the rules that separate
composed music from arbitrary intervals.

**The hidden (direct) octave.** When the outer voices move in similar motion into
an octave, the ear fills in the leap and hears a parallel octave that was never
written. The generator refuses any bass note that would create it:

| case | verdict |
|:--|:--|
| both outer voices **leap upward** into an octave | **forbidden** — sounds amateurish |
| the motion into the octave is **downward** | allowed — far less noticeable |
| **at least one voice arrives by step** (semitone or whole tone) | allowed |
| contrary or oblique motion | never the fault |

**Parallel perfects.** Consecutive octaves/unisons or fifths in similar motion are
also rejected — two voices holding the same perfect interval stop sounding like
two voices. This was caught by the exhaustive test rather than by inspection: the
first generator audited for parallels but never *prevented* them, and 21 of 2197
three-note melodies came out faulty.

Among legal candidates the cost function prefers **contrary motion**, then a bass
that walks rather than leaps, then staying in register (MIDI 36–57).

**Verified exhaustively**, not by ear alone: every 2-note (169), 3-note (2 197)
and 4-note (28 561) melody in the alphabet, plus 20 000 random 6-note melodies —
**zero** hidden octaves and **zero** parallel perfects. Across the sample words,
motion came out contrary 35 · oblique 5 · similar 1. In-browser the two voices
sum to a peak of 0.21 where the melody alone caps at 0.16, confirming the bass
actually sounds.

## The Phonetic Codex — the direction register

`src/lib/phoneticCodex.ts` implements the spoken layer laid under the score: one
syllable per interval a phrase moves through, so a line can be **called aloud**
as fluently as it is played. Its purpose is live direction — cueing entrances,
redirecting a phrase, flagging hidden notes, without stopping the music.

Three rules, each from a documented mechanism:

1. **Consonant = size of the jump.** Sound symbolism (bouba-kiki) sits mainly in
   consonants. Steps take sonorants (`l`, `n`); leaps take voiceless stops
   (`p`, `k`, `ʻ`).
2. **Vowel = direction.** Ohala's frequency code: ascending takes `i`, descending
   takes `o`.
3. **Long vowel (kahakō) = an implied tone.** Per the auditory continuity
   illusion, a hidden note is flagged by lengthening the vowel on the syllable
   **before** it — `calls[k-2]` for a hidden note `k`, since a call lands on the
   note *after* the one it starts from.

| Interval | Size | Asc | Desc |
|:--|:--|:--|:--|
| Unison | sustain | a | a |
| m2 | step | li | lo |
| M2 | step | ni | no |
| m3 | small leap | mi | mo |
| M3 | small leap | wi | wo |
| P4 | small leap | hi | ho |
| P5 | large leap | pi | po |
| m6 / M6 | large leap | ki | ko |
| Octave | largest leap | ʻi | ʻo |

**Rule 4 — a trailing ʻokina = one semitone larger.** The first version of the
codex defined 0–5, 7–9 and 12 semitones and left the tritone and both sevenths
undefined; measured against this alphabet, **18 of 169 ordered letter pairs
(10.7%)** landed there. The revised codex closes that with a syllable-final
glottal catch, placed *after* the vowel — distinct from the octave's leading
ʻokina:

| Interval | Syllable | Reading |
|:--|:--|:--|
| Tritone (6) | `hiʻ` / `hoʻ` | P4's breath, caught short of P5 |
| m7 (10) | `kiʻ` / `koʻ` | the leap consonant, caught short of the octave |
| M7 (11) | `piʻ` / `poʻ` | one half-step shy of arrival |

The word bank is now **complete across 0–12**: nothing falls back on a nearest
approximation, and the `approximate` flag no longer fires for any interval in the
alphabet. `MELE` went from `ʻo-ki-ko` *(2 approximated)* to exactly `ʻo-kiʻ-koʻ`.

Rules 3 and 4 are independent — one is vowel length, the other a coda consonant —
so both can sit on one syllable: a tritone into an implied note is **`hīʻ`**. This
required fixing `lengthen` to target the *vowel* rather than the final character,
which a coda syllable no longer ends with.

## Sound, word, light — one chain

The two systems draw on the **same thirteen letters, with no orphans on either
side**, so a spoken syllable is not merely a label for a motion — it is itself a
Hawaiian word fragment, and every letter in it already owns a pitch and a hue:

```
motion  →  syllable  →  letters  →  colours + pitches
(sound)    (sound)      (word)      (light)
```

`syllableLight()` resolves any syllable through the harmonic engine, so `li`
lights as L·I, `hoʻ` as H·O·ʻ, and `hīʻ` as H·I·ʻ — kahakō folding to its base
vowel and the glottal catch resolving to the ʻokina key. The colours are **not a
second table**: they come from the same engine that lights the keyboard, verified
by asserting `syllableLight('li')[0].hex` equals the L key's own hex. Every
syllable in the bank is spellable in Kula Mele — **zero orphans**.

### Two registers, never one

Kula Mele is an **absolute cipher** — a letter is always the same fixed pitch.
The codex is a **relative protocol** — a syllable describes motion from whatever
note is already sounding. Spoken `po` means *leap down*, while the letters P and O
in Kula Mele are two unrelated fixed pitches. Same sounds, opposite grammars.

They are therefore kept in separate performance moments, and the codex call is
**not shown on the sign-in path at all** — it lives behind *Explore*. Every
signature closes on the **ʻokina stop** before the first call; that glottal break
is the ensemble's cue that identity mode has ended and direction mode begun.

**Safety, carried over from the source document:** a signature used to sign in is
a credential. It should not be called aloud in a public set, and a performance
word should differ from a sign-in word. The app states this in the codex panel.
