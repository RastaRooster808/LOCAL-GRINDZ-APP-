/**
 * analytics.ts — lightweight event tracking hooks
 *
 * Usage:
 *   import { trackEvent } from '../lib/analytics';
 *   trackEvent('cta_click', { label: 'Join TOPP', destination: '/membership', section: 'hero' });
 *
 * In development: logs to console.debug.
 * In production: queues events for a future analytics provider
 * (Plausible, PostHog, GA4 — do NOT add paid scripts yet).
 *
 * The queue is drained when window.lgAnalytics is set (future integration hook).
 */

export type EventName =
  | 'cta_click'
  | 'search_query'
  | 'search_result_click'
  | 'newsletter_signup'
  | 'page_view'
  | 'product_view'
  | 'commerce_intent'
  | 'chat_open'
  | 'push_subscribe'
  | 'vendor_apply'
  | 'order_placed'
  | 'review_submitted';

export interface EventPayload {
  label?: string;
  destination?: string;
  section?: string;
  query?: string;
  vendor_id?: string;
  vendor_name?: string;
  product_id?: string;
  product_type?: string;
  [key: string]: unknown;
}

type AnalyticsEntry = { name: EventName; payload: EventPayload | undefined; ts: number };

const queue: Array<AnalyticsEntry> = [];

export function trackEvent(name: EventName, payload?: EventPayload): void {
  const entry: AnalyticsEntry = { name, payload, ts: Date.now() };

  if (import.meta.env.DEV) {
    console.debug('[analytics]', name, payload ?? '');
  }

  queue.push(entry);

  // Future hook: if a global analytics handler is registered, drain the queue
  const w = window as unknown as { lgAnalytics?: (e: typeof entry) => void };
  if (typeof w.lgAnalytics === 'function') {
    while (queue.length > 0) {
      const ev = queue.shift()!;
      try { w.lgAnalytics(ev); } catch { /* never crash on analytics */ }
    }
  }
}

/** Expose the current queue for debugging */
export function getEventQueue() {
  return [...queue];
}
