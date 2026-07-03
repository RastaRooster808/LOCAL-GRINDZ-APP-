import { useState } from 'react';
import type { CommerceItem } from '../data/commerce';

const TYPE_LABEL: Record<string, string> = {
  digital_print:   'Digital Print',
  membership:      'Membership',
  merch:           'Merch',
  grower_resource: 'Grower Resource',
  florist_hotel:   'Fresh Flowers',
  vendor_product:  'Vendor Product',
};

export function CommerceCard({ item }: { item: CommerceItem }) {
  const [notified, setNotified] = useState(false);

  if (item.status === 'hidden' || item.status === 'draft') return null;

  function handleNotify() {
    setNotified(true);
    setTimeout(() => setNotified(false), 2500);
  }

  return (
    <div className={`commerce-card commerce-card--${item.status}`}>
      <div className="commerce-card-img-wrap">
        {item.image
          ? <img src={item.image} alt={item.title} className="commerce-card-img" loading="lazy" />
          : <div className="commerce-card-img-ph" aria-hidden="true">🌺</div>
        }
        {item.status !== 'live' && (
          <span className={`commerce-status-badge commerce-status-badge--${item.status}`}>
            {item.status === 'coming_soon' ? 'Coming Soon' : item.status === 'sold_out' ? 'Sold Out' : item.status}
          </span>
        )}
      </div>

      <div className="commerce-card-body">
        <span className="commerce-card-type">{TYPE_LABEL[item.type] ?? item.type}</span>
        <h3 className="commerce-card-title">{item.title}</h3>
        <p className="commerce-card-desc">{item.description}</p>
        {item.tags.length > 0 && (
          <div className="commerce-card-tags" aria-label="Tags">
            {item.tags.slice(0, 4).map(tag => (
              <span key={tag} className="commerce-tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="commerce-card-footer">
        <span className="commerce-card-price">
          {item.price > 0 ? `$${item.price.toFixed(2)}` : 'Free'}
        </span>

        {item.status === 'live' && item.checkoutUrl && (
          <a
            href={item.checkoutUrl}
            className="btn-primary btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy
          </a>
        )}

        {item.status === 'coming_soon' && (
          notified
            ? <span className="commerce-notify-flash" aria-live="polite">Stay tuned 🤙</span>
            : (
              <button type="button" className="btn-outline btn-sm" onClick={handleNotify}>
                Notify Me
              </button>
            )
        )}

        {item.status === 'sold_out' && (
          <button type="button" className="btn-outline btn-sm" disabled aria-disabled="true">
            Sold Out
          </button>
        )}
      </div>
    </div>
  );
}
