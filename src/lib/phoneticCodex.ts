/*
 * The Phonetic Codex — spoken syllables for melodic interval motion.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// A spoken layer laid under the score: one short syllable per interval a phrase
// moves through, so a line can be CALLED aloud as fluently as it is played. Its
// working purpose is live direction — cueing entrances, redirecting a phrase,
// flagging hidden notes, without stopping the music.
//
// Three rules, each from a documented mechanism:
//
//   1. CONSONANT = size of the jump.  Sound symbolism (bouba-kiki) sits mainly in
//      consonants: voiceless stops (p, k, ʻ) read sharp and abrupt; sonorants
//      (l, m, n, w, h) read smooth and round. Steps take sonorants, leaps stops.
//   2. VOWEL = direction.  Ohala's frequency code links high front vowels to high
//      pitch: ascending takes `i`, descending takes `o`.
//   3. LONG VOWEL (kahakō) = an implied tone.  Per the auditory continuity
//      illusion, listeners fill in a briefly missing tone; the codex flags a
//      hidden note by lengthening the vowel on the syllable BEFORE it.
//
// Built only from real Hawaiian phonemes, so it sits inside the ensemble's own
// language: consonants p k ʻ h m n l w; vowels a e i o u.

export type Direction = 'ascending' | 'descending' | 'sustain';
export type Size = 'sustain' | 'step' | 'small leap' | 'large leap' | 'largest leap';

export interface CodexEntry {
  /** Interval in semitones (0–12). */
  semitones: number;
  name: string;
  size: Size;
  consonant: string;
  ascending: string;
  descending: string;
  why: string;
}

/** The word bank, exactly as the codex defines it. */
export const WORD_BANK: CodexEntry[] = [
  { semitones: 0,  name: 'Unison',      size: 'sustain',      consonant: '—', ascending: 'a',  descending: 'a',  why: 'open, neutral, at rest' },
  { semitones: 1,  name: 'm2',          size: 'step',         consonant: 'l', ascending: 'li', descending: 'lo', why: 'sonorant = smooth, per bouba-kiki' },
  { semitones: 2,  name: 'M2',          size: 'step',         consonant: 'n', ascending: 'ni', descending: 'no', why: 'sonorant = smooth' },
  { semitones: 3,  name: 'm3',          size: 'small leap',   consonant: 'm', ascending: 'mi', descending: 'mo', why: 'nasal = a soft catch' },
  { semitones: 4,  name: 'M3',          size: 'small leap',   consonant: 'w', ascending: 'wi', descending: 'wo', why: 'approximant = gliding lift' },
  { semitones: 5,  name: 'P4',          size: 'small leap',   consonant: 'h', ascending: 'hi', descending: 'ho', why: 'breath = open transition' },
  { semitones: 7,  name: 'P5',          size: 'large leap',   consonant: 'p', ascending: 'pi', descending: 'po', why: 'voiceless stop = sharp, per bouba-kiki' },
  { semitones: 8,  name: 'm6',          size: 'large leap',   consonant: 'k', ascending: 'ki', descending: 'ko', why: 'voiceless stop = sharp' },
  { semitones: 9,  name: 'M6',          size: 'large leap',   consonant: 'k', ascending: 'ki', descending: 'ko', why: 'voiceless stop = sharp' },
  { semitones: 12, name: 'Octave',      size: 'largest leap', consonant: 'ʻ', ascending: 'ʻi', descending: 'ʻo', why: 'hardest stop Hawaiian has = arrival' },
];

/** Intervals the codex defines outright. 6, 10 and 11 are NOT among them. */
const DEFINED = new Set(WORD_BANK.map(e => e.semitones));

/** Long (kahakō) forms — the held breath that flags an implied tone. */
const LONG: Record<string, string> = { a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū' };
export function lengthen(syllable: string): string {
  const last = syllable.slice(-1);
  return LONG[last] ? syllable.slice(0, -1) + LONG[last] : syllable;
}

export interface Call {
  syllable: string;
  semitones: number;      // the signed interval actually moved
  reduced: number;        // folded into 0–12
  direction: Direction;
  size: Size;
  name: string;
  /** True when the codex has no entry for this interval and one was approximated. */
  approximate: boolean;
  /** True when this syllable was lengthened to flag an implied note after it. */
  implied: boolean;
}

/** Nearest defined interval, for the sizes the codex leaves open (6, 10, 11). */
function nearestDefined(reduced: number): number {
  let best = 0, bestDist = Infinity;
  for (const s of DEFINED) {
    const d = Math.abs(s - reduced);
    if (d < bestDist || (d === bestDist && s < best)) { bestDist = d; best = s; }
  }
  return best;
}

/**
 * The syllable for one move between two pitches (MIDI numbers).
 *
 * Compound intervals fold by octaves into 0–12, except that a true octave stays
 * an octave. The tritone and the sevenths (6, 10, 11) are genuinely absent from
 * the codex, so they are approximated to the nearest defined size and flagged —
 * never silently invented.
 */
export function callFor(fromMidi: number, toMidi: number): Call {
  const signed = toMidi - fromMidi;
  const abs = Math.abs(signed);
  // Fold compounds down, but keep a plain octave as an octave.
  let reduced = abs === 0 ? 0 : abs % 12 === 0 ? 12 : abs % 12;
  if (abs < 12 && abs % 12 !== 0) reduced = abs;
  const approximate = !DEFINED.has(reduced);
  const lookup = approximate ? nearestDefined(reduced) : reduced;
  const entry = WORD_BANK.find(e => e.semitones === lookup) as CodexEntry;
  const direction: Direction = signed === 0 ? 'sustain' : signed > 0 ? 'ascending' : 'descending';
  return {
    syllable: direction === 'descending' ? entry.descending : entry.ascending,
    semitones: signed,
    reduced,
    direction,
    size: entry.size,
    name: entry.name,
    approximate,
    implied: false,
  };
}

/**
 * Call a whole phrase. `impliedAt` lists ZERO-BASED indices of notes that are
 * hidden or unsounded.
 *
 * A phrase of n notes produces n−1 syllables — the call names motion, not notes,
 * so `calls[j]` describes melody[j] → melody[j+1] and therefore LANDS on note
 * j+1. Rule 3 lengthens the syllable *before* the hidden note, which is the one
 * that lands on its predecessor: `calls[k - 2]` for a hidden note k. That is the
 * held breath cueing the ensemble to listen for a note not yet confirmed.
 */
export function callPhrase(melody: number[], impliedAt: number[] = []): Call[] {
  const calls: Call[] = [];
  for (let i = 1; i < melody.length; i++) calls.push(callFor(melody[i - 1], melody[i]));
  for (const k of impliedAt) {
    const warn = k - 2;                      // the syllable preceding the hidden note
    if (warn >= 0 && warn < calls.length) {
      calls[warn] = { ...calls[warn], syllable: lengthen(calls[warn].syllable), implied: true };
    }
  }
  return calls;
}

/** The spoken string, e.g. "li-no" or "pī-ʻi". */
export function callString(melody: number[], impliedAt: number[] = []): string {
  return callPhrase(melody, impliedAt).map(c => c.syllable).join('-');
}

// ── Direction register vs identity register ─────────────────────────────────
// Kula Mele is an ABSOLUTE cipher: a letter is always the same fixed pitch. The
// codex is a RELATIVE protocol: a syllable describes motion from whatever note is
// already sounding. Spoken "po" means leap down; the letters P and O in Kula Mele
// are two unrelated fixed pitches. Same sounds, opposite grammars — so they are
// kept in separate performance moments and never active in the same breath.
//
// The handoff: every Kula Mele signature closes with the ʻokina stop before the
// first codex call. That hard glottal break is the ensemble's cue that identity
// mode has ended and direction mode has begun.
export const HANDOFF_STOP = 'ʻ';

/** Does this signature close with the ʻokina that hands off to direction mode? */
export function closesWithHandoff(canonicalLetters: string): boolean {
  return canonicalLetters.slice(-1) === HANDOFF_STOP;
}
