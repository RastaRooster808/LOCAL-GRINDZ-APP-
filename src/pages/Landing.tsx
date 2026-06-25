import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Vendor } from '../lib/types';

function VendorCard({ v, prefix = '' }: { v: Vendor; prefix?: string }) {
  const loc = v.locations?.[0];
  const isOpen = loc?.status === 'open';
  const isFeatured = v.vendor_features?.some(f => new Date(f.feature_expires_at) > new Date());
  return (
    <Link to={`${prefix}/vendors/${v.slug}`} className={`vendor-card${isFeatured ? ' vendor-card--featured' : ''}`}>
      {isFeatured && <span className="featured-badge">Featured</span>}
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

export function Landing() {
  const [openVendors, setOpenVendors] = useState<Vendor[]>([]);
  const [featuredVendors, setFeaturedVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('vendors')
      .select('id, slug, name, cuisine_type, description, neighborhood, locations(name, status), vendor_features(feature_expires_at, tier)')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        const vendors = (data as Vendor[]) || [];
        setOpenVendors(vendors.filter(v => v.locations?.some(l => l.status === 'open')));
        setFeaturedVendors(vendors.filter(v => v.vendor_features?.some(f => new Date(f.feature_expires_at) > new Date())));
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
            <Link to="/apply" className="btn-outline">Join as Vendor</Link>
          </div>
        </div>
      </header>

      <main className="landing-main">
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

        {featuredVendors.length > 0 && (
          <section className="landing-section featured-section">
            <h2>Featured Trucks</h2>
            <div className="vendor-grid">
              {featuredVendors.map(v => <VendorCard key={v.id} v={v} />)}
            </div>
          </section>
        )}

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
          <Link to="/apply">Apply</Link>
          <Link to="/vendor">Vendor Login</Link>
        </nav>
      </footer>
    </div>
  );
}
