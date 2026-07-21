import { useState } from 'react';
import { Order, OrderStatus } from '../../lib/types';

interface Props {
  order: Order;
  onUpdateStatus: (id: string, status: OrderStatus, extra?: { estimated_minutes?: number; cancellation_reason?: string }) => void;
}

export function OrderCard({ order, onUpdateStatus }: Props) {
  const [eta, setEta] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  const nextStatus: Record<string, OrderStatus | null> = {
    pending: 'accepted',
    accepted: 'preparing',
    preparing: 'ready',
    ready: 'completed',
    completed: null,
    cancelled: null,
  };

  const next = nextStatus[order.status];
  const nextLabels: Partial<Record<OrderStatus, string>> = {
    accepted: 'Accept Order',
    preparing: 'Start Preparing',
    ready: 'Mark Ready',
    completed: 'Complete',
  };

  return (
    <div className={`order-card order-card--${order.status}`}>
      <div className="order-card-header">
        <div>
          <strong>{order.customer_name}</strong>
          <span className={`order-badge order-badge--${order.status}`}>{order.status}</span>
        </div>
        <span className="order-total">${Number(order.total).toFixed(2)}</span>
      </div>

      <div className="order-items-list">
        {order.items.map((item, i) => (
          <span key={i}>{item.qty}× {item.name}</span>
        ))}
      </div>

      {order.customer_note && (
        <p className="order-note">📝 {order.customer_note}</p>
      )}

      <p className="order-time">{new Date(order.created_at).toLocaleTimeString()}</p>

      {next && !showCancel && (
        <div className="order-actions">
          {order.status === 'pending' && (
            <div className="order-eta-row">
              <input
                type="number"
                placeholder="Est. minutes"
                value={eta}
                onChange={e => setEta(e.target.value)}
                className="eta-input"
                min="1"
                max="120"
              />
            </div>
          )}
          <button
            className="btn-primary"
            onClick={() => onUpdateStatus(order.id, next, eta ? { estimated_minutes: parseInt(eta) } : undefined)}
          >
            {nextLabels[next] || next}
          </button>
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <button className="btn-cancel-order" onClick={() => setShowCancel(true)}>
              Cancel
            </button>
          )}
        </div>
      )}

      {showCancel && (
        <div className="cancel-form">
          <input
            type="text"
            placeholder="Reason (optional)"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
          />
          <div className="order-actions">
            <button
              className="btn-danger"
              onClick={() => {
                onUpdateStatus(order.id, 'cancelled', { cancellation_reason: cancelReason || undefined });
                setShowCancel(false);
              }}
            >
              Confirm Cancel
            </button>
            <button className="btn-secondary" onClick={() => setShowCancel(false)}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
