export interface Vendor {
  id: string;
  slug: string;
  name: string;
  cuisine_type: string | null;
  description: string | null;
  photo_url: string | null;
  logo_url?: string | null;
  neighborhood: string | null;
  is_active: boolean;
  user_id?: string | null;
  badges?: string[];
  email?: string;
  paypal_handle?: string | null;
  venmo_handle?: string | null;
  cashapp_handle?: string | null;
  preferred_payment?: string | null;
  locations?: Location[];
  vendor_features?: VendorFeature[];
}

export interface Location {
  id: string;
  vendor_id: string;
  name: string;
  address: string | null;
  hours: string | null;
  status: 'open' | 'closed';
  updated_at: string;
}

export interface MenuItem {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  available: boolean;
  photo_url?: string | null;
  featured?: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  vendor_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_note: string | null;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  created_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  estimated_minutes: number | null;
  cancellation_reason: string | null;
  payment_method?: 'cash' | 'paypal' | 'venmo' | 'cashapp';
  payment_status?: 'unpaid' | 'marked_paid' | 'confirmed';
  payment_ref?: string | null;
  vendors?: {
    name: string;
    slug: string;
    paypal_handle?: string | null;
    venmo_handle?: string | null;
    cashapp_handle?: string | null;
    preferred_payment?: string | null;
  } | null;
}

export interface Special {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  expires_at: string | null;
  active: boolean;
}

export interface Review {
  id: string;
  vendor_id: string;
  customer_name: string;
  rating: number;
  body: string;
  approved: boolean;
  created_at: string;
  photo_url?: string | null;
  vendor_reply?: string | null;
  vendor_replied_at?: string | null;
  helpful_count?: number;
  reported?: boolean;
}

export interface VendorApplication {
  id: string;
  business_name: string;
  cuisine_type: string | null;
  neighborhood: string | null;
  contact_email: string;
  contact_phone: string | null;
  instagram: string | null;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
}

export interface VendorFeature {
  id: string;
  vendor_id: string;
  tier: string;
  feature_expires_at: string;
}

export const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Received',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_ICONS: Record<OrderStatus, string> = {
  pending: '⏳',
  accepted: '✅',
  preparing: '🍳',
  ready: '🔔',
  completed: '🎉',
  cancelled: '❌',
};
