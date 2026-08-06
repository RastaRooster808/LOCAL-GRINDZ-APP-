"use client";

import { useMemo, useState } from "react";
import { menu, ALLERGEN_LABELS } from "@/data/menu";
import type { Allergen } from "@/data/types";

const ALL_ALLERGENS = Object.keys(ALLERGEN_LABELS) as Allergen[];

export default function MenuFilterableList() {
  const [excluded, setExcluded] = useState<Set<Allergen>>(new Set());
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [query, setQuery] = useState("");

  function toggleAllergen(a: Allergen) {
    setExcluded((prev) => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  }

  const filteredMenu = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (excluded.size > 0 && item.allergens.some((a) => excluded.has(a))) return false;
          if (vegetarianOnly && !item.diet.includes("vegetarian") && !item.diet.includes("vegetarian-option")) return false;
          if (q && !item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) return false;
          return true;
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [excluded, vegetarianOnly, query]);

  return (
    <div>
      <div className="card-surface sticky top-16 z-10 flex flex-col gap-4 p-5">
        <div>
          <label htmlFor="menu-search" className="mb-1 block text-sm font-medium text-stone-300">
            Search the menu
          </label>
          <input
            id="menu-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. burger, shrimp, gluten free…"
            className="focus-ring w-full rounded-full border border-white/15 bg-night-950 px-4 py-2 text-white placeholder:text-stone-500"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-300">Hide items containing:</legend>
          <div className="flex flex-wrap gap-2">
            {ALL_ALLERGENS.map((a) => {
              const active = excluded.has(a);
              return (
                <button
                  key={a}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleAllergen(a)}
                  className={`focus-ring rounded-full border px-3 py-1 text-sm transition ${
                    active
                      ? "border-lava-400 bg-lava-500/20 text-lava-200"
                      : "border-white/15 text-stone-300 hover:border-white/30"
                  }`}
                >
                  {ALLERGEN_LABELS[a]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex w-fit items-center gap-2 text-sm text-stone-300">
          <input
            type="checkbox"
            checked={vegetarianOnly}
            onChange={(e) => setVegetarianOnly(e.target.checked)}
            className="focus-ring h-4 w-4 rounded border-white/30 bg-night-950 text-ohia-500"
          />
          Vegetarian-friendly only
        </label>

        <p className="text-xs text-stone-500">
          Allergen tags are a best-effort read of the printed menu, not a
          medical guarantee — always confirm with your server.
        </p>
      </div>

      <div className="mt-10 space-y-14">
        {filteredMenu.length === 0 && (
          <p className="prose-cafe">No items match those filters right now — try clearing one.</p>
        )}
        {filteredMenu.map((category) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <h2 id={`cat-${category.id}`} className="font-display text-2xl font-semibold text-white">
              {category.name}
            </h2>
            {category.note && <p className="prose-cafe mt-1 max-w-2xl text-sm">{category.note}</p>}
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {category.items.map((item) => (
                <li key={item.id} className="card-surface p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="whitespace-nowrap font-semibold text-sunrise-300">
                      {item.priceLabel ?? `$${item.price.toFixed(2)}`}
                    </p>
                  </div>
                  {item.description && <p className="prose-cafe mt-1 text-sm">{item.description}</p>}
                  {item.allergens.length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-1 text-xs text-stone-500">
                      {item.allergens.map((a) => (
                        <span key={a} className="rounded-full border border-white/10 px-2 py-0.5">
                          {ALLERGEN_LABELS[a]}
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
