"use client";

export default function BirthdayClubForm() {
  return (
    <form className="card-surface space-y-4 p-6" onSubmit={(e) => e.preventDefault()}>
      <h2 className="font-display text-xl font-semibold text-white">Join the Birthday Club</h2>
      <div>
        <label htmlFor="vip-name" className="mb-1 block text-sm font-medium text-stone-300">Name</label>
        <input id="vip-name" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor="vip-email" className="mb-1 block text-sm font-medium text-stone-300">Email</label>
        <input id="vip-email" type="email" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor="vip-bday" className="mb-1 block text-sm font-medium text-stone-300">Birthday</label>
        <input id="vip-bday" type="date" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <button type="submit" className="btn-primary w-full">Join Free</button>
      <p className="text-xs text-stone-500">
        Demo form — connect to an email/SMS platform (e.g. Klaviyo) to
        actually enroll members and trigger birthday offers.
      </p>
    </form>
  );
}
