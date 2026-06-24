import { fetchMenu, fetchLocation, fetchSpecials, fetchReviews, submitOrder, submitReview } from './supabase-client.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

async function renderMenu() {
  const el = document.getElementById('menu-list');
  if (!el) return;
  try {
    const items = await fetchMenu();
    const categories = [...new Set(items.map(i => i.category))];
    el.innerHTML = categories.map(cat => `
      <div class="menu-category">
        <h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}s</h3>
        ${items.filter(i => i.category === cat).map(i => `
          <div class="menu-item" data-id="${i.id}" data-name="${i.name}" data-price="${i.price}">
            <div class="menu-item-info">
              <strong>${i.name}</strong>
              <span class="menu-item-desc">${i.description || ''}</span>
            </div>
            <div class="menu-item-price">$${Number(i.price).toFixed(2)}</div>
            <button class="btn-add" onclick="addToCart('${i.id}','${i.name}',${i.price})">+</button>
          </div>
        `).join('')}
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p>Menu temporarily unavailable.</p>';
  }
}

async function renderLocation() {
  const el = document.getElementById('location-info');
  if (!el) return;
  try {
    const loc = await fetchLocation();
    el.innerHTML = `
      <p class="location-name">${loc.name}</p>
      <p class="location-address">${loc.address || ''}</p>
      <p class="location-hours">${loc.hours || ''}</p>
      <span class="location-status status-${loc.status}">${loc.status === 'open' ? 'Open Now' : 'Closed'}</span>
    `;
  } catch {
    el.innerHTML = '<p>Location info temporarily unavailable.</p>';
  }
}

async function renderSpecials() {
  const el = document.getElementById('specials-list');
  if (!el) return;
  try {
    const specials = await fetchSpecials();
    if (!specials.length) { el.innerHTML = '<p>No active specials right now.</p>'; return; }
    el.innerHTML = specials.map(s => `
      <div class="special-card">
        <strong>${s.title}</strong>
        <p>${s.description}</p>
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p>Specials temporarily unavailable.</p>';
  }
}

async function renderReviews() {
  const el = document.getElementById('reviews-list');
  if (!el) return;
  try {
    const reviews = await fetchReviews();
    if (!reviews.length) { el.innerHTML = '<p>No reviews yet. Be the first!</p>'; return; }
    el.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        <blockquote>"${r.body}"</blockquote>
        <cite>— ${r.customer_name}</cite>
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p>Reviews temporarily unavailable.</p>';
  }
}

// Cart
let cart = [];

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
    </div>
  `).join('');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (totalEl) totalEl.textContent = `Total: $${total.toFixed(2)}`;
}

window.removeFromCart = function(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
};

// Order form
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  renderLocation();
  renderSpecials();
  renderReviews();

  const orderForm = document.getElementById('order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!cart.length) { alert('Add items to your cart first.'); return; }
      const name = document.getElementById('order-name').value.trim();
      const note = document.getElementById('order-note').value.trim();
      const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
      try {
        await submitOrder({ customer_name: name, customer_note: note, items: cart, total });
        alert('Order placed! See you soon.');
        cart = [];
        renderCart();
        orderForm.reset();
      } catch {
        alert('Could not place order. Please try again.');
      }
    });
  }

  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('review-name').value.trim();
      const rating = parseInt(document.getElementById('review-rating').value);
      const body = document.getElementById('review-body').value.trim();
      try {
        await submitReview({ customer_name: name, rating, body });
        alert('Thanks for your review!');
        reviewForm.reset();
        renderReviews();
      } catch {
        alert('Could not submit review. Please try again.');
      }
    });
  }
});
