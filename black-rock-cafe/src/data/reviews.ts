import type { Review } from "./types";

/**
 * MOCK DATA — placeholder reviews for UI/layout only.
 * Integration point: replace with the Google Places API (Place Details →
 * `reviews` field) or the Google Business Profile API, fetched server-side
 * in `src/app/(marketing)/page.tsx` / a dedicated route handler, cached with
 * `revalidate`. Never fabricate real customer reviews in production.
 */
export const mockReviews: Review[] = [
  {
    id: "r1",
    author: "Kalani M.",
    rating: 5,
    text: "The Loco Moco is the real deal and the staff treats you like ohana. Go hungry.",
    source: "Google",
    date: "2026-05-02",
  },
  {
    id: "r2",
    author: "Trevor H.",
    rating: 5,
    text: "Best burger we had on the whole island. Huge portions, super friendly.",
    source: "Google",
    date: "2026-04-18",
  },
  {
    id: "r3",
    author: "Noelani K.",
    rating: 4,
    text: "Great local spot in Pahoa, love the history on the wall. Kalua pork plate is a must.",
    source: "Google",
    date: "2026-03-27",
  },
];
