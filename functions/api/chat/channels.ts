import { Context } from 'hono';
import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export async function getChannels(c: Context): Promise<Response> {
  console.log("getChannels: Received request");
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM channels ORDER BY name ASC'
    ).all();

    console.log("getChannels: Found channels", results);
    return new Response(JSON.stringify(results), {
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
    const { id, name, created_by } = await c.req.json();
    console.log("createChannel: Parsed body", { id, name, created_by });
    
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
    
    const now = new Date().toISOString();
    console.log("createChannel: Inserting channel", { id, name, created_by, now });
    
    const result = await c.env.DB.prepare(
      'INSERT INTO channels (id, name, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, name, created_by, now, now).run();

    console.log("createChannel: Insert result", result);

    if (result.success) {
      return new Response(JSON.stringify({ 
        message: 'Channel created', 
        id, 
        name 
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
    const { name } = await c.req.json();
    console.log("updateChannel: Parsed data", { channelId, name });
    
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
      'UPDATE channels SET name = ?, updated_at = ? WHERE id = ?'
    ).bind(name, now, channelId).run();

    console.log("updateChannel: Update result", result);

    if (result.success) {
      return new Response(JSON.stringify({ 
        message: 'Channel updated', 
        id: channelId, 
        name 
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