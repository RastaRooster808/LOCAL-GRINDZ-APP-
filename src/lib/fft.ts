/*
 * FFT and windowing — shared DSP primitives.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// Pulled out of vocalTrigger.ts so the pitch detector can use it too: YIN's
// difference function is a correlation, and computing it directly is O(W²),
// which is what capped the tuner's analysis window at 2048 samples and left it
// making octave errors on low voices.

// ── FFT (in-place, radix-2) ────────────────────────────────────────────────
/** Iterative Cooley–Tukey. `re`/`im` are modified in place; length must be a
 *  power of two. Written out rather than pulled in so the whole trigger path
 *  stays inspectable and dependency-free. */
export type FloatArray = Float32Array | Float64Array;

export function fft(re: FloatArray, im: FloatArray): void {
  const n = re.length;
  if (n <= 1) return;
  if ((n & (n - 1)) !== 0) throw new Error(`fft length must be a power of two, got ${n}`);

  // Bit-reversal permutation.
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k], ai = im[i + k];
        const br = re[i + k + len / 2], bi = im[i + k + len / 2];
        const tr = br * cr - bi * ci, ti = br * ci + bi * cr;
        re[i + k] = ar + tr;       im[i + k] = ai + ti;
        re[i + k + len / 2] = ar - tr; im[i + k + len / 2] = ai - ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

/** Hann window, cached per length — recomputing cosines every frame is the
 *  easiest way to make a real-time path miss its deadline. */
const HANN = new Map<number, Float32Array>();
export function hann(n: number): Float32Array {
  let w = HANN.get(n);
  if (!w) {
    w = new Float32Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    HANN.set(n, w);
  }
  return w;
}

/** Magnitude spectrum of one frame, bins 0..n/2. */
export function magnitudes(frame: Float32Array): Float32Array {
  const n = frame.length;
  const w = hann(n);
  const re = new Float32Array(n), im = new Float32Array(n);
  for (let i = 0; i < n; i++) re[i] = frame[i] * w[i];
  fft(re, im);
  const half = n / 2;
  const mag = new Float32Array(half);
  for (let i = 0; i < half; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}
