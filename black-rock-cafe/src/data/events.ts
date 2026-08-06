import type { CommunityEvent } from "./types";

/**
 * MOCK DATA — placeholder community calendar for UI/layout only.
 * Integration point: replace with a CMS-driven collection (Sanity/Payload)
 * or a Google Calendar embed so staff can manage events without a deploy.
 */
export const mockEvents: CommunityEvent[] = [
  {
    id: "e1",
    title: "Live Music: Kai & the Ohia Strings",
    date: "2026-08-14",
    time: "6:00 PM – 8:30 PM",
    category: "live-music",
    description: "Local slack key guitar on the lanai. No cover.",
  },
  {
    id: "e2",
    title: "Pahoa Village Farmers Market",
    date: "2026-08-16",
    time: "8:00 AM – 12:00 PM",
    category: "farmers-market",
    description: "Weekly market right down the road — grab produce before or after breakfast.",
  },
  {
    id: "e3",
    title: "Burger of the Month Reveal",
    date: "2026-09-01",
    time: "All day",
    category: "cafe",
    description: "This month's secret-menu-inspired burger special drops.",
  },
  {
    id: "e4",
    title: "Puna Community Talk Story",
    date: "2026-09-05",
    time: "5:30 PM",
    category: "community",
    description: "Neighborhood board meet-up hosted in our back room.",
  },
];
