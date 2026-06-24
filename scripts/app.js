document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  loadLocationData();
  loadMenuData();
  loadSpecialsData();
});

// ─── Service Worker ────────────────────────────────────────────────────────

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .register('/service-worker.js')
    .then(reg => console.log('SW registered:', reg.scope))
    .catch(err => console.error('SW registration failed:', err));
}

// ─── Location ──────────────────────────────────────────────────────────────

async function loadLocationData() {
  try {
    const res = await fetch('/data/locations.json');
    if (!res.ok) throw new Error('fetch failed');
    const locations = await res.json();
    const loc = locations[0];
    if (loc) renderLocation(loc);
  } catch {
    // keep static fallback
  }
}

function renderLocation(loc) {
  const section = document.getElementById('live-location');
  if (!section) return;

  const isOpen = loc.live_status === 'open';
  const badgeColor = isOpen ? '#27ae60' : '#e63946';
  const badgeText  = isOpen ? 'OPEN NOW' : 'CLOSED';

  const lastUpdated = loc.last_updated
    ? new Date(loc.last_updated).toLocaleTimeString('en-US', {
        timeZone: 'Pacific/Honolulu',
        hour: 'numeric', minute: '2-digit', hour12: true,
      })
    : null;

  section.innerHTML = `
    <h2>Live Truck Location</h2>
    <span class="status-badge" style="background:${badgeColor};color:#fff">${badgeText}</span>
    <p style="margin:.75rem 0 .2rem"><strong>${loc.current_location_name}</strong></p>
    <p style="margin:0 0 .25rem;color:#b8b8b8;font-size:.9rem">${loc.address}</p>
    <p style="margin:0 0 .5rem">Hours today: <strong>${loc.hours_today}</strong></p>
    ${lastUpdated ? `<p style="margin:0;font-size:.72rem;color:#666">Updated ${lastUpdated} HST</p>` : ''}
  `;
}

// ─── Featured Menu Item ────────────────────────────────────────────────────

async function loadMenuData() {
  try {
    const res = await fetch('/data/menus.json');
    if (!res.ok) throw new Error('fetch failed');
    const menu = await res.json();
    const featured = menu.find(item => item.featured && item.available);
    if (featured) renderFeaturedItem(featured);
  } catch {
    // keep static fallback
  }
}

function renderFeaturedItem(item) {
  const section = document.getElementById('featured-burger');
  if (!section) return;

  const spice = item.spicy_level > 0
    ? `<span aria-label="${item.spicy_level} of 5 spice">${'🌶️'.repeat(item.spicy_level)}</span>`
    : '';

  section.innerHTML = `
    <h2>Featured Item</h2>
    <p style="margin:0 0 .2rem"><strong style="font-size:1.05rem">${item.name}</strong> ${spice}</p>
    <p style="color:#b8b8b8;font-size:.88rem;margin:0 0 .7rem;line-height:1.5">${item.description}</p>
    <span class="status-badge" style="font-size:.95rem;padding:.3rem .8rem">$${item.price.toFixed(2)}</span>
  `;
}

// ─── Today's Special ───────────────────────────────────────────────────────

async function loadSpecialsData() {
  try {
    const res = await fetch('/data/specials.json');
    if (!res.ok) throw new Error('fetch failed');
    const specials = await res.json();
    const active = specials.filter(s => s.active && !isPast(s.end_time));
    if (active.length > 0) renderTodaySpecial(active[0]);
  } catch {
    // no special section shown — leave hidden
  }
}

function isPast(isoString) {
  if (!isoString) return false;
  return new Date(isoString) < new Date();
}

function renderTodaySpecial(special) {
  const section = document.getElementById('todays-special');
  if (!section) return;

  const endTime = new Date(special.end_time).toLocaleTimeString('en-US', {
    timeZone: 'Pacific/Honolulu',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const wasPrice = special.original_price && special.original_price !== special.price
    ? `<span class="sp-was">was $${Number(special.original_price).toFixed(2)}</span>`
    : '';

  section.classList.remove('hidden');
  section.innerHTML = `
    <h2>Today's Special</h2>
    <p class="sp-title">${special.title}</p>
    ${special.description ? `<p class="sp-desc">${special.description}</p>` : ''}
    <div class="sp-price-row">
      <span class="sp-price">$${Number(special.price).toFixed(2)}</span>
      ${wasPrice}
    </div>
    <div class="sp-meta">
      <span class="sp-qty">${special.quantity_remaining} Available</span>
      <span class="sp-dot" aria-hidden="true">&middot;</span>
      <span class="sp-end">Ends ${endTime}</span>
    </div>
    <a href="/order.html" class="cta sp-cta">Order Now</a>
  `;
}
