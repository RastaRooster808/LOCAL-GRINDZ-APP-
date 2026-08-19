import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { usePageFavicon } from '../hooks/usePageFavicon';
import logo from '../assets/rasta-rooster-logo.webp';

const FAVICON = `${import.meta.env.BASE_URL}icons/rasta-rooster-mark-192.png`;
const SHOPIFY_MERCH_URL = 'https://rastarooster.com/collections/merch';

const STEPS = [
  {
    num: '01',
    title: 'Choose Your Garment',
    body: 'Tee, heavy cotton tee, or hoodie — pick your color and size.',
  },
  {
    num: '02',
    title: 'Tell Us Your Design',
    body: 'Rasta Rooster flash art, custom text, a Pūna district callout, or a photo you send us.',
  },
  {
    num: '03',
    title: 'Pickup or Delivery',
    body: 'Free pickup in Pāhoa, or flat-rate shipping anywhere on the Big Island.',
  },
];

export function RastaRooster() {
  usePageFavicon(FAVICON);

  return (
    <div className="rr-page">
      <header className="rr-hero">
        <div className="rr-mast">
          <Link to="/" className="rr-home">← Local Grindz</Link>
        </div>
        <img className="rr-logo" src={logo} alt="Rasta Rooster — Jah Blessings Be Upon You" loading="eager" />
        <p className="rr-kicker">Pāhoa, Hawaiʻi</p>
        <p className="rr-lede">
          A direct-to-community custom apparel line — no middleman, no big-box
          shipping rates. Just Rasta Rooster tees, made to order for the Big Island.
        </p>
        <div className="rr-hero-btns">
          <Link
            className="rr-btn rr-btn-primary"
            to="/custom-tee"
            onClick={() => trackEvent('cta_click', { label: 'rr_design_your_tee', destination: '/custom-tee', section: 'rasta_rooster' })}
          >
            Design Your Tee
          </Link>
          <a
            className="rr-btn rr-btn-line"
            href={SHOPIFY_MERCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('cta_click', { label: 'rr_shop_rastarooster', destination: SHOPIFY_MERCH_URL, section: 'rasta_rooster' })}
          >
            Shop rastarooster.com ↗
          </a>
        </div>
      </header>

      <section className="rr-section">
        <p className="rr-eyebrow">The Idea</p>
        <p className="rr-body">
          Rasta Rooster is Local Grindz's own brand — built so Kamaʻāina can get custom
          gear without paying big-platform cuts or mainland shipping rates. Every order
          is made to order and printed right here, close to home.
        </p>
        <p className="rr-body">
          Pick a garment, tell us what you want on it, and choose free Pāhoa pickup or
          flat-rate delivery anywhere on Hawaiʻi Island. We'll confirm your design and
          price before anything goes to print.
        </p>
      </section>

      <section className="rr-section rr-section--alt">
        <p className="rr-eyebrow">How It Works</p>
        <div className="rr-steps">
          {STEPS.map(s => (
            <div className="rr-step" key={s.num}>
              <span className="rr-step-num">{s.num}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rr-connect">
        <h2>Ready to design yours?</h2>
        <p className="rr-connect-copy">
          Takes a couple minutes — we'll follow up to confirm your design and price
          before we print anything.
        </p>
        <div className="rr-connect-btns">
          <Link
            className="rr-btn rr-btn-primary"
            to="/custom-tee"
            onClick={() => trackEvent('cta_click', { label: 'rr_design_your_tee_footer', destination: '/custom-tee', section: 'rasta_rooster' })}
          >
            Design Your Tee
          </Link>
          <a
            className="rr-btn rr-btn-line"
            href={SHOPIFY_MERCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('cta_click', { label: 'rr_shop_rastarooster_footer', destination: SHOPIFY_MERCH_URL, section: 'rasta_rooster' })}
          >
            Shop rastarooster.com ↗
          </a>
        </div>
        <p className="rr-fine">Rasta Rooster · Pāhoa, Hawaiʻi Island</p>
      </section>
    </div>
  );
}
