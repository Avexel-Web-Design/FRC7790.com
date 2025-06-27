import { Hono } from 'hono';
import { authMiddleware } from '../auth/middleware';

interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
}

interface AuthUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

const users = new Hono<{ 
  Bindings: CloudflareEnv;
  Variables: { user: AuthUser };
}>();

users.use('*', authMiddleware);

users.get('/', async (c) => {
  const user = c.get('user');

  if (!user.isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare('SELECT id, username, is_admin FROM users').all();
    return c.json(results);
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default users;
