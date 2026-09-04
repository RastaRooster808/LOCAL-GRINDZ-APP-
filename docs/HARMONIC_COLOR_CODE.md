# Harmonic colour code — derived, not assigned

A carrier's colour is **calculated** from where its harmonic actually falls.
Nothing here invents a colour: `src/lib/harmonics.ts` remains the only thing
that turns a number into one, and `src/lib/carrierColor.ts` only decides what to
ask it for.

## The rule

**Hue = pitch class.** Harmonic *k* sits log₂(*k*) octaves above the
fundamental, so the fractional part of log₂(*k*) is its position within the
octave. Hue follows that fraction around the wheel.

**Lightness = octave.** ⌊log₂(*k*)⌋, spread across the engine's
`LIGHTNESS_BAND`. The same rule the colour piano already uses.

**Chroma = whatever fits.** `oklch()` reduces chroma by binary search until the
colour is inside sRGB, so hue and lightness survive and only saturation gives
way.

## What follows from it

H1, H2, H4, H8, H16, H32 and H64 are **the same note, seven octaves apart.**
They therefore share one hue and separate by lightness:

| carrier | octave | hue | colour |
|---|---|---|---|
| H1 | 0 | 0° | `#fe0087` |
| H2 | 1 | 0° | `#fe1f96` |
| H8 | 3 | 0° | `#ff5eb4` |
| H64 | 6 | 0° | `#ffb2d8` |

Any scheme that gives those seven four *different* colours is bucketing by
index and calling the result harmonic. The families that fall out are the
intervals themselves:

| hue | carriers | interval |
|---|---|---|
| 0° | H1, H2, H4, H8, H16, H32, H64 | the fundamental |
| 211° | H3, H6, H12, H24, H48 | the perfect fifth |
| 116° | H5, H10, H20, H40 | the major third |
| 291° | H7, H14, H28, H56 | the harmonic seventh |

## True ratios, not equal temperament

Frequencies come from the real harmonic series, so the hues are as out of tune
with a piano as the series genuinely is. H3 is 702 cents, not 700. H7 lands 31
cents flat of the tempered minor seventh. H11 is 48.7 cents off — the "alphorn
fa", sitting almost exactly between F and F♯, which is why it sounds wrong on a
keyboard and right on a bugle.

The `centsFromEqual` field carries that offset per carrier, so the palette can
show where the harmonic series and the twelve-tone grid disagree rather than
papering over it.

## Files

| file | what it is |
|---|---|
| `docs/carrier-palette-64.json` | every carrier: frequency, octave, cents, hue, OKLCH, hex |
| `docs/carrier-palette-64.css` | `--carrier-1` … `--carrier-64` custom properties |
| `docs/carrier-palette-64.svg` | the 8×8 grid and interval legend, for dropping into a diagram |

Regenerate against a different fundamental or carrier count by calling
`carrierPalette(count, fundamentalHz)`.

## Why it matters here

The Blazek Grid v4 diagram assigns colour in four index blocks — H1–H8 cyan,
H9–H16 green, H17–H32 yellow, H33–H64 magenta. Under that scheme the seven
octaves of the fundamental land in all four blocks, and H3/H6/H12/H24/H48 — one
pitch class — take three different colours. The mapping is positional.

Deriving it instead costs nothing and makes the picture say something true: two
carriers share a colour exactly when they are the same note.
