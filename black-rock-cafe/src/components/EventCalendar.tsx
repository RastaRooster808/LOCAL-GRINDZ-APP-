import { mockEvents } from "@/data/events";

const CATEGORY_LABEL: Record<string, string> = {
  "live-music": "Live Music",
  "farmers-market": "Farmers Market",
  community: "Community",
  cafe: "Black Rock Cafe",
};

/**
 * MOCK — see src/data/events.ts for the integration point (CMS collection
 * or Google Calendar embed) that would replace this static list.
 */
export default function EventCalendar() {
  return (
    <ul className="space-y-3">
      {mockEvents.map((e) => (
        <li key={e.id} className="card-surface flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white">{e.title}</p>
            <p className="prose-cafe text-sm">{e.description}</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-sunrise-300">{CATEGORY_LABEL[e.category]}</p>
            <p className="text-stone-400">
              {new Date(e.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {e.time}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
