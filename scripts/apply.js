import { getClient } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
  const descArea = document.getElementById('app-description');
  const counter = document.getElementById('desc-count');
  descArea?.addEventListener('input', () => {
    counter.textContent = descArea.value.length;
  });

  document.getElementById('apply-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('apply-error');
    errorEl.textContent = '';

    const db = getClient();
    if (!db) {
      errorEl.textContent = 'Service temporarily unavailable. Please try again later.';
      return;
    }

    const email = document.getElementById('app-email').value.trim();
    const application = {
      business_name: document.getElementById('app-name').value.trim(),
      cuisine_type: document.getElementById('app-cuisine').value,
      neighborhood: document.getElementById('app-neighborhood').value,
      contact_email: email,
      contact_phone: document.getElementById('app-phone').value.trim(),
      instagram: document.getElementById('app-instagram').value.trim(),
      description: document.getElementById('app-description').value.trim()
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    const { error } = await db.from('vendor_applications').insert(application);

    if (error) {
      errorEl.textContent = 'Something went wrong. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Submit Application';
      return;
    }

    document.getElementById('success-email').textContent = email;
    document.getElementById('apply-form-wrap').classList.add('hidden');
    document.getElementById('apply-success').classList.remove('hidden');
  });
});
