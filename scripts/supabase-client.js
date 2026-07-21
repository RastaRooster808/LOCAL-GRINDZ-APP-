import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let client = null;

function getClient() {
  if (client) return client;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const { createClient } = window.supabase;
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

async function fetchMenu() {
  const db = getClient();
  if (db) {
    const { data, error } = await db.from('menu_items').select('*').eq('available', true).order('category');
    if (!error && data?.length) return data;
  }
  const res = await fetch('./data/menu.json');
  return res.json();
}

async function fetchLocation() {
  const db = getClient();
  if (db) {
    const { data, error } = await db.from('locations').select('*').order('updated_at', { ascending: false }).limit(1).single();
    if (!error && data) return data;
  }
  const res = await fetch('./data/location.json');
  return res.json();
}

async function fetchSpecials() {
  const db = getClient();
  if (db) {
    const { data, error } = await db.from('specials').select('*').eq('active', true).order('created_at', { ascending: false });
    if (!error && data?.length) return data;
  }
  const res = await fetch('./data/specials.json');
  return res.json();
}

async function fetchReviews() {
  const db = getClient();
  if (db) {
    const { data, error } = await db.from('reviews').select('*').eq('approved', true).order('created_at', { ascending: false }).limit(10);
    if (!error && data?.length) return data;
  }
  return [];
}

async function submitOrder(order) {
  const db = getClient();
  if (!db) throw new Error('Database not configured');
  const { error } = await db.from('orders').insert(order);
  if (error) throw error;
}

async function submitReview(review) {
  const db = getClient();
  if (!db) throw new Error('Database not configured');
  const { error } = await db.from('reviews').insert(review);
  if (error) throw error;
}

export { getClient, fetchMenu, fetchLocation, fetchSpecials, fetchReviews, submitOrder, submitReview };
