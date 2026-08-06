import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shop — Merch",
  description: "Black Rock Cafe merch — coffee mugs, t-shirts, hats, and gift certificates.",
};

const PRODUCTS = [
  { name: "Black Rock Coffee Mug", price: 16, blurb: "Ceramic, holds a proper refill." },
  { name: "Black Rock Cafe T-Shirt", price: 24, blurb: "Soft cotton, local-made print." },
  { name: "Black Rock Trucker Hat", price: 22, blurb: "Adjustable snapback." },
];

/**
 * MOCK — no real store connected yet. INTEGRATION POINT: this codebase's
 * sibling project (Local Grindz / TOPP, one level up) already has a working
 * Shopify checkout pattern (`rastarooster.com/cart/{variantId}:1`) — mirror
 * that once real Black Rock Cafe merch products exist in Shopify. Never
 * mark items as purchasable until they're really live.
 */
export default function ShopPage() {
  return (
    <div className="container-cafe py-16">
      <h1 className="section-heading">Shop</h1>
      <p className="prose-cafe mt-3 max-w-2xl">
        Merch is coming soon. Want something sooner? Send a{" "}
        <Link href="/gift-cards" className="text-sunrise-300 underline focus-ring rounded">digital gift card</Link> instead.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {PRODUCTS.map((p) => (
          <div key={p.name} className="card-surface flex flex-col p-5">
            <div className="mb-4 flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-ohia-800/40 to-lava-900/40 text-4xl">
              🌋
            </div>
            <p className="font-semibold text-white">{p.name}</p>
            <p className="prose-cafe mt-1 flex-1 text-sm">{p.blurb}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-semibold text-sunrise-300">${p.price}</span>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-stone-400">Coming Soon</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
