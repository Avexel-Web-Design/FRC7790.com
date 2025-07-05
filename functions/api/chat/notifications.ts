import { Context } from 'hono';

// Mark a channel as read for a user
export async function markChannelAsRead(c: Context): Promise<Response> {
  try {
    const { channelId } = c.req.param();
    const { user_id } = await c.req.json();
    
    if (!user_id || !channelId) {
      return new Response('User ID and Channel ID are required', { status: 400 });
    }
    
    const timestamp = new Date().toISOString();
    
    // Update or insert the read status
    await c.env.DB.prepare(`
      INSERT INTO user_read_status (user_id, channel_id, last_read_timestamp)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, channel_id) DO UPDATE SET
        last_read_timestamp = excluded.last_read_timestamp
    `).bind(user_id, channelId, timestamp).run();
    
    return new Response(JSON.stringify({ success: true, timestamp }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error marking channel as read:', error);
    return new Response('Error marking channel as read', { status: 500 });
  }
}

// Get all notification data in a single call to reduce API requests
export async function getAllNotificationData(c: Context): Promise<Response> {
  try {
    const userIdStr = c.req.query('user_id');
    if (!userIdStr) {
      return new Response('User ID is required', { status: 400 });
    }
    
    const userId = Number(userIdStr);
    
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
    
    // Combine all channel/DM/group IDs
    const allChannelIds = [
      ...channels.map((c: any) => c.id),
      ...dmConversations.map((dm: any) => dm.channel_id),
      ...groupChats.map((g: any) => g.id)
    ];
    
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
        
        const count = (unreadResult as any)?.count || 0;
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
    return new Response('Error getting notification data', { status: 500 });
  }
}

// Get unread message counts for all channels/DMs for a user
export async function getUnreadCounts(c: Context): Promise<Response> {
  try {
    const userIdStr = c.req.query('user_id');
    if (!userIdStr) {
      return new Response('User ID is required', { status: 400 });
    }
    
    const userId = Number(userIdStr);
    
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
    
    console.log('NotificationAPI: Found DM conversations for user', userId, ':', dmConversations.map((dm: any) => dm.channel_id));
    
    // Get all group chats the user is a member of
    const { results: groupChats } = await c.env.DB.prepare(`
      SELECT DISTINCT channels.*
      FROM channels
      LEFT JOIN channel_members ON channels.id = channel_members.channel_id
      WHERE channels.id LIKE "group_%" 
        AND channel_members.user_id = ?
    `).bind(userId).all();
    
    // Combine all channel/DM/group IDs
    const allChannelIds = [
      ...channels.map((c: any) => c.id),
      ...dmConversations.map((dm: any) => dm.channel_id),
      ...groupChats.map((g: any) => g.id)
    ];
    
    const unreadCounts: Record<string, number> = {};
    
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
        
        const count = (unreadResult as any)?.count || 0;
        if (count > 0) {
          unreadCounts[channelId] = count;
          
          // Debug logging for DM channels
          if (channelId.startsWith('dm_')) {
            console.log(`NotificationAPI: DM channel ${channelId} has ${count} unread messages for user ${userId}`);
          }
        }
      } catch (error) {
        console.error(`Error counting unread for channel ${channelId}:`, error);
      }
    }
    
    console.log('NotificationAPI: Final unread counts for user', userId, ':', unreadCounts);
    
    return new Response(JSON.stringify(unreadCounts), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting unread counts:', error);
    return new Response('Error getting unread counts', { status: 500 });
  }
}

// Get total unread count across all channels/DMs for sidebar notification
export async function getTotalUnreadCount(c: Context): Promise<Response> {
  try {
    const userIdStr = c.req.query('user_id');
    if (!userIdStr) {
      return new Response('User ID is required', { status: 400 });
    }
    
    const userId = Number(userIdStr);
    
    // Get regular channels the user has access to
    const { results: regularChannels } = await c.env.DB.prepare(`
      SELECT DISTINCT channels.id as channel_id
      FROM channels
      LEFT JOIN channel_members ON channels.id = channel_members.channel_id AND channel_members.user_id = ?
      WHERE channels.id NOT LIKE "dm_%" AND channels.id NOT LIKE "group_%" 
        AND (channels.is_private = 0 OR channel_members.user_id = ?)
    `).bind(userId, userId).all();
    
    // Get DM conversations for this user
    const { results: dmConversations } = await c.env.DB.prepare(`
      SELECT DISTINCT channel_id
      FROM messages
      WHERE channel_id LIKE 'dm_%'
        AND (
          channel_id LIKE 'dm_' || ? || '_%' 
          OR channel_id LIKE 'dm_%_' || ?
        )
    `).bind(userIdStr, userIdStr).all();
    
    // Get group chats the user is a member of  
    const { results: groupChats } = await c.env.DB.prepare(`
      SELECT DISTINCT channels.id as channel_id
      FROM channels
      LEFT JOIN channel_members ON channels.id = channel_members.channel_id
      WHERE channels.id LIKE "group_%" 
        AND channel_members.user_id = ?
    `).bind(userId).all();
    
    let channelsUnread = 0;
    let messagesUnread = 0;
    
    // Count unread in regular channels
    for (const row of regularChannels as any[]) {
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
        
        channelsUnread += (unreadResult as any)?.count || 0;
      } catch (error) {
        console.error(`Error counting unread for channel ${channelId}:`, error);
      }
    }
    
    // Count unread in DMs and group chats
    const allMessages = [...dmConversations, ...groupChats];
    for (const row of allMessages as any[]) {
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
        
        messagesUnread += (unreadResult as any)?.count || 0;
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
    return new Response('Error getting total unread count', { status: 500 });
  }
}
