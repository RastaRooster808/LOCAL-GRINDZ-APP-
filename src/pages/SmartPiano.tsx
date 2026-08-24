/*
 * Smart Piano — chord wheel UI.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { PianoEngine } from '../lib/pianoEngine';
import type { LibraryStats } from '../lib/sampleLoader';
import {
  CHORDS, PATTERNS, STEPS_PER_BAR, MAX_POLYPHONY,
  voicingFor, velocityFromTouch, nextBoundary, secondsPerStep, secondsPerBar,
  type AutoplayState, type Zone, type Chord,
} from '../lib/smartPiano';

const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const noteName = (m: number) => `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** How far down its strip a pointer landed, 0 at the top and 1 at the bottom. */
function offsetIn(el: HTMLElement, clientY: number): number {
  const r = el.getBoundingClientRect();
  return r.height ? (clientY - r.top) / r.height : 0.5;
}

export function SmartPiano() {
  const engine = useRef<PianoEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [bpm, setBpm] = useState(96);
  const [sustain, setSustain] = useState(false);
  const [autoplay, setAutoplay] = useState<AutoplayState>(0);
  const [active, setActive] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [lastHit, setLastHit] = useState<{ chord: string; zone: Zone; velocity: number; notes: number[] } | null>(null);
  const [voices, setVoices] = useState(0);

  // ── The instrument itself: synthesis, or real recordings ─────────────────
  const [libStats, setLibStats] = useState<LibraryStats | null>(null);
  const [libUrl, setLibUrl] = useState(`${import.meta.env.BASE_URL}piano/fluidr3.manifest.json`);
  const [libState, setLibState] = useState<'idle' | 'loading' | 'on' | 'error'>('idle');
  const [libMessages, setLibMessages] = useState<string[]>([]);
  const [sampled, setSampled] = useState(false);

  // Scheduler state lives in refs — it runs on a timer, not on renders.
  const held = useRef<Map<string, number[]>>(new Map());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopStart = useRef(0);
  const nextStep = useRef(0);
  const activeChord = useRef<Chord | null>(null);
  const queued = useRef<{ chord: Chord; at: number } | null>(null);
  const autoRef = useRef<AutoplayState>(0);
  const bpmRef = useRef(96);

  useEffect(() => { trackEvent('page_view', { section: 'smart-piano' }); }, []);
  useEffect(() => { autoRef.current = autoplay; }, [autoplay]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  const boot = useCallback(async () => {
    if (!engine.current) {
      engine.current = new PianoEngine();
      engine.current.watchLibrary(setLibStats);
    }
    await engine.current.init();
    setReady(engine.current.ready);
  }, []);

  const loadLibrary = useCallback(async (url: string) => {
    await boot();
    const e = engine.current; if (!e) return;
    setLibState('loading');
    setLibMessages([]);
    const result = await e.useLibrary(url);
    if (!result.ok) {
      setLibState('error');
      // Say plainly what is still playing. A failed load changes nothing about
      // the instrument you already had.
      const stats = e.libraryStats();
      setLibMessages([...result.errors, stats?.loaded
        ? `Still playing ${stats.name}.`
        : 'Still playing the synthesized piano.']);
      return;
    }
    setLibState('on');
    setLibMessages(result.warnings);
    setLibStats(e.libraryStats());
    trackEvent('piano_library_loaded', { name: result.manifest?.name ?? 'unknown' });
    // Warm every note this wheel can reach, now that the context is alive and
    // the user is plainly about to play.
    const notes = new Set<number>();
    for (const chord of CHORDS) {
      for (const zone of ['BASS_HEAD', 'CHORD_BODY'] as Zone[]) {
        for (const n of voicingFor(chord, zone)) notes.add(n);
      }
    }
    void e.prefetch([...notes], [30, 70, 110]).then(() => setLibStats(e.libraryStats()));
  }, [boot]);

  const dropLibrary = useCallback(() => {
    engine.current?.unloadLibrary();
    setLibState('idle');
    setLibMessages([]);
    setLibStats(engine.current?.libraryStats() ?? null);
  }, []);

  useEffect(() => () => { engine.current?.close(); if (timer.current) clearInterval(timer.current); }, []);

  useEffect(() => {
    const e = engine.current; if (!e) return;
    e.sustain = sustain;
    if (!sustain) e.releaseSustained();
  }, [sustain]);

  // ── Manual play ───────────────────────────────────────────────────────────
  const strike = useCallback(async (chord: Chord, zone: Zone, ev: React.PointerEvent<HTMLElement>) => {
    // Read the event SYNCHRONOUSLY. React clears `currentTarget` once the handler
    // returns, so anything measured after an await is measured off null.
    const el = ev.currentTarget as HTMLElement;
    const velocity = velocityFromTouch({
      yOffsetNormalized: offsetIn(el, ev.clientY),
      // Pointer Events expose pressure; width/height give the contact patch.
      force: ev.pressure > 0 && ev.pressure !== 0.5 ? ev.pressure : undefined,
      radius: ev.width ? Math.max(ev.width, ev.height) / 2 : undefined,
    });
    try { el.setPointerCapture(ev.pointerId); } catch { /* not capturable */ }

    await boot();
    const e = engine.current; if (!e) return;
    const notes = voicingFor(chord, zone);
    const ids = notes.map(n => e.noteOn(n, velocity));
    held.current.set(`${chord.id}:${zone}`, ids);
    setLastHit({ chord: chord.id, zone, velocity, notes });
    setSampled(e.lastWasSampled);
    setVoices(e.voiceCount);

    if (autoRef.current !== 0) queueChord(chord);
  }, [boot]);

  const lift = useCallback((chord: Chord, zone: Zone) => {
    const e = engine.current; if (!e) return;
    const key = `${chord.id}:${zone}`;
    for (const id of held.current.get(key) ?? []) e.noteOff(id);
    held.current.delete(key);
    setVoices(e.voiceCount);
  }, []);

  // ── Autoplay ──────────────────────────────────────────────────────────────
  /** A tapped chord takes effect at the next bar, so the loop never breaks. */
  const queueChord = useCallback((chord: Chord) => {
    const e = engine.current; if (!e) return;
    if (!activeChord.current) { activeChord.current = chord; setActive(chord.id); return; }
    const at = nextBoundary(e.currentTime, loopStart.current, bpmRef.current, 'bar');
    queued.current = { chord, at };
    setPending(chord.id);
  }, []);

  const startLoop = useCallback(async (chord?: Chord) => {
    await boot();
    const e = engine.current; if (!e) return;
    if (chord) { activeChord.current = chord; setActive(chord.id); }
    if (!activeChord.current) { activeChord.current = CHORDS[4]; setActive(CHORDS[4].id); }
    loopStart.current = e.currentTime + 0.08;
    nextStep.current = 0;
    if (timer.current) clearInterval(timer.current);
    // Look ahead and schedule; a 25ms tick is far finer than a sixteenth.
    timer.current = setInterval(() => {
      const eng = engine.current; if (!eng) return;
      const pattern = PATTERNS[(autoRef.current || 1) as 1 | 2 | 3 | 4];
      const stepDur = secondsPerStep(bpmRef.current);
      const horizon = eng.currentTime + 0.12;
      while (loopStart.current + nextStep.current * stepDur < horizon) {
        const when = loopStart.current + nextStep.current * stepDur;
        const stepInBar = nextStep.current % STEPS_PER_BAR;
        // Swap chords exactly on the boundary we promised.
        if (queued.current && when >= queued.current.at - 1e-6) {
          activeChord.current = queued.current.chord;
          setActive(queued.current.chord.id);
          queued.current = null;
          setPending(null);
        }
        const ch = activeChord.current;
        if (ch) {
          const body = voicingFor(ch, 'CHORD_BODY');
          const bass = voicingFor(ch, 'BASS_HEAD')[0];
          for (const s of pattern) {
            if (s.step !== stepInBar) continue;
            const midi = s.voice < 0 ? bass : body[s.voice % body.length];
            eng.noteOn(midi, s.velocity, when);
          }
        }
        nextStep.current++;
      }
      setVoices(eng.voiceCount);
    }, 25);
  }, [boot]);

  const stopLoop = useCallback(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    queued.current = null; setPending(null);
    engine.current?.allNotesOff();
    setVoices(0);
  }, []);

  const setDial = useCallback(async (state: AutoplayState) => {
    setAutoplay(state);
    autoRef.current = state;
    if (state === 0) stopLoop(); else await startLoop(activeChord.current ?? undefined);
  }, [startLoop, stopLoop]);

  const barSeconds = secondsPerBar(bpm);

  return (
    <div className="sp-shell">
      <header className="sp-bar">
        <Link to="/" className="kc-back" aria-label="Back to Local Grindz">← Local Grindz</Link>
        <span className="sp-title">Smart Piano</span>
        <Link to="/signature" className="sp-link">Kula Mele →</Link>
      </header>

      <div className="sp-controls">
        <label className="sp-ctl">
          <span>Tempo</span>
          <input type="range" min={60} max={160} value={bpm} onChange={e => setBpm(+e.target.value)}
            aria-label="Tempo in beats per minute" />
          <b>{bpm} bpm</b>
        </label>

        <button className={'sp-toggle' + (sustain ? ' on' : '')} onClick={() => setSustain(s => !s)}
          aria-pressed={sustain}>Sustain {sustain ? 'on' : 'off'}</button>

        <div className="sp-dial" role="group" aria-label="Autoplay">
          <span>Autoplay</span>
          {([0, 1, 2, 3, 4] as AutoplayState[]).map(s => (
            <button key={s} className={'sp-dialbtn' + (autoplay === s ? ' on' : '')}
              onClick={() => setDial(s)} aria-pressed={autoplay === s}>
              {s === 0 ? 'off' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Always occupies its space — if this appeared and vanished, every key
          would jump under the player's finger the moment audio started. */}
      <p className="sp-hint" aria-hidden={ready}>{ready ? '\u00a0' : 'Touch a chord to start the sound.'}</p>

      <div className="sp-grid" role="group" aria-label="Chord columns">
        {CHORDS.map(chord => {
          const isActive = active === chord.id, isPending = pending === chord.id;
          return (
            <div key={chord.id} className={'sp-col' + (isActive ? ' active' : '') + (isPending ? ' pending' : '')}>
              <div className="sp-label">{chord.label}</div>
              {/* Bass head — a single root note, low. */}
              <div className="sp-zone sp-bass"
                onPointerDown={e => strike(chord, 'BASS_HEAD', e)}
                onPointerUp={() => lift(chord, 'BASS_HEAD')}
                onPointerCancel={() => lift(chord, 'BASS_HEAD')}
                role="button" tabIndex={0}
                aria-label={`${chord.label} bass`}>
                <span>bass</span>
              </div>
              {/* Chord body — the triad. Softer at the top, harder at the bottom. */}
              <div className="sp-zone sp-body"
                onPointerDown={e => strike(chord, 'CHORD_BODY', e)}
                onPointerUp={() => lift(chord, 'CHORD_BODY')}
                onPointerCancel={() => lift(chord, 'CHORD_BODY')}
                role="button" tabIndex={0}
                aria-label={`${chord.label} chord`}>
                <i className="sp-soft">soft</i>
                <i className="sp-hard">hard</i>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sp-readout" aria-live="polite">
        {lastHit ? (
          <>
            <b>{lastHit.chord}</b>
            <span>{lastHit.zone === 'BASS_HEAD' ? 'bass' : 'chord'}</span>
            <span>vel {lastHit.velocity}</span>
            <span>{lastHit.notes.map(noteName).join(' · ')}</span>
            <span>{sampled ? 'recorded piano' : 'synthesized'}</span>
          </>
        ) : <span className="sp-muted">Tap a column — lower on the strip plays harder.</span>}
        <span className="sp-voices">{voices}/{MAX_POLYPHONY} voices</span>
      </div>

      {autoplay !== 0 && (
        <p className="sp-muted sp-small">
          Pattern {autoplay} at {bpm} bpm — a bar is {barSeconds.toFixed(2)}s. Tapping another chord
          switches on the next bar{pending ? `, queued: ${pending}` : ''}.
        </p>
      )}


      <section className="sp-library">
        <h2 className="sp-lib-title">Instrument</h2>
        <p className="sp-lib-lede">
          It plays a synthesized piano out of the box — no download, no waiting. Load a
          real sample library and each note switches to the recording the first time
          you play it, one file at a time.
        </p>

        <div className="sp-lib-row">
          <input
            className="sp-lib-url"
            type="url"
            value={libUrl}
            onChange={e => setLibUrl(e.target.value)}
            aria-label="Sample manifest URL"
            spellCheck={false}
          />
          <button type="button" className="sp-lib-btn"
            onClick={() => void loadLibrary(libUrl)}
            disabled={libState === 'loading'}>
            {libState === 'loading' ? 'Loading…' : 'Load'}
          </button>
          {libStats?.loaded && (
            <button type="button" className="sp-lib-btn sp-lib-btn-quiet" onClick={dropLibrary}>
              Use synthesis
            </button>
          )}
        </div>

        {libMessages.length > 0 && (
          <ul className={`sp-lib-msgs ${libState === 'error' ? 'is-error' : ''}`}>
            {libMessages.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}

        {libStats?.loaded && (
          <>
            <dl className="sp-lib-stats">
              <div><dt>Library</dt><dd>{libStats.name}</dd></div>
              <div><dt>Licence</dt><dd>{libStats.license}</dd></div>
              <div><dt>Notes ready</dt><dd>{libStats.ready}</dd></div>
              <div><dt>Fetching</dt><dd>{libStats.pending}</dd></div>
              <div><dt>Unavailable</dt><dd>{libStats.failed}</dd></div>
              <div><dt>Downloaded</dt><dd>{formatBytes(libStats.bytes)}</dd></div>
            </dl>
            <p className="sp-lib-credit">{libStats.attribution}</p>
          </>
        )}

        <details className="sp-tech">
          <summary>How the loading works</summary>
          <p>
            Nothing is fetched until a note needs it. Striking a key asks the library
            for a recording; if it hasn&rsquo;t arrived, the note sounds synthesized
            immediately and the download starts behind it, so the next strike of that
            key is the real instrument. Neighbouring notes share one recording,
            pitch-shifted, which is why a full keyboard costs far fewer files than it
            has keys.
          </p>
          <p>
            A file that returns 404 is never retried. A network error is retried three
            times. A manifest that fails to load leaves the synthesized piano playing
            rather than breaking the page.
          </p>
          <p>
            To use a library you have downloaded, build its manifest with{' '}
            <code>node tools/piano/make-manifest.mjs &lt;folder&gt;</code> — see{' '}
            <code>docs/SAMPLE_LIBRARY.md</code>.
          </p>
        </details>
      </section>

      <p className="sp-note">
        Velocity is computed, not sensed: position down the strip sets it, and where a device reports
        pressure or contact size that nudges it. Louder hits are also brighter — gain rises as
        (velocity/127)² and the low-pass opens with it, so a hard strike gains overtones rather than
        just volume.
      </p>
    </div>
  );
}

export default SmartPiano;
