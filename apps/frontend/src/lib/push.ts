import { api } from '@/lib/api';

/** Can this browser receive notifications at all? (iPhone: only once NoxGuarda is installed to the home screen.) */
export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** iPhone/iPad in Safari, not installed: notifications need "Add to Home Screen" first. */
export function needsInstallForPush() {
  if (typeof window === 'undefined') return false;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const installed = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  return ios && !installed;
}

function keyToBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * Asks permission (only when the person taps the button), subscribes this device and
 * saves it on the server. Returns 'on', 'denied', 'unsupported' or 'unavailable'.
 */
export async function turnOnPush(): Promise<'on' | 'denied' | 'unsupported' | 'unavailable'> {
  if (!pushSupported()) return 'unsupported';
  const { publicKey } = await api.getPushPublicKey().catch(() => ({ publicKey: null }));
  if (!publicKey) return 'unavailable';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) });
  }
  await api.savePushSubscription(sub.toJSON());
  return 'on';
}

/** If notifications are already allowed, makes sure the server has this device (e.g. after signing in again). */
export async function refreshPushSubscription() {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return (await turnOnPush()) === 'on';
    await api.savePushSubscription(sub.toJSON());
    return true;
  } catch {
    return false;
  }
}
