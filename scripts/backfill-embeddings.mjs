/**
 * Generates embeddings for all vendors and menu items that don't have one yet.
 * Run after applying phase-4n-ai-search.sql and deploying the embed function.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   EMBED_URL=https://xxx.supabase.co/functions/v1/embed \
 *   node scripts/backfill-embeddings.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const EMBED_URL = process.env.EMBED_URL ?? `${SUPABASE_URL}/functions/v1/embed`;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

async function fetchAll(table, select, filter = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${filter ? `&${filter}` : ''}`;
  const res = await fetch(url, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } });
  return res.json();
}

async function embed(table, id, delay = 200) {
  await new Promise(r => setTimeout(r, delay)); // rate-limit OpenAI calls
  const res = await fetch(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ table, id }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

const vendors = await fetchAll('vendors', 'id,name', 'embedding=is.null&is_active=eq.true');
console.log(`Embedding ${vendors.length} vendors…`);
for (const v of vendors) {
  try {
    await embed('vendors', v.id);
    console.log(`  ✓ ${v.name}`);
  } catch (e) {
    console.error(`  ✗ ${v.name}: ${e.message}`);
  }
}

const items = await fetchAll('menu_items', 'id,name', 'embedding=is.null&available=eq.true');
console.log(`\nEmbedding ${items.length} menu items…`);
for (const item of items) {
  try {
    await embed('menu_items', item.id);
    console.log(`  ✓ ${item.name}`);
  } catch (e) {
    console.error(`  ✗ ${item.name}: ${e.message}`);
  }
}

console.log('\nDone.');
