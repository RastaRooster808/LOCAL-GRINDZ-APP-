/**
 * shop-agent — conversational shop assistant over Shopify Storefront MCP.
 *
 * POST { messages: [{ role: 'user' | 'assistant', content: string }], cartId?: string }
 * Returns { reply: string, cartId?: string }
 *
 * Tool calls are proxied to the store's public Storefront MCP endpoints:
 *   https://{SHOP_DOMAIN}/api/mcp      — cart + policies/FAQ tools
 *   https://{SHOP_DOMAIN}/api/ucp/mcp  — product search/lookup tools
 * Tool lists are discovered at runtime and merged; whichever endpoint declared
 * a tool receives its calls. FAQ answers come from the store's Knowledge Base app.
 *
 * Secrets: ANTHROPIC_API_KEY (required), SHOP_DOMAIN, ANTHROPIC_MODEL.
 * Deploy: supabase functions deploy shop-agent --no-verify-jwt
 */

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SHOP_DOMAIN = Deno.env.get('SHOP_DOMAIN') ?? 'rastarooster.com';
const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5';

const MCP_ENDPOINTS = [
  `https://${SHOP_DOMAIN}/api/mcp`,
  `https://${SHOP_DOMAIN}/api/ucp/mcp`,
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are the shop assistant for Rasta Rooster (rastarooster.com) — Big Island
Hawaiian apparel, KaRas bake stand goods, and the TOPP botanical collection: digital protea
photography prints, Ohana Bloom weekly fresh-flower subscriptions, and grower resources,
all from a working protea farm on Puna lava.

Ground rules:
- Use the catalog tools to find real products before recommending anything; never invent
  products, prices, or availability.
- Use the policies/FAQ tool for shipping, returns, and delivery questions; if it has no
  answer, say so and suggest emailing the store rather than guessing.
- Digital prints are downloads delivered by email after purchase — no shipping.
- Keep replies short and warm. One question at a time. Include product links when you
  reference specific products.
- When a shopper is ready to buy, use the cart tools and share the checkout link.`;

interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

// endpoint index per tool name, cached across warm invocations
let toolCache: { tools: McpTool[]; owners: Record<string, string> } | null = null;

async function mcpCall(endpoint: string, method: string, params?: unknown) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }),
  });
  if (!res.ok) throw new Error(`MCP ${endpoint} ${method}: HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`MCP ${endpoint} ${method}: ${json.error.message}`);
  return json.result;
}

async function discoverTools() {
  if (toolCache) return toolCache;
  const tools: McpTool[] = [];
  const owners: Record<string, string> = {};
  for (const endpoint of MCP_ENDPOINTS) {
    try {
      const result = await mcpCall(endpoint, 'tools/list');
      for (const t of result?.tools ?? []) {
        if (!owners[t.name]) {
          owners[t.name] = endpoint;
          tools.push(t);
        }
      }
    } catch {
      // endpoint unavailable — continue with whatever the other one offers
    }
  }
  if (tools.length > 0) toolCache = { tools, owners };
  return { tools, owners };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({ error: 'Agent not configured' }), {
      status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { messages: { role: string; content: string }[]; cartId?: string };
  try { body = await req.json(); } catch {
    return new Response('Bad request', { status: 400, headers: corsHeaders });
  }
  const history = (body.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content?.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content }));
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return new Response('Bad request: last message must be from user', {
      status: 400, headers: corsHeaders,
    });
  }

  const { tools, owners } = await discoverTools();
  const anthropicTools = tools.map((t) => ({
    name: t.name,
    description: t.description ?? '',
    input_schema: t.inputSchema ?? { type: 'object', properties: {} },
  }));

  let system = SYSTEM_PROMPT;
  if (body.cartId) system += `\n\nThe shopper has an existing cart: ${body.cartId}. Use it for cart operations.`;

  // deno-lint-ignore no-explicit-any
  const messages: any[] = [...history];
  let cartId = body.cartId;
  let reply = '';

  for (let round = 0; round < 6; round++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages,
        ...(anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error('anthropic error', res.status, detail);
      return new Response(JSON.stringify({ error: 'Agent temporarily unavailable' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = await res.json();

    reply = data.content
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('\n');

    if (data.stop_reason !== 'tool_use') break;

    messages.push({ role: 'assistant', content: data.content });
    const toolResults = [];
    for (const block of data.content) {
      if (block.type !== 'tool_use') continue;
      let resultText: string;
      try {
        const result = await mcpCall(owners[block.name], 'tools/call', {
          name: block.name,
          arguments: block.input,
        });
        resultText = JSON.stringify(result?.content ?? result).slice(0, 20000);
        const cartMatch = resultText.match(/gid:\/\/shopify\/Cart\/[A-Za-z0-9?=_-]+/);
        if (cartMatch) cartId = cartMatch[0];
      } catch (err) {
        resultText = `Tool error: ${err instanceof Error ? err.message : 'failed'}`;
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: resultText });
    }
    messages.push({ role: 'user', content: toolResults });
  }

  return new Response(JSON.stringify({ reply, cartId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
