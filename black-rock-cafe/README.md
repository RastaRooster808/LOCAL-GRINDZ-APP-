# Black Rock Cafe — Pahoa, Hawaiʻi

A standalone Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS
site for Black Rock Cafe, a local restaurant in Pahoa, Hawaiʻi. This project
lives independently of the sibling Local Grindz / TOPP app one directory up
— different framework (Next.js vs Vite), different hosting target (Vercel
vs GitHub Pages), different business.

> Requested stack named "Next.js 16 / React 20" — those versions don't exist
> yet (current stable at time of writing: Next.js 15, React 19). Built on
> latest stable; bump when 16/20 actually ship.

## What's real vs. mocked

This first pass prioritizes a strong, fully-working foundation over shallow
coverage of every requested feature. Real & working:

- Full menu (transcribed from the physical menu, with prices) with search
  and allergen/vegetarian filtering — `src/data/menu.ts`,
  `src/components/MenuFilterableList.tsx`
- Interactive history timeline, ancient Puna → 1998 founding → today —
  transcribed from the restaurant's own historical placard —
  `src/data/history.ts`, `src/components/HistoryTimeline.tsx`
- Cinematic animated hero (CSS/Framer Motion lava flow + embers; no network
  weight) with a documented slot for a real drone video
- Working demo cart/order flow, reservation form, gift card purchase flow,
  digital punch card, birthday club signup, private-event request forms —
  all client-side and functional, but **not connected to any backend**
- AI concierge chat widget with real (deterministic, keyword-based) answers
  grounded in the actual menu/history/site data — no LLM call yet
- PWA basics: manifest, service worker with offline caching of `/` and
  `/menu`, installable
- SEO: per-page metadata, Restaurant JSON-LD, `sitemap.ts`, `robots.ts`
- Accessibility: skip link, visible focus rings, semantic landmarks, ARIA
  on the mobile nav / tab timeline / chat widget, `prefers-reduced-motion`
  respected
- Multi-language **foundation**: a `LanguageProvider` covering nav/footer/
  CTA strings in English, ʻŌlelo Hawaiʻi, and Spanish
  (`src/lib/i18n.tsx`) — not full page-body translation yet
- QR code generator (server-rendered SVG, no client JS) linking to `/menu`

Mocked / placeholder, with the integration point documented in a comment at
the top of each file:

- Google Reviews (`src/data/reviews.ts`) — swap for the Places API
- Instagram/Facebook/TikTok wall (`src/components/SocialWall.tsx`) — swap
  for the Instagram Graph API / TikTok Display API / FB Page Feed
- Community event calendar (`src/data/events.ts`) — swap for a CMS
  collection or Google Calendar embed
- Online ordering checkout, reservations, gift cards, private events forms —
  all show a "demo" confirmation instead of hitting a real POS/CRM/payment
  provider
- AI concierge — swap `answerConcierge` for a real LLM call via an
  `app/api/concierge/route.ts`, keeping the same `ConciergeAnswer` shape
- Merch shop — products are marked "Coming Soon"; no live checkout

**Not built in this pass** (flagged in the request but out of scope for a
first foundation): a real headless CMS (Sanity/Payload), SMS/email
marketing platform wiring, push notifications, voice ordering, a nutrition
calculator, smart waitlist prediction, automated review responses, and a
Three.js scene. Each is a substantial integration in its own right — happy
to build any of these next once you pick priorities and provide the
relevant API keys/accounts.

## Business details still needed

`src/data/site.ts` has clearly marked `TODO` placeholders for phone,
address, and hours — **do not launch with fabricated contact info.** Fill
these in with verified details.

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build (this is what CI/Vercel runs)
npm run typecheck
```

## Deploying

Built for Vercel (Edge Functions, Image Optimization, ISR all assume that
runtime). `vercel --prod` from this directory, or connect the repo/subpath
in the Vercel dashboard and set the project root to `black-rock-cafe/`.

## Adding the real hero video

Drop `pahoa-drone.mp4` (+ optionally a `.webm`) into `public/video/` and
uncomment the `<video>` element in `src/components/LavaHero.tsx`.
