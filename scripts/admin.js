import { getClient } from './supabase-client.js';

let db = null;

async function checkAdminAccess() {
  db = getClient();
  if (!db) return false;
  const { data: { user } } = await db.auth.getUser();
  if (!user) return false;
  const { data } = await db.from('admins').select('id').eq('id', user.id).single();
  return !!data;
}

// Login
document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  db = getClient();
  if (!db) return;
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById('admin-login-error').textContent = error.message;
    return;
  }
  initAdmin();
});

document.getElementById('admin-logout-btn')?.addEventListener('click', async () => {
  await db?.auth.signOut();
  location.reload();
});

async function initAdmin() {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    document.getElementById('admin-login-error').textContent = 'Access denied — not an admin account.';
    await db.auth.signOut();
    return;
  }
  document.getElementById('admin-login-section').classList.add('hidden');
  document.getElementById('admin-dashboard').classList.remove('hidden');
  document.getElementById('admin-logout-btn').classList.remove('hidden');
  loadApplications('pending');
  loadVendors();
  loadFeaturedVendorSelect();
  loadFeaturedList();
}

// Applications
window.loadApplications = async function(status = 'pending') {
  const el = document.getElementById('applications-list');
  el.innerHTML = '<p>Loading…</p>';
  const { data, error } = await db
    .from('vendor_applications')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: true });

  if (error) { el.innerHTML = '<p>Error loading applications.</p>'; return; }

  const pendingCount = status === 'pending' ? data.length : null;
  if (pendingCount !== null) {
    const badge = document.getElementById('pending-badge');
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  if (!data.length) {
    el.innerHTML = `<p class="empty-msg">No ${status} applications.</p>`;
    return;
  }

  el.innerHTML = data.map(app => `
    <div class="admin-card" id="app-${app.id}">
      <div class="admin-card-header">
        <strong>${app.business_name}</strong>
        <span class="badge badge-${app.status}">${app.status}</span>
      </div>
      <p>${app.cuisine_type || ''} · ${app.neighborhood || ''}</p>
      <p><a href="mailto:${app.contact_email}">${app.contact_email}</a>${app.contact_phone ? ` · ${app.contact_phone}` : ''}</p>
      ${app.instagram ? `<p>@${app.instagram}</p>` : ''}
      ${app.description ? `<p class="admin-desc">${app.description}</p>` : ''}
      <p class="admin-date">Applied ${new Date(app.created_at).toLocaleDateString()}</p>
      ${app.admin_note ? `<p class="admin-note">Note: ${app.admin_note}</p>` : ''}
      ${status === 'pending' ? `
        <div class="admin-actions">
          <button class="btn-primary" onclick="approveApplication('${app.id}', '${app.contact_email}', '${app.business_name}', '${app.cuisine_type || ''}', '${app.neighborhood || ''}')">Approve</button>
          <button class="btn-secondary" onclick="openRejectModal('${app.id}')">Reject</button>
        </div>` : ''}
    </div>
  `).join('');
};

window.approveApplication = async function(id, email, name, cuisine, neighborhood) {
  if (!confirm(`Approve "${name}"?\nThis will create their vendor account.`)) return;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Check slug uniqueness
  const { data: existing } = await db.from('vendors').select('id').eq('slug', slug).single();
  const finalSlug = existing ? `${slug}-2` : slug;

  const { error: vendorError } = await db.from('vendors').insert({
    email, name, slug: finalSlug, cuisine_type: cuisine,
    neighborhood, is_active: true
  });

  if (vendorError) { alert(`Error: ${vendorError.message}`); return; }

  await db.from('vendor_applications').update({
    status: 'approved',
    reviewed_at: new Date().toISOString()
  }).eq('id', id);

  document.getElementById(`app-${id}`)?.remove();
  alert(`Approved! Now manually invite ${email} via Supabase Auth → Authentication → Invite User.`);
};

// Reject modal
let rejectTargetId = null;

window.openRejectModal = function(id) {
  rejectTargetId = id;
  document.getElementById('reject-reason').value = '';
  document.getElementById('reject-modal').classList.remove('hidden');
};

window.closeRejectModal = function() {
  document.getElementById('reject-modal').classList.add('hidden');
  rejectTargetId = null;
};

document.getElementById('reject-confirm')?.addEventListener('click', async () => {
  if (!rejectTargetId) return;
  const reason = document.getElementById('reject-reason').value.trim();
  await db.from('vendor_applications').update({
    status: 'rejected',
    admin_note: reason || null,
    reviewed_at: new Date().toISOString()
  }).eq('id', rejectTargetId);
  document.getElementById(`app-${rejectTargetId}`)?.remove();
  closeRejectModal();
});

// Vendors tab
async function loadVendors() {
  const el = document.getElementById('admin-vendors-list');
  const { data } = await db.from('vendors').select('id, name, slug, cuisine_type, is_active, email').order('name');
  if (!data?.length) { el.innerHTML = '<p>No vendors.</p>'; return; }
  el.innerHTML = data.map(v => `
    <div class="admin-card">
      <div class="admin-card-header">
        <strong>${v.name}</strong>
        <span class="badge badge-${v.is_active ? 'approved' : 'rejected'}">${v.is_active ? 'Active' : 'Suspended'}</span>
      </div>
      <p>${v.cuisine_type || ''} · <a href="../vendors/storefront.html?vendor=${v.slug}" target="_blank">/vendors/${v.slug}</a></p>
      <p>${v.email}</p>
      <div class="admin-actions">
        <button class="btn-secondary" onclick="toggleVendor('${v.id}', ${v.is_active})">
          ${v.is_active ? 'Suspend' : 'Reactivate'}
        </button>
      </div>
    </div>
  `).join('');
}

window.toggleVendor = async function(id, isActive) {
  const action = isActive ? 'suspend' : 'reactivate';
  if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this vendor?`)) return;
  await db.from('vendors').update({ is_active: !isActive }).eq('id', id);
  loadVendors();
};

// Featured tab
async function loadFeaturedVendorSelect() {
  const select = document.getElementById('featured-vendor-select');
  const { data } = await db.from('vendors').select('id, name').eq('is_active', true).order('name');
  if (!data) return;
  select.innerHTML = data.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
}

async function loadFeaturedList() {
  const el = document.getElementById('admin-featured-list');
  const { data } = await db
    .from('vendor_features')
    .select('id, tier, feature_expires_at, vendors(name)')
    .order('feature_expires_at', { ascending: false });
  if (!data?.length) { el.innerHTML = '<p>No featured vendors.</p>'; return; }
  el.innerHTML = data.map(f => `
    <div class="admin-card">
      <strong>${f.vendors?.name}</strong> — ${f.tier}
      <p>Expires ${new Date(f.feature_expires_at).toLocaleDateString()}</p>
      <button class="btn-secondary" onclick="removeFeature('${f.id}')">Remove</button>
    </div>
  `).join('');
}

window.removeFeature = async function(id) {
  await db.from('vendor_features').delete().eq('id', id);
  loadFeaturedList();
};

document.getElementById('featured-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const vendor_id = document.getElementById('featured-vendor-select').value;
  const tier = document.getElementById('featured-tier').value;
  const feature_expires_at = document.getElementById('featured-expires').value;
  const { error } = await db.from('vendor_features').insert({ vendor_id, tier, feature_expires_at });
  if (error) { alert(error.message); return; }
  e.target.reset();
  loadFeaturedList();
});

// Boot
document.addEventListener('DOMContentLoaded', async () => {
  db = getClient();
  if (!db) return;
  const { data: { session } } = await db.auth.getSession();
  if (session) { initAdmin(); }
});
