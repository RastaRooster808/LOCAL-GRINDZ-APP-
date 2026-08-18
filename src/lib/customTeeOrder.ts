/**
 * customTeeOrder.ts — Rasta Rooster custom tee order pricing.
 *
 * Direct-to-community custom apparel: customer picks garment, print
 * locations, and fulfillment; we quote a price and take a design request.
 * No live payment collection here — orders land in Supabase for admin
 * follow-up (screen print / heat transfer / DTG), same as vendor applications.
 */

export type ShirtType = 'standard_tee' | 'heavy_cotton' | 'hoodie';
export type PrintLocation = 'front' | 'back';
export type Fulfillment = 'pahoa_pickup' | 'hawaii_ship';

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

export interface FulfillmentOption {
  value: Fulfillment;
  label: string;
  description: string;
  fee: number;
}

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

/** Extra fee for printing a second location (e.g. front + back). */
export const EXTRA_PRINT_LOCATION_FEE = 8.0;

const BASE_PRICES: Record<ShirtType, number> = Object.fromEntries(
  GARMENT_OPTIONS.map(g => [g.value, g.basePrice]),
) as Record<ShirtType, number>;

const FULFILLMENT_FEES: Record<Fulfillment, number> = Object.fromEntries(
  FULFILLMENT_OPTIONS.map(f => [f.value, f.fee]),
) as Record<Fulfillment, number>;

export interface CustomTeeOrderInput {
  shirtType: ShirtType;
  printLocations: PrintLocation[];
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
  printLocations = ['front'],
  fulfillment = 'pahoa_pickup',
  quantity = 1,
}: Partial<CustomTeeOrderInput>): CustomTeeOrderQuote {
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);
  const extraPrintFee = printLocations.length > 1 ? EXTRA_PRINT_LOCATION_FEE : 0;
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
