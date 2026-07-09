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
  SOLD_OUT:    'sold_out',
  HIDDEN:      'hidden',
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

  // ── Puna Field Study — July 2026 Batch (20 of 21 photos reviewed) ────────
  // Full batch: 21 photos from Puna lava site, July 2026.
  // 11 distinct scenes selected as products below; near-duplicate frames noted
  // as alternates in each entry's image comment.
  // Rename files before uploading to Shopify: use descriptive kebab-case names
  // (e.g. topp-pincushion-lava-pair-01.jpg) so CDN URLs are self-identifying.
  // Steps to go live: upload → get CDN URL → create Shopify product (DRAFT) →
  // attach Sky Pilot file → populate fields below → flip LIVE.
  {
    id: 'ohia-lehua-salmon-bloom-digital-print',
    title: 'ʻŌhiʻa Lehua — Salmon Bloom',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'A salmon-orange lehua blossom on native ʻōhiʻa (Metrosideros polymorpha) growing wild beside the protea rows — grey-green rounded leaves, new buds, and the Puna scrubland behind. Hawaiʻi\'s most beloved native tree, at home on young lava.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/red-Pincushion.heic.jpg?v=1783634701', // Shopify: red-Pincushion (filename says pincushion; photo is ohia lehua. alt: Pincushion-field)
    tags: ['botanical', 'ohia', 'lehua', 'metrosideros', 'native-hawaiian', 'digital', 'hawaii', 'topp', 'puna'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'orange-pincushion-shrub-wide-digital-print',
    title: 'Orange Pincushion Shrub — Working Rows',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'A mature orange pincushion protea (Leucospermum) shrub carrying half a dozen blooms at once, rooted straight into broken lava. The working farm shows at the field edge — this is production protea country, Puna, Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/Yellow-Starbust.heic.jpg?v=1783634702', // Shopify: Yellow-Starbust (wide shrub scene despite filename. alt: Pincushions-Bush)
    tags: ['botanical', 'protea', 'pincushion', 'leucospermum', 'shrub', 'farm', 'lava', 'digital', 'hawaii', 'topp', 'puna'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'pincushion-lava-firework-pair-digital-print',
    title: 'Pincushion on Lava — Firework Pair',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Two orange-red pincushion proteas (Leucospermum) in full anthesis against black Puna lava — the firework bloom structure at its most saturated. Silver-grey foliage, lava substrate, multiple buds visible in background. Photographed by the TOPP founding grower.',
    image: null, // Upload IMG_0599 to Shopify CDN → replace null
    tags: ['botanical', 'protea', 'pincushion', 'leucospermum', 'lava', 'firework', 'digital', 'hawaii', 'topp', 'puna'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'king-protea-cinder-field-wide-digital-print',
    title: 'King Protea — Cinder Field, Wide',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'King Protea (Protea cynaroides) established on open volcanic cinder in Puna, Hawaiʻi — one open pink bloom, one developing bud, weathered lava ridge and grey island sky behind. Wide environmental portrait from the TOPP founding grower.',
    image: null, // Upload IMG_0578 to Shopify CDN → replace null (EXIF rotation: verify orientation after upload)
    tags: ['botanical', 'protea', 'king-protea', 'lava', 'cinder', 'landscape', 'digital', 'hawaii', 'topp', 'puna'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'king-protea-full-bloom-close-digital-print',
    title: 'King Protea — Full Bloom',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'King Protea (Protea cynaroides) at full anthesis — the payoff of the bud study series. Silvery floret dome ringed by pink velvet bracts, edge-lit leaves framing the bloom on Puna cinder ground.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/King-Protea_and_Puppy_5.heic.jpg?v=1783634702', // Shopify: King-Protea_and_Puppy_5 (alts: _2, _4)
    tags: ['botanical', 'protea', 'king-protea', 'bloom', 'anthesis', 'digital', 'hawaii', 'topp', 'puna'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'king-protea-silver-dome-macro-digital-print',
    title: 'King Protea — Silver Dome Macro',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Extreme macro of an open King Protea center — hundreds of silver-pink florets spiraling into the dome, each tipped with fine down. Companion piece to the Macro Bract Study: the same flower architecture, after opening.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/King-Protea_close_up.heic.jpg?v=1783634702', // Shopify: King-Protea_close_up
    tags: ['botanical', 'protea', 'king-protea', 'macro', 'floret', 'texture', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'king-protea-open-bloom-lava-digital-print',
    title: 'King Protea in Bloom on Lava',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Open King Protea (Protea cynaroides) cradled in its own red-stemmed, gold-edged foliage on black lava rock, a second bud forming behind. Three-quarter view, Puna, Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/King-Protea_and_Puppy_3.heic.jpg?v=1783634702', // Shopify: King-Protea_and_Puppy_3 (no puppy in frame despite filename)
    tags: ['botanical', 'protea', 'king-protea', 'bloom', 'lava', 'digital', 'hawaii', 'topp', 'puna'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'king-protea-lava-outcrop-digital-print',
    title: 'King Protea — Lava Outcrop',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Open King Protea bloom emerging from a rough a\'a lava outcrop, the Puna scrubland stretching behind — lichen-covered rock, native shrubs, and volcanic ground in one frame.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/pink-King_protea_2.heic.jpg?v=1783634701', // Shopify: pink-King_protea_2
    tags: ['botanical', 'protea', 'king-protea', 'lava', 'outcrop', 'landscape', 'digital', 'hawaii', 'topp', 'puna'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'king-protea-profile-sky-digital-print',
    title: 'King Protea — Profile Against Sky',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Full plant portrait: a King Protea shrub in profile against a soft grey island sky, pink bloom held above red-stemmed whorls of leaves, rooted in black lava. Puna, Hawaiʻi.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/Pink-King_Protea.heic.jpg?v=1783634701', // Shopify: Pink-King_Protea
    tags: ['botanical', 'protea', 'king-protea', 'sky', 'profile', 'digital', 'hawaii', 'topp', 'puna'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'pincushion-pair-farm-puppy-digital-print',
    title: 'Pincushion Pair & Farm Puppy',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'An orange and a yellow pincushion protea (Leucospermum) blooming side by side on the Puna cinder field, the farm puppy sitting just behind them. Working farm, honest moment.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/Pincushion-Farm_Puppy.heic.jpg?v=1783634702', // Shopify: Pincushion-Farm_Puppy (alts: Puppy2, puppy_3, puppy_4)
    tags: ['botanical', 'protea', 'pincushion', 'leucospermum', 'farm-life', 'dog', 'digital', 'hawaii', 'topp', 'puna'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'yellow-pincushion-starburst-macro-digital-print',
    title: 'Yellow Pincushion — Starburst Macro',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Overhead macro of a yellow pincushion protea (Leucospermum) at full extension — dozens of golden styles radiating from the center, each tipped in coral pink, silver deadwood branches soft behind.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/Yellow-Bloom_2.heic.jpg?v=1783634701', // Shopify: Yellow-Bloom_2 (alts: Yellow-Bloom, Yellow-Bloom_3)
    tags: ['botanical', 'protea', 'pincushion', 'leucospermum', 'macro', 'starburst', 'yellow', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'king-protea-farm-dog-digital-print',
    title: 'King Protea & Farm Dog — Puna Field',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Life on a Puna protea farm: an open King Protea bloom in the foreground and the farm puppy standing on the cinder drip line, facing the camera. A field-life portrait from the TOPP founding grower.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/King-Protea_and_Puppy.heic.jpg?v=1783634702', // Shopify: King-Protea_and_Puppy
    tags: ['botanical', 'protea', 'king-protea', 'farm-life', 'dog', 'digital', 'hawaii', 'topp', 'puna'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },

  // ── King Protea Bud Study Series (5 new field photos, July 2026) ────────
  // Photographed on Puna lava site — bud development sequence, Protea cynaroides.
  // BLOCKED: Not yet uploaded to Shopify CDN or created as Shopify products.
  // Steps to go live: upload photos to Shopify Files → get CDN URLs → create
  // Shopify products → attach Sky Pilot files → populate fields below → flip LIVE.
  // Featured in TOPP Field Report Issue 001 member newsletter.
  {
    id: 'king-protea-bud-overhead-digital-print',
    title: 'King Protea Bud — Overhead Rosette',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'King Protea (Protea cynaroides) bud photographed from directly above its rosette of leaves on Puna lava soil. The bract geometry is fully formed before the flower opens.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/9C98C58A-F405-44C3-A37A-4DC49A451B55.jpg?v=1783110478',
    tags: ['botanical', 'protea', 'king-protea', 'bud', 'overhead', 'digital', 'hawaii', 'topp', 'lava'],
    shopifyProductHandle: null, // Set after Shopify product created
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'king-protea-on-lava-wall-wide-digital-print',
    title: 'King Protea on Lava Wall — Wide',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'King Protea branch growing laterally from a\'a basalt lava wall, Puna, Hawaiʻi. Documents the plant establishing on volcanic rock, reaching sideways into available light.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/245B8120-0E94-49F5-9C10-74200DCEF83E.jpg?v=1783110478',
    tags: ['botanical', 'protea', 'king-protea', 'lava', 'landscape', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'king-protea-on-lava-close-digital-print',
    title: 'King Protea on Lava — Close Study',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Close study of a King Protea bud on a\'a basalt in Puna, Hawaiʻi. Red-margined leaves indicate the plant is in its establishment phase. Lava texture visible throughout.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/687510E4-ECB3-4301-9E47-913941114C23.jpg?v=1783110478',
    tags: ['botanical', 'protea', 'king-protea', 'lava', 'close-up', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'king-protea-bud-macro-digital-print',
    title: 'King Protea Bud — Macro Bract Study',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'Macro photograph of a King Protea (Protea cynaroides) bud showing the velvety, geometrically patterned bracts in dusty rose-pink. The fine hair along each bract edge is visible — detail only seen on the living plant before opening.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/B1A95449-3A90-43FA-9EC9-4441C65E1E9C.jpg?v=1783110478',
    tags: ['botanical', 'protea', 'king-protea', 'macro', 'bract', 'digital', 'hawaii', 'topp', 'texture'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },
  {
    id: 'king-protea-bud-opening-digital-print',
    title: 'King Protea — The Moment Before Opening',
    type: PRODUCT_TYPES.DIGITAL_PRINT,
    price: 0.99,
    description: 'King Protea (Protea cynaroides) bud at pre-anthesis stage — outer bracts beginning to separate, interior deepening to rose pink. A second bud forming in the upper frame. Photographed on Puna lava site one day after the bud study series.',
    image: 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/DAC66AB7-2656-48C4-829C-52E5304D3973.jpg?v=1783110478',
    tags: ['botanical', 'protea', 'king-protea', 'opening', 'pre-anthesis', 'digital', 'hawaii', 'topp'],
    shopifyProductHandle: null,
    shopifyVariantId: null,
    checkoutUrl: null,
    status: PRODUCT_STATUS.COMING_SOON,
  },

  // ── Memberships ─────────────────────────────────────────────────────────
  // BLOCKED: No standalone Shopify membership products exist yet.
  // See docs/SHOPIFY_PRODUCT_BLUEPRINT.md Part 2 for full product specs.
  //
  // NOTE: The existing "Botanicals" subscription plan ($9/mo attached to
  // Pincushions in Bloom + Conebush on Lava prints) is NOT a membership product.
  // It is a recurring digital print delivery. Do not reuse it as a membership tier.
  //
  // These entries remain COMING_SOON until:
  //   1. Shopify membership products are created in Draft
  //   2. Shopify Subscriptions selling plan groups are configured (3 new plans needed)
  //   3. Benefits delivery mechanism is operational
  //   4. Required legal disclosures are on the product page
  //   5. shopifyProductHandle + shopifyVariantId are populated below
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
  // BLOCKED: No Shopify products exist yet for grower guides.
  // See docs/SHOPIFY_PRODUCT_BLUEPRINT.md Part 1 for full product specs (5 guides planned).
  //
  // These entries remain COMING_SOON until:
  //   1. PDF content is written and reviewed
  //   2. Cover/mockup images are created
  //   3. Shopify products are created in Draft status (handle: see blueprint)
  //   4. PDF files are uploaded to Sky Pilot and attached to product variants
  //   5. Collection "topp-grower-guides" is created in Shopify
  //   6. shopifyProductHandle + shopifyVariantId are populated below
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
