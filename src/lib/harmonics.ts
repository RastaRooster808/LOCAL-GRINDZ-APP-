/*
 * Harmonic engine — the single source of truth for identity → spectrum.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// Identity in, spectrum out, deterministically:
//
//   identity → canonical characters → harmonic frequency → normalized position
//            → OKLCH colour → sRGB → Hawaiʻi lattice anchor
//
// Everything downstream (the web experience, the exported scene package, the
// Unreal importer) reads its numbers from HERE. Nothing recomputes a colour or a
// frequency on its own, so the browser and the engine cannot disagree.
//
// PRECISION RULE: frequencies are computed from equal temperament at full double
// precision and only rounded at display time. 261.6255653005986 is the value;
// 261.63 is a label. Rounding early is how two systems drift apart.

export const A4_HZ = 440;
export const A4_MIDI = 69;
/** Digits carried internally before any display rounding. */
export const FREQUENCY_PRECISION = 16;

/** The thirteen letters of the Hawaiian alphabet, with their MIDI pitches
 *  (C4 → A5, a rising run so any word climbs). */
export const ALPHABET: { ch: string; midi: number; note: string }[] = [
  { ch: 'A', midi: 60, note: 'C4' },
  { ch: 'E', midi: 62, note: 'D4' },
  { ch: 'I', midi: 64, note: 'E4' },
  { ch: 'O', midi: 65, note: 'F4' },
  { ch: 'U', midi: 67, note: 'G4' },
  { ch: 'H', midi: 69, note: 'A4' },
  { ch: 'K', midi: 71, note: 'B4' },
  { ch: 'L', midi: 72, note: 'C5' },
  { ch: 'M', midi: 74, note: 'D5' },
  { ch: 'N', midi: 76, note: 'E5' },
  { ch: 'P', midi: 77, note: 'F5' },
  { ch: 'W', midi: 79, note: 'G5' },
  { ch: 'ʻ', midi: 81, note: 'A5' },
];
export const KEY_COUNT = ALPHABET.length;
const INDEX_OF: Record<string, number> = Object.fromEntries(ALPHABET.map((l, i) => [l.ch, i]));

// ── 1. Canonical character normalization ────────────────────────────────────
/** Fold kahakō to the base vowel and any apostrophe to the ʻokina, then keep
 *  only supported letters. `ʻĀINA` → ['ʻ','A','I','N','A']. */
export function canonicalize(word: string): string[] {
  return [...word.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['‘’`]/g, 'ʻ').toUpperCase()]
    .filter(ch => ch in INDEX_OF);
}
/** Canonical letters as key indices. */
export function toIndices(word: string): number[] {
  return canonicalize(word).map(ch => INDEX_OF[ch]);
}

// ── 2. Harmonic frequency (equal temperament, full precision) ───────────────
export function frequencyOf(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12);
}

// ── 3-5. Colour: normalized position → OKLCH → sRGB ─────────────────────────
// A perceptually uniform space is the point: equal steps in hue read as equal
// steps of colour, which an HSL rainbow does not deliver.
// Vividness over uniform lightness, deliberately. Holding L fixed keeps the set
// perceptually even but caps chroma at whatever the WORST hue allows (~0.15) and
// forces yellow into olive, because yellow only reads as yellow when it is light.
// Instead each hue is taken to its most colourful point within a bounded
// lightness band: mean chroma 0.214 rather than 0.152, and the board reads as
// light rather than paint. The band keeps the set coherent — lightness roams, but
// only between these limits.
export const LIGHTNESS_BAND: [number, number] = [0.60, 0.86];
/** Asked-for chroma; always beyond the gamut so the search clamps to the real max. */
const CHROMA_PROBE = 0.40;

export interface Rgb { r: number; g: number; b: number; }
export interface OkColor {
  space: 'OKLCH';
  l: number; c: number; h: number;
  hex: string;
  rgb: Rgb;
}

function srgbGamma(x: number): number {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

/** OKLCH → linear sRGB. Returns channels that may fall outside [0,1]. */
function oklchToLinearSrgb(L: number, C: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

const inGamut = ([r, g, b]: [number, number, number]) =>
  r >= -1e-4 && r <= 1 + 1e-4 && g >= -1e-4 && g <= 1 + 1e-4 && b >= -1e-4 && b <= 1 + 1e-4;

/**
 * OKLCH → sRGB, reducing chroma until the colour fits the display gamut. Hue and
 * lightness are preserved; only saturation gives way, so the family of colours
 * stays perceptually even.
 */
export function oklch(L: number, C: number, hDeg: number): OkColor {
  let lo = 0, hi = C, lin = oklchToLinearSrgb(L, C, hDeg);
  if (!inGamut(lin)) {
    for (let i = 0; i < 24; i++) {           // binary search on chroma
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinearSrgb(L, mid, hDeg))) lo = mid; else hi = mid;
    }
    C = lo;
    lin = oklchToLinearSrgb(L, C, hDeg);
  }
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const rgb = {
    r: Math.round(clamp01(srgbGamma(clamp01(lin[0]))) * 255),
    g: Math.round(clamp01(srgbGamma(clamp01(lin[1]))) * 255),
    b: Math.round(clamp01(srgbGamma(clamp01(lin[2]))) * 255),
  };
  const hx = (v: number) => v.toString(16).padStart(2, '0');
  return {
    space: 'OKLCH',
    l: +L.toFixed(4), c: +C.toFixed(4), h: +hDeg.toFixed(4),
    hex: `#${hx(rgb.r)}${hx(rgb.g)}${hx(rgb.b)}`,
    rgb,
  };
}

// ── The node ────────────────────────────────────────────────────────────────
export interface HarmonicNode {
  index: number;
  letter: string;
  note: string;
  midi: number;
  /** Full double precision — round only for display. */
  frequency_hz: number;
  frequency_precision: number;
  /** Position of this key in the alphabet, 0..1. */
  position: number;
  color: OkColor;
}

/**
 * The most colourful sRGB rendering of a hue, searched across the lightness band.
 * `oklch` clamps chroma to the gamut, so probing beyond it returns each
 * lightness's true maximum; the brightest of those wins.
 */
export function mostVivid(hueDeg: number): OkColor {
  const [lo, hi] = LIGHTNESS_BAND;
  let best: OkColor | null = null;
  for (let L = lo; L <= hi + 1e-9; L += 0.005) {
    const candidate = oklch(L, CHROMA_PROBE, hueDeg);
    if (!best || candidate.c > best.c) best = candidate;
  }
  return best as OkColor;
}

const NODES: HarmonicNode[] = ALPHABET.map((l, i) => {
  const position = i / KEY_COUNT;
  return {
    index: i,
    letter: l.ch,
    note: l.note,
    midi: l.midi,
    frequency_hz: frequencyOf(l.midi),
    frequency_precision: FREQUENCY_PRECISION,
    position,
    color: mostVivid(position * 360),
  };
});

/** The full thirteen-key spectrum. Stable for the lifetime of the alphabet. */
export function alphabetNodes(): HarmonicNode[] { return NODES; }
/** One key's node. */
export function nodeAt(index: number): HarmonicNode | undefined { return NODES[index]; }
/** The nodes a signature spells, in order. */
export function spectrumFor(signature: string): HarmonicNode[] {
  return toIndices(signature).map(i => NODES[i]);
}

// ── Hawaiʻi anchor and the Flower-of-Life lattice ───────────────────────────
// Hawaiʻi is the ORIGIN of the space, not another colour input. Every placement
// below is expressed relative to it.
export const ANCHOR = {
  name: 'Hawaiʻi',
  coordinate_system: 'WGS84',
  role: 'origin' as const,
  lat: 19.5949,
  lon: -155.5028,
  frame: 'ENU (+X east, +Y north, +Z up)',
  units: 'cm',
};

export const LATTICE = {
  rings: 6,
  span_ew_cm: 15_000_000,   // ≈150 km, the island's east-west reach
  span_ns_cm: 13_000_000,   // ≈130 km
  summit_cm: 420_700,       // Mauna Kea
  eye_cm: 170,
};

/** Flower-of-Life node coordinates (triangular lattice), built once. */
const FOL: { a: number; b: number; ring: number }[] = (() => {
  const R = LATTICE.rings, out: { a: number; b: number; ring: number }[] = [];
  for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) {
    const ring = (Math.abs(a) + Math.abs(b) + Math.abs(a + b)) / 2;
    if (ring <= R) out.push({ a, b, ring });
  }
  return out;
})();

function fnv32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

export interface Placement {
  lattice: { rings: number; ring: number; a: number; b: number };
  /** Local ENU centimetres from the Hawaiʻi anchor. */
  local_enu_cm: { east: number; north: number; up: number };
  /** The same point in the world. */
  geodetic: { lat: number; lon: number; alt_m: number };
  heading_deg: number;
}

/**
 * Place a signature on the lattice. Its mean PITCH chooses the ring (and the
 * ground height); its mean HUE chooses the seat around that ring. A bounded hash
 * jitter separates signatures that would otherwise share a seat, without letting
 * either leave its cell.
 */
export function placementFor(signature: string): Placement {
  const nodes = spectrumFor(signature);
  const key = `${signature}:${nodes.map(n => n.index).join('')}`;
  const h = fnv32(key), h2 = fnv32('salt:' + key);

  const meanIndex = nodes.length ? nodes.reduce((s, n) => s + n.index, 0) / nodes.length : 0;
  const fMin = NODES[0].frequency_hz, fMax = NODES[KEY_COUNT - 1].frequency_hz;
  const meanFreq = nodes.length ? nodes.reduce((s, n) => s + n.frequency_hz, 0) / nodes.length : fMin;
  const pitchFrac = Math.min(1, Math.max(0, (meanFreq - fMin) / (fMax - fMin)));

  const ring = Math.round(pitchFrac * LATTICE.rings);
  const seats = FOL.filter(n => n.ring === ring);
  const hueFrac = KEY_COUNT > 1 ? meanIndex / (KEY_COUNT - 1) : 0;
  const seat = seats[Math.floor(hueFrac * seats.length) % seats.length] || FOL[0];

  const spE = (LATTICE.span_ew_cm / 2) / LATTICE.rings;
  const spN = (LATTICE.span_ns_cm / 2) / LATTICE.rings;
  const jE = ((h % 1000) / 1000 - 0.5) * spE * 0.3;
  const jN = ((h2 % 1000) / 1000 - 0.5) * spN * 0.3;
  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
  const east = Math.round(clamp((seat.a + seat.b * 0.5) * spE + jE, LATTICE.span_ew_cm / 2));
  const north = Math.round(clamp(seat.b * (Math.sqrt(3) / 2) * spN + jN, LATTICE.span_ns_cm / 2));
  const up = Math.round(pitchFrac * LATTICE.summit_cm) + LATTICE.eye_cm;

  return {
    lattice: { rings: LATTICE.rings, ring: seat.ring, a: seat.a, b: seat.b },
    local_enu_cm: { east, north, up },
    geodetic: {
      lat: +(ANCHOR.lat + (north / 100) / 111320).toFixed(6),
      lon: +(ANCHOR.lon + (east / 100) / (111320 * Math.cos((ANCHOR.lat * Math.PI) / 180))).toFixed(6),
      alt_m: Math.round((up - LATTICE.eye_cm) / 100),
    },
    heading_deg: Math.round(hueFrac * 360),
  };
}

/** Stable, asset-safe identifier for a signature (used to name Unreal assets). */
export function identityId(signature: string): string {
  const ascii = signature.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '');
  const key = `${signature}:${toIndices(signature).join('')}`;
  return `${(ascii.toUpperCase() || 'PLAYER')}_${fnv32(key).toString(16)}`;
}
