/**
 * commerce.js — Local Grindz commerce data model
 *
 * Shopify store: rastarooster.com
 * Checkout URL format: https://rastarooster.com/cart/{variantId}:1
 *
 * Products in DRAFT status in Shopify keep status: 'coming_soon' here.
 * Flip to 'live' once the Shopify product is published ACTIVE.
 *
 * See docs/SHOPIFY_INTEGRATION.md for collection + tag requirements.
 */

export const PRODUCT_TYPES = {
  DIGITAL_PRINT:    'digital_print',
  MEMBERSHIP:       'membership',
  MERCH:            'merch',
  GROWER_RESOURCE:  'grower_resource',
  VENDOR_PRODUCT:   'vendor_product',
  FLORIST_HOTEL:    'florist_hotel',
};

export const PRODUCT_STATUS = {
  LIVE:        'live',
  COMING_SOON: 'coming_soon',
  DRAFT:       'draft',
  ARCHIVED:    'archived',
};

/** @type {CommerceItem[]} */
export const commerce = [

  // ── Digital Prints — TOPP Protea Photography ───────────────────────────
  // All DRAFT in Shopify → coming_soon. Publish in Shopify admin to go live.
  {
    id: 'print-king-protea-01',
    title: 'King Protea — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'High-resolution digital photograph of a King Protea (Protea cynaroides) in bloom, documented by the TOPP founding grower in Hawaiʻi.',
    image: null,
    tags: ['botanical', 'protea', 'king-protea', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'king-protea-digital-print',
    shopifyVariantId: '52639807406367',
    checkoutUrl: 'https://rastarooster.com/cart/52639807406367:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'print-pincushion-firework-01',
    title: 'Pincushion Firework — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Pincushion protea (Leucospermum) in full "firework" bloom, documented by the TOPP founding grower in Hawaiʻi.',
    image: null,
    tags: ['botanical', 'protea', 'pincushion', 'leucospermum', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'pincushion-firework-digital-print',
    shopifyVariantId: '52639807439135',
    checkoutUrl: 'https://rastarooster.com/cart/52639807439135:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'print-pink-mink-01',
    title: 'Pink Mink Protea — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Pink Mink protea (Protea neriifolia) opening, with its distinctive dark-fringed bract tips, documented by the TOPP founding grower in Hawaiʻi.',
    image: null,
    tags: ['botanical', 'protea', 'pink-mink', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'pink-mink-protea-digital-print',
    shopifyVariantId: '52639807537439',
    checkoutUrl: 'https://rastarooster.com/cart/52639807537439:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'print-protea-field-01',
    title: 'Protea Field, Hawaiʻi — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Digital landscape photograph of proteas flowering across a Hawaiian volcanic field under open sky.',
    image: null,
    tags: ['botanical', 'protea', 'landscape', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'protea-field-hawaiʻi-digital-print',
    shopifyVariantId: '52639807602975',
    checkoutUrl: 'https://rastarooster.com/cart/52639807602975:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'print-conebush-lava-01',
    title: 'Conebush on Lava — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Red-foliage conebush (Leucadendron) growing on black volcanic lava, documented by the TOPP founding grower.',
    image: null,
    tags: ['botanical', 'conebush', 'leucadendron', 'lava', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'conebush-on-lava-digital-print',
    shopifyVariantId: '52639808651551',
    checkoutUrl: 'https://rastarooster.com/cart/52639808651551:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },

  // ── Memberships ─────────────────────────────────────────────────────────
  // Shopify products not yet created — coming soon.
  {
    id: 'membership-topp-monthly',
    title: 'TOPP Community Membership — Monthly',
    type: PRODUCT_TYPES.MEMBERSHIP,
    price: 9.00,
    description: 'Support the Puna community archive. Members get early access to new prints, vendor spotlights, and community events.',
    image: null,
    tags: ['membership', 'topp', 'community', 'puna', 'monthly', 'recurring'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'membership-topp-annual',
    title: 'TOPP Community Membership — Annual',
    type: PRODUCT_TYPES.MEMBERSHIP,
    price: 88.00,
    description: 'Best value. Includes all monthly benefits plus a printed botanical art card mailed each quarter.',
    image: null,
    tags: ['membership', 'topp', 'community', 'puna', 'annual', 'recurring'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'membership-vendor-pro',
    title: 'Vendor Pro Listing — Monthly',
    type: PRODUCT_TYPES.MEMBERSHIP,
    price: 19.00,
    description: 'Spotlight placement, analytics dashboard, verified badge, and priority in search results.',
    image: null,
    tags: ['membership', 'vendor', 'pro', 'listing', 'monthly', 'recurring'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },

  // ── Merch ───────────────────────────────────────────────────────────────
  {
    id: 'merch-tee-protea-01',
    title: 'Keiki Aipohaku ʻO Ka ʻĀina — Hawaiian Sunset Protea Tee',
    type: PRODUCT_TYPES.MERCH,
    price: 33.99,
    description: 'Garment-dyed unisex tee with protea sunset chest art. Island-born calm in heavyweight cotton. Sizes S–3XL.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/9648178113528341178_2048.jpg?v=1781299372',
    tags: ['merch', 'tshirt', 'apparel', 'protea', 'hawaii', 'sunset', 'garment-dyed'],
    shopifyProductHandle: 'keiki-aipohaku-ʻo-ka-ʻaina-t-shirt-hawaiian-sunset-protea-design',
    shopifyVariantId: '52613576524063',
    checkoutUrl: 'https://rastarooster.com/cart/52613576524063:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'merch-protea-mug-01',
    title: 'Protea Ceramic Mug — TOPP',
    type: PRODUCT_TYPES.MERCH,
    price: 16.00,
    description: 'Ceramic mug featuring original TOPP protea photography. Made to order.',
    image: null,
    tags: ['merch', 'mug', 'drinkware', 'protea', 'topp', 'hawaii'],
    shopifyProductHandle: 'protea-ceramic-mug',
    shopifyVariantId: '52639808192799',
    checkoutUrl: 'https://rastarooster.com/cart/52639808192799:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },

  // ── Grower Resources ────────────────────────────────────────────────────
  // Shopify Grower Resources collection exists (0 products) — coming soon.
  {
    id: 'grower-guide-protea-01',
    title: 'Protea Grower Guide — Puna, Hawaiʻi',
    type: PRODUCT_TYPES.GROWER_RESOURCE,
    price: 18.00,
    description: 'PDF guide covering propagation, soil preparation, pest management, and cut-flower post-harvest for Puna protea growers.',
    image: null,
    tags: ['grower', 'guide', 'protea', 'agriculture', 'puna', 'digital', 'topp'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'grower-guide-tropical-foliage',
    title: 'Tropical Foliage Farming Guide — Hawaiʻi',
    type: PRODUCT_TYPES.GROWER_RESOURCE,
    price: 22.00,
    description: 'Comprehensive digital guide for heliconia, ginger, and bird-of-paradise production on Hawaiʻi Island.',
    image: null,
    tags: ['grower', 'guide', 'tropical', 'foliage', 'agriculture', 'digital'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },

  // ── Vendor Products ─────────────────────────────────────────────────────
  {
    id: 'vendor-product-placeholder-01',
    title: '[Vendor Name] — Signature Item',
    type: PRODUCT_TYPES.VENDOR_PRODUCT,
    price: 0,
    description: 'Placeholder for vendor-specific products added via Shopify after vendor onboarding.',
    image: null,
    tags: ['vendor', 'product', 'placeholder'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.DRAFT,
  },

  // ── Florist / Hotel — Ohana Bloom Weekly Subscriptions ─────────────────
  // TOPP weekly protea deliveries. DRAFT in Shopify → coming_soon.
  {
    id: 'florist-ohana-bloom-counter',
    title: 'Ohana Bloom — Counter (Weekly)',
    type: PRODUCT_TYPES.FLORIST_HOTEL,
    price: 42.00,
    description: 'Weekly hand-tied bunch of 5–7 fresh island-grown protea stems. Sized for a café counter, reception desk, or small table.',
    image: null,
    tags: ['wholesale', 'protea', 'florist', 'weekly', 'subscription', 'topp', 'ohana-bloom'],
    shopifyProductHandle: 'ohana-bloom-counter-weekly',
    shopifyVariantId: '52649043231007',
    checkoutUrl: 'https://rastarooster.com/cart/52649043231007:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'florist-ohana-bloom-home',
    title: 'Ohana Bloom — Ohana Home (Weekly)',
    type: PRODUCT_TYPES.FLORIST_HOTEL,
    price: 48.00,
    description: 'Home-sized weekly box of 7–10 fresh protea stems and foliage. Drop straight into a vase. Includes printed care guide.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/att.Ml0-muat5C-dXiS9Sp897hWREn7hks1tCJE98Swn8D8.jpg?v=1782893088',
    tags: ['wholesale', 'protea', 'florist', 'home', 'weekly', 'subscription', 'topp', 'ohana-bloom'],
    shopifyProductHandle: 'ohana-bloom-ohana-home-weekly',
    shopifyVariantId: '52649043296543',
    checkoutUrl: 'https://rastarooster.com/cart/52649043296543:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'florist-ohana-bloom-statement',
    title: 'Ohana Bloom — Statement (Weekly)',
    type: PRODUCT_TYPES.FLORIST_HOTEL,
    price: 88.00,
    description: '12–15 stems featuring a king protea with pincushions and conebush foliage — for hotel lobbies, restaurants, and salons.',
    image: null,
    tags: ['wholesale', 'protea', 'hotel', 'lobby', 'weekly', 'subscription', 'topp', 'ohana-bloom'],
    shopifyProductHandle: 'ohana-bloom-statement-weekly',
    shopifyVariantId: '52649043263775',
    checkoutUrl: 'https://rastarooster.com/cart/52649043263775:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },
];

/**
 * @param {string} type - one of PRODUCT_TYPES values
 * @returns {CommerceItem[]}
 */
export function getByType(type) {
  return commerce.filter(item => item.type === type);
}

/**
 * @param {string} id
 * @returns {CommerceItem | undefined}
 */
export function getById(id) {
  return commerce.find(item => item.id === id);
}

/**
 * @returns {CommerceItem[]} only items with status === 'live'
 */
export function getLiveItems() {
  return commerce.filter(item => item.status === PRODUCT_STATUS.LIVE);
}

/**
 * @typedef {Object} CommerceItem
 * @property {string} id
 * @property {string} title
 * @property {string} type
 * @property {number} price
 * @property {string} description
 * @property {string|null} image
 * @property {string[]} tags
 * @property {string|null} shopifyProductHandle
 * @property {string|null} shopifyVariantId
 * @property {string|null} checkoutUrl
 * @property {string} status
 */
