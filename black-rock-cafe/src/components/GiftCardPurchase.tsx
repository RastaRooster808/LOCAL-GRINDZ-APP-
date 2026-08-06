"use client";

import { useState } from "react";

const AMOUNTS = [25, 50, 75, 100, 150];

/**
 * Mock digital gift card purchase UI. INTEGRATION POINT: replace
 * `handleSubmit` with a real gift-card provider (Square Gift Cards, Toast,
 * or a Shopify gift card product/variant, matching this project's existing
 * `rastarooster.com/cart/{variantId}:1` checkout pattern) processed via a
 * server route — never handle raw card data client-side.
 */
export default function GiftCardPurchase() {
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState("");
  const [sent, setSent] = useState(false);

  const finalAmount = custom ? Number(custom) : amount;

  if (sent) {
    return (
      <div className="card-surface p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-white">Gift card queued! 🎁</h2>
        <p className="prose-cafe mt-3">Demo only — no payment was processed and no card was sent.</p>
      </div>
    );
  }

  return (
    <form
      className="card-surface grid gap-6 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div>
        <p className="mb-2 text-sm font-medium text-stone-300">Choose an amount</p>
        <div className="flex flex-wrap gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setAmount(a);
                setCustom("");
              }}
              aria-pressed={!custom && amount === a}
              className={`focus-ring rounded-full border px-4 py-2 text-sm font-semibold transition ${
                !custom && amount === a ? "border-lava-400 bg-lava-500/20 text-lava-200" : "border-white/15 text-stone-300"
              }`}
            >
              ${a}
            </button>
          ))}
          <input
            aria-label="Custom amount"
            placeholder="Custom $"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
            className="focus-ring w-28 rounded-full border border-white/15 bg-night-950 px-4 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="gc-recipient" className="mb-1 block text-sm font-medium text-stone-300">Recipient email</label>
          <input id="gc-recipient" type="email" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
        </div>
        <div>
          <label htmlFor="gc-from" className="mb-1 block text-sm font-medium text-stone-300">From</label>
          <input id="gc-from" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
        </div>
      </div>
      <div>
        <label htmlFor="gc-message" className="mb-1 block text-sm font-medium text-stone-300">Message (optional)</label>
        <textarea id="gc-message" rows={2} className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>

      <button type="submit" className="btn-primary w-full sm:w-fit">
        Send ${finalAmount || 0} Gift Card
      </button>
    </form>
  );
}
