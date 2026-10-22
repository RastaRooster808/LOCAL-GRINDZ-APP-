/**
 * The visible half of the empty-vs-broken distinction. A surface that failed to
 * load says so and offers a way forward; it never silently renders as empty.
 */
interface LoadErrorProps {
  message: string;
  onRetry?: () => void;
}

export function LoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <div className="load-error" role="alert">
      <p className="load-error-msg">{message}</p>
      <p className="load-error-hint">
        This is a problem on our end, not a sign that nothing is here.
      </p>
      {onRetry && (
        <button type="button" className="btn-outline btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
