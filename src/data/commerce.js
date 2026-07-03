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

  // ── Digital Prints — TOPP Protea Photography (11 prints) ──────────────
  // All 11 published ACTIVE in Shopify with Sky Pilot files attached.
  {
    id: 'king-protea-digital-print',
    title: 'King Protea — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'High-resolution digital photograph of a King Protea (Protea cynaroides) in bloom, documented by the TOPP founding grower in Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/IMG_4164.jpg?v=1783047259',
    tags: ['botanical', 'protea', 'king-protea', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'king-protea-digital-print',
    shopifyVariantId: '52639807406367',
    checkoutUrl: 'https://rastarooster.com/cart/52639807406367:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'pincushion-firework-digital-print',
    title: 'Pincushion Firework — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Pincushion protea (Leucospermum) in full "firework" bloom, documented by the TOPP founding grower in Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/att.0cQRGI1yejeC8PejXPaeB7_K0USZQNwqhz7tuSaWiNg.jpg?v=1783047843',
    tags: ['botanical', 'protea', 'pincushion', 'leucospermum', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'pincushion-firework-digital-print',
    shopifyVariantId: '52639807439135',
    checkoutUrl: 'https://rastarooster.com/cart/52639807439135:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'pink-mink-protea-digital-print',
    title: 'Pink Mink Protea — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Pink Mink protea (Protea neriifolia) opening, with its distinctive dark-fringed bract tips, documented by the TOPP founding grower in Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/att.8Xi9IE1L6AnXVPRbTnTbN4880BIs9sVEaT9pBEptAG0.jpg?v=1783047919',
    tags: ['botanical', 'protea', 'pink-mink', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'pink-mink-protea-digital-print',
    shopifyVariantId: '52639807537439',
    checkoutUrl: 'https://rastarooster.com/cart/52639807537439:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'pincushion-pair-digital-print',
    title: 'Pincushion Pair — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Two pincushion proteas (Leucospermum) side by side in contrasting color forms, documented by the TOPP founding grower in Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/att.oXekjbH87rBD3oXnMNcjeiivrFI_k3J8Cp74jd9hXxY.jpg?v=1783047876',
    tags: ['botanical', 'protea', 'pincushion', 'leucospermum', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'pincushion-pair-digital-print',
    shopifyVariantId: '52639807570207',
    checkoutUrl: 'https://rastarooster.com/cart/52639807570207:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'protea-field-digital-print',
    title: 'Protea Field, Hawaiʻi — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Landscape photograph of proteas flowering across a Hawaiian volcanic field under open sky.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/att.K2xNDrzi22ogtYJQpLDgyMXMKM1kH4XPw4hq_cA3SlY.jpg?v=1783047732',
    tags: ['botanical', 'protea', 'landscape', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'protea-field-hawaiʻi-digital-print',
    shopifyVariantId: '52639807602975',
    checkoutUrl: 'https://rastarooster.com/cart/52639807602975:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'yellow-pincushion-digital-print',
    title: 'Yellow Pincushion — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Yellow-and-orange pincushion protea (Leucospermum) viewed from above, documented by the TOPP founding grower in Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/att.jjhUzhaWiIMVPfkgCmKWMEhjFWfEllLDNgfCLsozvI0.jpg?v=1783047655',
    tags: ['botanical', 'protea', 'pincushion', 'leucospermum', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'yellow-pincushion-digital-print',
    shopifyVariantId: '52639808520479',
    checkoutUrl: 'https://rastarooster.com/cart/52639808520479:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'pincushions-in-bloom-digital-print',
    title: 'Pincushions in Bloom — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Orange and yellow pincushion proteas (Leucospermum) flowering on the shrub, documented by the TOPP founding grower in Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/IMG_4198.jpg?v=1783047522',
    tags: ['botanical', 'protea', 'pincushion', 'leucospermum', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'pincushions-in-bloom-digital-print',
    shopifyVariantId: '52639808586015',
    checkoutUrl: 'https://rastarooster.com/cart/52639808586015:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'red-foliage-digital-print',
    title: 'Red Foliage — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Vivid red protea-family foliage (Leucadendron) close-up, documented by the TOPP founding grower in Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/att.SiYOycrCegOV0SHjqzPXBSG5WUsAwlQTDtXaRW4fu8U.jpg?v=1783047592',
    tags: ['botanical', 'conebush', 'leucadendron', 'foliage', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'red-foliage-digital-print',
    shopifyVariantId: '52639808553247',
    checkoutUrl: 'https://rastarooster.com/cart/52639808553247:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'pincushion-bud-digital-print',
    title: 'Pincushion Bud — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Silver-leaved protea with an emerging orange pincushion bud (Leucospermum), documented by the TOPP founding grower in Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/att.yKevEPgEJwsrsBgX6JdF7XhgmtNuutRrNwgZpZz0qRc.jpg?v=1783047465',
    tags: ['botanical', 'protea', 'pincushion', 'leucospermum', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'pincushion-bud-digital-print',
    shopifyVariantId: '52639808618783',
    checkoutUrl: 'https://rastarooster.com/cart/52639808618783:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'conebush-on-lava-digital-print',
    title: 'Conebush on Lava — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Red-foliage conebush (Leucadendron) growing on black volcanic lava, documented by the TOPP founding grower in Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/IMG_4197.jpg?v=1783047388',
    tags: ['botanical', 'conebush', 'leucadendron', 'lava', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'conebush-on-lava-digital-print',
    shopifyVariantId: '52639808651551',
    checkoutUrl: 'https://rastarooster.com/cart/52639808651551:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'king-protea-on-lava-digital-print',
    title: 'King Protea on Lava — Digital Print',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Young king protea plants (Protea cynaroides) establishing on a Hawaiian lava field, documented by the TOPP founding grower in Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/att.Lzx0Ad84dVmSJBnUWmTPQDGM9d3O07P1_Lvhh91ty0g_5150644a-d827-497b-a07a-13f756bcd90b.jpg?v=1783047257',
    tags: ['botanical', 'protea', 'king-protea', 'lava', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: 'king-protea-on-lava-digital-print',
    shopifyVariantId: '52639808717087',
    checkoutUrl: 'https://rastarooster.com/cart/52639808717087:1',
    status: PRODUCT_STATUS.LIVE,
  },

  // ── Memberships ─────────────────────────────────────────────────────────
  // TOPP subscription ("Botanicals" plan) is attached to Pincushions in Bloom
  // and Conebush on Lava digital prints at $9/mo fixed price — handled in Shopify.
  // Standalone membership products below are placeholders for future tiers.
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
  {
    id: 'topp-seal-t-shirt',
    title: 'TOPP Seal T-Shirt',
    type: PRODUCT_TYPES.MERCH,
    price: 28.00,
    description: 'Unisex t-shirt featuring the TOPP seal — the Transnational Organization of Protea Planters. Made to order.',
    image: null,
    tags: ['merch', 'tshirt', 'apparel', 'topp', 'seal'],
    shopifyProductHandle: 'topp-seal-t-shirt',
    shopifyVariantId: '52639807635743',
    checkoutUrl: 'https://rastarooster.com/cart/52639807635743:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'topp-seal-tote-bag',
    title: 'TOPP Seal Tote Bag',
    type: PRODUCT_TYPES.MERCH,
    price: 22.00,
    description: 'Cotton canvas tote bag featuring the TOPP seal. Made to order.',
    image: null,
    tags: ['merch', 'tote', 'accessories', 'topp', 'seal'],
    shopifyProductHandle: 'topp-seal-tote-bag',
    shopifyVariantId: '52639807766815',
    checkoutUrl: 'https://rastarooster.com/cart/52639807766815:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'topp-sticker-pack',
    title: 'TOPP Sticker Pack',
    type: PRODUCT_TYPES.MERCH,
    price: 8.00,
    description: 'Durable vinyl sticker pack featuring the TOPP seal and protea designs. Made to order.',
    image: null,
    tags: ['merch', 'stickers', 'vinyl', 'topp', 'seal'],
    shopifyProductHandle: 'topp-sticker-pack',
    shopifyVariantId: '52639808225567',
    checkoutUrl: 'https://rastarooster.com/cart/52639808225567:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'topp-embroidered-patch',
    title: 'TOPP Embroidered Patch',
    type: PRODUCT_TYPES.MERCH,
    price: 12.00,
    description: 'Embroidered iron-on / sew-on patch featuring the TOPP seal. Member reward at 6 months.',
    image: null,
    tags: ['merch', 'patch', 'embroidered', 'topp', 'seal', 'member-reward'],
    shopifyProductHandle: 'topp-embroidered-patch',
    shopifyVariantId: '52639808749855',
    checkoutUrl: 'https://rastarooster.com/cart/52639808749855:1',
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'topp-enamel-pin',
    title: 'TOPP Enamel Pin',
    type: PRODUCT_TYPES.MERCH,
    price: 10.00,
    description: 'Enamel pin featuring the TOPP seal. Part of the one-year member anniversary reward.',
    image: null,
    tags: ['merch', 'pin', 'enamel', 'topp', 'seal', 'member-reward'],
    shopifyProductHandle: 'topp-enamel-pin',
    shopifyVariantId: '52639808782623',
    checkoutUrl: 'https://rastarooster.com/cart/52639808782623:1',
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
  // TOPP weekly protea deliveries. All three tiers ACTIVE in Shopify.
  {
    id: 'ohana-bloom-counter',
    title: 'Ohana Bloom — Counter (Weekly)',
    type: PRODUCT_TYPES.FLORIST_HOTEL,
    price: 42.00,
    description: 'Weekly hand-tied bunch of 5–7 fresh island-grown protea stems. Sized for a café counter, reception desk, or small table.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/a-weekly-hand-tied-bunch-of-fresh-island-grown-proteas-and-complementary-foliage-5-7-stems-sized-for-a-caf-counter-reception-desk-or-small-table-includes-a-printed-care-guide-contents.png?v=1783033420',
    tags: ['wholesale', 'protea', 'florist', 'weekly', 'subscription', 'topp', 'ohana-bloom'],
    shopifyProductHandle: 'ohana-bloom-counter-weekly',
    shopifyVariantId: '52649043231007',
    checkoutUrl: 'https://rastarooster.com/cart/52649043231007:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'ohana-bloom-home',
    title: 'Ohana Bloom — Ohana Home (Weekly)',
    type: PRODUCT_TYPES.FLORIST_HOTEL,
    price: 48.00,
    description: 'Home-sized weekly box of 7–10 fresh protea stems and foliage. Drop straight into a vase. Includes printed care guide.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/att.Ml0-muat5C-dXiS9Sp897hWREn7hks1tCJE98Swn8D8.jpg?v=1782893088',
    tags: ['wholesale', 'protea', 'florist', 'home', 'weekly', 'subscription', 'topp', 'ohana-bloom'],
    shopifyProductHandle: 'ohana-bloom-ohana-home-weekly',
    shopifyVariantId: '52649043296543',
    checkoutUrl: 'https://rastarooster.com/cart/52649043296543:1',
    status: PRODUCT_STATUS.LIVE,
  },
  {
    id: 'ohana-bloom-statement',
    title: 'Ohana Bloom — Statement (Weekly)',
    type: PRODUCT_TYPES.FLORIST_HOTEL,
    price: 88.00,
    description: '12–15 stems featuring a king protea with pincushions and conebush foliage — for hotel lobbies, restaurants, and salons.',
    image: null,
    tags: ['wholesale', 'protea', 'hotel', 'lobby', 'weekly', 'subscription', 'topp', 'ohana-bloom'],
    shopifyProductHandle: 'ohana-bloom-statement-weekly',
    shopifyVariantId: '52649043263775',
    checkoutUrl: 'https://rastarooster.com/cart/52649043263775:1',
    status: PRODUCT_STATUS.LIVE,
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
