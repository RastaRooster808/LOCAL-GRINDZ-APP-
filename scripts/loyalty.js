const STAMPS_NEEDED = 10;
const STORAGE_KEY = 'lg_loyalty_v1';

let state = { stamps: 0, history: [], lifetime: 0 };
let vendorPin = '';

document.addEventListener('DOMContentLoaded', () => {
  loadVendorPin();
  loadState();
  render();

  document.getElementById('add-stamp-btn').addEventListener('click', handleAddStamp);
  document.getElementById('stamp-code-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAddStamp();
  });
  document.getElementById('redeem-btn')?.addEventListener('click', handleRedeem);
  document.getElementById('reset-loyalty-btn')?.addEventListener('click', handleReset);
});

// ─── Data ──────────────────────────────────────────────────────────────────

async function loadVendorPin() {
  try {
    const res = await fetch('/data/vendors.json');
    if (!res.ok) throw new Error('fetch failed');
    const vendors = await res.json();
    vendorPin = String(vendors[0]?.loyalty_pin || '').toUpperCase().trim();
  } catch {
    vendorPin = '';
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch {
    // localStorage unavailable (private browsing on some iOS)
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // silently fail — stamps won't persist, inform user via feedback
  }
}

// ─── Render ────────────────────────────────────────────────────────────────

function render() {
  renderPunchCard();
  renderStampCount();
  renderHistory();
  renderRedeemSection();
}

function renderPunchCard() {
  const card = document.getElementById('punch-card');
  if (!card) return;

  card.innerHTML = Array.from({ length: STAMPS_NEEDED }, (_, i) =>
    `<span class="stamp-dot${i < state.stamps ? ' stamp-filled' : ''}" aria-hidden="true"></span>`
  ).join('');

  card.setAttribute('aria-label', `${state.stamps} of ${STAMPS_NEEDED} stamps collected`);
}

function renderStampCount() {
  const el = document.getElementById('stamp-count');
  if (el) el.textContent = `${state.stamps} / ${STAMPS_NEEDED} stamps`;
}

function renderHistory() {
  const list = document.getElementById('stamp-history');
  if (!list) return;

  if (!state.history || state.history.length === 0) {
    list.innerHTML = '<li style="color:var(--ash-gray);font-size:0.88rem;padding:0.25rem 0">No stamps yet. Make a purchase and ask for the stamp code!</li>';
    return;
  }

  list.innerHTML = [...state.history]
    .reverse()
    .map(entry => `
      <li class="history-entry">
        <span class="history-icon">${entry.redeemed ? '🎁' : '⭐'}</span>
        <span class="history-detail">
          <strong>${entry.redeemed ? 'Redeemed — free burger earned!' : 'Stamp earned'}</strong>
          <span>${entry.date}</span>
        </span>
      </li>
    `)
    .join('');
}

function renderRedeemSection() {
  const redeemSec = document.getElementById('redeem-section');
  const addSec = document.getElementById('add-stamp-section');
  const full = state.stamps >= STAMPS_NEEDED;

  if (redeemSec) redeemSec.classList.toggle('hidden', !full);
  if (addSec) addSec.classList.toggle('hidden', full);
}

// ─── Stamp Actions ─────────────────────────────────────────────────────────

function handleAddStamp() {
  const input = document.getElementById('stamp-code-input');
  const entered = input.value.trim().toUpperCase();

  if (!entered) {
    showFeedback('Enter the stamp code you got from the vendor.', 'error');
    input.focus();
    return;
  }

  if (state.stamps >= STAMPS_NEEDED) {
    showFeedback('Your card is full! Redeem your free burger first.', 'error');
    return;
  }

  // Validate against vendor pin if loaded; accept any 2+ char code otherwise (fallback)
  const isValid = vendorPin ? entered === vendorPin : entered.length >= 2;

  if (!isValid) {
    showFeedback("Code doesn't match. Ask the vendor for the current stamp code.", 'error');
    input.value = '';
    input.focus();
    return;
  }

  state.stamps = (state.stamps || 0) + 1;
  state.lifetime = (state.lifetime || 0) + 1;
  state.history = state.history || [];
  state.history.push({
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    redeemed: false,
  });

  saveState();
  render();
  input.value = '';

  if (state.stamps >= STAMPS_NEEDED) {
    showFeedback('Card complete! You earned a free Volcano Smash! 🎉', 'success');
  } else {
    const left = STAMPS_NEEDED - state.stamps;
    showFeedback(`Stamp added! ${left} more until your free burger.`, 'success');
  }
}

function handleRedeem() {
  if (state.stamps < STAMPS_NEEDED) return;

  const confirmed = window.confirm(
    'Show this to the vendor and confirm your free Volcano Smash.\n\nOnce you tap OK, your card resets. Did the vendor confirm your reward?'
  );
  if (!confirmed) return;

  state.history.push({
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    redeemed: true,
  });
  state.stamps = 0;
  saveState();
  render();
  showFeedback('Redeemed! Enjoy your free Volcano Smash. Starting a new card now. 🍔', 'success');
}

function handleReset() {
  const confirmed = window.confirm('This will erase all your stamps and start fresh. Are you sure?');
  if (!confirmed) return;

  state = { stamps: 0, history: [], lifetime: state.lifetime || 0 };
  saveState();
  render();
  showFeedback('Card reset. Ready for your next burger journey!', 'success');
}

// ─── Feedback ──────────────────────────────────────────────────────────────

function showFeedback(message, type) {
  const el = document.getElementById('stamp-feedback');
  if (!el) return;
  el.textContent = message;
  el.className = `stamp-feedback ${type}`;
}
