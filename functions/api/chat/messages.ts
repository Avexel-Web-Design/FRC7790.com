import { HonoContext } from 'hono';
import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export async function getMessages(c: HonoContext<any, any, Env>): Promise<Response> {
  const { channelId } = c.req.param();
  if (!channelId) {
    return new Response('Channel ID is required', { status: 400 });
  }

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT messages.*, users.username as sender_username FROM messages JOIN users ON messages.sender_id = users.id WHERE channel_id = ? ORDER BY timestamp ASC'
    )
      .bind(channelId)
      .all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new Response('Error fetching messages', { status: 500 });
  }
}

export async function sendMessage(c: HonoContext<any, any, Env>): Promise<Response> {
  const { channelId } = c.req.param();
  if (!channelId) {
    return new Response('Channel ID is required', { status: 400 });
  }

  const { content, sender_id } = await c.req.json();
  if (!content || !sender_id) {
    return new Response('Content and sender_id are required', { status: 400 });
  }

  try {
    const timestamp = new Date().toISOString();
    const { success } = await c.env.DB.prepare(
      'INSERT INTO messages (channel_id, sender_id, content, timestamp) VALUES (?, ?, ?, ?)'
    )
      .bind(channelId, sender_id, content, timestamp)
      .run();

    if (success) {
      return new Response(JSON.stringify({ message: 'Message sent', id: success.lastRowId }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Failed to send message', { status: 500 });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return new Response('Error sending message', { status: 500 });
  }
}