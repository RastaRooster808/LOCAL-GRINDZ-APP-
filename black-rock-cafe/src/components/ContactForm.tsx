"use client";

export default function ContactForm() {
  return (
    <form className="card-surface grid gap-4 p-6" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="c-name" className="mb-1 block text-sm font-medium text-stone-300">Name</label>
        <input id="c-name" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor="c-email" className="mb-1 block text-sm font-medium text-stone-300">Email</label>
        <input id="c-email" type="email" required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <div>
        <label htmlFor="c-message" className="mb-1 block text-sm font-medium text-stone-300">Message</label>
        <textarea id="c-message" rows={5} required className="focus-ring w-full rounded-lg border border-white/15 bg-night-950 px-3 py-2 text-white" />
      </div>
      <button type="submit" className="btn-primary w-fit">Send (demo)</button>
    </form>
  );
}
