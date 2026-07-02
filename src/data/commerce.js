/**
 * commerce.js — Local Grindz commerce data model
 *
 * All Shopify fields (shopifyProductHandle, shopifyVariantId, checkoutUrl)
 * start as null. Fill them in after creating products in Shopify.
 * Status "coming_soon" triggers the fallback CTA state in CTAButton.
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

  // ── Digital Prints ─────────────────────────────────────────────────────
  {
    id: 'print-anthurium-01',
    title: 'Anthurium Study — Big Island Botanical Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 12.00,
    description: 'High-resolution 8×10 digital download. Anthurium native to the Puna rain forest. Print at home or at a local print shop.',
    image: null,
    tags: ['botanical', 'anthurium', 'digital', 'hawaii', 'art', 'puna'],
    shopifyProductHandle: 'botanical-print-anthurium',
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'print-ohia-01',
    title: 'ʻŌhiʻa Lehua — Big Island Botanical Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 12.00,
    description: 'Digital illustration of the sacred ʻōhiʻa lehua blossom, Hawaiʻi Island's iconic flower.',
    image: null,
    tags: ['botanical', 'ohia', 'lehua', 'digital', 'hawaii', 'art'],
    shopifyProductHandle: 'botanical-print-ohia-lehua',
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'print-heliconia-01',
    title: 'Heliconia Archive — Big Island Botanical Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 14.00,
    description: 'Archival-quality illustration of Big Island heliconia varieties. Ships as 11×14 digital file.',
    image: null,
    tags: ['botanical', 'heliconia', 'digital', 'hawaii', 'art', 'archive'],
    shopifyProductHandle: 'botanical-print-heliconia',
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },

  // ── Memberships ─────────────────────────────────────────────────────────
  {
    id: 'membership-topp-monthly',
    title: 'TOPP Community Membership — Monthly',
    type: PRODUCT_TYPES.MEMBERSHIP,
    price: 9.00,
    description: 'Support the Puna community archive. Members get early access to new prints, vendor spotlights, and community events.',
    image: null,
    tags: ['membership', 'topp', 'community', 'puna', 'monthly', 'recurring'],
    shopifyProductHandle: 'topp-membership-monthly',
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
    shopifyProductHandle: 'topp-membership-annual',
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
    shopifyProductHandle: 'vendor-pro-listing',
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },

  // ── Merch ───────────────────────────────────────────────────────────────
  {
    id: 'merch-tee-grindz-01',
    title: 'Local Grindz Tee — Volcanic Black',
    type: PRODUCT_TYPES.MERCH,
    price: 34.00,
    description: 'Heavyweight 100% cotton tee with the Local Grindz mark in volcanic red. Sizes XS–3XL.',
    image: null,
    tags: ['merch', 'tshirt', 'apparel', 'local-grindz', 'hawaii'],
    shopifyProductHandle: 'local-grindz-tee-black',
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'merch-sticker-pack-01',
    title: 'Local Grindz Sticker Pack — 5-pack',
    type: PRODUCT_TYPES.MERCH,
    price: 8.00,
    description: 'Five weatherproof vinyl stickers. Mix of vendor logos, Local Grindz mark, and Big Island icons.',
    image: null,
    tags: ['merch', 'stickers', 'vinyl', 'local-grindz', 'hawaii'],
    shopifyProductHandle: 'local-grindz-sticker-pack',
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },

  // ── Grower Resources ────────────────────────────────────────────────────
  {
    id: 'grower-guide-anthurium',
    title: 'Anthurium Grower Guide — Big Island Edition',
    type: PRODUCT_TYPES.GROWER_RESOURCE,
    price: 18.00,
    description: 'PDF guide covering propagation, soil, pest management, and cut-flower post-harvest for Puna growers.',
    image: null,
    tags: ['grower', 'guide', 'anthurium', 'agriculture', 'puna', 'digital'],
    shopifyProductHandle: 'anthurium-grower-guide',
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
    shopifyProductHandle: 'tropical-foliage-guide',
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

  // ── Florist / Hotel Inventory ───────────────────────────────────────────
  {
    id: 'florist-anthurium-case',
    title: 'Anthurium Case — Wholesale (25 stems)',
    type: PRODUCT_TYPES.FLORIST_HOTEL,
    price: 85.00,
    description: 'Wholesale case of 25 Puna-grown anthurium stems. Available for florists and hotel accounts. Minimum 2-day lead time.',
    image: null,
    tags: ['wholesale', 'anthurium', 'florist', 'hotel', 'flowers', 'puna'],
    shopifyProductHandle: 'anthurium-wholesale-case',
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'florist-tropical-mix-case',
    title: 'Tropical Mixed Stems — Wholesale Box',
    type: PRODUCT_TYPES.FLORIST_HOTEL,
    price: 110.00,
    description: 'Mixed tropical stems including heliconia, ginger, and bird-of-paradise. Ideal for hotel lobby arrangements.',
    image: null,
    tags: ['wholesale', 'tropical', 'florist', 'hotel', 'flowers', 'puna'],
    shopifyProductHandle: 'tropical-stems-wholesale',
    shopifyVariantId: null,
    checkoutUrl: null,
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
