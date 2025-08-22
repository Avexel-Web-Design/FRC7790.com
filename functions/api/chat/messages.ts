import { Context } from 'hono';
import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export async function getMessages(c: Context): Promise<Response> {
  console.log("getMessages: Received request");
  const { channelId } = c.req.param();
  console.log("getMessages: Channel ID", channelId);
  
  const userIdStr = c.req.query('user_id');
  const userId = userIdStr ? Number(userIdStr) : undefined;
  
  if (!channelId) {
    return new Response('Channel ID is required', { status: 400 });
  }

  try {
    // Check channel privacy
    const channelRow = await c.env.DB.prepare('SELECT is_private FROM channels WHERE id = ?').bind(channelId).first();
    if (!channelRow) {
      return new Response('Channel not found', { status: 404 });
    }

    const isPrivate = (channelRow as { is_private: number }).is_private === 1;
    if (isPrivate) {
      if (!userId) {
        return new Response('Unauthorized', { status: 401 });
      }

      // Check if user is member or admin
      const adminRow = await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?').bind(userId).first();
      const isAdmin = adminRow && (adminRow as { is_admin: number }).is_admin === 1;

      if (!isAdmin) {
        const memberRow = await c.env.DB.prepare('SELECT 1 FROM channel_members WHERE channel_id = ? AND user_id = ?').bind(channelId, userId).first();
        if (!memberRow) {
          return new Response('Forbidden', { status: 403 });
        }
      }
    }

    console.log("getMessages: Fetching messages for channel", channelId);
    const { results } = await c.env.DB.prepare(
      'SELECT messages.*, users.username as sender_username, users.avatar FROM messages JOIN users ON messages.sender_id = users.id WHERE channel_id = ? ORDER BY timestamp ASC'
    )
      .bind(channelId)
      .all();

    console.log(`getMessages: Found ${results.length} messages`);
    
    // Fetch read status for this channel to compute readers per message
    let channelReadStatuses: Array<{ user_id: number; last_read_timestamp: string; username: string }> = [];
    try {
      const readRes = await c.env.DB.prepare(
        'SELECT urs.user_id, urs.last_read_timestamp, u.username FROM user_read_status urs JOIN users u ON u.id = urs.user_id WHERE urs.channel_id = ?'
      ).bind(channelId).all();
      channelReadStatuses = (readRes.results as any[])?.map(r => ({
        user_id: Number((r as any).user_id),
        last_read_timestamp: (r as any).last_read_timestamp,
        username: (r as any).username,
      })) || [];
    } catch (e) {
      console.warn('getMessages: Failed to fetch channel read statuses:', e);
    }

  // Compute lightweight read receipts for channel chats (based on other users' last_read_timestamp)
  // We only annotate messages sent by the requesting user (if provided)
  if (userId && results.length > 0) {
      try {
        // Get the most recent read timestamp by any other user in this channel
        const otherReadRow = await c.env.DB.prepare(
          'SELECT MAX(last_read_timestamp) as max_ts FROM user_read_status WHERE channel_id = ? AND user_id != ?'
        ).bind(channelId, userId).first();
        const otherMaxRead: string | null = (otherReadRow as any)?.max_ts || null;

        if (otherMaxRead) {
          const otherReadTime = new Date(otherMaxRead).getTime();
          for (const r of results as any[]) {
            if (r.sender_id === userId) {
              const msgTime = new Date(r.timestamp).getTime();
              // Consider read if any other user's last_read >= message timestamp
              (r as any).read_by_any = otherReadTime >= msgTime ? 1 : 0;
            }
          }
        } else {
          for (const r of results as any[]) {
            if (r.sender_id === userId) {
              (r as any).read_by_any = 0;
            }
          }
        }
      } catch (e) {
        console.warn('getMessages: Failed to compute read receipts:', e);
      }
    }
    
    // Attach readers per message (all users whose last_read_timestamp >= message.timestamp and not the sender)
    try {
      if (Array.isArray(results) && channelReadStatuses.length > 0) {
        for (const r of results as any[]) {
          const msgTime = new Date(r.timestamp).getTime();
          const readers = channelReadStatuses.filter(s => s.user_id !== Number(r.sender_id) && new Date(s.last_read_timestamp).getTime() >= msgTime)
            .map(s => ({ user_id: s.user_id, username: s.username, read_at: s.last_read_timestamp }));
          (r as any).readers = readers;
        }
      }
    } catch (e) {
      console.warn('getMessages: Failed to attach readers:', e);
    }
    
    // If user is provided and there are messages, mark channel as read
    if (userId && results.length > 0) {
      try {
        const timestamp = new Date().toISOString();
        await c.env.DB.prepare(`
          INSERT INTO user_read_status (user_id, channel_id, last_read_timestamp)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, channel_id) DO UPDATE SET
            last_read_timestamp = excluded.last_read_timestamp
        `).bind(userId, channelId, timestamp).run();
        console.log("getMessages: Marked channel as read for user");
      } catch (error) {
        console.error("getMessages: Error marking channel as read:", error);
        // Don't fail the get messages if read status update fails
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new Response('Error fetching messages: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

export async function sendMessage(c: Context): Promise<Response> {
  console.log("sendMessage: Received request");
  const { channelId } = c.req.param();
  console.log("sendMessage: Channel ID", channelId);
  
  const userIdStr = c.req.query('user_id');
  const userIdFromQuery = userIdStr ? Number(userIdStr) : undefined;

  if (!channelId) {
    return new Response('Channel ID is required', { status: 400 });
  }

  try {
    const { content, sender_id } = await c.req.json();
    console.log("sendMessage: Parsed body", { content, sender_id });
    
    if (!content || !sender_id) {
      return new Response('Content and sender_id are required', { status: 400 });
    }

    const effectiveUserId = userIdFromQuery || Number(sender_id);
    if (!effectiveUserId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check channel privacy
    const chanRow = await c.env.DB.prepare('SELECT is_private FROM channels WHERE id = ?').bind(channelId).first();
    if (!chanRow) {
      return new Response('Channel not found', { status: 404 });
    }

    const isPrivateChan = (chanRow as { is_private: number }).is_private === 1;
    if (isPrivateChan) {
      // Allow if admin or member
      const admRow = await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?').bind(effectiveUserId).first();
      const isAdmin = admRow && (admRow as { is_admin: number }).is_admin === 1;
      if (!isAdmin) {
        const membRow = await c.env.DB.prepare('SELECT 1 FROM channel_members WHERE channel_id = ? AND user_id = ?').bind(channelId, effectiveUserId).first();
        if (!membRow) {
          return new Response('Forbidden', { status: 403 });
        }
      }
    }

    const timestamp = new Date().toISOString();
    console.log("sendMessage: Inserting message", { channelId, sender_id, timestamp });
    
    const result = await c.env.DB.prepare(
      'INSERT INTO messages (channel_id, sender_id, content, timestamp) VALUES (?, ?, ?, ?)'
    )
      .bind(channelId, sender_id, content, timestamp)
      .run();

    console.log("sendMessage: Insert result", result);
    if (result.success) {
      // Automatically mark this channel as read for the sender
      try {
        await c.env.DB.prepare(`
          INSERT INTO user_read_status (user_id, channel_id, last_read_timestamp)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, channel_id) DO UPDATE SET
            last_read_timestamp = excluded.last_read_timestamp
        `).bind(sender_id, channelId, timestamp).run();
        console.log("sendMessage: Marked channel as read for sender");
      } catch (error) {
        console.error("sendMessage: Error marking channel as read:", error);
        // Don't fail the message send if read status update fails
      }

      return new Response(JSON.stringify({ message: 'Message sent' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Failed to send message', { status: 500 });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return new Response('Error sending message: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

export async function deleteMessage(c: Context): Promise<Response> {
  console.log("deleteMessage: Received request");
  const { messageId } = c.req.param();
  console.log("deleteMessage: Message ID", messageId);
  
  if (!messageId) {
    return new Response('Message ID is required', { status: 400 });
  }

  try {
    // Get user ID from request body
    const { user_id } = await c.req.json();
    console.log("deleteMessage: User ID", user_id);
    
    if (!user_id) {
      return new Response('User ID is required', { status: 400 });
    }

    // Check if message exists and get sender_id
    const message = await c.env.DB.prepare(
      'SELECT sender_id FROM messages WHERE id = ?'
    )
      .bind(messageId)
      .first();

    if (!message) {
      return new Response('Message not found', { status: 404 });
    }

    // Check if user is the sender or an admin
    const isAdmin = await c.env.DB.prepare(
      'SELECT is_admin FROM users WHERE id = ?'
    )
      .bind(user_id)
      .first();

    const isAuthorized = isAdmin && (isAdmin as { is_admin: number }).is_admin === 1 || (message as { sender_id: number }).sender_id === Number(user_id);

    if (!isAuthorized) {
      return new Response('Unauthorized: You can only delete your own messages', { status: 403 });
    }

    // Delete the message
    const result = await c.env.DB.prepare(
      'DELETE FROM messages WHERE id = ?'
    )
      .bind(messageId)
      .run();

    console.log("deleteMessage: Delete result", result);

    if (result.success) {
      return new Response(JSON.stringify({ message: 'Message deleted' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Failed to delete message', { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    return new Response('Error deleting message: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

// Direct Message specific functions
export async function getDMMessages(c: Context): Promise<Response> {
  console.log("getDMMessages: Received request");
  const { dmId } = c.req.param();
  console.log("getDMMessages: DM ID", dmId);
  
  const userIdStr = c.req.query('user_id');
  const userId = userIdStr ? Number(userIdStr) : undefined;
  
  if (!dmId || !dmId.startsWith('dm_')) {
    return new Response('Invalid DM ID', { status: 400 });
  }

  if (!userId) {
    return new Response('User ID is required', { status: 401 });
  }

  try {
    // Extract user IDs from DM ID (format: dm_<smallerId>_<largerId>)
    const dmParts = dmId.split('_');
    if (dmParts.length !== 3) {
      return new Response('Invalid DM ID format', { status: 400 });
    }

    const user1Id = parseInt(dmParts[1]);
    const user2Id = parseInt(dmParts[2]);

    // Verify the requesting user is one of the participants
    if (userId !== user1Id && userId !== user2Id) {
      return new Response('Unauthorized: You can only view your own DMs', { status: 403 });
    }

    console.log("getDMMessages: Fetching DM messages for", dmId);
    const { results } = await c.env.DB.prepare(
      'SELECT messages.*, users.username as sender_username, users.avatar FROM messages JOIN users ON messages.sender_id = users.id WHERE channel_id = ? ORDER BY timestamp ASC'
    )
      .bind(dmId)
      .all();

    console.log(`getDMMessages: Found ${results.length} messages`);
    
    // Fetch read status for this DM channel to compute readers per message
    let dmReadStatuses: Array<{ user_id: number; last_read_timestamp: string; username: string }> = [];
    try {
      const readRes = await c.env.DB.prepare(
        'SELECT urs.user_id, urs.last_read_timestamp, u.username FROM user_read_status urs JOIN users u ON u.id = urs.user_id WHERE urs.channel_id = ?'
      ).bind(dmId).all();
      dmReadStatuses = (readRes.results as any[])?.map(r => ({
        user_id: Number((r as any).user_id),
        last_read_timestamp: (r as any).last_read_timestamp,
        username: (r as any).username,
      })) || [];
    } catch (e) {
      console.warn('getDMMessages: Failed to fetch DM read statuses:', e);
    }

    // Compute lightweight read receipts for DM based on the other participant's last_read_timestamp
    try {
      const otherId = userId === user1Id ? user2Id : user1Id;
      const otherReadRow = await c.env.DB.prepare(
        'SELECT last_read_timestamp FROM user_read_status WHERE user_id = ? AND channel_id = ?'
      ).bind(otherId, dmId).first();
      const otherLastRead: string | null = (otherReadRow as any)?.last_read_timestamp || null;
      if (otherLastRead) {
        const otherReadTime = new Date(otherLastRead).getTime();
        for (const r of results as any[]) {
          if (r.sender_id === userId) {
            const msgTime = new Date(r.timestamp).getTime();
            (r as any).read_by_any = otherReadTime >= msgTime ? 1 : 0;
          }
        }
      } else {
        for (const r of results as any[]) {
          if (r.sender_id === userId) {
            (r as any).read_by_any = 0;
          }
        }
      }
    } catch (e) {
      console.warn('getDMMessages: Failed to compute read receipts:', e);
    }
    
    // Attach readers per message (users whose last_read_timestamp >= message.timestamp and not the sender)
    try {
      if (Array.isArray(results) && dmReadStatuses.length > 0) {
        for (const r of results as any[]) {
          const msgTime = new Date(r.timestamp).getTime();
          const readers = dmReadStatuses.filter(s => s.user_id !== Number(r.sender_id) && new Date(s.last_read_timestamp).getTime() >= msgTime)
            .map(s => ({ user_id: s.user_id, username: s.username, read_at: s.last_read_timestamp }));
          (r as any).readers = readers;
        }
      }
    } catch (e) {
      console.warn('getDMMessages: Failed to attach readers:', e);
    }
    
    // Mark DM channel as read for the requesting user
    if (results.length > 0) {
      try {
        const timestamp = new Date().toISOString();
        await c.env.DB.prepare(`
          INSERT INTO user_read_status (user_id, channel_id, last_read_timestamp)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, channel_id) DO UPDATE SET
            last_read_timestamp = excluded.last_read_timestamp
        `).bind(userId, dmId, timestamp).run();
        console.log("getDMMessages: Marked DM as read for user");
      } catch (error) {
        console.error("getDMMessages: Error marking DM as read:", error);
        // Don't fail the get messages if read status update fails
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching DM messages:', error);
    return new Response('Error fetching DM messages: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

export async function sendDMMessage(c: Context): Promise<Response> {
  console.log("sendDMMessage: Received request");
  const { dmId } = c.req.param();
  console.log("sendDMMessage: DM ID", dmId);
  
  const userIdStr = c.req.query('user_id');
  const userIdFromQuery = userIdStr ? Number(userIdStr) : undefined;
  
  if (!dmId || !dmId.startsWith('dm_')) {
    return new Response('Invalid DM ID', { status: 400 });
  }

  try {
    const { content, sender_id } = await c.req.json();
    console.log("sendDMMessage: Parsed body", { content, sender_id });
    
    if (!content || !sender_id) {
      return new Response('Content and sender_id are required', { status: 400 });
    }

    const effectiveUserId = userIdFromQuery || Number(sender_id);
    if (!effectiveUserId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract user IDs from DM ID (format: dm_<smallerId>_<largerId>)
    const dmParts = dmId.split('_');
    if (dmParts.length !== 3) {
      return new Response('Invalid DM ID format', { status: 400 });
    }

    const user1Id = parseInt(dmParts[1]);
    const user2Id = parseInt(dmParts[2]);

    // Verify the sender is one of the participants
    if (sender_id !== user1Id && sender_id !== user2Id) {
      return new Response('Unauthorized: You can only send messages in your own DMs', { status: 403 });
    }

    const timestamp = new Date().toISOString();
    console.log("sendDMMessage: Inserting message", { dmId, sender_id, timestamp });
    
    const result = await c.env.DB.prepare(
      'INSERT INTO messages (channel_id, sender_id, content, timestamp) VALUES (?, ?, ?, ?)'
    )
      .bind(dmId, sender_id, content, timestamp)
      .run();

    console.log("sendDMMessage: Insert result", result);

    if (result.success) {
      // Automatically mark this DM channel as read for the sender
      try {
        await c.env.DB.prepare(`
          INSERT INTO user_read_status (user_id, channel_id, last_read_timestamp)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, channel_id) DO UPDATE SET
            last_read_timestamp = excluded.last_read_timestamp
        `).bind(sender_id, dmId, timestamp).run();
        console.log("sendDMMessage: Marked DM as read for sender");
      } catch (error) {
        console.error("sendDMMessage: Error marking DM as read:", error);
        // Don't fail the message send if read status update fails
      }

      return new Response(JSON.stringify({ message: 'DM message sent' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Failed to send DM message', { status: 500 });
    }
  } catch (error) {
    console.error('Error sending DM message:', error);
    return new Response('Error sending DM message: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}