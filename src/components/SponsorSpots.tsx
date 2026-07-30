import { Link } from 'react-router-dom';
import { SPONSOR_SPOTS, type SponsorSpot } from '../lib/marketplace';
import { trackEvent } from '../lib/analytics';

/**
 * Monthly sponsor spots — three premium slots on the home page. Filled slots
 * show the sponsor; open slots invite local businesses to advertise.
 */
function Spot({ spot, index }: { spot: SponsorSpot; index: number }) {
  if (!spot.filled) {
    return (
      <Link
        to="/apply"
        className="sponsor-spot sponsor-spot--open"
        onClick={() => trackEvent('cta_click', { label: 'sponsor_inquiry', section: 'sponsors' })}
      >
        <span className="sponsor-open-num">Spot {index + 1} of 3</span>
        <span className="sponsor-open-head">Your Business Here</span>
        <span className="sponsor-open-sub">Monthly sponsor placement on The Kingdom Emporium.</span>
        <span className="sponsor-open-cta">Ask about our rates →</span>
      </Link>
    );
  }
  const inner = (
    <>
      <div className="sponsor-logo" style={{ borderColor: spot.accent }}>
        {spot.logoUrl
          ? <img src={spot.logoUrl} alt={`${spot.name} logo`} loading="lazy" />
          : <span aria-hidden="true">{spot.emoji}</span>}
      </div>
      <div className="sponsor-body">
        <span className="sponsor-tag" style={{ color: spot.accent }}>Monthly Sponsor</span>
        <h3>{spot.name}</h3>
        <p>{spot.tagline}</p>
        <span className="sponsor-cta">Visit →</span>
      </div>
    </>
  );
  const cls = 'sponsor-spot sponsor-spot--filled';
  return spot.routeTo
    ? <Link to={spot.routeTo} className={cls} onClick={() => trackEvent('cta_click', { label: `sponsor_${spot.id}`, section: 'sponsors' })}>{inner}</Link>
    : <a href={spot.shopUrl} target="_blank" rel="noopener noreferrer" className={cls} onClick={() => trackEvent('cta_click', { label: `sponsor_${spot.id}`, section: 'sponsors' })}>{inner}</a>;
}

export function SponsorSpots() {
  return (
    <section className="landing-section sponsors-section" aria-label="Monthly sponsors">
      <h2>Monthly Sponsors</h2>
      <p className="sponsors-intro">Three spots. Local businesses that keep the Emporium going — two are open.</p>
      <div className="sponsors-grid">
        {SPONSOR_SPOTS.map((s, i) => <Spot key={s.id} spot={s} index={i} />)}
      </div>
    </section>
  );
}
