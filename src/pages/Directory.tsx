import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Vendor } from '../lib/types';
import { SearchBar } from '../components/ui/SearchBar';
import { MarketplaceNav } from '../components/MarketplaceNav';
import { FeaturedVendorCard } from '../components/FeaturedVendorCard';
import { getCategory, getFeaturedForCategory } from '../lib/marketplace';
import { guard, type SupabaseResult } from '../lib/load';
import { LoadError } from '../components/ui/LoadError';

const CUISINES = ['All', 'Burger', 'Plate', 'Seafood', 'Vegan', 'Coffee', 'Dessert'];

const CATEGORY_TAGLINES: Record<string, string> = {
  all: 'The Big Island Community Marketplace',
  foodtrucks: 'Local Food Trucks & Restaurants',
  restaurants: 'Local Food Trucks & Restaurants',
  bakery: 'Fresh Local Bakeries',
  wellness: 'Wellness Drinks & Island Botanicals',
  markets: 'Markets & Farmers',
  fruit: 'Local Fruit & Produce',
  flowers: 'Florists & Flower Growers',
  makers: 'Artists & Makers',
  featured: 'Featured Vendors',
};

function VendorCard({ v }: { v: Vendor }) {
  const loc = v.locations?.[0];
  const isOpen = loc?.status === 'open';
  const isFeatured = v.vendor_features?.some(f => new Date(f.feature_expires_at) > new Date());
  const cardImg = v.photo_url || v.logo_url;
  return (
    <Link to={`/vendors/${v.slug}`} className={`vendor-card${isFeatured ? ' vendor-card--featured' : ''}`}>
      {isFeatured && <span className="featured-badge">Featured</span>}
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

export function Directory() {
  const [params] = useSearchParams();
  const catSlug = params.get('cat') ?? 'all';
  const category = getCategory(catSlug === 'featured' ? 'all' : catSlug);
  const featuredHere = getFeaturedForCategory(catSlug);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [cuisine, setCuisine] = useState('All');
  const [openOnly, setOpenOnly] = useState(false);

  // Cuisine chips only make sense when browsing food
  const showCuisineChips = catSlug === 'all' || catSlug === 'restaurants' || catSlug === 'foodtrucks';

  useEffect(() => {
    let query = supabase
      .from('vendors')
      .select('id, slug, name, cuisine_type, description, neighborhood, photo_url, logo_url, locations(name, status), vendor_features(feature_expires_at, tier)')
      .eq('is_active', true)
      .order('name');

    if (category.matches.length > 0) {
      query = query.or(category.matches.map(m => `cuisine_type.ilike.%${m}%`).join(','));
    }
    if (showCuisineChips && cuisine !== 'All') query = query.ilike('cuisine_type', cuisine);

    guard(query as PromiseLike<SupabaseResult<Vendor[]>>, [] as Vendor[]).then(({ data, error }) => {
      setLoadError(error);
      let results = data;
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
  }, [catSlug, cuisine, openOnly, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const emptyMessage = loadError
    ? null
    : catSlug === 'featured' && featuredHere.length > 0
    ? null
    : vendors.length === 0
      ? catSlug === 'flowers'
        ? 'More local florists are joining soon — every flower grower on the island is welcome here.'
        : 'No vendors in this category yet — local vendors can join free.'
      : null;

  return (
    <div>
      <header className="site-header">
        <Link to="/" className="back-link">← Home</Link>
        <h1>The Kingdom Emporium</h1>
        <p className="tagline">{CATEGORY_TAGLINES[catSlug] ?? CATEGORY_TAGLINES.all}</p>
        <Link to="/map" className="btn-outline btn-sm" style={{ marginLeft: 'auto' }}>🗺 Map View</Link>
      </header>

      <MarketplaceNav />

      <main className="directory-main">
        <div className="dir-search-row">
          <SearchBar placeholder="Search trucks, dishes…" />
        </div>

        {showCuisineChips && (
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
        )}

        {/* Featured vendor placement — premium slot inside the category, clearly labeled */}
        {featuredHere.length > 0 && (
          <section className="fv-section" aria-label="Featured vendors">
            {featuredHere.map(fv => <FeaturedVendorCard key={fv.id} vendor={fv} />)}
            <p className="fv-disclosure">
              Featured vendors are independent local businesses with premium placement.
              All {catSlug === 'featured' ? 'marketplace' : category.label.toLowerCase()} vendors appear below.
            </p>
          </section>
        )}

        {catSlug !== 'featured' && (
          loading
            ? <p className="loading-msg">Loading vendors…</p>
            : loadError
              ? <LoadError message={loadError} onRetry={() => { setLoadError(null); setReloadKey(k => k + 1); }} />
              : vendors.length > 0
                ? <div className="vendor-grid">{vendors.map(v => <VendorCard key={v.id} v={v} />)}</div>
                : <p className="empty-msg">{emptyMessage ?? 'No vendors match your filters.'}</p>
        )}
        {/* Never invite someone to fill a gap that only exists because the read
            failed. The nudge is for a genuinely empty category, not an outage. */}
        {catSlug !== 'featured' && vendors.length === 0 && !loading && !loadError && (
          <p className="join-nudge"><Link to="/apply">Local vendor? Join the marketplace free →</Link></p>
        )}
      </main>
    </div>
  );
}
