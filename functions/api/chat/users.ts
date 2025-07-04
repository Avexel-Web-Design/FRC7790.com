import { Context } from 'hono';
import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

// Return minimal public information for all users so that any authenticated user
// can start a direct-message conversation.
export async function getUsers(c: Context): Promise<Response> {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, username, is_admin FROM users ORDER BY username COLLATE NOCASE ASC'
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users list', error);
    return new Response('Error fetching users list', { status: 500 });
  }
}

// Return users sorted by most recent conversation activity for a specific user
export async function getUsersByRecentActivity(c: Context): Promise<Response> {
  try {
    const userIdStr = c.req.query('user_id');
    if (!userIdStr) {
      return new Response('User ID is required', { status: 400 });
    }
    
    const userId = Number(userIdStr);
    const userIdString = userIdStr; // Keep as string for LIKE queries
    console.log(`getUsersByRecentActivity called for user ${userId}`);
    
    // First, get all users except the current user
    const { results: allUsers } = await c.env.DB.prepare(
      'SELECT id, username, is_admin FROM users WHERE id != ? ORDER BY username COLLATE NOCASE ASC'
    ).bind(userId).all();
    
    console.log(`Found ${allUsers.length} users (excluding current user)`);

    // Then, get the most recent message timestamp for each DM conversation involving this user
    const { results: recentMessages } = await c.env.DB.prepare(`
      SELECT 
        m.channel_id,
        MAX(m.timestamp) as last_message_time
      FROM messages m
      WHERE m.channel_id LIKE 'dm_%'
        AND (
          m.channel_id LIKE 'dm_' || ? || '_%' 
          OR m.channel_id LIKE 'dm_%_' || ?
        )
      GROUP BY m.channel_id
      ORDER BY last_message_time DESC
    `).bind(userIdString, userIdString).all();
    
    console.log(`Found ${recentMessages.length} DM conversations:`, recentMessages);

    // Also check what messages exist in general for debugging
    const { results: allDMMessages } = await c.env.DB.prepare(`
      SELECT channel_id, timestamp, sender_id 
      FROM messages 
      WHERE channel_id LIKE 'dm_%' 
      ORDER BY timestamp DESC 
      LIMIT 10
    `).all();
    console.log(`Sample DM messages in database:`, allDMMessages);

    // Create a map of user IDs to their last message time
    const userLastMessageMap = new Map<number, string>();
    
    for (const msg of recentMessages as any[]) {
      const channelId = msg.channel_id as string;
      const parts = channelId.split('_');
      if (parts.length === 3) {
        const user1Id = parseInt(parts[1]);
        const user2Id = parseInt(parts[2]);
        const otherUserId = user1Id === userId ? user2Id : user1Id;
        
        // Only set if we haven't seen this user yet (since we're ordered by most recent)
        if (!userLastMessageMap.has(otherUserId)) {
          userLastMessageMap.set(otherUserId, msg.last_message_time);
          console.log(`Mapped user ${otherUserId} to timestamp ${msg.last_message_time}`);
        }
      }
    }

    // Add last_message_time to users and sort them
    const usersWithActivity = (allUsers as any[]).map(user => ({
      ...user,
      last_message_time: userLastMessageMap.get(user.id) || ''
    }));

    // Sort: users with recent messages first (by timestamp desc), then users without messages (alphabetically)
    usersWithActivity.sort((a, b) => {
      const aHasMessages = !!a.last_message_time;
      const bHasMessages = !!b.last_message_time;
      
      if (aHasMessages && bHasMessages) {
        // Both have messages, sort by timestamp (most recent first)
        return b.last_message_time.localeCompare(a.last_message_time);
      } else if (aHasMessages && !bHasMessages) {
        // A has messages, B doesn't - A comes first
        return -1;
      } else if (!aHasMessages && bHasMessages) {
        // A doesn't have messages, B does - B comes first
        return 1;
      } else {
        // Neither has messages, sort alphabetically
        return a.username.localeCompare(b.username, undefined, { sensitivity: 'base' });
      }
    });

    console.log('Final sorted result:', usersWithActivity.map(u => ({ 
      id: u.id, 
      username: u.username, 
      last_message_time: u.last_message_time 
    })));

    return new Response(JSON.stringify(usersWithActivity), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users by recent activity', error);
    return new Response('Error fetching users by recent activity', { status: 500 });
  }
} 