/**
 * search — semantic search over vendors and menu items.
 *
 * POST { query: string, limit?: number }
 * Returns { vendors: VendorResult[], items: ItemResult[], mode: 'vector' | 'fts' }
 *
 * When OPENAI_API_KEY is set, uses vector similarity (pgvector).
 * Falls back to Postgres full-text search (websearch_to_tsquery) otherwise.
 *
 * Deploy: supabase functions deploy search --no-verify-jwt
 */

import { createClient } from 'npm:@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getQueryEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const json = await res.json();
  return json.data[0].embedding as number[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body: { query: string; limit?: number };
  try { body = await req.json(); } catch { return new Response('Bad request', { status: 400 }); }

  const { query, limit = 6 } = body;
  if (!query?.trim()) {
    return new Response(JSON.stringify({ vendors: [], items: [], mode: 'empty' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Try vector search first; fall back to FTS
  if (OPENAI_KEY) {
    try {
      const embedding = await getQueryEmbedding(query.trim());
      const embStr = `[${embedding.join(',')}]`;

      const [vendorRes, itemRes] = await Promise.all([
        supabase.rpc('match_vendors', {
          query_embedding: embStr,
          match_count: limit,
          min_score: 0.35,
        }),
        supabase.rpc('match_menu_items', {
          query_embedding: embStr,
          match_count: limit,
          min_score: 0.35,
        }),
      ]);

      // If vector search returned results, return them
      if ((vendorRes.data?.length ?? 0) > 0 || (itemRes.data?.length ?? 0) > 0) {
        return new Response(
          JSON.stringify({ vendors: vendorRes.data ?? [], items: itemRes.data ?? [], mode: 'vector' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      // Fall through to FTS if no vector results (embeddings not yet generated)
    } catch {
      // Fall through to FTS on OpenAI errors
    }
  }

  // Full-text search fallback
  const [vendorRes, itemRes] = await Promise.all([
    supabase.rpc('search_vendors_fts', { query: query.trim(), match_count: limit }),
    supabase.rpc('search_menu_items_fts', { query: query.trim(), match_count: limit }),
  ]);

  return new Response(
    JSON.stringify({ vendors: vendorRes.data ?? [], items: itemRes.data ?? [], mode: 'fts' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
