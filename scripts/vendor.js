import { getClient } from './supabase-client.js';

let vendorId = null;

// Auth
async function getVendorId(db) {
  if (vendorId) return vendorId;
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from('vendors').select('id').eq('email', user.email).single();
  vendorId = data?.id || null;
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
  await db?.auth.signOut();
  vendorId = null;
  showSection('login-section');
});

async function initDashboard() {
  const db = getClient();
  if (!db) return;
  const vid = await getVendorId(db);
  if (!vid) { showSection('login-section'); return; }
  showSection('dashboard-section');
  loadMenu(db, vid);
  loadLocation(db, vid);
  loadSpecials(db, vid);
  loadOrders(db);
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
  const vid = await getVendorId(db);
  await db?.from('menu_items').delete().eq('id', id).eq('vendor_id', vid);
  loadMenu(db, vid);
};

document.getElementById('add-menu-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const db = getClient();
  const vid = await getVendorId(db);
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
  const vid = await getVendorId(db);
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
  const vid = await getVendorId(db);
  loadSpecials(db, vid);
};

window.deleteSpecial = async function(id) {
  if (!confirm('Delete this special?')) return;
  const db = getClient();
  const vid = await getVendorId(db);
  await db?.from('specials').delete().eq('id', id).eq('vendor_id', vid);
  loadSpecials(db, vid);
};

document.getElementById('add-special-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const db = getClient();
  const vid = await getVendorId(db);
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
async function loadOrders(db) {
  const { data } = await db.from('orders').select('*').order('created_at', { ascending: false }).limit(20);
  const el = document.getElementById('vendor-orders-list');
  if (!el) return;
  el.innerHTML = (data || []).map(o => `
    <div class="vendor-order">
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

window.updateOrderStatus = async function(id, status) {
  const db = getClient();
  await db?.from('orders').update({ status }).eq('id', id);
};

// Auto-check auth on load
document.addEventListener('DOMContentLoaded', async () => {
  const db = getClient();
  if (!db) { showSection('login-section'); return; }
  const { data: { session } } = await db.auth.getSession();
  if (session) { initDashboard(); } else { showSection('login-section'); }
});
