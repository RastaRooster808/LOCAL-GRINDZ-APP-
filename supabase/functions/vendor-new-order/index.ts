/**
 * vendor-new-order — Supabase DB webhook on orders INSERT
 * Sends a Web Push notification to the vendor so they see new orders
 * even when the dashboard tab is closed.
 *
 * Webhook setup (Supabase Dashboard → Database → Webhooks):
 *   Name : vendor-new-order
 *   Table: orders
 *   Event: INSERT
 *   URL  : https://<project>.supabase.co/functions/v1/vendor-new-order
 *   Headers: { Authorization: Bearer <service-role-key> }
 *
 * Required Edge Function secrets:
 *   VAPID_PUBLIC_KEY  — base64url EC P-256 public key
 *   VAPID_PRIVATE_KEY — base64url EC P-256 private key
 *   SITE_URL          — e.g. https://rastarooster808.github.io/LOCAL-GRINDZ-APP-
 *
 * Deploy:
 *   supabase functions deploy vendor-new-order --no-verify-jwt
 */

import webpush from 'npm:web-push';
import { createClient } from 'npm:@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

webpush.setVapidDetails(
  'mailto:admin@localgrindz.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://rastarooster808.github.io/LOCAL-GRINDZ-APP-';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let payload: { record: Record<string, unknown> };
  try { payload = await req.json(); } catch { return new Response('Bad request', { status: 400 }); }

  const order = payload.record;
  const vendorId = order.vendor_id as string;
  const customerName = (order.customer_name as string) || 'A customer';
  const total = Number(order.total ?? 0).toFixed(2);

  // Fetch vendor push subscription(s)
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_type', 'vendor')
    .eq('user_ref', vendorId);

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no subscription' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const notification = JSON.stringify({
    title: '🔔 New Order!',
    body: `${customerName} ordered — $${total}`,
    url: `${SITE_URL}/#/vendor`,
  });

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification,
      )
    ),
  );

  // Remove expired/invalid subscriptions
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'rejected' && (r.reason?.statusCode === 410 || r.reason?.statusCode === 404)) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', subs[i].endpoint);
    }
  }

  const sent = results.filter(r => r.status === 'fulfilled').length;
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
});
