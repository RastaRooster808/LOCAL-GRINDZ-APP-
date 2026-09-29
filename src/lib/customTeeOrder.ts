/**
 * customTeeOrder.ts — Rasta Rooster custom tee order pricing.
 *
 * Direct-to-community custom apparel: customer picks garment, up to three
 * print spots (front/back/sleeve) each with a size and their own design
 * image, and fulfillment; we quote a price and take a design request. No
 * live payment collection here — orders land in Supabase for admin
 * follow-up (screen print / heat transfer / DTG), same as vendor applications.
 */

export type ShirtType = 'standard_tee' | 'heavy_cotton' | 'hoodie';
export type PrintLocation = 'front' | 'back' | 'sleeve';
export type PrintSize = 'small' | 'medium' | 'large';

export interface GarmentOption {
  value: ShirtType;
  label: string;
  basePrice: number;
}

export const GARMENT_OPTIONS: GarmentOption[] = [
  { value: 'standard_tee', label: 'Standard Tee', basePrice: 25.0 },
  { value: 'heavy_cotton', label: 'Heavy Cotton Tee', basePrice: 28.0 },
  { value: 'hoodie', label: 'Hoodie', basePrice: 45.0 },
];

export interface ShirtColorOption {
  value: string;
  label: string;
  hex: string;
}

export const SHIRT_COLORS: ShirtColorOption[] = [
  { value: 'white', label: 'White', hex: '#f5f5f0' },
  { value: 'black', label: 'Black', hex: '#1a1a1a' },
  { value: 'natural', label: 'Natural', hex: '#e8dcc4' },
  { value: 'navy', label: 'Navy', hex: '#1e2a4a' },
  { value: 'red', label: 'Red', hex: '#b3261e' },
  { value: 'forest', label: 'Forest Green', hex: '#2d4a2d' },
];

export interface PrintLocationOption {
  value: PrintLocation;
  label: string;
}

export const PRINT_LOCATIONS: PrintLocationOption[] = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'sleeve', label: 'Sleeve' },
];

export interface PrintSizeOption {
  value: PrintSize;
  label: string;
  inches: number;
  /** Max print-area width as a fraction of the garment's front/back width, for the mockup. */
  widthFrac: number;
}

export const PRINT_SIZES: PrintSizeOption[] = [
  { value: 'large', label: 'Large — 9"', inches: 9, widthFrac: 0.62 },
  { value: 'medium', label: 'Medium — 6"', inches: 6, widthFrac: 0.42 },
  { value: 'small', label: 'Small — 3"', inches: 3, widthFrac: 0.22 },
];

export interface FulfillmentOption {
  value: Fulfillment;
  label: string;
  description: string;
  fee: number;
}

export type Fulfillment = 'pahoa_pickup' | 'hawaii_ship';

const HAWAII_SHIP_FEE = 7.5;

export const FULFILLMENT_OPTIONS: FulfillmentOption[] = [
  {
    value: 'pahoa_pickup',
    label: 'Pāhoa Pickup',
    description: 'Free — pick up locally, no shipping fee.',
    fee: 0,
  },
  {
    value: 'hawaii_ship',
    label: 'Hawaiʻi Island Shipping',
    description: `Flat-rate USPS shipping anywhere on the Big Island — $${HAWAII_SHIP_FEE.toFixed(2)}.`,
    fee: HAWAII_SHIP_FEE,
  },
];

/** Extra fee per print spot beyond the first (front/back/sleeve — size doesn't change price yet). */
export const EXTRA_PRINT_LOCATION_FEE = 8.0;

/** One print spot: where on the garment, how big, and the artist's design image. */
export interface PrintSpec {
  location: PrintLocation;
  size: PrintSize;
  /** Local object URL for instant preview — always set once a file is picked. */
  previewUrl: string;
  /** Hosted URL once the upload finishes; null while still uploading. */
  imageUrl: string | null;
  uploading: boolean;
}

const BASE_PRICES: Record<ShirtType, number> = Object.fromEntries(
  GARMENT_OPTIONS.map(g => [g.value, g.basePrice]),
) as Record<ShirtType, number>;

const FULFILLMENT_FEES: Record<Fulfillment, number> = Object.fromEntries(
  FULFILLMENT_OPTIONS.map(f => [f.value, f.fee]),
) as Record<Fulfillment, number>;

export interface CustomTeeOrderInput {
  shirtType: ShirtType;
  printSpotCount: number;
  fulfillment: Fulfillment;
  quantity: number;
}

export interface CustomTeeOrderQuote {
  pricePerItem: number;
  subtotal: number;
  shipping: number;
  total: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Calculate final cost for a Rasta Rooster custom tee order. */
export function calculateCustomTeeOrder({
  shirtType = 'standard_tee',
  printSpotCount = 1,
  fulfillment = 'pahoa_pickup',
  quantity = 1,
}: Partial<CustomTeeOrderInput>): CustomTeeOrderQuote {
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);
  const safeSpots = Math.max(1, Math.floor(printSpotCount) || 1);
  const extraPrintFee = Math.max(0, safeSpots - 1) * EXTRA_PRINT_LOCATION_FEE;
  const shipping = FULFILLMENT_FEES[fulfillment];
  const pricePerItem = BASE_PRICES[shirtType] + extraPrintFee;
  const subtotal = pricePerItem * safeQuantity;
  const total = subtotal + shipping;

  return {
    pricePerItem: round2(pricePerItem),
    subtotal: round2(subtotal),
    shipping: round2(shipping),
    total: round2(total),
  };
}
