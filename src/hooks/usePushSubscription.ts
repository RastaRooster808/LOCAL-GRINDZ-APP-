import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type PushStatus = 'checking' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function usePushSubscription(userType: 'vendor' | 'customer', userRef: string) {
  const [status, setStatus] = useState<PushStatus>('checking');

  const check = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    setStatus(existing ? 'subscribed' : 'unsubscribed');
  }, []);

  useEffect(() => { check(); }, [check]);

  async function subscribe() {
    if (!VAPID_PUBLIC_KEY) return;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { setStatus('denied'); return; }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const json = sub.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } };
    if (!json.keys) return;

    await supabase.from('push_subscriptions').upsert(
      { user_type: userType, user_ref: userRef, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
      { onConflict: 'endpoint' },
    );
    setStatus('subscribed');
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
    setStatus('unsubscribed');
  }

  return { status, subscribe, unsubscribe };
}
