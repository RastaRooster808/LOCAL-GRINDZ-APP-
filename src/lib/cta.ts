/**
 * cta.ts — CTA definitions and routing logic
 *
 * Each CTA entry maps a user-facing label to either:
 *  - a live internal route (href)
 *  - a Shopify checkout/collection URL (shopifyUrl)
 *  - a "coming soon" placeholder state (comingSoon: true)
 *
 * Import useCTA() in components to get click handlers + state.
 */

import { trackEvent } from './analytics';

export interface CTADefinition {
  id: string;
  label: string;
  description: string;
  href?: string;
  shopifyUrl?: string;
  comingSoon: boolean;
  trackLabel: string;
  section: string;
  icon?: string;
}

export const CTAS: Record<string, CTADefinition> = {
  shop_prints: {
    id: 'shop_prints',
    label: 'Shop Botanical Prints',
    description: 'High-resolution digital downloads of Big Island botanical art.',
    href: undefined,
    shopifyUrl: 'https://rastarooster.com/collections/botanical-prints',
    comingSoon: false,
    trackLabel: 'Shop Botanical Prints',
    section: 'commerce',
    icon: '🌺',
  },
  join_topp: {
    id: 'join_topp',
    label: 'Join TOPP',
    description: 'Become a member of the Puna community archive and support local growers.',
    href: undefined,
    shopifyUrl: undefined,
    comingSoon: true,
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
    comingSoon: true,
    trackLabel: 'Support the Archive',
    section: 'support',
    icon: '📚',
  },
  view_inventory: {
    id: 'view_inventory',
    label: 'View Current Inventory',
    description: 'Browse available tropical stems, anthurium, and foliage for florists and hotels.',
    href: undefined,
    shopifyUrl: undefined,
    comingSoon: true,
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
    comingSoon: false,
    trackLabel: 'Vendor Directory',
    section: 'directory',
    icon: '🚚',
  },
  florist_hotel: {
    id: 'florist_hotel',
    label: 'Florist / Hotel Access',
    description: 'Wholesale tropical flowers direct from Puna growers.',
    href: undefined,
    shopifyUrl: undefined,
    comingSoon: true,
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
    comingSoon: true,
    trackLabel: 'Grower Resources',
    section: 'commerce',
    icon: '🌱',
  },
  apply_vendor: {
    id: 'apply_vendor',
    label: 'Join as Vendor',
    description: 'List your food truck or pop-up on Local Grindz.',
    href: '/apply',
    shopifyUrl: undefined,
    comingSoon: false,
    trackLabel: 'Apply as Vendor',
    section: 'vendor_cta',
    icon: '🍽',
  },
};

export function handleCTAClick(cta: CTADefinition): string | null {
  trackEvent('cta_click', {
    label: cta.trackLabel,
    destination: cta.shopifyUrl ?? cta.href ?? 'coming_soon',
    section: cta.section,
  });

  if (cta.comingSoon) return null;
  if (cta.shopifyUrl) return cta.shopifyUrl;
  if (cta.href) return cta.href;
  return null;
}
