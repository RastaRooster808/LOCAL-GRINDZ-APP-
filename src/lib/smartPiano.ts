/*
 * Smart Piano — pure playing logic.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// Everything here is a plain function of its inputs: no AudioContext, no DOM.
// That is deliberate — this is the half that can be tested in Node, so the
// half that touches Web Audio can stay thin enough to read in one sitting.

// ── Velocity ────────────────────────────────────────────────────────────────
/** Striking the top of a key is soft; the bottom is hard. */
export const V_TOP = 40;
export const V_BOTTOM = 120;

/** A pointer that reports a radius at or below this is telling us nothing —
 *  a mouse reports width 1 always. Treat it as "no reading", not "feather
 *  touch", or every desktop tap gets silently quietened. */
export const MIN_REAL_RADIUS = 2;

/** How much a broad fingertip may add to, or a pinpoint subtract from, the
 *  velocity the key position alone implies. */
export const RADIUS_SWING = 15;
/** Contact radius, in CSS px, treated as neutral — neither broad nor pointed. */
export const NEUTRAL_RADIUS = 12;
/** Radius beyond which extra contact stops adding force. */
export const BROAD_RADIUS = 30;

export function clamp(value: number, low: number, high: number): number {
  return value < low ? low : value > high ? high : value;
}

export interface TouchReading {
  /** 0 at the top edge of the key, 1 at the bottom edge. */
  yOffsetNormalized: number;
  /** Contact radius in CSS px, if the pointer reports one. */
  radius?: number;
  /** Pointer pressure, 0–1. Only trusted when the device actually measures it. */
  pressure?: number;
  /** True when `pressure` came from real hardware rather than the 0.5 default. */
  hasPressure?: boolean;
}

/** Key position sets the velocity; contact radius nudges it; real pressure,
 *  where a device reports it, overrides both because it is a direct reading. */
export function velocityFromTouch(t: TouchReading): number {
  const y = clamp(t.yOffsetNormalized, 0, 1);
  let velocity = V_TOP + (V_BOTTOM - V_TOP) * y;

  if (typeof t.radius === 'number' && t.radius > MIN_REAL_RADIUS) {
    const r = clamp(t.radius, 0, BROAD_RADIUS);
    velocity += ((r - NEUTRAL_RADIUS) / (BROAD_RADIUS - NEUTRAL_RADIUS)) * RADIUS_SWING;
  }

  if (t.hasPressure && typeof t.pressure === 'number') {
    velocity = V_TOP + (V_BOTTOM - V_TOP) * clamp(t.pressure, 0, 1);
  }

  return Math.round(clamp(velocity, 1, 127));
}

// ── Velocity → sound ────────────────────────────────────────────────────────
/** Perceived loudness is closer to the square of the amplitude ratio than to
 *  the ratio itself, so a linear velocity maps to a squared gain. */
export function gainFor(velocity: number): number {
  const x = clamp(velocity, 0, 127) / 127;
  return x * x;
}

export const CUTOFF_MIN_HZ = 500;
export const CUTOFF_MAX_HZ = 9000;

/** A hard strike opens the instrument up. Exponential, because pitch and
 *  brightness are both heard logarithmically. */
export function cutoffFor(velocity: number): number {
  const x = clamp(velocity, 0, 127) / 127;
  return CUTOFF_MIN_HZ * Math.pow(CUTOFF_MAX_HZ / CUTOFF_MIN_HZ, x);
}

/** Resampling ratio to stretch a sample recorded at `root` up or down to
 *  `target`. Equal temperament, full precision — see src/lib/harmonics.ts. */
export function playbackRate(target: number, root: number): number {
  return Math.pow(2, (target - root) / 12);
}

// ── The chord wheel ─────────────────────────────────────────────────────────
export const BASS_LOW = 24;
export const BASS_HIGH = 36;
export const CHORD_LOW = 48;
export const CHORD_HIGH = 72;

export interface Chord {
  name: string;
  /** Pitch class of the root, 0 = C. */
  root: number;
  /** Semitones above the root. */
  intervals: number[];
}

/** Eight chords that sit together in one key-neighbourhood, so any order of
 *  presses stays consonant. Minor-leaning, which suits the palette. */
export const CHORDS: Chord[] = [
  { name: 'Em',   root: 4,  intervals: [0, 3, 7] },
  { name: 'Am',   root: 9,  intervals: [0, 3, 7] },
  { name: 'Dm',   root: 2,  intervals: [0, 3, 7] },
  { name: 'G',    root: 7,  intervals: [0, 4, 7] },
  { name: 'C',    root: 0,  intervals: [0, 4, 7] },
  { name: 'F',    root: 5,  intervals: [0, 4, 7] },
  { name: 'B♭',   root: 10, intervals: [0, 4, 7] },
  { name: 'Bdim', root: 11, intervals: [0, 3, 6] },
];

/** Fold a pitch class into a register, so voicings never wander octaves. */
export function inRegister(pitchClass: number, low: number, high: number): number {
  let midi = low + (((pitchClass - low) % 12) + 12) % 12;
  if (midi > high) midi -= 12;
  return midi;
}

export function bassNote(chord: Chord): number {
  return inRegister(chord.root, BASS_LOW, BASS_HIGH);
}

/** The chord's notes, each folded into the chord register. */
export function voicing(chord: Chord): number[] {
  return chord.intervals.map(i => inRegister(chord.root + i, CHORD_LOW, CHORD_HIGH));
}

// ── Quantize ────────────────────────────────────────────────────────────────
export type Unit = 'bar' | 'beat' | 'off';

/** The next musical boundary at or after `now`, in the same clock as `now`.
 *  `off` returns `now` — press it and it sounds, no waiting. */
export function nextBoundary(
  now: number, startedAt: number, bpm: number, unit: Unit = 'bar', beatsPerBar = 4,
): number {
  if (unit === 'off') return now;
  const beat = 60 / bpm;
  const grid = unit === 'bar' ? beat * beatsPerBar : beat;
  const elapsed = now - startedAt;
  if (elapsed <= 0) return startedAt;
  return startedAt + Math.ceil(elapsed / grid - 1e-9) * grid;
}

// ── Voice stealing ──────────────────────────────────────────────────────────
export interface VoiceRef {
  id: number;
  /** Clock time the voice started. */
  startedAt: number;
  /** Current gain, 0–1. */
  gain: number;
}

/** When every voice is busy, take the quietest; ties go to the oldest. Taking
 *  the loudest is what makes cheap samplers audibly cut themselves off. */
export function pickVoiceToSteal(voices: VoiceRef[]): VoiceRef | null {
  let chosen: VoiceRef | null = null;
  for (const v of voices) {
    if (!chosen) { chosen = v; continue; }
    if (v.gain < chosen.gain - 1e-9) { chosen = v; continue; }
    if (Math.abs(v.gain - chosen.gain) <= 1e-9 && v.startedAt < chosen.startedAt) chosen = v;
  }
  return chosen;
}
