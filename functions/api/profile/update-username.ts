import { D1Database } from '@cloudflare/workers-types';
import { verifyAuth } from '../../middleware/auth';

interface Env {
  DB: D1Database;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authResult = await verifyAuth(request, env.DB);
  if (authResult.status !== 200) {
    return authResult;
  }
  const userId = authResult.userId;

  try {
    const { newUsername } = await request.json();

    if (!newUsername || typeof newUsername !== 'string' || newUsername.trim() === '') {
      return new Response(JSON.stringify({ error: 'New username is required and must be a non-empty string.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if username already exists
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(newUsername).first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username already taken.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { success } = await env.DB.prepare('UPDATE users SET username = ? WHERE id = ?')
      .bind(newUsername, userId)
      .run();

    if (success) {
      return new Response(JSON.stringify({ message: 'Username updated successfully.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Failed to update username.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error updating username:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
