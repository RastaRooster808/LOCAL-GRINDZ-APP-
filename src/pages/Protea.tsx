import { Link } from 'react-router-dom';
import { getByType, getById, PRODUCT_STATUS } from '../data/commerce';
import type { CommerceItem } from '../data/commerce';
import { trackEvent } from '../lib/analytics';

/**
 * Protea.tsx — protea.khpa.io hub, reached by clicking the TOPP sponsor spot.
 *
 * The botanical prints are listed as buyable menu items, grouped into sections.
 * Each Buy button links to the Shopify checkout (digital prints deliver via Sky
 * Pilot). The Field Report ($4.99/mo) is an optional upsell, not a paywall.
 * The Counter arrangement is listed but flagged out-of-season / out of stock.
 */

const FIELD_REPORT_URL = 'https://rastarooster.com/products/the-field-report-monthly-membership';

// Botanical sections, matched by title/tag keywords (first match wins).
const SECTIONS: { label: string; match: (t: string) => boolean }[] = [
  { label: 'King Protea', match: t => t.includes('king') },
  { label: 'Pincushions', match: t => t.includes('pincushion') || t.includes('leucospermum') },
  { label: 'Conebush & Lava', match: t => t.includes('conebush') || t.includes('leucadendron') || t.includes('lava') },
  { label: 'Landscapes & Foliage', match: t => t.includes('landscape') || t.includes('field') || t.includes('foliage') },
];

function sectionOf(p: CommerceItem): string {
  const t = `${p.title} ${p.tags.join(' ')}`.toLowerCase();
  return SECTIONS.find(s => s.match(t))?.label ?? 'Botanical Studies';
}

function PrintItem({ print }: { print: CommerceItem }) {
  return (
    <div className="protea-print">
      <div className="protea-print-photo">
        {print.image
          ? <img src={print.image} alt={print.title} loading="lazy" />
          : <div className="protea-print-photo--placeholder">🌺</div>}
      </div>
      <div className="protea-print-body">
        <h4>{print.title.replace(' — Digital Print', '')}</h4>
        <div className="protea-print-buy">
          <span className="protea-print-price">${print.price.toFixed(2)}</span>
          {print.checkoutUrl ? (
            <a
              className="protea-btn protea-btn-line"
              href={print.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('protea_print_buy', { id: print.id })}
            >
              Buy
            </a>
          ) : (
            <span className="protea-print-soon">Soon</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function Protea() {
  const prints = getByType('digital_print').filter(p => p.status === PRODUCT_STATUS.LIVE);
  const counter = getById('ohana-bloom-counter');

  // Group prints into ordered sections.
  const grouped = new Map<string, CommerceItem[]>();
  for (const p of prints) {
    const label = sectionOf(p);
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label)!.push(p);
  }
  const orderedLabels = [...SECTIONS.map(s => s.label), 'Botanical Studies'].filter(l => grouped.has(l));

  return (
    <div className="protea-page">
      <header className="protea-masthead">
        <div className="protea-mast-label">
          <span>TOPP · Ohana Bloom</span>
          <Link to="/" className="protea-mast-home">← Kingdom Emporium</Link>
        </div>
        <h1>The Original Protea Project</h1>
        <p className="protea-mast-sub">
          Hawaiian protea grown on lava in Napuʻuapele, Puna — fresh weekly arrangements and an
          archive of original botanical prints.
        </p>
        <div className="protea-mast-cta">
          <a className="protea-btn protea-btn-gold" href="#archive">Browse the print archive</a>
          <a className="protea-btn protea-btn-line" href="#arrangements">Fresh arrangements</a>
        </div>
      </header>

      {/* FRESH ARRANGEMENTS — Counter, flagged out of season */}
      {counter && (
        <section id="arrangements" className="protea-section">
          <p className="protea-eyebrow">Fresh Arrangements</p>
          <div className="protea-arrangement">
            {counter.image && (
              <div className="protea-arr-photo"><img src={counter.image} alt={counter.title} loading="lazy" /></div>
            )}
            <div className="protea-arr-body">
              <h3>{counter.title.replace('Ohana Bloom — ', '').replace(' (Weekly)', '')}</h3>
              <p>{counter.description}</p>
              <span className="protea-oos-badge">Out of season · Out of stock</span>
            </div>
          </div>
        </section>
      )}

      {/* PRINT ARCHIVE — all prints, grouped, as buyable menu items */}
      <section id="archive" className="protea-section protea-section--alt">
        <p className="protea-eyebrow">The Protea Print Archive</p>
        <p className="protea-lede">
          Original botanical photography, documented by the founding grower in Puna. High-resolution
          digital downloads, ${prints[0] ? prints[0].price.toFixed(2) : '4.99'} each.
        </p>
        {orderedLabels.map(label => (
          <div key={label} className="protea-print-group">
            <h3 className="protea-subhead">{label}</h3>
            <div className="protea-prints">
              {grouped.get(label)!.map(p => <PrintItem key={p.id} print={p} />)}
            </div>
          </div>
        ))}
      </section>

      {/* FIELD REPORT — optional upsell, not a wall */}
      <section id="join" className="protea-section protea-join">
        <p className="protea-eyebrow protea-eyebrow--blush">The Field Report · $4.99 / month</p>
        <h2>Get new prints first</h2>
        <p className="protea-join-copy">
          Every print above is available to buy à la carte. Members of The Field Report get a monthly
          dispatch from the Napuʻuapele growing site — harvest notes and new prints the week they’re shot.
          Cancel anytime.
        </p>
        <a
          className="protea-btn protea-btn-gold"
          href={FIELD_REPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('field_report_join', {})}
        >
          Join · $4.99/mo →
        </a>
      </section>

      <footer className="protea-foot">
        <p>TOPP — Transnational Organization of Protea Planters</p>
        <p>Reserve a standing order: Ranell · (808) 731-9809 · khparelations@gmail.com</p>
      </footer>
    </div>
  );
}
