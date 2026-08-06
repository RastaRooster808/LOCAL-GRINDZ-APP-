import { menu } from "@/data/menu";
import { historyTimeline } from "@/data/history";
import { site } from "@/data/site";

/**
 * MOCK concierge logic — deterministic keyword matching so the UI is fully
 * functional offline/without an API key.
 *
 * Integration point for a real AI concierge:
 *   1. Replace `answerConcierge` with a call to a server route
 *      (e.g. `app/api/concierge/route.ts`) that calls an LLM with a system
 *      prompt built from `menu`, `historyTimeline`, and `site`.
 *   2. Keep this file's shape (`ConciergeAnswer`) so the client component
 *      doesn't need to change.
 *   3. Ground responses in the same structured data below so the model
 *      can't invent menu items, prices, or hours.
 */
export interface ConciergeAnswer {
  text: string;
  suggestedFollowUps: string[];
}

const FALLBACK: ConciergeAnswer = {
  text: `I'm the (demo) Black Rock Cafe concierge — I can answer questions about our menu, history, hours, and directions using mock logic for now. Try asking about a menu item, our story, or how to get here.`,
  suggestedFollowUps: ["What's on the menu?", "Tell me about your history", "What are your hours?", "How do I get there?"],
};

export function answerConcierge(question: string): ConciergeAnswer {
  const q = question.toLowerCase();

  if (/(hour|open|close|time)/.test(q)) {
    return {
      text: `Our hours: ${site.hours.map((h) => `${h.days} ${h.time}`).join(", ")}. (Placeholder hours — update src/data/site.ts with real hours.)`,
      suggestedFollowUps: ["What's on the menu?", "How do I get there?"],
    };
  }

  if (/(direction|address|located|location|where)/.test(q)) {
    return {
      text: `We're in ${site.town}, ${site.region}. Full address coming soon — see the Visit page for a map link. (Placeholder address — update src/data/site.ts.)`,
      suggestedFollowUps: ["Do you take reservations?", "Tell me about your history"],
    };
  }

  if (/(histor|story|pahoa|when.*(open|found|start))/.test(q)) {
    const founding = historyTimeline.find((e) => e.era === "cafe" && e.year === "1998");
    return {
      text: founding
        ? `${founding.description} Want the full timeline from ancient Puna forest to today? Check out our History page.`
        : `Black Rock Cafe opened in ${site.founded} in Pahoa.`,
      suggestedFollowUps: ["What's on the menu?", "What are your hours?"],
    };
  }

  if (/(vegetarian|vegan|gluten|allerg|dair|shellfish|nut)/.test(q)) {
    return {
      text: `We tag menu items for gluten, dairy, shellfish, fish, egg, soy, and pork on our Menu page — use the allergen filters there for the full, accurate list. Always let your server know about any allergy.`,
      suggestedFollowUps: ["Show me vegetarian options", "What's on the menu?"],
    };
  }

  const matchedItem = menu
    .flatMap((c) => c.items)
    .find((item) => item.name.toLowerCase().split(" ").some((word) => word.length > 3 && q.includes(word.toLowerCase())));

  if (matchedItem) {
    return {
      text: `${matchedItem.name} — ${matchedItem.description || "a Black Rock Cafe favorite."} ${
        matchedItem.priceLabel ?? `$${matchedItem.price.toFixed(2)}`
      }.`,
      suggestedFollowUps: ["What's on the menu?", "Any allergens I should know about?"],
    };
  }

  if (/(menu|food|eat|burger|loco|plate)/.test(q)) {
    return {
      text: `We've got burgers, plate lunches, pasta, pizza, subs, and local favorites like Loco Moco and Kalua Pork. Head to the Menu page to filter by allergen.`,
      suggestedFollowUps: ["What's your most popular burger?", "Any allergens I should know about?"],
    };
  }

  return FALLBACK;
}
