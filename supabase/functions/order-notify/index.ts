import { withSupabase } from '@supabase/server';
import webpush from 'npm:web-push';

/**
 * order-notify — called by a Supabase database webhook when order.status changes.
 * Payload shape: { type: "UPDATE", table: "orders", record: Order, old_record: Order }
 *
 * Deploy:
 *   supabase functions deploy order-notify --no-verify-jwt
 *
 * supabase/config.toml:
 *   [functions.order-notify]
 *   verify_jwt = false
 */
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://rastarooster808.github.io/LOCAL-GRINDZ-APP-';

function initWebPush() {
  const pub = Deno.env.get('VAPID_PUBLIC_KEY');
  const priv = Deno.env.get('VAPID_PRIVATE_KEY');
  if (pub && priv) webpush.setVapidDetails('mailto:admin@localgrindz.com', pub, priv);
}

export default {
  fetch: withSupabase({ auth: 'secret' }, async (req, ctx) => {
    let payload: { record: Record<string, unknown>; old_record: Record<string, unknown> };
    try {
      payload = await req.json();
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    const order = payload.record;
    const oldOrder = payload.old_record;

    // Only act when status actually changed
    if (order.status === oldOrder.status) {
      return new Response('No status change', { status: 200 });
    }

    const orderId = order.id as string;
    const newStatus = order.status as string;
    const customerEmail = order.customer_email as string | null;
    const customerName = order.customer_name as string;
    const estimatedMinutes = order.estimated_minutes as number | null;

    // Fetch vendor name using admin client (bypasses RLS)
    const { data: vendor } = await ctx.supabaseAdmin
      .from('vendors')
      .select('name')
      .eq('id', order.vendor_id)
      .single();

    const vendorName = vendor?.name ?? 'Your vendor';
    const trackUrl = `${Deno.env.get('SITE_URL') ?? 'https://localgrindz.com'}/#/order/${orderId}`;

    const statusMessages: Record<string, string> = {
      accepted: `✅ Your order from ${vendorName} has been accepted!${estimatedMinutes ? ` Ready in ~${estimatedMinutes} min.` : ''}`,
      preparing: `🍳 ${vendorName} is preparing your order now!`,
      ready: `🔔 Your order from ${vendorName} is ready for pickup!`,
      completed: `🎉 Order complete! Thanks for ordering from ${vendorName}.`,
      cancelled: `❌ Your order from ${vendorName} was cancelled.${order.cancellation_reason ? ` Reason: ${order.cancellation_reason}` : ''}`,
    };

    const message = statusMessages[newStatus];
    if (!message || !customerEmail) {
      return new Response('No notification needed', { status: 200 });
    }

    // Send email via Supabase Auth email (or swap for Resend/SendGrid)
    const { error } = await ctx.supabaseAdmin.auth.admin.createUser({
      email: customerEmail,
      email_confirm: true,
    }).then(() => ({ error: null })).catch(e => ({ error: e }));

    // Use Resend (recommended) — set RESEND_API_KEY as a secret
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey && customerEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Local Grindz <orders@localgrindz.com>',
          to: [customerEmail],
          subject: `Order Update — ${vendorName}`,
          html: `
            <p>Aloha ${customerName},</p>
            <p>${message}</p>
            <p><a href="${trackUrl}">Track your order →</a></p>
            <p style="color:#888;font-size:12px">Local Grindz — Hawaiʻi Food Marketplace</p>
          `,
        }),
      });
    }

    void error; // suppress unused var warning

    // Customer Web Push (best-effort, non-blocking)
    if (customerEmail && message) {
      try {
        initWebPush();
        const { data: subs } = await ctx.supabaseAdmin
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_type', 'customer')
          .eq('user_ref', customerEmail);

        if (subs && subs.length > 0) {
          const notification = JSON.stringify({
            title: 'Order Update',
            body: message,
            url: `${SITE_URL}/#/order/${orderId}`,
          });
          await Promise.allSettled(
            subs.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
              try {
                await webpush.sendNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  notification,
                );
              } catch (e: unknown) {
                const status = (e as { statusCode?: number }).statusCode;
                if (status === 410 || status === 404) {
                  await ctx.supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                }
              }
            }),
          );
        }
      } catch { /* push is optional */ }
    }

    return new Response(JSON.stringify({ sent: true, status: newStatus }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }),
};
