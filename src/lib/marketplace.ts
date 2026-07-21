/**
 * marketplace.ts — Local Grindz marketplace categories + featured vendors.
 *
 * Local Grindz is a community marketplace for local restaurants, food trucks,
 * fruit vendors, farmers, florists, and artists/makers. Featured vendors get
 * premium placement inside their category — they never replace the category.
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
    slug: 'restaurants', label: 'Restaurants', icon: '🍽',
    matches: ['burger', 'plate', 'seafood', 'vegan', 'coffee', 'dessert', 'bbq', 'bakery', 'restaurant', 'food'],
  },
  {
    slug: 'markets', label: 'Markets', icon: '🧺',
    matches: ['market', 'farm', 'grocery', 'general'],
  },
  {
    slug: 'fruit', label: 'Fruit', icon: '🍍',
    matches: ['fruit', 'produce', 'juice'],
  },
  {
    slug: 'flowers', label: 'Flowers', icon: '🌺',
    matches: ['florist', 'flower', 'protea', 'floral', 'lei'],
  },
  {
    slug: 'makers', label: 'Artists & Makers', icon: '🎨',
    matches: ['artist', 'maker', 'craft', 'art', 'jewelry'],
  },
];

export function getCategory(slug: string | null): MarketplaceCategory {
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
  logoUrl: string;
  bannerUrl: string;
  shopUrl: string;
  shopLabel: string;
}

export const FEATURED_VENDORS: FeaturedVendor[] = [
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
    shopUrl: 'https://rastarooster.com/collections/wholesale-flowers',
    shopLabel: 'Shop TOPP',
  },
];

export function getFeaturedForCategory(slug: string): FeaturedVendor[] {
  if (slug === 'featured') return FEATURED_VENDORS;
  return FEATURED_VENDORS.filter(v => v.categorySlug === slug);
}
