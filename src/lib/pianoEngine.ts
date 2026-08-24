/*
 * Piano engine — the Web Audio half.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// The signal chain, in full:
//
//   AudioBufferSourceNode → BiquadFilter(lowpass) → GainNode → master → out
//
// The source buffer is EITHER a real recording handed over by
// src/lib/sampleLoader.ts, OR — until one is loaded, or for any note a library
// doesn't cover — a layer rendered here by additive synthesis. Synthesis is
// declared, not disguised: no sample library ships inside this repository.

import {
  CHORD_HIGH, CHORD_LOW, cutoffFor, gainFor, pickVoiceToSteal, playbackRate,
  type VoiceRef,
} from './smartPiano';
import { SampleLibrary, type LibraryStats } from './sampleLoader';

/** Every synthesized layer is rendered at this pitch and shifted from it. */
export const LAYER_ROOT_MIDI = 60;
/** Rendered layers, softest first, matched to the same velocity bands a real
 *  library would use. */
export const SYNTH_LAYERS: { velocity: [number, number]; brightness: number }[] = [
  { velocity: [1, 42], brightness: 0.35 },
  { velocity: [43, 84], brightness: 0.65 },
  { velocity: [85, 127], brightness: 1.0 },
];

export const MAX_VOICES = 24;
const RENDER_SECONDS = 3.2;

/** Additive synthesis: a struck string's partials decay faster the higher they
 *  are, and a harder strike excites more of them. Two lines of physics, and it
 *  is enough to be playable — but it is not a Steinway and never claims to be. */
function renderLayer(context: BaseAudioContext, brightness: number): AudioBuffer {
  const rate = context.sampleRate;
  const length = Math.floor(RENDER_SECONDS * rate);
  const buffer = context.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  const f0 = 440 * Math.pow(2, (LAYER_ROOT_MIDI - 69) / 12);
  const partials = Math.max(4, Math.round(24 * brightness));

  for (let n = 1; n <= partials; n++) {
    // Real strings are stiff, so partials sit slightly sharp of exact multiples.
    const inharmonic = n * Math.sqrt(1 + 0.0004 * n * n);
    const frequency = f0 * inharmonic;
    if (frequency > rate / 2) break;
    const amplitude = Math.pow(n, -1.4) * Math.pow(brightness, (n - 1) * 0.18);
    const decay = 1.6 + 5.5 * (n - 1) / partials;
    const omega = 2 * Math.PI * frequency;
    const phase = (n * 1.7) % (2 * Math.PI);
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      data[i] += amplitude * Math.exp(-decay * t) * Math.sin(omega * t + phase);
    }
  }

  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(data[i]));
  if (peak > 0) for (let i = 0; i < length; i++) data[i] /= peak;

  // A short fade in, so no layer starts on a click.
  const fade = Math.floor(0.002 * rate);
  for (let i = 0; i < fade; i++) data[i] *= i / fade;
  return buffer;
}

function synthLayerIndex(velocity: number): number {
  for (let i = 0; i < SYNTH_LAYERS.length; i++) {
    const [low, high] = SYNTH_LAYERS[i].velocity;
    if (velocity >= low && velocity <= high) return i;
  }
  return SYNTH_LAYERS.length - 1;
}

interface Voice extends VoiceRef {
  source: AudioBufferSourceNode;
  amp: GainNode;
  midi: number;
  /** True when this note is a real recording rather than a rendered layer. */
  sampled: boolean;
}

export interface StrikeOptions {
  midi: number;
  velocity: number;
  /** Context time to sound at. Defaults to now. */
  when?: number;
  /** Seconds to hold before release. */
  duration?: number;
}

export class PianoEngine {
  readonly context: AudioContext;
  readonly master: GainNode;
  readonly library: SampleLibrary;

  private layers: AudioBuffer[] = [];
  private voices: Voice[] = [];
  private nextId = 1;
  /** Notes that were heard as synthesis because their sample hadn't landed. */
  private synthesizedCount = 0;
  private sampledCount = 0;

  constructor(context: AudioContext, onLibraryChange: (stats: LibraryStats) => void = () => {}) {
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(context.destination);
    this.library = new SampleLibrary(
      { decodeAudioData: (data: ArrayBuffer) => context.decodeAudioData(data) },
      undefined,
      onLibraryChange,
    );
  }

  /** Render the fallback layers. Cheap enough to do on the first user gesture. */
  prepare(): void {
    if (this.layers.length) return;
    this.layers = SYNTH_LAYERS.map(layer => renderLayer(this.context, layer.brightness));
  }

  /** Point the engine at a manifest. Playing continues throughout — this only
   *  changes what the NEXT strikes sound like. */
  async useLibrary(manifestUrl: string) {
    return this.library.load(manifestUrl);
  }

  strike({ midi, velocity, when, duration = 2.4 }: StrikeOptions): void {
    this.prepare();
    const context = this.context;
    const at = Math.max(when ?? context.currentTime, context.currentTime);

    // Ask for a recording first; null simply means "synthesize this one", and
    // the loader has already started fetching it for next time.
    const sample = this.library.acquire(midi, velocity);
    let buffer: AudioBuffer;
    let rate: number;
    let extraGain = 1;
    if (sample) {
      buffer = sample.buffer;
      rate = sample.rate;
      extraGain = sample.gain;
      this.sampledCount++;
    } else {
      buffer = this.layers[synthLayerIndex(velocity)];
      rate = playbackRate(midi, LAYER_ROOT_MIDI);
      this.synthesizedCount++;
    }

    if (this.voices.length >= MAX_VOICES) {
      const victim = pickVoiceToSteal(this.voices);
      if (victim) this.release(victim.id, at, 0.06);
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoffFor(velocity);
    filter.Q.value = 0.7;

    const amp = context.createGain();
    const peak = gainFor(velocity) * extraGain;
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + 0.008);

    source.connect(filter);
    filter.connect(amp);
    amp.connect(this.master);
    source.start(at);

    const voice: Voice = {
      id: this.nextId++, startedAt: at, gain: peak,
      source, amp, midi, sampled: Boolean(sample),
    };
    this.voices.push(voice);
    source.onended = () => { this.voices = this.voices.filter(v => v.id !== voice.id); };

    this.release(voice.id, at + duration, 0.35);
  }

  private release(id: number, at: number, seconds: number): void {
    const voice = this.voices.find(v => v.id === id);
    if (!voice) return;
    const when = Math.max(at, this.context.currentTime);
    voice.gain = 0;
    try {
      voice.amp.gain.cancelScheduledValues(when);
      voice.amp.gain.setValueAtTime(Math.max(voice.amp.gain.value, 0.0002), when);
      voice.amp.gain.exponentialRampToValueAtTime(0.0001, when + seconds);
      voice.source.stop(when + seconds + 0.02);
    } catch {
      // A source already stopped throws; nothing to do about a note that has
      // already finished sounding.
    }
  }

  /** Silence everything immediately. */
  panic(): void {
    for (const voice of [...this.voices]) this.release(voice.id, this.context.currentTime, 0.02);
  }

  /** How the last stretch of playing actually sounded — real against rendered.
   *  Shown in the operator panel so the split is visible, not assumed. */
  sourceMix(): { sampled: number; synthesized: number } {
    return { sampled: this.sampledCount, synthesized: this.synthesizedCount };
  }
}
