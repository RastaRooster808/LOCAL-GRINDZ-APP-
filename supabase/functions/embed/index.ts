/**
 * embed — generates an OpenAI embedding for a vendor or menu_item and stores it.
 *
 * POST { table: 'vendors' | 'menu_items', id: string }
 *
 * Required secret:  OPENAI_API_KEY
 * Deploy: supabase functions deploy embed --no-verify-jwt
 *
 * Called automatically from the VendorDashboard when the vendor saves
 * their profile. Also callable from the backfill script:
 *   scripts/backfill-embeddings.mjs
 */

import { createClient } from 'npm:@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');

async function getEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const json = await res.json();
  return json.data[0].embedding as number[];
}

function buildVendorText(v: Record<string, unknown>): string {
  return [v.name, v.cuisine_type, v.description, v.neighborhood]
    .filter(Boolean).join('. ');
}

function buildMenuItemText(
  item: Record<string, unknown>,
  vendor: Record<string, unknown>,
): string {
  return [
    item.name,
    item.description,
    `Category: ${item.category}`,
    `At ${vendor.name}`,
    vendor.cuisine_type ? `Cuisine: ${vendor.cuisine_type}` : null,
  ].filter(Boolean).join('. ');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  if (!OPENAI_KEY) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
      status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { table: string; id: string };
  try { body = await req.json(); } catch { return new Response('Bad request', { status: 400 }); }

  const { table, id } = body;
  if (!['vendors', 'menu_items'].includes(table) || !id) {
    return new Response('Invalid params', { status: 400 });
  }

  let text: string;

  if (table === 'vendors') {
    const { data, error } = await supabase.from('vendors')
      .select('name, cuisine_type, description, neighborhood')
      .eq('id', id).single();
    if (error || !data) return new Response('Not found', { status: 404 });
    text = buildVendorText(data as Record<string, unknown>);
  } else {
    const { data, error } = await supabase.from('menu_items')
      .select('name, description, category, vendors(name, cuisine_type)')
      .eq('id', id).single();
    if (error || !data) return new Response('Not found', { status: 404 });
    const item = data as Record<string, unknown>;
    const vendor = (item.vendors as Record<string, unknown>) ?? {};
    text = buildMenuItemText(item, vendor);
  }

  const embedding = await getEmbedding(text);

  const { error: updateError } = await supabase.from(table)
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, table, id, dims: embedding.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
