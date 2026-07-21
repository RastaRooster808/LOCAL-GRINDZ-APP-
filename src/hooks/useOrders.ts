import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus } from '../lib/types';

export function useVendorOrders(vendorId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  async function loadOrders() {
    if (!vendorId) return;
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders((data as Order[]) || []);
    setLoading(false);
  }

  async function updateStatus(
    orderId: string,
    status: OrderStatus,
    extra?: { estimated_minutes?: number; cancellation_reason?: string }
  ) {
    const patch: Record<string, unknown> = { status };
    if (status === 'accepted') patch.accepted_at = new Date().toISOString();
    if (status === 'ready') patch.ready_at = new Date().toISOString();
    if (status === 'completed') patch.completed_at = new Date().toISOString();
    if (extra?.estimated_minutes) patch.estimated_minutes = extra.estimated_minutes;
    if (extra?.cancellation_reason) patch.cancellation_reason = extra.cancellation_reason;

    await supabase.from('orders').update(patch).eq('id', orderId);
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status, ...patch } as Order : o))
    );
  }

  useEffect(() => {
    if (!vendorId) return;
    loadOrders();

    channelRef.current = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vendorId}` },
        (payload) => {
          setOrders(prev => [payload.new as Order, ...prev]);
        }
      )
      .subscribe();

    return () => { channelRef.current?.unsubscribe(); };
  }, [vendorId]);

  return { orders, loading, loadOrders, updateStatus };
}

export function useOrderTracking(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    supabase
      .from('orders')
      .select('*, vendors(name, slug, paypal_handle, venmo_handle, cashapp_handle, preferred_payment)')
      .eq('id', orderId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setError('Order not found.'); setLoading(false); return; }
        setOrder(data as Order);
        setLoading(false);
      });

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => setOrder(prev => prev ? { ...prev, ...payload.new } : null)
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [orderId]);

  return { order, loading, error };
}
