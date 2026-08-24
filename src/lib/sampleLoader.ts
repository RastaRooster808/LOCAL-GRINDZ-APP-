/*
 * Sample library loader — real recordings, fetched only when a note needs them.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// WHY THIS EXISTS
// ---------------
// The piano ships playable with no downloads at all: src/lib/pianoEngine.ts
// renders its velocity layers by additive synthesis at boot. That is honest but
// it is not a piano. A real multi-sampled instrument — Salamander Grand Piano,
// the University of Iowa Steinway, FluidR3_GM — is a gigabyte of audio, and a
// gigabyte is not something you hand a phone on a lava road.
//
// So: nothing is fetched at boot, and nothing is ever fetched that isn't about
// to be heard. A key struck for the first time sounds SYNTHESIZED immediately
// while its recording is fetched behind it; the next strike of that key is the
// real thing. No spinner, no silence, no all-or-nothing download.
//
// ON OWNERSHIP: nobody owns the sound a piano makes — that is a hammer, a
// string and a room. Copyright attaches to a particular RECORDING of it. That
// is exactly why Alexander Holm (Salamander, CC-BY) and the University of Iowa
// (public domain) could give theirs away. Honour the licence in the manifest:
// `attribution` is rendered in the app's credits when a library is loaded.

// ── Manifest ────────────────────────────────────────────────────────────────

/** One recorded file, and the pitch it was recorded at. */
export interface SampleZone {
  /** MIDI note number this file was actually played at. 60 = C4. */
  root: number;
  /** File name or path, resolved against the manifest's `base_url`. */
  file: string;
}

/** One dynamic layer: the same notes, struck harder or softer. */
export interface SampleLayer {
  /** Inclusive MIDI velocity range, e.g. [1, 42]. */
  velocity: [number, number];
  /** Trim in dB, so a hot layer can be matched to a quiet one. */
  gain_db?: number;
  /** The files in this layer. Sparse is fine — gaps are pitch-shifted. */
  zones: SampleZone[];
}

export interface SampleManifest {
  version: 1;
  /** Human name, shown in the credits. */
  name: string;
  /** SPDX-style identifier, e.g. "CC-BY-3.0", "MIT", "CC0-1.0". */
  license: string;
  /** The line the licence asks you to display. Rendered in the app. */
  attribution: string;
  attribution_url?: string;
  /** Prefix for every zone file. Absolute, or relative to the page. */
  base_url: string;
  /** Refuse to stretch a recording further than this many semitones; past it
   *  a piano stops sounding like a piano. Undefined means no limit. */
  max_stretch_semitones?: number;
  layers: SampleLayer[];
}

export const MANIFEST_VERSION = 1;

// ── Validation (pure) ───────────────────────────────────────────────────────

export interface ValidationResult {
  ok: boolean;
  manifest?: SampleManifest;
  errors: string[];
  warnings: string[];
}

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

/** Check a parsed manifest thoroughly, and say exactly what is wrong. A bad
 *  manifest must fail here, loudly, rather than fail later as one silent note. */
export function validateManifest(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, errors: ['Manifest is not an object.'], warnings };
  }
  const m = raw as Record<string, unknown>;

  if (m.version !== MANIFEST_VERSION) {
    errors.push(`version must be ${MANIFEST_VERSION}; got ${JSON.stringify(m.version)}.`);
  }
  for (const field of ['name', 'license', 'attribution', 'base_url'] as const) {
    if (typeof m[field] !== 'string' || !(m[field] as string).trim()) {
      errors.push(`${field} is required and must be a non-empty string.`);
    }
  }
  if (m.max_stretch_semitones !== undefined
      && (typeof m.max_stretch_semitones !== 'number' || m.max_stretch_semitones <= 0)) {
    errors.push('max_stretch_semitones, if present, must be a positive number.');
  }

  const layers = m.layers;
  if (!Array.isArray(layers) || layers.length === 0) {
    errors.push('layers must be a non-empty array.');
    return { ok: false, errors, warnings };
  }

  layers.forEach((layerRaw, i) => {
    const where = `layers[${i}]`;
    if (typeof layerRaw !== 'object' || layerRaw === null) {
      errors.push(`${where} is not an object.`);
      return;
    }
    const layer = layerRaw as Record<string, unknown>;
    const v = layer.velocity;
    if (!Array.isArray(v) || v.length !== 2 || !isInt(v[0]) || !isInt(v[1])) {
      errors.push(`${where}.velocity must be [low, high] integers.`);
    } else {
      const [low, high] = v as [number, number];
      if (low < 1 || high > 127) errors.push(`${where}.velocity must lie within 1–127; got [${low}, ${high}].`);
      if (low > high) errors.push(`${where}.velocity is inverted: [${low}, ${high}].`);
    }
    if (layer.gain_db !== undefined && typeof layer.gain_db !== 'number') {
      errors.push(`${where}.gain_db, if present, must be a number.`);
    }
    const zones = layer.zones;
    if (!Array.isArray(zones) || zones.length === 0) {
      errors.push(`${where}.zones must be a non-empty array.`);
      return;
    }
    const seen = new Set<number>();
    zones.forEach((zoneRaw, j) => {
      const zw = `${where}.zones[${j}]`;
      if (typeof zoneRaw !== 'object' || zoneRaw === null) {
        errors.push(`${zw} is not an object.`);
        return;
      }
      const zone = zoneRaw as Record<string, unknown>;
      if (!isInt(zone.root) || (zone.root as number) < 0 || (zone.root as number) > 127) {
        errors.push(`${zw}.root must be a MIDI number 0–127.`);
      } else if (seen.has(zone.root as number)) {
        errors.push(`${zw}.root ${zone.root} is defined twice in this layer.`);
      } else {
        seen.add(zone.root as number);
      }
      if (typeof zone.file !== 'string' || !zone.file.trim()) {
        errors.push(`${zw}.file is required and must be a non-empty string.`);
      }
    });
  });

  // Overlapping velocity ranges are not fatal — the first match wins — but they
  // are almost always a typo, so say so.
  const ranges = layers
    .map((l, i) => ({ i, v: (l as Record<string, unknown>).velocity }))
    .filter(r => Array.isArray(r.v) && r.v.length === 2) as { i: number; v: [number, number] }[];
  for (let a = 0; a < ranges.length; a++) {
    for (let b = a + 1; b < ranges.length; b++) {
      if (ranges[a].v[0] <= ranges[b].v[1] && ranges[b].v[0] <= ranges[a].v[1]) {
        warnings.push(`layers[${ranges[a].i}] and layers[${ranges[b].i}] cover overlapping velocities; the earlier one wins.`);
      }
    }
  }

  if (errors.length) return { ok: false, errors, warnings };
  return { ok: true, manifest: raw as unknown as SampleManifest, errors, warnings };
}

/** Which of 1–127 no layer answers to. Those velocities fall back to synthesis. */
export function velocityGaps(manifest: SampleManifest): [number, number][] {
  const covered = new Array<boolean>(128).fill(false);
  for (const layer of manifest.layers) {
    for (let v = Math.max(1, layer.velocity[0]); v <= Math.min(127, layer.velocity[1]); v++) covered[v] = true;
  }
  const gaps: [number, number][] = [];
  let start: number | null = null;
  for (let v = 1; v <= 127; v++) {
    if (!covered[v] && start === null) start = v;
    if ((covered[v] || v === 127) && start !== null) {
      gaps.push([start, covered[v] ? v - 1 : v]);
      start = null;
    }
  }
  return gaps;
}

// ── Selection (pure) ────────────────────────────────────────────────────────

/** The first layer whose range contains this velocity. */
export function layerFor(manifest: SampleManifest, velocity: number): SampleLayer | null {
  for (const layer of manifest.layers) {
    if (velocity >= layer.velocity[0] && velocity <= layer.velocity[1]) return layer;
  }
  return null;
}

/** The zone nearest in pitch. Ties prefer the LOWER root: stretching a
 *  recording up thins it, stretching down thickens it, and thick reads as a
 *  bigger instrument rather than a chipmunk. */
export function zoneFor(layer: SampleLayer, midi: number): SampleZone | null {
  let best: SampleZone | null = null;
  let bestDistance = Infinity;
  for (const zone of layer.zones) {
    const d = Math.abs(zone.root - midi);
    if (d < bestDistance || (d === bestDistance && best && zone.root < best.root)) {
      best = zone;
      bestDistance = d;
    }
  }
  return best;
}

/** Join `base_url` and a zone file without doubling or dropping the slash. An
 *  absolute zone file overrides the base entirely. */
export function urlFor(manifest: SampleManifest, zone: SampleZone): string {
  if (/^([a-z]+:)?\/\//i.test(zone.file) || zone.file.startsWith('/')) return zone.file;
  const base = manifest.base_url.endsWith('/') ? manifest.base_url : manifest.base_url + '/';
  return base + zone.file.replace(/^\.?\//, '');
}

export function gainFromDb(db: number | undefined): number {
  return db === undefined ? 1 : Math.pow(10, db / 20);
}

/** What the engine should do for one note at one velocity, decided without
 *  touching the network — so it can be asserted in a test. */
export interface Selection {
  layerIndex: number;
  zone: SampleZone;
  url: string;
  /** Resampling ratio; 1 means the file is played at its recorded pitch. */
  rate: number;
  /** Linear gain from the layer's dB trim. */
  layerGain: number;
  /** How far the recording is being stretched, in semitones. */
  stretchSemitones: number;
}

/** null means "no recording is appropriate here" — the caller synthesizes.
 *  That is a normal outcome, not an error. */
export function select(manifest: SampleManifest, midi: number, velocity: number): Selection | null {
  const layer = layerFor(manifest, velocity);
  if (!layer) return null;
  const zone = zoneFor(layer, midi);
  if (!zone) return null;

  const stretch = midi - zone.root;
  if (manifest.max_stretch_semitones !== undefined
      && Math.abs(stretch) > manifest.max_stretch_semitones) {
    return null;
  }

  return {
    layerIndex: manifest.layers.indexOf(layer),
    zone,
    url: urlFor(manifest, zone),
    rate: Math.pow(2, stretch / 12),
    layerGain: gainFromDb(layer.gain_db),
    stretchSemitones: stretch,
  };
}

/** Stable cache key for a decoded buffer. Two notes that share a zone share
 *  one download — this is what makes the whole scheme cheap. */
export function cacheKey(selection: Selection): string {
  return `${selection.layerIndex}:${selection.zone.root}`;
}

// ── The library (async, cached, and never blocking) ─────────────────────────
//
// The rule that shapes this class: `acquire()` is SYNCHRONOUS and never waits.
// It answers with a decoded buffer if one is already in hand, and otherwise
// answers null while starting the download in the background. The caller
// synthesizes that note and moves on. Nothing about a missing sample is ever
// allowed to delay a note, because a piano that hesitates is not a piano.

export interface LoadResult {
  ok: boolean;
  manifest?: SampleManifest;
  /** Everything that went wrong, in plain language, for the UI to show. */
  errors: string[];
  warnings: string[];
}

export type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; arrayBuffer(): Promise<ArrayBuffer>; json(): Promise<unknown> }>;

/** Just enough of an AudioContext to decode. Keeps this testable in Node. */
export interface Decoder {
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>;
}

export interface LibraryStats {
  loaded: boolean;
  name: string | null;
  attribution: string | null;
  license: string | null;
  /** Zones decoded and ready. */
  ready: number;
  /** Zones downloading right now. */
  pending: number;
  /** Zones that failed and will not be retried. */
  failed: number;
  /** Total bytes of compressed audio fetched so far. */
  bytes: number;
}

/** Network hiccups get a second chance; a 404 does not — the file is not
 *  coming, and retrying it forever just burns a phone's battery. */
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 400;

export class SampleLibrary {
  private manifest: SampleManifest | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private inflight = new Map<string, Promise<void>>();
  private failed = new Set<string>();
  private bytes = 0;

  constructor(
    private decoder: Decoder,
    private fetchImpl: FetchLike = ((url: string) => fetch(url)) as FetchLike,
    /** Called whenever a sample lands, so the UI can refresh its counters. */
    private onChange: (stats: LibraryStats) => void = () => {},
  ) {}

  /** Fetch and validate a manifest. Never throws: a library that fails to load
   *  is a library that isn't used, not an app that breaks. */
  async load(manifestUrl: string): Promise<LoadResult> {
    let raw: unknown;
    try {
      const response = await this.fetchImpl(manifestUrl);
      if (!response.ok) {
        return { ok: false, errors: [`Manifest fetch failed: HTTP ${response.status} for ${manifestUrl}`], warnings: [] };
      }
      raw = await response.json();
    } catch (error) {
      // A wrong path on a single-page host answers 200 with index.html, so the
      // failure surfaces as a JSON parse error. Say what actually happened
      // rather than handing the reader a parser's complaint.
      const message = (error as Error).message;
      const looksLikeHtml = /Unexpected token '<'|<!DOCTYPE|is not valid JSON/i.test(message);
      return {
        ok: false,
        errors: [looksLikeHtml
          ? `${manifestUrl} did not return a manifest — the server answered with a web page, not JSON. Check the path.`
          : `Could not read ${manifestUrl}: ${message}`],
        warnings: [],
      };
    }

    const validation = validateManifest(raw);
    if (!validation.ok || !validation.manifest) {
      return { ok: false, errors: validation.errors, warnings: validation.warnings };
    }

    // Resolve relative base_url against the manifest's own location, so a
    // manifest can sit next to its audio and simply say "./".
    const manifest = { ...validation.manifest };
    if (!/^([a-z]+:)?\/\//i.test(manifest.base_url) && !manifest.base_url.startsWith('/')) {
      const dir = manifestUrl.replace(/[^/]*$/, '');
      manifest.base_url = dir + manifest.base_url.replace(/^\.?\//, '');
    }

    this.manifest = manifest;
    const warnings = [...validation.warnings];
    for (const [low, high] of velocityGaps(manifest)) {
      warnings.push(`Velocities ${low}–${high} have no layer; those strikes use synthesis.`);
    }
    this.onChange(this.stats());
    return { ok: true, manifest, errors: [], warnings };
  }

  get loaded(): boolean { return this.manifest !== null; }

  /** Forget everything and go back to pure synthesis. */
  unload(): void {
    this.manifest = null;
    this.buffers.clear();
    this.inflight.clear();
    this.failed.clear();
    this.bytes = 0;
    this.onChange(this.stats());
  }

  /**
   * The hot path. Returns a ready-to-play recording, or null to say
   * "synthesize this one" — while quietly starting the download so the NEXT
   * strike of this key is the real instrument.
   */
  acquire(midi: number, velocity: number): { buffer: AudioBuffer; rate: number; gain: number } | null {
    if (!this.manifest) return null;
    const selection = select(this.manifest, midi, velocity);
    if (!selection) return null;

    const key = cacheKey(selection);
    const buffer = this.buffers.get(key);
    if (buffer) return { buffer, rate: selection.rate, gain: selection.layerGain };

    if (!this.failed.has(key)) void this.fetchZone(key, selection.url);
    return null;
  }

  /** Warm specific notes ahead of time — the eight chord roots, say, right
   *  after the user's first tap, when the audio context is already alive. */
  async prefetch(midis: number[], velocities: number[]): Promise<void> {
    if (!this.manifest) return;
    const jobs = new Map<string, string>();
    for (const midi of midis) {
      for (const velocity of velocities) {
        const selection = select(this.manifest, midi, velocity);
        if (!selection) continue;
        const key = cacheKey(selection);
        if (this.buffers.has(key) || this.failed.has(key)) continue;
        jobs.set(key, selection.url);
      }
    }
    await Promise.all([...jobs].map(([key, url]) => this.fetchZone(key, url)));
  }

  private fetchZone(key: string, url: string): Promise<void> {
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const job = (async () => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const response = await this.fetchImpl(url);
          if (response.status === 404 || response.status === 403) {
            this.failed.add(key);
            return;
          }
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = await response.arrayBuffer();
          // decodeAudioData detaches the buffer, so measure before decoding.
          const size = data.byteLength;
          const decoded = await this.decoder.decodeAudioData(data);
          this.buffers.set(key, decoded);
          this.bytes += size;
          return;
        } catch {
          if (attempt === MAX_ATTEMPTS) { this.failed.add(key); return; }
          await new Promise(resolve => setTimeout(resolve, RETRY_BASE_MS * Math.pow(2, attempt - 1)));
        }
      }
    })().finally(() => {
      this.inflight.delete(key);
      this.onChange(this.stats());
    });

    this.inflight.set(key, job);
    return job;
  }

  stats(): LibraryStats {
    return {
      loaded: this.manifest !== null,
      name: this.manifest?.name ?? null,
      attribution: this.manifest?.attribution ?? null,
      license: this.manifest?.license ?? null,
      ready: this.buffers.size,
      pending: this.inflight.size,
      failed: this.failed.size,
      bytes: this.bytes,
    };
  }
}
