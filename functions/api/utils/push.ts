import { Context } from 'hono';

type PushData = Record<string, string | number | boolean | null | undefined>;

async function getUserDeviceTokens(c: Context, userIds: number[]): Promise<string[]> {
  if (!userIds.length) return [];
  const placeholders = userIds.map(() => '?').join(',');
  const { results } = await c.env.DB.prepare(
    `SELECT token FROM user_devices WHERE user_id IN (${placeholders})`
  ).bind(...userIds).all();
  return ((results as any[]) || []).map(r => (r as any).token).filter(Boolean);
}

async function filterMutedUsers(c: Context, channelId: string, userIds: number[]): Promise<number[]> {
  if (!userIds.length) return [];
  const placeholders = userIds.map(() => '?').join(',');
  const { results } = await c.env.DB.prepare(
    `SELECT user_id FROM user_notification_settings WHERE channel_id = ? AND muted = 1 AND user_id IN (${placeholders})`
  ).bind(channelId, ...userIds).all();
  const mutedSet = new Set(((results as any[]) || []).map(r => Number((r as any).user_id)));
  return userIds.filter(id => !mutedSet.has(id));
}

// --- FCM HTTP v1 helpers (Service Account based) ---
function base64url(input: ArrayBuffer | string): string {
  let bytes: Uint8Array;
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = new Uint8Array(input);
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\r?\n/g, '');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

async function getAccessToken(c: Context): Promise<{ token: string; projectId: string } | null> {
  try {
    const saJson = c.env.GOOGLE_SERVICE_ACCOUNT_JSON as string | undefined;
    if (!saJson) return null;
    const sa = JSON.parse(saJson);
    const projectId: string = sa.project_id;
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat,
      exp,
    };
    const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
    const keyData = pemToArrayBuffer(sa.private_key);
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
    const jwt = `${unsigned}.${base64url(signature)}`;
    const body = new URLSearchParams();
    body.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    body.set('assertion', jwt);
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!resp.ok) {
      console.error('Push: token exchange failed', resp.status, await resp.text());
      return null;
    }
  const json = await resp.json() as { access_token: string };
  return { token: json.access_token, projectId };
  } catch (e) {
    console.error('Push: getAccessToken failed', e);
    return null;
  }
}

async function sendV1ToToken(c: Context, projectId: string, accessToken: string, token: string, title: string, body: string, data?: PushData) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const payload = {
    message: {
      token,
      notification: { title, body },
      data: data || {},
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error('Push: FCM v1 error', res.status, await res.text());
  }
}

export async function sendPushToUsers(c: Context, userIds: number[], title: string, body: string, data?: PushData) {
  try {
    const tokens = await getUserDeviceTokens(c, userIds);
    if (!tokens.length) return;

    // Prefer HTTP v1 with service account
    const access = await getAccessToken(c);
    if (access) {
      for (const t of tokens) {
        await sendV1ToToken(c, access.projectId, access.token, t, title, body, data);
      }
      return;
    }

    // Fallback: legacy (only if explicitly provided)
    const serverKey = c.env.FCM_SERVER_KEY || c.env.FCM_LEGACY_SERVER_KEY;
    if (!serverKey) {
      console.warn('Push: No FCM credentials configured');
      return;
    }
    const payload: any = {
      registration_ids: tokens,
      notification: { title, body },
      data: data || {},
      priority: 'high',
    };
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${serverKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('Push: FCM legacy error', res.status, txt);
    }
  } catch (e) {
    console.error('Push: sendPushToUsers failed', e);
  }
}

export async function sendChannelMessagePush(c: Context, channelId: string, senderId: number, title: string, body: string) {
  try {
    let recipients: number[] = [];
    if (channelId.startsWith('dm_')) {
      const parts = channelId.split('_');
      if (parts.length === 3) {
        const u1 = Number(parts[1]);
        const u2 = Number(parts[2]);
        recipients = [u1, u2].filter(id => id !== senderId);
      }
    } else {
      // Try members first
      const memberRows = await c.env.DB.prepare(
        'SELECT user_id FROM channel_members WHERE channel_id = ?'
      ).bind(channelId).all();
      const members = ((memberRows.results as any[]) || []).map(r => Number((r as any).user_id));
      if (members.length) {
        recipients = members.filter(id => id !== senderId);
      } else {
        // Public channel: send to all users except sender
        const userRows = await c.env.DB.prepare('SELECT id FROM users').all();
        const all = ((userRows.results as any[]) || []).map(r => Number((r as any).id));
        recipients = all.filter(id => id !== senderId);
      }
    }
    // Exclude muted
    const unmuted = await filterMutedUsers(c, channelId, recipients);
    if (!unmuted.length) return;
    await sendPushToUsers(c, unmuted, title, body, { channelId });
  } catch (e) {
    console.error('Push: sendChannelMessagePush failed', e);
  }
}
