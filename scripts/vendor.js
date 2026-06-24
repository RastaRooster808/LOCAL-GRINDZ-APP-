document.addEventListener('DOMContentLoaded', () => {
  loadVendorProfile();
  setupForm();
  setupOrderPortal();
});

// ─── Data Loading ──────────────────────────────────────────────────────────

async function loadVendorProfile() {
  try {
    const res = await fetch('/data/vendors.json');
    if (!res.ok) throw new Error('fetch failed');
    const vendors = await res.json();
    const vendor = vendors[0];
    if (vendor) {
      renderProfile(vendor);
      prefillForm(vendor);
    }
  } catch {
    // static fallback already in HTML
  }
}

function renderProfile(vendor) {
  const bizName = document.getElementById('profile-biz-name');
  const tagline = document.getElementById('profile-tagline');
  const contact = document.getElementById('profile-contact');
  const badge = document.getElementById('profile-status');

  if (bizName) bizName.textContent = vendor.business_name;
  if (tagline) tagline.textContent = vendor.tagline || '';
  if (contact) contact.textContent = vendor.contact_name || '';
  if (badge) {
    badge.textContent = vendor.approved_status ? 'Approved' : 'Pending Approval';
    badge.className = 'status-badge ' + (vendor.approved_status ? 'status-approved' : 'status-pending');
  }
}

function prefillForm(vendor) {
  setValue('form-biz-name', vendor.business_name);
  setValue('form-contact', vendor.contact_name);
  setValue('form-phone', vendor.phone);
  setValue('form-email', vendor.email);
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.value = value;
}

// ─── Form Setup ────────────────────────────────────────────────────────────

function setupForm() {
  const form = document.getElementById('vendor-update-form');
  const copyBtn = document.getElementById('copy-btn');
  const resetBtn = document.getElementById('reset-btn');

  if (form) form.addEventListener('submit', handleSubmit);
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const text = document.getElementById('update-summary')?.textContent;
    if (text) copyToClipboard(text);
  });
  if (resetBtn) resetBtn.addEventListener('click', resetForm);
}

// ─── Submit Handler ────────────────────────────────────────────────────────

function handleSubmit(e) {
  e.preventDefault();
  clearErrors();

  if (!validateForm(e.target)) return;

  const data = collectFormData(e.target);
  const summary = generateSummary(data);

  displaySummary(summary);
  copyToClipboard(summary);
}

// ─── Validation ────────────────────────────────────────────────────────────

function validateForm(form) {
  let ok = true;

  if (!getVal(form, '#form-biz-name')) {
    markError('form-biz-name', 'Business name is required.');
    ok = false;
  }

  if (!form.querySelector('input[name="update-type"]:checked')) {
    markError('update-type-error', 'Please choose an update type.');
    ok = false;
  }

  if (!getVal(form, '#form-message')) {
    markError('form-message', 'Please describe your update.');
    ok = false;
  }

  if (!ok) {
    const firstErr = document.querySelector('.input-error, .field-error');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return ok;
}

function getVal(form, selector) {
  return form.querySelector(selector)?.value.trim() || '';
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.remove());
  document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

function markError(targetId, message) {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.classList.add('input-error');

  const err = document.createElement('p');
  err.className = 'field-error';
  err.setAttribute('role', 'alert');
  err.textContent = message;

  // For the radio group error placeholder, insert after; otherwise after input
  target.insertAdjacentElement('afterend', err);
}

// ─── Form Data Collection ──────────────────────────────────────────────────

const UPDATE_TYPE_LABELS = {
  menu: 'Menu Update',
  location: 'Location Update',
  hours: 'Hours / Schedule Update',
  special: 'Special / Drop Announcement',
  photo: 'Photo Update',
  general: 'General Announcement',
};

const URGENCY_LABELS = {
  low: 'Low — whenever you get to it',
  normal: 'Normal — within 24 hours',
  urgent: 'Urgent — ASAP please!',
};

function collectFormData(form) {
  const updateTypeVal = form.querySelector('input[name="update-type"]:checked')?.value || '';
  const urgencyVal = form.querySelector('input[name="urgency"]:checked')?.value || 'normal';

  return {
    bizName: getVal(form, '#form-biz-name'),
    contact: getVal(form, '#form-contact'),
    phone: getVal(form, '#form-phone'),
    email: getVal(form, '#form-email'),
    updateType: updateTypeVal,
    updateTypeLabel: UPDATE_TYPE_LABELS[updateTypeVal] || updateTypeVal,
    urgency: urgencyVal,
    urgencyLabel: URGENCY_LABELS[urgencyVal] || urgencyVal,
    message: getVal(form, '#form-message'),
    devNotes: getVal(form, '#form-dev-notes'),
    timestamp: new Date().toLocaleString('en-US', {
      timeZone: 'Pacific/Honolulu',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  };
}

// ─── Summary Generation ────────────────────────────────────────────────────

function generateSummary(d) {
  const line = '='.repeat(40);
  const lines = [
    line,
    '    LOCAL GRINDZ — VENDOR UPDATE',
    line,
    '',
    `DATE/TIME:    ${d.timestamp} HST`,
    '',
    `BUSINESS:     ${d.bizName}`,
    `CONTACT:      ${d.contact || '(not provided)'}`,
    `PHONE:        ${d.phone || '(not provided)'}`,
    `EMAIL:        ${d.email || '(not provided)'}`,
    '',
    `UPDATE TYPE:  ${d.updateTypeLabel}`,
    `URGENCY:      ${d.urgencyLabel}`,
    '',
    'MESSAGE:',
    d.message,
    '',
  ];

  if (d.devNotes) {
    lines.push('DEVELOPER NOTES:');
    lines.push(d.devNotes);
    lines.push('');
  }

  lines.push(line);

  return lines.join('\n');
}

// ─── Display & Clipboard ───────────────────────────────────────────────────

function displaySummary(summary) {
  const box = document.getElementById('form-confirmation');
  const pre = document.getElementById('update-summary');
  const copyStatus = document.getElementById('copy-status');

  if (pre) pre.textContent = summary;
  if (copyStatus) {
    copyStatus.textContent = '';
    copyStatus.className = 'copy-status';
  }
  if (box) {
    box.classList.remove('hidden');
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function copyToClipboard(text) {
  const status = document.getElementById('copy-status');

  const onSuccess = () => {
    if (status) {
      status.textContent = 'Copied to clipboard! Paste it into a text message or email now.';
      status.className = 'copy-status success';
    }
  };

  const onFail = () => {
    if (status) {
      status.textContent = 'Auto-copy failed — please select all the text above and copy it manually.';
      status.className = 'copy-status error';
    }
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess, onFail));
  } else {
    fallbackCopy(text, onSuccess, onFail);
  }
}

function fallbackCopy(text, onSuccess, onFail) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy') ? onSuccess() : onFail();
  } catch {
    onFail();
  }
  document.body.removeChild(ta);
}

// ─── Order Portal ──────────────────────────────────────────────────────────

function setupOrderPortal() {
  const urlEl = document.getElementById('order-page-url');
  const copyBtn = document.getElementById('copy-order-url-btn');
  const statusEl = document.getElementById('copy-url-status');

  const orderUrl = window.location.origin + '/order.html';
  if (urlEl) urlEl.textContent = orderUrl;

  // Load and display loyalty pin
  fetch('/data/vendors.json')
    .then(r => r.json())
    .then(vendors => {
      const pin = vendors[0]?.loyalty_pin;
      const pinEl = document.getElementById('loyalty-pin-display');
      if (pinEl && pin) pinEl.textContent = String(pin).toUpperCase();
    })
    .catch(() => {});

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(orderUrl).then(() => {
          if (statusEl) statusEl.textContent = 'Copied! Paste it into your QR generator.';
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = orderUrl;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        if (statusEl) statusEl.textContent = 'Copied!';
      }
    });
  }
}

function resetForm() {
  const form = document.getElementById('vendor-update-form');
  const box = document.getElementById('form-confirmation');

  if (form) {
    form.reset();
    clearErrors();
    // Re-prefill business info if profile was loaded
    loadVendorProfile();
  }
  if (box) {
    box.classList.add('hidden');
    form?.querySelector('#form-biz-name')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
