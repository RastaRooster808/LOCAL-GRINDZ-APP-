import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';

const ADDRESS = "12-5038 Kalapana-Kapoho Beach Rd, Pāhoa, HI 96778";
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ADDRESS);
const FACEBOOK_URL = 'https://www.facebook.com/pages/Kalapana-uncle-Roberts-awa-bar/148739125185258';

const HIGHLIGHTS = [
  {
    title: 'Awa Bar',
    body: 'Traditional Hawaiian awa (kava), served the old way — pull up a stool and talk story.',
  },
  {
    title: 'Live Music & Kanikapila',
    body: 'Local musicians bring instruments and jam together. Hula happens when the music moves people.',
  },
  {
    title: 'Local Food & Farmers Market',
    body: 'Food trucks, plate lunch, and Puna-grown produce and crafts from neighbors and small vendors.',
  },
  {
    title: 'Lava Coast Sunset',
    body: "The gathering sits on the coastline reshaped by the 2018 eruption — one of the best sunset views on the island.",
  },
];

export function UncleRoberts() {
  return (
    <div className="ur-page">
      <header className="ur-hero">
        <div className="ur-mast">
          <Link to="/" className="ur-home">← Local Grindz</Link>
        </div>
        <p className="ur-kicker">Kalapana · Puna, Hawaiʻi Island</p>
        <h1 className="ur-title">Uncle Robert's</h1>
        <p className="ur-lede">
          The Wednesday Night Market and awa bar that's been Kalapana's community living
          room for generations — live music, local food, and neighbors talking story on
          the lava coast.
        </p>
        <div className="ur-hero-btns">
          <a
            className="ur-btn ur-btn-primary"
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('cta_click', { label: 'ur_get_directions', destination: MAPS_URL, section: 'uncle_roberts' })}
          >
            Get Directions
          </a>
          <a
            className="ur-btn ur-btn-line"
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('cta_click', { label: 'ur_facebook', destination: FACEBOOK_URL, section: 'uncle_roberts' })}
          >
            Follow on Facebook ↗
          </a>
        </div>
      </header>

      <section className="ur-section">
        <p className="ur-eyebrow">Wednesday Night Market</p>
        <p className="ur-body ur-body-lg">
          Every Wednesday evening — live music and dancing into the night, with bands
          usually playing from around 6 to 9pm.
        </p>
        <p className="ur-body ur-fine-note">
          Hours can shift with the season and the ʻohana running the market — check
          their Facebook page above for the current week before you head out.
        </p>
      </section>

      <section className="ur-section ur-section--alt">
        <p className="ur-eyebrow">The Story</p>
        <p className="ur-body">
          Uncle Robert's has been a gathering place for the Kalapana community for
          decades — an awa bar and farmers market built on talking story, live music,
          and hula. When lava from the 2018 Kīlauea eruption reshaped the coastline
          around lower Puna, the market kept going, becoming even more of an anchor
          for a community that had lost so much.
        </p>
        <p className="ur-body">
          It's still run the same way: local musicians bring their own instruments,
          local vendors bring their own food and crafts, and everyone's welcome to
          pull up a chair. Look up and you'll spot the Kingdom of Hawaiʻi flag flying
          over the awa bar — the same spirit behind Local Grindz's "Kingdom" loyalty
          tokens for the booth here.
        </p>
      </section>

      <section className="ur-section">
        <p className="ur-eyebrow">What You'll Find</p>
        <div className="ur-highlights">
          {HIGHLIGHTS.map(h => (
            <div className="ur-highlight" key={h.title}>
              <h3>{h.title}</h3>
              <p>{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ur-section ur-section--alt">
        <p className="ur-eyebrow">Local Grindz at the Market</p>
        <p className="ur-body">
          Local Grindz vendors set up at Uncle Robert's, too — stop by the Rasta
          Rooster booth for custom gear, and collect a Kingdom loyalty token each
          visit toward a free plate.
        </p>
        <div className="ur-hero-btns">
          <Link className="ur-btn ur-btn-line" to="/rasta-rooster">Rasta Rooster Booth</Link>
          <Link className="ur-btn ur-btn-line" to="/kingdom-tokens">Check My Tokens</Link>
        </div>
      </section>

      <section className="ur-connect">
        <h2>Come talk story</h2>
        <p className="ur-connect-copy">{ADDRESS}</p>
        <div className="ur-connect-btns">
          <a
            className="ur-btn ur-btn-primary"
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('cta_click', { label: 'ur_get_directions_footer', destination: MAPS_URL, section: 'uncle_roberts' })}
          >
            Get Directions
          </a>
          <a
            className="ur-btn ur-btn-line"
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('cta_click', { label: 'ur_facebook_footer', destination: FACEBOOK_URL, section: 'uncle_roberts' })}
          >
            Follow on Facebook ↗
          </a>
        </div>
        <p className="ur-fine">
          A community info page kept up by Local Grindz — not Uncle Robert's official
          site. For the latest on hours and events, follow their Facebook page.
        </p>
      </section>
    </div>
  );
}
