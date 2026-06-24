import { getClient } from './supabase-client.js';

let vendorId = null;
let vendorSlug = null;
let realtimeSub = null;
let ordersChart = null;

async function getVendorInfo(db) {
  if (vendorId) return vendorId;
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from('vendors').select('id, slug').eq('email', user.email).single();
  vendorId = data?.id || null;
  vendorSlug = data?.slug || null;
  return vendorId;
}

function showSection(id) {
  document.querySelectorAll('.vendor-section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const db = getClient();
  if (!db) { alert('Supabase not configured yet.'); return; }
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) { document.getElementById('login-error').textContent = error.message; return; }
  initDashboard();
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  const db = getClient();
  realtimeSub?.unsubscribe();
  await db?.auth.signOut();
  vendorId = null;
  vendorSlug = null;
  showSection('login-section');
});

async function initDashboard() {
  const db = getClient();
  if (!db) return;
  const vid = await getVendorInfo(db);
  if (!vid) { showSection('login-section'); return; }
  showSection('dashboard-section');
  loadMenu(db, vid);
  loadLocation(db, vid);
  loadSpecials(db, vid);
  loadOrders(db, vid);
  subscribeOrders(db, vid);
}

// Menu management
async function loadMenu(db, vid) {
  const { data } = await db.from('menu_items').select('*').eq('vendor_id', vid).order('category');
  const el = document.getElementById('vendor-menu-list');
  if (!el) return;
  el.innerHTML = (data || []).map(item => `
    <div class="vendor-menu-item" data-id="${item.id}">
      <span>${item.name} — $${Number(item.price).toFixed(2)} (${item.category})</span>
      <label><input type="checkbox" ${item.available ? 'checked' : ''} onchange="toggleItem('${item.id}', this.checked)"> Available</label>
      <button onclick="deleteItem('${item.id}')">Delete</button>
    </div>
  `).join('') || '<p>No menu items yet.</p>';
}

window.toggleItem = async function(id, available) {
  const db = getClient();
  await db?.from('menu_items').update({ available, updated_at: new Date().toISOString() }).eq('id', id);
};

window.deleteItem = async function(id) {
  if (!confirm('Delete this item?')) return;
  const db = getClient();
  const vid = await getVendorInfo(db);
  await db?.from('menu_items').delete().eq('id', id).eq('vendor_id', vid);
  loadMenu(db, vid);
};

document.getElementById('add-menu-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const db = getClient();
  const vid = await getVendorInfo(db);
  if (!vid) return;
  const item = {
    vendor_id: vid,
    name: document.getElementById('item-name').value.trim(),
    description: document.getElementById('item-desc').value.trim(),
    price: parseFloat(document.getElementById('item-price').value),
    category: document.getElementById('item-category').value,
    available: true
  };
  const { error } = await db.from('menu_items').insert(item);
  if (error) { alert(error.message); return; }
  e.target.reset();
  loadMenu(db, vid);
});

// Location management
async function loadLocation(db, vid) {
  const { data } = await db.from('locations').select('*').eq('vendor_id', vid).order('updated_at', { ascending: false }).limit(1).single();
  if (!data) return;
  document.getElementById('loc-name').value = data.name || '';
  document.getElementById('loc-address').value = data.address || '';
  document.getElementById('loc-hours').value = data.hours || '';
  document.getElementById('loc-status').value = data.status || 'open';
  document.getElementById('vendor-location-id').value = data.id || '';
}

document.getElementById('location-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const db = getClient();
  const vid = await getVendorInfo(db);
  if (!vid) return;
  const existingId = document.getElementById('vendor-location-id').value;
  const loc = {
    vendor_id: vid,
    name: document.getElementById('loc-name').value.trim(),
    address: document.getElementById('loc-address').value.trim(),
    hours: document.getElementById('loc-hours').value.trim(),
    status: document.getElementById('loc-status').value,
    updated_at: new Date().toISOString()
  };
  let error;
  if (existingId) {
    ({ error } = await db.from('locations').update(loc).eq('id', existingId));
  } else {
    ({ error } = await db.from('locations').insert(loc));
  }
  if (error) { alert(error.message); return; }
  alert('Location saved!');
  loadLocation(db, vid);
});

// Specials management
async function loadSpecials(db, vid) {
  const { data } = await db.from('specials').select('*').eq('vendor_id', vid).order('created_at', { ascending: false });
  const el = document.getElementById('vendor-specials-list');
  if (!el) return;
  el.innerHTML = (data || []).map(s => `
    <div class="vendor-special">
      <strong>${s.title}</strong> — ${s.active ? 'Active' : 'Inactive'}
      <button onclick="toggleSpecial('${s.id}', ${!s.active})">${s.active ? 'Deactivate' : 'Activate'}</button>
      <button onclick="deleteSpecial('${s.id}')">Delete</button>
    </div>
  `).join('') || '<p>No specials yet.</p>';
}

window.toggleSpecial = async function(id, active) {
  const db = getClient();
  await db?.from('specials').update({ active }).eq('id', id);
  const vid = await getVendorInfo(db);
  loadSpecials(db, vid);
};

window.deleteSpecial = async function(id) {
  if (!confirm('Delete this special?')) return;
  const db = getClient();
  const vid = await getVendorInfo(db);
  await db?.from('specials').delete().eq('id', id).eq('vendor_id', vid);
  loadSpecials(db, vid);
};

document.getElementById('add-special-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const db = getClient();
  const vid = await getVendorInfo(db);
  if (!vid) return;
  const special = {
    vendor_id: vid,
    title: document.getElementById('special-title').value.trim(),
    description: document.getElementById('special-desc').value.trim(),
    expires_at: document.getElementById('special-expires').value || null,
    active: true
  };
  const { error } = await db.from('specials').insert(special);
  if (error) { alert(error.message); return; }
  e.target.reset();
  loadSpecials(db, vid);
});

// Orders
async function loadOrders(db, vid) {
  const { data } = await db
    .from('orders')
    .select('*')
    .eq('vendor_id', vid)
    .order('created_at', { ascending: false })
    .limit(20);
  const el = document.getElementById('vendor-orders-list');
  if (!el) return;
  el.innerHTML = (data || []).map(o => `
    <div class="vendor-order" id="order-${o.id}">
      <strong>${o.customer_name}</strong> — $${Number(o.total || 0).toFixed(2)} — <em>${o.status}</em>
      <div class="order-items">${(o.items || []).map(i => `${i.qty}x ${i.name}`).join(', ')}</div>
      ${o.customer_note ? `<div class="order-note">Note: ${o.customer_note}</div>` : ''}
      <small>${new Date(o.created_at).toLocaleString()}</small>
      <select onchange="updateOrderStatus('${o.id}', this.value)">
        ${['pending','preparing','ready','done'].map(s => `<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
  `).join('') || '<p>No orders yet.</p>';
}

window.reloadOrders = function() {
  const db = getClient();
  if (db && vendorId) loadOrders(db, vendorId);
};

window.updateOrderStatus = async function(id, status) {
  const db = getClient();
  await db?.from('orders').update({ status }).eq('id', id);
};

// Realtime order notifications
function subscribeOrders(db, vid) {
  realtimeSub?.unsubscribe();
  realtimeSub = db
    .channel('vendor-orders')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
      filter: `vendor_id=eq.${vid}`
    }, (payload) => {
      showOrderToast(payload.new);
      loadOrders(db, vid);
    })
    .subscribe();
}

function showOrderToast(order) {
  const toast = document.createElement('div');
  toast.className = 'order-toast';
  toast.textContent = `New order from ${order.customer_name}! $${Number(order.total || 0).toFixed(2)}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('order-toast--fade'), 4000);
  setTimeout(() => toast.remove(), 4500);
}

// QR Code
window.initQR = function() {
  const box = document.getElementById('qr-code-box');
  const urlEl = document.getElementById('qr-url');
  const dlBtn = document.getElementById('qr-download-btn');
  if (!box || !vendorSlug) return;
  if (box.querySelector('canvas')) return; // already generated
  const base = location.href.replace(/\/vendor\/[^/]*$/, '');
  const storefrontUrl = `${base}/vendors/storefront.html?vendor=${vendorSlug}&source=qr`;
  urlEl.textContent = storefrontUrl;
  new QRCode(box, {
    text: storefrontUrl,
    width: 220,
    height: 220,
    colorDark: '#1D1D1D',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
  dlBtn.classList.remove('hidden');
  dlBtn.onclick = () => {
    const canvas = box.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${vendorSlug}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
};

// Analytics
window.loadAnalytics = async function() {
  const db = getClient();
  if (!db || !vendorId) return;

  const now = new Date();
  const d7 = new Date(now - 7 * 864e5).toISOString();
  const d30 = new Date(now - 30 * 864e5).toISOString();

  const [r7, r30, rViews] = await Promise.all([
    db.from('orders').select('id, total, created_at, items').eq('vendor_id', vendorId).gte('created_at', d7),
    db.from('orders').select('id, total, created_at, items').eq('vendor_id', vendorId).gte('created_at', d30),
    db.from('vendor_events').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).gte('created_at', d30)
  ]);

  const orders7 = r7.data || [];
  const orders30 = r30.data || [];
  const views30 = rViews.count || 0;
  const revenue7 = orders7.reduce((s, o) => s + Number(o.total || 0), 0);

  document.getElementById('stat-orders-7').textContent = orders7.length;
  document.getElementById('stat-revenue-7').textContent = `$${revenue7.toFixed(2)}`;
  document.getElementById('stat-orders-30').textContent = orders30.length;
  document.getElementById('stat-views-30').textContent = views30;

  // 7-day bar chart
  const days = [];
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 864e5);
    days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    const dayStr = d.toISOString().slice(0, 10);
    counts.push(orders7.filter(o => o.created_at?.slice(0, 10) === dayStr).length);
  }

  const canvas = document.getElementById('orders-chart');
  if (canvas) {
    if (ordersChart) ordersChart.destroy();
    ordersChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{ label: 'Orders', data: counts, backgroundColor: '#E63946', borderRadius: 4 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  // Top items
  const itemCounts = {};
  for (const order of orders30) {
    for (const item of (order.items || [])) {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.qty || 1);
    }
  }
  const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topEl = document.getElementById('top-items-list');
  if (topEl) {
    topEl.innerHTML = sorted.length
      ? sorted.map(([name, qty]) => `
          <div class="top-item">
            <span class="top-item-name">${name}</span>
            <span class="top-item-qty">${qty} ordered</span>
          </div>`).join('')
      : '<p class="empty-msg">No order data yet.</p>';
  }
};

// Auto-check auth on load
document.addEventListener('DOMContentLoaded', async () => {
  const db = getClient();
  if (!db) { showSection('login-section'); return; }
  const { data: { session } } = await db.auth.getSession();
  if (session) { initDashboard(); } else { showSection('login-section'); }
});
