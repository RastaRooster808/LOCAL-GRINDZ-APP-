"use client";

import { useState } from "react";

/**
 * Shared form for catering / party / tour bus / wedding brunch requests.
 * Demo submit only — INTEGRATION POINT: POST to a server action that emails
 * the events coordinator or writes to a CRM/spreadsheet (e.g. via a
 * Supabase table + notification, or a service like Tally/HubSpot forms).
 */
export default function PrivateEventForm({ eventType }: { eventType: string }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="card-surface p-6 text-center">
        <p className="font-semibold text-white">Request sent!</p>
        <p className="prose-cafe mt-1 text-sm">Demo only — our events team will reach out. (Not yet wired to email/CRM.)</p>
      </div>
    );
  }

  return (
    <form
      className="card-surface grid gap-4 p-6 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <input type="hidden" value={eventType} readOnly />
      <div>
        <label htmlFor={`${eventType}-name`} className="mb-1 block text-sm font-medium text-stone-300">Name</label>
        <input id={`${eventType}-name`} required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor={`${eventType}-email`} className="mb-1 block text-sm font-medium text-stone-300">Email</label>
        <input id={`${eventType}-email`} type="email" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor={`${eventType}-date`} className="mb-1 block text-sm font-medium text-stone-300">Preferred date</label>
        <input id={`${eventType}-date`} type="date" className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor={`${eventType}-size`} className="mb-1 block text-sm font-medium text-stone-300">Group size</label>
        <input id={`${eventType}-size`} type="number" min={1} className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${eventType}-details`} className="mb-1 block text-sm font-medium text-stone-300">Details</label>
        <textarea id={`${eventType}-details`} rows={3} className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <button type="submit" className="btn-primary sm:col-span-2">Send Request</button>
    </form>
  );
}
