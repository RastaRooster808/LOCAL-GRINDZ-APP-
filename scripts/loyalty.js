import { getClient } from './supabase-client.js';

const POINTS_PER_DOLLAR = 1;
const POINTS_PER_REDEMPTION = 100; // 100 pts = $1 off

async function getPointsBalance(email) {
  const db = getClient();
  if (!db || !email) return 0;
  const { data, error } = await db.rpc('get_points_balance', { p_email: email.toLowerCase() });
  if (error) return 0;
  return data || 0;
}

async function earnPoints(email, vendorId, orderId, orderTotal) {
  const db = getClient();
  if (!db || !email) return;
  const points = Math.floor(orderTotal * POINTS_PER_DOLLAR);
  if (points <= 0) return;
  await db.from('customer_points').insert({
    customer_email: email.toLowerCase(),
    vendor_id: vendorId,
    order_id: orderId,
    points,
    reason: 'purchase'
  });
}

async function redeemPoints(email, pointsToRedeem, vendorId, orderId) {
  const db = getClient();
  if (!db || !email || pointsToRedeem <= 0) return 0;
  const balance = await getPointsBalance(email);
  const actualRedeem = Math.min(pointsToRedeem, balance);
  const discount = Math.floor(actualRedeem / POINTS_PER_REDEMPTION);
  if (actualRedeem <= 0 || discount <= 0) return 0;
  await db.from('customer_points').insert({
    customer_email: email.toLowerCase(),
    vendor_id: vendorId,
    order_id: orderId,
    points: -actualRedeem,
    reason: 'redemption'
  });
  return discount;
}

async function earnReviewPoints(email, vendorId) {
  const db = getClient();
  if (!db || !email) return;
  await db.from('customer_points').insert({
    customer_email: email.toLowerCase(),
    vendor_id: vendorId,
    points: 5,
    reason: 'review'
  });
}

function dollarValue(points) {
  return Math.floor(points / POINTS_PER_REDEMPTION);
}

export { getPointsBalance, earnPoints, redeemPoints, earnReviewPoints, dollarValue, POINTS_PER_REDEMPTION };
