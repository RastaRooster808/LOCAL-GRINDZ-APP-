import { OrderStatus, STATUS_ICONS, STATUS_LABELS } from '../../lib/types';

const ACTIVE_FLOW: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'completed'];

interface Props {
  status: OrderStatus;
  estimatedMinutes?: number | null;
}

export function StatusStepper({ status, estimatedMinutes }: Props) {
  if (status === 'cancelled') {
    return (
      <div className="status-stepper">
        <div className="status-step status-step--cancelled">
          {STATUS_ICONS.cancelled} Order Cancelled
        </div>
      </div>
    );
  }

  const currentIdx = ACTIVE_FLOW.indexOf(status);

  return (
    <div className="status-stepper">
      {ACTIVE_FLOW.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div
            key={s}
            className={`status-step ${done ? 'status-step--done' : ''} ${active ? 'status-step--active' : ''}`}
          >
            <span className="status-step-icon">{STATUS_ICONS[s]}</span>
            <span className="status-step-label">{STATUS_LABELS[s]}</span>
            {active && s === 'accepted' && estimatedMinutes && (
              <span className="status-eta">~{estimatedMinutes} min</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
