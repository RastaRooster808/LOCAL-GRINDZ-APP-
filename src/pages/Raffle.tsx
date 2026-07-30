import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Raffle as RaffleType } from '../lib/types';
import { paymentLink, type PaymentMethod } from '../lib/payments';
import { trackEvent } from '../lib/analytics';

/**
 * Raffle.tsx — monthly community "donation drawing" for a partner org.
 *
 * The platform never holds funds: a $1 entry is a deep link to the org's own
 * Venmo / PayPal / Cash App (same model as vendor payments). We record the
 * entrant (name/email/phone) so there's a list to draw from; entrant PII is
 * insert-only for the public and readable only to authenticated admins (RLS).
 */

const RAFFLE_SLUG = 'ekalesia-hoole-pope-kekaha';

function payHandles(r: RaffleType) {
  return {
    paypal_handle: r.payment_method === 'paypal' ? r.payment_handle : null,
    venmo_handle: r.payment_method === 'venmo' ? r.payment_handle : null,
    cashapp_handle: r.payment_method === 'cashapp' ? r.payment_handle : null,
  };
}

export function Raffle() {
  const [raffle, setRaffle] = useState<RaffleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [entered, setEntered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from('raffles')
      .select('*')
      .eq('slug', RAFFLE_SLUG)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        setRaffle((data as RaffleType) ?? null);
        setLoading(false);
      });
  }, []);

  const payUrl =
    raffle && raffle.payment_method && raffle.payment_handle
      ? paymentLink(
          raffle.payment_method as PaymentMethod,
          payHandles(raffle),
          Number(raffle.price),
          `${raffle.org_name} — drawing entry`,
        )
      : null;

  async function handleEnter(e: React.FormEvent) {
    e.preventDefault();
    if (!raffle || !name.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('raffle_entries').insert({
      raffle_id: raffle.id,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
    });
    setSubmitting(false);
    if (error) return;
    setEntered(true);
    trackEvent('cta_click', { label: 'raffle_entry', section: 'raffle' });
  }

  if (loading) {
    return <div className="raffle-page"><p className="raffle-loading">Loading…</p></div>;
  }
  if (!raffle) {
    return (
      <div className="raffle-page">
        <section className="raffle-section">
          <p>No active drawing right now. Please check back soon.</p>
          <Link className="raffle-btn raffle-btn-line" to="/">← Local Grindz</Link>
        </section>
      </div>
    );
  }

  const price = `$${Number(raffle.price).toFixed(0)}`;
  const drawDate = raffle.draw_date
    ? new Date(raffle.draw_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="raffle-page">
      <header className="raffle-masthead">
        <div className="raffle-mast-label">
          <span>Community Drawing</span>
          <Link to="/" className="raffle-home">← Local Grindz</Link>
        </div>
        <p className="raffle-kicker">{raffle.org_name}</p>
        <h1>{raffle.title}</h1>
        <p className="raffle-sub">{price} donation entry · drawn monthly</p>
      </header>

      <section className="raffle-section">
        {raffle.prize_image_url && (
          <figure className="raffle-prize-photo">
            <img src={raffle.prize_image_url} alt={raffle.prize ?? 'Raffle prize'} loading="eager" />
            <figcaption>This month’s prize</figcaption>
          </figure>
        )}
        {raffle.description && <p className="raffle-lede">{raffle.description}</p>}
        <dl className="raffle-facts">
          <div><dt>This month’s prize</dt><dd>{raffle.prize || 'To be announced'}</dd></div>
          <div><dt>Entry</dt><dd>{price} per entry — enter as many times as you like</dd></div>
          {drawDate && <div><dt>Drawing</dt><dd>{drawDate}</dd></div>}
        </dl>
      </section>

      <section className="raffle-section raffle-enter" id="enter">
        <p className="raffle-eyebrow">Enter the drawing</p>
        {entered ? (
          <div className="raffle-done">
            <p className="raffle-done-head">🌺 You’re entered, {name.split(' ')[0]}!</p>
            <p>Complete your {price} donation to confirm your entry:</p>
            {payUrl ? (
              <a
                className="raffle-btn raffle-btn-gold"
                href={payUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('cta_click', { label: 'raffle_pay', section: 'raffle' })}
              >
                Donate {price} — {raffle.payment_method}
              </a>
            ) : (
              <p className="raffle-note">
                The donation link is being set up. The church will follow up with you
                {email ? ` at ${email}` : ''} to confirm your entry.
              </p>
            )}
          </div>
        ) : (
          <form className="raffle-form" onSubmit={handleEnter}>
            <label>Your name
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="First & last name" />
            </label>
            <label>Email
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
            </label>
            <label>Phone
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(808) 555-1234" />
            </label>
            <button type="submit" className="raffle-btn raffle-btn-gold" disabled={submitting}>
              {submitting ? 'Entering…' : `Enter — ${price} donation`}
            </button>
          </form>
        )}
        <p className="raffle-fine">
          A {price} donation supports {raffle.org_name}. Winners are drawn monthly and contacted directly.
          Please enter only where permitted by law.
        </p>
      </section>
    </div>
  );
}
