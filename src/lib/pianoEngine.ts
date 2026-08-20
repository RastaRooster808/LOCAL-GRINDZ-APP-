/*
 * Smart Piano — Web Audio engine.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// The DSP chain is exactly as specified:
//
//     AudioBufferSourceNode -> BiquadFilter (lowpass) -> GainNode -> master
//
// SAMPLES: this repository ships no recorded piano library, so the velocity
// layers are RENDERED into real AudioBuffers at start-up by additive synthesis —
// harder layers carry more upper partials and a faster strike, exactly as louder
// recordings of a real piano do. Everything downstream is genuine sample
// playback: pitch comes from `playbackRate` resampling, not oscillator tuning.
// Dropping in an SFZ set therefore means replacing `renderLayer` alone; no other
// part of the engine changes.

import {
  MAX_POLYPHONY, VELOCITY_LAYERS, gainFor, cutoffFor, velocityLayer, playbackRate,
  admitVoice, type VoiceRef,
} from './smartPiano';

/** The pitch each rendered layer is "recorded" at; resampling covers the rest. */
export const LAYER_ROOT_MIDI = 60;

interface LiveVoice extends VoiceRef {
  src: AudioBufferSourceNode;
  amp: GainNode;
  filter: BiquadFilterNode;
  released: boolean;
}

export class PianoEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layers: AudioBuffer[] = [];
  private voices: LiveVoice[] = [];
  private nextId = 1;
  sustain = false;

  /** Lazily start audio — browsers require a gesture before this succeeds. */
  async init(): Promise<void> {
    if (this.ctx) { if (this.ctx.state === 'suspended') await this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(ctx.destination);
    for (let l = 0; l < VELOCITY_LAYERS; l++) this.layers.push(this.renderLayer(ctx, l));
    if (ctx.state === 'suspended') await ctx.resume();
  }

  get currentTime(): number { return this.ctx ? this.ctx.currentTime : 0; }
  get ready(): boolean { return !!this.ctx; }
  get voiceCount(): number { return this.voices.length; }

  /**
   * One velocity layer, rendered as a struck-string tone. Higher layers add
   * partials and sharpen the attack — the timbral difference between a soft and
   * a hard strike, which amplitude alone cannot fake.
   */
  private renderLayer(ctx: AudioContext, layer: number): AudioBuffer {
    const sr = ctx.sampleRate, dur = 3.2;
    const buf = ctx.createBuffer(1, Math.floor(sr * dur), sr);
    const data = buf.getChannelData(0);
    const f0 = 440 * Math.pow(2, (LAYER_ROOT_MIDI - 69) / 12);
    const hard = layer / (VELOCITY_LAYERS - 1);              // 0 soft … 1 hard
    const partials = 6 + Math.round(hard * 10);
    const attack = 0.006 - hard * 0.004;                     // harder = faster strike
    for (let i = 0; i < data.length; i++) {
      const t = i / sr;
      let s = 0;
      for (let h = 1; h <= partials; h++) {
        // Upper partials decay faster, and are stronger in the harder layers.
        const decay = Math.exp(-t * (1.1 + h * (0.85 - hard * 0.25)));
        const amp = (1 / Math.pow(h, 1.35 - hard * 0.3)) * decay;
        // Slight inharmonicity, as a real string has.
        s += amp * Math.sin(2 * Math.PI * f0 * h * (1 + 0.0004 * h * h) * t);
      }
      const env = t < attack ? t / attack : 1;
      data[i] = s * env * 0.22;
    }
    return buf;
  }

  /**
   * Strike a note. Returns the voice id, or -1 if audio isn't running yet.
   * `when` is an absolute context time, so the scheduler can place notes ahead.
   */
  noteOn(midi: number, velocity: number, when?: number): number {
    const ctx = this.ctx, master = this.master;
    if (!ctx || !master) return -1;
    const t = when ?? ctx.currentTime;
    const layer = velocityLayer(velocity);
    const gain = gainFor(velocity);

    const src = ctx.createBufferSource();
    src.buffer = this.layers[layer];
    src.playbackRate.value = playbackRate(midi, LAYER_ROOT_MIDI);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoffFor(velocity);
    filter.Q.value = 0.7;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, t);

    src.connect(filter).connect(amp).connect(master);
    src.start(t);

    const voice: LiveVoice = {
      id: this.nextId++, midi, gain, startedAt: t,
      src, amp, filter, released: false,
    };
    // Enforce the ceiling, stealing the quietest — which is the least audible.
    const { keep, stolen } = admitVoice(this.voices, voice, MAX_POLYPHONY);
    if (stolen) this.hardStop(stolen as LiveVoice);
    this.voices = keep as LiveVoice[];
    src.onended = () => { this.voices = this.voices.filter(v => v.id !== voice.id); };
    return voice.id;
  }

  /**
   * Release a note. With sustain ON the release phase is overridden and the
   * sample is left to decay on its own — the pedal held down.
   */
  noteOff(id: number, releaseSeconds = 0.28): void {
    const v = this.voices.find(x => x.id === id);
    if (!v || v.released || !this.ctx) return;
    if (this.sustain) return;
    this.fadeOut(v, releaseSeconds);
  }

  /** Lift the pedal: everything still ringing now gets its release. */
  releaseSustained(releaseSeconds = 0.35): void {
    for (const v of [...this.voices]) if (!v.released) this.fadeOut(v, releaseSeconds);
  }

  private fadeOut(v: LiveVoice, seconds: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    v.released = true;
    try {
      v.amp.gain.cancelScheduledValues(now);
      v.amp.gain.setValueAtTime(Math.max(v.amp.gain.value, 1e-4), now);
      v.amp.gain.exponentialRampToValueAtTime(1e-4, now + seconds);
      v.src.stop(now + seconds + 0.02);
    } catch { /* already stopped */ }
  }

  private hardStop(v: LiveVoice): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      v.amp.gain.cancelScheduledValues(now);
      v.amp.gain.setValueAtTime(Math.max(v.amp.gain.value, 1e-4), now);
      v.amp.gain.exponentialRampToValueAtTime(1e-4, now + 0.03); // quick, not clicky
      v.src.stop(now + 0.05);
    } catch { /* already stopped */ }
  }

  /** Stop everything immediately (leaving a screen, changing patterns). */
  allNotesOff(): void {
    for (const v of [...this.voices]) this.hardStop(v);
    this.voices = [];
  }

  async close(): Promise<void> {
    this.allNotesOff();
    if (this.ctx) { try { await this.ctx.close(); } catch { /* ignore */ } this.ctx = null; }
  }
}
