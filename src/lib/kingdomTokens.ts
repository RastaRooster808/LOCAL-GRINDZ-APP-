/**
 * kingdomTokens.ts — Kingdom-themed loyalty tokens for the weekly market booth.
 *
 * A plain punch-card, not currency: a color is a thank-you for a visit,
 * redeemable only for whatever the vendor decides in person. No cash value.
 */

export type TokenColor = 'blue' | 'gold' | 'red' | 'purple';

export interface TokenColorInfo {
  value: TokenColor;
  label: string;
  swatch: string;
}

export const TOKEN_COLORS: TokenColorInfo[] = [
  { value: 'blue', label: 'Blue', swatch: '#1d4ed8' },
  { value: 'gold', label: 'Gold', swatch: '#d99400' },
  { value: 'red', label: 'Red', swatch: '#d81f1f' },
  { value: 'purple', label: 'Purple', swatch: '#6b21a8' },
];

export function normalizeContact(contact: string): string {
  return contact.trim().toLowerCase();
}
