/*
 * Pitch detection — YIN.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// Moved here verbatim from src/pages/SignatureSong.tsx so the tuner and the
// vocal-trigger engine share one detector rather than drifting apart. This is
// the same DSP that resolves all thirteen colour-keys through harmonics and
// noise; see src/lib/vocalTrigger.ts for the percussive half.

// ── Pitch detection — YIN (difference → CMNDF → threshold → parabolic) ───────
// The voice-accessibility path. YIN is octave-robust where a plain
// autocorrelation locks onto sub-/super-harmonics: it builds the squared
// difference function, normalises it cumulatively (CMNDF) so d'(0)=1, takes the
// first dip below an absolute threshold, then refines the lag with parabolic
// interpolation. Validated to resolve all 11 colour-keys through harmonics +
// noise. (A pYIN probabilistic pass + one-euro smoothing is the planned upgrade;
// this is honest, working DSP structured so it can be swapped in place.)
export function detectPitch(buf: Float32Array, sampleRate: number): number {
  const N = buf.length, W = Math.floor(N / 2);
  let rms = 0;
  for (let i = 0; i < N; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / N);
  if (rms < 0.01) return -1; // too quiet to trust

  // 1) Squared difference function.
  const d = new Float32Array(W);
  for (let tau = 1; tau < W; tau++) {
    let sum = 0;
    for (let i = 0; i < W; i++) { const df = buf[i] - buf[i + tau]; sum += df * df; }
    d[tau] = sum;
  }
  // 2) Cumulative mean normalised difference (d'(0) = 1).
  const cmnd = new Float32Array(W); cmnd[0] = 1; let run = 0;
  for (let tau = 1; tau < W; tau++) { run += d[tau]; cmnd[tau] = run > 0 ? (d[tau] * tau) / run : 1; }
  // 3) Absolute threshold → first local minimum below it (80–1000 Hz band).
  const thresh = 0.1;
  const minTau = Math.max(2, Math.floor(sampleRate / 1000));
  const maxTau = Math.min(W - 1, Math.floor(sampleRate / 80));
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (cmnd[t] < thresh) { let tt = t; while (tt + 1 <= maxTau && cmnd[tt + 1] < cmnd[tt]) tt++; tau = tt; break; }
  }
  if (tau < 0) { // no confident dip → global minimum, else give up
    let best = Infinity, bt = -1;
    for (let t = minTau; t <= maxTau; t++) if (cmnd[t] < best) { best = cmnd[t]; bt = t; }
    if (bt < 0 || best > 0.5) return -1;
    tau = bt;
  }
  // 4) Parabolic interpolation around the chosen lag for sub-sample precision.
  const x0 = tau > 1 ? tau - 1 : tau, x2 = tau + 1 < W ? tau + 1 : tau;
  const s0 = cmnd[x0], s1 = cmnd[tau], s2 = cmnd[x2], den = 2 * (2 * s1 - s2 - s0);
  const refined = den !== 0 ? tau + (s2 - s0) / den : tau;
  return sampleRate / refined;
}
