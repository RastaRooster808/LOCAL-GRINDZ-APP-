document.addEventListener('DOMContentLoaded', init);

// ─── Fallback data (shown if JSON files are unavailable) ───────────────────

const FALLBACK = {
  vendor: {
    business_name: "Ala's Kitchen",
    tagline: 'Get Smashed',
    contact_name: 'Ala',
    approved_status: true,
    loyalty_pin: '808',
  },
  location: {
    current_location_name: 'Kalapana Black Sand Beach',
    address: 'End of Hwy 130, Pahoa, HI 96778',
    hours_today: '11:00 AM – 7:00 PM',
    live_status: 'open',
    last_updated: null,
  },
  menu: [
    { item_id: 'm001', name: 'Volcano Smash',    price: 14.00, spicy_level: 3, featured: true,  available: true },
    { item_id: 'm002', name: 'Classic Smash',    price: 10.00, spicy_level: 0, featured: false, available: true },
    { item_id: 'm003', name: 'Loco Moco Smash',  price: 13.00, spicy_level: 0, featured: false, available: true },
    { item_id: 'm004', name: 'Puna Fries',       price:  5.00, spicy_level: 1, featured: false, available: true },
    { item_id: 'm005', name: 'Lilikoi Lemonade', price:  4.00, spicy_level: 0, featured: false, available: true },
  ],
};

// ─── Init ──────────────────────────────────────────────────────────────────

async function init() {
  stampRefreshTime();
  setupQRLink();

  // Fetch all four data files in parallel; each is independent
  const [vendorsR, locationsR, menuR, updatesR] = await Promise.allSettled([
    fetchJSON('/data/vendors.json'),
    fetchJSON('/data/locations.json'),
    fetchJSON('/data/menu.json'),
    fetchJSON('/data/updates.json'),
  ]);

  const vendor   = vendorsR.value?.[0]   ?? FALLBACK.vendor;
  const location = locationsR.value?.[0] ?? FALLBACK.location;
  const menu     = menuR.value            ?? FALLBACK.menu;
  const updates  = updatesR.value         ?? [];

  renderVendorHero(vendor);
  renderStatusRow(location);
  renderLocationCard(location);
  renderFeaturedItems(menu);
  renderActiveSpecial(updates);
  renderLastUpdate(updates);
  renderLoyalty(vendor);
}

// ─── Fetch helper ──────────────────────────────────────────────────────────

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Vendor Hero ───────────────────────────────────────────────────────────

function renderVendorHero(v) {
  setText('hero-name', v.business_name);
  setText('hero-tagline', v.tagline || '');
  setText('hero-contact', v.contact_name || '');

  const badge = document.getElementById('hero-status');
  if (badge) {
    badge.textContent = v.approved_status ? 'Approved ✓' : 'Pending';
    badge.className = 'status-badge ' + (v.approved_status ? 'status-approved' : 'status-pending');
  }
}

// ─── Status Row ────────────────────────────────────────────────────────────

function renderStatusRow(loc) {
  const isOpen = loc.live_status === 'open';

  const statusEl = document.getElementById('sc-live-status');
  if (statusEl) {
    statusEl.textContent = isOpen ? 'OPEN' : 'CLOSED';
    statusEl.className = 'sc-value ' + (isOpen ? 'sc-open' : 'sc-closed');
  }

  // Tint the live-status card border
  const liveCard = document.getElementById('card-live-status');
  if (liveCard) {
    liveCard.style.borderColor = isOpen
      ? 'rgba(39, 174, 96, 0.4)'
      : 'rgba(230, 57, 70, 0.4)';
  }

  setText('sc-hours', loc.hours_today || '—');
}

// ─── Location Card ─────────────────────────────────────────────────────────

function renderLocationCard(loc) {
  setText('loc-name', loc.current_location_name);
  setText('loc-addr', loc.address);

  if (loc.last_updated) {
    const formatted = new Date(loc.last_updated).toLocaleString('en-US', {
      timeZone: 'Pacific/Honolulu',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    setText('loc-updated', `Last updated: ${formatted} HST`);
  }
}

// ─── Featured Items ────────────────────────────────────────────────────────

function renderFeaturedItems(menu) {
  const list = document.getElementById('featured-list');
  if (!list) return;

  const featured = menu.filter(i => i.featured && i.available);

  if (featured.length === 0) {
    list.innerHTML = '<li class="dash-empty">No featured items. Set <code>featured: true</code> in menu.json.</li>';
    return;
  }

  list.innerHTML = featured.map(item => {
    const spice = item.spicy_level > 0
      ? ` <span aria-hidden="true">${'🌶'.repeat(item.spicy_level)}</span>`
      : '';
    return `
      <li class="ml-row">
        <span class="ml-name">${esc(item.name)}${spice}</span>
        <span class="ml-price">$${Number(item.price).toFixed(2)}</span>
      </li>`;
  }).join('');
}

// ─── Active Special ────────────────────────────────────────────────────────

function renderActiveSpecial(updates) {
  const container = document.getElementById('specials-content');
  if (!container) return;

  const specials = updates
    .filter(u => u.update_type === 'special' && u.developer_status !== 'archived')
    .sort((a, b) => new Date(b.date_submitted) - new Date(a.date_submitted));

  if (specials.length === 0) {
    container.innerHTML = '<p class="dash-empty">No active specials. Submit one via the Vendor Portal.</p>';
    return;
  }

  const s = specials[0];
  const statusClass = `dp-${s.developer_status || 'pending'}`;

  container.innerHTML = `
    <div class="special-banner">
      <p class="special-msg">${esc(s.message)}</p>
      <div class="special-footer">
        <span class="dev-pill ${statusClass}">${cap(s.developer_status || 'pending')}</span>
        <span class="special-date">${s.date_submitted || ''}</span>
        ${s.submitted_by ? `<span class="special-date">by ${esc(s.submitted_by)}</span>` : ''}
      </div>
    </div>`;
}

// ─── Last Update ───────────────────────────────────────────────────────────

const UPDATE_TYPE_LABELS = {
  menu: 'Menu', location: 'Location', hours: 'Hours',
  special: 'Special', photo: 'Photo', general: 'General',
};

function renderLastUpdate(updates) {
  const container = document.getElementById('last-update-content');
  if (!container) return;

  if (updates.length === 0) {
    container.innerHTML = '<p class="dash-empty">No updates on record yet.</p>';
    return;
  }

  const latest = [...updates]
    .sort((a, b) => new Date(b.date_submitted) - new Date(a.date_submitted))[0];

  const typeClass  = `ut-${latest.update_type || 'general'}`;
  const typeLabel  = UPDATE_TYPE_LABELS[latest.update_type] || cap(latest.update_type || 'Update');
  const statusClass = `dp-${latest.developer_status || 'pending'}`;

  container.innerHTML = `
    <div class="update-block">
      <span class="upd-type ${typeClass}">${typeLabel}</span>
      <p class="upd-msg">${esc(latest.message)}</p>
      <div class="upd-footer">
        <span class="upd-date">${latest.date_submitted || ''}</span>
        <span class="dev-pill ${statusClass}">${cap(latest.developer_status || 'pending')}</span>
      </div>
    </div>`;
}

// ─── QR Order Link ─────────────────────────────────────────────────────────

function setupQRLink() {
  const orderUrl = `${window.location.origin}/order.html`;

  const urlBox = document.getElementById('qr-url-box');
  if (urlBox) urlBox.textContent = orderUrl;

  const visitLink = document.getElementById('view-order-link');
  if (visitLink) visitLink.href = orderUrl;

  const copyBtn = document.getElementById('copy-qr-btn');
  const copyMsg = document.getElementById('qr-copy-msg');

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const done = () => {
        if (copyMsg) copyMsg.textContent = 'Copied! Paste into any free QR generator to create your code.';
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(orderUrl).then(done).catch(() => fallbackCopy(orderUrl, done));
      } else {
        fallbackCopy(orderUrl, done);
      }
    });
  }
}

// ─── Loyalty ───────────────────────────────────────────────────────────────

function renderLoyalty(vendor) {
  const pinEl = document.getElementById('lc-pin');
  if (pinEl && vendor.loyalty_pin) {
    pinEl.textContent = String(vendor.loyalty_pin).toUpperCase();
  }
}

// ─── Timestamp ─────────────────────────────────────────────────────────────

function stampRefreshTime() {
  const el = document.getElementById('last-refreshed');
  if (!el) return;
  const t = new Date().toLocaleTimeString('en-US', {
    timeZone: 'Pacific/Honolulu',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  el.textContent = `Refreshed ${t} HST`;
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cap(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function fallbackCopy(text, onSuccess) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); onSuccess(); } catch {}
  document.body.removeChild(ta);
}
