"use client";

import { useState } from "react";

/**
 * Mock smart reservation form — validates and shows a demo confirmation.
 * INTEGRATION POINT: replace `handleSubmit`'s local state with a POST to
 * a reservations provider (OpenTable, Resy, Tock) or a Supabase table +
 * server action, and layer in the "smart" part (waitlist prediction,
 * table-turn estimates) server-side once real seating data exists.
 */
export default function ReservationForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="card-surface p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-white">Request received!</h2>
        <p className="prose-cafe mt-3">
          Demo confirmation only — no reservation was actually booked. Hook
          this up to a live reservations provider to go live.
        </p>
      </div>
    );
  }

  return (
    <form
      className="card-surface grid gap-5 p-6 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div>
        <label htmlFor="res-name" className="mb-1 block text-sm font-medium text-stone-300">Name</label>
        <input id="res-name" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor="res-phone" className="mb-1 block text-sm font-medium text-stone-300">Phone</label>
        <input id="res-phone" type="tel" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor="res-date" className="mb-1 block text-sm font-medium text-stone-300">Date</label>
        <input id="res-date" type="date" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor="res-time" className="mb-1 block text-sm font-medium text-stone-300">Time</label>
        <input id="res-time" type="time" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor="res-party" className="mb-1 block text-sm font-medium text-stone-300">Party size</label>
        <input id="res-party" type="number" min={1} max={20} defaultValue={2} required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor="res-email" className="mb-1 block text-sm font-medium text-stone-300">Email</label>
        <input id="res-email" type="email" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="res-notes" className="mb-1 block text-sm font-medium text-stone-300">Notes (optional)</label>
        <textarea id="res-notes" rows={3} className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <button type="submit" className="btn-primary sm:col-span-2">Request Reservation</button>
    </form>
  );
}
