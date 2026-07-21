import { getClient } from './supabase-client.js';

async function fetchAllVendors({ onlyOpen = false, cuisine = null } = {}) {
  const db = getClient();
  if (!db) return [];
  let query = db
    .from('vendors')
    .select(`id, slug, name, cuisine_type, description, photo_url, neighborhood,
             locations(name, status),
             vendor_features(feature_expires_at, tier)`)
    .eq('is_active', true)
    .order('name');
  if (cuisine) query = query.eq('cuisine_type', cuisine);
  const { data, error } = await query;
  if (error || !data) return [];
  let results = data;
  if (onlyOpen) {
    results = results.filter(v => v.locations?.some(l => l.status === 'open'));
  }
  // Featured first
  results.sort((a, b) => {
    const aFeat = a.vendor_features?.some(f => new Date(f.feature_expires_at) > new Date());
    const bFeat = b.vendor_features?.some(f => new Date(f.feature_expires_at) > new Date());
    return (bFeat ? 1 : 0) - (aFeat ? 1 : 0);
  });
  return results;
}

async function fetchVendorBySlug(slug) {
  const db = getClient();
  if (!db) return null;
  const { data, error } = await db
    .from('vendors')
    .select('id, slug, name, cuisine_type, description, photo_url, neighborhood')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error) return null;
  return data;
}

async function fetchVendorMenu(vendorId) {
  const db = getClient();
  if (!db) {
    const res = await fetch('../data/menu.json');
    return res.json();
  }
  const { data, error } = await db
    .from('menu_items')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('available', true)
    .order('category');
  if (error || !data?.length) {
    const res = await fetch('../data/menu.json');
    return res.json();
  }
  return data;
}

async function fetchVendorLocation(vendorId) {
  const db = getClient();
  if (!db) {
    const res = await fetch('../data/location.json');
    return res.json();
  }
  const { data, error } = await db
    .from('locations')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) {
    const res = await fetch('../data/location.json');
    return res.json();
  }
  return data;
}

async function fetchVendorSpecials(vendorId) {
  const db = getClient();
  if (!db) {
    const res = await fetch('../data/specials.json');
    return res.json();
  }
  const { data, error } = await db
    .from('specials')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error || !data?.length) {
    const res = await fetch('../data/specials.json');
    return res.json();
  }
  return data;
}

async function fetchVendorReviews(vendorId) {
  const db = getClient();
  if (!db) return [];
  const { data, error } = await db
    .from('reviews')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(10);
  return error ? [] : (data || []);
}

async function submitVendorOrder(vendorId, order) {
  const db = getClient();
  if (!db) throw new Error('Database not configured');
  const { data, error } = await db.from('orders').insert({ ...order, vendor_id: vendorId }).select('id').single();
  if (error) throw error;
  return data;
}

async function submitVendorReview(vendorId, review) {
  const db = getClient();
  if (!db) throw new Error('Database not configured');
  const { error } = await db.from('reviews').insert({ ...review, vendor_id: vendorId });
  if (error) throw error;
}

function vendorCard(vendor) {
  const loc = vendor.locations?.[0];
  const isOpen = loc?.status === 'open';
  const isFeatured = vendor.vendor_features?.some(
    f => new Date(f.feature_expires_at) > new Date()
  );
  return `
    <a href="./storefront.html?vendor=${vendor.slug}" class="vendor-card${isFeatured ? ' vendor-card--featured' : ''}">
      ${isFeatured ? '<span class="featured-badge">Featured</span>' : ''}
      <div class="vendor-card-body">
        <h3>${vendor.name}</h3>
        <p class="vendor-cuisine">${vendor.cuisine_type || ''}</p>
        ${vendor.description ? `<p class="vendor-desc">${vendor.description}</p>` : ''}
        ${loc ? `<p class="vendor-location-line">${loc.name}</p>` : ''}
      </div>
      <span class="location-status status-${isOpen ? 'open' : 'closed'}">${isOpen ? 'Open' : 'Closed'}</span>
    </a>
  `;
}

export {
  fetchAllVendors, fetchVendorBySlug,
  fetchVendorMenu, fetchVendorLocation, fetchVendorSpecials,
  fetchVendorReviews, submitVendorOrder, submitVendorReview,
  vendorCard
};
