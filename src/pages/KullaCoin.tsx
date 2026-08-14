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
            <p className="kc-board-note">Ranks collection, not skill (the answer is shown). A cheat-resistant daily challenge is coming.</p>
          </div>
        </div>
      )}
    </div>
  );
}
