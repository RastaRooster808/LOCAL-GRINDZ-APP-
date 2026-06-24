const STORAGE_KEY = 'lg_loyalty_v1';

let state = { stamps: 0, history: [], lifetime: 0 };
let campaign = {
  stamp_code: '',
  stamps_required: 10,
  reward_description: '1 Free Volcano Smash',
  campaign_active: true,
};

document.addEventListener('DOMContentLoaded', () => {
  loadCampaign();
  loadState();
  render();

  document.getElementById('add-stamp-btn').addEventListener('click', handleAddStamp);
  document.getElementById('stamp-code-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAddStamp();
  });
  document.getElementById('redeem-btn')?.addEventListener('click', handleRedeem);
  document.getElementById('reset-loyalty-btn')?.addEventListener('click', handleReset);
});

// ─── Load campaign config from loyalty.json ────────────────────────────────

async function loadCampaign() {
  try {
    // Primary source: loyalty.json
    const res = await fetch('/data/loyalty.json');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();

    campaign.stamp_code        = String(data.stamp_code || '').toUpperCase().trim();
    campaign.stamps_required   = data.stamps_required   || 10;
    campaign.reward_description= data.reward_description || '1 Free Volcano Smash';
    campaign.campaign_active   = data.campaign_active !== false;
    campaign.campaign_name     = data.campaign_name || 'Loyalty Program';
  } catch {
    // Fallback: try vendors.json for legacy loyalty_pin
    try {
      const res2 = await fetch('/data/vendors.json');
      const vendors = await res2.json();
      campaign.stamp_code = String(vendors[0]?.loyalty_pin || '').toUpperCase().trim();
    } catch {
      campaign.stamp_code = '';
    }
  }

  // Update UI with campaign details
  const rewardEl = document.querySelector('.loyalty-goal strong');
  if (rewardEl) rewardEl.textContent = campaign.reward_description;
}

// ─── State (localStorage) ──────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch {}
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
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

  const total = campaign.stamps_required;
  card.innerHTML = Array.from({ length: total }, (_, i) =>
    `<span class="stamp-dot${i < state.stamps ? ' stamp-filled' : ''}" aria-hidden="true"></span>`
  ).join('');

  card.setAttribute('aria-label', `${state.stamps} of ${total} stamps collected`);
}

function renderStampCount() {
  const el = document.getElementById('stamp-count');
  if (el) el.textContent = `${state.stamps} / ${campaign.stamps_required} stamps`;
}

function renderHistory() {
  const list = document.getElementById('stamp-history');
  if (!list) return;

  if (!state.history || state.history.length === 0) {
    list.innerHTML = '<li style="color:var(--ash-gray);font-size:.88rem;padding:.25rem 0">No stamps yet. Make a purchase and ask for the stamp code!</li>';
    return;
  }

  list.innerHTML = [...state.history].reverse().map(entry => `
    <li class="history-entry">
      <span class="history-icon">${entry.redeemed ? '🎁' : '⭐'}</span>
      <span class="history-detail">
        <strong>${entry.redeemed ? 'Redeemed — ' + campaign.reward_description : 'Stamp earned'}</strong>
        <span>${entry.date}</span>
      </span>
    </li>
  `).join('');
}

function renderRedeemSection() {
  const redeemSec = document.getElementById('redeem-section');
  const addSec    = document.getElementById('add-stamp-section');
  const full = state.stamps >= campaign.stamps_required;

  if (redeemSec) redeemSec.classList.toggle('hidden', !full);
  if (addSec)    addSec.classList.toggle('hidden', full);
}

// ─── Stamp Actions ─────────────────────────────────────────────────────────

function handleAddStamp() {
  const input    = document.getElementById('stamp-code-input');
  const entered  = input.value.trim().toUpperCase();

  if (!entered) {
    showFeedback('Enter the stamp code from the vendor.', 'error');
    input.focus();
    return;
  }

  if (!campaign.campaign_active) {
    showFeedback('The loyalty program is currently paused. Check back soon!', 'error');
    return;
  }

  if (state.stamps >= campaign.stamps_required) {
    showFeedback('Your card is full! Redeem your reward first.', 'error');
    return;
  }

  const isValid = campaign.stamp_code
    ? entered === campaign.stamp_code
    : entered.length >= 2;

  if (!isValid) {
    showFeedback("Code doesn't match. Ask the vendor for today's stamp code.", 'error');
    input.value = '';
    input.focus();
    return;
  }

  state.stamps   = (state.stamps || 0) + 1;
  state.lifetime = (state.lifetime || 0) + 1;
  state.history  = state.history || [];
  state.history.push({
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    redeemed: false,
  });

  saveState();
  render();
  input.value = '';

  if (state.stamps >= campaign.stamps_required) {
    showFeedback(`Card complete! You earned ${campaign.reward_description}! 🎉`, 'success');
  } else {
    const left = campaign.stamps_required - state.stamps;
    showFeedback(`Stamp added! ${left} more until your ${campaign.reward_description}.`, 'success');
  }
}

function handleRedeem() {
  if (state.stamps < campaign.stamps_required) return;

  const confirmed = window.confirm(
    `Show this to the vendor and confirm your ${campaign.reward_description}.\n\nOnce you tap OK, your card resets. Did the vendor confirm your reward?`
  );
  if (!confirmed) return;

  state.history.push({
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    redeemed: true,
  });
  state.stamps = 0;
  saveState();
  render();
  showFeedback(`Redeemed! Enjoy your ${campaign.reward_description}. Starting a new card. 🍔`, 'success');
}

function handleReset() {
  const confirmed = window.confirm('This will erase all your stamps and start fresh. Are you sure?');
  if (!confirmed) return;

  state = { stamps: 0, history: [], lifetime: state.lifetime || 0 };
  saveState();
  render();
  showFeedback('Card reset. Ready for your next burger journey!', 'success');
}

function showFeedback(message, type) {
  const el = document.getElementById('stamp-feedback');
  if (!el) return;
  el.textContent = message;
  el.className = `stamp-feedback ${type}`;
}
