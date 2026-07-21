import { fetchAllVendors, vendorCard } from './vendors-client.js';

async function renderOpenVendors() {
  const el = document.getElementById('open-vendors');
  if (!el) return;
  const vendors = await fetchAllVendors({ onlyOpen: true });
  if (!vendors.length) {
    el.innerHTML = '<p class="empty-msg">No trucks open right now — check back soon!</p>';
    return;
  }
  // Rewrite hrefs for landing page (one level up from /vendors/)
  el.innerHTML = vendors.slice(0, 4).map(v => {
    const card = vendorCard(v);
    return card.replace('./storefront.html?vendor=', './vendors/storefront.html?vendor=');
  }).join('');
}

async function renderFeaturedVendors() {
  const el = document.getElementById('featured-vendors');
  if (!el) return;
  const vendors = await fetchAllVendors();
  const featured = vendors.filter(v =>
    v.vendor_features?.some(f => new Date(f.feature_expires_at) > new Date())
  );
  if (!featured.length) {
    el.closest('section')?.classList.add('hidden');
    return;
  }
  el.innerHTML = featured.map(v => {
    const card = vendorCard(v);
    return card.replace('./storefront.html?vendor=', './vendors/storefront.html?vendor=');
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderOpenVendors();
  renderFeaturedVendors();
});
