/*
 * Poster colour-code parser — image as source for Kula Mele.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// Reads a printed colour-code grid (e.g. the "TAS CODE" poster) straight off a
// photo or scan and turns it into a melody on the 13-key Hawaiian colour piano.
//
// Everything here is PURE — it takes raw RGBA bytes plus the image dimensions,
// so the same code runs in the browser (from a <canvas>) and in a headless test.
// The browser side is responsible only for decoding + downscaling the image.

export interface Hsl { h: number; s: number; l: number; }
/** A colour-note: which key (hue) and which octave (lightness). */
export interface Note { slot: number; octave: number; }
export interface Cell {
  row: number; col: number;
  r: number; g: number; b: number;
  hex: string;
  hsl: Hsl;
  /** Index into the palette, or -1 for a "rest" (grey/white/black/blank cell). */
  slot: number;
  /** -1 / 0 / +1 — a deep ink sings low, a pastel sings high. */
  octave: number;
}
export interface PosterRead {
  rows: number; cols: number;
  cells: Cell[];
  /** Row-major reading order, rests dropped — the melody (keys only). */
  seq: number[];
  /** The same melody with octaves — what the poster actually sounds like. */
  notes: Note[];
  /** Mean within-cell colour variance; low = the grid lines up well. */
  fit: number;
}

/** Largest grid the uniform fallback will consider (per axis). */
export const MAX_GRID = 12;
/** Below this saturation (or outside the lightness band) a cell reads as a rest. */
const REST_SAT = 0.15, REST_DARK = 0.10, REST_LIGHT = 0.93;
/** A pixel counts as "swatch ink" (vs paper/pencil) above this saturation. */
const INK_SAT = 0.25, INK_DARK = 0.12, INK_LIGHT = 0.90;

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === R) h = ((G - B) / d + (G < B ? 6 : 0));
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

export function toHex(r: number, g: number, b: number): string {
  const f = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}

/** Circular distance between two hues, in degrees (0–180). */
export function hueDist(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/**
 * Lightness → octave. Hue alone can't separate a bright red from a deep maroon:
 * they're the same key. Reading the ink's lightness as the octave restores the
 * distinction — deep inks sing an octave down, pastels an octave up — and matches
 * the coin model, where a Kulla is colour + octave + velocity.
 */
const OCT_DARK = 0.38, OCT_LIGHT = 0.62;
export function colorToOctave(hsl: Hsl): number {
  if (hsl.l < OCT_DARK) return -1;
  if (hsl.l > OCT_LIGHT) return 1;
  return 0;
}

/** Map one colour to a palette slot; -1 when it reads as a rest. */
export function colorToSlot(hsl: Hsl, hues: number[]): number {
  if (hsl.s < REST_SAT || hsl.l < REST_DARK || hsl.l > REST_LIGHT) return -1;
  let best = -1, bestD = Infinity;
  for (let i = 0; i < hues.length; i++) {
    const d = hueDist(hsl.h, hues[i]);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/** Mean colour + variance of one cell, sampled on an inset sub-lattice so grid
 *  lines and cell borders don't pollute the reading. */
function sampleCell(
  data: Uint8ClampedArray, w: number, h: number,
  x0: number, y0: number, x1: number, y1: number,
): { r: number; g: number; b: number; variance: number } {
  const insetX = (x1 - x0) * 0.2, insetY = (y1 - y0) * 0.2;
  const ax0 = x0 + insetX, ax1 = x1 - insetX, ay0 = y0 + insetY, ay1 = y1 - insetY;
  const N = 5;
  let sr = 0, sg = 0, sb = 0, qr = 0, qg = 0, qb = 0, n = 0;
  for (let iy = 0; iy < N; iy++) {
    for (let ix = 0; ix < N; ix++) {
      const px = Math.min(w - 1, Math.max(0, Math.round(ax0 + ((ix + 0.5) / N) * (ax1 - ax0))));
      const py = Math.min(h - 1, Math.max(0, Math.round(ay0 + ((iy + 0.5) / N) * (ay1 - ay0))));
      const o = (py * w + px) * 4;
      const r = data[o], g = data[o + 1], b = data[o + 2];
      sr += r; sg += g; sb += b;
      qr += r * r; qg += g * g; qb += b * b;
      n++;
    }
  }
  if (!n) return { r: 0, g: 0, b: 0, variance: 0 };
  const mr = sr / n, mg = sg / n, mb = sb / n;
  const variance = ((qr / n - mr * mr) + (qg / n - mg * mg) + (qb / n - mb * mb)) / 3;
  return { r: mr, g: mg, b: mb, variance };
}

/** Mean within-cell variance for a candidate grid — low means the cells are flat,
 *  i.e. the grid lines up with the printed squares. */
export function gridFit(data: Uint8ClampedArray, w: number, h: number, rows: number, cols: number): number {
  let total = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const s = sampleCell(data, w, h, (c * w) / cols, (r * h) / rows, ((c + 1) * w) / cols, ((r + 1) * h) / rows);
      total += s.variance;
    }
  }
  return total / (rows * cols);
}

/**
 * Guess the grid size. Scores every candidate by within-cell flatness, then
 * applies an elbow rule: take the SMALLEST grid that is nearly as flat as the
 * best one, so we don't overfit (any finer grid is trivially flatter).
 */
export function autoGrid(data: Uint8ClampedArray, w: number, h: number, max = MAX_GRID): { rows: number; cols: number } {
  const cands: { rows: number; cols: number; fit: number }[] = [];
  let bestFit = Infinity;
  for (let rows = 1; rows <= max; rows++) {
    for (let cols = 1; cols <= max; cols++) {
      const fit = gridFit(data, w, h, rows, cols);
      cands.push({ rows, cols, fit });
      if (fit < bestFit) bestFit = fit;
    }
  }
  const tol = Math.max(bestFit * 1.25, bestFit + 6);
  const ok = cands.filter(c => c.fit <= tol);
  ok.sort((a, b) => (a.rows * a.cols) - (b.rows * b.cols) || a.fit - b.fit);
  return ok.length ? { rows: ok[0].rows, cols: ok[0].cols } : { rows: 1, cols: 1 };
}

// ── Band detection: the real posters print saturated swatches separated by white
// paper, so projecting an "ink" mask onto each axis finds the columns and rows
// directly. This is O(w·h) and scales to hundreds of cells, where brute-force
// grid fitting does not — and it tolerates uneven cell spacing.

export interface Band { start: number; end: number; }

/** Fraction of "ink" pixels per column (axis 'x') or per row (axis 'y'). */
export function inkProfile(data: Uint8ClampedArray, w: number, h: number, axis: 'x' | 'y'): Float32Array {
  const n = axis === 'x' ? w : h, other = axis === 'x' ? h : w;
  const prof = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let hits = 0;
    for (let j = 0; j < other; j++) {
      const x = axis === 'x' ? i : j, y = axis === 'x' ? j : i;
      const o = (y * w + x) * 4;
      const hsl = rgbToHsl(data[o], data[o + 1], data[o + 2]);
      if (hsl.s >= INK_SAT && hsl.l >= INK_DARK && hsl.l <= INK_LIGHT) hits++;
    }
    prof[i] = hits / other;
  }
  return prof;
}

/** Runs of the profile above a relative threshold = one band per swatch column/row. */
export function findBands(prof: Float32Array): Band[] {
  let peak = 0;
  for (let i = 0; i < prof.length; i++) if (prof[i] > peak) peak = prof[i];
  if (peak <= 0) return [];
  const thr = Math.max(0.04, peak * 0.35);

  const raw: Band[] = [];
  let start = -1;
  for (let i = 0; i < prof.length; i++) {
    if (prof[i] >= thr) { if (start < 0) start = i; }
    else if (start >= 0) { raw.push({ start, end: i }); start = -1; }
  }
  if (start >= 0) raw.push({ start, end: prof.length });
  if (!raw.length) return [];

  // Drop slivers (glare, a stray pen stroke) relative to the typical band width.
  const widths = raw.map(b => b.end - b.start).sort((a, b) => a - b);
  const median = widths[Math.floor(widths.length / 2)];
  return raw.filter(b => (b.end - b.start) >= Math.max(2, median * 0.4));
}

/** Detect the swatch grid from ink bands. Returns empty bands if nothing found. */
export function detectBands(data: Uint8ClampedArray, w: number, h: number): { cols: Band[]; rows: Band[] } {
  return {
    cols: findBands(inkProfile(data, w, h, 'x')),
    rows: findBands(inkProfile(data, w, h, 'y')),
  };
}

/**
 * Read a poster image into cells + a melody.
 * - Default: detect swatch bands (best for real printed/photographed posters).
 * - Pass `rows`/`cols` to force a uniform grid instead (manual override).
 */
export function parsePoster(
  data: Uint8ClampedArray, w: number, h: number, hues: number[],
  opts: { rows?: number; cols?: number; mode?: 'bands' | 'uniform' } = {},
): PosterRead {
  const forced = !!(opts.rows && opts.cols);
  let colEdges: Band[], rowEdges: Band[];

  if (!forced && opts.mode !== 'uniform') {
    const b = detectBands(data, w, h);
    if (b.cols.length && b.rows.length) { colEdges = b.cols; rowEdges = b.rows; }
    else { const g = autoGrid(data, w, h); colEdges = uniformBands(w, g.cols); rowEdges = uniformBands(h, g.rows); }
  } else {
    const rows = opts.rows ?? autoGrid(data, w, h).rows;
    const cols = opts.cols ?? autoGrid(data, w, h).cols;
    colEdges = uniformBands(w, cols); rowEdges = uniformBands(h, rows);
  }

  const rows = rowEdges.length, cols = colEdges.length;
  const cells: Cell[] = [];
  let fitTotal = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const s = sampleCell(data, w, h, colEdges[c].start, rowEdges[r].start, colEdges[c].end, rowEdges[r].end);
      const hsl = rgbToHsl(s.r, s.g, s.b);
      fitTotal += s.variance;
      cells.push({
        row: r, col: c,
        r: Math.round(s.r), g: Math.round(s.g), b: Math.round(s.b),
        hex: toHex(s.r, s.g, s.b),
        hsl,
        slot: colorToSlot(hsl, hues),
        octave: colorToOctave(hsl),
      });
    }
  }
  const n = Math.max(1, rows * cols);
  const voiced = cells.filter(c => c.slot >= 0);
  return {
    rows, cols, cells,
    seq: voiced.map(c => c.slot),
    notes: voiced.map(c => ({ slot: c.slot, octave: c.octave })),
    fit: fitTotal / n,
  };
}

function uniformBands(size: number, count: number): Band[] {
  const out: Band[] = [];
  for (let i = 0; i < count; i++) out.push({ start: (i * size) / count, end: ((i + 1) * size) / count });
  return out;
}
