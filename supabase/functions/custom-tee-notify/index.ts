/**
 * custom-tee-notify — Supabase DB webhook on custom_tee_orders INSERT
 * Emails info@rastarooster.com so a new custom tee request doesn't sit
 * unseen in the database until someone checks the Supabase dashboard.
 *
 * Webhook setup (Supabase Dashboard → Database → Webhooks):
 *   Name : custom-tee-notify
 *   Table: custom_tee_orders
 *   Event: INSERT
 *   URL  : https://<project>.supabase.co/functions/v1/custom-tee-notify
 *   (No Authorization header needed — verify_jwt is off for this function.)
 *
 * Required Edge Function secret:
 *   RESEND_API_KEY — same secret order-notify already documents/uses.
 *   Without it, the function just logs and returns 200 (no email sent, no error).
 *
 * Deploy:
 *   supabase functions deploy custom-tee-notify --no-verify-jwt
 *
 * supabase/config.toml:
 *   [functions.custom-tee-notify]
 *   verify_jwt = false
 */

const NOTIFY_TO = Deno.env.get('CUSTOM_TEE_NOTIFY_EMAIL') ?? 'info@rastarooster.com';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://rastarooster808.github.io/LOCAL-GRINDZ-APP-';

const SHIRT_LABELS: Record<string, string> = {
  standard_tee: 'Standard Tee',
  heavy_cotton: 'Heavy Cotton Tee',
  hoodie: 'Hoodie',
};

const FULFILLMENT_LABELS: Record<string, string> = {
  pahoa_pickup: 'Pāhoa Pickup',
  hawaii_ship: 'Hawaiʻi Island Shipping',
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let payload: { record: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const order = payload.record;
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    console.log('custom-tee-notify: RESEND_API_KEY not set, skipping email', order.id);
    return new Response(JSON.stringify({ sent: false, reason: 'no RESEND_API_KEY' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const shirtLabel = SHIRT_LABELS[order.shirt_type as string] ?? (order.shirt_type as string);
  const fulfillmentLabel = FULFILLMENT_LABELS[order.fulfillment as string] ?? (order.fulfillment as string);
  const printLocations = Array.isArray(order.print_locations) ? (order.print_locations as string[]).join(' + ') : order.print_locations;
  const total = Number(order.total ?? 0).toFixed(2);

  const html = `
    <p>New custom tee request — Rasta Rooster</p>
    <ul>
      <li><strong>Garment:</strong> ${shirtLabel}${order.shirt_size ? `, size ${order.shirt_size}` : ''}${order.shirt_color ? `, ${order.shirt_color}` : ''}</li>
      <li><strong>Print:</strong> ${printLocations}</li>
      <li><strong>Quantity:</strong> ${order.quantity}</li>
      <li><strong>Fulfillment:</strong> ${fulfillmentLabel}${order.shipping_address ? `<br>${order.shipping_address}` : ''}</li>
      <li><strong>Estimated total:</strong> $${total}</li>
      ${order.design_notes ? `<li><strong>Design notes:</strong> ${order.design_notes}</li>` : ''}
      ${order.reference_image_url ? `<li><strong>Reference art:</strong> <a href="${order.reference_image_url}">${order.reference_image_url}</a></li>` : ''}
    </ul>
    <p><strong>Customer:</strong> ${order.customer_name} — ${order.customer_email}${order.customer_phone ? ` — ${order.customer_phone}` : ''}</p>
    <p style="color:#888;font-size:12px">Order ID: ${order.id} · ${SITE_URL}</p>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Local Grindz <orders@localgrindz.com>',
      to: [NOTIFY_TO],
      subject: `New Custom Tee Request — ${order.customer_name}`,
      html,
    }),
  });

  return new Response(JSON.stringify({ sent: res.ok }), {
    status: res.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  });
});
