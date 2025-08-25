import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { frcAPI } from './frcAPI';
import { notifyNewMessage } from './localNotifications';

export async function ensurePushPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'granted') return true;
  const req = await PushNotifications.requestPermissions();
  return req.receive === 'granted';
}

export async function registerPushToken(userId: number) {
  if (!Capacitor.isNativePlatform()) return;
  const granted = await ensurePushPermission();
  if (!granted) return;
  return new Promise<void>(async (resolve) => {
    const reg = await PushNotifications.addListener('registration', async (token) => {
      try {
        console.log('[Push] registration token:', token.value);
      } catch {}
      try {
        const res = await frcAPI.post('/chat/notifications/register-device', {
          user_id: userId,
          platform: 'android',
          token: token.value,
        });
        console.log('[Push] device token posted to backend:', res.ok);
        try {
          const cfg = await frcAPI.get(`/chat/notifications/push-config?user_id=${userId}`);
          console.log('[Push] push-config after register:', cfg.status, await cfg.json());
        } catch (e) {
          console.log('[Push] push-config fetch failed:', e);
        }
      } finally {
        reg.remove();
        resolve();
      }
    });
    const err = await PushNotifications.addListener('registrationError', (e) => {
      try {
        console.error('[Push] registrationError:', e);
      } catch {}
      err.remove();
      resolve();
    });
    await PushNotifications.register();
  });
}

let listenersInitialized = false;
export async function initPushListeners() {
  if (!Capacitor.isNativePlatform()) return;
  if (listenersInitialized) return;
  listenersInitialized = true;
  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    try {
      console.log('[Push] received (foreground):', notification);
    } catch {}
    const title = (notification as any).title || (notification as any).notification?.title || 'New message';
    const body = (notification as any).body || (notification as any).notification?.body || '';
    notifyNewMessage(title, body).catch(() => {});
  });
  await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    try {
      console.log('[Push] action performed:', action);
    } catch {}
    // No-op for now; could deep-link into channel using notification data
  });
}
