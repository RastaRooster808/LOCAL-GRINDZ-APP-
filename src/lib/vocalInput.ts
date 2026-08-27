/*
 * Microphone → vocal triggers.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// The plumbing between a live microphone and src/lib/vocalTrigger.ts: keep a
// rolling window of audio, hand each hop to the onset detector, and when a
// sound starts, measure it and say what it was.
//
// The DSP itself lives in vocalTrigger.ts and is tested in Node. This file is
// only the parts that need a browser, kept deliberately thin for that reason.

import {
  OnsetDetector, TriggerModel, extractFeatures, velocityFromRms,
  type Features, type Match,
} from './vocalTrigger';

export const FRAME = 2048;
export const HOP = 512;
/** Waited after an onset before measuring, so the window holds the body of the
 *  sound rather than the silence in front of it. */
export const SETTLE_HOPS = 2;

export interface Hit {
  features: Features;
  /** null until at least one trigger has been trained. */
  match: Match | null;
  velocity: number;
  /** AudioContext time the sound started, for scheduling against a clock. */
  at: number;
}

export type HitListener = (hit: Hit) => void;

export interface VocalInputOptions {
  /** Ignore anything quieter than this RMS — room tone is not a performance. */
  gate?: number;
  sensitivity?: number;
}

/**
 * Owns the mic, not the AudioContext — the caller already has one running the
 * instrument, and two contexts on one page fight over the audio clock.
 */
export class VocalInput {
  readonly model = new TriggerModel();
  private context: AudioContext;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private detector: OnsetDetector;
  private ring = new Float32Array(FRAME);
  private filled = 0;
  private pendingHops = -1;
  private onsetAt = 0;
  private listeners: HitListener[] = [];
  private gate: number;
  /** Set while recording takes of one sound; null while performing. */
  private learning: string | null = null;

  constructor(context: AudioContext, options: VocalInputOptions = {}) {
    this.context = context;
    this.gate = options.gate ?? 0.01;
    this.detector = new OnsetDetector({
      sampleRate: context.sampleRate,
      sensitivity: options.sensitivity ?? 1.7,
    });
  }

  get listening(): boolean { return this.processor !== null; }

  /** Ask for the microphone. Throws if the user declines — the caller should
   *  say so plainly rather than leaving a dead button. */
  async start(): Promise<void> {
    if (this.processor) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // All three off: they are built to flatten exactly the transients this
        // depends on, and AGC in particular would erase the loudness that
        // becomes velocity.
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    this.source = this.context.createMediaStreamSource(this.stream);
    this.processor = this.context.createScriptProcessor(HOP, 1, 1);
    this.processor.onaudioprocess = e => this.pushBlock(e.inputBuffer.getChannelData(0));
    this.source.connect(this.processor);
    // A ScriptProcessor only runs while connected to the destination, but we
    // must not play the microphone back into the room — hence a muted sink.
    const mute = this.context.createGain();
    mute.gain.value = 0;
    this.processor.connect(mute);
    mute.connect(this.context.destination);
  }

  stop(): void {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.detector.reset();
    this.filled = 0;
    this.pendingHops = -1;
  }

  onHit(listener: HitListener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  /** While set, every hit is recorded as a take of `label` instead of played. */
  learn(label: string | null): void { this.learning = label; }
  get learningLabel(): string | null { return this.learning; }

  /**
   * Feed one hop of audio. Called by the microphone path, and the seam that
   * lets the whole listener be driven from a file or a test without a browser —
   * which is the only way this logic gets exercised deterministically.
   */
  pushBlock(block: Float32Array): void {
    // Slide the window along by one hop.
    this.ring.copyWithin(0, block.length);
    this.ring.set(block, FRAME - block.length);
    this.filled = Math.min(FRAME, this.filled + block.length);
    if (this.filled < FRAME) return;

    if (this.pendingHops >= 0) {
      // An onset fired recently; wait for the sound's body to fill the window.
      if (this.pendingHops === 0) { this.measure(); this.pendingHops = -1; }
      else this.pendingHops--;
      return;
    }

    const onset = this.detector.push(this.ring, HOP);
    if (onset) {
      this.onsetAt = this.context.currentTime;
      this.pendingHops = SETTLE_HOPS;
    }
  }

  private measure(): void {
    const features = extractFeatures(this.ring, this.context.sampleRate);
    if (features.rms < this.gate) return;      // room tone, not a performance

    if (this.learning) {
      this.model.learn(this.learning, features);
    }
    const hit: Hit = {
      features,
      match: this.learning ? null : this.model.classify(features),
      velocity: velocityFromRms(features.rms),
      at: this.onsetAt,
    };
    for (const l of this.listeners) l(hit);
  }
}

// ── Saving what someone trained ────────────────────────────────────────────
export const STORAGE_KEY = 'lg.vocalTriggers.v1';

/** Training takes a minute of someone's time; losing it on a refresh is rude.
 *  Wrapped because storage throws outright in some privacy modes. */
export function saveModel(model: TriggerModel): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model.toJSON()));
    return true;
  } catch { return false; }
}

export function loadTakes(): Record<string, Features[]> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, Features[]>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
}

export function clearSaved(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* nothing to do */ }
}
