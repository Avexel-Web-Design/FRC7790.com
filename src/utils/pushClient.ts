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
  await PushNotifications.register();
  return new Promise<void>((resolve) => {
    const onReg = async (token: { value: string }) => {
      try {
        await frcAPI.post('/chat/notifications/register-device', {
          user_id: userId,
          platform: 'android',
          token: token.value,
        });
      } finally {
        PushNotifications.removeAllListeners();
        resolve();
      }
    };
    PushNotifications.addListener('registration', onReg);
    PushNotifications.addListener('registrationError', () => {
      PushNotifications.removeAllListeners();
      resolve();
    });
  });
}
