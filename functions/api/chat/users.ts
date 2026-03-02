import { Context } from 'hono';
import type { AuthUser } from '../auth/middleware';

// Return minimal public information for all users so that any authenticated user
// can start a direct-message conversation.
export async function getUsers(c: Context): Promise<Response> {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, username, is_admin FROM users WHERE user_type = 'member' ORDER BY username COLLATE NOCASE ASC"
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users list', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Return users sorted by most recent conversation activity for a specific user
export async function getUsersByRecentActivity(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthUser | undefined;
    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }
    const userId = user.id;
    const userIdString = String(userId);
    
    // First, get all users except the current user
    const { results: allUsers } = await c.env.DB.prepare(
      "SELECT id, username, is_admin FROM users WHERE id != ? AND user_type = 'member' ORDER BY username COLLATE NOCASE ASC"
    ).bind(userId).all();
    
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
    
    // Create a map of user IDs to their last message time
    const userLastMessageMap = new Map<number, string>();
    
    for (const msg of recentMessages as { channel_id: string; last_message_time: string }[]) {
      const channelId = msg.channel_id;
      const parts = channelId.split('_');
      if (parts.length === 3) {
        const user1Id = parseInt(parts[1]);
        const user2Id = parseInt(parts[2]);
        const otherUserId = user1Id === userId ? user2Id : user1Id;
        
        // Only set if we haven't seen this user yet (since we're ordered by most recent)
        if (!userLastMessageMap.has(otherUserId)) {
          userLastMessageMap.set(otherUserId, msg.last_message_time);
        }
      }
    }

    // Add last_message_time to users and sort them
    const usersWithActivity = (allUsers as { id: number; username: string; is_admin: number }[]).map(user => ({
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

    return new Response(JSON.stringify(usersWithActivity), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users by recent activity', error);
    return new Response('Internal server error', { status: 500 });
  }
}
