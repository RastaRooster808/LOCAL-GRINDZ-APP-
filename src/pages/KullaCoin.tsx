import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
// The KullaCoin experience is a self-contained mini-app embedded in an isolated
// iframe. Because a srcDoc iframe shares this page's origin, it also shares
// localStorage (where the game keeps wallet/progress/loops) and dispatches
// `storage` events up to us — so we can cloud-sync without touching game code.
import kullaHtml from './kullacoin.embed.html?raw';

const KEY_PREFIX = 'kulla';

/** Collect every KullaCoin localStorage key into a plain object. */
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
      try { localStorage.setItem(k, v); } catch { /* quota — ignore */ }
    }
  }
}

type SyncState = 'off' | 'loading' | 'synced' | 'error';

export function KullaCoin() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const shared = params.get('s'); // deep-linked song code, e.g. ?s=021110220320
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false); // gate the iframe until hydration is attempted
  const [sync, setSync] = useState<SyncState>('off');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Hydrate from the cloud BEFORE booting the iframe (it reads localStorage on load).
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!user) { setSync('off'); setReady(true); return; }
      setSync('loading');
      let hadCloud = false;
      try {
        const { data, error } = await supabase
          .from('kulla_state').select('data').eq('user_id', user.id).maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (data?.data && typeof data.data === 'object') {
          writeLocal(data.data as Record<string, string>);
          hadCloud = Object.keys(data.data).length > 0;
        }
        setSync('synced');
      } catch {
        if (!cancelled) setSync('error'); // table missing / offline → play locally
      } finally {
        if (!cancelled) {
          setReady(true);
          // Seed the cloud from local play if the account had nothing yet.
          if (!hadCloud && Object.keys(snapshotLocal()).length) setTimeout(saveNow, 800);
        }
      }
    }
    setReady(false);
    hydrate();
    return () => { cancelled = true; };
  }, [user, saveNow]);

  // The game writes localStorage from inside the iframe → we get a `storage`
  // event here (cross-document). Debounce and persist the whole snapshot.
  useEffect(() => {
    if (!user) return;
    function onStorage(e: StorageEvent) {
      if (!e.key || !e.key.startsWith(KEY_PREFIX)) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(saveNow, 1200);
    }
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [user, saveNow]);

  // Deep-link ?s= → hand the shared song to the embed once it loads.
  useEffect(() => {
    if (!ready || !shared || !/^[0-3]{12}$/.test(shared)) return;
    const frame = frameRef.current;
    if (!frame) return;
    const send = () => frame.contentWindow?.postMessage({ type: 'kulla-play', code: shared }, '*');
    frame.addEventListener('load', send);
    const t = setTimeout(send, 700);
    return () => { frame.removeEventListener('load', send); clearTimeout(t); };
  }, [ready, shared]);

  return (
    <div className="kc-shell">
      <header className="kc-bar">
        <Link to="/" className="kc-back" aria-label="Back to Local Grindz">← Local Grindz</Link>
        <span className="kc-bar-title">KullaCoin</span>
        <span className="kc-sync" aria-live="polite">
          {!user
            ? <Link to="/account" className="kc-sync-link" title="Log in to save your coins across devices">Log in to save ☁</Link>
            : sync === 'synced' ? <span className="kc-sync-ok">☁ Synced</span>
            : sync === 'loading' ? <span className="kc-sync-muted">☁ syncing…</span>
            : sync === 'error' ? <span className="kc-sync-muted" title="Playing offline — progress saved on this device">☁ offline</span>
            : null}
        </span>
      </header>
      {ready
        ? <iframe
            ref={frameRef}
            className="kc-frame"
            title="KullaCoin — every coin is a song"
            srcDoc={kullaHtml}
            allow="microphone; autoplay"
          />
        : <div className="kc-frame kc-loading">Loading your KullaCoin…</div>}
    </div>
  );
}
