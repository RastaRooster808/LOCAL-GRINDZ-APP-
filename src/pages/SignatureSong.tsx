import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  parsePoster, readLinesDetailed, rankOrders,
  type PosterRead, type Note as PosterNote, type ReadOrder,
} from '../lib/posterParse';
import { buildScenePackage, buildSpectrumCard, type SpectrumCard } from '../lib/scenePackage';
import { alphabetNodes, toIndices } from '../lib/harmonics';

const ORDER_LABEL: Record<ReadOrder, string> = {
  'row': 'Rows →', 'col': 'Columns ↓', 'diag-down': 'Diagonal ↘', 'diag-up': 'Diagonal ↙',
};
const KIND_LABEL: Record<string, string> = {
  band: 'one colour along it (a stripe)',
  run: 'a rainbow run, a key at a time',
  mixed: 'some structure',
  scatter: 'no pattern',
};

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

// The keys come from the harmonic engine — NOT recomputed here. That is the whole
// point of the engine: one place decides every frequency and colour, so the
// keyboard, the tuner, the exported package and Unreal all agree exactly.
// Frequencies arrive at full precision (A = 261.6255653005986, not 261.63) and
// colours as gamut-mapped OKLCH, which steps evenly to the eye where HSL does not.
const LETTERS: Letter[] = alphabetNodes().map(n => ({
  ch: n.letter,
  freq: n.frequency_hz,
  hue: n.position * 360,
  color: n.color.hex,
}));
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

/** A friendly name from the signed-in address, for the welcome. */
function deriveName(email: string | undefined): string {
  return (email?.split('@')[0] || 'friend').slice(0, 24);
}

/** Canonical letters of a word as key indices — delegated to the engine so the
 *  folding rule (kahakō → base vowel, apostrophe → ʻokina) exists in one place. */
const wordToSeq = toIndices;

// Spectrum construction now lives in src/lib/scenePackage.ts, built on the
// harmonic engine. The former local buildSpectrum()/FOL/ORIGIN block was removed
// so no second implementation can drift from it.

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
    }

    // Every seat is named, so the flower doubles as the key map — the sounding
    // one bright, the rest legible but quiet.
    ctx.fillStyle = active ? '#ffffff' : hexA(L.color, 0.72);
    ctx.font = `${active ? 700 : 600} ${Math.round(r * (active ? 0.95 : 0.6))}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(L.ch, x, y + r * 0.04);
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
  // Arrival: a brief "being prepared" beat, then the space. `exploring` reveals
  // the instrument and creator surface only when asked for.
  const [preparing, setPreparing] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'' | 'ok' | 'err'>('');
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string>('');                 // live voice announce
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [spectrumText, setSpectrumText] = useState('');
  // The user-facing view of who they are — no operator detail in it.
  const card: SpectrumCard | null = useMemo(
    () => (sig ? buildSpectrumCard(sig.word) : null), [sig]);
  const [poster, setPoster] = useState<PosterRead | null>(null);
  const [posterBusy, setPosterBusy] = useState(false);
  const [posterRow, setPosterRow] = useState(0);
  const [readOrder, setReadOrder] = useState<ReadOrder>('row');

  const litTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flowerRef = useRef<HTMLCanvasElement>(null);
  // The poster photo with the reading drawn over it, and a playhead that walks
  // the line in time with the audio.
  const sheetRef = useRef<HTMLCanvasElement>(null);
  const sheetImgRef = useRef<HTMLImageElement | null>(null);
  const playRef = useRef<{ start: number; count: number; step: number } | null>(null);
  const sheetRaf = useRef(0);
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
        setPreparing(true); setExploring(false);
        setTimeout(() => setPreparing(false), 1600);
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

  const resetSignin = useCallback(() => {
    setAttempt([]); setUnlocked(false); setPreparing(false); setExploring(false);
    setStatus(''); setStatusKind('');
  }, []);

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
    let text = '';
    try {
      // v2 scene package — cameras, cuts, lens and palette, all from the engine.
      text = JSON.stringify(buildScenePackage(sig.word, user?.email ? deriveName(user.email) : undefined), null, 2);
    } catch {
      setStatus('Could not build the spectrum from this signature.'); setStatusKind('err');
      return;
    }
    // Always surface the JSON, so the spectrum is never trapped behind a download
    // that the browser may refuse — iOS in particular blocks programmatic blob
    // saves, and a phone has nowhere obvious to put a file.
    setSpectrumText(text);
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'harmonic_scene.json'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      // Give slower devices time to actually read the blob before revoking it.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setStatus('Spectrum ready — check your downloads, or copy it below.'); setStatusKind('ok');
    } catch {
      setStatus('Your browser blocked the download — copy the spectrum below instead.'); setStatusKind('err');
    }
    trackEvent('signature_unlock', { by: 'spectrum_export' });
  }, [sig, user]);

  /**
   * A poster generated FROM the signature — the inverse of reading one in. The
   * spectrum is the authoritative data, so an image is an output you can keep,
   * never an input required to enter your space. Laid out as a diagonal
   * progression, the same reading direction the printed sheets carry.
   */
  const generatePoster = useCallback(() => {
    if (!card) return;
    const cols = 14, rows = 18, cell = 78, pad = 90;
    const w = pad * 2 + cols * cell, h = pad * 2 + rows * cell + 120;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#fbf9f4'; ctx.fillRect(0, 0, w, h);

    const hexes = card.notes.map(n => n.hex);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = hexes[(c + r) % hexes.length];
        const x = pad + c * cell, y = pad + r * cell, s = cell * 0.72, rad = s * 0.22;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, s, s, rad) : ctx.rect(x, y, s, s);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#21301f';
    ctx.font = '600 44px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.canonical, w / 2, h - 92);
    ctx.font = '400 22px system-ui, sans-serif';
    ctx.fillStyle = '#7a8a70';
    ctx.fillText(`ring ${card.place.ring} · ${card.place.lat.toFixed(4)}°, ${card.place.lon.toFixed(4)}° · ${card.place.alt_m} m`, w / 2, h - 52);

    cv.toBlob(blob => {
      if (!blob) { setStatus('Could not render the poster.'); setStatusKind('err'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${card.canonical}-spectrum.png`; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setStatus('Your poster is ready.'); setStatusKind('ok');
    }, 'image/png');
  }, [card]);

  const copySpectrum = useCallback(async () => {
    if (!spectrumText) return;
    try {
      await navigator.clipboard.writeText(spectrumText);
      setStatus('Spectrum copied to your clipboard.'); setStatusKind('ok');
    } catch {
      setStatus('Copy blocked — select the text below and copy it by hand.'); setStatusKind('err');
    }
  }, [spectrumText]);

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
      sheetImgRef.current = img;   // keep it for the overlay
      setPoster(read); setPosterRow(0);
      if (!read.seq.length) { setStatus('No colour swatches found — try a straighter, brighter photo.'); setStatusKind('err'); }
      else { setStatus(`Read ${read.rows} × ${read.cols} — ${read.seq.length} notes.`); setStatusKind('ok'); }
    } catch {
      setStatus('Could not read that image.'); setStatusKind('err');
    } finally { setPosterBusy(false); }
  }, [posterUrl]);

  // Lines under the chosen reading direction, and how each direction behaves.
  const lines = useMemo(() => poster ? readLinesDetailed(poster, readOrder) : [], [poster, readOrder]);
  const ranked = useMemo(() => poster ? rankOrders(poster) : [], [poster]);
  const lineIdx = Math.min(posterRow, Math.max(0, lines.length - 1));
  const activeCells = useMemo(() => new Set(lines[lineIdx]?.cellIdx ?? []), [lines, lineIdx]);

  /** Notes in the current line, capped to a playable phrase. */
  const rowNotes = useCallback((idx: number, cap = 24): PosterNote[] =>
    (lines[idx]?.notes ?? []).slice(0, cap), [lines]);

  // ── The sheet: the photo itself, with the line being read drawn onto it ────
  // Everything is dimmed except the swatches of the current line, which are cut
  // back out of the veil, threaded together, and lit one at a time as they sound.
  const drawSheet = useCallback(() => {
    const cv = sheetRef.current, img = sheetImgRef.current, read = poster;
    if (!cv || !img || !read) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;

    const cssW = cv.clientWidth || 320;
    const scale = cssW / read.width;
    const cssH = Math.max(1, Math.round(read.height * scale));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pxW = Math.round(cssW * dpr), pxH = Math.round(cssH * dpr);
    if (cv.width !== pxW || cv.height !== pxH) { cv.width = pxW; cv.height = pxH; }
    cv.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.drawImage(img, 0, 0, cssW, cssH);

    const line = lines[lineIdx];
    if (!line) return;

    ctx.fillStyle = 'rgba(8,12,8,0.6)';
    ctx.fillRect(0, 0, cssW, cssH);

    const S = (v: number) => v * scale;
    const boxes = line.cellIdx.map(ci => read.cells[ci]).filter(Boolean)
      .map(c => ({ c, x: S(c.rect.x), y: S(c.rect.y), w: S(c.rect.w), h: S(c.rect.h) }));

    // Where the playhead is, from elapsed time against the audio's own step.
    const pl = playRef.current;
    let head = -1;
    if (pl) {
      head = Math.floor((performance.now() - pl.start) / 1000 / pl.step);
      if (head >= pl.count) { head = -1; playRef.current = null; }
    }

    // The thread through the line — this is what makes a diagonal read as a line.
    if (boxes.length > 1) {
      ctx.beginPath();
      boxes.forEach((b, i) => {
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        if (i) ctx.lineTo(cx, cy); else ctx.moveTo(cx, cy);
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = Math.max(1, S(2));
      ctx.stroke();
    }

    boxes.forEach((b, i) => {
      const on = i === head;
      // Cut the real swatch back out of the veil, so you see the actual ink.
      ctx.save();
      ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
      ctx.drawImage(img, 0, 0, cssW, cssH);
      ctx.restore();

      const col = b.c.slot >= 0 ? LETTERS[b.c.slot].color : '#9aa896';
      ctx.save();
      if (on) { ctx.shadowColor = col; ctx.shadowBlur = 20; ctx.lineWidth = Math.max(2, S(4)); ctx.strokeStyle = '#fff'; }
      else { ctx.lineWidth = Math.max(1, S(1.5)); ctx.strokeStyle = col; }
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    });
  }, [poster, lines, lineIdx]);

  /** Play a line and walk the playhead across the sheet in step with it. */
  const playLine = useCallback((idx: number) => {
    const notes = rowNotes(idx);
    if (!notes.length) return;
    playNotes(notes);
    playRef.current = { start: performance.now(), count: notes.length, step: 0.42 };
    cancelAnimationFrame(sheetRaf.current);
    const tick = () => {
      drawSheet();
      if (playRef.current) sheetRaf.current = requestAnimationFrame(tick);
    };
    sheetRaf.current = requestAnimationFrame(tick);
  }, [rowNotes, playNotes, drawSheet]);

  // Repaint when the reading, direction, or line changes.
  useEffect(() => { drawSheet(); }, [drawSheet]);
  useEffect(() => {
    const onResize = () => drawSheet();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(sheetRaf.current); };
  }, [drawSheet]);
  useEffect(() => () => { if (posterUrl) URL.revokeObjectURL(posterUrl); }, [posterUrl]);

  const enrollSeq = wordToSeq(enrollWord);

  return (
    <div className="sig-shell">
      <header className="sig-bar">
        <Link to="/" className="kc-back" aria-label="Back to Local Grindz">← Local Grindz</Link>
        <span className="sig-bar-title">Kula Mele</span>
        <Link to="/kullacoin" className="sig-bar-link">KullaCoin →</Link>
      </header>

      {/* The login IS the experience: identity resolves, the space appears. */}
      {unlocked && card ? (
        preparing ? (
          <section className="sig-hero sig-prep">
            <h1>Aloha</h1>
            <p>Your harmonic space is being prepared…</p>
            <div className="sig-prepbar" aria-hidden="true">
              {card.notes.map((n, i) => (
                <i key={i} style={{ background: n.hex, animationDelay: `${i * 110}ms` }} />
              ))}
            </div>
          </section>
        ) : (
          <section className="sig-space" aria-live="polite">
            <h1 className="sig-greet">Aloha{user?.email ? `, ${deriveName(user.email)}` : ''}.</h1>
            <p className="sig-ready">Your space is ready.</p>

            <div className="sig-field">
              <span className="sig-label-sm">Your signature</span>
              <span className="sig-sigword">{card.canonical}</span>
            </div>

            <div className="sig-field">
              <span className="sig-label-sm">Hawaiʻi anchor</span>
              <span className="sig-anchordot" aria-hidden="true" />
            </div>

            <div className="sig-field">
              <span className="sig-label-sm">Harmonic spectrum</span>
              <div className="sig-spectrum" role="img"
                aria-label={`Your spectrum: ${card.notes.map(n => n.letter).join(', ')}`}>
                {card.notes.map((n, i) => (
                  <span key={i} className="sig-band" style={{ background: n.hex, animationDelay: `${i * 90}ms` }} />
                ))}
              </div>
            </div>

            <button className="sig-explore" onClick={() => setExploring(e => !e)} aria-expanded={exploring}>
              {exploring ? 'Close' : 'Explore'}
            </button>
          </section>
        )
      ) : (
        <section className="sig-hero">
          <h1>Aloha</h1>
          <p>{sig ? 'Play your signature to continue.' : 'Choose a signature to continue — a Hawaiian word that becomes yours.'}</p>
        </section>
      )}

      {/* Below here is the instrument: how you sign in, and what a creator needs.
          Once you have arrived it stays out of the way until you ask for it. */}
      {(!unlocked || exploring) && (<>

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
              {/* The welcome lives in the hero above; this panel only carries what
                  still needs doing — securing the account across devices. */}
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

      {/* ── Everything below is creator/operator surface. It stays folded away:
             signing in is the whole experience, and nobody should need to know
             what a scene package is to use their own space. ────────────────── */}
      <details className="sig-tech">
        <summary>Technical details</summary>

      {sig && (
        <section className="sig-panel sig-powers">
          <h3 className="sig-h3">Unreal scene package</h3>
          <p className="sig-note sig-note-left">The creator-side artefact for <b>{sig.word}</b>: harmonic nodes, palette, the Hawaiʻi anchor, cameras, lens progression and camera cuts — everything the importer needs, built by the browser. Not something the player ever handles.</p>
          <div className="sig-actions">
            <button className="sig-btn primary" onClick={downloadSpectrum}>⬇ Scene package</button>
            {spectrumText && <button className="sig-btn" onClick={copySpectrum}>⧉ Copy</button>}
          </div>
          {spectrumText && (
            <details className="sig-spec">
              <summary>Package contents (copy this if the download didn't land)</summary>
              <textarea className="sig-spectext" readOnly rows={10} value={spectrumText}
                onFocus={e => e.currentTarget.select()} aria-label="harmonic scene package contents" />
            </details>
          )}
          <p className="sig-muted sig-small">In Unreal: <code>import_harmonic_scene(&quot;harmonic_scene.json&quot;)</code> — one call builds the cameras, cuts, lens animation and timeline.</p>
        </section>
      )}

      {/* Poster / colour-code reference upload */}
      <section className="sig-panel sig-poster-panel">
        {card && (
          <div className="sig-madeposter">
            <h3 className="sig-h3">Your poster</h3>
            <p className="sig-note sig-note-left">Made <b>from</b> your spectrum, not required to reach it — a keepsake in the same diagonal language the printed sheets use.</p>
            <button className="sig-btn primary" onClick={generatePoster}>⬇ Make my poster</button>
          </div>
        )}

        <h3 className="sig-h3 sig-readtitle">Read a printed sheet</h3>
        <p className="sig-note sig-note-left">A creator tool for turning an existing colour-code poster into notes. Optional — your space comes from your signature, never from an image.</p>
        <label className="sig-label" htmlFor="sig-poster">Choose a photo of a printed sheet</label>
        <input id="sig-poster" className="sig-file" type="file" accept="image/*" onChange={onPoster} />
        {posterUrl && !poster && <img className="sig-poster" src={posterUrl} alt="Your uploaded colour-code / realm image" />}
        {poster && (
          <figure className="sig-sheet">
            <canvas ref={sheetRef} className="sig-sheetcv" role="img"
              aria-label={`Your poster with line ${lineIdx + 1} of ${lines.length} marked, read ${ORDER_LABEL[readOrder]}`} />
            <figcaption>Line {lineIdx + 1} traced on the sheet — each swatch lights as it sounds.</figcaption>
          </figure>
        )}

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
                  className={'sig-gcell' + (activeCells.has(i) ? ' on' : '') + (c.slot < 0 ? ' rest' : '')
                    + (c.slot >= 0 && c.octave < 0 ? ' oct-down' : '') + (c.slot >= 0 && c.octave > 0 ? ' oct-up' : '')}
                  style={{ background: c.slot >= 0 ? LETTERS[c.slot].color : 'transparent' }}
                  title={c.slot >= 0 ? `${LETTERS[c.slot].ch}${c.octave < 0 ? ' ▾' : c.octave > 0 ? ' ▴' : ''}` : 'rest'} />
              ))}
            </div>

            <div className="sig-orders" role="group" aria-label="Reading direction">
              {(Object.keys(ORDER_LABEL) as ReadOrder[]).map(o => (
                <button key={o} className={'sig-chip' + (readOrder === o ? ' on' : '')}
                  onClick={() => { setReadOrder(o); setPosterRow(0); }}
                  aria-pressed={readOrder === o}>{ORDER_LABEL[o]}</button>
              ))}
            </div>

            <div className="sig-actions">
              <button className="sig-btn" onClick={() => setPosterRow(r => Math.max(0, r - 1))} disabled={lineIdx <= 0}>◀</button>
              <span className="sig-rowlab">Line {lineIdx + 1} / {lines.length}</span>
              <button className="sig-btn" onClick={() => setPosterRow(r => Math.min(lines.length - 1, r + 1))} disabled={lineIdx >= lines.length - 1}>▶</button>
              <button className="sig-btn primary" onClick={() => playLine(lineIdx)} disabled={!rowNotes(lineIdx).length}>▶ Play this line</button>
              <button className="sig-btn" onClick={() => {
                const notes = rowNotes(lineIdx, 6);
                if (notes.length < 2) return;
                // Signatures stay octave-less: the 13 keys are what you tap back.
                const rec = { word: `POSTER L${lineIdx + 1}`, seq: notes.map(n => n.slot) };
                try { localStorage.setItem(SIG_KEY, JSON.stringify(rec)); } catch { /* quota */ }
                setSig(rec); setMode('signin'); setAttempt([]); setUnlocked(false);
                setStatus('Signature taken from the poster. Play it back to light in.'); setStatusKind('ok');
                playSeq(rec.seq);
              }} disabled={rowNotes(lineIdx, 6).length < 2}>Use as my signature</button>
            </div>

            {ranked.length > 0 && (
              <div className="sig-struct">
                <p className="sig-note sig-note-left"><b>What the poster does in each direction</b> — read it whichever way sounds right; this only describes the pattern.</p>
                <ul className="sig-structlist">
                  {ranked.map(s => (
                    <li key={s.order} className={s.order === readOrder ? 'on' : ''}>
                      <button className="sig-linkbtn" onClick={() => { setReadOrder(s.order); setPosterRow(0); }}>{ORDER_LABEL[s.order]}</button>
                      <span className="sig-kind">{KIND_LABEL[s.kind]}</span>
                      <span className="sig-muted sig-small">{s.lines} lines · avg step {s.meanStep.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="sig-muted sig-small">
              Hue picks the key; <b>lightness picks the octave</b> — a deep ink sings an octave down (▾), a pastel an octave up (▴) — so a maroon and a bright red stay distinct. Straight-on, evenly lit photos read best.
            </p>
          </div>
        )}

        <p className="sig-muted sig-small">The image never leaves your device — reading happens right here in the browser.</p>
      </section>

      <p className="sig-security">
        <b>How the sign-in works:</b> your signature song is an <b>accessible unlock</b> that opens your profile on this device and lights up the screen — a friendly, verbal-first front door. It is not a password and cannot protect your account from someone else; real account security uses the emailed magic link.
      </p>
      </details>
      </>)}
    </div>
  );
}

export default SignatureSong;
