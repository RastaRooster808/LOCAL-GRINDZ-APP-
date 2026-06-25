import { useParams, Link } from 'react-router-dom';
import { useOrderTracking } from '../hooks/useOrders';
import { StatusStepper } from '../components/ui/StatusStepper';
import { STATUS_LABELS } from '../lib/types';

export function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const { order, loading, error } = useOrderTracking(id ?? null);

  if (loading) {
    return (
      <div className="tracking-page">
        <header className="site-header">
          <h1>Local Grindz</h1>
        </header>
        <main className="tracking-main">
          <p className="loading-msg">Loading your order…</p>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="tracking-page">
        <header className="site-header">
          <h1>Local Grindz</h1>
        </header>
        <main className="tracking-main">
          <section>
            <h2>Order not found</h2>
            <p>This order link may have expired or is invalid.</p>
            <Link to="/" className="btn-primary">Go Home</Link>
          </section>
        </main>
      </div>
    );
  }

  const vendorName = (order.vendors as { name: string } | null)?.name ?? 'Vendor';
  const vendorSlug = (order.vendors as { slug: string } | null)?.slug;

  return (
    <div className="tracking-page">
      <header className="site-header">
        {vendorSlug && (
          <Link to={`/vendors/${vendorSlug}`} className="back-link">← {vendorName}</Link>
        )}
        <h1>Order Status</h1>
        <p className="tagline">{vendorName}</p>
      </header>

      <main className="tracking-main">
        <section className="tracking-status-section">
          <h2>{STATUS_LABELS[order.status]}</h2>
          {order.status === 'accepted' && order.estimated_minutes && (
            <p className="tracking-eta">Ready in about <strong>{order.estimated_minutes} minutes</strong></p>
          )}
          {order.status === 'cancelled' && order.cancellation_reason && (
            <p className="tracking-cancel-reason">Reason: {order.cancellation_reason}</p>
          )}
          <StatusStepper status={order.status} estimatedMinutes={order.estimated_minutes} />
        </section>

        <section className="tracking-details">
          <h2>Your Order</h2>
          <div className="tracking-items">
            {order.items.map((item, i) => (
              <div key={i} className="tracking-item">
                <span>{item.qty}× {item.name}</span>
                <span>${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="tracking-total">Total: <strong>${Number(order.total).toFixed(2)}</strong></p>
          {order.customer_note && (
            <p className="tracking-note">Note: {order.customer_note}</p>
          )}
        </section>

        <section className="tracking-footer">
          <p className="tracking-order-id">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <p className="tracking-live-note">🔴 This page updates live — no refresh needed</p>
          )}
          {vendorSlug && (
            <Link to={`/vendors/${vendorSlug}`} className="btn-secondary">
              Back to {vendorName}
            </Link>
          )}
        </section>
      </main>
    </div>
  );
}
