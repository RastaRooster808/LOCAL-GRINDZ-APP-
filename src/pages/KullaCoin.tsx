import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
// The KullaCoin experience is a self-contained mini-app (Canvas + Web Audio +
// Proof-of-Melody minting). It lives as one tested HTML file and is embedded
// here in an isolated iframe so its generic class names (.card/.panel/.key…)
// never collide with the marketplace's global CSS. Editing the game = editing
// that one file; this route just frames it inside the app shell.
import kullaHtml from './kullacoin.embed.html?raw';

export function KullaCoin() {
  useEffect(() => {
    trackEvent('page_view', { section: 'kullacoin' });
  }, []);

  return (
    <div className="kc-shell">
      <header className="kc-bar">
        <Link to="/" className="kc-back" aria-label="Back to Local Grindz">← Local Grindz</Link>
        <span className="kc-bar-title">KullaCoin</span>
        <span className="kc-bar-spacer" aria-hidden="true" />
      </header>
      <iframe
        className="kc-frame"
        title="KullaCoin — every coin is a song"
        srcDoc={kullaHtml}
        allow="microphone; autoplay"
      />
    </div>
  );
}
