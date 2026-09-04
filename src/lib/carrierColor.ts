/*
 * Carrier → colour, derived from the harmonic series.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// The colour of carrier k is not assigned, it is CALCULATED — from where that
// harmonic actually falls, using the same OKLCH engine that colours the Kula
// Mele keys. Nothing here invents a colour; src/lib/harmonics.ts remains the
// only thing that turns a number into one.
//
// Two rules, and they follow from what a harmonic series is:
//
//   HUE      = pitch class. Harmonic k sits log2(k) octaves above the
//              fundamental, so the fractional part of log2(k) is its position
//              within the octave. H1, H2, H4, H8, H16, H32, H64 are the SAME
//              NOTE seven octaves apart and therefore share one hue. Any scheme
//              that gives them four different colours is bucketing by index and
//              calling it harmonic.
//
//   LIGHTNESS = octave. floor(log2(k)), spread across the engine's lightness
//              band, so octave-related carriers read as one family that climbs
//              rather than as one flat colour. This is the same lightness →
//              octave rule the colour piano already uses.
//
// Frequencies come from the TRUE ratios, not equal temperament: H3 is 702
// cents, not 700; H7 is 969, a full 31 cents flat of the tempered minor
// seventh. Hue follows the real interval, so the palette is as out-of-tune with
// the piano as the harmonic series genuinely is.

import { LIGHTNESS_BAND, oklch, type OkColor } from './harmonics';

/** Chroma to probe with; oklch() reduces it until the colour fits the gamut. */
const CHROMA_PROBE = 0.4;

export interface CarrierColor {
  /** Harmonic number, 1-based: carrier k sits at k × f0. */
  harmonic: number;
  frequencyHz: number;
  /** Whole octaves above the fundamental. */
  octave: number;
  /** Position within the octave, in cents (0–1200). */
  pitchClassCents: number;
  /** The equal-tempered note this lands nearest, 0 = the fundamental's class. */
  nearestSemitone: number;
  /** How far the true harmonic sits from that tempered note. H7 is −31. */
  centsFromEqual: number;
  hue: number;
  color: OkColor;
}

/** Where harmonic k falls, and what colour that makes. */
export function carrierColor(harmonic: number, fundamentalHz: number, octaveSpan = 6): CarrierColor {
  if (!Number.isInteger(harmonic) || harmonic < 1) {
    throw new Error(`harmonic must be a positive integer, got ${harmonic}`);
  }
  const octaves = Math.log2(harmonic);
  const octave = Math.floor(octaves);
  const within = octaves - octave;                       // 0 … 1
  const pitchClassCents = within * 1200;
  const hue = within * 360;

  const nearestSemitone = Math.round(pitchClassCents / 100) % 12;
  const centsFromEqual = pitchClassCents - Math.round(pitchClassCents / 100) * 100;

  // Lightness climbs with octave, across the band the rest of the app uses.
  const [lo, hi] = LIGHTNESS_BAND;
  const t = octaveSpan > 0 ? Math.min(1, octave / octaveSpan) : 0;
  const L = lo + (hi - lo) * t;

  return {
    harmonic,
    frequencyHz: harmonic * fundamentalHz,
    octave,
    pitchClassCents: +pitchClassCents.toFixed(2),
    nearestSemitone,
    centsFromEqual: +centsFromEqual.toFixed(2),
    hue: +hue.toFixed(2),
    color: oklch(L, CHROMA_PROBE, hue),
  };
}

/** The whole carrier set, H1 … HN. */
export function carrierPalette(count: number, fundamentalHz: number): CarrierColor[] {
  const span = Math.floor(Math.log2(Math.max(1, count)));
  return Array.from({ length: count }, (_, i) => carrierColor(i + 1, fundamentalHz, span));
}

/** Carriers grouped by the hue they share — i.e. by pitch class. Octave
 *  relatives land together, which is the check that the mapping is harmonic
 *  rather than positional. */
export function byPitchClass(palette: CarrierColor[]): Map<string, number[]> {
  const groups = new Map<string, number[]>();
  for (const c of palette) {
    const key = c.hue.toFixed(1);
    groups.set(key, [...(groups.get(key) ?? []), c.harmonic]);
  }
  return groups;
}

/** CSS custom properties, for dropping the palette straight into a diagram. */
export function paletteCss(palette: CarrierColor[], prefix = 'carrier'): string {
  const lines = palette.map(c =>
    `  --${prefix}-${c.harmonic}: ${c.color.hex};   /* H${c.harmonic} · ${c.frequencyHz.toFixed(0)}Hz · oct ${c.octave} · hue ${c.hue.toFixed(0)}° */`);
  return `:root {\n${lines.join('\n')}\n}\n`;
}
