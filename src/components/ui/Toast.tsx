import { useEffect, useState } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type?: 'info' | 'success' | 'error';
}

let toastId = 0;
const listeners: Array<(msg: ToastMessage) => void> = [];

export function showToast(text: string, type: ToastMessage['type'] = 'info') {
  const msg: ToastMessage = { id: ++toastId, text, type };
  listeners.forEach(fn => fn(msg));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setToasts(prev => [...prev, msg]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== msg.id)), 4500);
    };
    listeners.push(handler);
    return () => { listeners.splice(listeners.indexOf(handler), 1); };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type || 'info'}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
