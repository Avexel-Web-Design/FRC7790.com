import { Hono } from 'hono';
import { sign } from 'hono/jwt';

interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
}

// Simple password verification using Web Crypto API
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHash === hashedPassword;
}

const login = new Hono<{ Bindings: CloudflareEnv }>();

login.post('/', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?')
      .bind(username)
      .first() as { id: number; username: string; password: string; is_admin: number; avatar: string } | null;

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const validPassword = await verifyPassword(password, user.password as string);

    if (!validPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = await sign(
      { 
        id: user.id, 
        username: user.username,
        isAdmin: user.is_admin,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }, 
      c.env.JWT_SECRET
    );

    return c.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: !!user.is_admin
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default login;
