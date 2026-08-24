/*
 * Smart Piano — the chord wheel.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CHORDS, bassNote, voicing, velocityFromTouch, nextBoundary, clamp,
  type Chord, type Unit,
} from '../lib/smartPiano';
import { PianoEngine } from '../lib/pianoEngine';
import type { LibraryStats } from '../lib/sampleLoader';
import { alphabetNodes } from '../lib/harmonics';

/** The pads borrow the Kula Mele palette, so the whole app speaks one colour
 *  language. Nothing here invents a colour — see src/lib/harmonics.ts. */
const PAD_COLORS = alphabetNodes().slice(0, CHORDS.length).map(n => n.color.hex);

const BUILT_IN_MANIFEST = `${import.meta.env.BASE_URL}piano/fluidr3.manifest.json`;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SmartPiano() {
  const engineRef = useRef<PianoEngine | null>(null);
  const startedAtRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [unit, setUnit] = useState<Unit>('off');
  const [bpm, setBpm] = useState(96);
  const [lastHit, setLastHit] = useState<{ chord: string; velocity: number; sampled: boolean } | null>(null);

  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [libraryUrl, setLibraryUrl] = useState(BUILT_IN_MANIFEST);
  const [libraryState, setLibraryState] = useState<'idle' | 'loading' | 'on' | 'error'>('idle');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => () => { engineRef.current?.panic(); }, []);

  /** The AudioContext may only be created inside a user gesture. */
  const boot = useCallback(async () => {
    if (!engineRef.current) {
      const context = new (window.AudioContext
        || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      engineRef.current = new PianoEngine(context, setStats);
      startedAtRef.current = context.currentTime;
    }
    const engine = engineRef.current;
    if (engine.context.state === 'suspended') await engine.context.resume();
    engine.prepare();
    setReady(true);
    return engine;
  }, []);

  const loadLibrary = useCallback(async (url: string) => {
    const engine = await boot();
    setLibraryState('loading');
    setMessages([]);
    const result = await engine.useLibrary(url);
    if (!result.ok) {
      setLibraryState('error');
      // Say plainly what is still playing. A failed load changes nothing about
      // the instrument you already had.
      setMessages([...result.errors, engine.library.loaded
        ? `Still playing ${engine.library.stats().name}.`
        : 'Still playing the synthesized piano.']);
      return;
    }
    setLibraryState('on');
    setMessages(result.warnings);
    setStats(engine.library.stats());
    // Warm the notes this wheel will actually reach for, now that the context
    // is alive and the user is plainly about to play.
    const notes = CHORDS.flatMap(c => [bassNote(c), ...voicing(c)]);
    void engine.library.prefetch([...new Set(notes)], [30, 70, 110])
      .then(() => setStats(engine.library.stats()));
  }, [boot]);

  const unloadLibrary = useCallback(() => {
    engineRef.current?.library.unload();
    setLibraryState('idle');
    setMessages([]);
  }, []);

  const strike = useCallback(async (chord: Chord, ev: React.PointerEvent<HTMLButtonElement>) => {
    // Read the event SYNCHRONOUSLY. React clears `currentTarget` once the
    // handler returns, so anything measured after an `await` is measured off
    // null and every tap throws.
    const el = ev.currentTarget;
    const box = el.getBoundingClientRect();
    const velocity = velocityFromTouch({
      yOffsetNormalized: box.height ? (ev.clientY - box.top) / box.height : 0.5,
      radius: typeof ev.width === 'number' ? Math.max(ev.width, ev.height ?? 0) : undefined,
      pressure: ev.pressure,
      hasPressure: ev.pointerType === 'pen' || (ev.pressure > 0 && ev.pressure !== 0.5),
    });
    try { el.setPointerCapture(ev.pointerId); } catch { /* not every pointer can be captured */ }

    const engine = await boot();
    const at = nextBoundary(engine.context.currentTime, startedAtRef.current, bpm, unit);

    engine.strike({ midi: bassNote(chord), velocity: clamp(velocity - 10, 1, 127), when: at, duration: 3 });
    voicing(chord).forEach((midi, i) => {
      engine.strike({ midi, velocity, when: at + i * 0.012, duration: 2.6 });
    });

    const sampled = engine.library.acquire(voicing(chord)[0], velocity) !== null;
    setLastHit({ chord: chord.name, velocity, sampled });
  }, [boot, bpm, unit]);

  return (
    <div className="sp-shell">
      <header className="sp-bar">
        <Link to="/" className="kc-back" aria-label="Back to Local Grindz">← Local Grindz</Link>
        <span className="sp-bar-title">Smart Piano</span>
        <Link to="/signature" className="sp-bar-link">Kula Mele →</Link>
      </header>

      <p className="sp-hint" aria-live="polite">
        {/* This line always occupies its row. If it appeared and vanished on
            boot, every pad would jump 20px out from under a playing finger. */}
        {ready
          ? 'Strike near the top of a pad for a soft chord, near the bottom for a hard one.'
          : 'Touch a chord to start.'}
      </p>

      <div className="sp-wheel" role="group" aria-label="Chord wheel">
        {CHORDS.map((chord, i) => (
          <button
            key={chord.name}
            type="button"
            className="sp-pad"
            style={{ '--pad': PAD_COLORS[i] } as React.CSSProperties}
            onPointerDown={ev => { ev.preventDefault(); void strike(chord, ev); }}
            aria-label={`Play ${chord.name}`}
          >
            <span className="sp-pad-name">{chord.name}</span>
            <span className="sp-pad-soft" aria-hidden="true">soft</span>
            <span className="sp-pad-hard" aria-hidden="true">hard</span>
          </button>
        ))}
      </div>

      <div className="sp-controls">
        <label className="sp-control">
          <span>Quantize</span>
          <select value={unit} onChange={e => setUnit(e.target.value as Unit)}>
            <option value="off">Off — sounds instantly</option>
            <option value="beat">To the beat</option>
            <option value="bar">To the bar</option>
          </select>
        </label>
        <label className="sp-control">
          <span>Tempo — {bpm} BPM</span>
          <input type="range" min={60} max={140} value={bpm}
            onChange={e => setBpm(Number(e.target.value))} />
        </label>
      </div>

      <p className="sp-last" aria-live="polite">
        {lastHit
          ? `${lastHit.chord} · velocity ${lastHit.velocity} · ${lastHit.sampled ? 'recorded piano' : 'synthesized'}`
          : ' '}
      </p>

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
            value={libraryUrl}
            onChange={e => setLibraryUrl(e.target.value)}
            aria-label="Sample manifest URL"
            spellCheck={false}
          />
          <button type="button" className="sp-lib-btn"
            onClick={() => void loadLibrary(libraryUrl)}
            disabled={libraryState === 'loading'}>
            {libraryState === 'loading' ? 'Loading…' : 'Load'}
          </button>
          {libraryState === 'on' && (
            <button type="button" className="sp-lib-btn sp-lib-btn-quiet" onClick={unloadLibrary}>
              Use synthesis
            </button>
          )}
        </div>

        {messages.length > 0 && (
          <ul className={`sp-lib-msgs ${libraryState === 'error' ? 'is-error' : ''}`}>
            {messages.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}

        {stats?.loaded && (
          <dl className="sp-lib-stats">
            <div><dt>Library</dt><dd>{stats.name}</dd></div>
            <div><dt>Licence</dt><dd>{stats.license}</dd></div>
            <div><dt>Notes ready</dt><dd>{stats.ready}</dd></div>
            <div><dt>Fetching</dt><dd>{stats.pending}</dd></div>
            <div><dt>Unavailable</dt><dd>{stats.failed}</dd></div>
            <div><dt>Downloaded</dt><dd>{formatBytes(stats.bytes)}</dd></div>
          </dl>
        )}

        {stats?.attribution && (
          <p className="sp-lib-credit">
            {stats.attribution}
          </p>
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
            Build a manifest for a library you have downloaded with{' '}
            <code>node tools/piano/make-manifest.mjs &lt;folder&gt;</code>. See{' '}
            <code>docs/SAMPLE_LIBRARY.md</code>.
          </p>
        </details>
      </section>
    </div>
  );
}
