import { mockReviews } from "@/data/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <div aria-label={`${rating} out of 5 stars`} className="flex gap-0.5 text-sunrise-300">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="16" height="16" viewBox="0 0 20 20" fill={n <= rating ? "currentColor" : "none"} stroke="currentColor" aria-hidden>
          <path d="M10 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L10 1.5z" strokeWidth="1" />
        </svg>
      ))}
    </div>
  );
}

/**
 * MOCK — see src/data/reviews.ts for the real Google Reviews integration
 * point (Places API / Business Profile API, server-fetched with caching).
 */
export default function GoogleReviews() {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {mockReviews.map((r) => (
        <figure key={r.id} className="card-surface p-5">
          <Stars rating={r.rating} />
          <blockquote className="prose-cafe mt-3 text-sm">&ldquo;{r.text}&rdquo;</blockquote>
          <figcaption className="mt-3 text-sm font-medium text-white">
            {r.author} <span className="font-normal text-stone-500">· Google</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
