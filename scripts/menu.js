let allItems = [];
let activeCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  setupCategoryTabs();
});

// ─── Data ──────────────────────────────────────────────────────────────────

async function loadMenu() {
  try {
    const res = await fetch('/data/menu.json');
    if (!res.ok) throw new Error('fetch failed');
    allItems = await res.json();
    renderMenu(allItems);
  } catch {
    renderFallback();
  }
}

// ─── Category Tabs ─────────────────────────────────────────────────────────

function setupCategoryTabs() {
  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      activeCategory = tab.dataset.cat;
      const filtered = activeCategory === 'all'
        ? allItems
        : allItems.filter(item => item.category === activeCategory);
      renderMenu(filtered);
    });
  });
}

// ─── Render ────────────────────────────────────────────────────────────────

function renderMenu(items) {
  const container = document.getElementById('menu-container');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = '<p class="empty-msg">No items in this category right now.</p>';
    return;
  }

  container.innerHTML = items.map(buildItemCard).join('');
}

function buildItemCard(item) {
  const spice = item.spicy_level > 0
    ? `<span class="spice" aria-label="${item.spicy_level} of 5 spice">${'🌶'.repeat(item.spicy_level)}</span>`
    : '';

  const featuredBadge = item.featured
    ? '<span class="badge badge-featured">Featured</span>'
    : '';

  const unavailableBadge = !item.available
    ? '<span class="badge badge-unavailable">86\'d</span>'
    : '';

  const orderBtn = item.available
    ? `<a href="/order.html" class="item-order-btn">Order</a>`
    : '';

  return `
    <article class="item-card${item.available ? '' : ' item-unavailable'}" aria-label="${item.name}">
      <div class="item-top">
        <div class="item-name-row">
          <h3 class="item-name">${item.name}</h3>
          ${spice}
        </div>
        <div class="item-badges">${featuredBadge}${unavailableBadge}</div>
      </div>
      <p class="item-desc">${item.description}</p>
      <div class="item-bottom">
        <span class="item-price">$${item.price.toFixed(2)}</span>
        ${orderBtn}
      </div>
    </article>
  `;
}

function renderFallback() {
  const container = document.getElementById('menu-container');
  if (!container) return;

  const fallback = [
    { name: 'Volcano Smash', spice: 3, desc: 'Ghost pepper aioli, caramelized onions, lava sauce on brioche.', price: '$14.00' },
    { name: 'Classic Smash', spice: 0, desc: 'American cheese, pickles, mustard, and ketchup on a potato bun.', price: '$10.00' },
    { name: 'Loco Moco Smash', spice: 0, desc: 'Smash patty over rice with brown gravy and a fried egg.', price: '$13.00' },
    { name: 'Puna Fries', spice: 1, desc: 'Island-seasoned thick-cut fries with dipping sauce.', price: '$5.00' },
    { name: 'Lilikoi Lemonade', spice: 0, desc: 'Fresh-squeezed lemonade with passion fruit syrup.', price: '$4.00' },
  ];

  container.innerHTML = fallback.map(item => `
    <article class="item-card">
      <div class="item-top">
        <div class="item-name-row">
          <h3 class="item-name">${item.name}</h3>
          ${item.spice > 0 ? `<span class="spice">${'🌶'.repeat(item.spice)}</span>` : ''}
        </div>
      </div>
      <p class="item-desc">${item.desc}</p>
      <div class="item-bottom">
        <span class="item-price">${item.price}</span>
        <a href="/order.html" class="item-order-btn">Order</a>
      </div>
    </article>
  `).join('') + '<p class="empty-msg" style="padding-top:0;font-size:0.78rem">Showing offline menu — pull to refresh for updates.</p>';
}
