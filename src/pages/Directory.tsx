import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Vendor } from '../lib/types';

const CUISINES = ['All', 'Burger', 'Plate', 'Seafood', 'Vegan', 'Coffee', 'Dessert'];

function VendorCard({ v }: { v: Vendor }) {
  const loc = v.locations?.[0];
  const isOpen = loc?.status === 'open';
  const isFeatured = v.vendor_features?.some(f => new Date(f.feature_expires_at) > new Date());
  return (
    <Link to={`/vendors/${v.slug}`} className={`vendor-card${isFeatured ? ' vendor-card--featured' : ''}`}>
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

export function Directory() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [cuisine, setCuisine] = useState('All');
  const [openOnly, setOpenOnly] = useState(false);

  useEffect(() => {
    let query = supabase
      .from('vendors')
      .select('id, slug, name, cuisine_type, description, neighborhood, locations(name, status), vendor_features(feature_expires_at, tier)')
      .eq('is_active', true)
      .order('name');

    if (cuisine !== 'All') query = query.ilike('cuisine_type', cuisine);

    query.then(({ data }) => {
      let results = (data as Vendor[]) || [];
      if (openOnly) results = results.filter(v => v.locations?.some(l => l.status === 'open'));
      // Featured first
      results.sort((a, b) => {
        const af = a.vendor_features?.some(f => new Date(f.feature_expires_at) > new Date()) ? 1 : 0;
        const bf = b.vendor_features?.some(f => new Date(f.feature_expires_at) > new Date()) ? 1 : 0;
        return bf - af;
      });
      setVendors(results);
      setLoading(false);
    });
  }, [cuisine, openOnly]);

  return (
    <div>
      <header className="site-header">
        <Link to="/" className="back-link">← Home</Link>
        <h1>Local Grindz</h1>
        <p className="tagline">All Trucks</p>
      </header>

      <main className="directory-main">
        <div className="filter-bar">
          {CUISINES.map(c => (
            <button
              key={c}
              className={`filter-chip${cuisine === c ? ' active' : ''}`}
              onClick={() => setCuisine(c)}
            >
              {c}
            </button>
          ))}
          <button
            className={`filter-chip${openOnly ? ' active' : ''}`}
            onClick={() => setOpenOnly(p => !p)}
          >
            Open Now
          </button>
        </div>

        {loading
          ? <p className="loading-msg">Loading vendors…</p>
          : vendors.length > 0
            ? <div className="vendor-grid">{vendors.map(v => <VendorCard key={v.id} v={v} />)}</div>
            : <p className="empty-msg">No vendors match your filters.</p>
        }
      </main>
    </div>
  );
}
