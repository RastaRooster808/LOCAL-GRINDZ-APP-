import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
// The KullaCoin experience is a self-contained mini-app embedded in an isolated
// iframe. A srcDoc iframe shares this page's origin, so it shares localStorage
// (wallet/progress/loops) and posts messages up to us — letting us cloud-sync
// and record leaderboard solves without changing game code.
import kullaHtml from './kullacoin.embed.html?raw';

const KEY_PREFIX = 'kulla';

function snapshotLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(KEY_PREFIX)) out[k] = localStorage.getItem(k) ?? '';
  }
  return out;
}
function writeLocal(data: Record<string, string>) {
  for (const [k, v] of Object.entries(data)) {
    if (k.startsWith(KEY_PREFIX) && typeof v === 'string') {
      try { localStorage.setItem(k, v); } catch { /* quota */ }
    }
  }
}
/** A playful, in-game-only achievement title from songs mastered (non-cashable). */
function achievement(n: number): string {
  if (n >= 108) return 'Kupuna Mele — all 108!';
  if (n >= 60) return 'Kumu Mele';
  if (n >= 30) return 'Kanaka Mele';
  if (n >= 15) return 'Mele Maker';
  if (n >= 5) return 'Hoa Mele';
  if (n >= 1) return 'Malihini';
  return 'New player';
}
function deriveName(email: string | undefined): string {
  try {
    const p = JSON.parse(localStorage.getItem('kulla_profile') || 'null');
    if (p && typeof p.name === 'string' && p.name.trim()) return p.name.trim().slice(0, 24);
  } catch { /* ignore */ }
  return (email?.split('@')[0] || 'Player').slice(0, 24);
}

type SyncState = 'off' | 'loading' | 'synced' | 'error';
interface Row { display_name: string; songs: number; rnk: number; }
interface DailyBoardRow { display_name: string; guesses: number; rnk: number; }
interface DailyRow { code: string; fb: string; }

// Daily challenge palette — mirrors the embed's COLORS (Blue/Gold/Red/Green).
const PAD_COLORS = ['#2a6fd0', '#e7a928', '#db3b2c', '#3fa06a'];
const PAD_NAMES = ['Blue', 'Gold', 'Red', 'Green'];
const MAX_GUESSES = 6;

/** UTC day, matching Postgres current_date, for the local history key. */
function dayKey(): string { return 'kulla_daily_hist_' + new Date().toISOString().slice(0, 10); }

export function KullaCoin() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const shared = params.get('s');
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState>('off');
  const [board, setBoard] = useState<Row[]>([]);
  const [mySongs, setMySongs] = useState(0);
  const [showBoard, setShowBoard] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myName = deriveName(user?.email);

  // Daily hidden-song challenge (Heardle-style; target stays server-side).
  const [showDaily, setShowDaily] = useState(false);
  const [pending, setPending] = useState<number[]>([]);
  const [dRows, setDRows] = useState<DailyRow[]>([]);
  const [dDone, setDDone] = useState(false);
  const [dSolved, setDSolved] = useState(false);
  const [dPlayers, setDPlayers] = useState(0);
  const [dBoard, setDBoard] = useState<DailyBoardRow[]>([]);
  const [dMsg, setDMsg] = useState('');
  const [dBusy, setDBusy] = useState(false);

  const preview = useCallback((code: string) => {
    if (!/^[0-3]{1,4}$/.test(code)) return;
    frameRef.current?.contentWindow?.postMessage({ type: 'kulla-note-preview', code: code.padEnd(4, code.slice(-1)) }, '*');
  }, []);

  const loadDaily = useCallback(async () => {
    try { const h = JSON.parse(localStorage.getItem(dayKey()) || '[]'); if (Array.isArray(h)) setDRows(h); } catch { /* ignore */ }
    try {
      const [stRes, bdRes] = await Promise.all([
        user ? supabase.rpc('kulla_daily_state') : Promise.resolve({ data: null }),
        supabase.rpc('kulla_daily_board', { p_limit: 15 }),
      ]);
      const st = stRes.data as { guesses?: number; solved?: boolean; players?: number } | null;
      if (st && typeof st === 'object') {
        setDSolved(!!st.solved);
        setDDone(!!st.solved || (st.guesses ?? 0) >= MAX_GUESSES);
        setDPlayers(st.players ?? 0);
      }
      if (Array.isArray(bdRes.data)) setDBoard(bdRes.data as DailyBoardRow[]);
    } catch { /* offline — keep local */ }
  }, [user]);

  const submitGuess = useCallback(async () => {
    if (!user) { setDMsg('Log in to play the daily challenge.'); return; }
    if (pending.length !== 4 || dDone || dBusy) return;
    const code = pending.join('');
    setDBusy(true); setDMsg('');
    try {
      const { data, error } = await supabase.rpc('kulla_daily_guess', { p_guess: code });
      if (error) throw error;
      const res = data as { done?: boolean; solved?: boolean; feedback?: string | null };
      if (res?.feedback) {
        setDRows(prev => {
          const next = [...prev, { code, fb: res.feedback as string }];
          try { localStorage.setItem(dayKey(), JSON.stringify(next)); } catch { /* quota */ }
          return next;
        });
      }
      setPending([]);
      setDSolved(!!res?.solved);
      setDDone(!!res?.done);
      if (res?.solved) setDMsg("🎉 You found today's song!");
      else if (res?.done) setDMsg('Out of guesses — a fresh song drops tomorrow.');
      loadDaily();
    } catch { setDMsg('Could not submit — try again.'); }
    finally { setDBusy(false); }
  }, [user, pending, dDone, dBusy, loadDaily]);

  const openDaily = useCallback(() => { setShowDaily(true); setDMsg(''); setPending([]); loadDaily(); }, [loadDaily]);

  useEffect(() => { trackEvent('page_view', { section: 'kullacoin' }); }, []);

  const saveNow = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('kulla_state').upsert({
        user_id: user.id, data: snapshotLocal(), updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSync('synced');
    } catch { setSync('error'); }
  }, [user]);

  const loadBoard = useCallback(async () => {
    try {
      const [{ data: rows }, { data: mine }] = await Promise.all([
        supabase.rpc('kulla_leaderboard', { p_limit: 25 }),
        user ? supabase.rpc('kulla_my_songs') : Promise.resolve({ data: 0 } as { data: number }),
      ]);
      if (Array.isArray(rows)) setBoard(rows as Row[]);
      if (typeof mine === 'number') setMySongs(mine);
    } catch { /* board offline — leave as-is */ }
  }, [user]);

  // Ensure a leaderboard display name exists for this player.
  const ensurePlayer = useCallback(async () => {
    if (!user) return;
    try { await supabase.from('kulla_players').upsert({ user_id: user.id, display_name: myName, updated_at: new Date().toISOString() }); }
    catch { /* ignore */ }
  }, [user, myName]);

  // Hydrate cloud state before booting the iframe; then load the board.
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!user) { setSync('off'); setReady(true); loadBoard(); return; }
      setSync('loading');
      let hadCloud = false;
      try {
        const { data, error } = await supabase.from('kulla_state').select('data').eq('user_id', user.id).maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (data?.data && typeof data.data === 'object') { writeLocal(data.data as Record<string, string>); hadCloud = Object.keys(data.data).length > 0; }
        setSync('synced');
      } catch { if (!cancelled) setSync('error'); }
      finally {
        if (!cancelled) {
          setReady(true);
          ensurePlayer();
          loadBoard();
          if (!hadCloud && Object.keys(snapshotLocal()).length) setTimeout(saveNow, 800);
        }
      }
    }
    setReady(false);
    hydrate();
    return () => { cancelled = true; };
  }, [user, saveNow, loadBoard, ensurePlayer]);

  // Persist localStorage changes (fired cross-document by the iframe).
  useEffect(() => {
    if (!user) return;
    function onStorage(e: StorageEvent) {
      if (!e.key || !e.key.startsWith(KEY_PREFIX)) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(saveNow, 1200);
    }
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('storage', onStorage); if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [user, saveNow]);

  // Record scene solves the game reports, then refresh the board.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data;
      if (!d || d.type !== 'kulla-solved' || typeof d.level !== 'number') return;
      if (!user) return; // logged-out solves stay local
      (async () => {
        await ensurePlayer();
        try { await supabase.from('kulla_solves').upsert({ user_id: user.id, level: d.level }, { onConflict: 'user_id,level', ignoreDuplicates: true }); } catch { /* ignore */ }
        if (boardTimer.current) clearTimeout(boardTimer.current);
        boardTimer.current = setTimeout(loadBoard, 700);
      })();
    }
    window.addEventListener('message', onMsg);
    return () => { window.removeEventListener('message', onMsg); if (boardTimer.current) clearTimeout(boardTimer.current); };
  }, [user, ensurePlayer, loadBoard]);

  // Deep-link ?s= → hand the shared song to the embed.
  useEffect(() => {
    if (!ready || !shared || !/^[0-3]{12}$/.test(shared)) return;
    const frame = frameRef.current; if (!frame) return;
    const send = () => frame.contentWindow?.postMessage({ type: 'kulla-play', code: shared }, '*');
    frame.addEventListener('load', send);
    const t = setTimeout(send, 700);
    return () => { frame.removeEventListener('load', send); clearTimeout(t); };
  }, [ready, shared]);

  const winner = board[0];
  const iAmWinner = !!user && winner && mySongs > 0 && winner.songs === mySongs && winner.display_name === myName;

  return (
    <div className="kc-shell">
      <header className="kc-bar">
        <Link to="/" className="kc-back" aria-label="Back to Local Grindz">← Local Grindz</Link>
        <span className="kc-bar-title">KullaCoin</span>
        <span className="kc-bar-tools">
          <button className="kc-board-btn" onClick={openDaily} aria-label="Daily challenge" title="Daily hidden-song challenge">🎯</button>
          <button className="kc-board-btn" onClick={() => { setShowBoard(s => !s); loadBoard(); }} aria-label="Leaderboard">🏆</button>
          <span className="kc-sync" aria-live="polite">
            {!user
              ? <Link to="/account" className="kc-sync-link" title="Log in to save & rank">Log in ☁</Link>
              : sync === 'synced' ? <span className="kc-sync-ok">☁</span>
              : sync === 'loading' ? <span className="kc-sync-muted">☁…</span>
              : <span className="kc-sync-muted" title="Playing offline">☁✕</span>}
          </span>
        </span>
      </header>

      {ready
        ? <iframe ref={frameRef} className="kc-frame" title="KullaCoin — every coin is a song" srcDoc={kullaHtml} allow="microphone; autoplay" />
        : <div className="kc-frame kc-loading">Loading your KullaCoin…</div>}

      {showBoard && (
        <div className="kc-board-overlay" onClick={() => setShowBoard(false)}>
          <div className="kc-board" onClick={e => e.stopPropagation()}>
            <div className="kc-board-head">
              <h2>🏆 Songs Mastered</h2>
              <button className="kc-board-close" onClick={() => setShowBoard(false)} aria-label="close">✕</button>
            </div>

            <div className="kc-prize">
              {winner
                ? <><b>{winner.display_name}</b> leads with <b>{winner.songs}</b> song{winner.songs === 1 ? '' : 's'} — this season's <b>free-food coupon</b> is theirs.
                    <span className="kc-prize-fine">Coupon is a contest prize honored by a participating vendor (e.g. KTA) — valid once a vendor signs on.</span></>
                : <>Master songs to top the board and win the <b>free-food coupon</b>. Be the first!</>}
            </div>
            {iAmWinner && <div className="kc-you-win">🎉 You're #1! Your free-food coupon is pending a participating vendor — we'll notify you.</div>}

            {user
              ? <p className="kc-you">You: <b>{myName}</b> · {mySongs} song{mySongs === 1 ? '' : 's'} · <span className="kc-title">{achievement(mySongs)}</span></p>
              : <p className="kc-you"><Link to="/account" className="kc-sync-link">Log in</Link> to appear on the board and claim prizes.</p>}

            <ol className="kc-rows">
              {board.length === 0 && <li className="kc-empty">No songs mastered yet — solve a scene to start the board.</li>}
              {board.map(r => (
                <li key={r.rnk} className={'kc-row' + (r.rnk === 1 ? ' win' : '')}>
                  <span className="kc-rank">{r.rnk === 1 ? '👑' : r.rnk}</span>
                  <span className="kc-name">{r.display_name}</span>
                  <span className="kc-songs">{r.songs}</span>
                </li>
              ))}
            </ol>
            <p className="kc-board-note">Ranks collection, not skill (the answer is shown). Try the 🎯 daily challenge for a cheat-resistant test.</p>
          </div>
        </div>
      )}

      {showDaily && (
        <div className="kc-board-overlay" onClick={() => setShowDaily(false)}>
          <div className="kc-board" onClick={e => e.stopPropagation()}>
            <div className="kc-board-head">
              <h2>🎯 Daily Song</h2>
              <button className="kc-board-close" onClick={() => setShowDaily(false)} aria-label="close">✕</button>
            </div>
            <p className="kc-daily-sub">One hidden 4-note song for everyone today. Guess the colours — {MAX_GUESSES} tries. <b>Green</b> = right colour &amp; spot, <b>gold</b> = in the song, wrong spot. The answer never leaves the server.</p>

            <div className="kc-legend">
              {PAD_NAMES.map((n, i) => (
                <span key={n}><span className="kc-swatch" style={{ background: PAD_COLORS[i] }} />{n}</span>
              ))}
            </div>

            <div className="kc-daily-grid">
              {Array.from({ length: MAX_GUESSES }).map((_, r) => {
                const row = dRows[r];
                const isPending = !row && !dDone && r === dRows.length;
                return (
                  <div key={r} className={'kc-drow' + (isPending ? ' kc-pending' : '')}>
                    {Array.from({ length: 4 }).map((__, c) => {
                      if (row) {
                        const ci = Number(row.code[c]);
                        const fb = row.fb[c];
                        return <span key={c} className="kc-cell" data-fb={fb} style={{ background: PAD_COLORS[ci] }} />;
                      }
                      const ci = isPending ? pending[c] : undefined;
                      return <span key={c} className={'kc-cell' + (ci === undefined ? ' empty' : '')}
                        style={ci !== undefined ? { background: PAD_COLORS[ci] } : undefined} />;
                    })}
                  </div>
                );
              })}
            </div>

            {!user ? (
              <p className="kc-daily-msg"><Link to="/account" className="kc-sync-link">Log in</Link> to play today's challenge and join the board.</p>
            ) : dDone ? (
              <p className={'kc-daily-msg ' + (dSolved ? 'win' : 'lose')}>
                {dSolved ? "🎉 Solved! Come back tomorrow for a new song." : 'Out of tries today — a fresh song drops tomorrow.'}
              </p>
            ) : (
              <>
                <div className="kc-pads">
                  {PAD_COLORS.map((col, i) => (
                    <button key={i} className="kc-pad" style={{ background: col }}
                      disabled={pending.length >= 4}
                      onClick={() => { const next = [...pending, i]; setPending(next); preview(String(i)); }}
                      aria-label={PAD_NAMES[i]}>{PAD_NAMES[i]}</button>
                  ))}
                </div>
                <div className="kc-daily-actions">
                  <button onClick={() => setPending(p => p.slice(0, -1))} disabled={!pending.length || dBusy}>⌫ Back</button>
                  <button onClick={() => preview(pending.join(''))} disabled={pending.length !== 4 || dBusy}>▶ Hear</button>
                  <button className="kc-guess-go" onClick={submitGuess} disabled={pending.length !== 4 || dBusy}>Guess</button>
                </div>
                <p className={'kc-daily-msg' + (dMsg ? ' err' : '')}>{dMsg}</p>
              </>
            )}

            <p className="kc-you">{dPlayers} player{dPlayers === 1 ? '' : 's'} in today · fewest guesses wins</p>
            <ol className="kc-rows">
              {dBoard.length === 0 && <li className="kc-empty">No one's solved today yet — be first!</li>}
              {dBoard.map(r => (
                <li key={r.rnk} className={'kc-row' + (r.rnk === 1 ? ' win' : '')}>
                  <span className="kc-rank">{r.rnk === 1 ? '👑' : r.rnk}</span>
                  <span className="kc-name">{r.display_name}</span>
                  <span className="kc-songs">{r.guesses}🎯</span>
                </li>
              ))}
            </ol>
            <p className="kc-board-note">The daily song is generated and stored server-side; you only ever get colour hints back — no way to peek the answer.</p>
          </div>
        </div>
      )}
    </div>
  );
}
