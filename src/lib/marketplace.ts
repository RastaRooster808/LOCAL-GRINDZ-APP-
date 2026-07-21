/**
 * marketplace.ts — Local Grindz marketplace categories + featured vendors.
 *
 * Local Grindz is a community marketplace for local restaurants, food trucks,
 * bakeries, wellness makers, fruit vendors, farmers, florists, and artists.
 * Featured vendors get premium placement inside their category — they never
 * replace the category.
 *
 * Categories filter the existing vendors table by cuisine_type (ilike matches);
 * no schema changes. Featured vendor entries here are presentation-layer only.
 */

export interface MarketplaceCategory {
  slug: string;
  label: string;
  icon: string;
  /** cuisine_type ilike patterns; empty = no cuisine filter (All) */
  matches: string[];
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { slug: 'all', label: 'All', icon: '🌈', matches: [] },
  {
    slug: 'foodtrucks', label: 'Food Trucks', icon: '🚚',
    matches: ['burger', 'plate', 'seafood', 'vegan', 'coffee', 'dessert', 'bbq', 'restaurant', 'food', 'truck', 'smash'],
  },
  {
    slug: 'bakery', label: 'Bakery', icon: '🍞',
    matches: ['bakery', 'baked', 'bread', 'pastry', 'sourdough'],
  },
  {
    slug: 'wellness', label: 'Wellness', icon: '🌿',
    matches: ['wellness', 'shot', 'tonic', 'juice', 'kava', 'elixir'],
  },
  {
    slug: 'flowers', label: 'Flowers', icon: '🌺',
    matches: ['florist', 'flower', 'protea', 'floral', 'lei'],
  },
  {
    slug: 'fruit', label: 'Fruit', icon: '🍍',
    matches: ['fruit', 'produce'],
  },
  {
    slug: 'markets', label: 'Markets', icon: '🧺',
    matches: ['market', 'farm', 'grocery', 'general'],
  },
  {
    slug: 'makers', label: 'Artists & Makers', icon: '🎨',
    matches: ['artist', 'maker', 'craft', 'art', 'jewelry'],
  },
];

export function getCategory(slug: string | null): MarketplaceCategory {
  // 'restaurants' kept as an alias for older links
  if (slug === 'restaurants') slug = 'foodtrucks';
  return MARKETPLACE_CATEGORIES.find(c => c.slug === slug) ?? MARKETPLACE_CATEGORIES[0];
}

/** Featured vendors — premium placement within their category. Presentation only. */
export interface FeaturedVendor {
  id: string;
  name: string;
  categorySlug: string;
  categoryLabel: string;
  tagline: string;
  description: string;
  badges: string[];
  /** CDN image URLs; when absent, the themed gradient + emoji render instead */
  logoUrl?: string;
  bannerUrl?: string;
  emoji: string;
  /** CSS gradient for themed banner when no bannerUrl */
  theme: { banner: string; accent: string };
  /** external shop link (opens new tab) */
  shopUrl?: string;
  /** internal storefront slug — renders a View Menu button */
  menuSlug?: string;
  shopLabel: string;
  /** display rating; 'New' until real reviews accumulate */
  rating: string;
}

export const FEATURED_VENDORS: FeaturedVendor[] = [
  {
    id: 'alas-kitchen',
    name: "Ala's Kitchen — Get Smashed",
    categorySlug: 'foodtrucks',
    categoryLabel: 'Featured Food Truck',
    tagline: 'Big Island Smash Burgers, Done Right',
    description:
      'Hand-smashed patties, local beef, island-style toppings. Find the truck, order ahead, get smashed.',
    badges: ['Order Ahead', 'Daily Specials'],
    emoji: '🍔',
    theme: { banner: 'linear-gradient(135deg, #2b1d16 0%, #6e2b1e 45%, #E63946 100%)', accent: '#E63946' },
    menuSlug: 'alas-kitchen',
    shopLabel: 'View Menu',
    rating: 'New',
  },
  {
    id: 'karas-freshly-baked',
    name: 'KaRas Freshly Baked',
    categorySlug: 'bakery',
    categoryLabel: 'Featured Bakery',
    tagline: "Today's Fresh Bake, From the KaRas Stand",
    description:
      'Warm artisan bakery on the lava: fresh sourdough, French bread, cookies, brownies, cinnamon rolls, banana bread, and seasonal specials. Baked in small batches — when it sells out, it sells out.',
    badges: ["Today's Fresh Bake", 'Preorder for Pickup', 'Small Batch'],
    emoji: '🍞',
    theme: { banner: 'linear-gradient(135deg, #f6ecd9 0%, #e8c98a 55%, #3a2f28 100%)', accent: '#b98a2e' },
    menuSlug: 'karas-freshly-baked',
    shopLabel: 'View Menu',
    rating: 'New',
  },
  {
    id: 'golden-shot',
    name: 'Golden Shot',
    categorySlug: 'wellness',
    categoryLabel: 'Featured Wellness',
    tagline: 'Premium Island Wellness Shots',
    description:
      'Turmeric, ginger, and island botanicals pressed into daily wellness shots. Singles, bundles, and a daily cleanse — subscription coming soon.',
    badges: ['Fresh Pressed', 'Bundle Pricing', 'Subscriptions Soon'],
    emoji: '🌿',
    theme: { banner: 'linear-gradient(135deg, #d9a514 0%, #e8b830 40%, #2d6a4f 100%)', accent: '#b98a2e' },
    menuSlug: 'golden-shot',
    shopLabel: 'View Menu',
    rating: 'New',
  },
  {
    id: 'topp',
    name: 'TOPP',
    categorySlug: 'flowers',
    categoryLabel: 'Featured Florist',
    tagline: 'Premium Hawaiian Protea Delivery',
    description:
      'The Original Protea Project — king protea, pincushions, and island botanicals grown on Puna lava. Weekly fresh arrangements for homes, florists, and hotels, plus a digital print archive.',
    badges: ['Delivery Available', 'Protea Delivery', 'Premium Arrangements'],
    logoUrl: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/King-Protea_close_up.jpg?v=1783653584',
    bannerUrl: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/King-Protea_Crimson-Dome-Macro.jpg?v=1784250577',
    emoji: '🌺',
    theme: { banner: 'linear-gradient(135deg, #2c241f 0%, #8a4a54 60%, #dc94a8 100%)', accent: '#E63946' },
    shopUrl: 'https://rastarooster.com/collections/wholesale-flowers',
    shopLabel: 'Shop TOPP',
    rating: 'New',
  },
];

export function getFeaturedForCategory(slug: string): FeaturedVendor[] {
  if (slug === 'featured') return FEATURED_VENDORS;
  if (slug === 'restaurants') slug = 'foodtrucks';
  return FEATURED_VENDORS.filter(v => v.categorySlug === slug);
}

/** Rotating homepage promotions — each links into a featured vendor. */
export interface Promo {
  id: string;
  label: string;
  text: string;
  emoji: string;
  to: string;
  accent: string;
}

export const HOME_PROMOS: Promo[] = [
  {
    id: 'fresh-bread',
    label: 'Fresh Bread Today',
    text: 'KaRas sourdough comes out of the oven this morning — preorder for pickup before it sells out.',
    emoji: '🍞',
    to: '/vendors/karas-freshly-baked',
    accent: '#b98a2e',
  },
  {
    id: 'golden-shot-special',
    label: 'Golden Shot Special',
    text: 'Wellness bundle pricing on turmeric-ginger shots — fresh pressed on island.',
    emoji: '🌿',
    to: '/vendors/golden-shot',
    accent: '#2d6a4f',
  },
  {
    id: 'burger-of-the-day',
    label: 'Get Smashed Burger of the Day',
    text: "Ala's Kitchen drops a new smash special daily — see today's build and order ahead.",
    emoji: '🍔',
    to: '/vendors/alas-kitchen',
    accent: '#E63946',
  },
];
