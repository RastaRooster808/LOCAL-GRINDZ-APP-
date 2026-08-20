# Smart Piano — chord wheel module

A touch-responsive chord instrument at **`/piano`**. Eight chord columns, each
split into a **bass head** and a **chord body**, with computed velocity, a
velocity-layered sample engine, and four autoplay patterns locked to the project
tempo.

It is deliberately **separate from Kula Mele**: that is a 13-letter Hawaiian
cipher, this is a Western diatonic chord set. They share no state.

## Layout

| | |
|:--|:--|
| Columns | `Em Am Dm G C F B♭ B°` |
| Bass head (top) | the root alone, **C1–C2** |
| Chord body (bottom) | the full triad, **C3–C5** |

Each voice is lifted into its register rather than stacked blindly, so a chord
never drifts out of the band. Verified: every column's bass lands in 24–36 with
the correct pitch class, and every body lands in 48–72 as three notes.

## Velocity — computed, not sensed

A flat screen has no key sensor, so velocity comes from the tap:

- **Position is primary.** Top of the strip = **40**, bottom = **120**, linear
  between. Monotonic across the whole strip.
- **Pressure or contact size modulates it**, where the device reports them
  (`PointerEvent.pressure`, or `width`/`height` as a contact patch). A firm tap
  high on the strip is still louder than a light one, without position losing
  meaning.
- A reported radius **at or below `MIN_REAL_RADIUS` (2px) is ignored** — a mouse
  reports `width: 1`, which is a default rather than a measurement. Reading it as
  a feather touch subtracted 15 from every desktop hit and made the specified
  floor of 40 unreachable.

Velocity is always clamped to MIDI 1–127.

## Velocity → DSP

| mapping | formula |
|:--|:--|
| Gain | `(velocity / 127)²` — exponential, so loudness tracks hearing |
| Filter cutoff | `500 Hz → 9 kHz`, exponential — harder hits are brighter |
| Layer | 4 layers, `floor(v / 128 × 4)` |

Measured in the browser: taps at the top, middle and bottom of a strip gave
velocity **42 / 80 / 118** and output peaks **0.092 / 0.347 / 0.804** — an 8.8×
amplitude span where a linear mapping would give 2.8×.

## Audio engine

The chain is exactly `AudioBufferSourceNode → BiquadFilter (lowpass) → GainNode
→ master`.

**On samples:** this repository ships no recorded piano library, so the four
velocity layers are **rendered into real `AudioBuffer`s at start-up** by additive
synthesis — harder layers carry more upper partials and a faster strike, as
louder recordings of a real instrument do. Everything downstream is genuine
sample playback: pitch comes from `playbackRate` **resampling**
(`2^(semitones/12)`), not oscillator tuning. Dropping in an SFZ set means
replacing `renderLayer()` alone; nothing else changes.

**Sustain** overrides the release phase — with it on, `noteOff` leaves the sample
to decay on its own, and lifting the pedal releases everything still ringing.

**Polyphony** is capped at **32 voices**, stealing the **quietest** voice and
breaking ties by **oldest**, so a steal is the least audible one available.

## Autoplay

A dial of **off / 1 / 2 / 3 / 4**. Patterns are written against *voice indices*
(`-1` = bass, `0..n` = chord tones), so a pattern is chord-agnostic and
transposes itself. A 25 ms scheduler tick schedules ahead of a 120 ms horizon —
far finer than a sixteenth at any usable tempo.

**Tapping a new chord does not interrupt the loop.** The switch is queued to the
next **bar** boundary via `nextBoundary()`, which never returns a time in the
past. Verified in-browser: tapping mid-loop marked the column *pending*, the
active chord stayed put, and it changed on the boundary.

## Event payload

```ts
{ chord: "C", zone: "CHORD_BODY", yOffsetNormalized: 0.85, sustainActive: true, autoplayState: 0 }
```

`src/lib/smartPiano.ts` holds every decision as pure arithmetic — voicings,
velocity, the DSP mappings, patterns, boundaries and voice stealing — so the
engine's behaviour is proven without a browser and the audio layer stays a thin
shell over it.
