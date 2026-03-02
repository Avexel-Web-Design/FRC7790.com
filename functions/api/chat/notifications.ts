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
  } catch (error) {
    console.error('Error marking channel as read:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Get all notification data in a single call to reduce API requests
export async function getAllNotificationData(c: Context): Promise<Response> {
  try {
    const userId = getAuthenticatedUserId(c);
    const userIdStr = String(userId);
    
    // Get all channels the user has access to
    const { results: channels } = await c.env.DB.prepare(`
      SELECT DISTINCT channels.*
      FROM channels
      LEFT JOIN channel_members ON channels.id = channel_members.channel_id AND channel_members.user_id = ?
      WHERE channels.id NOT LIKE "dm_%" AND channels.id NOT LIKE "group_%" 
        AND (channels.is_private = 0 OR channel_members.user_id = ?)
      ORDER BY channels.position ASC
    `).bind(userId, userId).all();
    
    // Get all DM conversations for this user
    const { results: dmConversations } = await c.env.DB.prepare(`
      SELECT DISTINCT channel_id
      FROM messages
      WHERE channel_id LIKE 'dm_%'
        AND (
          channel_id LIKE 'dm_' || ? || '_%' 
          OR channel_id LIKE 'dm_%_' || ?
        )
    `).bind(userIdStr, userIdStr).all();
    
    // Get all group chats the user is a member of
    const { results: groupChats } = await c.env.DB.prepare(`
      SELECT DISTINCT channels.*
      FROM channels
      LEFT JOIN channel_members ON channels.id = channel_members.channel_id
      WHERE channels.id LIKE "group_%" 
        AND channel_members.user_id = ?
    `).bind(userId).all();
    
    // Fetch muted channels for this user
    const mutedRows = await c.env.DB.prepare(
      'SELECT channel_id FROM user_notification_settings WHERE user_id = ? AND muted = 1'
    ).bind(userId).all();
    const mutedChannelIds = (mutedRows.results ?? []).map(r => (r as { channel_id: string }).channel_id);
    const mutedSet = new Set(mutedChannelIds);

    // Combine all channel/DM/group IDs and filter muted
    const allChannelIds = [
      ...channels.map((ch: { id: string }) => ch.id),
      ...dmConversations.map((dm: { channel_id: string }) => dm.channel_id),
      ...groupChats.map((g: { id: string }) => g.id)
    ].filter((id) => !mutedSet.has(id));
    
    const unreadCounts: Record<string, number> = {};
    let channelsUnread = 0;
    let messagesUnread = 0;
    
    // For each channel, count unread messages
    for (const channelId of allChannelIds) {
      try {
        // Get user's last read timestamp for this channel
        const readStatus = await c.env.DB.prepare(
          'SELECT last_read_timestamp FROM user_read_status WHERE user_id = ? AND channel_id = ?'
        ).bind(userId, channelId).first();
        
        const lastReadTimestamp = readStatus?.last_read_timestamp || '1970-01-01T00:00:00.000Z';
        
        // Count messages after the last read timestamp
        const unreadResult = await c.env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM messages
          WHERE channel_id = ? 
            AND timestamp > ?
            AND sender_id != ?
        `).bind(channelId, lastReadTimestamp, userId).first();
        
        const count = (unreadResult as { count: number } | null)?.count ?? 0;
        if (count > 0) {
          unreadCounts[channelId] = count;
          
          // Categorize by channel type for totals
          if (channelId.startsWith('dm_') || channelId.startsWith('group_')) {
            messagesUnread += count;
          } else {
            channelsUnread += count;
          }
        }
      } catch (error) {
        console.error(`Error counting unread for channel ${channelId}:`, error);
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
  } catch (error) {
    console.error('Error getting notification data:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Get unread message counts for all channels/DMs for the authenticated user
export async function getUnreadCounts(c: Context): Promise<Response> {
  try {
    const userId = getAuthenticatedUserId(c);
    const userIdStr = String(userId);
    
    // Get all channels the user has access to
    const { results: channels } = await c.env.DB.prepare(`
      SELECT DISTINCT channels.*
      FROM channels
      LEFT JOIN channel_members ON channels.id = channel_members.channel_id AND channel_members.user_id = ?
      WHERE channels.id NOT LIKE "dm_%" AND channels.id NOT LIKE "group_%" 
        AND (channels.is_private = 0 OR channel_members.user_id = ?)
      ORDER BY channels.position ASC
    `).bind(userId, userId).all();
    
    // Get all DM conversations for this user
    const { results: dmConversations } = await c.env.DB.prepare(`
      SELECT DISTINCT channel_id
      FROM messages
      WHERE channel_id LIKE 'dm_%'
        AND (
          channel_id LIKE 'dm_' || ? || '_%' 
          OR channel_id LIKE 'dm_%_' || ?
        )
    `).bind(userIdStr, userIdStr).all();
    
    // Get all group chats the user is a member of
    const { results: groupChats } = await c.env.DB.prepare(`
      SELECT DISTINCT channels.*
      FROM channels
      LEFT JOIN channel_members ON channels.id = channel_members.channel_id
      WHERE channels.id LIKE "group_%" 
        AND channel_members.user_id = ?
    `).bind(userId).all();
    
    // Fetch muted channels for this user
    const mutedRows = await c.env.DB.prepare(
      'SELECT channel_id FROM user_notification_settings WHERE user_id = ? AND muted = 1'
    ).bind(userId).all();
    const mutedChannelIds = (mutedRows.results ?? []).map(r => (r as { channel_id: string }).channel_id);
    const mutedSet = new Set(mutedChannelIds);

    // Combine all channel/DM/group IDs and filter muted
    const allChannelIds = [
      ...channels.map((ch: { id: string }) => ch.id),
      ...dmConversations.map((dm: { channel_id: string }) => dm.channel_id),
      ...groupChats.map((g: { id: string }) => g.id)
    ].filter((id) => !mutedSet.has(id));
    
    const unreadCounts: Record<string, number> = {};
    
    // For each channel, count unread messages
    for (const channelId of allChannelIds) {
      try {
        const readStatus = await c.env.DB.prepare(
          'SELECT last_read_timestamp FROM user_read_status WHERE user_id = ? AND channel_id = ?'
        ).bind(userId, channelId).first();
        
        const lastReadTimestamp = readStatus?.last_read_timestamp || '1970-01-01T00:00:00.000Z';
        
        const unreadResult = await c.env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM messages
          WHERE channel_id = ? 
            AND timestamp > ?
            AND sender_id != ?
        `).bind(channelId, lastReadTimestamp, userId).first();
        
        const count = (unreadResult as { count: number } | null)?.count ?? 0;
        if (count > 0) {
          unreadCounts[channelId] = count;
        }
      } catch (error) {
        console.error(`Error counting unread for channel ${channelId}:`, error);
      }
    }
    
    return new Response(JSON.stringify(unreadCounts), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting unread counts:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Get total unread count across all channels/DMs for sidebar notification
export async function getTotalUnreadCount(c: Context): Promise<Response> {
  try {
    const userId = getAuthenticatedUserId(c);
    const userIdStr = String(userId);
    
    // Get regular channels the user has access to (excluding muted)
    const { results: regularChannels } = await c.env.DB.prepare(`
      SELECT DISTINCT channels.id as channel_id
      FROM channels
      LEFT JOIN channel_members ON channels.id = channel_members.channel_id AND channel_members.user_id = ?
      WHERE channels.id NOT LIKE "dm_%" AND channels.id NOT LIKE "group_%" 
        AND (channels.is_private = 0 OR channel_members.user_id = ?)
        AND channels.id NOT IN (
          SELECT channel_id FROM user_notification_settings WHERE user_id = ? AND muted = 1
        )
    `).bind(userId, userId, userId).all();
    
    // Get DM conversations for this user (excluding muted)
    const { results: dmConversations } = await c.env.DB.prepare(`
      SELECT DISTINCT m.channel_id as channel_id
      FROM messages m
      WHERE m.channel_id LIKE 'dm_%'
        AND (m.channel_id LIKE 'dm_' || ? || '_%' OR m.channel_id LIKE 'dm_%_' || ?)
        AND m.channel_id NOT IN (
          SELECT channel_id FROM user_notification_settings WHERE user_id = ? AND muted = 1
        )
    `).bind(userIdStr, userIdStr, userId).all();
    
    // Get group chats the user is a member of (excluding muted)
    const { results: groupChats } = await c.env.DB.prepare(`
      SELECT DISTINCT channels.id as channel_id
      FROM channels
      LEFT JOIN channel_members ON channels.id = channel_members.channel_id
      WHERE channels.id LIKE "group_%" 
        AND channel_members.user_id = ?
        AND channels.id NOT IN (
          SELECT channel_id FROM user_notification_settings WHERE user_id = ? AND muted = 1
        )
    `).bind(userId, userId).all();
    
    let channelsUnread = 0;
    let messagesUnread = 0;
    
    // Count unread in regular channels
    for (const row of regularChannels as { channel_id: string }[]) {
      const channelId = row.channel_id;
      
      try {
        const readStatus = await c.env.DB.prepare(
          'SELECT last_read_timestamp FROM user_read_status WHERE user_id = ? AND channel_id = ?'
        ).bind(userId, channelId).first();
        
        const lastReadTimestamp = readStatus?.last_read_timestamp || '1970-01-01T00:00:00.000Z';
        
        const unreadResult = await c.env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM messages
          WHERE channel_id = ? 
            AND timestamp > ?
            AND sender_id != ?
        `).bind(channelId, lastReadTimestamp, userId).first();
        
        channelsUnread += (unreadResult as { count: number } | null)?.count ?? 0;
      } catch (error) {
        console.error(`Error counting unread for channel ${channelId}:`, error);
      }
    }
    
    // Count unread in DMs and group chats
    const allMessages = [...dmConversations, ...groupChats];
    for (const row of allMessages as { channel_id: string }[]) {
      const channelId = row.channel_id;
      
      try {
        const readStatus = await c.env.DB.prepare(
          'SELECT last_read_timestamp FROM user_read_status WHERE user_id = ? AND channel_id = ?'
        ).bind(userId, channelId).first();
        
        const lastReadTimestamp = readStatus?.last_read_timestamp || '1970-01-01T00:00:00.000Z';
        
        const unreadResult = await c.env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM messages
          WHERE channel_id = ? 
            AND timestamp > ?
            AND sender_id != ?
        `).bind(channelId, lastReadTimestamp, userId).first();
        
        messagesUnread += (unreadResult as { count: number } | null)?.count ?? 0;
      } catch (error) {
        console.error(`Error counting unread for conversation ${channelId}:`, error);
      }
    }
    
    return new Response(JSON.stringify({ 
      totalUnread: channelsUnread + messagesUnread,
      channelsUnread,
      messagesUnread
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting total unread count:', error);
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
  } catch (error) {
    console.error('Error toggling mute:', error);
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
  } catch (error) {
    console.error('Error registering device:', error);
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
    const muted = (rows.results ?? []).map(r => (r as { channel_id: string }).channel_id);
    return new Response(JSON.stringify({ muted }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error getting muted settings:', error);
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
  } catch (e) {
    console.error('Error getting push config:', e);
    return new Response('Internal server error', { status: 500 });
  }
}

// Send a test push notification to the authenticated user
export async function sendTestPush(c: Context): Promise<Response> {
  try {
    const userId = getAuthenticatedUserId(c);
    await sendPushToUsers(c, [userId], 'Test notification', 'This is a test push', { type: 'test' });
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Error sending test push:', e);
    return new Response('Internal server error', { status: 500 });
  }
}
