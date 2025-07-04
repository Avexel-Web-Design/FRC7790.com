import { Context } from 'hono';
import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

interface PositionResult {
  max_pos: number;
}

export async function getChannels(c: Context): Promise<Response> {
  console.log("getChannels: Received request");
  try {
    const userIdStr = c.req.query('user_id');
    let channels;
    if (userIdStr) {
      const userId = Number(userIdStr);
      // Check if user is admin
      const adminRow = await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?')
        .bind(userId)
        .first();
      const isAdmin = adminRow && (adminRow as { is_admin: number }).is_admin === 1;

      if (isAdmin) {
        // Filter out DM channels and group chats
        const { results } = await c.env.DB.prepare('SELECT * FROM channels WHERE id NOT LIKE "dm_%" AND id NOT LIKE "group_%" ORDER BY position ASC').all();
        channels = results;
      } else {
        // Filter out DM channels and group chats for non-admin users too
        const { results } = await c.env.DB.prepare(
          `SELECT DISTINCT channels.*
           FROM channels
           LEFT JOIN channel_members ON channels.id = channel_members.channel_id AND channel_members.user_id = ?
           WHERE channels.id NOT LIKE "dm_%" AND channels.id NOT LIKE "group_%" AND (channels.is_private = 0 OR channel_members.user_id = ?)
           ORDER BY channels.position ASC`
        ).bind(userId, userId).all();
        channels = results;
      }
    } else {
      // No user specified – return only public channels, excluding DMs and group chats
      const { results } = await c.env.DB.prepare('SELECT * FROM channels WHERE is_private = 0 AND id NOT LIKE "dm_%" AND id NOT LIKE "group_%" ORDER BY position ASC').all();
      channels = results;
    }

    console.log("getChannels: Found channels", channels);
    return new Response(JSON.stringify(channels), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return new Response('Error fetching channels: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

export async function createChannel(c: Context): Promise<Response> {
  console.log("createChannel: Received request");
  try {
    const { id, name, created_by, is_private = false, members = [] } = await c.req.json();
    console.log("createChannel: Parsed body", { id, name, created_by, is_private, members });
    
    // Temporarily disable admin check for debugging
    /*
    // Verify user is admin before allowing channel creation
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.substring(7);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.isAdmin) {
        return new Response('Admin privileges required', { status: 403 });
      }
    } catch (error) {
      return new Response('Invalid token', { status: 401 });
    }
    */
    
    if (!id || !name) {
      return new Response('Channel ID and name are required', { status: 400 });
    }

    // Check if channel ID already exists
    const existingChannel = await c.env.DB.prepare(
      'SELECT id FROM channels WHERE id = ?'
    ).bind(id).first();
    
    if (existingChannel) {
      return new Response('Channel ID already exists', { status: 409 });
    }
    
    // Get highest position to place new channel at the end
    const positionResult = await c.env.DB.prepare(
      'SELECT COALESCE(MAX(position), 0) as max_pos FROM channels'
    ).first();
    
    const position = positionResult ? (positionResult as PositionResult).max_pos + 1 : 1;
    const now = new Date().toISOString();
    console.log("createChannel: Inserting channel", { id, name, created_by, now, position });
    
    // Ensure the creator is in the members list for a private channel
    let memberIds: number[] = Array.isArray(members) ? [...members] : [];
    if (is_private && created_by && !memberIds.includes(Number(created_by))) {
      memberIds.push(Number(created_by));
    }
    
    const result = await c.env.DB.prepare(
      'INSERT INTO channels (id, name, created_by, created_at, updated_at, position, is_private) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, name, created_by, now, now, position, is_private ? 1 : 0).run();

    console.log("createChannel: Insert result", result);

    if (result.success) {
      // If the channel is private and members are specified, add them to channel_members table
      if (is_private) {
        for (const memberId of memberIds) {
          try {
            await c.env.DB.prepare(
              'INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)'
            ).bind(id, memberId).run();
          } catch (memberErr) {
            console.error('Error adding channel member:', memberErr);
            // Continue inserting other members even if one fails
          }
        }
      }

      return new Response(JSON.stringify({ 
        message: 'Channel created', 
        id, 
        name,
        position,
        is_private
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Failed to create channel', { status: 500 });
    }
  } catch (error) {
    console.error('Error creating channel:', error);
    return new Response('Error creating channel: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

export async function updateChannel(c: Context): Promise<Response> {
  console.log("updateChannel: Received request");
  try {
    const { channelId } = c.req.param();
    const { name, is_private, members = [] } = await c.req.json();
    console.log("updateChannel: Parsed data", { channelId, name, is_private, members });
    
    // Temporarily disable admin check for debugging
    /*
    // Verify user is admin
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.substring(7);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.isAdmin) {
        return new Response('Admin privileges required', { status: 403 });
      }
    } catch (error) {
      return new Response('Invalid token', { status: 401 });
    }
    */
    
    if (!name) {
      return new Response('Channel name is required', { status: 400 });
    }

    const now = new Date().toISOString();
    console.log("updateChannel: Updating channel", { channelId, name, now });
    
    const result = await c.env.DB.prepare(
      'UPDATE channels SET name = ?, is_private = ?, updated_at = ? WHERE id = ?'
    ).bind(name, is_private ? 1 : 0, now, channelId).run();

    console.log("updateChannel: Update result", result);

    if (result.success) {
      // Update membership
      if (is_private !== undefined) {
        // Clear existing members
        await c.env.DB.prepare('DELETE FROM channel_members WHERE channel_id = ?').bind(channelId).run();
        if (is_private && Array.isArray(members)) {
          for (const memberId of members) {
            try {
              await c.env.DB.prepare('INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)').bind(channelId, memberId).run();
            } catch (memberErr) {
              console.error('Error updating channel member:', memberErr);
            }
          }
        }
      }

      return new Response(JSON.stringify({ 
        message: 'Channel updated', 
        id: channelId, 
        name,
        is_private
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Channel not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error updating channel:', error);
    return new Response('Error updating channel: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

export async function deleteChannel(c: Context): Promise<Response> {
  console.log("deleteChannel: Received request");
  try {
    const { channelId } = c.req.param();
    console.log("deleteChannel: Channel ID", channelId);
    
    // Temporarily disable admin check for debugging
    /*
    // Verify user is admin
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.substring(7);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.isAdmin) {
        return new Response('Admin privileges required', { status: 403 });
      }
    } catch (error) {
      return new Response('Invalid token', { status: 401 });
    }
    */
    
    // Don't allow deletion of the general channel
    if (channelId === 'general') {
      return new Response('Cannot delete the general channel', { status: 403 });
    }

    // Delete channel members (if any)
    console.log("deleteChannel: Deleting channel members for channel", channelId);
    await c.env.DB.prepare('DELETE FROM channel_members WHERE channel_id = ?').bind(channelId).run();

    // Delete all messages in the channel first
    console.log("deleteChannel: Deleting messages for channel", channelId);
    await c.env.DB.prepare(
      'DELETE FROM messages WHERE channel_id = ?'
    ).bind(channelId).run();
    
    // Then delete the channel
    console.log("deleteChannel: Deleting channel", channelId);
    const result = await c.env.DB.prepare(
      'DELETE FROM channels WHERE id = ?'
    ).bind(channelId).run();

    console.log("deleteChannel: Delete result", result);

    if (result.success) {
      return new Response(JSON.stringify({ 
        message: 'Channel deleted' 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Channel not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting channel:', error);
    return new Response('Error deleting channel: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

export async function reorderChannels(c: Context): Promise<Response> {
  console.log("reorderChannels: Received request");
  try {
    const { channels } = await c.req.json() as { channels: { id: string, position: number }[] };
    console.log("reorderChannels: Parsed channels", channels);
    
    // Temporarily disable admin check for debugging
    /*
    // Verify user is admin
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.substring(7);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.isAdmin) {
        return new Response('Admin privileges required', { status: 403 });
      }
    } catch (error) {
      return new Response('Invalid token', { status: 401 });
    }
    */
    
    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return new Response('Channels array is required', { status: 400 });
    }

    // Begin a transaction to update all positions
    const db = c.env.DB;
    
    // Update each channel's position
    for (const channel of channels) {
      console.log("reorderChannels: Updating channel position", channel);
      await db.prepare(
        'UPDATE channels SET position = ? WHERE id = ?'
      ).bind(channel.position, channel.id).run();
    }
    
    // Fetch updated channels
    const { results } = await db.prepare(
      'SELECT * FROM channels ORDER BY position ASC'
    ).all();

    return new Response(JSON.stringify({
      message: 'Channels reordered',
      channels: results
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error reordering channels:', error);
    return new Response('Error reordering channels: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
} 

// Group Chat Management Functions
export async function getGroupChats(c: Context): Promise<Response> {
  console.log("getGroupChats: Received request");
  try {
    const userIdStr = c.req.query('user_id');
    if (!userIdStr) {
      return new Response('User ID is required', { status: 400 });
    }
    
    const userId = Number(userIdStr);
    
    // Get all group chats where the user is a member, with last message timestamp
    const { results } = await c.env.DB.prepare(
      `SELECT DISTINCT 
         channels.*,
         COALESCE(MAX(messages.timestamp), channels.created_at) as last_activity
       FROM channels 
       JOIN channel_members ON channels.id = channel_members.channel_id 
       LEFT JOIN messages ON channels.id = messages.channel_id
       WHERE channels.id LIKE 'group_%' AND channel_members.user_id = ?
       GROUP BY channels.id, channels.name, channels.created_by, channels.created_at, channels.updated_at, channels.position, channels.is_private
       ORDER BY last_activity DESC`
    ).bind(userId).all();

    console.log("getGroupChats: Found group chats", results);
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching group chats:', error);
    return new Response('Error fetching group chats: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

export async function createGroupChat(c: Context): Promise<Response> {
  console.log("createGroupChat: Received request");
  try {
    const { name, created_by, members = [] } = await c.req.json();
    console.log("createGroupChat: Parsed body", { name, created_by, members });
    
    if (!name || !created_by) {
      return new Response('Group name and creator ID are required', { status: 400 });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return new Response('At least one member is required', { status: 400 });
    }

    // Generate a unique group ID
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    
    // Ensure the creator is in the members list
    let memberIds: number[] = [...members];
    if (!memberIds.includes(Number(created_by))) {
      memberIds.push(Number(created_by));
    }
    
    console.log("createGroupChat: Creating group", { groupId, name, created_by, now, memberIds });
    
    // Create the group chat as a private channel
    const result = await c.env.DB.prepare(
      'INSERT INTO channels (id, name, created_by, created_at, updated_at, position, is_private) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(groupId, name, created_by, now, now, 0, 1).run();

    console.log("createGroupChat: Insert result", result);

    if (result.success) {
      // Add all members to the group
      for (const memberId of memberIds) {
        try {
          await c.env.DB.prepare(
            'INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)'
          ).bind(groupId, memberId).run();
        } catch (memberErr) {
          console.error('Error adding group member:', memberErr);
          // Continue adding other members even if one fails
        }
      }

      return new Response(JSON.stringify({ 
        message: 'Group chat created', 
        id: groupId,
        name,
        members: memberIds
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Failed to create group chat', { status: 500 });
    }
  } catch (error) {
    console.error('Error creating group chat:', error);
    return new Response('Error creating group chat: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

export async function updateGroupChat(c: Context): Promise<Response> {
  console.log("updateGroupChat: Received request");
  try {
    const { groupId } = c.req.param();
    const { name, members = [] } = await c.req.json();
    console.log("updateGroupChat: Parsed data", { groupId, name, members });
    
    if (!name) {
      return new Response('Group name is required', { status: 400 });
    }

    // Verify this is actually a group chat
    if (!groupId.startsWith('group_')) {
      return new Response('Invalid group ID', { status: 400 });
    }

    const now = new Date().toISOString();
    console.log("updateGroupChat: Updating group", { groupId, name, now });
    
    const result = await c.env.DB.prepare(
      'UPDATE channels SET name = ?, updated_at = ? WHERE id = ?'
    ).bind(name, now, groupId).run();

    console.log("updateGroupChat: Update result", result);

    if (result.success) {
      // Update membership
      if (Array.isArray(members) && members.length > 0) {
        // Clear existing members
        await c.env.DB.prepare('DELETE FROM channel_members WHERE channel_id = ?').bind(groupId).run();
        
        // Add new members
        for (const memberId of members) {
          try {
            await c.env.DB.prepare('INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)').bind(groupId, memberId).run();
          } catch (memberErr) {
            console.error('Error updating group member:', memberErr);
          }
        }
      }

      return new Response(JSON.stringify({ 
        message: 'Group chat updated', 
        id: groupId, 
        name,
        members
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Group chat not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error updating group chat:', error);
    return new Response('Error updating group chat: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

export async function getChannelMembers(c: Context): Promise<Response> {
  console.log("getChannelMembers: Received request");
  try {
    const { channelId } = c.req.param();
    console.log("getChannelMembers: Channel ID", channelId);
    
    // Get all members of the channel along with user details
    const { results } = await c.env.DB.prepare(
      `SELECT channel_members.user_id, users.username 
       FROM channel_members 
       JOIN users ON channel_members.user_id = users.id 
       WHERE channel_members.channel_id = ?`
    ).bind(channelId).all();

    console.log("getChannelMembers: Found members", results);
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching channel members:', error);
    return new Response('Error fetching channel members: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}

export async function deleteGroupChat(c: Context): Promise<Response> {
  console.log("deleteGroupChat: Received request");
  try {
    const { groupId } = c.req.param();
    console.log("deleteGroupChat: Group ID", groupId);
    
    // Verify this is actually a group chat
    if (!groupId.startsWith('group_')) {
      return new Response('Invalid group ID', { status: 400 });
    }

    // Delete group members
    console.log("deleteGroupChat: Deleting group members for group", groupId);
    await c.env.DB.prepare('DELETE FROM channel_members WHERE channel_id = ?').bind(groupId).run();

    // Delete all messages in the group
    console.log("deleteGroupChat: Deleting messages for group", groupId);
    await c.env.DB.prepare(
      'DELETE FROM messages WHERE channel_id = ?'
    ).bind(groupId).run();
    
    // Delete the group chat
    console.log("deleteGroupChat: Deleting group", groupId);
    const result = await c.env.DB.prepare(
      'DELETE FROM channels WHERE id = ?'
    ).bind(groupId).run();

    console.log("deleteGroupChat: Delete result", result);

    if (result.success) {
      return new Response(JSON.stringify({ 
        message: 'Group chat deleted' 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Group chat not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting group chat:', error);
    return new Response('Error deleting group chat: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}