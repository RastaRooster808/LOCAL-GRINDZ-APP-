/*
 * Voice leading — a bass line that doesn't sound amateurish.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// A signature is a melody. Played alone it is just notes; put a second voice
// under it and the pair has to obey the rules that separate composed music from
// arbitrary intervals. The one that matters most here is the HIDDEN (direct)
// OCTAVE: when the outer voices move in similar motion into an octave, the ear
// fills in the leap and hears a parallel octave that was never written.
//
//   forbidden   both outer voices LEAP in the same direction into an octave
//   allowed     the motion into the octave is downward
//   allowed     at least one voice arrives by step (a semitone or whole tone)
//
// The generator below refuses any bass note that would create the forbidden case,
// then prefers contrary motion and small steps among what remains.

/** A diatonic step: semitone or whole tone. */
export const STEP_MAX = 2;

export type Motion = 'similar' | 'contrary' | 'oblique';

export function motionOf(dSoprano: number, dBass: number): Motion {
  if (dSoprano === 0 || dBass === 0) return 'oblique';
  return Math.sign(dSoprano) === Math.sign(dBass) ? 'similar' : 'contrary';
}

/** Octave or unison — the interval the ear "fills in". */
export function isPerfectOctave(soprano: number, bass: number): boolean {
  return (soprano - bass) % 12 === 0;
}

/**
 * Does this pair of moves create a forbidden hidden octave?
 *
 * Forbidden only when ALL of these hold:
 *   - the voices arrive at an octave or unison,
 *   - they move in similar motion,
 *   - that motion is upward (descending into an octave is accepted),
 *   - and BOTH voices leap — no voice arrives by step.
 */
export function isForbiddenHiddenOctave(s1: number, b1: number, s2: number, b2: number): boolean {
  if (!isPerfectOctave(s2, b2)) return false;
  const ds = s2 - s1, db = b2 - b1;
  if (motionOf(ds, db) !== 'similar') return false;
  if (ds < 0 && db < 0) return false;                       // downward is acceptable
  if (Math.abs(ds) <= STEP_MAX || Math.abs(db) <= STEP_MAX) return false; // a voice steps
  return true;                                              // both leapt, upward, into an octave
}

/**
 * Consecutive perfect octaves/unisons or fifths in the outer voices — the other
 * classic fault, and the sibling of the hidden octave. Two voices that keep the
 * same perfect interval while both moving stop sounding like two voices.
 */
export function createsParallelPerfect(s1: number, b1: number, s2: number, b2: number): boolean {
  if (s1 === s2 && b1 === b2) return false;                 // a repeat, not motion
  if (motionOf(s2 - s1, b2 - b1) !== 'similar') return false;
  const i1 = ((s1 - b1) % 12 + 12) % 12, i2 = ((s2 - b2) % 12 + 12) % 12;
  if (i1 !== i2) return false;
  return i1 === 0 || i1 === 7;                              // octave/unison, or fifth
}

/** Consonant intervals a bass may sit below the melody, in semitones. */
const CONSONANT_BELOW = [12, 15, 16, 19, 20, 24, 27, 28, 31];  // 8ve, m3/M3, 5th, m6/M6, compound
const BASS_LOW = 36, BASS_HIGH = 57;                            // a comfortable bass register

export interface VoicedNote { soprano: number; bass: number; }

/**
 * Build a bass line under a melody (both as MIDI note numbers).
 *
 * Every candidate that would create a forbidden hidden octave is rejected
 * outright. Among the rest the cost favours, in order: contrary or oblique
 * motion, a bass that moves by step rather than leap, and staying mid-register.
 */
export function voiceLead(melody: number[]): VoicedNote[] {
  if (!melody.length) return [];
  const out: VoicedNote[] = [];

  const candidates = (s: number) =>
    CONSONANT_BELOW.map(i => s - i).filter(b => b >= BASS_LOW && b <= BASS_HIGH);

  // Opening note: no previous motion to judge, so just centre the register.
  const first = candidates(melody[0]);
  const mid = (BASS_LOW + BASS_HIGH) / 2;
  out.push({
    soprano: melody[0],
    bass: first.length ? first.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a)) : melody[0] - 12,
  });

  for (let i = 1; i < melody.length; i++) {
    const s2 = melody[i], s1 = melody[i - 1], b1 = out[i - 1].bass;
    const legal = candidates(s2).filter(b2 =>
      !isForbiddenHiddenOctave(s1, b1, s2, b2) && !createsParallelPerfect(s1, b1, s2, b2));
    const pool = legal.length ? legal : candidates(s2);   // never strand the line
    let best = pool[0], bestCost = Infinity;
    for (const b2 of pool) {
      const db = b2 - b1, ds = s2 - s1;
      const m = motionOf(ds, db);
      let cost = 0;
      if (m === 'similar') cost += 3;                     // similar motion is duller
      if (m === 'contrary') cost -= 2;                    // contrary is the good stuff
      cost += Math.abs(db) * 0.6;                         // prefer a bass that walks
      if (Math.abs(db) > 7) cost += 4;                    // discourage wide bass leaps
      cost += Math.abs(b2 - mid) * 0.05;                  // stay in register
      if (cost < bestCost) { bestCost = cost; best = b2; }
    }
    out.push({ soprano: s2, bass: best });
  }
  return out;
}

/** Audit a finished progression — used by tests and by anything that edits a line. */
export function findHiddenOctaves(voiced: VoicedNote[]): number[] {
  const bad: number[] = [];
  for (let i = 1; i < voiced.length; i++) {
    const a = voiced[i - 1], b = voiced[i];
    if (isForbiddenHiddenOctave(a.soprano, a.bass, b.soprano, b.bass)) bad.push(i);
  }
  return bad;
}

/** Parallel octaves/unisons — the other classic fault, worth reporting too. */
export function findParallelOctaves(voiced: VoicedNote[]): number[] {
  const bad: number[] = [];
  for (let i = 1; i < voiced.length; i++) {
    const a = voiced[i - 1], b = voiced[i];
    if (isPerfectOctave(a.soprano, a.bass) && isPerfectOctave(b.soprano, b.bass)
      && a.soprano !== b.soprano && motionOf(b.soprano - a.soprano, b.bass - a.bass) === 'similar') {
      bad.push(i);
    }
  }
  return bad;
}
