import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Raffle as RaffleType } from '../lib/types';
import { trackEvent } from '../lib/analytics';

/**
 * Raffle.tsx — monthly community drawing.
 *
 * $1 tickets are paid through rastarooster.com (Shopify). Buyers can purchase
 * multiple tickets and gift them to a friend. Each entrant is recorded (with a
 * ticket count) so the admin can run a randomized draw; entrant PII is
 * insert-only for the public and admin-read only per RLS.
 */

const RAFFLE_SLUG = 'ekalesia-hoole-pope-kekaha';
const MAX_TICKETS = 50;

export function Raffle() {
  const [raffle, setRaffle] = useState<RaffleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isGift, setIsGift] = useState(false);
  const [giftFrom, setGiftFrom] = useState('');
  const [entered, setEntered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('raffles').select('*').eq('slug', RAFFLE_SLUG).eq('is_active', true).maybeSingle()
      .then(({ data }) => { setRaffle((data as RaffleType) ?? null); setLoading(false); });
  }, []);

  const unitPrice = raffle ? Number(raffle.price) : 1;
  const total = (unitPrice * quantity).toFixed(2);
  const checkoutUrl =
    raffle && raffle.payment_method === 'shopify' && raffle.ticket_variant_id
      ? `https://rastarooster.com/cart/${raffle.ticket_variant_id}:${quantity}`
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
      tickets: quantity,
      is_gift: isGift,
      gifted_by: isGift ? (giftFrom.trim() || null) : null,
    });
    setSubmitting(false);
    if (error) return;
    setEntered(true);
    trackEvent('cta_click', { label: 'raffle_entry', section: 'raffle', quantity });
  }

  if (loading) return <div className="raffle-page"><p className="raffle-loading">Loading…</p></div>;
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

  const priceLabel = `$${unitPrice.toFixed(0)}`;
  const drawDate = raffle.draw_date
    ? new Date(raffle.draw_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const entrantLabel = isGift ? "Friend’s name" : 'Your name';

  return (
    <div className="raffle-page">
      <header className="raffle-masthead">
        <div className="raffle-mast-label">
          <span>Community Drawing</span>
          <Link to="/" className="raffle-home">← Local Grindz</Link>
        </div>
        <p className="raffle-kicker">{raffle.org_name}</p>
        <h1>Win a 2003 Toyota Camry</h1>
        <p className="raffle-sub">{priceLabel} per ticket · drawn monthly</p>
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
          <div><dt>Prize</dt><dd>{raffle.prize || 'To be announced'}</dd></div>
          <div><dt>Tickets</dt><dd>{priceLabel} each — buy as many as you like</dd></div>
          {drawDate && <div><dt>Drawing</dt><dd>{drawDate}</dd></div>}
        </dl>
      </section>

      <section className="raffle-section raffle-enter" id="enter">
        <p className="raffle-eyebrow">Enter the drawing</p>
        {entered ? (
          <div className="raffle-done">
            <p className="raffle-done-head">🌺 {quantity} {quantity === 1 ? 'ticket' : 'tickets'} reserved{isGift && giftFrom ? ` — gift from ${giftFrom}` : ''}!</p>
            <p>Complete your <strong>${total}</strong> payment to confirm {quantity === 1 ? 'your entry' : 'your entries'}:</p>
            {checkoutUrl ? (
              <a
                className="raffle-btn raffle-btn-gold raffle-btn-lg"
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('cta_click', { label: 'raffle_pay', section: 'raffle', quantity })}
              >
                Pay ${total} at rastarooster.com →
              </a>
            ) : (
              <p className="raffle-note">The payment link is being set up — the organizers will follow up{email ? ` at ${email}` : ''} to confirm.</p>
            )}
            <button className="raffle-link-btn" onClick={() => { setEntered(false); setName(''); setEmail(''); setPhone(''); setQuantity(1); setIsGift(false); setGiftFrom(''); }}>
              + Enter again
            </button>
          </div>
        ) : (
          <form className="raffle-form" onSubmit={handleEnter}>
            <label className="raffle-check">
              <input type="checkbox" checked={isGift} onChange={e => setIsGift(e.target.checked)} />
              <span>This is a gift for a friend</span>
            </label>

            {isGift && (
              <label>Your name (the gift-giver)
                <input value={giftFrom} onChange={e => setGiftFrom(e.target.value)} placeholder="Your name" />
              </label>
            )}

            <label>{entrantLabel}
              <input value={name} onChange={e => setName(e.target.value)} required placeholder={isGift ? "Friend's full name" : 'First & last name'} />
            </label>
            <label>{isGift ? "Friend’s email" : 'Email'}
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
            </label>
            <label>{isGift ? "Friend’s phone" : 'Phone'}
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(808) 555-1234" />
            </label>

            <label>Number of tickets
              <div className="raffle-qty">
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Fewer tickets">−</button>
                <input
                  type="number" min={1} max={MAX_TICKETS} value={quantity}
                  onChange={e => setQuantity(Math.min(MAX_TICKETS, Math.max(1, Number(e.target.value) || 1)))}
                />
                <button type="button" onClick={() => setQuantity(q => Math.min(MAX_TICKETS, q + 1))} aria-label="More tickets">+</button>
              </div>
            </label>

            <button type="submit" className="raffle-btn raffle-btn-gold raffle-btn-lg" disabled={submitting}>
              {submitting ? 'Entering…' : `Enter — ${quantity} ticket${quantity > 1 ? 's' : ''} · $${total}`}
            </button>
          </form>
        )}
        <p className="raffle-fine">
          Tickets are ${unitPrice.toFixed(0)} each and support {raffle.org_name}. Payment is completed securely at
          rastarooster.com. Winners are drawn monthly and contacted directly. Please enter only where permitted by law.
        </p>
      </section>

      <footer className="raffle-foot">
        <p>{raffle.org_name} · Keaukaha, Hilo · (808) 933-4463</p>
      </footer>
    </div>
  );
}
