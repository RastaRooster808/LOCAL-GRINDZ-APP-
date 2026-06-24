import {
  fetchVendorBySlug, fetchVendorMenu, fetchVendorLocation,
  fetchVendorSpecials, fetchVendorReviews,
  submitVendorOrder, submitVendorReview
} from './vendors-client.js';

const params = new URLSearchParams(location.search);
const slug = params.get('vendor');
let vendorId = null;
let cart = [];

async function init() {
  if (!slug) { showNotFound(); return; }

  const vendor = await fetchVendorBySlug(slug);
  if (!vendor) { showNotFound(); return; }

  vendorId = vendor.id;
  document.title = `${vendor.name} – Local Grindz`;
  document.getElementById('vendor-title').textContent = vendor.name;
  document.getElementById('vendor-cuisine').textContent = vendor.cuisine_type || '';

  await Promise.all([
    renderLocation(),
    renderSpecials(),
    renderMenu(),
    renderReviews()
  ]);
}

function showNotFound() {
  document.getElementById('not-found').classList.remove('hidden');
  document.getElementById('storefront-content').classList.add('hidden');
}

async function renderLocation() {
  const el = document.getElementById('location-info');
  try {
    const loc = await fetchVendorLocation(vendorId);
    el.innerHTML = `
      <p class="location-name">${loc.name}</p>
      <p class="location-address">${loc.address || ''}</p>
      <p class="location-hours">${loc.hours || ''}</p>
      <span class="location-status status-${loc.status}">${loc.status === 'open' ? 'Open Now' : 'Closed'}</span>
    `;
  } catch { el.innerHTML = '<p>Location info unavailable.</p>'; }
}

async function renderSpecials() {
  const el = document.getElementById('specials-list');
  try {
    const specials = await fetchVendorSpecials(vendorId);
    el.innerHTML = specials.length
      ? specials.map(s => `
          <div class="special-card">
            <strong>${s.title}</strong>
            <p>${s.description}</p>
          </div>`).join('')
      : '<p>No specials today.</p>';
  } catch { el.innerHTML = '<p>Specials unavailable.</p>'; }
}

async function renderMenu() {
  const el = document.getElementById('menu-list');
  try {
    const items = await fetchVendorMenu(vendorId);
    const categories = [...new Set(items.map(i => i.category))];
    el.innerHTML = categories.map(cat => `
      <div class="menu-category">
        <h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}s</h3>
        ${items.filter(i => i.category === cat).map(i => `
          <div class="menu-item">
            <div class="menu-item-info">
              <strong>${i.name}</strong>
              <span class="menu-item-desc">${i.description || ''}</span>
            </div>
            <div class="menu-item-price">$${Number(i.price).toFixed(2)}</div>
            <button class="btn-add" onclick="addToCart('${i.id}','${i.name}',${i.price})">+</button>
          </div>`).join('')}
      </div>`).join('');
  } catch { el.innerHTML = '<p>Menu unavailable.</p>'; }
}

async function renderReviews() {
  const el = document.getElementById('reviews-list');
  try {
    const reviews = await fetchVendorReviews(vendorId);
    el.innerHTML = reviews.length
      ? reviews.map(r => `
          <div class="review-card">
            <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            <blockquote>"${r.body}"</blockquote>
            <cite>— ${r.customer_name}</cite>
          </div>`).join('')
      : '<p>No reviews yet. Be the first!</p>';
  } catch { el.innerHTML = '<p>Reviews unavailable.</p>'; }
}

// Cart
window.addToCart = function(id, name, price) {
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty++; } else { cart.push({ id, name, price: Number(price), qty: 1 }); }
  renderCart();
};

function renderCart() {
  const el = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  if (!el) return;
  if (!cart.length) { el.innerHTML = '<p>Your cart is empty.</p>'; if (totalEl) totalEl.textContent = ''; return; }
  el.innerHTML = cart.map(i => `
    <div class="cart-item">
      <span>${i.qty}x ${i.name}</span>
      <span>$${(i.price * i.qty).toFixed(2)}</span>
      <button onclick="removeFromCart('${i.id}')">✕</button>
    </div>`).join('');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (totalEl) totalEl.textContent = `Total: $${total.toFixed(2)}`;
}

window.removeFromCart = function(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
};

document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('order-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!cart.length) { alert('Add items to your cart first.'); return; }
    if (!vendorId) { alert('Vendor not loaded yet.'); return; }
    const name = document.getElementById('order-name').value.trim();
    const note = document.getElementById('order-note').value.trim();
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    try {
      await submitVendorOrder(vendorId, { customer_name: name, customer_note: note, items: cart, total });
      alert('Order placed! See you soon.');
      cart = [];
      renderCart();
      e.target.reset();
    } catch { alert('Could not place order. Please try again.'); }
  });

  document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!vendorId) return;
    const name = document.getElementById('review-name').value.trim();
    const rating = parseInt(document.getElementById('review-rating').value);
    const body = document.getElementById('review-body').value.trim();
    try {
      await submitVendorReview(vendorId, { customer_name: name, rating, body });
      alert('Thanks for your review!');
      e.target.reset();
      renderReviews();
    } catch { alert('Could not submit review. Please try again.'); }
  });
});
