import { supabase } from '../lib/supabase';

const POINTS_PER_DOLLAR = 1;
const POINTS_PER_REDEMPTION = 100; // 100 pts = $1 off

export async function getPointsBalance(email: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_points_balance', {
    p_email: email.toLowerCase(),
  });
  if (error) return 0;
  return data || 0;
}

export async function earnPoints(
  email: string,
  vendorId: string,
  orderId: string | null,
  orderTotal: number
) {
  const points = Math.floor(orderTotal * POINTS_PER_DOLLAR);
  if (points <= 0) return;
  await supabase.from('customer_points').insert({
    customer_email: email.toLowerCase(),
    vendor_id: vendorId,
    order_id: orderId,
    points,
    reason: 'purchase',
  });
}

export async function redeemPoints(
  email: string,
  pointsToRedeem: number,
  vendorId: string,
  orderId: string | null
): Promise<number> {
  if (pointsToRedeem <= 0) return 0;
  const balance = await getPointsBalance(email);
  const actualRedeem = Math.min(pointsToRedeem, balance);
  const discount = Math.floor(actualRedeem / POINTS_PER_REDEMPTION);
  if (actualRedeem <= 0 || discount <= 0) return 0;
  await supabase.from('customer_points').insert({
    customer_email: email.toLowerCase(),
    vendor_id: vendorId,
    order_id: orderId,
    points: -actualRedeem,
    reason: 'redemption',
  });
  return discount;
}

export async function earnReviewPoints(email: string, vendorId: string) {
  await supabase.from('customer_points').insert({
    customer_email: email.toLowerCase(),
    vendor_id: vendorId,
    points: 5,
    reason: 'review',
  });
}

export function dollarValue(points: number) {
  return Math.floor(points / POINTS_PER_REDEMPTION);
}

export { POINTS_PER_REDEMPTION };
