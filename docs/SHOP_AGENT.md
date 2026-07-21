# Shop Agent — Conversational Assistant over Shopify Storefront MCP

A customer-facing chat assistant on the Local Grindz landing page that answers shop
questions using the store's own live data. No Admin tokens, no scraped content.

## Architecture

```
ShopAgent.tsx (chat widget, Landing page)
        │  supabase.functions.invoke('shop-agent')
        ▼
supabase/functions/shop-agent/index.ts       ← ANTHROPIC_API_KEY stays server-side
        │  Claude tool loop (model: claude-sonnet-5)
        ▼
Shopify Storefront MCP (public, no auth)
  https://rastarooster.com/api/mcp           ← cart tools + policies/FAQ tool
  https://rastarooster.com/api/ucp/mcp       ← product search/lookup tools
```

- Tool lists are discovered at runtime (`tools/list`) from both endpoints and merged;
  each tool call is routed back to the endpoint that declared it.
- The FAQ/policy tool is fed by the **Shopify Knowledge Base app** — answers written
  there are what this agent (and any other AI agent connected to the store) will say.
- Cart continuity: the function extracts the Shopify cart GID from tool results and
  returns it; the widget stores it client-side and passes it back on later turns.
- Conversation state lives in the browser; the function is stateless.

## Deploy

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# optional overrides:
# supabase secrets set SHOP_DOMAIN=rastarooster.com ANTHROPIC_MODEL=claude-sonnet-5
supabase functions deploy shop-agent --no-verify-jwt
```

## Smoke test (run from any machine, not the CI sandbox)

```bash
# 1. Storefront MCP reachable?
curl -s -X POST https://rastarooster.com/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | head -c 800

# 2. Agent end-to-end (after deploy):
curl -s -X POST "https://pqzygehnnojdttmqadrz.supabase.co/functions/v1/shop-agent" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What botanical prints do you sell?"}]}'
```

Expected: a reply naming real products from the live catalog.

## Knowledge Base FAQs to enter (Shopify admin → Knowledge Base app)

These feed the agent's policy tool. Suggested first set — verify each before saving:

1. **How are digital prints delivered?** Digital prints are delivered automatically by
   email within minutes of purchase via our download partner (Sky Pilot). Nothing is
   shipped. If the email doesn't arrive, check spam or contact us and we'll resend it.
2. **Can I re-download a print I bought?** Yes — use the download link in your delivery
   email. If it has expired or you've lost it, contact us and we'll resend access.
3. **Do digital prints have shipping charges?** No. Digital downloads never incur
   shipping. Physical goods (apparel, baked goods, fresh flowers) ship or deliver
   separately per their product pages.
4. **What are the Ohana Bloom subscriptions?** Weekly fresh protea deliveries from our
   Puna farm in three sizes (Counter $42, Home $48, Statement $88), for homes, florists,
   and hotels on Hawaiʻi Island.
5. **What's your return policy on digital products?** *(Owner to confirm policy before
   entering — current practice: refunds at store discretion; digital goods can't be
   "returned" once downloaded.)*
6. **Apparel sizing** *(Owner: enter the size chart used for the Keiki Aipohaku tee.)*

## Sentinel notes (before enabling for customers)

- [ ] Deploy function + secrets; run both smoke tests
- [ ] Ask 5 real questions (prints, flowers, shipping, sizing, nonsense) — verify no
      invented products or policies
- [ ] Confirm Knowledge Base FAQs above are entered and the policy tool returns them
- [ ] Verify the widget on mobile (panel fits, keyboard doesn't cover input)
- [ ] Rollback: remove `<ShopAgent />` from `Landing.tsx` (single line) — the function
      can stay deployed harmlessly
- Cost note: each customer turn = 1–3 Claude calls. `claude-sonnet-5` default; set
  `ANTHROPIC_MODEL=claude-haiku-4-5-20251001` to cut cost if volume grows.
