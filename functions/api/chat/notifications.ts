import { Context } from 'hono';
import { sendPushToUsers } from '../utils/push';
import type { AuthUser } from '../auth/middleware';

/** Extract the authenticated user from the Hono context (set by authMiddleware). */
function getAuthenticatedUserId(c: Context): number {
  const user = c.get('user') as AuthUser | undefined;
  if (!user?.id) {
    throw new Error('Authenticated user not found in context');
  }
  return user.id;
}

/**
 * Batch-count unread messages for a list of channel IDs in a single query.
 * Returns a map of channelId -> unread count (only non-zero entries).
 */
async function batchCountUnread(
  db: D1Database,
  channelIds: string[],
  userId: number
): Promise<Record<string, number>> {
  if (channelIds.length === 0) return {};

  // Get all read statuses in one query
  const placeholders = channelIds.map(() => '?').join(',');
  const readRows = await db.prepare(
    `SELECT channel_id, last_read_timestamp FROM user_read_status WHERE user_id = ? AND channel_id IN (${placeholders})`
  ).bind(userId, ...channelIds).all();

  const readMap = new Map<string, string>();
  for (const row of (readRows.results ?? []) as { channel_id: string; last_read_timestamp: string }[]) {
    readMap.set(row.channel_id, row.last_read_timestamp);
  }

  // Count unread messages per channel in one query using a CASE/GROUP BY approach
  // We build a UNION ALL of per-channel conditions to let D1 handle it in a single round-trip
  // For D1 (SQLite), we use a simpler approach: one query with GROUP BY
  const defaultTimestamp = '1970-01-01T00:00:00.000Z';

  // Build per-channel timestamp conditions
  // We query all messages across the channels and filter in SQL
  const unreadRows = await db.prepare(`
    SELECT m.channel_id, COUNT(*) as count
    FROM messages m
    LEFT JOIN user_read_status urs ON urs.user_id = ? AND urs.channel_id = m.channel_id
    WHERE m.channel_id IN (${placeholders})
      AND m.timestamp > COALESCE(urs.last_read_timestamp, ?)
      AND m.sender_id != ?
    GROUP BY m.channel_id
  `).bind(userId, ...channelIds, defaultTimestamp, userId).all();

  const result: Record<string, number> = {};
  for (const row of (unreadRows.results ?? []) as { channel_id: string; count: number }[]) {
    if (row.count > 0) {
      result[row.channel_id] = row.count;
    }
  }
  return result;
}

/**
 * Fetch all channel IDs accessible to a user, split by type.
 * Returns { regularIds, dmIds, groupIds } in a single logical unit.
 */
async function fetchUserChannelIds(
  db: D1Database,
  userId: number
): Promise<{ regularIds: string[]; dmIds: string[]; groupIds: string[] }> {
  const userIdStr = String(userId);

  // Run all three channel queries in parallel
  const [regularResult, dmResult, groupResult] = await Promise.all([
    db.prepare(`
      SELECT DISTINCT channels.id
      FROM channels
      LEFT JOIN channel_members ON channels.id = channel_members.channel_id AND channel_members.user_id = ?
      WHERE channels.id NOT LIKE 'dm_%' AND channels.id NOT LIKE 'group_%'
        AND (channels.is_private = 0 OR channel_members.user_id = ?)
      ORDER BY channels.position ASC
    `).bind(userId, userId).all(),

    db.prepare(`
      SELECT DISTINCT channel_id
      FROM messages
      WHERE channel_id LIKE 'dm_%'
        AND (
          channel_id LIKE 'dm_' || ? || '_%' 
          OR channel_id LIKE 'dm_%_' || ?
        )
    `).bind(userIdStr, userIdStr).all(),

    db.prepare(`
      SELECT DISTINCT channels.id
      FROM channels
      LEFT JOIN channel_members ON channels.id = channel_members.channel_id
      WHERE channels.id LIKE 'group_%' 
        AND channel_members.user_id = ?
    `).bind(userId).all(),
  ]);

  return {
    regularIds: ((regularResult.results ?? []) as { id: string }[]).map(r => r.id),
    dmIds: ((dmResult.results ?? []) as { channel_id: string }[]).map(r => r.channel_id),
    groupIds: ((groupResult.results ?? []) as { id: string }[]).map(r => r.id),
  };
}

/**
 * Fetch the set of muted channel IDs for a user.
 */
async function fetchMutedChannelIds(db: D1Database, userId: number): Promise<Set<string>> {
  const mutedRows = await db.prepare(
    'SELECT channel_id FROM user_notification_settings WHERE user_id = ? AND muted = 1'
  ).bind(userId).all();
  return new Set(
    ((mutedRows.results ?? []) as { channel_id: string }[]).map(r => r.channel_id)
  );
}

// Mark a channel as read for the authenticated user
export async function markChannelAsRead(c: Context): Promise<Response> {
  try {
    const { channelId } = c.req.param();
    const userId = getAuthenticatedUserId(c);
    
    if (!channelId) {
      return new Response('Channel ID is required', { status: 400 });
    }
    
    const timestamp = new Date().toISOString();
    
    // Update or insert the read status
    await c.env.DB.prepare(`
      INSERT INTO user_read_status (user_id, channel_id, last_read_timestamp)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, channel_id) DO UPDATE SET
        last_read_timestamp = excluded.last_read_timestamp
    `).bind(userId, channelId, timestamp).run();
    
    return new Response(JSON.stringify({ success: true, timestamp }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response('Internal server error', { status: 500 });
  }
}

// Get all notification data in a single call to reduce API requests
export async function getAllNotificationData(c: Context): Promise<Response> {
  try {
    const userId = getAuthenticatedUserId(c);
    const db: D1Database = c.env.DB;
    
    // Fetch channel IDs and muted set in parallel
    const [channelIds, mutedSet] = await Promise.all([
      fetchUserChannelIds(db, userId),
      fetchMutedChannelIds(db, userId),
    ]);

    // Combine all IDs, filtering muted ones
    const regularFiltered = channelIds.regularIds.filter(id => !mutedSet.has(id));
    const dmFiltered = channelIds.dmIds.filter(id => !mutedSet.has(id));
    const groupFiltered = channelIds.groupIds.filter(id => !mutedSet.has(id));
    const allChannelIds = [...regularFiltered, ...dmFiltered, ...groupFiltered];
    
    // Single batch query for all unread counts
    const unreadCounts = await batchCountUnread(db, allChannelIds, userId);
    
    // Categorize totals
    let channelsUnread = 0;
    let messagesUnread = 0;
    for (const [channelId, count] of Object.entries(unreadCounts)) {
      if (channelId.startsWith('dm_') || channelId.startsWith('group_')) {
        messagesUnread += count;
      } else {
        channelsUnread += count;
      }
    }
    
    return new Response(JSON.stringify({
      unreadCounts,
      totalUnread: channelsUnread + messagesUnread,
      channelsUnread,
      messagesUnread
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response('Internal server error', { status: 500 });
  }
}

// Get unread message counts for all channels/DMs for the authenticated user
export async function getUnreadCounts(c: Context): Promise<Response> {
  try {
    const userId = getAuthenticatedUserId(c);
    const db: D1Database = c.env.DB;
    
    const [channelIds, mutedSet] = await Promise.all([
      fetchUserChannelIds(db, userId),
      fetchMutedChannelIds(db, userId),
    ]);

    const allChannelIds = [
      ...channelIds.regularIds,
      ...channelIds.dmIds,
      ...channelIds.groupIds,
    ].filter(id => !mutedSet.has(id));
    
    const unreadCounts = await batchCountUnread(db, allChannelIds, userId);
    
    return new Response(JSON.stringify(unreadCounts), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response('Internal server error', { status: 500 });
  }
}

// Get total unread count across all channels/DMs for sidebar notification
export async function getTotalUnreadCount(c: Context): Promise<Response> {
  try {
    const userId = getAuthenticatedUserId(c);
    const db: D1Database = c.env.DB;
    
    const [channelIds, mutedSet] = await Promise.all([
      fetchUserChannelIds(db, userId),
      fetchMutedChannelIds(db, userId),
    ]);

    const regularFiltered = channelIds.regularIds.filter(id => !mutedSet.has(id));
    const dmFiltered = channelIds.dmIds.filter(id => !mutedSet.has(id));
    const groupFiltered = channelIds.groupIds.filter(id => !mutedSet.has(id));

    // Batch count for regular channels
    const regularCounts = await batchCountUnread(db, regularFiltered, userId);
    const channelsUnread = Object.values(regularCounts).reduce((sum, n) => sum + n, 0);

    // Batch count for DMs + groups
    const messageCounts = await batchCountUnread(db, [...dmFiltered, ...groupFiltered], userId);
    const messagesUnread = Object.values(messageCounts).reduce((sum, n) => sum + n, 0);
    
    return new Response(JSON.stringify({ 
      totalUnread: channelsUnread + messagesUnread,
      channelsUnread,
      messagesUnread
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response('Internal server error', { status: 500 });
  }
}

// Toggle mute for a channel/DM for the authenticated user
export async function toggleMute(c: Context): Promise<Response> {
  try {
    const { channelId } = c.req.param();
    const userId = getAuthenticatedUserId(c);
    const { muted } = await c.req.json();
    if (!channelId || typeof muted !== 'boolean') {
      return new Response('channelId and muted (boolean) are required', { status: 400 });
    }
    await c.env.DB.prepare(`
      INSERT INTO user_notification_settings (user_id, channel_id, muted)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, channel_id) DO UPDATE SET muted = excluded.muted
    `).bind(userId, channelId, muted ? 1 : 0).run();
    return new Response(JSON.stringify({ success: true, muted }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response('Internal server error', { status: 500 });
  }
}

// Register a device token for push notifications
export async function registerDevice(c: Context): Promise<Response> {
  try {
    const userId = getAuthenticatedUserId(c);
    const { platform, token } = await c.req.json();
    if (!platform || !token) {
      return new Response('platform and token are required', { status: 400 });
    }
    await c.env.DB.prepare(`
      INSERT INTO user_devices (user_id, platform, token)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, token) DO NOTHING
    `).bind(userId, platform, token).run();
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response('Internal server error', { status: 500 });
  }
}

// Get muted channels/DMs for the authenticated user
export async function getMutedSettings(c: Context): Promise<Response> {
  try {
    const userId = getAuthenticatedUserId(c);
    const rows = await c.env.DB.prepare(
      'SELECT channel_id FROM user_notification_settings WHERE user_id = ? AND muted = 1'
    ).bind(userId).all();
    const muted = ((rows.results ?? []) as { channel_id: string }[]).map(r => r.channel_id);
    return new Response(JSON.stringify({ muted }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response('Internal server error', { status: 500 });
  }
}

// Diagnostics: get push configuration and token counts for the authenticated user
export async function getPushConfig(c: Context): Promise<Response> {
  try {
    const userId = getAuthenticatedUserId(c);
    const hasSA = !!c.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const hasLegacy = !!(c.env.FCM_SERVER_KEY || c.env.FCM_LEGACY_SERVER_KEY);
    const mode = hasSA ? 'v1' : hasLegacy ? 'legacy' : 'none';
    const { results } = await c.env.DB.prepare('SELECT COUNT(*) as count FROM user_devices WHERE user_id = ?')
      .bind(userId).all();
    const tokenCount = Number((results?.[0] as { count: number } | undefined)?.count ?? 0);
    return new Response(JSON.stringify({ mode, hasServiceAccount: hasSA, hasLegacyKey: hasLegacy, tokenCount }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response('Internal server error', { status: 500 });
  }
}

// Send a test push notification to the authenticated user
export async function sendTestPush(c: Context): Promise<Response> {
  try {
    const userId = getAuthenticatedUserId(c);
    await sendPushToUsers(c, [userId], 'Test notification', 'This is a test push', { type: 'test' });
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response('Internal server error', { status: 500 });
  }
}
