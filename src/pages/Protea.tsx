import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getByType, PRODUCT_STATUS } from '../data/commerce';
import type { CommerceItem } from '../data/commerce';
import { trackEvent } from '../lib/analytics';

/**
 * Protea.tsx — protea.khpa.io hub for TOPP · Ohana Bloom
 *
 * Freemium structure:
 *   PUBLIC (no login):  the three Ohana Bloom weekly tiers + a minimal set of
 *                       the print archive (FREE_PRINT_COUNT prints, buyable).
 *   GATED:              the rest of the print archive is greyed / locked behind
 *                       "The Field Report" — a $4.99/mo newsletter membership.
 *
 * Membership entitlement is presentation-only here (`isMember`): the actual
 * high-res files are delivered by Sky Pilot after a Shopify purchase, so the
 * grey-out never exposes protected assets. Wiring a real entitlement signal
 * (Shopify $4.99/mo subscription + auth check) is the remaining backend step —
 * flip `isMember` to read that once it exists. See CHANGELOG.
 */

const FREE_PRINT_COUNT = 6;
const MEMBER_KEY = 'topp_field_report_member';

function TierCard({ tier }: { tier: CommerceItem }) {
  return (
    <div className="protea-tier">
      {tier.image && (
        <div className="protea-tier-photo">
          <img src={tier.image} alt={tier.title} loading="lazy" />
        </div>
      )}
      <div className="protea-tier-body">
        <div className="protea-tier-head">
          <h3>{tier.title.replace(' — ', ' · ').replace('Ohana Bloom · ', '')}</h3>
          <span className="protea-tier-price">${tier.price.toFixed(0)}<span>/wk</span></span>
        </div>
        <p>{tier.description}</p>
        {tier.checkoutUrl ? (
          <a
            className="protea-btn protea-btn-gold"
            href={tier.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('protea_tier_reserve', { id: tier.id })}
          >
            Reserve weekly
          </a>
        ) : (
          <span className="protea-btn protea-btn-soon">Coming soon</span>
        )}
      </div>
    </div>
  );
}

function PrintCard({ print, locked }: { print: CommerceItem; locked: boolean }) {
  return (
    <div className={`protea-print${locked ? ' protea-print--locked' : ''}`}>
      <div className="protea-print-photo">
        {print.image
          ? <img src={print.image} alt={print.title} loading="lazy" />
          : <div className="protea-print-photo--placeholder">🌺</div>}
        {locked && (
          <div className="protea-print-lock" aria-hidden="true">
            <span>🔒</span>
          </div>
        )}
      </div>
      <div className="protea-print-body">
        <h4>{print.title.replace(' — Digital Print', '')}</h4>
        {locked ? (
          <span className="protea-print-tag">Members only</span>
        ) : (
          <a
            className="protea-btn protea-btn-line"
            href={print.checkoutUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('protea_print_buy', { id: print.id })}
          >
            Download · ${print.price.toFixed(2)}
          </a>
        )}
      </div>
    </div>
  );
}

export function Protea() {
  const [isMember, setIsMember] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(MEMBER_KEY) === '1',
  );
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const tiers = getByType('florist_hotel').filter(p => p.status === PRODUCT_STATUS.LIVE);
  const prints = getByType('digital_print').filter(p => p.status === PRODUCT_STATUS.LIVE);
  const lockedCount = Math.max(0, prints.length - FREE_PRINT_COUNT);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes('@')) return;
    // Presentation-only unlock + waitlist. Real membership checkout (Shopify
    // $4.99/mo subscription) and list delivery are the remaining backend wiring.
    localStorage.setItem(MEMBER_KEY, '1');
    setIsMember(true);
    setJoined(true);
    trackEvent('field_report_join', { email: value });
  }

  return (
    <div className="protea-page">
      <header className="protea-masthead">
        <div className="protea-mast-label">
          <span>TOPP · Ohana Bloom</span>
          <Link to="/" className="protea-mast-home">← Kingdom Emporium</Link>
        </div>
        <h1>A Limited Weekly Protea Harvest</h1>
        <p className="protea-mast-sub">
          Grown on lava in Napuʻuapele, Puna. Cut Friday morning, delivered the same day across
          Hawaiʻi Island. Reserved for a handful of standing accounts.
        </p>
        <div className="protea-mast-cta">
          <a className="protea-btn protea-btn-gold" href="#tiers">Reserve a standing order</a>
          <a className="protea-btn protea-btn-line" href="#archive">Browse the print archive</a>
        </div>
      </header>

      {/* THREE TIERS — public, no login */}
      <section id="tiers" className="protea-section">
        <p className="protea-eyebrow">Reserve a Standing Weekly Delivery</p>
        <div className="protea-tiers">
          {tiers.map(t => <TierCard key={t.id} tier={t} />)}
        </div>
      </section>

      {/* PRINT ARCHIVE — freemium gate */}
      <section id="archive" className="protea-section protea-section--alt">
        <p className="protea-eyebrow">The Protea Print Archive</p>
        <p className="protea-lede">
          Original botanical photography, documented by the founding grower in Puna. A handful are
          open to everyone{isMember ? '' : ` — the full archive of ${prints.length} opens with The Field Report`}.
        </p>
        <div className="protea-prints">
          {prints.map((p, i) => (
            <PrintCard key={p.id} print={p} locked={!isMember && i >= FREE_PRINT_COUNT} />
          ))}
        </div>
      </section>

      {/* MEMBERSHIP — $4.99/mo newsletter */}
      <section id="join" className="protea-section protea-join">
        <p className="protea-eyebrow protea-eyebrow--blush">The Field Report · $4.99 / month</p>
        <h2>Unlock the full archive</h2>
        <p className="protea-join-copy">
          A monthly dispatch from the Napuʻuapele growing site — harvest notes, new prints the week
          they're shot, and the full {prints.length}-print archive at member access. Cancel anytime.
        </p>
        {joined ? (
          <p className="protea-join-done">
            🌺 You're on the list. We'll email you the moment The Field Report opens.
          </p>
        ) : (
          <form className="protea-join-form" onSubmit={handleJoin}>
            <input
              type="email"
              inputMode="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              aria-label="Email address"
              required
            />
            <button type="submit" className="protea-btn protea-btn-gold">Join · $4.99/mo</button>
          </form>
        )}
        <p className="protea-join-fine">
          {lockedCount} more prints inside · Napuʻuapele, Puna, Hawaiʻi Island
        </p>
      </section>

      <footer className="protea-foot">
        <p>TOPP — Transnational Organization of Protea Planters</p>
        <p>Reserve a standing order: Ranell · (808) 731-9809 · khparelations@gmail.com</p>
      </footer>
    </div>
  );
}
