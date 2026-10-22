/**
 * load.ts — one place to get Supabase reads right.
 *
 * The bug this exists to prevent: `.then(({ data }) => ...)` discards `error`,
 * so an unreachable database produces `data === null`, which every caller then
 * treats as "no rows". The directory rendered "No vendors in this category yet"
 * while six vendors existed and the project was paused.
 *
 * Empty and broken are different states and must never render the same way.
 */

export interface SupabaseResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

export interface Settled<T> {
  data: T;
  /** Human-readable, or null when the read genuinely succeeded. */
  error: string | null;
}

/** Postgres/PostgREST codes that mean "the backend is not answering", as
 *  opposed to "your query was wrong". Worth wording differently to a visitor. */
const UNREACHABLE = new Set(['PGRST301', '08006', '08003', '57P01', '57P03', 'XX000']);

export function describe(error: { message: string; code?: string } | null): string | null {
  if (!error) return null;
  if (error.code && UNREACHABLE.has(error.code)) {
    return 'We could not reach the kitchen right now.';
  }
  if (/fetch|network|timeout|Failed to fetch/i.test(error.message)) {
    return 'We could not reach the kitchen right now.';
  }
  return 'Something went wrong loading this.';
}

/**
 * Normalize a Supabase result. `fallback` is what callers render while broken —
 * usually an empty array — but `error` is set, so the caller can say so.
 */
export function settle<T>(res: SupabaseResult<T>, fallback: T): Settled<T> {
  if (res && res.error) return { data: fallback, error: describe(res.error) };
  return { data: (res && res.data != null ? res.data : fallback), error: null };
}

/** True when the surface has nothing to show AND nothing went wrong. */
export function isGenuinelyEmpty(count: number, error: string | null): boolean {
  return count === 0 && error === null;
}

/**
 * Wrap a Supabase query so BOTH failure modes land in the same place.
 *
 * Two ways a read fails, and they arrive differently:
 *   1. Supabase answers with `{ data: null, error }` — `.then()` runs.
 *   2. The fetch itself rejects (DNS, TLS, offline, proxy) — `.then()` NEVER
 *      runs, so any `setLoading(false)` inside it never happens and the page
 *      spins forever. This is what a real outage looked like in testing.
 *
 * Always use this rather than `.then(settle)`.
 */
export function guard<T>(query: PromiseLike<SupabaseResult<T>>, fallback: T): Promise<Settled<T>> {
  return Promise.resolve(query).then(
    res => settle(res, fallback),
    err => ({
      data: fallback,
      error: describe({ message: String((err && err.message) || err || 'network') }),
    }),
  );
}
