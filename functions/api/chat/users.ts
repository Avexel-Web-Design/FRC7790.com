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