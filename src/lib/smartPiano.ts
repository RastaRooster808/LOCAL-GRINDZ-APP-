/*
 * Smart Piano — chord wheel logic (pure, testable).
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// Everything here is arithmetic: chord voicings, velocity from touch, the DSP
// mappings, autoplay patterns and voice stealing. No Web Audio, no DOM — so the
// engine's behaviour can be proven without a browser, and the audio layer stays
// a thin shell over decisions made here.

export type Zone = 'BASS_HEAD' | 'CHORD_BODY';
export type AutoplayState = 0 | 1 | 2 | 3 | 4;

export const MAX_POLYPHONY = 32;
/** Velocity at the top of a strip, and at the bottom. */
export const V_TOP = 40, V_BOTTOM = 120;
/** Bass sits C1–C2; chords are voiced C3–C5. */
/** Below this, a reported contact radius is a default rather than a reading. */
export const MIN_REAL_RADIUS = 2;
export const BASS_LOW = 24, BASS_HIGH = 36;
export const CHORD_LOW = 48, CHORD_HIGH = 72;

// ── Chords ──────────────────────────────────────────────────────────────────
export type Quality = 'maj' | 'min' | 'dim';
const INTERVALS: Record<Quality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
};

export interface Chord { id: string; label: string; rootPc: number; quality: Quality; }

/** The eight columns, left to right. */
export const CHORDS: Chord[] = [
  { id: 'Em',   label: 'Em',   rootPc: 4,  quality: 'min' },
  { id: 'Am',   label: 'Am',   rootPc: 9,  quality: 'min' },
  { id: 'Dm',   label: 'Dm',   rootPc: 2,  quality: 'min' },
  { id: 'G',    label: 'G',    rootPc: 7,  quality: 'maj' },
  { id: 'C',    label: 'C',    rootPc: 0,  quality: 'maj' },
  { id: 'F',    label: 'F',    rootPc: 5,  quality: 'maj' },
  { id: 'Bb',   label: 'B♭',   rootPc: 10, quality: 'maj' },
  { id: 'Bdim', label: 'B°',   rootPc: 11, quality: 'dim' },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Lift a pitch class into a register, choosing the lowest fit. */
function intoRange(pc: number, low: number, high: number): number {
  let n = pc;
  while (n < low) n += 12;
  while (n > high) n -= 12;
  return clamp(n, low, high);
}

/**
 * The notes a zone sounds for a chord.
 * Bass gives the root alone in C1–C2; the body gives the full triad in C3–C5,
 * each voice lifted into the register rather than stacked blindly.
 */
export function voicingFor(chord: Chord, zone: Zone): number[] {
  if (zone === 'BASS_HEAD') return [intoRange(chord.rootPc, BASS_LOW, BASS_HIGH)];
  const root = intoRange(chord.rootPc, CHORD_LOW, CHORD_LOW + 11);
  return INTERVALS[chord.quality].map(i => {
    const n = root + i;
    return n > CHORD_HIGH ? n - 12 : n;
  }).sort((a, b) => a - b);
}

// ── Touch → velocity ────────────────────────────────────────────────────────
export interface TouchInput {
  /** 0 at the top of the strip, 1 at the bottom. */
  yOffsetNormalized: number;
  /** TouchEvent.force, 0–1, when the device reports it. */
  force?: number;
  /** Contact radius in px, when force is unavailable. */
  radius?: number;
}

/**
 * A flat screen has no key sensor, so velocity is computed.
 *
 * Position is the primary signal — top of the strip is soft, bottom is hard.
 * Where the device reports pressure (`force`) or contact area (`radius`) that
 * modulates the result rather than replacing it, so a firm tap high on the strip
 * is still louder than a light one, without position losing its meaning.
 */
export function velocityFromTouch(t: TouchInput): number {
  const y = clamp(t.yOffsetNormalized, 0, 1);
  let v = V_TOP + (V_BOTTOM - V_TOP) * y;
  if (typeof t.force === 'number' && t.force > 0) {
    v += (clamp(t.force, 0, 1) - 0.5) * 40;          // ±20 either way
  } else if (typeof t.radius === 'number' && t.radius > MIN_REAL_RADIUS) {
    // A mouse reports width/height of 1px — that is a default, not a measurement,
    // so anything at or below it is ignored rather than read as a feather touch.
    const norm = clamp((t.radius - 10) / 30, 0, 1);   // ~10px light, ~40px heavy
    v += (norm - 0.5) * 30;
  }
  return clamp(Math.round(v), 1, 127);
}

// ── Velocity → DSP ──────────────────────────────────────────────────────────
/** Exponential gain, so loudness tracks the way hearing does. */
export function gainFor(velocity: number): number {
  const v = clamp(velocity, 0, 127) / 127;
  return v * v;
}

/** Harder hits open the filter — more overtones, a brighter strike. */
export const CUTOFF_MIN = 500, CUTOFF_MAX = 9000;
export function cutoffFor(velocity: number): number {
  const v = clamp(velocity, 0, 127) / 127;
  return Math.round(CUTOFF_MIN * Math.pow(CUTOFF_MAX / CUTOFF_MIN, v));
}

/** Which recorded layer a hit belongs to (soft → hard). */
export const VELOCITY_LAYERS = 4;
export function velocityLayer(velocity: number): number {
  return clamp(Math.floor((clamp(velocity, 0, 127) / 128) * VELOCITY_LAYERS), 0, VELOCITY_LAYERS - 1);
}

/**
 * Resampling ratio for a note played from a layer recorded at `rootMidi`.
 * Every semitone is the twelfth root of two, so a buffer can cover a zone.
 */
export function playbackRate(targetMidi: number, rootMidi: number): number {
  return Math.pow(2, (targetMidi - rootMidi) / 12);
}

// ── Autoplay ────────────────────────────────────────────────────────────────
export interface PatternStep { /** 0–15, sixteenths in a bar. */ step: number; /** index into the voicing, -1 = bass */ voice: number; velocity: number; }

/**
 * Four accompaniment patterns. `voice: -1` is the bass note; 0..n index the
 * chord tones, so a pattern is chord-agnostic and transposes by itself.
 */
export const PATTERNS: Record<Exclude<AutoplayState, 0>, PatternStep[]> = {
  1: [ // block chords on the beat
    { step: 0, voice: -1, velocity: 100 }, { step: 0, voice: 0, velocity: 84 },
    { step: 0, voice: 1, velocity: 80 },   { step: 0, voice: 2, velocity: 80 },
    { step: 8, voice: -1, velocity: 88 },  { step: 8, voice: 0, velocity: 72 },
    { step: 8, voice: 1, velocity: 70 },   { step: 8, voice: 2, velocity: 70 },
  ],
  2: [ // arpeggio up, eighths
    { step: 0, voice: -1, velocity: 104 }, { step: 2, voice: 0, velocity: 78 },
    { step: 4, voice: 1, velocity: 76 },   { step: 6, voice: 2, velocity: 80 },
    { step: 8, voice: -1, velocity: 92 },  { step: 10, voice: 0, velocity: 74 },
    { step: 12, voice: 1, velocity: 72 },  { step: 14, voice: 2, velocity: 78 },
  ],
  3: [ // up and back down
    { step: 0, voice: -1, velocity: 106 }, { step: 2, voice: 0, velocity: 80 },
    { step: 4, voice: 1, velocity: 78 },   { step: 6, voice: 2, velocity: 84 },
    { step: 8, voice: 1, velocity: 76 },   { step: 10, voice: 0, velocity: 74 },
    { step: 12, voice: -1, velocity: 90 }, { step: 14, voice: 2, velocity: 70 },
  ],
  4: [ // busier sixteenths
    { step: 0, voice: -1, velocity: 110 }, { step: 1, voice: 0, velocity: 70 },
    { step: 3, voice: 1, velocity: 68 },   { step: 4, voice: 2, velocity: 82 },
    { step: 6, voice: 1, velocity: 66 },   { step: 7, voice: 0, velocity: 72 },
    { step: 8, voice: -1, velocity: 96 },  { step: 9, voice: 2, velocity: 76 },
    { step: 11, voice: 1, velocity: 68 },  { step: 12, voice: 0, velocity: 74 },
    { step: 14, voice: 2, velocity: 80 },  { step: 15, voice: 1, velocity: 64 },
  ],
};

export const STEPS_PER_BAR = 16;
export const secondsPerStep = (bpm: number) => (60 / bpm) / 4;   // sixteenths
export const secondsPerBar = (bpm: number) => (60 / bpm) * 4;

/**
 * When a newly tapped chord should take effect: the next musical boundary, so a
 * switch lands in time instead of interrupting. Never returns a time in the past.
 */
export function nextBoundary(now: number, startedAt: number, bpm: number, unit: 'bar' | 'beat' = 'bar'): number {
  const span = unit === 'bar' ? secondsPerBar(bpm) : 60 / bpm;
  const elapsed = Math.max(0, now - startedAt);
  return startedAt + Math.ceil((elapsed + 1e-9) / span) * span;
}

// ── Polyphony ───────────────────────────────────────────────────────────────
export interface VoiceRef { id: number; midi: number; gain: number; startedAt: number; }

/**
 * Which voice to steal when the ceiling is reached: the quietest, and among
 * equals the oldest. Taking the quietest keeps the steal from being heard.
 */
export function pickVoiceToSteal(voices: VoiceRef[]): VoiceRef | null {
  if (!voices.length) return null;
  return voices.reduce((worst, v) =>
    v.gain < worst.gain || (v.gain === worst.gain && v.startedAt < worst.startedAt) ? v : worst);
}

/** Admit a voice, reporting which (if any) must be stopped to make room. */
export function admitVoice(active: VoiceRef[], incoming: VoiceRef, max = MAX_POLYPHONY):
  { keep: VoiceRef[]; stolen: VoiceRef | null } {
  if (active.length < max) return { keep: [...active, incoming], stolen: null };
  const stolen = pickVoiceToSteal(active);
  return { keep: [...active.filter(v => v !== stolen), incoming], stolen };
}
