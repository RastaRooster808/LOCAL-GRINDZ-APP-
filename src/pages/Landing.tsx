import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Vendor, VendorFeature } from '../lib/types';

interface Announcement {
  id: string;
  body: string;
  active: boolean;
  expires_at: string | null;
}

const TIER_LABEL: Record<string, string> = {
  spotlight: '✨ Spotlight',
  featured: '⭐ Featured',
  boost: '🔥 Boosted',
};

function VendorCard({ v }: { v: Vendor }) {
  const loc = v.locations?.[0];
  const isOpen = loc?.status === 'open';
  const activeFeature = v.vendor_features?.find(f => new Date(f.feature_expires_at) > new Date()) as VendorFeature | undefined;
  const cardImg = v.photo_url || v.logo_url;
  return (
    <Link to={`/vendors/${v.slug}`} className={`vendor-card${activeFeature ? ' vendor-card--featured' : ''}`}>
      {activeFeature && (
        <span className="featured-badge">{TIER_LABEL[activeFeature.tier] ?? '⭐ Featured'}</span>
      )}
      <div className="vendor-card-photo-wrap">
        {cardImg
          ? <img src={cardImg} alt={v.name} className="vendor-card-photo" loading="lazy" />
          : <div className="vendor-card-photo vendor-card-photo--placeholder">🍽</div>
        }
        <span className={`card-status-dot status-dot--${isOpen ? 'open' : 'closed'}`} />
      </div>
      <div className="vendor-card-body">
        <h3>{v.name}</h3>
        <p className="vendor-cuisine">{v.cuisine_type}</p>
        {v.description && <p className="vendor-desc">{v.description}</p>}
        {loc && <p className="vendor-location-line">{loc.name}</p>}
      </div>
      <span className={`location-status status-${isOpen ? 'open' : 'closed'}`}>
        {isOpen ? 'Open' : 'Closed'}
      </span>
    </Link>
  );
}

function FeaturedCarousel({ vendors }: { vendors: Vendor[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function scrollTo(idx: number) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[idx] as HTMLElement;
    if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    setActive(idx);
  }

  // Update dot on manual scroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handler = () => {
      const cardW = (track.firstElementChild as HTMLElement)?.offsetWidth || 1;
      setActive(Math.round(track.scrollLeft / cardW));
    };
    track.addEventListener('scroll', handler, { passive: true });
    return () => track.removeEventListener('scroll', handler);
  }, []);

  if (vendors.length === 0) return null;

  return (
    <section className="carousel-section" aria-label="Featured vendors carousel">
      <div className="carousel-header">
        <h2>Featured Trucks</h2>
        <div className="carousel-dots" role="tablist" aria-label="Carousel navigation">
          {vendors.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={active === i}
              aria-label={`Slide ${i + 1}`}
              className={`carousel-dot${active === i ? ' active' : ''}`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      </div>
      <div ref={trackRef} className="carousel-track" aria-live="polite">
        {vendors.map(v => {
          const loc = v.locations?.[0];
          const isOpen = loc?.status === 'open';
          const tier = v.vendor_features?.find(f => new Date(f.feature_expires_at) > new Date())?.tier ?? 'featured';
          const bg = v.photo_url || v.logo_url;
          return (
            <Link key={v.id} to={`/vendors/${v.slug}`} className="carousel-slide">
              {bg && (
                <div className="carousel-slide-bg" style={{ backgroundImage: `url(${bg})` }} aria-hidden="true" />
              )}
              <div className="carousel-slide-content">
                {v.logo_url && <img src={v.logo_url} alt={`${v.name} logo`} className="carousel-logo" />}
                <div className="carousel-slide-text">
                  <span className="carousel-tier-badge">{TIER_LABEL[tier] ?? '⭐ Featured'}</span>
                  <h3 className="carousel-name">{v.name}</h3>
                  {v.cuisine_type && <p className="carousel-cuisine">{v.cuisine_type}</p>}
                  {v.description && <p className="carousel-desc">{v.description}</p>}
                  {loc && (
                    <p className="carousel-location">
                      📍 {loc.name}
                      <span className={`carousel-status${isOpen ? '--open' : '--closed'}`}>
                        {isOpen ? ' · Open' : ' · Closed'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function Landing() {
  const [openVendors, setOpenVendors] = useState<Vendor[]>([]);
  const [featuredVendors, setFeaturedVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

  useEffect(() => {
    const now = new Date().toISOString();
    supabase
      .from('announcements')
      .select('id, body, active, expires_at')
      .eq('active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setAnnouncements((data as Announcement[]) || []));
  }, []);

  useEffect(() => {
    supabase
      .from('vendors')
      .select('id, slug, name, cuisine_type, description, neighborhood, photo_url, logo_url, locations(name, status), vendor_features(feature_expires_at, tier)')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        const vendors = (data as Vendor[]) || [];
        const now = new Date();
        const isActive = (v: Vendor) => v.vendor_features?.some(f => new Date(f.feature_expires_at) > now);
        setOpenVendors(vendors.filter(v => v.locations?.some(l => l.status === 'open')));
        // Featured carousel: spotlight first, then featured, then boost
        const featured = vendors.filter(isActive).sort((a, b) => {
          const tierOrder = ['spotlight', 'featured', 'boost'];
          const ta = a.vendor_features?.find(f => new Date(f.feature_expires_at) > now)?.tier ?? '';
          const tb = b.vendor_features?.find(f => new Date(f.feature_expires_at) > now)?.tier ?? '';
          return tierOrder.indexOf(ta) - tierOrder.indexOf(tb);
        });
        setFeaturedVendors(featured);
        setLoading(false);
      });
  }, []);

  return (
    <div className="landing-body">
      <header className="landing-header">
        <div className="landing-header-inner">
          <h1>Local Grindz</h1>
          <p className="tagline">Big Island's food truck marketplace</p>
          <div className="header-actions">
            <Link to="/vendors" className="btn-primary btn-lg">Find a Truck</Link>
            <Link to="/map" className="btn-outline">🗺 Map</Link>
            <Link to="/apply" className="btn-outline">Join as Vendor</Link>
          </div>
        </div>
      </header>

      {/* Announcement banners */}
      {announcements.filter(a => !dismissedAnnouncements.has(a.id)).map(a => (
        <div key={a.id} className="announcement-banner" role="alert">
          <span>{a.body}</span>
          <button
            className="announcement-close"
            onClick={() => setDismissedAnnouncements(prev => new Set([...prev, a.id]))}
            aria-label="Dismiss announcement"
          >✕</button>
        </div>
      ))}

      <main className="landing-main">
        {/* Featured carousel — only shown when vendors have active features */}
        {!loading && <FeaturedCarousel vendors={featuredVendors} />}

        <section className="landing-section">
          <h2>Open Now</h2>
          {loading
            ? <p className="loading-msg">Loading…</p>
            : openVendors.length > 0
              ? <div className="vendor-grid">{openVendors.map(v => <VendorCard key={v.id} v={v} />)}</div>
              : <p className="empty-msg">No trucks open right now.</p>
          }
          <Link to="/vendors" className="view-all-link">View all vendors →</Link>
        </section>

        <section className="landing-cta">
          <div className="cta-box">
            <h2>Got a food truck?</h2>
            <p>Join Local Grindz and connect with hungry customers across the Big Island.</p>
            <Link to="/apply" className="btn-primary">Apply to Join</Link>
          </div>
        </section>
      </main>

      <footer>
        <p>Local Grindz — Puna, Big Island, Hawaii</p>
        <nav className="footer-nav">
          <Link to="/vendors">All Vendors</Link>
          <Link to="/map">Map</Link>
          <Link to="/account">My Account</Link>
          <Link to="/apply">Apply</Link>
          <Link to="/vendor">Vendor Login</Link>
        </nav>
      </footer>
    </div>
  );
}
