let menuItems = [];
let cart = {}; // item_id → quantity

document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  document.getElementById('place-order-btn').addEventListener('click', placeOrder);
  document.getElementById('new-order-btn').addEventListener('click', resetOrder);
});

// ─── Data ──────────────────────────────────────────────────────────────────

async function loadMenu() {
  try {
    const res = await fetch('/data/menu.json');
    if (!res.ok) throw new Error('fetch failed');
    menuItems = await res.json();
  } catch {
    menuItems = getFallbackMenu();
  }
  renderOrderMenu();
}

// ─── Render Menu ───────────────────────────────────────────────────────────

function renderOrderMenu() {
  const container = document.getElementById('order-menu');
  if (!container) return;

  const available = menuItems.filter(item => item.available);

  if (available.length === 0) {
    container.innerHTML = '<p class="empty-msg">No items available right now. Check back soon!</p>';
    return;
  }

  container.innerHTML = available.map(item => `
    <div class="order-item" id="oi-${item.item_id}" aria-label="${item.name}">
      <div class="oi-info">
        <div class="oi-name">${item.name}${item.spicy_level > 0 ? ' ' + '🌶'.repeat(item.spicy_level) : ''}</div>
        <div class="oi-price">$${item.price.toFixed(2)}</div>
      </div>
      <div class="qty-control" role="group" aria-label="Quantity for ${item.name}">
        <button class="qty-btn qty-minus" data-id="${item.item_id}" aria-label="Remove one ${item.name}" tabindex="0">&#8722;</button>
        <span class="qty-display" id="qty-${item.item_id}" aria-live="polite">0</span>
        <button class="qty-btn qty-plus" data-id="${item.item_id}" aria-label="Add one ${item.name}" tabindex="0">+</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.qty-plus').forEach(btn =>
    btn.addEventListener('click', () => updateQty(btn.dataset.id, 1))
  );
  container.querySelectorAll('.qty-minus').forEach(btn =>
    btn.addEventListener('click', () => updateQty(btn.dataset.id, -1))
  );
}

// ─── Cart Logic ────────────────────────────────────────────────────────────

function updateQty(itemId, delta) {
  cart[itemId] = Math.max(0, (cart[itemId] || 0) + delta);
  if (cart[itemId] === 0) delete cart[itemId];

  const qtyEl = document.getElementById(`qty-${itemId}`);
  if (qtyEl) qtyEl.textContent = cart[itemId] || 0;

  const row = document.getElementById(`oi-${itemId}`);
  if (row) row.classList.toggle('oi-selected', (cart[itemId] || 0) > 0);

  updateCartBar();
}

function updateCartBar() {
  const bar = document.getElementById('cart-bar');
  if (!bar) return;

  const totalQty = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = calcTotal();

  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');
  if (countEl) countEl.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
  if (totalEl) totalEl.textContent = `$${totalPrice.toFixed(2)}`;

  bar.classList.toggle('hidden', totalQty === 0);
}

function calcTotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find(i => i.item_id === id);
    return item ? sum + item.price * qty : sum;
  }, 0);
}

// ─── Place Order ───────────────────────────────────────────────────────────

function placeOrder() {
  if (Object.keys(cart).length === 0) return;

  const ticketNum = String(Math.floor(1000 + Math.random() * 9000));
  const total = calcTotal();
  const time = new Date().toLocaleTimeString('en-US', {
    timeZone: 'Pacific/Honolulu',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const lineItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = menuItems.find(i => i.item_id === id);
      if (!item) return '';
      return `<li class="ticket-line">
        <span>${item.name} &times; ${qty}</span>
        <span>$${(item.price * qty).toFixed(2)}</span>
      </li>`;
    })
    .join('');

  document.getElementById('ticket-number').textContent = `#${ticketNum}`;
  document.getElementById('ticket-items').innerHTML = lineItems;
  document.getElementById('ticket-total-amt').textContent = `$${total.toFixed(2)}`;
  document.getElementById('ticket-time').textContent = `${time} HST`;

  document.getElementById('order-view').classList.add('hidden');
  document.getElementById('cart-bar').classList.add('hidden');
  document.getElementById('ticket-view').classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Reset ─────────────────────────────────────────────────────────────────

function resetOrder() {
  cart = {};

  document.getElementById('ticket-view').classList.add('hidden');
  document.getElementById('order-view').classList.remove('hidden');
  document.getElementById('cart-bar').classList.add('hidden');

  document.querySelectorAll('.qty-display').forEach(el => (el.textContent = '0'));
  document.querySelectorAll('.order-item').forEach(el => el.classList.remove('oi-selected'));

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Offline Fallback ──────────────────────────────────────────────────────

function getFallbackMenu() {
  return [
    { item_id: 'm001', name: 'Volcano Smash',    price: 14.00, spicy_level: 3, available: true },
    { item_id: 'm002', name: 'Classic Smash',    price: 10.00, spicy_level: 0, available: true },
    { item_id: 'm003', name: 'Loco Moco Smash',  price: 13.00, spicy_level: 0, available: true },
    { item_id: 'm004', name: 'Puna Fries',       price:  5.00, spicy_level: 1, available: true },
    { item_id: 'm005', name: 'Lilikoi Lemonade', price:  4.00, spicy_level: 0, available: true },
  ];
}
