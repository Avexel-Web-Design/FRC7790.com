import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { frcAPI } from './frcAPI';

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
        await frcAPI.post('/chat/notifications/register-device', {
          user_id: userId,
          platform: 'android',
          token: token.value,
        });
      } finally {
        reg.remove();
        resolve();
      }
    });
    const err = await PushNotifications.addListener('registrationError', () => {
      err.remove();
      resolve();
    });
    await PushNotifications.register();
  });
}
