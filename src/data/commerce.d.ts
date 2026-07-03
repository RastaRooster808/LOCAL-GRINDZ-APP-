export type ProductStatus = 'live' | 'coming_soon' | 'sold_out' | 'hidden' | 'draft' | 'archived';
export type ProductType =
  | 'digital_print'
  | 'membership'
  | 'merch'
  | 'grower_resource'
  | 'vendor_product'
  | 'florist_hotel';

export interface CommerceItem {
  id: string;
  title: string;
  type: ProductType;
  price: number;
  description: string;
  image: string | null;
  tags: string[];
  shopifyProductHandle: string | null;
  shopifyVariantId: string | null;
  checkoutUrl: string | null;
  status: ProductStatus;
}

export declare const PRODUCT_TYPES: Record<string, ProductType>;
export declare const PRODUCT_STATUS: Record<string, ProductStatus>;
export declare const commerce: CommerceItem[];
export declare function getByType(type: ProductType): CommerceItem[];
export declare function getById(id: string): CommerceItem | undefined;
export declare function getLiveItems(): CommerceItem[];
