import { fetchAllVendors, vendorCard } from './vendors-client.js';

let allVendors = [];
let activeFilter = 'all';

async function loadDirectory() {
  const el = document.getElementById('vendor-grid');
  if (!el) return;
  allVendors = await fetchAllVendors();
  if (!allVendors.length) {
    el.innerHTML = '<p class="empty-msg">No vendors yet. <a href="../apply/">Be the first!</a></p>';
    return;
  }
  renderGrid();
}

function renderGrid() {
  const el = document.getElementById('vendor-grid');
  if (!el) return;
  let vendors = allVendors;
  if (activeFilter === 'open') {
    vendors = vendors.filter(v => v.locations?.some(l => l.status === 'open'));
  } else if (activeFilter !== 'all') {
    vendors = vendors.filter(v => v.cuisine_type === activeFilter);
  }
  if (!vendors.length) {
    el.innerHTML = '<p class="empty-msg">No trucks match this filter.</p>';
    return;
  }
  el.innerHTML = vendors.map(v => vendorCard(v)).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadDirectory();

  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderGrid();
    });
  });
});
