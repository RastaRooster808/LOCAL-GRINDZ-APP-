document.addEventListener('DOMContentLoaded', init);

// ─── Fallback data ─────────────────────────────────────────────────────────

const FALLBACK = {
  vendor: {
    business_name: "Ala's Kitchen", tagline: 'Get Smashed',
    contact_name: 'Ala', approved_status: true,
  },
  location: {
    current_location_name: 'Kalapana Black Sand Beach',
    address: 'End of Hwy 130, Pahoa, HI 96778',
    hours_today: '11:00 AM – 7:00 PM',
    live_status: 'open', last_updated: null,
  },
  menu: [
    { item_id: 'm001', name: 'Volcano Smash',    price: 14, spicy_level: 3, featured: true,  available: true },
    { item_id: 'm002', name: 'Classic Smash',    price: 10, spicy_level: 0, featured: false, available: true },
    { item_id: 'm003', name: 'Loco Moco Smash',  price: 13, spicy_level: 0, featured: false, available: true },
    { item_id: 'm004', name: 'Puna Fries',       price:  5, spicy_level: 1, featured: false, available: true },
    { item_id: 'm005', name: 'Lilikoi Lemonade', price:  4, spicy_level: 0, featured: false, available: true },
  ],
  loyalty: {
    campaign_name: 'Smash Club', stamp_code: '808',
    stamps_required: 10, reward_description: '1 Free Volcano Smash',
    campaign_active: true,
  },
};

// ─── Init ──────────────────────────────────────────────────────────────────

async function init() {
  stampRefreshTime();
  setupQRLink();

  const [vendorsR, locationsR, menuR, specialsR, updatesR, loyaltyR] = await Promise.allSettled([
    fetchJSON('/data/vendors.json'),
    fetchJSON('/data/locations.json'),
    fetchJSON('/data/menus.json'),
    fetchJSON('/data/specials.json'),
    fetchJSON('/data/updates.json'),
    fetchJSON('/data/loyalty.json'),
  ]);

  const vendor   = vendorsR.value?.[0]   ?? FALLBACK.vendor;
  const location = locationsR.value?.[0] ?? FALLBACK.location;
  const menu     = menuR.value            ?? FALLBACK.menu;
  const specials = specialsR.value        ?? [];
  const updates  = updatesR.value         ?? [];
  const loyalty  = loyaltyR.value         ?? FALLBACK.loyalty;

  renderVendorHero(vendor);
  renderStatusRow(location);
  renderLocationCard(location);
  renderFeaturedItems(menu);
  renderActiveSpecial(specials);
  renderLastUpdate(updates);
  renderLoyalty(loyalty);
}

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

  const liveCard = document.getElementById('card-live-status');
  if (liveCard) {
    liveCard.style.borderColor = isOpen
      ? 'rgba(39,174,96,0.4)' : 'rgba(230,57,70,0.4)';
  }

  setText('sc-hours', loc.hours_today || '—');
}

// ─── Location ──────────────────────────────────────────────────────────────

function renderLocationCard(loc) {
  setText('loc-name', loc.current_location_name);
  setText('loc-addr', loc.address);

  if (loc.last_updated) {
    const t = new Date(loc.last_updated).toLocaleString('en-US', {
      timeZone: 'Pacific/Honolulu',
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
    setText('loc-updated', `Last updated: ${t} HST`);
  }
}

// ─── Featured Items ────────────────────────────────────────────────────────

function renderFeaturedItems(menu) {
  const list = document.getElementById('featured-list');
  if (!list) return;

  const featured = menu.filter(i => i.featured && i.available);

  if (featured.length === 0) {
    list.innerHTML = '<li class="dash-empty">No featured items. Set <code>featured: true</code> in menus.json.</li>';
    return;
  }

  list.innerHTML = featured.map(item => {
    const spice = item.spicy_level > 0
      ? ` <span aria-hidden="true">${'🌶'.repeat(item.spicy_level)}</span>` : '';
    return `<li class="ml-row">
      <span class="ml-name">${esc(item.name)}${spice}</span>
      <span class="ml-price">$${Number(item.price).toFixed(2)}</span>
    </li>`;
  }).join('');
}

// ─── Active Special — now reads from specials.json ─────────────────────────

function renderActiveSpecial(specials) {
  const container = document.getElementById('specials-content');
  if (!container) return;

  const active = specials
    .filter(s => s.active && !isPast(s.end_time))
    .sort((a, b) => new Date(b.timestamp || b.start_time) - new Date(a.timestamp || a.start_time));

  if (active.length === 0) {
    container.innerHTML = '<p class="dash-empty">No active specials. Submit one via the Vendor Portal.</p>';
    return;
  }

  const s = active[0];
  const endTime = s.end_time
    ? new Date(s.end_time).toLocaleTimeString('en-US', {
        timeZone: 'Pacific/Honolulu',
        hour: 'numeric', minute: '2-digit', hour12: true,
      })
    : null;

  const wasPrice = s.original_price && s.original_price !== s.price
    ? `<span class="dash-was">was $${Number(s.original_price).toFixed(2)}</span>` : '';

  container.innerHTML = `
    <div class="special-banner">
      <p class="special-msg">${esc(s.title)}</p>
      ${s.description ? `<p class="special-subdesc">${esc(s.description)}</p>` : ''}
      <div class="special-data-row">
        <span class="sdval sdval-price">$${Number(s.price).toFixed(2)}</span>
        ${wasPrice}
        <span class="sdval sdval-qty">${s.quantity_remaining} left</span>
        ${endTime ? `<span class="sdval sdval-end">Ends ${endTime}</span>` : ''}
      </div>
    </div>`;
}

function isPast(isoString) {
  return isoString ? new Date(isoString) < new Date() : false;
}

// ─── Last Update (reads new format: type + timestamp) ──────────────────────

const TYPE_LABELS = {
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

  // Support both old format (date_submitted + update_type) and new (timestamp + type)
  const latest = [...updates].sort((a, b) => {
    const da = new Date(a.timestamp || a.date_submitted);
    const db = new Date(b.timestamp || b.date_submitted);
    return db - da;
  })[0];

  const type = latest.type || latest.update_type || 'general';
  const typeLabel = TYPE_LABELS[type] || cap(type);
  const dateStr = latest.timestamp
    ? new Date(latest.timestamp).toLocaleDateString('en-US', {
        timeZone: 'Pacific/Honolulu', month: 'short', day: 'numeric', year: 'numeric',
      })
    : (latest.date_submitted || '');

  container.innerHTML = `
    <div class="update-block">
      <span class="upd-type ut-${type}">${typeLabel}</span>
      <p class="upd-msg">${esc(latest.message)}</p>
      <div class="upd-footer">
        <span class="upd-date">${dateStr}</span>
        <span class="dev-pill dp-${latest.developer_status || 'pending'}">${cap(latest.developer_status || 'pending')}</span>
      </div>
    </div>`;
}

// ─── Loyalty — now reads from loyalty.json ─────────────────────────────────

function renderLoyalty(loyalty) {
  const pinEl = document.getElementById('lc-pin');
  if (pinEl) pinEl.textContent = String(loyalty.stamp_code || '808').toUpperCase();

  const nameEl = document.getElementById('lc-campaign-name');
  if (nameEl && loyalty.campaign_name) nameEl.textContent = loyalty.campaign_name;

  const rewardEl = document.getElementById('lc-reward');
  if (rewardEl && loyalty.reward_description) rewardEl.textContent = loyalty.reward_description;

  const activeEl = document.getElementById('lc-active-badge');
  if (activeEl) {
    activeEl.textContent = loyalty.campaign_active ? 'Active' : 'Paused';
    activeEl.className = 'status-badge ' + (loyalty.campaign_active ? 'status-approved' : 'status-pending');
  }
}

// ─── QR Link ───────────────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────────

function stampRefreshTime() {
  const el = document.getElementById('last-refreshed');
  if (!el) return;
  const t = new Date().toLocaleTimeString('en-US', {
    timeZone: 'Pacific/Honolulu', hour: 'numeric', minute: '2-digit', hour12: true,
  });
  el.textContent = `Refreshed ${t} HST`;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cap(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function fallbackCopy(text, onSuccess) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); onSuccess(); } catch {}
  document.body.removeChild(ta);
}
