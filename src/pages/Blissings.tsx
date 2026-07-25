import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';

/**
 * Blissings.tsx — EijaHu Blissings partner page.
 *
 * A Kingdom Emporium partner: Eija & Sanoi's ceremonial handpoke tatu practice.
 * Content and imagery are the partner's own. Voice and spelling ("tatu",
 * "Blissing", "innerstanding") are intentional to the brand — preserved as given.
 */

// Rehosted from the partner's wsimg CDN into our Supabase vendor-assets bucket
// (partners/eijahu-blissings/*). No external hotlink dependency.
const BUCKET =
  'https://pqzygehnnojdttmqadrz.supabase.co/storage/v1/object/public/vendor-assets/partners/eijahu-blissings';

const HERO = `${BUCKET}/hero.jpg`;

/** EijaHu Blissings social links. Add real handles here and they render as
 *  gold buttons; the "Explore Local Grindz" fallback is always present. */
const SOCIALS: { label: string; url: string }[] = [
  // e.g. { label: 'Instagram', url: 'https://instagram.com/…' },
];

const GALLERY = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9'].map(n => `${BUCKET}/${n}.jpg`);

const CEREMONY = [
  {
    phase: 'Day of Arrival',
    body: 'The day before your ceremony we take time and space to allow your soul to anchor into the present moment. In keeping with the ancient tradition of shared meals amongst friends, we prepare a home-cooked vegetarian dinner to nourish mind, body, and soul — grounding in the beauty of Mother Nature and preparing for the journey ahead.',
  },
  {
    phase: 'Day of Blissing Activation',
    body: 'We gather and share a cup of tea blessed with health and wellness. Sanoi facilitates the activation and cleansing of your auric field so your light may be anchored to receive the markings. After a vegetarian snack, Eija hand-draws the vision onto your body (1–2 hrs). Then, for the next 3–6 hrs, the Blissing Activation begins — the power and magick of a handpoke ceremony, channeled with precision and grace.',
  },
  {
    phase: 'Day After',
    body: 'We wake gently, embracing the new sensations of your Blissing, and gather for tea to share reflections. If the Blissing calls for more time, we continue. If it is complete, we lovingly part ways — celebrating as you step back into the world, fully activated with your sacred markings, protecting and guiding you as you fulfill your life’s purpose.',
  },
];

const TESTIMONIES = [
  {
    title: 'Armor of the Past Life',
    quote: 'Incredible experience. I am deeply impressed by how Eija and Sanoi work their magic together. Sanoi holds a powerful and protective container while Eija brings the vision into physical manifestation.',
    who: 'Zuriah', when: '6/15/2022',
  },
  {
    title: 'Raves of Sufjana',
    quote: 'Two works done in tatu ceremony this past year, and both have been incredibly beautiful experiences. Channeled tatu with such a depth of beauty, encoding messages from a true and high place. An initiation and an honoring in the most beautiful of ways. So grateful ♡',
    who: 'Sufjana', when: '8/1/2025',
  },
  {
    title: 'Expansion of Growth',
    quote: 'My blessing from Eija and Sanoi awoke within me a deep connection to the divine — striking a cord within my heart and strengthening my bond to the balance and harmony of the universe.',
    who: 'Maegan K.', when: '8/20/2022',
  },
  {
    title: 'Transcendent',
    quote: 'One of the most powerful activations in my life so far. They are both extremely talented and pure in their way of ceremony. These are some serious activations…',
    who: 'Amber D.', when: '7/24/2021',
  },
];

export function Blissings() {
  return (
    <div className="bliss-page">
      <header className="bliss-hero">
        <img className="bliss-hero-img" src={HERO} alt="" loading="eager" />
        <div className="bliss-hero-overlay">
          <div className="bliss-mast-label">
            <span>EijaHu Blissings</span>
            <Link to="/" className="bliss-home">← Local Grindz</Link>
          </div>
          <p className="bliss-kicker">Answer the Call</p>
          <h1>Ceremonial Handpoke Tatu</h1>
          <p className="bliss-blessing">"Blissed are those whom walk the path of authenticity."</p>
          <a
            className="bliss-btn bliss-btn-gold"
            href="#connect"
            onClick={() => trackEvent('cta_click', { label: 'bliss_answer_call', section: 'blissings' })}
          >
            Answer the Call
          </a>
        </div>
      </header>

      <section className="bliss-section">
        <p className="bliss-eyebrow">Answering the Call · Activations</p>
        <p className="bliss-lede">
          Aloha to your beautiful soul. With an open heart, we welcome you into a space of
          remembrance — a return to meaning, purpose, and deep connection.
        </p>
        <p className="bliss-body">
          From a young age I, Eija, felt a deep passion for tattooing — drawn to the art as a form of
          expression and connection long before innerstanding the depth of this sacred tatu medicine.
          Leaving my home country Finland and traveling the planet, I met my beloved Sanoi in Thailand.
          As an inner-world guide and grid walker, Sanoi guided me back to the remembering of my true
          essence and the truth of my soul’s higher calling.
        </p>
        <p className="bliss-body">
          With years of experience in tatu medicine, we offer ceremonial handpoke tatus as a sacred
          blood ritual — where each marking becomes a prayer, an activation, and a reflection of one’s
          journey. As One we answer our call, anchoring and activating the Light within the warriors and
          medicine people who have also answered theirs.
        </p>
        <p className="bliss-signature">Love and Aloha,<br />Eija &amp; Sanoi</p>
      </section>

      <section className="bliss-section bliss-section--alt">
        <p className="bliss-eyebrow">The Ceremony</p>
        <div className="bliss-ceremony">
          {CEREMONY.map((c, i) => (
            <div className="bliss-phase" key={c.phase}>
              <span className="bliss-phase-num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{c.phase}</h3>
                <p>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bliss-section">
        <p className="bliss-eyebrow">Testimony</p>
        <div className="bliss-testimonies">
          {TESTIMONIES.map(t => (
            <figure className="bliss-testimony" key={t.title}>
              <figcaption className="bliss-testimony-title">{t.title}</figcaption>
              <blockquote>{t.quote}</blockquote>
              <p className="bliss-testimony-who">— {t.who} · {t.when}</p>
            </figure>
          ))}
        </div>
      </section>

      <section className="bliss-gallery-section">
        <p className="bliss-eyebrow">The Work</p>
        <div className="bliss-gallery">
          {GALLERY.map((url, i) => (
            <img key={url} src={url} alt={`EijaHu Blissings ceremonial handpoke tatu work ${i + 1}`} loading="lazy" />
          ))}
        </div>
      </section>

      <section className="bliss-connect" id="connect">
        <p className="bliss-eyebrow bliss-eyebrow--gold">Answer the Call</p>
        <h2>Ready to walk the path?</h2>
        <p className="bliss-connect-copy">
          If the Blissing is calling you, reach out. Eija &amp; Sanoi hold each ceremony as a sacred,
          intentional container — every marking a prayer, an activation, a reflection of your journey.
        </p>
        <div className="bliss-connect-btns">
          {SOCIALS.length > 0 && SOCIALS.map(s => (
            <a
              key={s.label}
              className="bliss-btn bliss-btn-gold"
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('cta_click', { label: `bliss_social_${s.label}`, section: 'blissings' })}
            >
              {s.label}
            </a>
          ))}
          <Link
            className={`bliss-btn ${SOCIALS.length > 0 ? 'bliss-btn-line' : 'bliss-btn-gold'}`}
            to="/"
            onClick={() => trackEvent('cta_click', { label: 'bliss_back_to_local_grindz', section: 'blissings' })}
          >
            Explore Local Grindz
          </Link>
        </div>
        <p className="bliss-fine">EijaHu Blissings · Ceremonial Handpoke Tatu · Hawaiʻi Island</p>
      </section>
    </div>
  );
}
