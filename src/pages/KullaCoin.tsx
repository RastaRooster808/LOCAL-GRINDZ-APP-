import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
// The KullaCoin experience is a self-contained mini-app (Canvas + Web Audio +
// Proof-of-Melody minting). It lives as one tested HTML file and is embedded
// here in an isolated iframe so its generic class names (.card/.panel/.key…)
// never collide with the marketplace's global CSS. Editing the game = editing
// that one file; this route just frames it inside the app shell.
import kullaHtml from './kullacoin.embed.html?raw';

export function KullaCoin() {
  const [params] = useSearchParams();
  const shared = params.get('s'); // deep-linked song code, e.g. ?s=021110220320
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    trackEvent('page_view', { section: 'kullacoin' });
  }, []);

  // HashRouter keeps ?s= out of the iframe's own URL, so hand the shared song
  // to the embed via postMessage once it has loaded.
  useEffect(() => {
    if (!shared || !/^[0-3]{12}$/.test(shared)) return;
    const frame = frameRef.current;
    if (!frame) return;
    const send = () => frame.contentWindow?.postMessage({ type: 'kulla-play', code: shared }, '*');
    frame.addEventListener('load', send);
    // in case it already loaded before this effect ran
    const t = setTimeout(send, 600);
    return () => { frame.removeEventListener('load', send); clearTimeout(t); };
  }, [shared]);

  return (
    <div className="kc-shell">
      <header className="kc-bar">
        <Link to="/" className="kc-back" aria-label="Back to Local Grindz">← Local Grindz</Link>
        <span className="kc-bar-title">KullaCoin</span>
        <span className="kc-bar-spacer" aria-hidden="true" />
      </header>
      <iframe
        ref={frameRef}
        className="kc-frame"
        title="KullaCoin — every coin is a song"
        srcDoc={kullaHtml}
        allow="microphone; autoplay"
      />
    </div>
  );
}
