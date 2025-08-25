import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

let permissionsRequested = false;

export async function ensureLocalNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const perms = await LocalNotifications.checkPermissions();
    if (perms.display === 'granted') return true;
    if (!permissionsRequested) {
      permissionsRequested = true;
      const req = await LocalNotifications.requestPermissions();
      return req.display === 'granted';
    }
    return false;
  } catch {
    return false;
  }
}

export async function notifyNewMessage(title: string, body: string) {
  try {
    const granted = await ensureLocalNotificationPermission();
    if (!granted) return;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now() % 2147483647,
          title,
          body,
        },
      ],
    });
  } catch {}
}
