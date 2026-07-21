import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HOME_PROMOS } from '../lib/marketplace';

const ROTATE_MS = 6000;

/** Rotating homepage promotions; auto-advances unless the user prefers reduced motion. */
export function PromoRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setIndex(i => (i + 1) % HOME_PROMOS.length), ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  const promo = HOME_PROMOS[index];

  return (
    <section className="promo-rotator" aria-label="Featured promotions">
      <Link to={promo.to} className="promo-card" style={{ borderLeftColor: promo.accent }}>
        <span className="promo-emoji" aria-hidden="true">{promo.emoji}</span>
        <span className="promo-copy">
          <strong>{promo.label}</strong>
          <span>{promo.text}</span>
        </span>
        <span className="promo-arrow" aria-hidden="true">→</span>
      </Link>
      <div className="promo-dots" role="tablist" aria-label="Promotion selector">
        {HOME_PROMOS.map((p, i) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={i === index}
            aria-label={p.label}
            className={`promo-dot${i === index ? ' active' : ''}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
