document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  loadLocationData();
  loadMenuData();
});

// ─── Service Worker ────────────────────────────────────────────────────────

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .register('/service-worker.js')
    .then(reg => console.log('SW registered:', reg.scope))
    .catch(err => console.error('SW registration failed:', err));
}

// ─── Location Data ─────────────────────────────────────────────────────────

async function loadLocationData() {
  try {
    const res = await fetch('/data/locations.json');
    if (!res.ok) throw new Error('fetch failed');
    const locations = await res.json();
    const loc = locations[0];
    if (loc) renderLocation(loc);
  } catch {
    // static fallback already in HTML
  }
}

function renderLocation(loc) {
  const section = document.getElementById('live-location');
  if (!section) return;

  const isOpen = loc.live_status === 'open';
  const badgeColor = isOpen ? '#27ae60' : '#e63946';
  const badgeText = isOpen ? 'OPEN NOW' : 'CLOSED';

  const lastUpdatedTime = new Date(loc.last_updated).toLocaleTimeString('en-US', {
    timeZone: 'Pacific/Honolulu',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  section.innerHTML = `
    <h2>Live Truck Location</h2>
    <span class="status-badge" style="background:${badgeColor};color:#fff">${badgeText}</span>
    <p style="margin:0.75rem 0 0.25rem"><strong>${loc.current_location_name}</strong></p>
    <p style="margin:0 0 0.25rem;color:#b8b8b8;font-size:0.9rem">${loc.address}</p>
    <p style="margin:0 0 0.5rem">Hours today: <strong>${loc.hours_today}</strong></p>
    <p style="margin:0;font-size:0.75rem;color:#888">Updated ${lastUpdatedTime} HST</p>
  `;
}

// ─── Menu Data ─────────────────────────────────────────────────────────────

async function loadMenuData() {
  try {
    const res = await fetch('/data/menu.json');
    if (!res.ok) throw new Error('fetch failed');
    const menu = await res.json();
    const featured = menu.find(item => item.featured && item.available);
    if (featured) renderFeaturedItem(featured);
  } catch {
    // static fallback already in HTML
  }
}

function renderFeaturedItem(item) {
  const section = document.getElementById('featured-burger');
  if (!section) return;

  const spicyHeat = item.spicy_level > 0
    ? `<span aria-label="${item.spicy_level} out of 5 spice level" style="color:#e63946;font-size:0.9rem">${'🌶️'.repeat(item.spicy_level)}</span>`
    : '';

  section.innerHTML = `
    <h2>Featured Item</h2>
    <p style="margin:0 0 0.2rem">
      <strong style="font-size:1.1rem">${item.name}</strong> ${spicyHeat}
    </p>
    <p style="color:#b8b8b8;font-size:0.9rem;margin:0 0 0.75rem">${item.description}</p>
    <span class="status-badge" style="font-size:1rem;padding:0.35rem 0.85rem">$${item.price.toFixed(2)}</span>
  `;
}
