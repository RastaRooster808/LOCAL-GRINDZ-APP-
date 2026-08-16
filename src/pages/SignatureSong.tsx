import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { parsePoster, type PosterRead, type Note as PosterNote } from '../lib/posterParse';

/*
 * Kula Mele — the Color Piano & Signature Sign-In
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE. Original work; not for redistribution.
 */
// ── Kula Mele — the Color Piano & Signature Sign-In ──────────────────────────
// The full Hawaiian alphabet as "a piano made of colour": 5 vowels (A E I O U) +
// 7 consonants (H K L M N P W) + the ʻokina = 13 keys, coloured as one CONTINUOUS
// RAINBOW (hue flows 0→360 across the keys, so the board reads as a single world
// of colour). Spell a Hawaiian word and it becomes a melody of colour and light —
// your *signature song*. Play it back (by tapping, or by singing into the mic) to
// light yourself in; unlocking lands you into the realm of your uploaded image.
//
// HONEST SECURITY BOUNDARY: a short melody is low-entropy, so the signature song
// is an *accessible local unlock* — it selects/opens your profile on this device
// and lights up the screen. It is NOT a cryptographic account password and never
// protects the account from someone else. Real account security stays with
// Supabase's email magic-link (offered right after you light in). Front door of
// colour and light; real lock behind it.

interface Letter { ch: string; freq: number; color: string; hue: number; }

// HSL → #rrggbb (continuous-rainbow key colours are generated, never hand-picked).
function hslHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// The 13 Hawaiian letters + their pitches (a rising C-major run C4→A5 so any word
// sounds musical). The ʻokina (glottal stop) is the 13th key — a bright top note.
const ALPHABET: [string, number][] = [
  ['A', 261.63], ['E', 293.66], ['I', 329.63], ['O', 349.23], ['U', 392.00],
  ['H', 440.00], ['K', 493.88], ['L', 523.25], ['M', 587.33], ['N', 659.25],
  ['P', 698.46], ['W', 783.99], ['ʻ', 880.00],
];
// Colours flow as a continuous rainbow: hue = i / N · 360.
const LETTERS: Letter[] = ALPHABET.map(([ch, freq], i) => {
  const hue = (i / ALPHABET.length) * 360;
  return { ch, freq, hue, color: hslHex(hue, 0.82, 0.56) };
});
const IDX: Record<string, number> = Object.fromEntries(LETTERS.map((l, i) => [l.ch, i]));

// A few real Hawaiian words to spell as signatures (meanings kept modest/correct).
const WORDS: { w: string; mean: string }[] = [
  { w: 'ALOHA', mean: 'love · greeting' },
  { w: 'MAHALO', mean: 'thank you' },
  { w: 'PONO', mean: 'balance · righteousness' },
  { w: 'OHANA', mean: 'family' },
  { w: 'MELE', mean: 'song' },
  { w: 'HONU', mean: 'sea turtle' },
  { w: 'LANI', mean: 'sky · heaven' },
  { w: 'KAI', mean: 'sea' },
  { w: 'NALU', mean: 'wave' },
  { w: 'WAI', mean: 'fresh water' },
  { w: 'ʻĀINA', mean: 'land' },
];

const SIG_KEY = 'kulla_signature'; // kulla-prefixed → rides the KullaCoin cloud sync

/** Map a word to key slots: strip kahakō (macron) to the base vowel, fold any
 *  apostrophe form to the ʻokina key, keep the 13 supported letters. */
function wordToSeq(word: string): number[] {
  const clean = word
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // drop combining kahakō
    .replace(/[‘’'`]/g, 'ʻ')                          // any apostrophe → ʻokina
    .toUpperCase();
  const seq: number[] = [];
  for (const ch of clean) if (ch in IDX) seq.push(IDX[ch]);
  return seq;
}

/** Deterministic 32-bit FNV-1a hash — stable, so a signature always maps to the
 *  same point on the planet. */
function fnv32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

interface Coord { x: number; y: number; z: number; pitch: number; yaw: number; }
interface Spectrum {
  user_id: string;
  signature_word: string;
  generated_at: string;
  spectrum: { letter: string; color: string; freq: number }[];
  sequence_settings: { duration_seconds: number; fps: number };
  coordinates: { macro_space: Coord; meso_atmosphere: Coord; micro_ground: Coord };
}

// Build the `user_spectrum.json` the Unreal "Powers of Ten" LevelSequence script
// consumes (tools/unreal/generate_zoom_sequence.py). The zoom is anchored on
// HAWAIʻI (HST): everyone shares the same planet-scale macro view over the Big
// Island; the signature places one UNIQUE point on the island (micro), so the
// camera flies planet → atmosphere → this individual, somewhere on Hawaiʻi.
//
// Frame: Big Island local ENU — +X = East, +Y = North, +Z = Up, origin = island
// centre, meters × 100 = Unreal cm. (Place Hawaiʻi at the Unreal world origin, or
// apply your own offset in the level.) Footprint ≈ 150 km E-W × 130 km N-S;
// elevation runs sea level → Mauna Kea summit (≈4207 m).
const HI = {
  EW_CM: 15000000,   // 150 km E-W span (cm)
  NS_CM: 13000000,   // 130 km N-S span (cm)
  SUMMIT_CM: 420700, // Mauna Kea ≈ 4207 m, in cm
  EYE_CM: 170,       // standing eye height 1.7 m
  MACRO_Z: 200000000,   // 2000 km straight up — the whole archipelago/planet framing
  MESO_Z: 1200000,      // ≈12 km cruising altitude on descent
  FOL_RINGS: 6,         // Flower-of-Life lattice: rings of overlapping circles
};

// Flower-of-Life lattice nodes (triangular grid) within FOL_RINGS rings — the
// "sea of flower of life" the harmonic colour code lands you on. Built once.
const FOL_NODES: { a: number; b: number; ring: number }[] = (() => {
  const R = HI.FOL_RINGS, out: { a: number; b: number; ring: number }[] = [];
  for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) {
    const ring = (Math.abs(a) + Math.abs(b) + Math.abs(a + b)) / 2;
    if (ring <= R) out.push({ a, b, ring });
  }
  return out;
})();

function buildSpectrum(word: string, seq: number[]): Spectrum {
  const key = `${word}:${seq.join('')}`;
  const h = fnv32(key), h2 = fnv32('salt:' + key);
  const avgIdx = seq.reduce((a, b) => a + b, 0) / Math.max(1, seq.length);
  const yaw = Math.round((avgIdx / (LETTERS.length - 1)) * 360); // cumulative hue → heading

  // ── Harmonic colour code → a Flower-of-Life node ──────────────────────────
  // The signature's average PITCH picks the ring (higher notes → outer rings and
  // higher ground); its average HUE picks the seat around that ring. A small
  // hash jitter keeps colliding words distinct without leaving the node's cell.
  const fMin = LETTERS[0].freq, fMax = LETTERS[LETTERS.length - 1].freq;
  const avgFreq = seq.reduce((a, i) => a + LETTERS[i].freq, 0) / Math.max(1, seq.length);
  const pitchFrac = Math.min(1, Math.max(0, (avgFreq - fMin) / (fMax - fMin)));
  const ringTarget = Math.round(pitchFrac * HI.FOL_RINGS);
  const ringNodes = FOL_NODES.filter(n => n.ring === ringTarget);
  const hueFrac = avgIdx / (LETTERS.length - 1);
  const node = ringNodes[Math.floor(hueFrac * ringNodes.length) % ringNodes.length] || FOL_NODES[0];

  const spacingE = (HI.EW_CM / 2) / HI.FOL_RINGS;
  const spacingN = (HI.NS_CM / 2) / HI.FOL_RINGS;
  const jitterE = ((h % 1000) / 1000 - 0.5) * spacingE * 0.3;
  const jitterN = ((h2 % 1000) / 1000 - 0.5) * spacingN * 0.3;
  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
  const east  = Math.round(clamp((node.a + node.b * 0.5) * spacingE + jitterE, HI.EW_CM / 2));
  const north = Math.round(clamp(node.b * (Math.sqrt(3) / 2) * spacingN + jitterN, HI.NS_CM / 2));
  const elev  = Math.round(pitchFrac * HI.SUMMIT_CM); // harmonic altitude: sea level → summit

  const safeId = (word.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'PLAYER') + '_' + h.toString(16);
  return {
    user_id: safeId,
    signature_word: word,
    generated_at: new Date().toISOString(),
    spectrum: seq.map(i => ({ letter: LETTERS[i].ch, color: LETTERS[i].color, freq: LETTERS[i].freq })),
    sequence_settings: { duration_seconds: 8 + seq.length, fps: 30 },
    coordinates: {
      // Straight down over the island centre — the planet/archipelago view.
      macro_space:     { x: 0, y: 0, z: HI.MACRO_Z, pitch: -90, yaw: h % 360 },
      // Descending toward the person's quadrant, banking to their heading.
      meso_atmosphere: { x: Math.round(east * 0.4), y: Math.round(north * 0.4), z: HI.MESO_Z, pitch: -60, yaw },
      // The individual, standing on Hawaiʻi at their unique spot + elevation.
      micro_ground:    { x: east, y: north, z: elev + HI.EYE_CM, pitch: -8, yaw },
    },
  };
}

// ── Web Audio (bell-like note, reused across the page) ───────────────────────
let audioCtx: AudioContext | null = null;
function ac(): AudioContext {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}
function playNote(slot: number, when = 0, dur = 0.5, gain = 0.16, octave = 0) {
  const l = LETTERS[slot]; if (!l) return;
  const a = ac(); const t = a.currentTime + when;
  const base = l.freq * Math.pow(2, octave);
  for (const [mult, g, type] of [[1, gain, 'triangle'], [2, gain * 0.3, 'sine']] as const) {
    const o = a.createOscillator(), amp = a.createGain();
    o.type = type; o.frequency.value = base * mult;
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(g, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(amp).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
}

// ── Pitch detection — YIN (difference → CMNDF → threshold → parabolic) ───────
// The voice-accessibility path. YIN is octave-robust where a plain
// autocorrelation locks onto sub-/super-harmonics: it builds the squared
// difference function, normalises it cumulatively (CMNDF) so d'(0)=1, takes the
// first dip below an absolute threshold, then refines the lag with parabolic
// interpolation. Validated to resolve all 11 colour-keys through harmonics +
// noise. (A pYIN probabilistic pass + one-euro smoothing is the planned upgrade;
// this is honest, working DSP structured so it can be swapped in place.)
function detectPitch(buf: Float32Array, sampleRate: number): number {
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

/** Nearest colour-key to a frequency, within a cents tolerance (octave-strict). */
function freqToSlot(freq: number, tolCents = 130): number {
  if (freq <= 0) return -1;
  let best = -1, bestCents = Infinity;
  for (let i = 0; i < LETTERS.length; i++) {
    const cents = Math.abs(1200 * Math.log2(freq / LETTERS[i].freq));
    if (cents < bestCents) { bestCents = cents; best = i; }
  }
  return bestCents <= tolCents ? best : -1;
}

// ── The Flower — centrepiece of the tuner ────────────────────────────────────
// The Fruit of Life is exactly THIRTEEN circles: one centre, a ring of six, and
// an outer ring of six. That is a one-to-one seat for each Hawaiian key, so the
// tuner's face IS the sacred geometry — the same lattice the Powers of Ten export
// lands you on. Sing, and your note's circle blooms; the ring reports the cents.
interface TunerState { slot: number; cents: number; level: number; }

/** 13 circle centres in units of the circle radius r (centre, 6 inner, 6 outer). */
const FLOWER_POS: { x: number; y: number }[] = (() => {
  const p = [{ x: 0, y: 0 }];
  for (let i = 0; i < 6; i++) { const a = (i * 60) * Math.PI / 180; p.push({ x: 2 * Math.cos(a), y: 2 * Math.sin(a) }); }
  const d = 2 * Math.sqrt(3);
  for (let i = 0; i < 6; i++) { const a = (30 + i * 60) * Math.PI / 180; p.push({ x: d * Math.cos(a), y: d * Math.sin(a) }); }
  return p;
})();

/** #rrggbb + alpha → rgba(). */
function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function drawFlower(ctx: CanvasRenderingContext2D, size: number, st: TunerState, glowPhase: number) {
  const cx = size / 2, cy = size / 2, r = (size / 2) / 4.7;
  ctx.clearRect(0, 0, size, size);

  // The Flower of Life itself: circles of radius r on a triangular lattice of
  // spacing r, so they interlace into petals. Drawn very faintly — this is the
  // ground the thirteen seats rest on.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.055)';
  ctx.lineWidth = 1;
  const reach = 3.6;
  for (let j = -8; j <= 8; j++) {
    for (let i = -8; i <= 8; i++) {
      const px = (i + j / 2) * r, py = j * (Math.sqrt(3) / 2) * r;
      if (Math.hypot(px, py) > reach * r) continue;
      ctx.beginPath();
      ctx.arc(cx + px, cy + py, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // The thirteen seats — one circle per key.
  for (let i = 0; i < FLOWER_POS.length; i++) {
    const P = FLOWER_POS[i], L = LETTERS[i];
    const x = cx + P.x * r, y = cy + P.y * r;
    const active = i === st.slot;
    ctx.save();
    if (active) { ctx.shadowColor = L.color; ctx.shadowBlur = 18 + 10 * glowPhase; }
    ctx.beginPath();
    ctx.arc(x, y, active ? r * (1 + 0.05 * glowPhase) : r, 0, Math.PI * 2);
    ctx.fillStyle = active ? hexA(L.color, 0.82) : hexA(L.color, 0.11);
    ctx.fill();
    ctx.lineWidth = active ? 2.5 : 1;
    ctx.strokeStyle = active ? 'rgba(255,255,255,0.95)' : hexA(L.color, 0.4);
    ctx.stroke();
    ctx.restore();

    if (active) {
      // Cents arc: sweeps right when sharp, left when flat; green when in tune.
      const inTune = Math.abs(st.cents) <= 8;
      const sweep = Math.max(-1, Math.min(1, st.cents / 50)) * Math.PI * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.45, -Math.PI / 2, -Math.PI / 2 + (sweep || 0.001), sweep < 0);
      ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.strokeStyle = inTune ? '#39d98a' : '#ffd166';
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = `700 ${Math.round(r * 0.95)}px system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(L.ch, x, y + r * 0.04);
    }
  }
}

type Mode = 'play' | 'enroll' | 'signin';

export function SignatureSong() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('play');
  const [sig, setSig] = useState<{ word: string; seq: number[] } | null>(null);
  const [enrollWord, setEnrollWord] = useState('ALOHA');
  const [active, setActive] = useState<number | null>(null);       // key currently lit
  const [attempt, setAttempt] = useState<number[]>([]);            // sign-in taps so far
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'' | 'ok' | 'err'>('');
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string>('');                 // live voice announce
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [poster, setPoster] = useState<PosterRead | null>(null);
  const [posterBusy, setPosterBusy] = useState(false);
  const [posterRow, setPosterRow] = useState(0);

  const litTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flowerRef = useRef<HTMLCanvasElement>(null);
  const tunerRef = useRef<TunerState & { seen: number }>({ slot: -1, cents: 0, level: 0, seen: 0 });
  const micRef = useRef<{ stream: MediaStream; ctx: AudioContext; raf: number } | null>(null);
  const voiceState = useRef<{ lastSlot: number; stable: number; frames: number }>({ lastSlot: -1, stable: 0, frames: 0 });

  useEffect(() => { trackEvent('page_view', { section: 'signature' }); }, []);

  // Load an enrolled signature (local; cloud-synced via the kulla_ prefix).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIG_KEY);
      if (raw) { const p = JSON.parse(raw); if (p && Array.isArray(p.seq)) { setSig(p); setMode('signin'); } }
    } catch { /* ignore */ }
  }, []);

  const flash = useCallback((slot: number, dur = 380) => {
    setActive(slot);
    if (litTimer.current) clearTimeout(litTimer.current);
    litTimer.current = setTimeout(() => setActive(null), dur);
  }, []);

  const playSeq = useCallback((seq: number[]) => {
    ac();
    seq.forEach((s, i) => {
      playNote(s, i * 0.42);
      setTimeout(() => flash(s), i * 420);
    });
  }, [flash]);

  /** Play colour-notes with their octaves — how the poster actually sounds. */
  const playNotes = useCallback((notes: PosterNote[]) => {
    ac();
    notes.forEach((n, i) => {
      playNote(n.slot, i * 0.42, 0.5, 0.16, n.octave);
      setTimeout(() => flash(n.slot), i * 420);
    });
  }, [flash]);

  // Tap / recognise a single key, routing into whichever mode is active.
  const hitKey = useCallback((slot: number) => {
    playNote(slot); flash(slot);
    if (mode !== 'signin' || !sig || unlocked) return;
    setAttempt(prev => {
      const next = [...prev, slot];
      // Compare against the signature prefix; wrong note = gentle reset, no penalty.
      const ok = sig.seq.slice(0, next.length).every((v, i) => v === next[i]);
      if (!ok) { setStatus('Not quite — try again.'); setStatusKind('err'); return []; }
      if (next.length === sig.seq.length) {
        setUnlocked(true); setStatus(''); setStatusKind('');
        playSeq(sig.seq);
        trackEvent('signature_unlock', { by: 'tap' });
        return [];
      }
      setStatus(''); setStatusKind('');
      return next;
    });
  }, [mode, sig, unlocked, flash, playSeq]);

  // Keep a ref of hitKey so the mic loop always calls the latest closure.
  const hitKeyRef = useRef(hitKey);
  useEffect(() => { hitKeyRef.current = hitKey; }, [hitKey]);

  const stopMic = useCallback(() => {
    const m = micRef.current; if (!m) return;
    cancelAnimationFrame(m.raf);
    m.stream.getTracks().forEach(t => t.stop());
    void m.ctx.close();
    micRef.current = null;
    setListening(false);
  }, []);

  const startMic = useCallback(async () => {
    if (micRef.current) { stopMic(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      voiceState.current = { lastSlot: -1, stable: 0, frames: 0 };
      setListening(true); setHeard('');

      const loop = () => {
        analyser.getFloatTimeDomainData(buf);
        const f = detectPitch(buf, ctx.sampleRate);
        const slot = freqToSlot(f);

        // Feed the flower: exact cents off the key, with a short hold so the
        // bloom doesn't flicker between breaths.
        const now = performance.now();
        if (slot >= 0) {
          tunerRef.current = { slot, cents: 1200 * Math.log2(f / LETTERS[slot].freq), level: 1, seen: now };
        } else if (now - tunerRef.current.seen > 400) {
          tunerRef.current = { slot: -1, cents: 0, level: 0, seen: tunerRef.current.seen };
        }

        const vs = voiceState.current;
        if (slot >= 0 && slot === vs.lastSlot) vs.stable++;
        else { vs.lastSlot = slot; vs.stable = slot >= 0 ? 1 : 0; }
        // A note held ~4 frames counts as "sung"; require a gap before re-firing.
        if (vs.stable === 4) {
          setHeard(`${LETTERS[slot].ch}`);
          hitKeyRef.current(slot);
          vs.frames = 0;
        }
        if (slot < 0) vs.frames++;
        if (micRef.current) micRef.current.raf = requestAnimationFrame(loop);
      };
      micRef.current = { stream, ctx, raf: requestAnimationFrame(loop) };
    } catch {
      setStatus('Microphone unavailable — tap the colours instead.'); setStatusKind('err');
    }
  }, [stopMic]);

  useEffect(() => () => { if (litTimer.current) clearTimeout(litTimer.current); stopMic(); }, [stopMic]);

  // Paint the flower. Runs while the tuner is on screen; the glow pulses only
  // when a note is actually being held (and never under reduced-motion).
  useEffect(() => {
    if (mode !== 'signin') return;
    const cv = flowerRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const paint = () => {
      const css = cv.clientWidth || 260;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const px = Math.round(css * dpr);
      // Check BOTH axes: a <canvas> defaults to 300×150, so guarding on width
      // alone silently leaves the height at 150 and squashes the drawing.
      if (cv.width !== px || cv.height !== px) { cv.width = px; cv.height = px; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const st = tunerRef.current;
      const phase = (!calm && st.slot >= 0) ? (Math.sin(performance.now() / 260) + 1) / 2 : 0;
      drawFlower(ctx, css, st, phase);
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const saveSignature = useCallback(() => {
    const seq = wordToSeq(enrollWord);
    if (seq.length < 2) { setStatus('Use at least two supported letters (A E I O U H K L M N P).'); setStatusKind('err'); return; }
    const rec = { word: enrollWord.toUpperCase(), seq };
    try { localStorage.setItem(SIG_KEY, JSON.stringify(rec)); } catch { /* quota */ }
    setSig(rec); setStatus('Signature saved. Play it back to light in.'); setStatusKind('ok');
    setMode('signin'); setAttempt([]); setUnlocked(false);
    playSeq(seq);
  }, [enrollWord, playSeq]);

  const resetSignin = useCallback(() => { setAttempt([]); setUnlocked(false); setStatus(''); setStatusKind(''); }, []);

  const sendMagicLink = useCallback(async () => {
    const email = linkEmail.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setStatus('Enter a valid email.'); setStatusKind('err'); return; }
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/#/account` } });
      if (error) throw error;
      setStatus('Check your email for a secure sign-in link.'); setStatusKind('ok');
    } catch { setStatus('Could not send the link — try again.'); setStatusKind('err'); }
  }, [linkEmail]);

  const downloadSpectrum = useCallback(() => {
    if (!sig) return;
    const obj = buildSpectrum(sig.word, sig.seq);
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'user_spectrum.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    trackEvent('signature_unlock', { by: 'spectrum_export' });
  }, [sig]);

  const onPoster = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (posterUrl) URL.revokeObjectURL(posterUrl);
    setPosterUrl(URL.createObjectURL(file));
    setPoster(null); setPosterRow(0);
  }, [posterUrl]);

  // Decode the uploaded poster into a colour grid, then into notes.
  const readPoster = useCallback(async () => {
    if (!posterUrl) return;
    setPosterBusy(true); setStatus(''); setStatusKind('');
    try {
      const img = new Image();
      img.src = posterUrl;
      await img.decode();
      // Downscale for speed — plenty of resolution for ~20×26 swatches.
      const maxDim = 900;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('no canvas');
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const read = parsePoster(data, w, h, LETTERS.map(l => l.hue));
      setPoster(read); setPosterRow(0);
      if (!read.seq.length) { setStatus('No colour swatches found — try a straighter, brighter photo.'); setStatusKind('err'); }
      else { setStatus(`Read ${read.rows} × ${read.cols} — ${read.seq.length} notes.`); setStatusKind('ok'); }
    } catch {
      setStatus('Could not read that image.'); setStatusKind('err');
    } finally { setPosterBusy(false); }
  }, [posterUrl]);

  /** Notes in one row of the poster (rests dropped), capped to a playable phrase. */
  const rowNotes = useCallback((rowIdx: number, cap = 24): PosterNote[] => {
    if (!poster) return [];
    return poster.cells
      .filter(c => c.row === rowIdx && c.slot >= 0)
      .map(c => ({ slot: c.slot, octave: c.octave }))
      .slice(0, cap);
  }, [poster]);
  useEffect(() => () => { if (posterUrl) URL.revokeObjectURL(posterUrl); }, [posterUrl]);

  const enrollSeq = wordToSeq(enrollWord);

  return (
    <div className="sig-shell">
      <header className="sig-bar">
        <Link to="/" className="kc-back" aria-label="Back to Local Grindz">← Local Grindz</Link>
        <span className="sig-bar-title">Kula Mele</span>
        <Link to="/kullacoin" className="sig-bar-link">KullaCoin →</Link>
      </header>

      <section className="sig-hero">
        <h1>A piano made of colour</h1>
        <p>The thirteen letters of the Hawaiian alphabet, each a colour and a note — one continuous rainbow. Spell a word and it becomes your <b>signature song</b> of colour and light. Play it back to light yourself in.</p>
      </section>

      {/* The colour piano — 13 keys forming one continuous rainbow */}
      <div className="sig-piano" role="group" aria-label="Colour piano — the Hawaiian alphabet as a continuous rainbow">
        {LETTERS.map((l, i) => (
          <button
            key={l.ch}
            className={'sig-key' + (active === i ? ' lit' : '')}
            style={{ '--key': l.color } as React.CSSProperties}
            onClick={() => hitKey(i)}
            aria-label={`${l.ch === 'ʻ' ? 'ʻokina' : l.ch}, ${l.color}`}
          >
            <span className="sig-key-ch">{l.ch}</span>
          </button>
        ))}
      </div>

      <div className="sig-tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'play'} className={mode === 'play' ? 'on' : ''} onClick={() => setMode('play')}>Play</button>
        <button role="tab" aria-selected={mode === 'enroll'} className={mode === 'enroll' ? 'on' : ''} onClick={() => setMode('enroll')}>Enroll a signature</button>
        <button role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'on' : ''} onClick={() => { setMode('signin'); resetSignin(); }} disabled={!sig}>Sign in with your song</button>
      </div>

      {status && <p className={'sig-status ' + statusKind} aria-live="polite">{status}</p>}

      {mode === 'play' && (
        <section className="sig-panel">
          <p className="sig-lead">Tap the colours, or pick a word to hear it sing:</p>
          <div className="sig-words">
            {WORDS.map(({ w, mean }) => (
              <button key={w} className="sig-word" onClick={() => playSeq(wordToSeq(w))}>
                <span className="sig-word-w">{w}</span>
                <span className="sig-word-m">{mean}</span>
                <span className="sig-word-dots">{wordToSeq(w).map((s, i) => <i key={i} style={{ background: LETTERS[s].color }} />)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {mode === 'enroll' && (
        <section className="sig-panel">
          <label className="sig-label" htmlFor="sig-word">Your Hawaiian word (your name in Hawaiian letters works too)</label>
          <input id="sig-word" className="sig-input" value={enrollWord}
            onChange={e => setEnrollWord(e.target.value)} maxLength={24}
            placeholder="ALOHA" autoCapitalize="characters" />
          <div className="sig-preview" aria-label="Signature preview">
            {enrollSeq.length
              ? enrollSeq.map((s, i) => <span key={i} className="sig-dot" style={{ background: LETTERS[s].color }} title={LETTERS[s].ch}>{LETTERS[s].ch}</span>)
              : <span className="sig-muted">Type Hawaiian letters — A E I O U · H K L M N P W · ʻokina (apostrophe)</span>}
          </div>
          <div className="sig-actions">
            <button className="sig-btn" onClick={() => playSeq(enrollSeq)} disabled={enrollSeq.length < 1}>▶ Hear it</button>
            <button className="sig-btn primary" onClick={saveSignature} disabled={enrollSeq.length < 2}>Save my signature</button>
          </div>
          <div className="sig-suggest">
            Try: {WORDS.map(({ w }) => <button key={w} className="sig-chip" onClick={() => setEnrollWord(w)}>{w}</button>)}
          </div>
        </section>
      )}

      {mode === 'signin' && sig && (
        <section className="sig-panel">
          {!unlocked ? (
            <>
              <p className="sig-lead">Play your signature — <b>{sig.word}</b> — by tapping the colours or singing it.</p>

              {/* The tuner: the Fruit of Life, thirteen circles for thirteen keys. */}
              <div className="sig-tuner">
                <canvas ref={flowerRef} className="sig-flower" role="img"
                  aria-label="Flower tuner — thirteen circles, one per key; your sung note blooms on its circle" />
                <p className="sig-heard" aria-live="polite">
                  {listening ? (heard ? `Heard: ${heard}` : 'Sing a note…') : 'Tap 🎤 Sing it, and your note blooms.'}
                </p>
              </div>

              <div className="sig-progress" aria-label="Progress">
                {sig.seq.map((s, i) => (
                  <span key={i} className={'sig-pip' + (i < attempt.length ? ' done' : '')}
                    style={{ background: i < attempt.length ? LETTERS[s].color : undefined }} />
                ))}
              </div>
              <div className="sig-actions">
                <button className={'sig-btn' + (listening ? ' listening' : '')} onClick={startMic} aria-pressed={listening}>
                  {listening ? '● Listening…' : '🎤 Sing it'}
                </button>
                <button className="sig-btn" onClick={() => playSeq(sig.seq)}>▶ Remind me</button>
                <button className="sig-btn" onClick={resetSignin}>↺ Restart</button>
              </div>
            </>
          ) : (
            <div className={'sig-unlocked' + (posterUrl ? ' has-realm' : '')}
              style={posterUrl ? { ['--realm' as string]: `url(${posterUrl})` } as React.CSSProperties : undefined}>
              <div className="sig-realm-veil" aria-hidden="true" />
              <div className="sig-burst" aria-hidden="true">
                {LETTERS.map((l, i) => <i key={i} style={{ background: l.color, animationDelay: `${i * 40}ms` }} />)}
              </div>
              <h2>✨ Lit in — welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}!</h2>
              {posterUrl && <p className="sig-note sig-realm-note">You landed in the realm of your image.</p>}
              {user ? (
                <p className="sig-note">You're signed in and your progress is saving to the cloud.</p>
              ) : (
                <div className="sig-handoff">
                  <p className="sig-note">Your song opened your profile on this device. To secure the account across devices, get a one-tap email link:</p>
                  <div className="sig-actions">
                    <input className="sig-input" type="email" value={linkEmail} onChange={e => setLinkEmail(e.target.value)} placeholder="you@email.com" aria-label="Email for sign-in link" />
                    <button className="sig-btn primary" onClick={sendMagicLink}>Email me a link</button>
                  </div>
                </div>
              )}
              <button className="sig-btn" onClick={resetSignin}>Sign out of the song</button>
            </div>
          )}
          <p className="sig-change"><button className="sig-linkbtn" onClick={() => setMode('enroll')}>Change my signature</button></p>
        </section>
      )}

      {/* Powers of Ten — export the signature as user_spectrum.json for Unreal */}
      {sig && (
        <section className="sig-panel sig-powers">
          <h3 className="sig-h3">Powers of Ten</h3>
          <p className="sig-note sig-note-left">Your signature <b>{sig.word}</b> lands on one node of the flower-of-life lattice over Hawaiʻi — placed by its own harmonic colour code. Export it as <code>user_spectrum.json</code> to drive the Unreal “Powers of Ten” zoom — planet → atmosphere → you.</p>
          <button className="sig-btn primary" onClick={downloadSpectrum}>⬇ Download my spectrum</button>
          <p className="sig-muted sig-small">Feed it to <code>tools/unreal/generate_zoom_sequence.py</code> in the Unreal editor.</p>
        </section>
      )}

      {/* Poster / colour-code reference upload */}
      <section className="sig-panel sig-poster-panel">
        <label className="sig-label" htmlFor="sig-poster">Load your colour-code poster — read it, and land in it</label>
        <input id="sig-poster" className="sig-file" type="file" accept="image/*" onChange={onPoster} />
        {posterUrl && <img className="sig-poster" src={posterUrl} alt="Your uploaded colour-code / realm image" />}

        {posterUrl && (
          <div className="sig-actions">
            <button className="sig-btn primary" onClick={readPoster} disabled={posterBusy}>
              {posterBusy ? 'Reading…' : '🔍 Read the colours'}
            </button>
          </div>
        )}

        {poster && poster.cells.length > 0 && (
          <div className="sig-read">
            <p className="sig-note sig-note-left">
              Found a <b>{poster.rows} × {poster.cols}</b> grid — <b>{poster.seq.length}</b> colour-notes.
              Each row is a phrase; white paper and pencil read as rests.
            </p>
            <div className="sig-grid" style={{ gridTemplateColumns: `repeat(${poster.cols}, 1fr)` }} aria-hidden="true">
              {poster.cells.map((c, i) => (
                <span key={i}
                  className={'sig-gcell' + (c.row === posterRow ? ' on' : '') + (c.slot < 0 ? ' rest' : '')
                    + (c.slot >= 0 && c.octave < 0 ? ' oct-down' : '') + (c.slot >= 0 && c.octave > 0 ? ' oct-up' : '')}
                  style={{ background: c.slot >= 0 ? LETTERS[c.slot].color : 'transparent' }}
                  title={c.slot >= 0 ? `${LETTERS[c.slot].ch}${c.octave < 0 ? ' ▾' : c.octave > 0 ? ' ▴' : ''}` : 'rest'} />
              ))}
            </div>
            <div className="sig-actions">
              <button className="sig-btn" onClick={() => setPosterRow(r => Math.max(0, r - 1))} disabled={posterRow <= 0}>◀</button>
              <span className="sig-rowlab">Row {posterRow + 1} / {poster.rows}</span>
              <button className="sig-btn" onClick={() => setPosterRow(r => Math.min(poster.rows - 1, r + 1))} disabled={posterRow >= poster.rows - 1}>▶</button>
              <button className="sig-btn primary" onClick={() => playNotes(rowNotes(posterRow))} disabled={!rowNotes(posterRow).length}>▶ Play this row</button>
              <button className="sig-btn" onClick={() => {
                const notes = rowNotes(posterRow, 6);
                if (notes.length < 2) return;
                // Signatures stay octave-less: the 13 keys are what you tap back.
                const rec = { word: `POSTER R${posterRow + 1}`, seq: notes.map(n => n.slot) };
                try { localStorage.setItem(SIG_KEY, JSON.stringify(rec)); } catch { /* quota */ }
                setSig(rec); setMode('signin'); setAttempt([]); setUnlocked(false);
                setStatus('Signature taken from the poster. Play it back to light in.'); setStatusKind('ok');
                playSeq(rec.seq);
              }} disabled={rowNotes(posterRow, 6).length < 2}>Use as my signature</button>
            </div>
            <p className="sig-muted sig-small">
              Hue picks the key; <b>lightness picks the octave</b> — a deep ink sings an octave down (▾), a pastel an octave up (▴) — so a maroon and a bright red stay distinct. Straight-on, evenly lit photos read best.
            </p>
          </div>
        )}

        <p className="sig-muted sig-small">Your image is also the world you enter when you light in. It never leaves your device — reading happens right here in the browser.</p>
      </section>

      <p className="sig-security">
        <b>How the sign-in works:</b> your signature song is an <b>accessible unlock</b> that opens your profile on this device and lights up the screen — a friendly, verbal-first front door. It is not a password and cannot protect your account from someone else; real account security uses the emailed magic link above.
      </p>
    </div>
  );
}

export default SignatureSong;
