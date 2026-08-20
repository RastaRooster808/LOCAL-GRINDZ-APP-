import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TOKEN_COLORS, normalizeContact, type TokenColor } from '../lib/kingdomTokens';

const MARKET_NOTE = "Uncle Robert's Wednesday Market, Kalapana";

interface TokenRow {
  id: string;
  color: TokenColor;
  created_at: string;
  redeemed: boolean;
  market_note: string | null;
}

function ColorSwatch({ color, filled }: { color: TokenColor; filled: boolean }) {
  const info = TOKEN_COLORS.find(c => c.value === color)!;
  return (
    <span
      className="kt-swatch"
      style={{ background: filled ? info.swatch : 'transparent', borderColor: info.swatch }}
      title={info.label}
    />
  );
}

function LogVisitForm() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [color, setColor] = useState<TokenColor>('blue');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSubmitting(true);
    const { error } = await supabase.from('kingdom_loyalty_tokens').insert({
      customer_name: name.trim(),
      customer_contact: contact.trim() ? normalizeContact(contact) : null,
      color,
      market_note: MARKET_NOTE,
    });
    setSubmitting(false);
    if (error) { setError('Something went wrong. Please try again.'); return; }
    setDone(true);
  };

  if (done) {
    return (
      <div className="success-box">
        <div className="success-icon">
          <ColorSwatch color={color} filled />
        </div>
        <h2>Token logged!</h2>
        <p>{name} now has a {TOKEN_COLORS.find(c => c.value === color)!.label} token on file.</p>
        <button className="btn-primary" onClick={() => { setDone(false); setName(''); setContact(''); }}>
          Log Another Visit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Customer Name
        <input value={name} onChange={e => setName(e.target.value)} required />
      </label>
      <label>Phone or Email (optional — lets them look up their tokens later)
        <input value={contact} onChange={e => setContact(e.target.value)} placeholder="808-555-0142 or name@email.com" />
      </label>
      <label>
        Color to Award
        <span className="kt-color-picker">
          {TOKEN_COLORS.map(c => (
            <button
              type="button"
              key={c.value}
              className={`kt-color-choice${color === c.value ? ' kt-color-choice--active' : ''}`}
              style={{ background: c.swatch }}
              onClick={() => setColor(c.value)}
              aria-label={c.label}
              aria-pressed={color === c.value}
            />
          ))}
        </span>
      </label>
      {error && <p className="error-msg">{error}</p>}
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Logging…' : 'Log Visit'}
      </button>
    </form>
  );
}

function LookupTokens() {
  const [contact, setContact] = useState('');
  const [tokens, setTokens] = useState<TokenRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setError('');
    setLoading(true);
    const { data, error } = await supabase.rpc('get_kingdom_tokens', { p_contact: contact });
    setLoading(false);
    if (error) { setError('Something went wrong. Please try again.'); return; }
    setTokens((data as TokenRow[]) ?? []);
  };

  const collectedColors = new Set((tokens ?? []).map(t => t.color));

  return (
    <div>
      <form onSubmit={handleLookup} className="kt-lookup-form">
        <label>Phone or Email
          <input value={contact} onChange={e => setContact(e.target.value)} placeholder="808-555-0142 or name@email.com" required />
        </label>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Looking up…' : 'Show My Tokens'}
        </button>
      </form>

      {tokens !== null && (
        <div className="kt-result">
          <p className="kt-result-row">
            {TOKEN_COLORS.map(c => (
              <ColorSwatch key={c.value} color={c.value} filled={collectedColors.has(c.value)} />
            ))}
          </p>
          {collectedColors.size >= 4 ? (
            <p className="kt-complete">All 4 colors collected — show this screen at the booth! 🎉</p>
          ) : (
            <p>{collectedColors.size} of 4 colors collected. Keep visiting the booth to fill them in.</p>
          )}
          {tokens.length === 0 && <p>No tokens found for that phone/email yet.</p>}
        </div>
      )}
    </div>
  );
}

export function KingdomTokens() {
  const [tab, setTab] = useState<'lookup' | 'log'>('lookup');

  return (
    <div className="rr-page">
      <header className="rr-hero" style={{ paddingBottom: '1.5rem' }}>
        <div className="rr-mast">
          <Link to="/" className="rr-home">← Local Grindz</Link>
        </div>
        <p className="rr-kicker" style={{ marginTop: '2.5rem' }}>Ko Hawaiʻi Pae ʻĀina · Kalapana</p>
        <h1 style={{ fontSize: '1.6rem' }}>Kingdom Loyalty Tokens</h1>
        <p className="rr-lede">
          A thank-you for supporting the booth — not currency, no cash value.
          Collect all 4 colors and show your phone for a free plate (vendor's call).
        </p>
      </header>

      <section className="rr-section">
        <div className="vendor-tabs">
          <button className={tab === 'lookup' ? 'tab-active' : ''} onClick={() => setTab('lookup')}>My Tokens</button>
          <button className={tab === 'log' ? 'tab-active' : ''} onClick={() => setTab('log')}>Log a Visit (Booth Staff)</button>
        </div>
        {tab === 'lookup' ? <LookupTokens /> : <LogVisitForm />}
      </section>
    </div>
  );
}
