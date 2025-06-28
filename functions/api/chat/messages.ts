import { Context } from 'hono';
import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export async function getMessages(c: Context): Promise<Response> {
  console.log("getMessages: Received request");
  const { channelId } = c.req.param();
  console.log("getMessages: Channel ID", channelId);
  
  if (!channelId) {
    return new Response('Channel ID is required', { status: 400 });
  }

  try {
    console.log("getMessages: Fetching messages for channel", channelId);
    const { results } = await c.env.DB.prepare(
      'SELECT messages.*, users.username as sender_username, users.avatar FROM messages JOIN users ON messages.sender_id = users.id WHERE channel_id = ? ORDER BY timestamp ASC'
    )
      .bind(channelId)
      .all();

    console.log(`getMessages: Found ${results.length} messages`);
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
  
  if (!channelId) {
    return new Response('Channel ID is required', { status: 400 });
  }

  try {
    const { content, sender_id } = await c.req.json();
    console.log("sendMessage: Parsed body", { content, sender_id });
    
    if (!content || !sender_id) {
      return new Response('Content and sender_id are required', { status: 400 });
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