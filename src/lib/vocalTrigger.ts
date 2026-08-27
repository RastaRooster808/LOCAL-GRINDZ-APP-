/*
 * Vocal triggers — beatbox and mouth sounds into instrument hits.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// WHAT THIS IS, AND WHAT IT ISN'T
// -------------------------------
// src/lib/pitch.ts already answers "what note is this?" — YIN, the same family
// of detector commercial voice-to-MIDI tools use. That covers humming a melody.
// It does NOT cover beatboxing, because a kick and a hi-hat have no pitch to
// find: what separates them is WHEN they start and what their noise looks like.
//
// So this module answers the other two questions:
//
//   1. ONSET   — did a sound just start?          (spectral flux + refractory)
//   2. TIMBRE  — which sound was it?              (features + nearest centroid)
//
// The classifier is trained the same way Dubler trains its triggers: you record
// several takes of each sound and it learns what they have in common. Nothing
// here is pretrained, because a stranger's kick drum is not yours — the whole
// point is that it learns YOUR mouth.
//
// Everything is a pure function of its input except TriggerModel's stored
// takes, so all of it can be exercised in Node against synthesized audio.

import { fft, hann, magnitudes } from './fft';

export { fft, hann, magnitudes };

// ── 1. Onset: did a sound just start? ──────────────────────────────────────
/** Rectified spectral flux: how much energy APPEARED since the last frame.
 *  Only rises count — a note ending is not a note starting, and counting decay
 *  is what makes naive detectors fire twice on every hit. */
export function spectralFlux(prev: Float32Array, next: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < next.length; i++) {
    const d = next[i] - prev[i];
    if (d > 0) sum += d;
  }
  return sum;
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export interface OnsetOptions {
  sampleRate: number;
  /** Frames of flux history the adaptive threshold is drawn from. */
  historyFrames?: number;
  /** Threshold = median(history) * sensitivity + floor. */
  sensitivity?: number;
  floor?: number;
  /** Hard floor on the gap between two hits. Kept short because the hysteresis
   *  below does most of the work; a long gate would eat fast hi-hat rolls
   *  (sixteenths at 160bpm are only 94ms apart). */
  refractoryMs?: number;
  /** Re-arm once flux falls back under `threshold * rearmRatio`. Without this,
   *  a sound whose pitch SWEEPS — every real kick drum, every "puh" — keeps
   *  lighting up new bins as it falls, and rectified flux reads that as a
   *  second onset. Requiring the flux to subside first is what tells a new hit
   *  apart from the tail of the last one. */
  rearmRatio?: number;
}

export interface Onset {
  /** Where the transient actually is: the first sample of this frame that the
   *  previous frame did not already contain. Reporting the frame's START
   *  instead puts the onset up to a full window early — 34–44ms of phantom
   *  lead at a 2048-sample window, which is audible as sloppy timing. */
  sample: number;
  /** How far above the adaptive threshold it crossed — a rough strength. */
  strength: number;
}

/**
 * Streaming onset detector. Feed it consecutive frames; it answers "a sound
 * just started" at most once per refractory window.
 *
 * The threshold is adaptive (median of recent flux) rather than fixed, because
 * a fixed one is wrong the moment the room, the mic, or the speaker changes.
 */
export class OnsetDetector {
  private prev: Float32Array | null = null;
  private history: number[] = [];
  private lastOnsetSample = -Infinity;
  private frames = 0;
  private armed = true;
  readonly options: Required<OnsetOptions>;

  constructor(options: OnsetOptions) {
    this.options = {
      historyFrames: 20,
      sensitivity: 1.7,
      floor: 0.6,
      refractoryMs: 45,
      rearmRatio: 0.6,
      ...options,
    };
  }

  /** @returns an Onset when this frame starts a sound, else null. */
  push(frame: Float32Array, hopSamples: number): Onset | null {
    const mag = magnitudes(frame);
    // The audio this frame adds begins where the previous frame ended.
    const sample = this.frames * hopSamples + frame.length - hopSamples;
    this.frames++;

    if (!this.prev) { this.prev = mag; return null; }
    const flux = spectralFlux(this.prev, mag);
    this.prev = mag;

    const threshold = median(this.history) * this.options.sensitivity + this.options.floor;
    this.history.push(flux);
    if (this.history.length > this.options.historyFrames) this.history.shift();

    // One frame of warm-up, and no more. An earlier version skipped four, which
    // silently ate any sound made in the first ~50ms after the mic opened —
    // including, reliably, the first hit of a count-in. The `floor` is what
    // guards an empty history, so the extra frames bought nothing.

    // Subsided? Then a rise from here is a genuinely new sound.
    if (flux < threshold * this.options.rearmRatio) this.armed = true;

    const gapSamples = (this.options.refractoryMs / 1000) * this.options.sampleRate;
    if (this.armed && flux > threshold && sample - this.lastOnsetSample >= gapSamples) {
      this.lastOnsetSample = sample;
      this.armed = false;
      return { sample, strength: flux - threshold };
    }
    return null;
  }

  reset(): void {
    this.prev = null;
    this.history = [];
    this.lastOnsetSample = -Infinity;
    this.frames = 0;
    this.armed = true;
  }
}

// ── 2. Timbre: which sound was it? ─────────────────────────────────────────
export interface Features {
  /** Loudness. Kept out of the distance metric — how HARD you hit is velocity,
   *  not identity, and folding it in makes a soft kick classify as a hi-hat. */
  rms: number;
  /** Spectral centroid in Hz: the "brightness" of the sound. */
  centroidHz: number;
  /** Zero-crossing rate: high for noisy/sibilant sounds, low for boomy ones. */
  zcr: number;
  /** Spectral flatness, 0 tonal → 1 noise-like. Separates "tss" from "doom". */
  flatness: number;
  /** Fraction of energy below 300 Hz / 300–3000 Hz / above 3000 Hz. */
  lowRatio: number;
  midRatio: number;
  highRatio: number;
}

/** The fields actually compared when identifying a sound, in a fixed order. */
export const FEATURE_KEYS = ['centroidHz', 'zcr', 'flatness', 'lowRatio', 'midRatio', 'highRatio'] as const;

export function extractFeatures(frame: Float32Array, sampleRate: number): Features {
  const n = frame.length;
  let rms = 0, crossings = 0;
  for (let i = 0; i < n; i++) {
    rms += frame[i] * frame[i];
    if (i > 0 && ((frame[i - 1] < 0 && frame[i] >= 0) || (frame[i - 1] >= 0 && frame[i] < 0))) crossings++;
  }
  rms = Math.sqrt(rms / n);

  const mag = magnitudes(frame);
  const binHz = sampleRate / n;
  // Weighted by POWER (magnitude squared), not magnitude. Every real microphone
  // carries a broadband noise floor, and spread across a thousand bins even a
  // quiet one outweighs a single loud low partial: weighted by magnitude, a
  // deep "puh" measured a 4kHz centroid — brighter than the hi-hat it has to be
  // told apart from. Squaring favours concentrated peaks over spread hiss.
  let total = 0, weighted = 0, logSum = 0, low = 0, mid = 0, high = 0;
  for (let i = 1; i < mag.length; i++) {
    const p = mag[i] * mag[i], f = i * binHz;
    total += p;
    weighted += p * f;
    logSum += Math.log(mag[i] + 1e-10);
    if (f < 300) low += p; else if (f < 3000) mid += p; else high += p;
  }

  const geometric = Math.exp(logSum / (mag.length - 1));
  const arithmetic = total / (mag.length - 1);
  return {
    rms,
    centroidHz: total > 0 ? weighted / total : 0,
    zcr: crossings / n,
    flatness: arithmetic > 0 ? Math.min(1, geometric / arithmetic) : 0,
    lowRatio: total > 0 ? low / total : 0,
    midRatio: total > 0 ? mid / total : 0,
    highRatio: total > 0 ? high / total : 0,
  };
}

export interface Match {
  label: string;
  /** 0–1. The margin to the runner-up, so a sound that sits between two
   *  trained triggers reports low confidence instead of guessing confidently. */
  confidence: number;
  /** Normalised distance to the winning centroid. */
  distance: number;
}

/**
 * Nearest-centroid classifier over z-scored features.
 *
 * Deliberately not a neural net. With a dozen takes per sound, a centroid
 * is not merely adequate — it is better behaved: it trains instantly in the
 * browser, it cannot overfit a handful of examples, and when it is wrong you
 * can read the feature table and see why.
 */
export class TriggerModel {
  private takes = new Map<string, Features[]>();
  private mean: number[] = [];
  private deviation: number[] = [];
  private centroids = new Map<string, number[]>();

  /** Record one take of a sound. Dubler asks for a dozen; five is workable. */
  learn(label: string, features: Features): void {
    const list = this.takes.get(label) ?? [];
    list.push(features);
    this.takes.set(label, list);
    this.fit();
  }

  forget(label: string): void {
    this.takes.delete(label);
    this.fit();
  }

  clear(): void {
    this.takes.clear();
    this.fit();
  }

  get labels(): string[] { return [...this.takes.keys()]; }
  takeCount(label: string): number { return this.takes.get(label)?.length ?? 0; }
  get trained(): boolean { return this.centroids.size > 0; }

  private vector(f: Features): number[] {
    return FEATURE_KEYS.map(k => f[k]);
  }

  /** Recompute z-scoring and centroids. Features live on wildly different
   *  scales — centroid is thousands of Hz, flatness is 0–1 — so without this
   *  the distance is just "how far apart are the centroids in Hz". */
  private fit(): void {
    const all: Features[] = [];
    for (const list of this.takes.values()) all.push(...list);
    if (!all.length) { this.centroids.clear(); this.mean = []; this.deviation = []; return; }

    const dims = FEATURE_KEYS.length;
    this.mean = new Array(dims).fill(0);
    this.deviation = new Array(dims).fill(1);
    for (const f of all) {
      const v = this.vector(f);
      for (let d = 0; d < dims; d++) this.mean[d] += v[d] / all.length;
    }
    for (let d = 0; d < dims; d++) {
      let variance = 0;
      for (const f of all) { const diff = this.vector(f)[d] - this.mean[d]; variance += diff * diff; }
      const sd = Math.sqrt(variance / all.length);
      this.deviation[d] = sd > 1e-9 ? sd : 1;   // a constant feature carries no information
    }

    this.centroids.clear();
    for (const [label, list] of this.takes) {
      const c = new Array(dims).fill(0);
      for (const f of list) {
        const z = this.normalize(f);
        for (let d = 0; d < dims; d++) c[d] += z[d] / list.length;
      }
      this.centroids.set(label, c);
    }
  }

  private normalize(f: Features): number[] {
    return this.vector(f).map((v, d) => (v - this.mean[d]) / this.deviation[d]);
  }

  /** Identify a sound. Returns null when nothing has been trained. */
  classify(f: Features): Match | null {
    if (!this.centroids.size) return null;
    const z = this.normalize(f);

    let best = '', bestD = Infinity, secondD = Infinity;
    for (const [label, c] of this.centroids) {
      let sum = 0;
      for (let d = 0; d < z.length; d++) { const diff = z[d] - c[d]; sum += diff * diff; }
      const distance = Math.sqrt(sum);
      if (distance < bestD) { secondD = bestD; bestD = distance; best = label; }
      else if (distance < secondD) { secondD = distance; }
    }

    // One trained sound has no runner-up to be confident against; report a
    // distance-based confidence instead of a fabricated margin of 1.
    const confidence = Number.isFinite(secondD) && secondD + bestD > 1e-9
      ? (secondD - bestD) / (secondD + bestD)
      : 1 / (1 + bestD);
    return { label: best, confidence: Math.max(0, Math.min(1, confidence)), distance: bestD };
  }

  /**
   * How reliably can these trained sounds actually be told apart?
   *
   * Leave-one-out: drop each take, refit on the rest, and see whether the take
   * is still called correctly. This measures the thing that matters directly,
   * using only takes the person already recorded — no extra recording, and no
   * guessing from a confidence number. (Mean confidence was tried as a proxy on
   * real takes and correlated only 0.49 with accuracy, with a pair scoring the
   * HIGHEST confidence and among the worst accuracy. It is not a substitute.)
   *
   * Returns null until there are at least two labels with two takes each.
   */
  crossValidate(): { accuracy: number; samples: number } | null {
    const labels = [...this.takes.keys()];
    if (labels.length < 2 || labels.some(l => (this.takes.get(l)?.length ?? 0) < 2)) return null;

    const original = new Map([...this.takes].map(([l, list]) => [l, [...list]]));
    let right = 0, total = 0;
    try {
      for (const label of labels) {
        const list = original.get(label)!;
        for (let i = 0; i < list.length; i++) {
          this.takes = new Map([...original].map(([l, xs]) =>
            [l, l === label ? xs.filter((_, k) => k !== i) : xs]));
          this.fit();
          const match = this.classify(list[i]);
          total++;
          if (match?.label === label) right++;
        }
      }
    } finally {
      this.takes = original;
      this.fit();
    }
    return total ? { accuracy: right / total, samples: total } : null;
  }

  /** Mean brightness of each trained sound, as spectral centroid in Hz.
   *  Brightness is the axis that actually decided things on real takes: a pair
   *  measuring 891Hz against 3194Hz was told apart 9 times in 10, while two
   *  sounds both sitting at 200–470Hz with no high-frequency content at all
   *  were a coin flip. So when a pair scores badly, this is the number worth
   *  putting in front of someone. */
  brightness(): { label: string; centroidHz: number }[] {
    return [...this.takes].map(([label, list]) => ({
      label,
      centroidHz: list.reduce((s, f) => s + f.centroidHz, 0) / list.length,
    }));
  }

  /** Everything the model knows, for saving to localStorage or a file. */
  toJSON(): Record<string, Features[]> {
    return Object.fromEntries(this.takes);
  }

  static fromJSON(data: Record<string, Features[]>): TriggerModel {
    const model = new TriggerModel();
    for (const [label, list] of Object.entries(data)) {
      for (const f of list) model.learn(label, f);
    }
    return model;
  }
}

// ── Velocity ───────────────────────────────────────────────────────────────
/** How hard the sound was made, as a MIDI velocity. Loudness is deliberately
 *  the only input: it is the one thing about a mouth sound that maps cleanly
 *  onto how hard a key was struck. */
export function velocityFromRms(rms: number, floor = 0.005, ceiling = 0.25): number {
  if (rms <= floor) return 1;
  const x = Math.min(1, Math.log(rms / floor) / Math.log(ceiling / floor));
  return Math.max(1, Math.min(127, Math.round(1 + x * 126)));
}
