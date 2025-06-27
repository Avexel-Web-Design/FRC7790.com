import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { sign } from 'hono/jwt';

interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
}

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const register = new Hono<{ Bindings: CloudflareEnv }>();

register.post('/', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters long' }, 400);
    }

    const hashedPassword = await hashPassword(password);

    const { success, meta } = await c.env.DB.prepare(
      'INSERT INTO users (username, password, avatar) VALUES (?, ?, ?)'
    )
      .bind(username, hashedPassword, `https://api.dicebear.com/7.x/initials/svg?seed=${username}`)
      .run();

    if (success) {
      const userId = meta.last_row_id;
      const token = await sign(
        { 
          id: userId, 
          username: username,
          isAdmin: 0,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }, 
        c.env.JWT_SECRET
      );

      return c.json({ 
        token,
        user: {
          id: userId,
          username: username,
          isAdmin: false,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`
        },
        message: 'Registration successful'
      });
    }

    return c.json({ error: 'Failed to register user' }, 500);
  } catch (e) {
    if (e instanceof Error && e.message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Username already exists' }, 409);
    }
    console.error('Registration error:', e);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default register;
