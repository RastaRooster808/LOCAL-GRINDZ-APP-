"use client";

import { useMemo, useState } from "react";
import { menu } from "@/data/menu";

interface CartLine {
  id: string;
  name: string;
  price: number;
  qty: number;
}

/**
 * Mock online ordering flow — a real cart and (fake) checkout so the UX is
 * fully demonstrable end to end. INTEGRATION POINT: replace `placeOrder`
 * with a call to a real ordering/POS provider (Toast, Square, ChowNow,
 * SpotOn) via a server route, and swap this local cart state for whatever
 * that provider's SDK expects.
 */
export default function OrderClient() {
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [placed, setPlaced] = useState(false);

  const lines = Object.values(cart);
  const total = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.qty, 0), [lines]);

  function addItem(id: string, name: string, price: number) {
    setCart((prev) => {
      const existing = prev[id];
      return { ...prev, [id]: { id, name, price, qty: (existing?.qty ?? 0) + 1 } };
    });
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      const qty = existing.qty + delta;
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = { ...existing, qty };
      return next;
    });
  }

  if (placed) {
    return (
      <div className="card-surface mx-auto max-w-lg p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-white">Order received! 🌋</h2>
        <p className="prose-cafe mt-3">
          This is a demo confirmation — no real order was sent. Wire this up
          to your ordering provider to go live.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-10">
        {menu.map((category) => (
          <section key={category.id}>
            <h2 className="font-display text-2xl font-semibold text-white">{category.name}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {category.items.map((item) => (
                <li key={item.id} className="card-surface flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-sm text-sunrise-300">{item.priceLabel ?? `$${item.price.toFixed(2)}`}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem(item.id, item.name, item.price)}
                    className="focus-ring rounded-full bg-lava-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-lava-400"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="card-surface h-fit p-5 lg:sticky lg:top-24" aria-label="Cart">
        <h2 className="font-display text-xl font-semibold text-white">Your Order</h2>
        {lines.length === 0 ? (
          <p className="prose-cafe mt-3 text-sm">Your cart is empty — add something tasty.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {lines.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-stone-200">{line.name}</span>
                <span className="flex items-center gap-2">
                  <button type="button" onClick={() => changeQty(line.id, -1)} aria-label={`Remove one ${line.name}`} className="focus-ring rounded border border-white/20 px-2">
                    −
                  </button>
                  {line.qty}
                  <button type="button" onClick={() => changeQty(line.id, 1)} aria-label={`Add one ${line.name}`} className="focus-ring rounded border border-white/20 px-2">
                    +
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 font-semibold text-white">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button
          type="button"
          disabled={lines.length === 0}
          onClick={() => setPlaced(true)}
          className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          Place Demo Order
        </button>
      </aside>
    </div>
  );
}
