"use client";

import { useState } from "react";

const TOTAL_PUNCHES = 10;

/**
 * Demo digital punch card (local state only). INTEGRATION POINT: back this
 * with real account state (Supabase table keyed by customer, or a loyalty
 * platform like Punchh/Fivestars/Square Loyalty) tied to login/order
 * history instead of a button click.
 */
export default function LoyaltyPunchCard() {
  const [punches, setPunches] = useState(3);
  const unlocked = punches >= TOTAL_PUNCHES;

  return (
    <div className="card-surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold text-white">Digital Punch Card</h3>
        <span className="text-sm text-stone-400">{punches}/{TOTAL_PUNCHES}</span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-3">
        {Array.from({ length: TOTAL_PUNCHES }).map((_, i) => (
          <div
            key={i}
            aria-hidden
            className={`flex aspect-square items-center justify-center rounded-full border text-lg ${
              i < punches ? "border-lava-400 bg-lava-500/30 text-lava-200" : "border-white/15 text-stone-600"
            }`}
          >
            {i < punches ? "🌋" : ""}
          </div>
        ))}
      </div>
      {unlocked ? (
        <p className="mt-4 font-semibold text-sunrise-300">Free meal unlocked — show this screen to your server!</p>
      ) : (
        <button
          type="button"
          onClick={() => setPunches((p) => Math.min(TOTAL_PUNCHES, p + 1))}
          className="btn-secondary mt-4 !px-4 !py-2 text-sm"
        >
          Simulate a visit (demo)
        </button>
      )}
    </div>
  );
}
