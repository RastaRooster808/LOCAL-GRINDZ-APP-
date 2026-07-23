/**
 * cta.ts — CTA definitions and routing logic
 *
 * Each CTA entry maps a user-facing label to either:
 *  - a live internal route (href)
 *  - a Shopify collection or product URL (shopifyUrl)
 *  - a coming_soon / sold_out / hidden state
 *
 * Status semantics:
 *   live        → renders as a real link (internal Link or external Shopify)
 *   coming_soon → renders "Coming Soon" badge + notify flash on click
 *   sold_out    → renders disabled "Sold Out" button, no routing
 *   hidden      → CTAButton and CTACard return null — not rendered
 */

import { trackEvent } from './analytics';

export type CTAStatus = 'live' | 'coming_soon' | 'sold_out' | 'hidden';

export interface CTADefinition {
  id: string;
  label: string;
  description: string;
  href?: string;         // internal React Router path
  shopifyUrl?: string;   // Shopify collection or product page URL
  status: CTAStatus;
  trackLabel: string;
  section: string;
  icon?: string;
}

export const CTAS: Record<string, CTADefinition> = {
  shop_prints: {
    id: 'shop_prints',
    label: 'Shop Botanical Prints',
    description: 'High-resolution digital downloads of Big Island botanical art — $0.99 each.',
    href: undefined,
    shopifyUrl: 'https://rastarooster.com/collections/botanical-prints',
    status: 'live',
    trackLabel: 'Shop Botanical Prints',
    section: 'commerce',
    icon: '🌺',
  },
  join_topp: {
    id: 'join_topp',
    label: 'Join TOPP',
    description: 'Subscribe to the Botanicals plan — monthly digital prints from Puna protea growers.',
    href: undefined,
    shopifyUrl: 'https://rastarooster.com/collections/botanical-prints',
    status: 'live',
    trackLabel: 'Join TOPP',
    section: 'membership',
    icon: '🌿',
  },
  support_archive: {
    id: 'support_archive',
    label: 'Support the Archive',
    description: 'Help preserve the botanical and cultural history of the Puna district.',
    href: undefined,
    shopifyUrl: undefined,
    status: 'coming_soon',
    trackLabel: 'Support the Archive',
    section: 'support',
    icon: '📚',
  },
  view_inventory: {
    id: 'view_inventory',
    label: 'View Current Inventory',
    description: 'Browse fresh weekly protea stems — Ohana Bloom bundles for cafés, homes, and hotels.',
    href: undefined,
    shopifyUrl: 'https://rastarooster.com/collections/wholesale-flowers',
    status: 'live',
    trackLabel: 'View Current Inventory',
    section: 'florist_hotel',
    icon: '💐',
  },
  vendor_directory: {
    id: 'vendor_directory',
    label: 'Vendor Directory',
    description: 'Browse all food trucks and pop-up vendors on the Big Island.',
    href: '/vendors',
    shopifyUrl: undefined,
    status: 'live',
    trackLabel: 'Vendor Directory',
    section: 'directory',
    icon: '🚚',
  },
  florist_hotel: {
    id: 'florist_hotel',
    label: 'Florist / Hotel Access',
    description: 'Fresh weekly protea stems direct from Puna — Ohana Bloom bundles from $42/week.',
    href: undefined,
    shopifyUrl: 'https://rastarooster.com/collections/wholesale-flowers',
    status: 'live',
    trackLabel: 'Florist Hotel Access',
    section: 'wholesale',
    icon: '🏨',
  },
  grower_resources: {
    id: 'grower_resources',
    label: 'Grower Resources',
    description: 'Digital guides and tools for Puna farmers and small-scale growers.',
    href: undefined,
    shopifyUrl: undefined,
    status: 'coming_soon',
    trackLabel: 'Grower Resources',
    section: 'commerce',
    icon: '🌱',
  },
  apply_vendor: {
    id: 'apply_vendor',
    label: 'Join as Vendor',
    description: 'List your food truck or pop-up on The Kingdom Emporium.',
    href: '/apply',
    shopifyUrl: undefined,
    status: 'live',
    trackLabel: 'Apply as Vendor',
    section: 'vendor_cta',
    icon: '🍽',
  },
};

export function handleCTAClick(cta: CTADefinition): string | null {
  trackEvent('cta_click', {
    label: cta.trackLabel,
    destination: cta.shopifyUrl ?? cta.href ?? cta.status,
    section: cta.section,
  });

  if (cta.status !== 'live') return null;
  if (cta.shopifyUrl) return cta.shopifyUrl;
  if (cta.href) return cta.href;
  return null;
}
