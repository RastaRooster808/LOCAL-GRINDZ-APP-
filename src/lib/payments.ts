/**
 * payments.ts — vendor P2P payment links.
 *
 * The platform never holds funds. Customers pay the vendor directly through the
 * vendor's own PayPal.Me / Venmo / Cash App handle; the order records the trail
 * (payment_method + payment_status) and the EOM statement view tallies the
 * 5% platform fee on confirmed prepaid volume above $500/month.
 */

export type PaymentMethod = 'cash' | 'paypal' | 'venmo' | 'cashapp';

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash at pickup',
  paypal: 'PayPal',
  venmo: 'Venmo',
  cashapp: 'Cash App',
};

export interface VendorPaymentHandles {
  paypal_handle?: string | null;
  venmo_handle?: string | null;
  cashapp_handle?: string | null;
  preferred_payment?: string | null;
}

/** Clean a handle: strip @, $, whitespace, and any pasted URL prefix. */
function clean(handle: string): string {
  return handle
    .trim()
    .replace(/^https?:\/\/[^/]+\//i, '')
    .replace(/^[@$]/, '')
    .trim();
}

/** Payment methods this vendor actually accepts (cash always available). */
export function availableMethods(v: VendorPaymentHandles): PaymentMethod[] {
  const methods: PaymentMethod[] = [];
  const preferred = (v.preferred_payment ?? '') as PaymentMethod;
  if (v.paypal_handle) methods.push('paypal');
  if (v.venmo_handle) methods.push('venmo');
  if (v.cashapp_handle) methods.push('cashapp');
  methods.sort((a, b) => (a === preferred ? -1 : b === preferred ? 1 : 0));
  methods.push('cash');
  return methods;
}

/** Deep link that opens the vendor's payment app with amount + note prefilled. */
export function paymentLink(
  method: PaymentMethod,
  v: VendorPaymentHandles,
  amount: number,
  note: string,
): string | null {
  const amt = amount.toFixed(2);
  switch (method) {
    case 'paypal':
      return v.paypal_handle ? `https://paypal.me/${clean(v.paypal_handle)}/${amt}` : null;
    case 'venmo':
      return v.venmo_handle
        ? `https://account.venmo.com/pay?recipients=${encodeURIComponent(clean(v.venmo_handle))}&amount=${amt}&note=${encodeURIComponent(note)}`
        : null;
    case 'cashapp':
      return v.cashapp_handle ? `https://cash.app/$${clean(v.cashapp_handle)}/${amt}` : null;
    default:
      return null;
  }
}
